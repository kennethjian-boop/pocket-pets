'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getChild, mockChildren } from '@/lib/mock-data';
import {
  BossAttack,
  BossBattleState,
  createDefaultBossBattleState,
  getBossBattleStorageKey,
  getBossRewardForChild,
  readBossBattleState,
} from '@/lib/boss-battle';
import { SCREEN_ENERGY_MINUTES } from '@/lib/screen-energy';
import { ChildPageFrame } from '@/app/child/_components/ChildSidebar';

type BossStatus = {
  label: string;
  icon: string;
  className: string;
  flavorText: string;
};

function getBossStatus(currentHp: number): BossStatus {
  if (currentHp === 0) {
    return {
      label: 'Defeated!',
      icon: '🏆',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      flavorText: 'You won! 🎉',
    };
  }
  if (currentHp <= 40) {
    return {
      label: 'Almost beat!',
      icon: '🔴',
      className: 'bg-red-100 text-red-800 border-red-200',
      flavorText: 'Keep going!',
    };
  }
  if (currentHp <= 75) {
    return {
      label: 'Wobbling!',
      icon: '🟠',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      flavorText: 'Getting weaker!',
    };
  }
  return {
    label: 'Strong',
    icon: '🟣',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    flavorText: 'Fight harder!',
  };
}

function getAttackIcon(attack: BossAttack) {
  const title = attack.title.toLowerCase();
  if (attack.sourceType === 'parent_bonus') return '🌟';
  if (title.includes('read') || title.includes('story')) return '📚';
  if (title.includes('kind')) return '💖';
  if (title.includes('clean') || title.includes('tidy') || title.includes('room')) return '🧹';
  return '✨';
}

const avatarColors = [
  'bg-violet-200 text-violet-800',
  'bg-pink-200 text-pink-800',
  'bg-amber-200 text-amber-800',
  'bg-teal-200 text-teal-800',
];

