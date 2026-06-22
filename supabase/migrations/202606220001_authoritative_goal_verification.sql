create or replace function public.verify_daily_goal_transaction(
  p_child_id text,
  p_goal_id text,
  p_completed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Singapore')::date;
  v_daily public.daily_goals%rowtype;
  v_child public.children%rowtype;
  v_boss public.family_boss_state%rowtype;
  v_goal jsonb;
  v_goals jsonb;
  v_completed_missions jsonb;
  v_was_completed boolean;
  v_star_reward integer;
  v_boss_damage integer;
  v_source_id text;
  v_attack_source_id text;
  v_contribution_id text;
  v_egg jsonb;
  v_contributions jsonb;
  v_owned_pets jsonb;
  v_required_goals integer;
  v_progress integer;
  v_locked_pets text[];
  v_unlocked_pet text;
  v_attacks jsonb;
  v_current_hp integer;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Authenticated parent session required.' using errcode = '42501';
  end if;

  select *
  into v_daily
  from public.daily_goals
  where child_id = p_child_id
    and date = v_today
  for update;

  if not found then
    raise exception 'No daily goals found for child % on %.', p_child_id, v_today;
  end if;

  select value
  into v_goal
  from jsonb_array_elements(v_daily.goals) as goal(value)
  where value ->> 'id' = p_goal_id
  limit 1;

  if v_goal is null then
    raise exception 'Goal % is not assigned to child % today.', p_goal_id, p_child_id;
  end if;

  select *
  into v_child
  from public.children
  where child_id = p_child_id
  for update;

  if not found then
    raise exception 'Child % was not found.', p_child_id;
  end if;

  select *
  into v_boss
  from public.family_boss_state
  where id = 'active'
  for update;

  if not found then
    raise exception 'Active family boss was not found.';
  end if;

  v_was_completed := coalesce((v_goal ->> 'completed')::boolean, false);

  -- Repeating the same command is a read-only success. This makes retries safe.
  if v_was_completed = p_completed then
    return jsonb_build_object(
      'changed', false,
      'child_id', p_child_id,
      'goal_id', p_goal_id,
      'completed', p_completed
    );
  end if;

  v_star_reward := greatest(
    0,
    coalesce(
      nullif(v_goal ->> 'starReward', '')::integer,
      nullif(v_goal ->> 'reward', '')::integer,
      0
    )
  );
  v_boss_damage := greatest(
    0,
    coalesce(nullif(v_goal ->> 'bossDamage', '')::integer, 10)
  );
  v_source_id := format('mission:%s:%s', p_child_id, p_goal_id);
  v_contribution_id := format('%s:%s', v_source_id, v_today);
  v_attack_source_id := v_contribution_id;

  select jsonb_agg(
    case
      when value ->> 'id' = p_goal_id
        then jsonb_set(value, '{completed}', to_jsonb(p_completed), true)
      else value
    end
    order by ordinal
  )
  into v_goals
  from jsonb_array_elements(v_daily.goals) with ordinality as goals(value, ordinal);

  select coalesce(
    jsonb_object_agg(value ->> 'id', coalesce((value ->> 'completed')::boolean, false)),
    '{}'::jsonb
  )
  into v_completed_missions
  from jsonb_array_elements(v_goals) as goals(value);

  v_egg := v_child.secret_egg_state;
  v_owned_pets := coalesce(v_child.owned_pets, '[]'::jsonb);

  if v_egg is not null
    and coalesce((v_egg ->> 'hatched')::boolean, false) = false then
    v_contributions := coalesce(v_egg -> 'contributedGoalIds', '[]'::jsonb);
    v_required_goals := greatest(1, coalesce((v_egg ->> 'requiredGoals')::integer, 10));
    v_progress := greatest(0, coalesce((v_egg ->> 'progress')::integer, 0));

    if p_completed then
      if not v_contributions ? v_contribution_id then
        v_contributions := v_contributions || to_jsonb(v_contribution_id);
        v_progress := least(
          v_required_goals,
          greatest(v_progress + 1, jsonb_array_length(v_contributions))
        );
      end if;

      if v_progress >= v_required_goals then
        select array_agg(pet_id order by pet_id)
        into v_locked_pets
        from unnest(array['bubbo', 'luna', 'mochi', 'ember']::text[]) as pets(pet_id)
        where not v_owned_pets ? pet_id;

        if coalesce(array_length(v_locked_pets, 1), 0) > 0 then
          v_unlocked_pet := v_locked_pets[
            1 + floor(random() * array_length(v_locked_pets, 1))::integer
          ];
          v_owned_pets := v_owned_pets || to_jsonb(v_unlocked_pet);
        end if;

        v_egg := jsonb_set(v_egg, '{progress}', to_jsonb(v_required_goals), true);
        v_egg := jsonb_set(v_egg, '{contributedGoalIds}', v_contributions, true);
        v_egg := jsonb_set(v_egg, '{hatched}', 'true'::jsonb, true);
        v_egg := jsonb_set(
          v_egg,
          '{unlockedPetId}',
          coalesce(to_jsonb(v_unlocked_pet), 'null'::jsonb),
          true
        );
      else
        v_egg := jsonb_set(v_egg, '{progress}', to_jsonb(v_progress), true);
        v_egg := jsonb_set(v_egg, '{contributedGoalIds}', v_contributions, true);
      end if;
    else
      if v_contributions ? v_contribution_id then
        select coalesce(jsonb_agg(value), '[]'::jsonb)
        into v_contributions
        from jsonb_array_elements(v_contributions) as contribution(value)
        where value #>> '{}' <> v_contribution_id;
        v_progress := greatest(
          0,
          least(v_progress - 1, jsonb_array_length(v_contributions))
        );
      elsif v_contributions ? v_source_id then
        -- Compatibility with contributions written before date-qualified IDs.
        select coalesce(jsonb_agg(value), '[]'::jsonb)
        into v_contributions
        from jsonb_array_elements(v_contributions) as contribution(value)
        where value #>> '{}' <> v_source_id;
        v_progress := greatest(
          0,
          least(v_progress - 1, jsonb_array_length(v_contributions))
        );
      end if;

      v_egg := jsonb_set(v_egg, '{progress}', to_jsonb(v_progress), true);
      v_egg := jsonb_set(v_egg, '{contributedGoalIds}', v_contributions, true);
    end if;
  end if;

  v_attacks := coalesce(v_boss.attacks, '[]'::jsonb);

  if p_completed then
    if not exists (
      select 1
      from jsonb_array_elements(v_attacks) as attack(value)
      where value ->> 'sourceId' = v_attack_source_id
    ) then
      v_attacks := jsonb_build_array(
        jsonb_build_object(
          'id', format(
            'mission-%s-%s',
            floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
            substr(md5(random()::text), 1, 6)
          ),
          'childId', p_child_id,
          'childName', v_child.display_name,
          'sourceType', 'mission',
          'sourceId', v_attack_source_id,
          'title', coalesce(v_goal ->> 'title', p_goal_id),
          'damage', v_boss_damage,
          'createdAt', to_jsonb(clock_timestamp())
        )
      ) || v_attacks;
    end if;
  else
    select coalesce(jsonb_agg(value), '[]'::jsonb)
    into v_attacks
    from jsonb_array_elements(v_attacks) as attack(value)
    where value ->> 'sourceId' is distinct from v_attack_source_id
      and value ->> 'sourceId' is distinct from v_source_id;
  end if;

  select greatest(
    0,
    v_boss.max_hp - coalesce(sum((value ->> 'damage')::integer), 0)
  )
  into v_current_hp
  from jsonb_array_elements(v_attacks) as attack(value);

  update public.daily_goals
  set goals = v_goals,
      updated_at = now()
  where id = v_daily.id;

  update public.children
  set stars = greatest(
        0,
        v_child.stars + case when p_completed then v_star_reward else -v_star_reward end
      ),
      owned_pets = v_owned_pets,
      secret_egg_state = v_egg,
      completed_missions = v_completed_missions,
      mood_percent = case
        when p_completed then least(100, coalesce(v_child.mood_percent, 70) + 3)
        else coalesce(v_child.mood_percent, 70)
      end,
      mood_updated_at = case when p_completed then now() else v_child.mood_updated_at end
  where child_id = p_child_id;

  update public.family_boss_state
  set attacks = v_attacks,
      current_hp = v_current_hp,
      is_defeated = v_current_hp = 0,
      updated_at = now()
  where id = 'active';

  return jsonb_build_object(
    'changed', true,
    'child_id', p_child_id,
    'goal_id', p_goal_id,
    'completed', p_completed,
    'egg_hatched', coalesce((v_egg ->> 'hatched')::boolean, false),
    'unlocked_pet_id', v_egg ->> 'unlockedPetId'
  );
end;
$$;

revoke all on function public.verify_daily_goal_transaction(text, text, boolean) from public;
revoke all on function public.verify_daily_goal_transaction(text, text, boolean) from anon;
grant execute on function public.verify_daily_goal_transaction(text, text, boolean) to authenticated;
