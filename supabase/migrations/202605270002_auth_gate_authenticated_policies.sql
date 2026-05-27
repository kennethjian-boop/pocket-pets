-- Pocket Pets auth gate policy fix
-- Auth is only an app access gate in this phase. These policies preserve the
-- existing global MVP data model for logged-in users without adding ownership.

do $$
begin
  if to_regclass('public.children') is not null then
    drop policy if exists "Pocket Pets MVP authenticated read children" on public.children;
    drop policy if exists "Pocket Pets MVP authenticated insert children" on public.children;
    drop policy if exists "Pocket Pets MVP authenticated update children" on public.children;

    create policy "Pocket Pets MVP authenticated read children"
    on public.children
    for select
    to authenticated
    using (true);

    create policy "Pocket Pets MVP authenticated insert children"
    on public.children
    for insert
    to authenticated
    with check (true);

    create policy "Pocket Pets MVP authenticated update children"
    on public.children
    for update
    to authenticated
    using (true)
    with check (true);
  end if;

  if to_regclass('public.daily_goals') is not null then
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
  end if;

  if to_regclass('public.care_action_state') is not null then
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
  end if;

  if to_regclass('public.family_boss_state') is not null then
    drop policy if exists "Pocket Pets MVP authenticated read family boss state" on public.family_boss_state;
    drop policy if exists "Pocket Pets MVP authenticated insert family boss state" on public.family_boss_state;
    drop policy if exists "Pocket Pets MVP authenticated update family boss state" on public.family_boss_state;

    create policy "Pocket Pets MVP authenticated read family boss state"
    on public.family_boss_state
    for select
    to authenticated
    using (true);

    create policy "Pocket Pets MVP authenticated insert family boss state"
    on public.family_boss_state
    for insert
    to authenticated
    with check (true);

    create policy "Pocket Pets MVP authenticated update family boss state"
    on public.family_boss_state
    for update
    to authenticated
    using (true)
    with check (true);
  end if;

  if to_regclass('public.reward_templates') is not null then
    drop policy if exists "Pocket Pets MVP authenticated read reward templates" on public.reward_templates;
    drop policy if exists "Pocket Pets MVP authenticated insert reward templates" on public.reward_templates;
    drop policy if exists "Pocket Pets MVP authenticated update reward templates" on public.reward_templates;

    create policy "Pocket Pets MVP authenticated read reward templates"
    on public.reward_templates
    for select
    to authenticated
    using (true);

    create policy "Pocket Pets MVP authenticated insert reward templates"
    on public.reward_templates
    for insert
    to authenticated
    with check (true);

    create policy "Pocket Pets MVP authenticated update reward templates"
    on public.reward_templates
    for update
    to authenticated
    using (true)
    with check (true);
  end if;

  if to_regclass('public.parent_settings') is not null then
    drop policy if exists "Pocket Pets MVP authenticated read parent settings" on public.parent_settings;
    drop policy if exists "Pocket Pets MVP authenticated insert parent settings" on public.parent_settings;
    drop policy if exists "Pocket Pets MVP authenticated update parent settings" on public.parent_settings;

    create policy "Pocket Pets MVP authenticated read parent settings"
    on public.parent_settings
    for select
    to authenticated
    using (true);

    create policy "Pocket Pets MVP authenticated insert parent settings"
    on public.parent_settings
    for insert
    to authenticated
    with check (true);

    create policy "Pocket Pets MVP authenticated update parent settings"
    on public.parent_settings
    for update
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;