export default function FamilyBoss() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;
  const child = getChild(childId);
  const [bossState, setBossState] = useState<BossBattleState>(() =>
    createDefaultBossBattleState()
  );
  const [showAllAttacks, setShowAllAttacks] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const syncBossState = () => setBossState(readBossBattleState());
    syncBossState();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === getBossBattleStorageKey()) syncBossState();
    };
    window.addEventListener('storage', handleStorage);
    const refreshTimer = window.setInterval(syncBossState, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const status = getBossStatus(bossState.currentHp);
  const hpPercentage =
    bossState.maxHp > 0
      ? Math.max(0, Math.min(100, (bossState.currentHp / bossState.maxHp) * 100))
      : 0;
  const childReward = getBossRewardForChild(bossState, childId);
  const screenMinutes = childReward.screenEnergy * SCREEN_ENERGY_MINUTES;

  const familyPower = useMemo(
    () =>
      mockChildren.map((familyChild) => {
        const childAttacks = bossState.attacks.filter(
          (attack) => attack.childId === familyChild.id
        );
        const damage = childAttacks.reduce((sum, attack) => sum + attack.damage, 0);
        return {
          childId: familyChild.id,
          name: familyChild.name,
          attackCount: childAttacks.length,
          damage,
        };
      }),
    [bossState.attacks]
  );

  const visibleAttacks = showAllAttacks ? bossState.attacks : bossState.attacks.slice(0, 3);
  const hasMoreAttacks = bossState.attacks.length > 3;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (!child) return <div>Child not found</div>;

  return (
    <ChildPageFrame childId={childId}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4 pt-6 sm:px-6">
        <motion.div
          className="mx-auto max-w-lg pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── HERO CARD ──────────────────────────────────────────────────── */}
          <motion.section
            variants={itemVariants}
            className="mb-4 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl"
          >
            {/* Boss artwork */}
            <div className="relative flex items-center justify-center bg-gradient-to-br from-violet-100 via-indigo-100 to-pink-100 pb-2 pt-5">
              <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-violet-700 shadow-sm backdrop-blur-sm">
                {bossState.weekLabel}
              </div>
              <div className="relative h-[200px] w-[200px] sm:h-[240px] sm:w-[240px]">
                <Image
                  src={bossState.bossImage}
                  alt={`${bossState.bossName} boss`}
                  fill
                  className={`object-contain transition duration-500 ${bossState.isDefeated ? 'opacity-70 grayscale' : ''}`}
                  sizes="240px"
                  priority
                />
                {bossState.isDefeated && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200 bg-white/95 px-4 py-2 text-base font-extrabold text-emerald-700 shadow-lg"
                  >
                    🏆 Defeated!
                  </motion.div>
                )}
              </div>
            </div>

            {/* Boss name, status, HP bar, flavor chips */}
            <div className="px-5 pb-5 pt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                  {bossState.bossName}
                </h1>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold ${status.className}`}>
                  {status.icon} {status.label}
                </span>
              </div>

              <div className="relative h-6 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 via-orange-400 to-amber-300"
                  style={{
                    boxShadow:
                      hpPercentage <= 40
                        ? '0 2px 14px rgba(239,68,68,0.5)'
                        : '0 2px 10px rgba(251,146,60,0.4)',
                  }}
                  initial={false}
                  animate={{
                    width: `${hpPercentage}%`,
                    ...(hpPercentage <= 40 && !bossState.isDefeated
                      ? { opacity: [1, 0.75, 1] }
                      : {}),
                  }}
                  transition={{
                    width: { duration: 0.8, ease: 'easeOut' },
                    opacity:
                      hpPercentage <= 40 && !bossState.isDefeated
                        ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                        : {},
                  }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs font-semibold text-slate-400">
                {Math.round(hpPercentage)}% HP · {status.flavorText}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  🖥️ {bossState.bossTheme}
                </span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  ⚡ Tech gremlin
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  🤝 Weak to teamwork
                </span>
              </div>
            </div>
          </motion.section>

          {/* ── VICTORY BANNER ─────────────────────────────────────────────── */}
          {bossState.isDefeated && (
            <motion.section
              variants={itemVariants}
              className="mb-4 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 p-4 text-center shadow-lg"
            >
              <h2 className="text-2xl font-extrabold text-slate-900">🎉 Family Victory!</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                You defeated {bossState.bossName} together!
              </p>
              {bossState.rewardClaimed ? (
                <div className="mx-auto mt-3 max-w-xs rounded-2xl bg-white/80 px-4 py-2">
                  <div className="font-extrabold text-emerald-700">✅ Rewards claimed!</div>
                </div>
              ) : (
                <div className="mx-auto mt-3 max-w-xs rounded-2xl bg-white/80 px-4 py-2">
                  <div className="font-extrabold text-purple-700">🔒 Ask a parent to claim</div>
                </div>
              )}
            </motion.section>
          )}

          {/* ── VICTORY REWARDS ────────────────────────────────────────────── */}
          <motion.section
            variants={itemVariants}
            className="mb-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg"
          >
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-purple-500">
              🎁 Victory rewards
            </p>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-amber-50 py-3">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-extrabold text-amber-700">+{childReward.stars}</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-pink-50 py-3">
                <span className="text-2xl">💖</span>
                <span className="text-xl font-extrabold text-pink-700">+{childReward.hearts}</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-blue-50 py-3">
                <span className="text-2xl">⚡</span>
                <span className="text-xl font-extrabold text-blue-700">+{childReward.screenEnergy}</span>
              </div>
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-slate-400">
              ⚡ = {screenMinutes} min screen time
            </p>
            {!bossState.rewardClaimed && (
              <p className="mt-2 text-center text-xs font-extrabold text-purple-600">
                🔒 Waiting for parent to claim
              </p>
            )}
          </motion.section>

          {/* ── FAMILY HELPED ──────────────────────────────────────────────── */}
          <motion.section
            variants={itemVariants}
            className="mb-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg"
          >
            <h2 className="mb-3 text-base font-extrabold text-slate-900">✨ Your family helped!</h2>
            <div className="space-y-2">
              {familyPower.map((power, idx) => (
                <div
                  key={power.childId}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ${avatarColors[idx % avatarColors.length]}`}
                  >
                    {power.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-slate-900">{power.name}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {power.attackCount} {power.attackCount === 1 ? 'attack' : 'attacks'}
                    </p>
                  </div>
                  {power.damage > 0 && (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-extrabold text-purple-800">
                      {power.damage} dmg
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── RECENT ATTACKS ─────────────────────────────────────────────── */}
          <motion.section
            variants={itemVariants}
            className="mb-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg"
          >
            <h2 className="mb-3 text-base font-extrabold text-slate-900">⚔️ Recent attacks</h2>
            {bossState.attacks.length > 0 ? (
              <>
                <div className="space-y-1.5">
                  {visibleAttacks.map((attack) => (
                    <div
                      key={attack.id}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <span className="text-base">{getAttackIcon(attack)}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-violet-700">
                          {attack.childName}
                        </span>
                        <p className="truncate text-xs font-semibold text-slate-600">
                          {attack.title}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-extrabold text-red-600">
                        -{attack.damage} HP
                      </span>
                    </div>
                  ))}
                </div>
                {hasMoreAttacks && (
                  <button
                    type="button"
                    onClick={() => setShowAllAttacks(!showAllAttacks)}
                    className="mt-2 w-full rounded-xl bg-slate-50 py-2 text-xs font-extrabold text-violet-600 transition hover:bg-slate-100"
                  >
                    {showAllAttacks
                      ? 'Hide attacks'
                      : `View all ${bossState.attacks.length} attacks`}
                  </button>
                )}
              </>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-500">
                No attacks yet! Complete goals and ask a parent.
              </p>
            )}
          </motion.section>

          {/* ── HOW TO HELP (collapsed by default) ─────────────────────────── */}
          <motion.section
            variants={itemVariants}
            className="mb-6 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-lg"
          >
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-sm font-extrabold text-slate-700">🗺️ How to help</span>
              <span className="text-xs font-bold text-violet-500">{showTips ? 'Hide' : 'Show'}</span>
            </button>
            <AnimatePresence initial={false}>
              {showTips && (
                <motion.div
                  key="tips"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-4 pb-4">
                    {[
                      { icon: '✅', text: 'Complete your real-life goals.' },
                      { icon: '👨‍👩‍👧', text: 'Ask a parent to check them.' },
                      { icon: '💥', text: 'Each goal damages the boss.' },
                      { icon: '🤝', text: 'Work together to win!' },
                    ].map(({ icon, text }) => (
                      <div
                        key={text}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        <span>{icon}</span>
                        {text}
                      </div>
                    ))}
                    <p className="rounded-xl bg-purple-50 px-3 py-2 text-xs font-extrabold text-purple-800">
                      🔒 Only parents can verify goals.
                    </p>
                    <div className="rounded-xl bg-amber-50 px-3 py-2">
                      <p className="text-xs font-extrabold text-amber-900">
                        🎉 Bonus treat after victory!
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-amber-700">
                        Movie night, ice cream, game time, or more!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* ── BACK HOME ──────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.back()}
              className="w-full rounded-2xl bg-gradient-to-br from-blue-300 to-blue-400 px-8 py-3 font-extrabold text-blue-950 shadow-lg transition-all hover:shadow-xl"
            >
              Back Home
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </ChildPageFrame>
  );
}
