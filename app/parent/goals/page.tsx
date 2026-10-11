'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { mockChildren } from '@/lib/mock-data';
import { goalBank, mergeWithDefaultChildState } from '@/lib/mission-state';
import { ChildTabs, GoalVerifyList, ParentBody, ParentHeader, SectionTitle, useParentToast } from '../_components/ParentUI';
import { useFamilyData } from '../_components/useFamilyData';

const MODE_LABEL = { manual: 'Chosen by you', random: 'Randomly picked today', auto: 'Auto daily' } as const;

export default function GoalsPage() {
  const family = useFamilyData();
  const toast = useParentToast();
  const [activeId, setActiveId] = useState(mockChildren[0]?.id ?? '');
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    // Deep links from Today: /parent/goals?child=child-thea&edit=1
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const child = params.get('child');
      if (child && mockChildren.some((c) => c.id === child)) setActiveId(child);
      if (params.get('edit') === '1') setEditing(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const child = mockChildren.find((c) => c.id === activeId) ?? mockChildren[0];
  const state = family.states[child.id] ?? mergeWithDefaultChildState(child, null);
  const missions = family.goals[child.id] ?? [];
  const done = missions.filter((m) => state.completedMissions[m.id]).length;
  const mode = family.modes[child.id] ?? 'auto';

  const defaultSelection = missions.length === 3 ? missions.map((m) => m.id) : goalBank.slice(0, 3).map((g) => g.id);
  const slots = selection.length === 3 ? selection : defaultSelection;

  const startEditing = () => {
    setSelection(defaultSelection);
    setEditing(true);
  };

  const save = async () => {
    const r = await family.saveSelected(child.id, slots);
    toast.show(r.message, r.ok ? 'success' : 'error');
    if (r.ok) setEditing(false);
  };

  const categories = Array.from(new Set(goalBank.map((g) => g.category)));

  return (
    <>
      <ParentHeader title="Goals" subtitle="Verify today's goals and choose tomorrow's" />
      <ParentBody>
        <ChildTabs
          items={mockChildren.map((c) => {
            const s = family.states[c.id] ?? mergeWithDefaultChildState(c, null);
            const m = family.goals[c.id] ?? [];
            return { id: c.id, name: c.name, state: s, badge: m.filter((g) => !s.completedMissions[g.id]).length };
          })}
          activeId={child.id}
          onChange={(id) => {
            setActiveId(id);
            setSelection([]);
            setEditing(false);
          }}
        />

        {!editing ? (
          <section className="p-card p-4">
            <SectionTitle
              action={
                <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${missions.length && done === missions.length ? 'bg-mint-50 text-mint-700' : 'bg-[#f3eff7] text-ink-soft'}`}>
                  {done}/{missions.length || 3} verified
                </span>
              }
            >
              {child.name}&apos;s goals today
            </SectionTitle>
            <div className="mt-3">
              {missions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-plum-200 bg-plum-50/40 p-4 text-center text-sm font-bold text-ink-soft">
                  No goals yet today. Pick three below so {child.name} can start.
                </p>
              ) : (
                <GoalVerifyList
                  missions={missions}
                  completed={state.completedMissions}
                  pendingKeys={family.pending}
                  childId={child.id}
                  onVerify={async (mission, completed) => {
                    const r = await family.verify(child.id, mission, completed);
                    toast.show(r.message, r.ok ? (completed ? 'success' : 'info') : 'error');
                  }}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-auto text-xs font-bold text-ink-faint">{missions.length ? MODE_LABEL[mode] : ''}</span>
              <button
                type="button"
                onClick={async () => {
                  const r = await family.randomize(child.id);
                  toast.show(r.message, r.ok ? 'success' : 'error');
                }}
                disabled={family.pending.has(`${child.id}:randomize`)}
                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-[#ece7f2] bg-white px-3 text-sm font-extrabold text-ink disabled:opacity-60"
              >
                <Icon name="dice" size={18} /> {missions.length ? 'Randomise' : 'Pick 3 for me'}
              </button>
              <button type="button" onClick={startEditing} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-plum-500 px-3 text-sm font-extrabold text-white">
                <Icon name="pencil" size={18} /> Choose goals
              </button>
            </div>
          </section>
        ) : (
          <section className="p-card p-4">
            <SectionTitle>Choose {child.name}&apos;s 3 goals</SectionTitle>
            {done > 0 ? (
              <p className="mt-2 rounded-xl bg-honey-50 px-3 py-2 text-xs font-bold text-honey-700">
                Saving will un-verify today&apos;s {done} verified {done === 1 ? 'goal' : 'goals'} and remove those stars.
              </p>
            ) : null}
            <div className="mt-3 grid gap-3">
              {[0, 1, 2].map((slot) => (
                <label key={slot} className="grid gap-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">Goal {slot + 1}</span>
                  <select
                    value={slots[slot] ?? ''}
                    onChange={(e) => setSelection(slots.map((id, i) => (i === slot ? e.target.value : id)))}
                    className="min-h-12 w-full min-w-0 rounded-xl border border-[#ece7f2] bg-white px-3 text-[15px] font-bold text-ink"
                  >
                    {categories.map((category) => (
                      <optgroup key={category} label={category}>
                        {goalBank
                          .filter((g) => g.category === category)
                          .map((g) => (
                            <option key={g.id} value={g.id} disabled={slots.includes(g.id) && slots[slot] !== g.id}>
                              {g.title} (+{g.starReward}★)
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEditing(false)} className="min-h-12 rounded-xl border border-[#ece7f2] bg-white text-sm font-extrabold text-ink-soft">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={family.pending.has(`${child.id}:save`)}
                className="min-h-12 rounded-xl bg-plum-500 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {family.pending.has(`${child.id}:save`) ? 'Saving…' : 'Save goals'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                family.setAutoMode(child.id);
                toast.show(`${child.name} is set to auto daily goals.`, 'info');
                setEditing(false);
              }}
              className="mt-2 min-h-10 w-full text-xs font-extrabold text-ink-faint"
            >
              Use auto daily mode instead
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-plum-100 bg-plum-50/50">
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-expanded={helpOpen}
            className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-extrabold text-plum-700"
          >
            How goals work
            <Icon name="chevron-right" size={18} className={`transition ${helpOpen ? 'rotate-90' : ''}`} />
          </button>
          {helpOpen ? (
            <ul className="grid gap-1.5 px-4 pb-4 text-sm font-bold text-ink-soft">
              <li>• Verifying adds the goal&apos;s stars, hits the Family Boss and warms an active Secret Egg.</li>
              <li>• Undo reverses the stars and boss hit (a hatched pet is never taken back).</li>
              <li>• Children can see goals but can never verify them.</li>
              <li>• Randomise is blocked once a goal is verified, so stars can&apos;t be double-counted.</li>
            </ul>
          ) : null}
        </section>
      </ParentBody>
      {toast.node}
    </>
  );
}
