'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { mockChildren } from '@/lib/mock-data';
import { saveChildDashboardState } from '@/lib/mission-state';
import {
  BOSS_DAMAGE_OPTIONS,
  BOSS_REWARD,
  BossBattleState,
  BossRewardConfig,
  addBossAttack,
  claimBossRewardsForChildren,
  createDefaultBossBattleState,
  getBossBattleStorageKey,
  getBossRewardForChild,
  readBossBattleState,
  setBossRewardForChild,
  startNextBossBattle,
  writeBossBattleState,
} from '@/lib/boss-battle';
import {
  buildDashboardStates,
  cardStyle,
  feedbackClass,
  panelHighlightClass,
  statPulseClass,
  DashboardStateByChild,
  FeedbackState,
  FeedbackTone,
  MockChild,
  PanelHighlight,
  StatKey,
  StatPulse,
} from '../_lib';

type RewardKey = keyof BossRewardConfig;

const rewardMeta: Record<
  RewardKey,
  { label: string; icon: string; tone: string; button: string }
> = {
  stars: {
    label: 'Stars',
    icon: '⭐',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    button: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  },
  hearts: {
    label: 'Hearts',
    icon: '❤️',
    tone: 'border-pink-200 bg-pink-50 text-pink-900',
    button: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
  },
  screenEnergy: {
    label: 'Energy',
    icon: '⚡',
    tone: 'border-blue-200 bg-blue-50 text-blue-900',
    button: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
};

function applyRewardDefaults(state: BossBattleState, children: MockChild[]) {
  return children.reduce(
    (nextState, child) =>
      nextState.rewardsByChild?.[child.id]
        ? nextState
        : setBossRewardForChild(nextState, child.id, BOSS_REWARD),
    state
  );
}

function clampRewardValue(value: number) {
  return Math.max(0, Math.min(999, Math.floor(value)));
}

function formatAttackTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getAttackIcon(sourceType: string, title: string) {
  const normalized = title.toLowerCase();
  if (sourceType === 'parent_bonus') return '❤️';
  if (normalized.includes('read')) return '⭐';
  if (normalized.includes('clean') || normalized.includes('tidy')) return '✨';
  if (normalized.includes('brush') || normalized.includes('bed')) return '🌙';
  return '⚔️';
}

function RewardStepper({
  rewardKey,
  value,
  disabled,
  onChange,
}: {
  rewardKey: RewardKey;
  value: number;
  disabled: boolean;
  onChange: (nextValue: number) => void;
}) {
  const meta = rewardMeta[rewardKey];

  return (
    <div className={`rounded-2xl border p-3 ${meta.tone}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-black">
        <span className="text-lg">{meta.icon}</span>
        <span>{meta.label}</span>
      </div>
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= 0}
          className={`h-11 rounded-xl text-lg font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${meta.button}`}
          aria-label={`Decrease ${meta.label}`}
        >
          -
        </button>
        <div className="rounded-xl bg-white px-3 py-2 text-center text-2xl font-black tabular-nums shadow-sm">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          className={`h-11 rounded-xl text-lg font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${meta.button}`}
          aria-label={`Increase ${meta.label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function FamilyBossPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [bossState, setBossState] = useState<BossBattleState>(() =>
    applyRewardDefaults(createDefaultBossBattleState(), mockChildren)
  );
  const [bonusChildId, setBonusChildId] = useState(mockChildren[0]?.id ?? '');
  const [bonusTitle, setBonusTitle] = useState('');
  const [bonusDamage, setBonusDamage] = useState<number>(10);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastAction, setLastAction] = useState('');
  const [panelHighlight, setPanelHighlight] = useState<PanelHighlight | null>(null);
  const [statPulse, setStatPulse] = useState<StatPulse[]>([]);
  const [bossPulse, setBossPulse] = useState(false);
  const [bossDamageLabel, setBossDamageLabel] = useState('');
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bossTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hydrated = buildDashboardStates(true);
      const storedBoss = applyRewardDefaults(readBossBattleState(), mockChildren);
      setDashboardStates(hydrated);
      setBossState(storedBoss);
      setChildrenData((cur) =>
        cur.map((child) => {
          const s = hydrated[child.id];
          return { ...child, stars: s.stars, hearts: s.hearts, screenEnergy: s.screenEnergy };
        })
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [setDashboardStates]);

  useEffect(() => {
    const syncBossState = () =>
      setBossState(applyRewardDefaults(readBossBattleState(), mockChildren));
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getBossBattleStorageKey()) syncBossState();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
      if (statTimerRef.current) clearTimeout(statTimerRef.current);
      if (bossTimerRef.current) clearTimeout(bossTimerRef.current);
    };
  }, []);

  const showFeedback = (message: string, tone: FeedbackTone = 'success') => {
    setFeedback({ message, tone });
    setLastAction(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 1800);
  };

  const highlightChildPanel = (childId: string, tone: FeedbackTone) => {
    setPanelHighlight({ childId, tone });
    if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
    panelTimerRef.current = setTimeout(() => {
      setPanelHighlight(null);
      panelTimerRef.current = null;
    }, 800);
  };

  const pulseChildStat = (childId: string, stat: StatKey) => {
    if (!childId) return;
    setStatPulse((cur) => [
      ...cur.filter((item) => !(item.childId === childId && item.stat === stat)),
      { childId, stat },
    ]);
    if (statTimerRef.current) clearTimeout(statTimerRef.current);
    statTimerRef.current = setTimeout(() => {
      setStatPulse([]);
      statTimerRef.current = null;
    }, 650);
  };

  const showBossFeedback = (label: string) => {
    setBossPulse(true);
    setBossDamageLabel(label);
    if (bossTimerRef.current) clearTimeout(bossTimerRef.current);
    bossTimerRef.current = setTimeout(() => {
      setBossPulse(false);
      setBossDamageLabel('');
      bossTimerRef.current = null;
    }, 900);
  };

  const getPanelClass = (childId: string) =>
    panelHighlight?.childId === childId ? panelHighlightClass[panelHighlight.tone] : '';

  const getStatClass = (childId: string, stat: StatKey) =>
    statPulse.some((item) => item.childId === childId && item.stat === stat)
      ? statPulseClass[stat]
      : '';

  const handleAddBonusAttack = () => {
    const child = childrenData.find((c) => c.id === bonusChildId);
    const title = bonusTitle.trim();
    if (!child) return;
    if (!title) {
      showFeedback('Add a reason before launching the bonus attack.', 'warning');
      return;
    }
    const nextBossState = addBossAttack(readBossBattleState(), {
      childId: child.id,
      childName: child.name,
      sourceType: 'parent_bonus',
      title,
      damage: bonusDamage,
    });
    writeBossBattleState(nextBossState);
    setBossState(applyRewardDefaults(nextBossState, childrenData));
    setBonusTitle('');
    showFeedback(`${child.name} launched a ${bonusDamage} damage bonus attack.`, 'boss');
    highlightChildPanel(child.id, 'boss');
    showBossFeedback(`-${bonusDamage} HP`);
  };

  const handleRewardChange = (
    childId: string,
    rewardKey: RewardKey,
    nextValue: number
  ) => {
    const currentState = applyRewardDefaults(readBossBattleState(), childrenData);
    if (currentState.rewardClaimed) {
      showFeedback('Rewards are locked after claiming. Start the next boss to edit again.', 'info');
      return;
    }
    const currentReward = getBossRewardForChild(currentState, childId);
    const nextReward = {
      ...currentReward,
      [rewardKey]: clampRewardValue(nextValue),
    };
    const nextState = setBossRewardForChild(currentState, childId, nextReward);
    writeBossBattleState(nextState);
    setBossState(nextState);
  };

  const handleClaimBossRewards = () => {
    const result = claimBossRewardsForChildren(childrenData, (child, updates) => {
      const nextState = saveChildDashboardState(child.id, child, updates);
      setDashboardStates((cur) => ({ ...cur, [child.id]: nextState }));
    });
    setBossState(applyRewardDefaults(result.state, childrenData));
    setChildrenData(result.children);
    if (result.state.rewardClaimed) {
      showFeedback('Victory rewards claimed!', 'success');
      result.children.forEach((child) => {
        highlightChildPanel(child.id, 'success');
        pulseChildStat(child.id, 'stars');
        pulseChildStat(child.id, 'hearts');
        pulseChildStat(child.id, 'screenEnergy');
      });
    }
  };

  const handleStartNextBossBattle = () => {
    const currentBossState = readBossBattleState();
    if (!currentBossState.isDefeated || !currentBossState.rewardClaimed) return;
    const nextState = applyRewardDefaults(startNextBossBattle(currentBossState), childrenData);
    writeBossBattleState(nextState);
    setBossState(nextState);
    showFeedback(`Started next boss battle: ${nextState.bossName}!`, 'boss');
    showBossFeedback('New boss');
  };

  const hpPercentage =
    bossState.maxHp > 0
      ? Math.max(0, Math.min(100, (bossState.currentHp / bossState.maxHp) * 100))
      : 0;
  const latestAttack = bossState.attacks[0];
  const totalDamage = bossState.attacks.reduce((sum, attack) => sum + attack.damage, 0);

  const childContributions = useMemo(
    () =>
      childrenData.map((child) => {
        const attacks = bossState.attacks.filter((attack) => attack.childId === child.id);
        const damage = attacks.reduce((sum, attack) => sum + attack.damage, 0);
        const bonusCount = attacks.filter((attack) => attack.sourceType === 'parent_bonus').length;
        return {
          child,
          attacks,
          damage,
          bonusCount,
          latest: attacks[0],
        };
      }),
    [bossState.attacks, childrenData]
  );

  const maxContribution = Math.max(...childContributions.map((item) => item.damage), 1);
  const rewardLocked = bossState.rewardClaimed;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-xl">🐾</span>
          <span className="text-base font-extrabold text-slate-800">
            Pocket <span className="text-pink-500">Pets</span>
          </span>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-xl font-black text-slate-900">Family Boss</h1>
          {lastAction ? (
            <p className="text-xs font-semibold text-slate-400">Last: {lastAction}</p>
          ) : (
            <p className="text-xs font-semibold text-slate-400">
              Run the weekly family challenge and victory rewards.
            </p>
          )}
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

      <motion.main
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          <AnimatePresence>
            {feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className={`rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${feedbackClass[feedback.tone]}`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          <section className="overflow-hidden rounded-[2rem] border border-purple-200 bg-white shadow-lg">
            <div className="h-2 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300" />
            <div className="grid gap-0 lg:grid-cols-[420px_1fr]">
              <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
                <div className="absolute left-5 top-5 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-violet-700 shadow-sm">
                  {bossState.weekLabel}
                </div>
                <motion.div
                  animate={bossPulse ? { scale: [1, 1.04, 1], rotate: [0, -1, 1, 0] } : {}}
                  transition={{ duration: 0.45 }}
                  className="relative h-[260px] w-full max-w-[360px] sm:h-[330px]"
                >
                  <Image
                    src={bossState.bossImage}
                    alt={`${bossState.bossName} boss`}
                    fill
                    className={`object-contain drop-shadow-2xl transition duration-500 ${
                      bossState.isDefeated ? 'opacity-70 grayscale' : ''
                    }`}
                    sizes="(max-width: 1024px) 90vw, 420px"
                    priority
                  />
                  <AnimatePresence>
                    {bossDamageLabel && (
                      <motion.span
                        key={bossDamageLabel}
                        initial={{ opacity: 0, y: 10, scale: 0.85 }}
                        animate={{ opacity: 1, y: -34, scale: 1 }}
                        exit={{ opacity: 0, y: -52 }}
                        className="absolute right-8 top-10 rounded-full bg-white px-4 py-2 text-lg font-black text-purple-700 shadow-lg"
                      >
                        {bossDamageLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-9">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
                      bossState.isDefeated
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : hpPercentage <= 40
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-purple-200 bg-purple-50 text-purple-700'
                    }`}
                  >
                    {bossState.isDefeated
                      ? 'Victory phase'
                      : hpPercentage <= 40
                        ? 'Final stretch'
                        : 'Weekly challenge'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                    {bossState.attacks.length} attacks
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    {totalDamage} family damage
                  </span>
                </div>

                <h2 className="text-4xl font-black leading-none text-slate-950 sm:text-5xl">
                  {bossState.bossName}
                </h2>
                <p className="mt-2 text-lg font-black text-purple-700">{bossState.bossTheme}</p>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                  {bossState.bossDescription}
                </p>

                <div className="mt-7 space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Boss Health
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        {bossState.currentHp} / {bossState.maxHp} HP
                      </p>
                    </div>
                    <p className="text-right text-sm font-black text-slate-500">
                      {Math.round(hpPercentage)}% remaining
                    </p>
                  </div>
                  <div
                    className={`relative h-8 overflow-hidden rounded-full bg-slate-100 shadow-inner transition ${
                      bossPulse ? 'ring-4 ring-purple-200' : ''
                    }`}
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 via-orange-300 to-amber-200"
                      initial={false}
                      animate={{ width: `${hpPercentage}%` }}
                      transition={{ duration: 0.75, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Latest family moment
                  </p>
                  {latestAttack ? (
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {getAttackIcon(latestAttack.sourceType, latestAttack.title)}{' '}
                      {latestAttack.childName} — {latestAttack.title}{' '}
                      <span className="text-rose-600">-{latestAttack.damage} HP</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      No attacks yet. Verified goals and bonus moments will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {childContributions.map(({ child, attacks, damage, bonusCount, latest }) => (
              <article
                key={child.id}
                className={`rounded-3xl border border-white/80 bg-white p-5 shadow-sm transition-all duration-300 ${getPanelClass(child.id)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 text-2xl font-black text-purple-700">
                    {child.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-black text-slate-900">{child.name}</h3>
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                        {attacks.length} attacks
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      ⚔️ {damage} damage dealt
                      {bonusCount > 0 ? ` · ❤️ ${bonusCount} bonus` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                    initial={false}
                    animate={{ width: `${(damage / maxContribution) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="mt-3 min-h-5 truncate text-xs font-bold text-slate-400">
                  {latest ? `Latest: ${latest.title}` : 'Ready for the first family attack.'}
                </p>
              </article>
            ))}
          </section>

          {bossState.isDefeated && (
            <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 text-center shadow-lg">
              <h2 className="text-3xl font-black text-slate-900">🏆 Boss Defeated!</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-600">
                The family challenge is complete. Review the configured rewards, claim them,
                then start the next cozy boss event.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClaimBossRewards}
                  disabled={bossState.rewardClaimed}
                  className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {bossState.rewardClaimed ? 'Rewards Claimed ✓' : 'Claim Victory Rewards'}
                </button>
                <button
                  type="button"
                  onClick={handleStartNextBossBattle}
                  disabled={!bossState.rewardClaimed}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Start Next Boss →
                </button>
              </div>
            </section>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className={cardStyle}>
              <div className="border-b border-slate-100 px-5 py-5">
                <h2 className="text-xl font-black text-slate-900">⚔️ Quick Attack Cards</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Give extra boss damage for real-life bonus moments outside goals.
                </p>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    1. Select child
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {childrenData.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setBonusChildId(child.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-95 ${
                          bonusChildId === child.id
                            ? 'border-purple-300 bg-purple-50 text-purple-800 ring-2 ring-purple-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-black shadow-sm">
                          {child.name.charAt(0)}
                        </span>
                        <span className="font-black">{child.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    2. Select attack strength
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {BOSS_DAMAGE_OPTIONS.map((damage) => (
                      <button
                        key={damage}
                        type="button"
                        onClick={() => setBonusDamage(damage)}
                        className={`min-h-[76px] rounded-3xl border text-center transition active:scale-95 ${
                          bonusDamage === damage
                            ? 'border-purple-300 bg-purple-600 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        <span className="block text-2xl font-black">+{damage}</span>
                        <span className="text-xs font-black uppercase tracking-wide">damage</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-400">
                    3. Enter reason
                  </span>
                  <input
                    type="text"
                    value={bonusTitle}
                    onChange={(e) => setBonusTitle(e.target.value)}
                    placeholder="e.g. helped tidy up"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAddBonusAttack}
                  disabled={!bonusTitle.trim()}
                  className="w-full rounded-3xl bg-purple-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Launch Attack →
                </button>
              </div>
            </section>

            <section className={cardStyle}>
              <div className="border-b border-slate-100 px-5 py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">🎁 Victory Rewards</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Configure Stars, Hearts, and Energy independently for each child.
                    </p>
                  </div>
                  {rewardLocked && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                      Locked after claim
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-5">
                {childrenData.map((child) => {
                  const reward = getBossRewardForChild(bossState, child.id);
                  return (
                    <article
                      key={child.id}
                      className={`rounded-3xl border border-slate-100 bg-slate-50 p-4 ${getPanelClass(child.id)}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-slate-900">{child.name} Rewards</h3>
                        <div className="flex gap-2 text-xs font-black">
                          <span className={`rounded-full bg-white px-2 py-1 text-amber-700 ${getStatClass(child.id, 'stars')}`}>
                            ⭐ {child.stars}
                          </span>
                          <span className={`rounded-full bg-white px-2 py-1 text-pink-700 ${getStatClass(child.id, 'hearts')}`}>
                            ❤️ {child.hearts}
                          </span>
                          <span className={`rounded-full bg-white px-2 py-1 text-blue-700 ${getStatClass(child.id, 'screenEnergy')}`}>
                            ⚡ {child.screenEnergy}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {(['stars', 'hearts', 'screenEnergy'] as RewardKey[]).map((rewardKey) => (
                          <RewardStepper
                            key={rewardKey}
                            rewardKey={rewardKey}
                            value={reward[rewardKey]}
                            disabled={rewardLocked}
                            onChange={(nextValue) =>
                              handleRewardChange(child.id, rewardKey, nextValue)
                            }
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleClaimBossRewards}
                    disabled={!bossState.isDefeated || bossState.rewardClaimed}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {bossState.rewardClaimed ? 'Rewards Claimed ✓' : 'Claim Victory Rewards'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNextBossBattle}
                    disabled={!bossState.isDefeated || !bossState.rewardClaimed}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Start Next Boss →
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className={cardStyle}>
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">📜 Family Attack Timeline</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Recent verified goals and bonus attacks, newest first.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                  {bossState.attacks.length}
                </span>
              </div>
            </div>

            {bossState.attacks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {bossState.attacks.slice(0, 12).map((attack) => (
                  <article
                    key={attack.id}
                    className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl">
                        {getAttackIcon(attack.sourceType, attack.title)}
                      </span>
                      <div className="sm:hidden">
                        <p className="font-black text-slate-900">{attack.childName}</p>
                        <p className="text-xs font-bold text-slate-400">
                          {formatAttackTime(attack.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="hidden items-center gap-2 sm:flex">
                        <p className="font-black text-slate-900">{attack.childName}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
                          {attack.sourceType === 'mission' ? 'Goal verified' : 'Bonus attack'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {formatAttackTime(attack.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-600">
                        “{attack.title}”
                      </p>
                    </div>
                    <span className="justify-self-start rounded-full bg-rose-50 px-3 py-1.5 text-sm font-black text-rose-700 sm:justify-self-end">
                      ⚔️ -{attack.damage} HP
                    </span>
                  </article>
                ))}
                {bossState.attacks.length > 12 && (
                  <div className="px-5 py-4 text-sm font-bold text-slate-400">
                    +{bossState.attacks.length - 12} more attacks recorded
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-base font-black text-slate-700">No attacks yet</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Verify goals or launch a bonus attack to start the family timeline.
                </p>
              </div>
            )}
          </section>
        </div>
      </motion.main>
    </>
  );
}
