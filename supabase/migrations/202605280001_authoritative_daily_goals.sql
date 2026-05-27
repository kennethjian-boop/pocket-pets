create extension if not exists pgcrypto;

create table if not exists public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  date date not null,
  goal_ids text[] not null default '{}',
  setup_mode text not null default 'auto',
  previous_goal_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.daily_goals
  add column if not exists id uuid default gen_random_uuid();

update public.daily_goals
set id = gen_random_uuid()
where id is null;

alter table public.daily_goals
  alter column id set default gen_random_uuid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.daily_goals'::regclass
      and conname = 'daily_goals_pkey'
  ) then
    alter table public.daily_goals
      add constraint daily_goals_pkey primary key (id);
  end if;
end $$;

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
