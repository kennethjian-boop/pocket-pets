'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
};

function getBossStatus(currentHp: number): BossStatus {
  if (currentHp === 0) {
    return {
      label: 'Defeated',
      icon: '🏆',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }

  if (currentHp <= 40) {
    return {
      label: 'Weak',
      icon: '🔴',
      className: 'bg-red-100 text-red-800 border-red-200',
    };
  }

  if (currentHp <= 75) {
    return {
      label: 'Wobbling',
      icon: '🟠',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    };
  }

  return {
    label: 'Strong',
    icon: '🟣',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  };
}

function getAttackIcon(attack: BossAttack) {
  const title = attack.title.toLowerCase();

  if (attack.sourceType === 'parent_bonus') return '🌟';
  if (title.includes('read') || title.includes('story')) return '📚';
  if (title.includes('kind')) return '💖';
  if (title.includes('clean') || title.includes('tidy') || title.includes('room')) {
    return '🧹';
  }

  return '✨';
}

export default function FamilyBoss() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;
  const child = getChild(childId);
  const [bossState, setBossState] = useState<BossBattleState>(() =>
    createDefaultBossBattleState()
  );

  useEffect(() => {
    const syncBossState = () => setBossState(readBossBattleState());

    syncBossState();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getBossBattleStorageKey()) {
        syncBossState();
      }
    };

    window.addEventListener('storage', handleStorage);
    const refreshTimer = window.setInterval(syncBossState, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const recentAttacks = bossState.attacks.slice(0, 8);
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

  const maxFamilyDamage = Math.max(...familyPower.map((p) => p.damage), 1);

  const rewardCards = [
    {
      title: `+${childReward.stars} Stars`,
      icon: '⭐',
      description: 'Spend these in the Reward Shop.',
      className: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-900',
      iconBg: 'bg-amber-100',
    },
    {
      title: `+${childReward.hearts} Heart${childReward.hearts === 1 ? '' : 's'}`,
      icon: '💖',
      description: 'Your pet bond grows stronger.',
      className: 'from-pink-50 to-rose-50 border-pink-200 text-pink-900',
      iconBg: 'bg-pink-100',
    },
    {
      title: `+${childReward.screenEnergy} Screen Energy`,
      icon: '⚡',
      description: `Adds ${screenMinutes} minutes to your weekend screen time bank.`,
      className: 'from-blue-50 to-sky-50 border-blue-200 text-blue-900',
      iconBg: 'bg-blue-100',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45 },
    },
  };

  const cardStyle = 'rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg';

  if (!child) {
    return <div>Child not found</div>;
  }

  return (
    <ChildPageFrame childId={childId}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4 pt-8 sm:px-6">
      <motion.div
        className="mx-auto max-w-[1400px] pb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
        <motion.header variants={itemVariants} className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Family Boss Battle
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-base font-medium text-slate-600">
            Real-life goals help your family defeat the boss together.
          </p>
        </motion.header>

        {/* ── BOSS HERO CARD ───────────────────────────────────────────────── */}
        <motion.section
          variants={itemVariants}
          className="mb-6 overflow-hidden rounded-[36px] border border-white/70 bg-white/92 shadow-2xl"
        >
          <div className="grid lg:grid-cols-[340px_1fr]">

            {/* LEFT: Boss artwork + flavor chips */}
            <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 via-indigo-100 to-pink-100 p-5 sm:p-6">
              <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-violet-700 shadow-sm backdrop-blur-sm">
                {bossState.weekLabel}
              </div>

              <div className="relative h-[280px] w-full max-w-[340px] sm:h-[340px]">
                <Image
                  src={bossState.bossImage}
                  alt={`${bossState.bossName} boss`}
                  fill
                  className={`object-contain transition duration-500 ${
                    bossState.isDefeated ? 'opacity-70 grayscale' : ''
                  }`}
                  sizes="(max-width: 1024px) 90vw, 400px"
                  priority
                />
                {bossState.isDefeated ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200 bg-white/95 px-5 py-3 text-lg font-extrabold text-emerald-700 shadow-lg"
                  >
                    🏆 Defeated!
                  </motion.div>
                ) : null}
              </div>

              {/* Flavor chips */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-sm">
                  🖥️ {bossState.bossTheme}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
                  ⚡ Tech gremlin
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                  🤝 Weak to teamwork
                </span>
              </div>
            </div>

            {/* RIGHT: Boss info, HP, rewards */}
            <div className="flex flex-col justify-between p-6 sm:p-8">

              {/* Status badges */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-sm font-bold ${status.className}`}>
                  {status.icon} Boss Status: {status.label}
                </span>
              </div>

              {/* Boss name + description */}
              <div className="mb-6">
                <h2 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                  {bossState.bossName}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  {bossState.bossDescription}
                </p>
              </div>

              {/* HP Bar */}
              <div className="mb-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                    Health
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {bossState.currentHp} / {bossState.maxHp} HP
                  </span>
                </div>
                <div className="relative h-8 overflow-hidden rounded-full bg-slate-100 shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 via-orange-400 to-amber-300"
                    style={{
                      boxShadow: hpPercentage <= 40
                        ? '0 2px 18px rgba(239,68,68,0.55)'
                        : '0 2px 14px rgba(251,146,60,0.45)',
                    }}
                    initial={false}
                    animate={{
                      width: `${hpPercentage}%`,
                      ...(hpPercentage <= 40 && !bossState.isDefeated
                        ? { opacity: [1, 0.78, 1] }
                        : {}),
                    }}
                    transition={{
                      width: { duration: 0.8, ease: 'easeOut' },
                      opacity: hpPercentage <= 40 && !bossState.isDefeated
                        ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                        : {},
                    }}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs font-semibold text-slate-400">
                  {Math.round(hpPercentage)}% remaining
                </p>
              </div>

              {/* Reward preview strip */}
              <div className="rounded-2xl bg-purple-50/80 p-4">
                <div className="mb-2 text-xs font-extrabold uppercase tracking-widest text-purple-600">
                  Each Child Wins
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-2xl bg-white/90 px-3 py-1.5 text-sm font-extrabold text-amber-700 shadow-sm">
                    ⭐ {childReward.stars} Stars
                  </span>
                  <span className="rounded-2xl bg-white/90 px-3 py-1.5 text-sm font-extrabold text-pink-700 shadow-sm">
                    💖 {childReward.hearts} Heart{childReward.hearts === 1 ? '' : 's'}
                  </span>
                  <span className="rounded-2xl bg-white/90 px-3 py-1.5 text-sm font-extrabold text-blue-700 shadow-sm">
                    ⚡ {childReward.screenEnergy} Energy = {screenMinutes} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── VICTORY BANNER ───────────────────────────────────────────────── */}
        {bossState.isDefeated ? (
          <motion.section
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 text-center shadow-lg"
          >
            <h2 className="text-3xl font-extrabold text-slate-900">🎉 Family Victory!</h2>
            <p className="mt-2 text-base font-medium text-slate-600">
              You defeated {bossState.bossName} together!
            </p>
            {bossState.rewardClaimed ? (
              <div className="mx-auto mt-4 max-w-sm rounded-2xl bg-white/80 px-4 py-3">
                <div className="font-extrabold text-emerald-700">✅ Rewards claimed by parent</div>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Your victory rewards have been added!
                </p>
              </div>
            ) : (
              <div className="mx-auto mt-4 max-w-sm rounded-2xl bg-white/80 px-4 py-3">
                <div className="font-extrabold text-purple-700">🔒 Waiting for parent</div>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Ask a parent to claim the family rewards.
                </p>
              </div>
            )}
          </motion.section>
        ) : null}

        {/* ── SECOND ROW: Attacks + Rewards ────────────────────────────────── */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* LEFT: Recent Family Attacks */}
          <motion.section variants={itemVariants} className={cardStyle}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-slate-900">Recent Family Attacks</h2>
                <p className="mt-0.5 text-sm font-medium text-slate-500">
                  Every checked goal helps the family win together.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600">
                Battle Log
              </span>
            </div>

            {recentAttacks.length > 0 ? (
              <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                {recentAttacks.map((attack, i) => (
                  <div
                    key={attack.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                      i % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                      {getAttackIcon(attack)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-extrabold text-violet-800">
                          {attack.childName}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                          {attack.sourceType === 'mission' ? 'Mission' : 'Bonus'}
                        </span>
                      </div>
                      <p className="truncate text-xs font-semibold text-slate-600">
                        {attack.title}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-extrabold text-red-700">
                      -{attack.damage} HP
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                No attacks yet. Complete goals and ask a parent to verify them.
              </div>
            )}
          </motion.section>

          {/* RIGHT: Victory Rewards + Claim Status */}
          <div className="space-y-4">
            <motion.section variants={itemVariants} className={cardStyle}>
              <h2 className="text-xl font-extrabold text-slate-900">🎁 Family Victory Rewards</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Everyone gets these when the boss is defeated.
              </p>

              <div className="mt-4 space-y-3">
                {rewardCards.map((reward) => (
                  <motion.div
                    key={reward.title}
                    whileHover={{ y: -2 }}
                    className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-r p-4 shadow-sm transition hover:shadow-md ${reward.className}`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${reward.iconBg}`}>
                      {reward.icon}
                    </div>
                    <div>
                      <div className="text-base font-extrabold">{reward.title}</div>
                      <p className="mt-0.5 text-xs font-semibold leading-5 opacity-80">
                        {reward.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className={cardStyle}>
              {bossState.rewardClaimed ? (
                <div>
                  <h3 className="text-lg font-extrabold text-emerald-700">✅ Rewards Claimed</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Your victory rewards have been added!
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-extrabold text-purple-700">🔒 Waiting for Parent</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Ask a parent to claim the family rewards after the boss is defeated.
                  </p>
                </div>
              )}
            </motion.section>
          </div>
        </div>

        {/* ── BOTTOM ROW: Family Power + How to Help ───────────────────────── */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* Family Power with contribution bars */}
          <motion.section variants={itemVariants} className={cardStyle}>
            <h2 className="text-xl font-extrabold text-slate-900">
              This Week&apos;s Family Power
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Every attack helps the family win together.
            </p>

            <div className="mt-5 space-y-5">
              {familyPower.map((power, idx) => {
                const barWidth = power.damage > 0
                  ? (power.damage / maxFamilyDamage) * 100
                  : 0;
                const avatarColors = [
                  'bg-violet-200 text-violet-800',
                  'bg-pink-200 text-pink-800',
                  'bg-amber-200 text-amber-800',
                  'bg-teal-200 text-teal-800',
                ];
                const barColors = [
                  'from-violet-400 to-purple-400',
                  'from-pink-400 to-rose-400',
                  'from-amber-400 to-orange-400',
                  'from-teal-400 to-cyan-400',
                ];
                const avatarColor = avatarColors[idx % avatarColors.length];
                const barColor = barColors[idx % barColors.length];
                return (
                  <div key={power.childId}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ${avatarColor}`}>
                          {power.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-slate-900">{power.name}</p>
                          <p className="text-xs font-semibold text-slate-400">
                            {power.attackCount} {power.attackCount === 1 ? 'attack' : 'attacks'}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-extrabold text-purple-800">
                        {power.damage} dmg
                      </span>
                    </div>
                    <div className="h-5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                        style={{ boxShadow: '0 1px 8px rgba(139,92,246,0.3)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: idx * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Unified Tips & Celebration card */}
          <motion.section variants={itemVariants} className={cardStyle}>
            <h2 className="text-xl font-extrabold text-slate-900">🗺️ Family Tips &amp; Celebration</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Work together and great things happen!
            </p>

            <div className="mt-4 space-y-2">
              {[
                { icon: '✅', text: 'Complete your real-life goals.' },
                { icon: '👨‍👩‍👧', text: 'Ask a parent to check them.' },
                { icon: '💥', text: 'Each checked goal damages the boss.' },
                { icon: '🤝', text: 'Work together as a family to win!' },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700"
                >
                  <span className="text-base">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            <p className="mt-3 rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-extrabold text-purple-800">
              🔒 Only parents can verify goals and send attacks.
            </p>

            <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3">
              <p className="text-sm font-extrabold text-amber-900">🎉 Bonus Family Celebration</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-amber-700">
                After victory, a parent may choose a family treat — movie night, playground trip, ice cream, extra bedtime story, or game time!
              </p>
            </div>
          </motion.section>
        </div>

        {/* ── BACK HOME ────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mt-2 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            className="w-full rounded-2xl bg-gradient-to-br from-blue-300 to-blue-400 px-8 py-3 font-extrabold text-blue-950 shadow-lg transition-all hover:shadow-xl sm:w-auto"
          >
            Back Home
          </motion.button>
        </motion.div>
        </motion.div>
      </div>
    </ChildPageFrame>
  );
}
