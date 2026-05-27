-- Pocket Pets care state poop events
-- Keeps scheduled poop cleanup state shared across devices.

create table if not exists public.care_action_state (
  child_id text primary key,
  date text not null,
  action_counts jsonb not null default '{}'::jsonb,
  last_timestamps jsonb not null default '{}'::jsonb,
  pat_heart_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.care_action_state
  add column if not exists poop_events jsonb not null default '[]'::jsonb;

drop trigger if exists set_care_action_state_updated_at on public.care_action_state;

create trigger set_care_action_state_updated_at
before update on public.care_action_state
for each row
execute function public.set_updated_at();

alter table public.care_action_state enable row level security;

drop policy if exists "Pocket Pets MVP authenticated read care action state" on public.care_action_state;
drop policy if exists "Pocket Pets MVP authenticated insert care action state" on public.care_action_state;
drop policy if exists "Pocket Pets MVP authenticated update care action state" on public.care_action_state;

create policy "Pocket Pets MVP authenticated read care action state"
on public.care_action_state
for select
to authenticated
using (true);

create policy "Pocket Pets MVP authenticated insert care action state"
on public.care_action_state
for insert
to authenticated
with check (true);

create policy "Pocket Pets MVP authenticated update care action state"
on public.care_action_state
for update
to authenticated
using (true)
with check (true);
