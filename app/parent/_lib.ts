import { mockChildren } from '@/lib/mock-data';
import {
  ChildDashboardState,
  DailyMission,
  GoalSetupMode,
  dailyMissionTemplates,
  getDailyGoalsForChild,
  getGoalSetupMode,
  mergeWithDefaultChildState,
  readChildDashboardState,
} from '@/lib/mission-state';
import { RewardTemplate, defaultRewardTemplates } from '@/lib/reward-templates';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type MockChild = (typeof mockChildren)[number];
export type FeedbackTone = 'success' | 'warning' | 'boss' | 'info';
export type FeedbackState = { message: string; tone: FeedbackTone };
export type StatKey = 'stars' | 'hearts' | 'screenEnergy';
export type PanelHighlight = { childId: string; tone: FeedbackTone };
export type StatPulse = { childId: string; stat: StatKey };
export type DashboardStateByChild = Record<string, ChildDashboardState>;
export type GoalsByChild = Record<string, DailyMission[]>;
export type GoalModeState = Record<string, GoalSetupMode>;
export type GoalEditorState = Record<string, boolean>;
export type GoalSelectionState = Record<string, string[]>;

// ─── State builders ───────────────────────────────────────────────────────────

export function buildDashboardStates(readStored: boolean): DashboardStateByChild {
  return Object.fromEntries(
    mockChildren.map((child) => [
      child.id,
      mergeWithDefaultChildState(
        child,
        readStored ? readChildDashboardState(child.id) : null
      ),
    ])
  );
}

export function buildGoalsByChild(readStored: boolean): GoalsByChild {
  return Object.fromEntries(
    mockChildren.map((child) => [
      child.id,
      readStored ? getDailyGoalsForChild(child.id) : dailyMissionTemplates,
    ])
  );
}

export function buildGoalModes(readStored: boolean): GoalModeState {
  return Object.fromEntries(
    mockChildren.map((child) => [
      child.id,
      readStored ? getGoalSetupMode(child.id) : 'auto',
    ])
  );
}

// ─── Reward template persistence ──────────────────────────────────────────────

export const REWARD_TEMPLATES_KEY = 'pocket-pets-reward-templates';

export function loadSavedRewardTemplates(): RewardTemplate[] {
  if (typeof window === 'undefined') return defaultRewardTemplates;
  try {
    const stored = localStorage.getItem(REWARD_TEMPLATES_KEY);
    if (!stored) return defaultRewardTemplates;
    const parsed = JSON.parse(stored) as RewardTemplate[];
    const defaultIds = new Set(defaultRewardTemplates.map((t) => t.id));
    const storedById = new Map(parsed.map((t) => [t.id, t]));
    const defaults = defaultRewardTemplates.map((def) => storedById.get(def.id) ?? def);
    const customs = parsed.filter((t) => !defaultIds.has(t.id));
    return [...defaults, ...customs];
  } catch {
    return defaultRewardTemplates;
  }
}

export function persistRewardTemplates(templates: RewardTemplate[]): void {
  try {
    localStorage.setItem(REWARD_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // ignore write errors
  }
}

// ─── Shared style constants ────────────────────────────────────────────────────

export const cardStyle =
  'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden';

export const feedbackClass: Record<FeedbackTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-rose-200 bg-rose-50 text-rose-800',
  boss: 'border-purple-200 bg-purple-50 text-purple-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export const panelHighlightClass: Record<FeedbackTone, string> = {
  success: 'ring-2 ring-emerald-300',
  warning: 'ring-2 ring-rose-300',
  boss: 'ring-2 ring-purple-300',
  info: 'ring-2 ring-blue-300',
};

export const statPulseClass: Record<StatKey, string> = {
  stars: 'scale-110 ring-2 ring-amber-300 shadow-md',
  hearts: 'scale-110 ring-2 ring-pink-300 shadow-md',
  screenEnergy: 'scale-110 ring-2 ring-blue-300 shadow-md',
};
