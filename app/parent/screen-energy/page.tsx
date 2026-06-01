'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { mockChildren } from '@/lib/mock-data';
import { saveChildDashboardState } from '@/lib/mission-state';
import { defaultRewardTemplates, getRewardDelta, RewardTemplate } from '@/lib/reward-templates';
import { formatWeekendScreenTime } from '@/lib/screen-energy';
import {
  buildDashboardStates,
  buildDashboardStatesFromSupabase,
  cardStyle,
  feedbackClass,
  loadSavedRewardTemplates,
  panelHighlightClass,
  statPulseClass,
  DashboardStateByChild,
  FeedbackState,
  FeedbackTone,
  PanelHighlight,
  StatKey,
  StatPulse,
} from '../_lib';

function EnergyActionButton({
  template,
  onReward,
}: {
  template: RewardTemplate;
  onReward: () => void;
}) {
  const delta = getRewardDelta(template);
  const isDeduction = delta < 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onReward}
      className={`flex min-h-[68px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:shadow-md active:scale-[0.98] ${
        isDeduction
          ? 'border-rose-100 bg-rose-50/70 text-rose-900 hover:bg-rose-50'
          : 'border-blue-100 bg-blue-50/80 text-blue-900 hover:bg-blue-50'
      }`}
    >
      <span>
        <span className="block text-sm font-black">
          {isDeduction ? '− Remove Screen Energy' : '+ Add Screen Energy'}
        </span>
        <span className="mt-0.5 block text-xs font-semibold opacity-70">{template.label}</span>
      </span>
      <span className={`shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-black shadow-sm ${
        isDeduction ? 'text-rose-600' : 'text-blue-700'
      }`}>
        {delta > 0 ? '+' : '-'}{Math.abs(delta)} ⚡
      </span>
    </motion.button>
  );
}

