'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { mockChildren } from '@/lib/mock-data';
import {
  dailyMissionTemplates,
  mergeWithDefaultChildState,
} from '@/lib/mission-state';
import {
  createDefaultBossBattleState,
  getBossBattleStorageKey,
  readBossBattleState,
} from '@/lib/boss-battle';
import {
  buildDashboardStates,
  buildDashboardStatesFromSupabase,
  buildGoalsByChild,
  cardStyle,
  DashboardStateByChild,
  GoalsByChild,
} from '../_lib';

export default function OverviewPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [dashboardStates, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [goalsByChild, setGoalsByChild] = useState<GoalsByChild>(
    () => buildGoalsByChild(false)
  );
  const [bossState, setBossState] = useState(createDefaultBossBattleState);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void buildDashboardStatesFromSupabase().then((hydrated) => {
      const hydratedGoals = buildGoalsByChild(true);
      setDashboardStates(hydrated);
      setGoalsByChild(hydratedGoals);
      setBossState(readBossBattleState());
      setChildrenData((cur) =>
        cur.map((child) => {
          const s = hydrated[child.id];
          return { ...child, stars: s.stars, hearts: s.hearts, screenEnergy: s.screenEnergy };
        })
      );
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getBossBattleStorageKey()) setBossState(readBossBattleState());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const hpPercent =
    bossState.maxHp > 0
      ? Math.max(0, Math.min(100, (bossState.currentHp / bossState.maxHp) * 100))
      : 0;

  const totalStars = childrenData.reduce((sum, c) => sum + c.stars, 0);
  const totalHearts = childrenData.reduce((sum, c) => sum + c.hearts, 0);
  const totalGoalsCompleted = mockChildren.reduce((sum, child) => {
    const state = dashboardStates[child.id];
    const goals = goalsByChild[child.id] ?? dailyMissionTemplates;
    return sum + (state ? goals.filter((m) => state.completedMissions[m.id]).length : 0);
  }, 0);
  const totalGoals = mockChildren.reduce(
    (sum, child) => sum + (goalsByChild[child.id] ?? dailyMissionTemplates).length,
    0
  );
  const childSummaries = childrenData.map((child) => {
    const state = dashboardStates[child.id] ?? mergeWithDefaultChildState(child, null);
    const goals = goalsByChild[child.id] ?? dailyMissionTemplates;
    return {
      child,
      completedCount: goals.filter((goal) => state.completedMissions[goal.id]).length,
      goalCount: goals.length,
    };
  });

  const navCards = [
    {
      href: '/parent/goals',
      icon: '✅',
      label: 'Goals & Verification',
      desc: 'Verify daily goals and manage goal sets',
    },
    {
      href: '/parent/rewards',
      icon: '🎁',
      label: 'Rewards',
      desc: 'Apply quick rewards and manage values',
    },
    {
      href: '/parent/family-boss',
      icon: '👾',
      label: 'Family Boss',
      desc: 'Boss battle controls and victory rewards',
    },
    {
      href: '/parent/screen-energy',
      icon: '📱',
      label: 'Screen Energy',
      desc: 'Manage screen time for each child',
    },
    {
      href: '/parent/settings',
      icon: '⚙️',
      label: 'Settings',
      desc: 'Change parent PIN and app settings',
    },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl lg:hidden">🐾</span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 lg:text-lg">Overview</h1>
            <p className="hidden lg:block text-xs text-slate-400">Family summary at a glance</p>
          </div>
        </div>
        <Link href="/">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          >
            ← Exit
          </button>
        </Link>
      </header>

      {/* Body */}
      <motion.main
        className="flex flex-1 flex-col items-center overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-3xl space-y-4 px-4 py-4 sm:px-6">

          <section className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-md">
            <div>
              <h2 className="text-lg font-black text-slate-900">Family Snapshot</h2>
              <p className="text-xs font-semibold text-slate-400">Today&apos;s progress at a glance</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-amber-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">⭐ Stars</p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-slate-900">{totalStars}</p>
              </div>
              <div className="rounded-xl bg-pink-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-pink-600">❤️ Hearts</p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-slate-900">{totalHearts}</p>
              </div>
              <div className="rounded-xl bg-purple-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-purple-600">⚔ Boss HP</p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-slate-900">{Math.round(hpPercent)}%</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">✅ Goals Today</p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-slate-900">{totalGoalsCompleted}/{totalGoals}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {navCards.map(({ href, icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-[84px] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-100 hover:shadow-md active:scale-95"
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold leading-tight text-slate-800">{label}</span>
                    <span className="mt-0.5 hidden text-xs leading-tight text-slate-400 min-[390px]:block">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className={`${cardStyle} px-4 py-3`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Children</h2>
                <p className="text-xs font-semibold text-slate-400">Goals needing attention today</p>
              </div>
              <Link href="/parent/goals" className="text-xs font-black text-purple-700">
                Verify goals →
              </Link>
            </div>
            <div className="mt-2 divide-y divide-slate-100">
              {childSummaries.map(({ child, completedCount, goalCount }) => (
                <div key={child.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{child.name}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {completedCount}/{goalCount} goals completed
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    completedCount === goalCount && goalCount > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {completedCount === goalCount && goalCount > 0
                      ? 'Done'
                      : `${Math.max(0, goalCount - completedCount)} left`}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">{bossState.bossName}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    bossState.isDefeated
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {bossState.isDefeated ? 'Defeated' : 'Active Boss'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-purple-500">{bossState.bossTheme}</p>
              </div>
              <Link
                href="/parent/family-boss"
                className="shrink-0 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700 transition hover:bg-purple-100 active:scale-95"
              >
                Manage →
              </Link>
            </div>
            <div className="mt-3">
              <div className="flex justify-between gap-3 text-xs font-semibold text-slate-500">
                <span>{bossState.currentHp.toLocaleString()} / {bossState.maxHp.toLocaleString()} HP</span>
                <span>{bossState.attacks.length} attacks logged</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 via-orange-300 to-amber-200 transition-all duration-700 ease-out"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </section>

        </div>
      </motion.main>
    </>
  );
}
