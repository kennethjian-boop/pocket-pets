alter table public.daily_goals
  add column if not exists goals jsonb not null default '[]'::jsonb;

update public.daily_goals
set goals = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', goal_id,
        'title', goal_id,
        'description', '',
        'reward', 0,
        'starReward', 0,
        'bossDamage', 10,
        'completed', false
      )
    ),
    '[]'::jsonb
  )
  from unnest(goal_ids) as goal_id
)
where jsonb_array_length(goals) = 0
  and goal_ids is not null
  and array_length(goal_ids, 1) > 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by child_id, date
      order by updated_at desc nulls last, id desc
    ) as row_rank
  from public.daily_goals
)
delete from public.daily_goals dg
using ranked
where dg.id = ranked.id
  and ranked.row_rank > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_goals'::regclass
      and conname = 'daily_goals_child_id_date_key'
  ) then
    alter table public.daily_goals
      add constraint daily_goals_child_id_date_key unique (child_id, date);
  end if;
end $$;