export default function ScreenEnergyPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>(
    defaultRewardTemplates
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastAction, setLastAction] = useState('');
  const [panelHighlight, setPanelHighlight] = useState<PanelHighlight | null>(null);
  const [statPulse, setStatPulse] = useState<StatPulse[]>([]);
  const [activeChildId, setActiveChildId] = useState(mockChildren[0]?.id ?? '');
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void buildDashboardStatesFromSupabase().then((hydrated) => {
      setDashboardStates(hydrated);
      setRewardTemplates(loadSavedRewardTemplates());
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
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
      if (statTimerRef.current) clearTimeout(statTimerRef.current);
    };
  }, []);

  // ── Feedback helpers ───────────────────────────────────────────────────────

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

  const getPanelClass = (childId: string) =>
    panelHighlight?.childId === childId ? panelHighlightClass[panelHighlight.tone] : '';

  const getStatClass = (childId: string, stat: StatKey) =>
    statPulse.some((item) => item.childId === childId && item.stat === stat)
      ? statPulseClass[stat]
      : '';

  // ── Reward handler ─────────────────────────────────────────────────────────

  const handleReward = (childId: string, template: RewardTemplate) => {
    const delta = getRewardDelta(template);
    const child = childrenData.find((c) => c.id === childId);
    if (child) {
      showFeedback(
        `${delta > 0 ? '+' : '-'}${Math.abs(delta)} energy ${
          delta > 0 ? 'added to' : 'applied to'
        } ${child.name}`,
        delta < 0 ? 'warning' : 'success'
      );
      highlightChildPanel(child.id, delta < 0 ? 'warning' : 'success');
      pulseChildStat(child.id, 'screenEnergy');
    }
    setChildrenData((cur) =>
      cur.map((c) => {
        if (c.id !== childId) return c;
        const nextEnergy = Math.max(0, c.screenEnergy + delta);
        const nextChild = { ...c, screenEnergy: nextEnergy };
        const nextState = saveChildDashboardState(c.id, c, { screenEnergy: nextEnergy });
        setDashboardStates((ds) => ({ ...ds, [c.id]: nextState }));
        return nextChild;
      })
    );
  };

  // ── Reset screen energy ────────────────────────────────────────────────────

  const resetScreenEnergy = (childId: string) => {
    setChildrenData((cur) =>
      cur.map((child) => {
        if (child.id !== childId) return child;
        const nextState = saveChildDashboardState(child.id, child, { screenEnergy: 0 });
        setDashboardStates((ds) => ({ ...ds, [child.id]: nextState }));
        showFeedback(`Screen Energy reset for ${child.name}.`, 'info');
        highlightChildPanel(child.id, 'info');
        pulseChildStat(child.id, 'screenEnergy');
        return { ...child, screenEnergy: 0 };
      })
    );
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const screenEnergyRewards = rewardTemplates.filter(
    (t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy'
  );
  const screenEnergyDeductions = rewardTemplates.filter(
    (t) => t.rewardType === 'deduction' && t.currencyType === 'screen-energy'
  );
  const activeChild = childrenData.find((child) => child.id === activeChildId);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl lg:hidden">📱</span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 lg:text-lg">Screen Energy</h1>
            <p className="hidden lg:block text-xs text-slate-400">
              {lastAction ? `Last: ${lastAction}` : 'Manage weekend screen time for each child'}
            </p>
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
        <div className="w-full max-w-2xl space-y-3 px-4 py-4 sm:px-6">

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm ${feedbackClass[feedback.tone]}`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5">
            {mockChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setActiveChildId(child.id)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                  activeChildId === child.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>

          {activeChild && (
            <motion.div
              key={activeChild.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`${cardStyle} bg-white/90 transition-all duration-300 ${getPanelClass(activeChild.id)}`}
            >
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 px-4 py-5 text-center">
                <p className="text-xs font-black uppercase tracking-wide text-blue-500">
                  {activeChild.name}&apos;s Screen Energy
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-4xl">⚡</span>
                  <span
                    className={`text-6xl font-black tabular-nums leading-none text-blue-700 transition-all duration-300 ${getStatClass(activeChild.id, 'screenEnergy')}`}
                  >
                    {activeChild.screenEnergy}
                  </span>
                  <span className="self-end pb-1 text-base font-black text-blue-600">Energy</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {formatWeekendScreenTime(activeChild.screenEnergy)}
                </p>
              </div>

              <div className="px-4 py-4">
                <h2 className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Daily Actions
                </h2>
                <div className="mt-2 grid gap-2">
                  {screenEnergyRewards.map((template) => (
                    <EnergyActionButton
                      key={template.id}
                      template={template}
                      onReward={() => handleReward(activeChild.id, template)}
                    />
                  ))}
                  {screenEnergyDeductions.map((template) => (
                    <EnergyActionButton
                      key={template.id}
                      template={template}
                      onReward={() => handleReward(activeChild.id, template)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <section className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wide text-slate-400">
                Weekly Maintenance
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Use these only when starting a new week.
              </p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => activeChild && resetScreenEnergy(activeChild.id)}
                disabled={!activeChild}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                Reset {activeChild?.name ?? 'Child'} for New Week
              </button>
              <button
                type="button"
                onClick={() => {
                  mockChildren.forEach((child) => resetScreenEnergy(child.id));
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95"
              >
                🔄 Reset All
              </button>
            </div>
          </section>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/60">
            <button
              type="button"
              onClick={() => setIsHelpExpanded((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold text-sky-900 transition hover:bg-sky-50 active:scale-[0.99]"
              aria-expanded={isHelpExpanded}
            >
              <span>{isHelpExpanded ? '▼' : '▶'} How Screen Energy Works</span>
            </button>
            {isHelpExpanded && (
              <div className="grid gap-2 border-t border-sky-100 px-4 py-3 text-sm text-sky-700 sm:grid-cols-3">
                <p className="rounded-xl bg-white/70 px-3 py-2">
                  📱 <strong>1 Energy = 10 minutes</strong> of weekend screen time.
                </p>
                <p className="rounded-xl bg-white/70 px-3 py-2">
                  ♾️ Energy is <strong>uncapped</strong> and accumulates throughout the week.
                </p>
                <p className="rounded-xl bg-white/70 px-3 py-2">
                  🔄 Reset each child at the <strong>start of every new week</strong>.
                </p>
              </div>
            )}
          </div>

        </div>
      </motion.main>
    </>
  );
}
