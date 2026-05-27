-- Pocket Pets MVP - Phase 1 shared child state
-- Scope: children, currencies, equipped pet, equipped skin.
-- Local-only systems such as goals, eggs, care actions, boss logs, and skin ownership
-- stay in localStorage for now.

create table if not exists public.children (
  child_id text primary key,
  display_name text not null,
  stars integer not null default 0 check (stars >= 0),
  hearts integer not null default 0 check (hearts >= 0),
  screen_energy integer not null default 0 check (screen_energy >= 0),
  equipped_pet text not null default 'bubbo',
  equipped_skin_by_pet jsonb not null default '{}'::jsonb,
  mood_percent integer not null default 70 check (mood_percent >= 30 and mood_percent <= 100),
  mood_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_children_updated_at on public.children;

create trigger set_children_updated_at
before update on public.children
for each row
execute function public.set_updated_at();

alter table public.children enable row level security;

drop policy if exists "Pocket Pets MVP public read children" on public.children;
drop policy if exists "Pocket Pets MVP public insert children" on public.children;
drop policy if exists "Pocket Pets MVP public update children" on public.children;

-- MVP note:
-- Auth is currently only an app access gate. Both anon and authenticated roles
-- can read/write this global MVP shared-state table until ownership is added.
create policy "Pocket Pets MVP public read children"
on public.children
for select
to anon, authenticated
using (true);

create policy "Pocket Pets MVP public insert children"
on public.children
for insert
to anon, authenticated
with check (true);

create policy "Pocket Pets MVP public update children"
on public.children
for update
to anon, authenticated
using (true)
with check (true);

insert into public.children (
  child_id,
  display_name,
  stars,
  hearts,
  screen_energy,
  equipped_pet,
  equipped_skin_by_pet,
  mood_percent,
  mood_updated_at
)
values
  ('child-ansel', 'Ansel', 42, 3, 3, 'bubbo', '{}'::jsonb, 70, now()),
  ('child-thea', 'Thea', 38, 5, 4, 'luna', '{}'::jsonb, 70, now())
on conflict (child_id) do nothing;
