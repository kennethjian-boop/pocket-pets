'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PetFace } from '@/components/child/PetSprite';
import { mockChildren, type Child } from '@/lib/mock-data';
import { mergeWithDefaultChildState } from '@/lib/mission-state';
import { adjustCurrencies, setScreenEnergy, type EconomyResult } from '@/lib/child-economy';
import { defaultRewardTemplates, getRewardDelta, type RewardTemplate } from '@/lib/reward-templates';
import { fetchRewardTemplates } from '@/lib/supabase-reward-templates';
import { formatWeekendScreenTime } from '@/lib/screen-energy';
import type { PetType } from '@/lib/pet-skins';
import { loadSavedRewardTemplates } from '../_lib';
import { ParentBody, ParentHeader, useParentToast } from '../_components/ParentUI';
import { useFamilyData } from '../_components/useFamilyData';

export default function ScreenEnergyPage() {
  const family = useFamilyData();
  const toast = useParentToast();
  const [templates, setTemplates] = useState<RewardTemplate[]>(defaultRewardTemplates);
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRewardTemplates().then((remote) => {
      if (!cancelled) setTemplates(remote ?? loadSavedRewardTemplates());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The steppers already cover ±1; only surface templates with other amounts.
  const energyTemplates = templates.filter((t) => t.currencyType === 'screen-energy' && Math.abs(getRewardDelta(t)) !== 1);

  const run = async (child: Child, key: string, action: () => Promise<EconomyResult>, success: (r: EconomyResult) => string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(`${child.id}:${key}`);
    const result = await action();
    busyRef.current = false;
    setBusy(null);
    family.setChildState(child.id, result.state);
    toast.show(result.ok ? success(result) : result.message, result.ok ? 'success' : 'error');
  };

  return (
    <>
      <ParentHeader title="Screen Energy" subtitle="1 energy = 10 weekend minutes" />
      <ParentBody wide>
        <div className="grid gap-4 md:grid-cols-2">
          {mockChildren.map((child) => {
            const state = family.states[child.id] ?? mergeWithDefaultChildState(child, null);
            const pet = state.activePetId as PetType;
            const isBusy = busy?.startsWith(child.id) ?? false;
            return (
              <section key={child.id} className="p-card p-4" aria-label={`${child.name}'s screen energy`}>
                <div className="flex items-center gap-3">
                  <PetFace pet={pet} skinId={state.activeSkins[pet]} size={40} ring="ring-plum-100" />
                  <h2 className="font-display text-xl font-semibold text-ink">{child.name}</h2>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-sky-50 p-3">
                  <button
                    type="button"
                    onClick={() => void run(child, 'minus', () => adjustCurrencies(child, { screenEnergy: -1 }), (r) => `${child.name} now has ${r.state.screenEnergy} energy.`)}
                    disabled={isBusy || state.screenEnergy <= 0}
                    className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-ink shadow-[0_3px_0_#d8eeff] disabled:opacity-40"
                    aria-label={`Remove 1 Screen Energy from ${child.name}`}
                  >
                    <Icon name="minus" size={26} />
                  </button>
                  <div className="text-center" aria-live="polite">
                    <p className="flex items-center justify-center gap-1 font-display text-5xl font-semibold tabular-nums text-sky-700">
                      <Icon name="energy" size={38} /> {state.screenEnergy}
                    </p>
                    <p className="text-xs font-extrabold text-sky-700/80">{formatWeekendScreenTime(state.screenEnergy)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void run(child, 'plus', () => adjustCurrencies(child, { screenEnergy: 1 }), (r) => `${child.name} now has ${r.state.screenEnergy} energy.`)}
                    disabled={isBusy}
                    className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-ink shadow-[0_3px_0_#d8eeff] disabled:opacity-40"
                    aria-label={`Add 1 Screen Energy for ${child.name}`}
                  >
                    <Icon name="plus" size={26} />
                  </button>
                </div>

                {energyTemplates.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {energyTemplates.map((template) => {
                      const delta = getRewardDelta(template);
                      return (
                        <button
                          key={template.id}
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void run(
                              child,
                              template.id,
                              () => adjustCurrencies(child, { screenEnergy: delta }),
                              (r) => `${template.label}: ${child.name} now has ${r.state.screenEnergy} energy.`
                            )
                          }
                          className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm font-extrabold disabled:opacity-50 ${
                            delta < 0 ? 'border-berry-100 bg-white text-ink' : 'border-[#ece7f2] bg-white text-ink'
                          }`}
                        >
                          <span className="truncate">{template.label}</span>
                          <span className={delta < 0 ? 'text-berry-600' : 'text-sky-700'}>
                            {delta > 0 ? '+' : '−'}
                            {Math.abs(delta)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-3 border-t border-[#ece7f2] pt-3">
                  {confirmReset === child.id ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink-soft">Reset {child.name} to 0 for a new week?</p>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setConfirmReset(null)} className="min-h-10 rounded-lg px-3 text-xs font-extrabold text-ink-soft">
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmReset(null);
                            void run(child, 'reset', () => setScreenEnergy(child, 0), () => `${child.name}'s Screen Energy reset for the new week.`);
                          }}
                          className="min-h-10 rounded-lg bg-berry-500 px-3 text-xs font-extrabold text-white"
                        >
                          Reset to 0
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmReset(child.id)} disabled={isBusy} className="flex min-h-10 items-center gap-1.5 text-xs font-extrabold text-ink-faint hover:text-ink">
                      <Icon name="refresh" size={16} /> Start a new week
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        <p className="text-center text-xs font-bold text-ink-faint">
          Screen Energy has no cap, never affects pet mood, and can&apos;t be earned from Feed, Pat or Clean.
        </p>
      </ParentBody>
      {toast.node}
    </>
  );
}
