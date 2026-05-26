'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { mockChildren } from '@/lib/mock-data';
import {
  dailyMissionTemplates,
  getDailyGoalsForChild,
  getGoalSetupMode,
  goalBank,
  mergeWithDefaultChildState,
  randomizeDailyGoalsForChild,
  readChildDashboardState,
  saveChildDashboardState,
  setDailyGoalsForChild,
  setGoalSetupMode,
  setMissionCompletion,
  updateSecretEggProgressForGoal,
} from '@/lib/mission-state';
import {
  addBossAttack,
  getBossBattleStorageKey,
  getMissionAttackSourceId,
  readBossBattleState,
  removeBossAttackBySourceId,
  writeBossBattleState,
} from '@/lib/boss-battle';
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
    let nextBossState = readBossBattleState();

    currentGoals.forEach((goal) => {
      if (!currentState.completedMissions[goal.id]) return;
      setMissionCompletion(child.id, child, goal, false);
      updateSecretEggProgressForGoal(
        child.id,
        child,
        getMissionAttackSourceId(child.id, goal.id),
        false
      );
      nextBossState = removeBossAttackBySourceId(
        nextBossState,
        getMissionAttackSourceId(child.id, goal.id)
      );
    });

    writeBossBattleState(nextBossState);
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

    setChildrenData((cur) =>
      cur.map((child) => {
        if (child.id !== childId) return child;
        setMissionCompletion(child.id, child, mission, completed);
        const sourceId = getMissionAttackSourceId(child.id, mission.id);
        const eggState = updateSecretEggProgressForGoal(child.id, child, sourceId, completed);
        const currentBossState = readBossBattleState();
        const nextBossState = completed
          ? addBossAttack(currentBossState, {
              childId: child.id,
              childName: child.name,
              sourceType: 'mission',
              sourceId,
              title: mission.title,
              damage: bossDamage,
            })
          : removeBossAttackBySourceId(currentBossState, sourceId);
        writeBossBattleState(nextBossState);
        setDashboardStates((cur) => ({ ...cur, [child.id]: eggState }));
        if (eggState.eggMessage) showFeedback(eggState.eggMessage, 'success');
        return {
          ...child,
          stars: eggState.stars,
          hearts: eggState.hearts,
          screenEnergy: eggState.screenEnergy,
        };
      })
    );
  };

  // ── Goal randomise ─────────────────────────────────────────────────────────

  const handleRandomizeGoals = (childId: string) => {
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

    const record = randomizeDailyGoalsForChild(childId);
    const goals = getDailyGoalsForChild(childId);
    setGoalsByChild((cur) => ({ ...cur, [childId]: goals }));
    setGoalSelections((cur) => ({ ...cur, [childId]: record.goals }));
    setGoalModes((cur) => ({ ...cur, [childId]: 'random' }));
    setGoalSetupMode(childId, 'random');
    resetGoalCompletionForChild(child);
    showFeedback(`${child.name}'s goals randomised for today.`, 'info');
    highlightChildPanel(childId, 'info');
  };

  // ── Save selected goals ────────────────────────────────────────────────────

  const handleSaveSelectedGoals = (childId: string) => {
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
    const record = setDailyGoalsForChild(childId, selected, 'manual');
    const goals = getDailyGoalsForChild(childId);
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

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xl lg:hidden">✅</span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 lg:text-lg">Goals & Verification</h1>
            <p className="hidden lg:block text-xs text-slate-400">
              {lastAction ? `Last: ${lastAction}` : 'Verify daily goals for each child'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setGoalEditors(
                Object.fromEntries(mockChildren.map((c) => [c.id, true]))
              )
            }
            className="rounded-full border border-purple-200 bg-purple-100 px-4 py-2 text-sm font-bold text-purple-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          >
            ✏️ Edit All Goals
          </button>
          <Link href="/">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
            >
              ← Exit
            </button>
          </Link>
        </div>
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

          {/* Child goal cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {childrenData.map((child) => {
              const dashboardState =
                dashboardStates[child.id] ?? mergeWithDefaultChildState(child, null);
              const childGoals = goalsByChild[child.id] ?? dailyMissionTemplates;
              const selectedGoalIds =
                goalSelections[child.id] ?? childGoals.map((g) => g.id);
              const completedGoalCount = childGoals.filter(
                (m) => dashboardState.completedMissions[m.id]
              ).length;

              return (
                <div
                  key={child.id}
                  className={`${cardStyle} flex flex-col transition-all duration-300 ${getPanelClass(child.id)}`}
                >
                  {/* Name + Stats */}
                  <div className="px-6 pt-6 pb-4">
                    <h2 className="text-2xl font-extrabold text-slate-900">{child.name}</h2>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className={`rounded-2xl bg-amber-50 px-3 py-2 transition-all duration-300 ${getStatClass(child.id, 'stars')}`}>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600">⭐ Stars</p>
                        <p className="text-xl font-extrabold text-slate-900">{child.stars}</p>
                      </div>
                      <div className={`rounded-2xl bg-pink-50 px-3 py-2 transition-all duration-300 ${getStatClass(child.id, 'hearts')}`}>
                        <p className="text-xs font-bold uppercase tracking-wide text-pink-600">❤️ Hearts</p>
                        <p className="text-xl font-extrabold text-slate-900">{child.hearts}</p>
                      </div>
                      <div className={`rounded-2xl bg-blue-50 px-3 py-2 transition-all duration-300 ${getStatClass(child.id, 'screenEnergy')}`}>
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">📱 Energy</p>
                        <p className="text-xl font-extrabold text-slate-900">{child.screenEnergy}</p>
                      </div>
                    </div>
                  </div>

                  {/* Today's Goals */}
                  <div className="flex-1 border-t border-slate-100 px-6 py-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
                        Today&apos;s Goals
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                        {completedGoalCount}/{childGoals.length}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        {goalModes[child.id] === 'manual'
                          ? 'Manual'
                          : goalModes[child.id] === 'random'
                            ? 'Randomised'
                            : 'Auto daily'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setGoalEditors((cur) => ({
                            ...cur,
                            [child.id]: !cur[child.id],
                          }))
                        }
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                      >
                        {goalEditors[child.id] ? 'Close' : 'Edit Goals'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRandomizeGoals(child.id)}
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                      >
                        Randomise
                      </button>
                    </div>

                    {goalEditors[child.id] && (
                      <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                        <div className="grid gap-3">
                          {[0, 1, 2].map((slotIndex) => (
                            <label key={slotIndex} className="grid gap-1">
                              <span className="text-xs font-bold uppercase tracking-wide text-purple-600">
                                Slot {slotIndex + 1}
                              </span>
                              <select
                                value={selectedGoalIds[slotIndex] ?? goalBank[slotIndex]?.id}
                                onChange={(e) =>
                                  updateGoalSelection(child.id, slotIndex, e.target.value)
                                }
                                className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
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
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveSelectedGoals(child.id)}
                            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md active:scale-95"
                          >
                            Save Goals
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUseAutoRandomDaily(child.id)}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                          >
                            Auto Random Daily
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      {childGoals.map((mission) => {
                        const completed =
                          dashboardState.completedMissions[mission.id] ?? false;
                        return (
                          <label
                            key={mission.id}
                            className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
                              completed
                                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                                : 'bg-slate-50'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={completed}
                                onChange={(e) =>
                                  handleMissionCompletion(
                                    child.id,
                                    mission.id,
                                    e.target.checked
                                  )
                                }
                                className="h-5 w-5 shrink-0 rounded border-emerald-300 accent-emerald-500"
                              />
                              <span className="min-w-0">
                                <span
                                  className={`block text-sm font-bold ${
                                    completed ? 'text-emerald-900' : 'text-slate-900'
                                  }`}
                                >
                                  {mission.title}
                                </span>
                                <span className="block text-xs text-slate-400">
                                  {mission.description}
                                </span>
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-700">
                              +{mission.starReward ?? mission.reward}★
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How goals work — tips panel */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-5">
            <h3 className="text-sm font-extrabold text-violet-900">How Goals Work</h3>
            <div className="mt-3 grid gap-3 text-sm text-violet-700 sm:grid-cols-3">
              <p className="rounded-xl bg-white/70 px-4 py-3">
                ✅ <strong>Verified goals</strong> automatically deal damage to the Family Boss.
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                🎲 <strong>Randomise</strong> is locked if a child already has completed goals.
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                ⭐ <strong>Stars</strong> are awarded when goals are verified by a parent.
              </p>
            </div>
          </div>

        </div>
      </motion.main>
    </>
  );
}
