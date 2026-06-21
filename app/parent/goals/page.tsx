'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { mockChildren } from '@/lib/mock-data';
import {
  dailyMissionTemplates,
  getDailyGoalsForChild,
  goalBank,
  mergeWithDefaultChildState,
  randomizeAuthoritativeDailyGoalsForChild,
  readChildDashboardState,
  saveChildDashboardState,
  setAuthoritativeDailyGoalsForChild,
  setGoalSetupMode,
} from '@/lib/mission-state';
import { verifyDailyGoal } from '@/lib/goal-verification';
import {
  buildDashboardStates,
  buildDashboardStatesFromSupabase,
  buildGoalsByChild,
  buildGoalModes,
  cardStyle,
  feedbackClass,
  panelHighlightClass,
  statPulseClass,
  DashboardStateByChild,
  FeedbackState,
  FeedbackTone,
  GoalsByChild,
  GoalEditorState,
  GoalModeState,
  GoalSelectionState,
  MockChild,
  PanelHighlight,
  StatKey,
  StatPulse,
} from '../_lib';

export default function GoalsPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [dashboardStates, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [goalsByChild, setGoalsByChild] = useState<GoalsByChild>(
    () => buildGoalsByChild(false)
  );
  const [goalEditors, setGoalEditors] = useState<GoalEditorState>({});
  const [goalSelections, setGoalSelections] = useState<GoalSelectionState>(() =>
    Object.fromEntries(
      mockChildren.map((child) => [child.id, dailyMissionTemplates.map((g) => g.id)])
    )
  );
  const [goalModes, setGoalModes] = useState<GoalModeState>(
    () => buildGoalModes(false)
  );
  const [activeChildId, setActiveChildId] = useState(mockChildren[0]?.id ?? '');
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
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
      void buildDashboardStatesFromSupabase().then((hydrated) => {
      const hydratedGoals = buildGoalsByChild(true);
      const hydratedModes = buildGoalModes(true);
      setDashboardStates(hydrated);
      setGoalsByChild(hydratedGoals);
      setGoalModes(hydratedModes);
      setGoalSelections(
        Object.fromEntries(
          mockChildren.map((child) => [
            child.id,
            (hydratedGoals[child.id] ?? dailyMissionTemplates).map((g) => g.id),
          ])
        )
      );
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

  // ── Goal completion reset helper ───────────────────────────────────────────

  const resetGoalCompletionForChild = (child: MockChild) => {
    const currentState =
      dashboardStates[child.id] ??
      mergeWithDefaultChildState(child, readChildDashboardState(child.id));
    const currentGoals = goalsByChild[child.id] ?? dailyMissionTemplates;

    currentGoals.forEach((goal) => {
      if (!currentState.completedMissions[goal.id]) return;
      verifyDailyGoal(child, goal, false);
    });

    const nextState = saveChildDashboardState(child.id, child, { completedMissions: {} });
    setDashboardStates((cur) => ({ ...cur, [child.id]: nextState }));
    setChildrenData((cur) =>
      cur.map((item) =>
        item.id === child.id
          ? {
              ...item,
              stars: nextState.stars,
              hearts: nextState.hearts,
              screenEnergy: nextState.screenEnergy,
            }
          : item
      )
    );
  };

  // ── Mission completion ─────────────────────────────────────────────────────

  const handleMissionCompletion = (
    childId: string,
    missionId: string,
    completed: boolean
  ) => {
    const mission = (goalsByChild[childId] ?? dailyMissionTemplates).find(
      (item) => item.id === missionId
    );
    if (!mission) return;
    const affectedChild = childrenData.find((c) => c.id === childId);
    const bossDamage = mission.bossDamage ?? 10;

    if (affectedChild) {
      if (completed) {
        showFeedback(
          `${mission.title} verified for ${affectedChild.name}. Boss took ${bossDamage} damage.`,
          'success'
        );
        highlightChildPanel(affectedChild.id, 'success');
        pulseChildStat(affectedChild.id, 'stars');
      } else {
        showFeedback(`${mission.title} unverified for ${affectedChild.name}.`, 'info');
        highlightChildPanel(affectedChild.id, 'info');
        pulseChildStat(affectedChild.id, 'stars');
      }
    }

    if (!affectedChild) return;
    const { childState } = verifyDailyGoal(affectedChild, mission, completed);
    setDashboardStates((cur) => ({ ...cur, [childId]: childState }));
    setChildrenData((cur) =>
      cur.map((child) =>
        child.id === childId
          ? {
              ...child,
              stars: childState.stars,
              hearts: childState.hearts,
              screenEnergy: childState.screenEnergy,
            }
          : child
      )
    );
    if (childState.eggMessage) showFeedback(childState.eggMessage, 'success');
  };

  // ── Goal randomise ─────────────────────────────────────────────────────────

  const handleRandomizeGoals = async (childId: string) => {
    const child = childrenData.find((c) => c.id === childId);
    if (!child) return;

    const currentGoals = goalsByChild[childId] ?? dailyMissionTemplates;
    const state =
      dashboardStates[childId] ??
      mergeWithDefaultChildState(child, readChildDashboardState(childId));
    const completedCount = currentGoals.filter(
      (m) => state.completedMissions[m.id]
    ).length;

    if (completedCount > 0) {
      showFeedback(
        `${child.name} has ${completedCount} completed goal${completedCount > 1 ? 's' : ''}. Reset completions before randomising.`,
        'warning'
      );
      return;
    }

    let record;
    try {
      record = await randomizeAuthoritativeDailyGoalsForChild(childId);
    } catch (error) {
      console.error('[Goals] Randomise save failed', { childId, error });
      showFeedback(`Could not save ${child.name}'s goals. Check Supabase daily_goals setup.`, 'warning');
      return;
    }
    const goals = record.goalItems
      ? record.goalItems.map(({ completed, ...goal }) => {
          void completed;
          return goal;
        })
      : getDailyGoalsForChild(childId);
    setGoalsByChild((cur) => ({ ...cur, [childId]: goals }));
    setGoalSelections((cur) => ({ ...cur, [childId]: record.goals }));
    setGoalModes((cur) => ({ ...cur, [childId]: 'random' }));
    setGoalSetupMode(childId, 'random');
    resetGoalCompletionForChild(child);
    showFeedback(`${child.name}'s goals randomised for today.`, 'info');
    highlightChildPanel(childId, 'info');
  };

  // ── Save selected goals ────────────────────────────────────────────────────

  const handleSaveSelectedGoals = async (childId: string) => {
    const child = childrenData.find((c) => c.id === childId);
    if (!child) return;
    const selected = goalSelections[childId] ?? [];
    if (
      selected.length < 3 ||
      selected.some((goalId) => !goalId) ||
      new Set(selected).size < 3
    ) {
      showFeedback('Choose 3 different goals before saving.', 'warning');
      return;
    }
    let record;
    try {
      record = await setAuthoritativeDailyGoalsForChild(childId, selected, 'manual');
    } catch (error) {
      console.error('[Goals] Manual save failed', { childId, selected, error });
      showFeedback(`Could not save ${child.name}'s goals. Check Supabase daily_goals setup.`, 'warning');
      return;
    }
    const goals = record.goalItems
      ? record.goalItems.map(({ completed, ...goal }) => {
          void completed;
          return goal;
        })
      : getDailyGoalsForChild(childId);
    setGoalsByChild((cur) => ({ ...cur, [childId]: goals }));
    setGoalSelections((cur) => ({ ...cur, [childId]: record.goals }));
    setGoalModes((cur) => ({ ...cur, [childId]: 'manual' }));
    setGoalSetupMode(childId, 'manual');
    resetGoalCompletionForChild(child);
    showFeedback(`${child.name}'s goals saved for today.`, 'success');
    highlightChildPanel(childId, 'success');
  };

  // ── Auto random daily ──────────────────────────────────────────────────────

  const handleUseAutoRandomDaily = (childId: string) => {
    const child = childrenData.find((c) => c.id === childId);
    if (!child) return;
    setGoalSetupMode(childId, 'auto');
    setGoalModes((cur) => ({ ...cur, [childId]: 'auto' }));
    showFeedback(`${child.name} will use auto random daily goals.`, 'info');
    highlightChildPanel(childId, 'info');
  };

  const updateGoalSelection = (childId: string, slotIndex: number, goalId: string) => {
    setGoalSelections((cur) => {
      const existing =
        cur[childId] ??
        (goalsByChild[childId] ?? dailyMissionTemplates).map((g) => g.id);
      const next = [...existing];
      next[slotIndex] = goalId;
      return { ...cur, [childId]: next };
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeChild = childrenData.find((child) => child.id === activeChildId);
  const activeDashboardState = activeChild
    ? dashboardStates[activeChild.id] ?? mergeWithDefaultChildState(activeChild, null)
    : null;
  const activeGoals = activeChild
    ? goalsByChild[activeChild.id] ?? dailyMissionTemplates
    : [];
  const activeSelectedGoalIds = activeChild
    ? goalSelections[activeChild.id] ?? activeGoals.map((goal) => goal.id)
    : [];
  const completedGoalCount = activeDashboardState
    ? activeGoals.filter((mission) => activeDashboardState.completedMissions[mission.id]).length
    : 0;
  const isEditingActiveChild = activeChild ? Boolean(goalEditors[activeChild.id]) : false;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl lg:hidden">✅</span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 lg:text-lg">Goals & Verification</h1>
            <p className="hidden lg:block text-xs text-slate-400">
              {lastAction ? `Last: ${lastAction}` : 'Verify daily goals for each child'}
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

          {activeChild && activeDashboardState && (
            <motion.div
              key={`${activeChild.id}-${isEditingActiveChild ? 'edit' : 'verify'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`${cardStyle} transition-all duration-300 ${getPanelClass(activeChild.id)}`}
            >
              {isEditingActiveChild ? (
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => setGoalEditors((current) => ({ ...current, [activeChild.id]: false }))}
                    className="text-sm font-black text-purple-700 transition hover:text-purple-900 active:scale-95"
                  >
                    ← Back to verification
                  </button>
                  <div className="mt-3">
                    <h2 className="text-xl font-extrabold text-slate-900">Edit {activeChild.name}&apos;s Goals</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Choose three different goals for today.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[0, 1, 2].map((slotIndex) => (
                      <label key={slotIndex} className="grid gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-purple-600">
                          Slot {slotIndex + 1}
                        </span>
                        <select
                          value={activeSelectedGoalIds[slotIndex] ?? goalBank[slotIndex]?.id}
                          onChange={(event) =>
                            updateGoalSelection(activeChild.id, slotIndex, event.target.value)
                          }
                          className="min-w-0 rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
                        >
                          {goalBank.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.title} — {goal.category} — +{goal.starReward}★ — {goal.bossDamage} boss dmg
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSelectedGoals(activeChild.id)}
                      className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700 active:scale-95"
                    >
                      Save Goals
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseAutoRandomDaily(activeChild.id)}
                      className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                    >
                      Auto Random Daily
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900">{activeChild.name}</h2>
                        <p className="text-xs font-semibold text-slate-400">Current balance</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-700">
                        <span className={getStatClass(activeChild.id, 'stars')}>⭐ {activeChild.stars}</span>
                        <span className={getStatClass(activeChild.id, 'hearts')}>❤️ {activeChild.hearts}</span>
                        <span className={getStatClass(activeChild.id, 'screenEnergy')}>⚡ {activeChild.screenEnergy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Today&apos;s Goals</h2>
                        <p className="text-xs font-semibold text-slate-400">Tap a goal when you have verified it.</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                        {completedGoalCount}/{activeGoals.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {activeGoals.map((mission) => {
                        const completed = activeDashboardState.completedMissions[mission.id] ?? false;
                        return (
                          <label
                            key={mission.id}
                            className={`flex min-h-[72px] cursor-pointer items-center justify-between gap-3 rounded-2xl px-3.5 py-3 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
                              completed
                                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                                : 'bg-slate-50'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={completed}
                                onChange={(event) =>
                                  handleMissionCompletion(activeChild.id, mission.id, event.target.checked)
                                }
                                className="h-6 w-6 shrink-0 rounded border-emerald-300 accent-emerald-500"
                              />
                              <span className="min-w-0">
                                <span className={`block text-base font-extrabold leading-tight ${
                                  completed ? 'text-emerald-900' : 'text-slate-900'
                                }`}>
                                  {mission.title}
                                </span>
                                <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                                  {mission.description}
                                </span>
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                              +{mission.starReward ?? mission.reward}★
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        {goalModes[activeChild.id] === 'manual'
                          ? 'Manual goals'
                          : goalModes[activeChild.id] === 'random'
                            ? 'Randomised today'
                            : 'Auto daily goals'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGoalEditors((current) => ({ ...current, [activeChild.id]: true }))}
                        className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 active:scale-95"
                      >
                        ✏ Edit Goals
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRandomizeGoals(activeChild.id)}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
                      >
                        🎲 Randomise
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          <div className="rounded-2xl border border-violet-100 bg-violet-50/60">
            <button
              type="button"
              onClick={() => setIsHelpExpanded((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold text-violet-900 transition hover:bg-violet-50 active:scale-[0.99]"
              aria-expanded={isHelpExpanded}
            >
              <span>{isHelpExpanded ? '▼' : '▶'} How Goals Work</span>
            </button>
            {isHelpExpanded && (
              <div className="grid gap-2 border-t border-violet-100 px-4 py-3 text-sm text-violet-700 sm:grid-cols-3">
                <p className="rounded-xl bg-white/70 px-3 py-2">
                  ✅ <strong>Verified goals</strong> automatically deal damage to the Family Boss.
                </p>
                <p className="rounded-xl bg-white/70 px-3 py-2">
                  🎲 <strong>Randomise</strong> is locked if a child already has completed goals.
                </p>
                <p className="rounded-xl bg-white/70 px-3 py-2">
                  ⭐ <strong>Stars</strong> are awarded when goals are verified by a parent.
                </p>
              </div>
            )}
          </div>

        </div>
      </motion.main>
    </>
  );
}
