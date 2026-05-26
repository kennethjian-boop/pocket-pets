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
import { PillButton } from '../_components/PillButton';

export default function ScreenEnergyPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [dashboardStates, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>(
    defaultRewardTemplates
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastAction, setLastAction] = useState('');
  const [panelHighlight, setPanelHighlight] = useState<PanelHighlight | null>(null);
  const [statPulse, setStatPulse] = useState<StatPulse[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hydrated = buildDashboardStates(true);
      setDashboardStates(hydrated);
      setRewardTemplates(loadSavedRewardTemplates());
      setChildrenData((cur) =>
        cur.map((child) => {
          const s = hydrated[child.id];
          return { ...child, stars: s.stars, hearts: s.hearts, screenEnergy: s.screenEnergy };
        })
      );
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-xl">🐾</span>
          <span className="text-base font-extrabold text-slate-800">
            Pocket <span className="text-pink-500">Pets</span>
          </span>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-lg font-extrabold text-slate-900">Screen Energy</h1>
          {lastAction ? (
            <p className="text-xs text-slate-400">Last: {lastAction}</p>
          ) : (
            <p className="text-xs text-slate-400">Manage weekend screen time for each child</p>
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

      {/* Body */}
      <motion.main
        className="flex-1 overflow-y-auto flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-[1400px] space-y-6 px-6 py-6 lg:px-10 lg:py-8">

          {/* Feedback banner */}
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

          {/* Explainer */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-800">
              📱 <strong>Screen Energy</strong> is an uncapped weekend time bank.{' '}
              <strong>1 Energy = 10 minutes</strong> of screen time. Reset each child at the
              start of a new week.
            </p>
          </div>

          {/* Per-child energy cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {childrenData.map((child) => (
              <div
                key={child.id}
                className={`${cardStyle} bg-blue-50/40 transition-all duration-300 ${getPanelClass(child.id)}`}
              >
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {child.name} — Screen Energy
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    1 Energy = 10 minutes of screen time
                  </p>
                </div>
                <div className="px-6 py-5">
                  <div className="mb-4 flex items-end gap-3">
                    <span
                      className={`text-5xl font-extrabold tabular-nums text-blue-700 transition-all duration-300 ${getStatClass(child.id, 'screenEnergy')}`}
                    >
                      {child.screenEnergy}
                    </span>
                    <span className="mb-1.5 text-sm font-semibold text-slate-500">
                      {formatWeekendScreenTime(child.screenEnergy)}
                    </span>
                  </div>

                  {(screenEnergyRewards.length > 0 || screenEnergyDeductions.length > 0) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {screenEnergyRewards.map((template) => (
                        <PillButton
                          key={template.id}
                          template={template}
                          onReward={() => handleReward(child.id, template)}
                        />
                      ))}
                      {screenEnergyDeductions.map((template) => (
                        <PillButton
                          key={template.id}
                          template={template}
                          onReward={() => handleReward(child.id, template)}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => resetScreenEnergy(child.id)}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-95"
                  >
                    Reset for New Week
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Reset all shortcut */}
          <div className={cardStyle}>
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reset All Children</h3>
                <p className="mt-0.5 text-sm text-slate-400">
                  Start a new week — clear screen energy for all children at once.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  mockChildren.forEach((child) => resetScreenEnergy(child.id));
                }}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:scale-95"
              >
                🔄 Reset All
              </button>
            </div>
          </div>

          {/* How Screen Energy works */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-6 py-5">
            <h3 className="text-sm font-extrabold text-sky-900">How Screen Energy Works</h3>
            <div className="mt-3 grid gap-3 text-sm text-sky-700 sm:grid-cols-3">
              <p className="rounded-xl bg-white/70 px-4 py-3">
                📱 <strong>1 Energy = 10 minutes</strong> of weekend screen time.
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                ♾️ Energy is <strong>uncapped</strong> and accumulates throughout the week.
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                🔄 Reset each child at the <strong>start of every new week</strong>.
              </p>
            </div>
          </div>

        </div>
      </motion.main>
    </>
  );
}
