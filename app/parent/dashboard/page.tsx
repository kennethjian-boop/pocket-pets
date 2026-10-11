'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PetFace } from '@/components/child/PetSprite';
import { mockChildren } from '@/lib/mock-data';
import { claimVictoryRewards } from '@/lib/boss-sync';
import type { PetType } from '@/lib/pet-skins';
import { Balances, GoalVerifyList, ParentBody, ParentHeader, SectionTitle, useParentToast } from '../_components/ParentUI';
import { useFamilyData } from '../_components/useFamilyData';

const QUICK: { href: string; icon: IconName; label: string }[] = [
  { href: '/parent/rewards', icon: 'gift', label: 'Give a reward' },
  { href: '/parent/screen-energy', icon: 'clock', label: 'Screen time' },
  { href: '/parent/goals', icon: 'pencil', label: 'Edit goals' },
  { href: '/parent/family-boss', icon: 'sword', label: 'Boss controls' },
];

function todayLabel() {
  return new Intl.DateTimeFormat('en-SG', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' }).format(new Date());
}

export default function TodayPage() {
  const family = useFamilyData();
  const toast = useParentToast();
  const [claiming, setClaiming] = useState(false);

  const summaries = mockChildren.map((child) => {
    const state = family.states[child.id];
    const missions = family.goals[child.id] ?? [];
    const done = missions.filter((m) => state?.completedMissions[m.id]).length;
    return { child, state, missions, done, waiting: missions.length - done };
  });
  const totalWaiting = summaries.reduce((s, c) => s + Math.max(0, c.waiting), 0);
  const needsGoals = summaries.filter((c) => c.missions.length === 0).map((c) => c.child.name);
  const boss = family.boss;
  const hp = boss && boss.maxHp > 0 ? Math.round((boss.currentHp / boss.maxHp) * 100) : 0;

  const claim = async () => {
    if (claiming) return;
    setClaiming(true);
    const result = await claimVictoryRewards(mockChildren);
    setClaiming(false);
    family.setBoss(result.state);
    Object.entries(result.childStates).forEach(([id, state]) => family.setChildState(id, state));
    if (result.ok) toast.show('Victory prizes delivered to everyone!');
    else toast.show(result.message, result.alreadyClaimed ? 'info' : 'error');
  };

  return (
    <>
      <ParentHeader
        title="Today"
        subtitle={
          !family.loaded
            ? todayLabel()
            : needsGoals.length
              ? `${todayLabel()} · pick goals for ${needsGoals.join(' & ')}`
              : totalWaiting > 0
                ? `${todayLabel()} · ${totalWaiting} goals to check`
                : `${todayLabel()} · all caught up`
        }
      />
      <ParentBody wide>
        <div className="grid gap-4 lg:grid-cols-2">
          {summaries.map(({ child, state, missions, done }) => {
            if (!state) return null;
            const pet = state.activePetId as PetType;
            return (
              <section key={child.id} className="p-card p-4" aria-label={`${child.name}'s day`}>
                <div className="flex items-center gap-3">
                  <PetFace pet={pet} skinId={state.activeSkins[pet]} size={44} ring="ring-plum-100" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-xl font-semibold text-ink">{child.name}</h2>
                      <span className={`text-xs font-extrabold ${missions.length && done === missions.length ? 'text-mint-600' : 'text-ink-faint'}`}>
                        {missions.length ? `${done}/${missions.length} verified` : 'No goals yet'}
                      </span>
                    </div>
                    <Balances state={state} />
                  </div>
                </div>
                <div className="mt-3">
                  {!family.loaded ? (
                    <div className="grid gap-2" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-[#f3eff7]" />
                      ))}
                    </div>
                  ) : missions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-plum-200 bg-plum-50/40 p-3 text-center">
                      <p className="text-sm font-bold text-ink-soft">No goals set for today yet.</p>
                      <div className="mt-2 flex justify-center gap-2">
                        <button
                          type="button"
                          disabled={family.pending.has(`${child.id}:randomize`)}
                          onClick={async () => {
                            const r = await family.randomize(child.id);
                            toast.show(r.message, r.ok ? 'success' : 'error');
                          }}
                          className="flex min-h-11 items-center gap-1.5 rounded-xl bg-plum-500 px-4 text-sm font-extrabold text-white disabled:opacity-60"
                        >
                          <Icon name="dice" size={18} /> Pick 3 for me
                        </button>
                        <Link href={`/parent/goals?child=${child.id}&edit=1`} className="flex min-h-11 items-center rounded-xl border border-[#ece7f2] bg-white px-4 text-sm font-extrabold text-ink-soft">
                          Choose
                        </Link>
                      </div>
                    </div>
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
              </section>
            );
          })}
        </div>

        {boss ? (
          <section className="p-card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4" aria-label="Family Boss">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-plum-900/90">
              <Image src={boss.bossImage} alt="" fill sizes="96px" className={`object-contain ${boss.isDefeated ? 'grayscale' : ''}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold text-ink">{boss.bossName}</p>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#f1ecf7]">
                <div className="h-full rounded-full bg-gradient-to-r from-berry-400 to-honey-300 transition-all duration-700" style={{ width: `${hp}%` }} />
              </div>
              <p className="mt-1 text-xs font-bold text-ink-faint">
                {boss.isDefeated ? (boss.rewardClaimed ? 'Defeated · prizes delivered' : 'Defeated! Prizes are waiting.') : `${boss.currentHp}/${boss.maxHp} HP · ${boss.attacks.length} hits this week`}
              </p>
            </div>
            {boss.isDefeated && !boss.rewardClaimed ? (
              <button
                type="button"
                onClick={() => void claim()}
                disabled={claiming}
                className="min-h-11 w-full shrink-0 rounded-xl bg-mint-500 px-3 text-sm font-extrabold text-white shadow-[0_3px_0_#1c8455] disabled:opacity-60 sm:w-auto"
              >
                {claiming ? 'Claiming…' : 'Give prizes'}
              </button>
            ) : (
              <Link href="/parent/family-boss" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-faint hover:bg-[#f6f2fa]" aria-label="Boss controls">
                <Icon name="chevron-right" size={20} />
              </Link>
            )}
          </section>
        ) : null}

        <section>
          <SectionTitle>Shortcuts</SectionTitle>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="p-card flex min-h-14 items-center gap-2.5 px-3 text-sm font-extrabold text-ink transition hover:border-plum-200 active:scale-[0.98]">
                <Icon name={q.icon} size={24} className={q.icon === 'clock' || q.icon === 'pencil' ? 'text-plum-500' : ''} />
                {q.label}
              </Link>
            ))}
          </div>
        </section>
      </ParentBody>
      {toast.node}
    </>
  );
}
