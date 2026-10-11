'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { mockChildren } from '@/lib/mock-data';
import {
  dailyMissionTemplates,
  randomizeAuthoritativeDailyGoalsForChild,
  setAuthoritativeDailyGoalsForChild,
  setGoalSetupMode,
  type ChildDashboardState,
  type DailyMission,
} from '@/lib/mission-state';
import { verifyDailyGoal } from '@/lib/goal-verification';
import { readBossBattleState, type BossBattleState } from '@/lib/boss-battle';
import {
  buildDashboardStates,
  buildDashboardStatesFromSupabase,
  buildGoalModes,
  buildGoalsByChild,
  type DashboardStateByChild,
  type GoalModeState,
  type GoalsByChild,
} from '../_lib';

export type ActionResult = { ok: boolean; message: string };

/**
 * Shared parent data: both children's authoritative state, today's goals, and the
 * boss. All progression goes through the existing Supabase transactions.
 */
export function useFamilyData() {
  const [states, setStates] = useState<DashboardStateByChild>(() => buildDashboardStates(false));
  const [goals, setGoals] = useState<GoalsByChild>(() => buildGoalsByChild(false));
  const [modes, setModes] = useState<GoalModeState>(() => buildGoalModes(false));
  const [boss, setBoss] = useState<BossBattleState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const inFlight = useRef(new Set<string>());
  const [pending, setPending] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const hydrated = await buildDashboardStatesFromSupabase();
    setStates(hydrated);
    setGoals(buildGoalsByChild(true));
    setModes(buildGoalModes(true));
    setBoss(readBossBattleState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      // Cached first paint, then the authoritative reload.
      setStates(buildDashboardStates(true));
      setGoals(buildGoalsByChild(true));
      setModes(buildGoalModes(true));
      setBoss(readBossBattleState());
      await reload();
    })();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  const setChildState = useCallback((childId: string, next: ChildDashboardState) => {
    setStates((current) => ({ ...current, [childId]: next }));
  }, []);

  const track = (key: string, on: boolean) => {
    if (on) inFlight.current.add(key);
    else inFlight.current.delete(key);
    setPending(new Set(inFlight.current));
  };

  const verify = useCallback(
    async (childId: string, mission: DailyMission, completed: boolean): Promise<ActionResult> => {
      const child = mockChildren.find((c) => c.id === childId);
      const key = `${childId}:${mission.id}`;
      if (!child || inFlight.current.has(key)) return { ok: false, message: '' };
      track(key, true);
      try {
        const result = await verifyDailyGoal(child, mission.id, completed);
        setStates((current) => ({ ...current, [childId]: result.childState }));
        setBoss(result.bossState);
        const reward = mission.starReward ?? mission.reward;
        return {
          ok: true,
          message: completed
            ? `${child.name}: “${mission.title}” verified · +${reward} stars · boss −${mission.bossDamage ?? 10}`
            : `${child.name}: “${mission.title}” un-verified · −${reward} stars`,
        };
      } catch (error) {
        return { ok: false, message: `Couldn't save: ${error instanceof Error ? error.message : 'unknown error'}` };
      } finally {
        track(key, false);
      }
    },
    []
  );

  const randomize = useCallback(
    async (childId: string): Promise<ActionResult> => {
      const child = mockChildren.find((c) => c.id === childId);
      if (!child) return { ok: false, message: '' };
      const current = goals[childId] ?? [];
      const done = current.filter((m) => states[childId]?.completedMissions[m.id]).length;
      if (done > 0) {
        return { ok: false, message: `${child.name} already has ${done} verified ${done === 1 ? 'goal' : 'goals'} today. Undo them before picking new goals.` };
      }
      const key = `${childId}:randomize`;
      if (inFlight.current.has(key)) return { ok: false, message: '' };
      track(key, true);
      try {
        const record = await randomizeAuthoritativeDailyGoalsForChild(childId);
        setGoalSetupMode(childId, 'random');
        setGoals((g) => ({ ...g, [childId]: (record.goalItems ?? []).map(({ completed, ...goal }) => { void completed; return goal; }) }));
        setModes((m) => ({ ...m, [childId]: 'random' }));
        return { ok: true, message: `New goals picked for ${child.name}.` };
      } catch {
        return { ok: false, message: `Couldn't save ${child.name}'s goals. Please try again.` };
      } finally {
        track(key, false);
      }
    },
    [goals, states]
  );

  /** Saving a new set first un-verifies any verified goals (reversing their stars), as before. */
  const saveSelected = useCallback(
    async (childId: string, goalIds: string[]): Promise<ActionResult> => {
      const child = mockChildren.find((c) => c.id === childId);
      if (!child) return { ok: false, message: '' };
      if (goalIds.length < 3 || new Set(goalIds).size < 3) return { ok: false, message: 'Choose 3 different goals.' };
      const key = `${childId}:save`;
      if (inFlight.current.has(key)) return { ok: false, message: '' };
      track(key, true);
      try {
        const current = goals[childId] ?? dailyMissionTemplates;
        let latest = states[childId];
        for (const mission of current) {
          if (!latest?.completedMissions[mission.id]) continue;
          const result = await verifyDailyGoal(child, mission.id, false);
          latest = result.childState;
          setBoss(result.bossState);
        }
        if (latest) setStates((s) => ({ ...s, [childId]: latest }));
        const record = await setAuthoritativeDailyGoalsForChild(childId, goalIds, 'manual');
        setGoalSetupMode(childId, 'manual');
        setGoals((g) => ({ ...g, [childId]: (record.goalItems ?? []).map(({ completed, ...goal }) => { void completed; return goal; }) }));
        setModes((m) => ({ ...m, [childId]: 'manual' }));
        return { ok: true, message: `${child.name}'s goals saved for today.` };
      } catch {
        return { ok: false, message: `Couldn't save ${child.name}'s goals. Please try again.` };
      } finally {
        track(key, false);
      }
    },
    [goals, states]
  );

  const setAutoMode = useCallback((childId: string) => {
    setGoalSetupMode(childId, 'auto');
    setModes((m) => ({ ...m, [childId]: 'auto' }));
  }, []);

  return { states, goals, modes, boss, setBoss, loaded, pending, reload, setChildState, verify, randomize, saveSelected, setAutoMode };
}
