'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { formatWeekendScreenTime } from '@/lib/screen-energy';
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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
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
        className="flex-1 overflow-y-auto flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-[1400px] space-y-6 px-6 py-6 lg:px-10 lg:py-8">

          {/* Family stat strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">⭐ Total Stars</p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">{totalStars}</p>
              <p className="mt-1 text-xs font-semibold text-amber-400">across all children</p>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-pink-50 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-pink-600">❤️ Total Hearts</p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">{totalHearts}</p>
              <p className="mt-1 text-xs font-semibold text-pink-400">across all children</p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600">👾 Boss HP</p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">{Math.round(hpPercent)}%</p>
              <p className="mt-1 text-xs font-semibold text-purple-400">{bossState.bossName}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">✅ Goals Today</p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">{totalGoalsCompleted}/{totalGoals}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-500">completed</p>
            </div>
          </div>

          {/* Child summary cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {childrenData.map((child) => {
              const state =
                dashboardStates[child.id] ?? mergeWithDefaultChildState(child, null);
              const goals = goalsByChild[child.id] ?? dailyMissionTemplates;
              const completedCount = goals.filter(
                (m) => state.completedMissions[m.id]
              ).length;

              return (
                <div key={child.id} className={cardStyle}>
                  <div className="px-6 pt-6 pb-5">
                    <h2 className="text-2xl font-extrabold text-slate-900">{child.name}</h2>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-amber-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600">⭐ Stars</p>
                        <p className="text-2xl font-extrabold text-slate-900">{child.stars}</p>
                      </div>
                      <div className="rounded-2xl bg-pink-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-pink-600">❤️ Hearts</p>
                        <p className="text-2xl font-extrabold text-slate-900">{child.hearts}</p>
                      </div>
                      <div className="rounded-2xl bg-blue-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">📱 Energy</p>
                        <p className="text-2xl font-extrabold text-slate-900">{child.screenEnergy}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {formatWeekendScreenTime(child.screenEnergy)}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600">Today&apos;s Goals</span>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${
                          completedCount === goals.length && goals.length > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {completedCount}/{goals.length} done
                      </span>
                    </div>
                    {completedCount > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {goals
                          .filter((m) => state.completedMissions[m.id])
                          .map((m) => (
                            <span
                              key={m.id}
                              className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                            >
                              ✓ {m.title}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Boss preview */}
          <div className="overflow-hidden rounded-2xl border border-purple-200/70 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-purple-400 via-violet-500 to-purple-400" />
            <div className="flex items-center gap-5 px-6 py-5 sm:gap-8">
              <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                <Image
                  src={bossState.bossImage}
                  alt={`${bossState.bossName} boss`}
                  fill
                  className="object-contain drop-shadow-md"
                  sizes="96px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{bossState.bossName}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      bossState.isDefeated
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bossState.isDefeated ? '✓ Defeated' : '⚔️ Active'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-purple-600">{bossState.bossTheme}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>{bossState.currentHp.toLocaleString()} / {bossState.maxHp.toLocaleString()} HP</span>
                    <span>{bossState.attacks.length} attacks logged</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 via-orange-300 to-amber-200 transition-all duration-700 ease-out"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <Link
                href="/parent/family-boss"
                className="shrink-0 self-start rounded-xl bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-200 active:scale-95"
              >
                Manage →
              </Link>
            </div>
          </div>

          {/* Quick nav cards */}
          <div>
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {navCards.map(({ href, icon, label, desc }) => (
                <Link key={href} href={href} className="block">
                  <div className="h-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-purple-200 active:scale-95">
                    <span className="text-3xl">{icon}</span>
                    <p className="mt-3 text-sm font-extrabold text-slate-800">{label}</p>
                    <p className="mt-1 text-xs text-slate-400">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Currency legend */}
          <div className="rounded-2xl border border-slate-200/60 bg-white/60 px-6 py-4">
            <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
              <p>⭐ <strong className="text-slate-700">Stars</strong> — shop currency, earned from goals &amp; rewards.</p>
              <p>❤️ <strong className="text-slate-700">Hearts</strong> — pet bond, earned from kindness &amp; care.</p>
              <p>📱 <strong className="text-slate-700">Screen Energy</strong> — uncapped weekend time bank. 1 = 10 min.</p>
            </div>
          </div>

        </div>
      </motion.main>
    </>
  );
}
