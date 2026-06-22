-- Correct the installed goal RPC when daily_goals.date is a text YYYY-MM-DD key.
do $$
declare
  v_function_oid regprocedure :=
    'public.verify_daily_goal_transaction(text,text,boolean)'::regprocedure;
  v_definition text;
  v_updated_definition text;
begin
  select pg_get_functiondef(v_function_oid)
  into v_definition;

  if position('v_today text :=' in v_definition) = 0 then
    v_updated_definition := replace(
      v_definition,
      'v_today date := (now() at time zone ''Asia/Singapore'')::date;',
      'v_today text := to_char(now() at time zone ''Asia/Singapore'', ''YYYY-MM-DD'');'
    );

    if v_updated_definition = v_definition then
      raise exception 'Could not locate the expected v_today date declaration in function %.',
        v_function_oid;
    end if;

    execute v_updated_definition;
  end if;
end;
$$;

-- Return the committed care state directly and normalize legacy poop_events
-- objects before any array operation.
create or replace function public.perform_care_action_transaction(
  p_child_id text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today text := to_char(now() at time zone 'Asia/Singapore', 'YYYY-MM-DD');
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_child public.children%rowtype;
  v_care public.care_action_state%rowtype;
  v_counts jsonb := '{"feed":0,"pat":0,"clean":0}'::jsonb;
  v_timestamps jsonb := '{"feed":0,"pat":0,"clean":0}'::jsonb;
  v_poop_events jsonb := '[]'::jsonb;
  v_used integer;
  v_last_used bigint;
  v_limit integer;
  v_cooldown_ms integer;
  v_current_mood integer;
  v_next_mood integer;
  v_next_stars integer;
  v_star_reward integer := 0;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Authenticated session required.' using errcode = '42501';
  end if;

  if p_action not in ('feed', 'pat', 'clean') then
    raise exception 'Unknown care action: %.', p_action;
  end if;

  select * into v_child
  from public.children
  where child_id = p_child_id
  for update;

  if not found then
    raise exception 'Child % was not found.', p_child_id;
  end if;

  select * into v_care
  from public.care_action_state
  where child_id = p_child_id
  for update;

  if found then
    v_poop_events := coalesce(v_care.poop_events, '[]'::jsonb);
    if v_care.date = v_today then
      v_counts := coalesce(v_care.action_counts, v_counts);
      v_timestamps := coalesce(v_care.last_timestamps, v_timestamps);
    end if;
  end if;

  v_poop_events := case jsonb_typeof(v_poop_events)
    when 'array' then v_poop_events
    when 'object' then case
      when v_poop_events = '{}'::jsonb then '[]'::jsonb
      when v_poop_events ? 'id'
        and v_poop_events ? 'scheduledAt'
        and v_poop_events ? 'createdAt'
        then jsonb_build_array(v_poop_events)
      else coalesce(
        (
          select jsonb_agg(value)
          from jsonb_each(v_poop_events) as legacy_event(key, value)
          where jsonb_typeof(value) = 'object'
        ),
        '[]'::jsonb
      )
    end
    else '[]'::jsonb
  end;

  v_limit := case p_action when 'feed' then 4 when 'pat' then 5 else 3 end;
  v_cooldown_ms := case p_action when 'feed' then 60000 when 'pat' then 20000 else 120000 end;
  v_used := coalesce((v_counts ->> p_action)::integer, 0);
  v_last_used := coalesce((v_timestamps ->> p_action)::bigint, 0);

  if v_used >= v_limit then
    raise exception 'Daily % limit reached.', p_action using errcode = 'P0001';
  end if;
  if v_now_ms - v_last_used < v_cooldown_ms then
    raise exception 'Care action cooldown is still active.' using errcode = 'P0001';
  end if;

  v_counts := jsonb_set(v_counts, array[p_action], to_jsonb(v_used + 1), true);
  v_timestamps := jsonb_set(v_timestamps, array[p_action], to_jsonb(v_now_ms), true);

  if p_action = 'clean' then
    select coalesce(
      jsonb_agg(
        case
          when value ->> 'cleanedAt' is null
            then jsonb_set(value, '{cleanedAt}', to_jsonb(clock_timestamp()), true)
          else value
        end
      ),
      '[]'::jsonb
    )
    into v_poop_events
    from jsonb_array_elements(v_poop_events) as events(value);
  end if;

  v_current_mood := greatest(30, least(100, coalesce(v_child.mood_percent, 70)));
  v_next_mood := least(100, v_current_mood + 10);
  v_star_reward := case
    when v_current_mood < 100 and v_next_mood >= 100 then 3
    when v_current_mood < 80 and v_next_mood >= 80 then 1
    else 0
  end;
  v_next_stars := greatest(0, v_child.stars + v_star_reward);

  update public.children
  set stars = v_next_stars,
      mood_percent = v_next_mood,
      mood_updated_at = now()
  where child_id = p_child_id;

  insert into public.care_action_state (
    child_id,
    date,
    action_counts,
    last_timestamps,
    poop_events,
    pat_heart_awarded,
    updated_at
  ) values (
    p_child_id,
    v_today,
    v_counts,
    v_timestamps,
    v_poop_events,
    false,
    now()
  )
  on conflict (child_id) do update
  set date = excluded.date,
      action_counts = excluded.action_counts,
      last_timestamps = excluded.last_timestamps,
      poop_events = excluded.poop_events,
      pat_heart_awarded = excluded.pat_heart_awarded,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'changed', true,
    'child_id', p_child_id,
    'action', p_action,
    'star_reward', v_star_reward,
    'stars', v_next_stars,
    'mood_percent', v_next_mood,
    'mood_updated_at', now(),
    'date', v_today,
    'action_counts', v_counts,
    'last_timestamps', v_timestamps,
    'poop_events', v_poop_events,
    'pat_heart_awarded', false
  );
end;
$$;

revoke all on function public.perform_care_action_transaction(text, text) from public;
revoke all on function public.perform_care_action_transaction(text, text) from anon;
grant execute on function public.perform_care_action_transaction(text, text) to authenticated;

notify pgrst, 'reload schema';
