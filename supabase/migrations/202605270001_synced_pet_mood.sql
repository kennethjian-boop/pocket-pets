-- Pocket Pets synced pet mood
-- Mood is shared child state. It decays in app code based on mood_updated_at.

alter table public.children
  add column if not exists mood_percent integer not null default 70
    check (mood_percent >= 30 and mood_percent <= 100),
  add column if not exists mood_updated_at timestamptz not null default now();

update public.children
set
  mood_percent = 70,
  mood_updated_at = now()
where child_id in ('child-ansel', 'child-thea');
