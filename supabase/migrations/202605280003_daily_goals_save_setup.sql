alter table public.daily_goals
  add column if not exists goals jsonb not null default '[]'::jsonb;

alter table public.daily_goals
  add column if not exists updated_at timestamptz not null default now();

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

alter table public.daily_goals enable row level security;

drop policy if exists "Pocket Pets MVP authenticated read daily goals" on public.daily_goals;
drop policy if exists "Pocket Pets MVP authenticated insert daily goals" on public.daily_goals;
drop policy if exists "Pocket Pets MVP authenticated update daily goals" on public.daily_goals;
drop policy if exists "Pocket Pets MVP authenticated delete daily goals" on public.daily_goals;

create policy "Pocket Pets MVP authenticated read daily goals"
on public.daily_goals
for select
to authenticated
using (true);

create policy "Pocket Pets MVP authenticated insert daily goals"
on public.daily_goals
for insert
to authenticated
with check (true);

create policy "Pocket Pets MVP authenticated update daily goals"
on public.daily_goals
for update
to authenticated
using (true)
with check (true);

create policy "Pocket Pets MVP authenticated delete daily goals"
on public.daily_goals
for delete
to authenticated
using (true);
