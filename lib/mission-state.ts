import { PET_ROSTER, getPetByChildId, type Child, type PetRosterItem } from '@/lib/mock-data';
import { ensureFreshStartLocalReset } from '@/lib/fresh-start-reset';
import { normalizeScreenEnergy } from '@/lib/screen-energy';
import { SKIN_ROSTER, VALID_SKIN_IDS, type PetType, type SkinId } from '@/lib/pet-skins';
import {
  applyMoodDecay,
  boostMoodPercent,
  INITIAL_MOOD_PERCENT,
  clampMoodPercent,
  type MoodDecayResult,
} from '@/lib/pet-mood';
import {
  fetchChildState,
  mergeSupabaseChildState,
  type SupabaseChildState,
  updateChildMood,
  upsertChildStateFromDashboard,
} from '@/lib/supabase-child-state';
import {
  fetchDailyGoalsForChild,
  fetchDailyGoalsForChildResult,
  upsertDailyGoalsForChild,
  type DailyGoalsWriteReason,
  type SupabaseDailyGoalState,
} from '@/lib/supabase-goals';

export type CompletedMissions = Record<string, boolean>;
export type CareActionType = 'feed' | 'pat' | 'clean';
export type { PetType, SkinId };
export type GoalCategory =
  | 'reading'
  | 'kindness'
  | 'chores'
  | 'self-care'
  | 'learning'
  | 'calm'
  | 'family';
export type DailyGoalSource = 'manual' | 'random';

export type DailyActionCounts = Record<CareActionType, number>;
export type LastActionTimestamps = Record<CareActionType, number>;

export interface PoopEvent {
  id: string;
  scheduledAt: string;
  createdAt: string;
  cleanedAt: string | null;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  reward: number;
  category?: GoalCategory;
  starReward?: number;
  bossDamage?: number;
}

export interface DailyGoalInstance extends DailyMission {
  completed: boolean;
}

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  starReward: number;
  bossDamage: number;
  suggestedAge?: string;
}

export interface DailyGoalsRecord {
  date: string;
  source: DailyGoalSource;
  goals: string[];
  goalItems?: DailyGoalInstance[];
  completed?: Record<string, boolean>;
  previousGoals?: string[];
}

export type DailyGoalsByChild = Record<string, DailyGoalsRecord>;

export type GoalSetupMode = DailyGoalSource | 'auto';

export type AuthoritativeDailyGoalsSource =
  | 'supabase'
  | 'supabase-generated'
  | 'local-fallback';

export interface AuthoritativeDailyGoalsResult {
  record: DailyGoalsRecord;
  goals: DailyMission[];
  remote: SupabaseDailyGoalState | null;
  source: AuthoritativeDailyGoalsSource;
  generationHappened: boolean;
  localStorageFallbackUsed: boolean;
}

const emptyDailyGoalsResult = (childId: string, today = getTodayKey()): AuthoritativeDailyGoalsResult => {
  return {
    record: {
      date: today,
      source: 'random',
      goals: [],
      goalItems: [],
      completed: {},
      previousGoals: [],
    },
    goals: [],
    remote: null,
    source: 'local-fallback',
    generationHappened: false,
    localStorageFallbackUsed: false,
  };
};

const localStorageFallbackDailyGoalsResult = (
  childId: string,
  today = getTodayKey()
): AuthoritativeDailyGoalsResult => {
  const cached = readDailyGoalsByChild()[childId];
  if (cached?.date === today && getUniqueGoalIds(cached.goals).length === 3) {
    const completed = cached.completed ?? {};
    const goalItems = cached.goalItems ?? goalIdsToDailyGoalInstances(cached.goals, completed);
    const record = { ...cached, goalItems, completed };
    return {
      record,
      goals: dailyGoalInstancesToMissions(goalItems),
      remote: null,
      source: 'local-fallback',
      generationHappened: false,
      localStorageFallbackUsed: true,
    };
  }

  return emptyDailyGoalsResult(childId, today);
};

export interface GoalSetupState {
  modeByChild: Record<string, GoalSetupMode>;
}

export interface ChildDashboardState {
  stars: number;
  hearts: number;
  screenEnergy: number;
  activePetId: PetRosterItem['id'];
  activePetType: PetRosterItem['id'];
  unlockedPets: PetRosterItem['id'][];
  activeEgg: SecretEggState | null;
  eggMessage: string | null;
  comfort: number;
  completedMissions: CompletedMissions;
  ownedSkins: SkinId[];
  activeSkins: Record<PetType, SkinId | null>;
  dailyActionCounts: DailyActionCounts;
  lastActionTimestamps: LastActionTimestamps;
  poopEvents: PoopEvent[];
  careResetDate: string;
  patHeartAwarded: boolean;
  goalsDate: string;
  moodUpdatedAt: string;
}

export interface SecretEggState {
  id: string;
  type: 'secret-egg';
  progress: number;
  requiredGoals: number;
  contributedGoalIds: string[];
  hatched: boolean;
  unlockedPetId: PetRosterItem['id'] | null;
}

interface SaveChildDashboardOptions {
  allowEggProgressRegression?: boolean;
}

export { SKIN_ROSTER, SKIN_COST, skinsByPet, getSkinById } from '@/lib/pet-skins';

export const goalBank: GoalTemplate[] = [
  {
    id: 'read-cozy-tales',
    title: 'Read Cozy Tales',
    description: 'Help Cozy learn a new story',
    category: 'reading',
    starReward: 10,
    bossDamage: 10,
  },
  {
    id: 'read-15-minutes',
    title: 'Read for 15 Minutes',
    description: 'Read quietly and enjoy a book',
    category: 'reading',
    starReward: 10,
    bossDamage: 10,
  },
  {
    id: 'practise-spelling',
    title: 'Practise Spelling',
    description: 'Try your spelling words carefully',
    category: 'learning',
    starReward: 10,
    bossDamage: 10,
  },
  {
    id: 'complete-one-worksheet',
    title: 'Complete One Worksheet',
    description: 'Finish one learning task with good effort',
    category: 'learning',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'tell-me-about-your-book',
    title: 'Tell Me About Your Book',
    description: 'Share what happened in your story',
    category: 'reading',
    starReward: 10,
    bossDamage: 10,
  },
  {
    id: 'practice-kindness',
    title: 'Practice Kindness',
    description: 'Share a smile with a friend',
    category: 'kindness',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'use-gentle-words',
    title: 'Use Gentle Words',
    description: 'Speak kindly even when upset',
    category: 'kindness',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'help-someone-at-home',
    title: 'Help Someone at Home',
    description: 'Do one helpful thing for the family',
    category: 'family',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'say-thank-you',
    title: 'Say Thank You',
    description: 'Remember to show appreciation',
    category: 'kindness',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'share-with-sibling',
    title: 'Share with Sibling',
    description: 'Share something nicely with Ansel or Thea',
    category: 'kindness',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'collect-star-gems',
    title: 'Collect Star Gems',
    description: 'Find treasures around the room',
    category: 'chores',
    starReward: 20,
    bossDamage: 10,
  },
  {
    id: 'pack-away-toys',
    title: 'Pack Away Toys',
    description: 'Put toys back where they belong',
    category: 'chores',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'help-with-dinner',
    title: 'Help with Dinner',
    description: 'Help with one simple dinner task',
    category: 'chores',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'keep-shoes-neatly',
    title: 'Keep Shoes Neatly',
    description: 'Put shoes neatly at the door',
    category: 'chores',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'tidy-your-table',
    title: 'Tidy Your Table',
    description: 'Clear your table after using it',
    category: 'chores',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'brush-teeth-twice',
    title: 'Brush Teeth Twice',
    description: 'Morning and night brushing complete',
    category: 'self-care',
    starReward: 10,
    bossDamage: 10,
  },
  {
    id: 'get-ready-without-fuss',
    title: 'Get Ready Without Fuss',
    description: 'Get dressed and ready calmly',
    category: 'self-care',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'sleep-routine-helper',
    title: 'Sleep Routine Helper',
    description: 'Follow bedtime routine nicely',
    category: 'self-care',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'eat-dinner-nicely',
    title: 'Eat Dinner Nicely',
    description: 'Try your food and use good manners',
    category: 'self-care',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'pack-your-bag',
    title: 'Pack Your Bag',
    description: 'Prepare what you need for school',
    category: 'self-care',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'calm-down-brave',
    title: 'Calm Down Brave',
    description: 'Try calming down when upset',
    category: 'calm',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'use-your-words',
    title: 'Use Your Words',
    description: 'Tell us what you feel with words',
    category: 'calm',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'no-screaming-challenge',
    title: 'No Screaming Challenge',
    description: 'Use a calm voice today',
    category: 'calm',
    starReward: 20,
    bossDamage: 15,
  },
  {
    id: 'try-again-moment',
    title: 'Try Again Moment',
    description: 'Keep trying even when it is hard',
    category: 'calm',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'listen-the-first-time',
    title: 'Listen the First Time',
    description: 'Try to listen when parent speaks',
    category: 'calm',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'care-for-your-pet',
    title: 'Care for Your Pet',
    description: 'Feed, pat, or clean your pet kindly',
    category: 'family',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'family-helper',
    title: 'Family Helper',
    description: 'Do one thing that helps the family',
    category: 'family',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'be-a-good-sport',
    title: 'Be a Good Sport',
    description: 'Stay kind when playing or losing',
    category: 'family',
    starReward: 15,
    bossDamage: 10,
  },
  {
    id: 'quiet-time-win',
    title: 'Quiet Time Win',
    description: 'Spend quiet time without complaining',
    category: 'calm',
    starReward: 10,
    bossDamage: 5,
  },
  {
    id: 'morning-sunshine',
    title: 'Morning Sunshine',
    description: 'Start the morning with a good attitude',
    category: 'family',
    starReward: 15,
    bossDamage: 10,
  },
];

export const dailyMissionTemplates: DailyMission[] = goalBank.slice(0, 3).map((goal) => ({
  ...goal,
  reward: goal.starReward,
}));

const MAX_STARS = 9999;
const VERIFIED_GOAL_MOOD_REWARD = 3;
const DAILY_GOALS_STORAGE_KEY = 'daily-goals-by-child';
const GOAL_SETUP_STORAGE_KEY = 'daily-goal-setup';

export const careActionConfig: Record<
  CareActionType,
  {
    dailyLimit: number;
    cooldownMs: number;
    comfortBoost: number;
    successMessage: string;
    limitMessage: string;
  }
> = {
  feed: {
    dailyLimit: 4,
    cooldownMs: 60 * 1000,
    comfortBoost: 10,
    successMessage: '{petName} enjoyed the yummy treat!',
    limitMessage: '{petName} is full for now!',
  },
  pat: {
    dailyLimit: 5,
    cooldownMs: 20 * 1000,
    comfortBoost: 10,
    successMessage: '{petName} feels loved!',
    limitMessage: '{petName} feels loved already!',
  },
  clean: {
    dailyLimit: 3,
    cooldownMs: 120 * 1000,
    comfortBoost: 10,
    successMessage: '{petName} feels fresh and cozy!',
    limitMessage: '{petName} is already clean and cozy!',
  },
};

function getSingaporeDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
  };
}

export const getSingaporeDateKey = (now = new Date()) => {
  const { year, month, day } = getSingaporeDateParts(now);
  return `${year}-${month}-${day}`;
};

export const getTodayKey = (now = new Date()) => getSingaporeDateKey(now);

const POOP_SCHEDULE_HOURS = [10, 16] as const;
const POOP_GRACE_MS = 10 * 60 * 60 * 1000;
const POOP_PENALTY_PER_HOUR = 3;

function getPoopScheduleForDate(dateKey: string) {
  return POOP_SCHEDULE_HOURS.map((hour) => {
    const label = `${hour.toString().padStart(2, '0')}00`;
    return {
      id: `poop-${dateKey}-${label}`,
      scheduledAt: `${dateKey}T${hour.toString().padStart(2, '0')}:00:00+08:00`,
    };
  });
}

function getSingaporeDateKeyFromIso(iso: string) {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : getSingaporeDateKey(parsed);
}

export function normalizePoopEvents(value: unknown): PoopEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): PoopEvent | null => {
      if (!item || typeof item !== 'object') return null;
      const event = item as Partial<PoopEvent>;
      if (
        typeof event.id !== 'string' ||
        typeof event.scheduledAt !== 'string' ||
        typeof event.createdAt !== 'string'
      ) {
        return null;
      }
      const scheduledAt = new Date(event.scheduledAt);
      const createdAt = new Date(event.createdAt);
      const cleanedAt =
        typeof event.cleanedAt === 'string' ? new Date(event.cleanedAt) : null;
      if (
        Number.isNaN(scheduledAt.getTime()) ||
        Number.isNaN(createdAt.getTime()) ||
        (cleanedAt && Number.isNaN(cleanedAt.getTime()))
      ) {
        return null;
      }
      return {
        id: event.id,
        scheduledAt: scheduledAt.toISOString(),
        createdAt: createdAt.toISOString(),
        cleanedAt: cleanedAt ? cleanedAt.toISOString() : null,
      };
    })
    .filter((event): event is PoopEvent => Boolean(event))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export function reconcilePoopEvents(events: PoopEvent[], now = new Date()) {
  const today = getSingaporeDateKey(now);
  const normalized = normalizePoopEvents(events);
  const retained = normalized.filter((event) => {
    const eventDate = getSingaporeDateKeyFromIso(event.scheduledAt);
    return !event.cleanedAt || eventDate === today;
  });
  const byId = new Map(retained.map((event) => [event.id, event]));

  for (const scheduled of getPoopScheduleForDate(today)) {
    if (byId.has(scheduled.id)) continue;
    if (new Date(scheduled.scheduledAt).getTime() > now.getTime()) continue;
    byId.set(scheduled.id, {
      id: scheduled.id,
      scheduledAt: new Date(scheduled.scheduledAt).toISOString(),
      createdAt: now.toISOString(),
      cleanedAt: null,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

export function clearPoopEvents(events: PoopEvent[], now = new Date()) {
  return normalizePoopEvents(events).map((event) =>
    event.cleanedAt ? event : { ...event, cleanedAt: now.toISOString() }
  );
}

export function getUnclearedPoopEvents(events: PoopEvent[]) {
  return normalizePoopEvents(events).filter((event) => !event.cleanedAt);
}

export function getPoopPenaltyInfo(events: PoopEvent[], now = new Date()) {
  const uncleared = getUnclearedPoopEvents(events);
  const oldest = uncleared[0] ?? null;
  if (!oldest) {
    return {
      penaltyApplied: false,
      penaltyAmount: 0,
      oldestPoopTime: null as string | null,
      unclearedCount: 0,
    };
  }

  const elapsedAfterGrace = now.getTime() - new Date(oldest.scheduledAt).getTime() - POOP_GRACE_MS;
  const penaltyHours = Math.max(0, Math.floor(elapsedAfterGrace / (60 * 60 * 1000)));
  const penaltyAmount = penaltyHours * POOP_PENALTY_PER_HOUR;
  return {
    penaltyApplied: penaltyAmount > 0,
    penaltyAmount,
    oldestPoopTime: oldest.scheduledAt,
    unclearedCount: uncleared.length,
  };
}

export const getDefaultDailyActionCounts = (): DailyActionCounts => ({
  feed: 0,
  pat: 0,
  clean: 0,
});

export const getDefaultLastActionTimestamps = (): LastActionTimestamps => ({
  feed: 0,
  pat: 0,
  clean: 0,
});

export const clampStars = (stars: number) => Math.max(0, Math.min(MAX_STARS, stars));
export const clampComfort = (comfort: number) => Math.max(0, Math.min(100, comfort));

export const getChildDashboardStorageKey = (childId: string) =>
  `child-dashboard-state-${childId}`;

export type ChildSupabaseSyncSource =
  | 'supabase'
  | 'local-seeded-supabase'
  | 'local-fallback'
  | 'supabase-write'
  | 'supabase-skipped-stale-local';

export interface ChildSupabaseSyncMeta {
  migratedToSupabase: boolean;
  lastRemoteUpdatedAt: string | null;
  lastLocalWriteAt: string | null;
  lastSupabaseWriteAt: string | null;
  lastSyncSource: ChildSupabaseSyncSource;
  lastSyncError: string | null;
  lastMoodSource: string;
  lastMoodPercent: number;
  lastMoodUpdatedAt: string | null;
  lastMoodDecayApplied: boolean;
  lastMoodDisplayed: number;
}

const getDefaultChildSupabaseSyncMeta = (): ChildSupabaseSyncMeta => ({
  migratedToSupabase: false,
  lastRemoteUpdatedAt: null,
  lastLocalWriteAt: null,
  lastSupabaseWriteAt: null,
  lastSyncSource: 'local-fallback',
  lastSyncError: null,
  lastMoodSource: 'local-fallback',
  lastMoodPercent: INITIAL_MOOD_PERCENT,
  lastMoodUpdatedAt: null,
  lastMoodDecayApplied: false,
  lastMoodDisplayed: INITIAL_MOOD_PERCENT,
});

export const getChildSupabaseSyncMetaStorageKey = (childId: string) =>
  `pocket-pets-sync-meta-${childId}`;

export function readChildSupabaseSyncMeta(childId: string): ChildSupabaseSyncMeta {
  if (typeof window === 'undefined') return getDefaultChildSupabaseSyncMeta();
  ensureFreshStartLocalReset();

  try {
    const stored = window.localStorage.getItem(getChildSupabaseSyncMetaStorageKey(childId));
    return stored
      ? { ...getDefaultChildSupabaseSyncMeta(), ...JSON.parse(stored) }
      : getDefaultChildSupabaseSyncMeta();
  } catch {
    return getDefaultChildSupabaseSyncMeta();
  }
}

export function writeChildSupabaseSyncMeta(
  childId: string,
  updates: Partial<ChildSupabaseSyncMeta>
) {
  if (typeof window === 'undefined') return getDefaultChildSupabaseSyncMeta();

  const nextMeta = {
    ...readChildSupabaseSyncMeta(childId),
    ...updates,
  };
  window.localStorage.setItem(
    getChildSupabaseSyncMetaStorageKey(childId),
    JSON.stringify(nextMeta)
  );
  return nextMeta;
}

export const getDailyGoalsStorageKey = () => DAILY_GOALS_STORAGE_KEY;
export const getGoalSetupStorageKey = () => GOAL_SETUP_STORAGE_KEY;

const DEFAULT_ACTIVE_SKINS: Record<PetType, SkinId | null> = {
  luna: null, bubbo: null, mochi: null, ember: null,
};

export const getDefaultChildDashboardState = (child: Child): ChildDashboardState => ({
  stars: child.stars,
  hearts: child.hearts,
  screenEnergy: child.screenEnergy,
  activePetId: getPetByChildId(child.id)?.pet ?? 'bubbo',
  activePetType: getPetByChildId(child.id)?.pet ?? 'bubbo',
  unlockedPets: [getPetByChildId(child.id)?.pet ?? 'bubbo'],
  activeEgg: null,
  eggMessage: null,
  comfort: INITIAL_MOOD_PERCENT,
  completedMissions: {},
  ownedSkins: [],
  activeSkins: { ...DEFAULT_ACTIVE_SKINS },
  dailyActionCounts: getDefaultDailyActionCounts(),
  lastActionTimestamps: getDefaultLastActionTimestamps(),
  poopEvents: reconcilePoopEvents([], new Date()),
  careResetDate: getTodayKey(),
  patHeartAwarded: false,
  goalsDate: getTodayKey(),
  moodUpdatedAt: new Date().toISOString(),
});

function normalizeUnlockedPets(value: unknown, fallbackPet: PetRosterItem['id']) {
  if (!Array.isArray(value)) return [fallbackPet];
  const validPets = value.filter((pet): pet is PetRosterItem['id'] =>
    PET_ROSTER.some((item) => item.id === pet)
  );
  return Array.from(new Set([fallbackPet, ...validPets]));
}

function normalizeActiveEgg(value: unknown): SecretEggState | null {
  if (!value || typeof value !== 'object') return null;
  const egg = value as Partial<SecretEggState>;
  if (egg.type !== 'secret-egg') return null;

  return {
    id: egg.id ?? `secret-egg-${Date.now()}`,
    type: 'secret-egg',
    progress: Math.max(0, Math.min(egg.requiredGoals ?? 10, egg.progress ?? 0)),
    requiredGoals: egg.requiredGoals ?? 10,
    contributedGoalIds: Array.isArray(egg.contributedGoalIds)
      ? egg.contributedGoalIds.filter((goalId): goalId is string => typeof goalId === 'string')
      : [],
    hatched: egg.hatched ?? false,
    unlockedPetId:
      egg.unlockedPetId && PET_ROSTER.some((pet) => pet.id === egg.unlockedPetId)
        ? egg.unlockedPetId
        : null,
  };
}

function normalizeOwnedSkins(value: unknown): SkinId[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter((item): item is SkinId =>
        typeof item === 'string' && VALID_SKIN_IDS.has(item)
      )
    )
  );
}

function normalizeActiveSkins(value: unknown): Record<PetType, SkinId | null> {
  const result: Record<PetType, SkinId | null> = { luna: null, bubbo: null, mochi: null, ember: null };
  if (!value || typeof value !== 'object') return result;
  for (const petType of ['luna', 'bubbo', 'mochi', 'ember'] as PetType[]) {
    const skinId = (value as Record<string, unknown>)[petType];
    if (typeof skinId === 'string' && VALID_SKIN_IDS.has(skinId)) {
      result[petType] = skinId as SkinId;
    }
  }
  return result;
}

export function getGoalById(goalId: string) {
  return goalBank.find((goal) => goal.id === goalId);
}

function goalToMission(goal: GoalTemplate): DailyMission {
  return {
    ...goal,
    reward: goal.starReward,
  };
}

function getFallbackGoalIds() {
  return goalBank.slice(0, 3).map((goal) => goal.id);
}

function getUniqueGoalIds(goalIds: string[]) {
  const validIds = goalIds.filter((goalId) => getGoalById(goalId));
  return Array.from(new Set(validIds)).slice(0, 3);
}

function getRandomGoalIds(previousGoals: string[] = []) {
  const pool = [...goalBank];
  const selected: string[] = [];

  while (pool.length > 0 && selected.length < 3) {
    const index = Math.floor(Math.random() * pool.length);
    const [goal] = pool.splice(index, 1);
    selected.push(goal.id);
  }

  if (
    previousGoals.length >= 3 &&
    selected.length === 3 &&
    selected.every((goalId) => previousGoals.includes(goalId)) &&
    goalBank.length > 3
  ) {
    const replacement = goalBank.find((goal) => !previousGoals.includes(goal.id));
    if (replacement) {
      selected[2] = replacement.id;
    }
  }

  return selected;
}

export function createRandomDailyGoalsRecord(
  previousGoals: string[] = [],
  date = getTodayKey()
): DailyGoalsRecord {
  const goals = getRandomGoalIds(previousGoals);
  return {
    date,
    source: 'random',
    goals,
    goalItems: goalIdsToDailyGoalInstances(goals),
    completed: Object.fromEntries(goals.map((goalId) => [goalId, false])),
    previousGoals,
  };
}

export function goalIdsToDailyGoalInstances(
  goalIds: string[],
  completed: Record<string, boolean> = {}
): DailyGoalInstance[] {
  return goalIdsToDailyMissions(goalIds).map((goal) => ({
    ...goal,
    completed: completed[goal.id] ?? false,
  }));
}

export function dailyGoalInstancesToMissions(goals: DailyGoalInstance[]) {
  return goals.map(({ completed: _completed, ...goal }) => goal);
}

export function getCompletedMissionsFromDailyGoals(goals: DailyGoalInstance[]) {
  return Object.fromEntries(goals.map((goal) => [goal.id, goal.completed]));
}

export function enrichDailyGoalInstances(goals: DailyGoalInstance[]) {
  return goals.map((goal) => {
    const template = getGoalById(goal.id);
    return template
      ? { ...goalToMission(template), completed: goal.completed }
      : goal;
  });
}

function getGoalTitlesFromIds(goalIds: string[]) {
  return goalIdsToDailyMissions(goalIds).map((goal) => goal.title);
}

function logDailyGoalsReadDebug({
  childId,
  date,
  source,
  remote,
  localRecord,
  finalGoals,
}: {
  childId: string;
  date: string;
  source: AuthoritativeDailyGoalsSource | 'empty';
  remote: SupabaseDailyGoalState | null;
  localRecord: DailyGoalsRecord | undefined;
  finalGoals: DailyMission[];
}) {
  console.info('[Goals] READ', {
    source,
    child_id: childId,
    date_key: date,
    supabase_row_id: remote?.id ?? null,
    supabase_updated_at: remote?.updatedAt ?? null,
    supabase_goal_titles: remote
      ? remote.goals.length > 0
        ? remote.goals.map((goal) => goal.title)
        : getGoalTitlesFromIds(remote.goalIds)
      : [],
    localStorage_goal_titles: localRecord
      ? localRecord.goalItems?.map((goal) => goal.title) ?? getGoalTitlesFromIds(localRecord.goals)
      : [],
    final_displayed_goal_titles: finalGoals.map((goal) => goal.title),
  });
}

export function goalIdsToDailyMissions(goalIds: string[]) {
  const goals = goalIds
    .map((goalId) => getGoalById(goalId))
    .filter((goal): goal is GoalTemplate => Boolean(goal))
    .slice(0, 3);

  if (goals.length === 3) {
    return goals.map(goalToMission);
  }

  return getFallbackGoalIds()
    .map((goalId) => getGoalById(goalId))
    .filter((goal): goal is GoalTemplate => Boolean(goal))
    .map(goalToMission);
}

export function readDailyGoalsByChild(): DailyGoalsByChild {
  if (typeof window === 'undefined') return {};
  ensureFreshStartLocalReset();

  try {
    const stored = window.localStorage.getItem(DAILY_GOALS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load daily goals', error);
    return {};
  }
}

export function writeDailyGoalsByChild(dailyGoals: DailyGoalsByChild) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DAILY_GOALS_STORAGE_KEY, JSON.stringify(dailyGoals));
}

export function readGoalSetupState(): GoalSetupState {
  if (typeof window === 'undefined') return { modeByChild: {} };
  ensureFreshStartLocalReset();

  try {
    const stored = window.localStorage.getItem(GOAL_SETUP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { modeByChild: {} };
  } catch (error) {
    console.error('Failed to load goal setup state', error);
    return { modeByChild: {} };
  }
}

export function writeGoalSetupState(goalSetup: GoalSetupState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GOAL_SETUP_STORAGE_KEY, JSON.stringify(goalSetup));
}

export function getGoalSetupMode(childId: string) {
  return readGoalSetupState().modeByChild[childId] ?? 'auto';
}

export function setGoalSetupMode(childId: string, mode: GoalSetupMode) {
  const current = readGoalSetupState();
  const next = {
    ...current,
    modeByChild: {
      ...current.modeByChild,
      [childId]: mode,
    },
  };
  writeGoalSetupState(next);
  return next;
}

export function ensureDailyGoalsForChild(childId: string, intentionalGenerate = false) {
  const today = getTodayKey();
  const dailyGoals = readDailyGoalsByChild();
  const current = dailyGoals[childId];

  if (current?.date === today) {
    const uniqueGoals = getUniqueGoalIds(current.goals);
    if (uniqueGoals.length === 3) {
      const completed = current.completed ?? {};
      return {
        ...current,
        goals: uniqueGoals,
        goalItems: current.goalItems ?? goalIdsToDailyGoalInstances(uniqueGoals, completed),
        completed,
      };
    }
  }

  if (intentionalGenerate) {
    return createRandomDailyGoalsRecord(current?.goals ?? [], today);
  }

  const goals = getFallbackGoalIds();
  return {
    date: today,
    source: 'random',
    goals,
    goalItems: goalIdsToDailyGoalInstances(goals),
    completed: Object.fromEntries(goals.map((goalId) => [goalId, false])),
    previousGoals: current?.goals ?? [],
  } satisfies DailyGoalsRecord;
}

export function getDailyGoalsForChild(childId: string) {
  const today = getTodayKey();
  const record = readDailyGoalsByChild()[childId];
  if (record?.date !== today || getUniqueGoalIds(record.goals).length !== 3) {
    return [];
  }
  return goalIdsToDailyMissions(record.goals);
}

export async function resolveAuthoritativeDailyGoalsForChild(
  childId: string
): Promise<AuthoritativeDailyGoalsResult> {
  const today = getTodayKey();
  const localRecord = readDailyGoalsByChild()[childId];
  const fetchResult = await fetchDailyGoalsForChildResult(childId, today);
  const remote = fetchResult.state;

  if (remote?.date === today && remote.goalIds.length === 3) {
    const remoteGoals = remote.goals.length === 3
      ? enrichDailyGoalInstances(remote.goals)
      : goalIdsToDailyGoalInstances(remote.goalIds);
    const completed = getCompletedMissionsFromDailyGoals(remoteGoals);
    const record: DailyGoalsRecord = {
      date: remote.date,
      source: remote.setupMode !== 'auto' ? remote.setupMode : 'random',
      goals: remote.goalIds,
      goalItems: remoteGoals,
      completed,
      previousGoals: remote.previousGoalIds,
    };
    writeDailyGoalsByChild({
      ...readDailyGoalsByChild(),
      [childId]: record,
    });
    const finalGoals = dailyGoalInstancesToMissions(remoteGoals);
    logDailyGoalsReadDebug({
      childId,
      date: today,
      source: 'supabase',
      remote,
      localRecord,
      finalGoals,
    });
    return {
      record,
      goals: finalGoals,
      remote,
      source: 'supabase',
      generationHappened: false,
      localStorageFallbackUsed: false,
    };
  }

  if (fetchResult.errorMessage) {
    const result = localStorageFallbackDailyGoalsResult(childId, today);
    logDailyGoalsReadDebug({
      childId,
      date: today,
      source: result.localStorageFallbackUsed ? 'local-fallback' : 'empty',
      remote,
      localRecord,
      finalGoals: result.goals,
    });
    return result;
  }

  const result = emptyDailyGoalsResult(childId, today);
  writeDailyGoalsByChild({
    ...readDailyGoalsByChild(),
    [childId]: result.record,
  });
  logDailyGoalsReadDebug({
    childId,
    date: today,
    source: 'empty',
    remote,
    localRecord,
    finalGoals: result.goals,
  });
  return result;
}

export async function updateDailyGoalCompletionForChild(
  childId: string,
  goalId: string,
  completed: boolean
) {
  const today = getTodayKey();
  const remote = await fetchDailyGoalsForChild(childId, today);
  if (!remote?.goalIds.includes(goalId)) return null;

  const currentGoals =
    remote.goals.length === 3
      ? enrichDailyGoalInstances(remote.goals)
      : goalIdsToDailyGoalInstances(remote.goalIds);
  const nextGoals = currentGoals.map((goal) =>
    goal.id === goalId ? { ...goal, completed } : goal
  );
  const nextCompleted = getCompletedMissionsFromDailyGoals(nextGoals);
  const nextRecord: DailyGoalsRecord = {
    date: remote.date,
    source: remote.setupMode !== 'auto' ? remote.setupMode : 'random',
    goals: nextGoals.map((goal) => goal.id),
    goalItems: nextGoals,
    completed: nextCompleted,
    previousGoals: remote.previousGoalIds,
  };
  const persisted = await upsertDailyGoalsForChild(
    childId,
    nextRecord,
    remote.setupMode,
    'verification_update'
  );
  const finalGoals = persisted?.goals.length === 3 ? enrichDailyGoalInstances(persisted.goals) : nextGoals;
  const finalRecord = {
    ...nextRecord,
    goalItems: finalGoals,
    completed: getCompletedMissionsFromDailyGoals(finalGoals),
  };
  writeDailyGoalsByChild({
    ...readDailyGoalsByChild(),
    [childId]: finalRecord,
  });
  return finalRecord;
}

export function setDailyGoalsForChild(
  childId: string,
  goalIds: string[],
  source: DailyGoalSource = 'manual'
) {
  const today = getTodayKey();
  const currentDailyGoals = readDailyGoalsByChild();
  const current = currentDailyGoals[childId];
  const uniqueGoals = getUniqueGoalIds(goalIds);
  const goals = uniqueGoals.length === 3 ? uniqueGoals : getFallbackGoalIds();
  const completed = Object.fromEntries(goals.map((goalId) => [goalId, false]));
  const nextRecord: DailyGoalsRecord = {
    date: today,
    source,
    goals,
    goalItems: goalIdsToDailyGoalInstances(goals, completed),
    completed,
    previousGoals: current?.goals ?? [],
  };
  return nextRecord;
}

export async function setAuthoritativeDailyGoalsForChild(
  childId: string,
  goalIds: string[],
  source: DailyGoalSource = 'manual',
  reason: DailyGoalsWriteReason = source === 'manual' ? 'manual_save' : 'randomise_click'
) {
  const today = getTodayKey();
  const currentDailyGoals = readDailyGoalsByChild();
  const current = currentDailyGoals[childId];
  const uniqueGoals = getUniqueGoalIds(goalIds);
  const goals = uniqueGoals.length === 3 ? uniqueGoals : getFallbackGoalIds();
  const completed = Object.fromEntries(goals.map((goalId) => [goalId, false]));
  const nextRecord: DailyGoalsRecord = {
    date: today,
    source,
    goals,
    goalItems: goalIdsToDailyGoalInstances(goals, completed),
    completed,
    previousGoals: current?.goals ?? [],
  };
  const persisted = await upsertDailyGoalsForChild(childId, nextRecord, source, reason);
  if (!persisted) {
    throw new Error(`Daily goals save failed for ${childId} on ${today}.`);
  }
  const finalGoals = persisted?.goals.length === 3
    ? enrichDailyGoalInstances(persisted.goals)
    : nextRecord.goalItems ?? goalIdsToDailyGoalInstances(nextRecord.goals);
  const finalRecord: DailyGoalsRecord = {
    date: persisted?.date ?? nextRecord.date,
    source: persisted?.setupMode && persisted.setupMode !== 'auto' ? persisted.setupMode : source,
    goals: finalGoals.map((goal) => goal.id),
    goalItems: finalGoals,
    completed: getCompletedMissionsFromDailyGoals(finalGoals),
    previousGoals: persisted?.previousGoalIds ?? nextRecord.previousGoals,
  };
  writeDailyGoalsByChild({
    ...currentDailyGoals,
    [childId]: finalRecord,
  });
  return finalRecord;
}

export function randomizeDailyGoalsForChild(childId: string) {
  const current = readDailyGoalsByChild()[childId];
  return {
    date: getTodayKey(),
    source: 'random',
    goals: getRandomGoalIds(current?.goals ?? []),
    previousGoals: current?.goals ?? [],
  } satisfies DailyGoalsRecord;
}

export async function randomizeAuthoritativeDailyGoalsForChild(childId: string) {
  const current = readDailyGoalsByChild()[childId];
  const goalIds = getRandomGoalIds(current?.goals ?? []);
  console.info('[Goals] Randomise click generated goals', {
    child_id: childId,
    date: getTodayKey(),
    generated_goal_ids: goalIds,
    generated_goal_titles: goalIdsToDailyMissions(goalIds).map((goal) => goal.title),
  });
  return setAuthoritativeDailyGoalsForChild(
    childId,
    goalIds,
    'random',
    'randomise_click'
  );
}

export function readChildDashboardState(childId: string): Partial<ChildDashboardState> | null {
  if (typeof window === 'undefined') return null;
  ensureFreshStartLocalReset();

  try {
    const stored = window.localStorage.getItem(getChildDashboardStorageKey(childId));
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load dashboard state', error);
    return null;
  }
}

export function writeChildDashboardState(
  childId: string,
  state: ChildDashboardState
) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getChildDashboardStorageKey(childId), JSON.stringify(state));
  writeChildSupabaseSyncMeta(childId, { lastLocalWriteAt: new Date().toISOString() });
}

const lastSupabaseMirrorByChild = new Map<string, string>();
const remoteHydrationFailedByChild = new Set<string>();

function getSharedStateMirrorKey(state: Partial<ChildDashboardState>) {
  return JSON.stringify({
    stars: state.stars,
    hearts: state.hearts,
    screenEnergy: state.screenEnergy,
    activePetId: state.activePetId ?? state.activePetType,
    activeSkins: state.activeSkins,
    unlockedPets: state.unlockedPets,
    ownedSkins: state.ownedSkins,
    activeEgg: state.activeEgg,
    comfort: state.comfort,
    moodUpdatedAt: state.moodUpdatedAt,
  });
}

function mirrorChildDashboardStateToSupabase(
  childId: string,
  child: Child,
  state: ChildDashboardState
) {
  if (typeof window === 'undefined') return;

  const syncMeta = readChildSupabaseSyncMeta(childId);
  if (remoteHydrationFailedByChild.has(childId) && !syncMeta.migratedToSupabase) {
    writeChildSupabaseSyncMeta(childId, {
      lastSyncSource: 'local-fallback',
      lastSyncError:
        'Supabase fetch failed, so local/default fallback was not mirrored to Supabase.',
    });
    return;
  }

  const mirrorKey = getSharedStateMirrorKey(state);
  if (lastSupabaseMirrorByChild.get(childId) === mirrorKey) return;
  lastSupabaseMirrorByChild.set(childId, mirrorKey);

  void upsertChildStateFromDashboard(child, state)
    .then((remoteState) => {
      if (!remoteState) {
        writeChildSupabaseSyncMeta(childId, {
          lastSyncSource: 'local-fallback',
          lastSyncError: 'Supabase write skipped or unavailable.',
        });
        return;
      }

      writeChildSupabaseSyncMeta(childId, {
        migratedToSupabase: true,
        lastRemoteUpdatedAt: remoteState.updatedAt,
        lastSupabaseWriteAt: new Date().toISOString(),
        lastSyncSource: 'supabase-write',
        lastSyncError: null,
      });
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'Unknown Supabase write error.';
      writeChildSupabaseSyncMeta(childId, {
        lastSyncSource: 'local-fallback',
        lastSyncError: message,
      });
      console.warn('Failed to mirror child state to Supabase.', error);
    });
}

function applyRemoteMoodDecay(
  childId: string,
  child: Child,
  remoteState: SupabaseChildState
): SupabaseChildState {
  const decay = applyMoodDecay(remoteState.moodPercent, remoteState.moodUpdatedAt);
  const moodSource = decay.decayApplied ? 'supabase-decayed' : 'supabase';

  writeChildSupabaseSyncMeta(childId, {
    lastMoodSource: moodSource,
    lastMoodPercent: decay.moodPercent,
    lastMoodUpdatedAt: decay.moodUpdatedAt,
    lastMoodDecayApplied: decay.decayApplied,
    lastMoodDisplayed: decay.moodPercent,
  });

  if (decay.decayApplied) {
    void updateChildMood(child, decay.moodPercent, decay.moodUpdatedAt);
  }

  return {
    ...remoteState,
    moodPercent: decay.moodPercent,
    moodUpdatedAt: decay.moodUpdatedAt,
  };
}

export function saveChildMoodToLocalCache(
  childId: string,
  child: Child,
  moodPercent: number,
  moodUpdatedAt = new Date().toISOString(),
  decayInfo?: Pick<MoodDecayResult, 'decayApplied'>
) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  const nextState = {
    ...current,
    comfort: clampMoodPercent(moodPercent),
    moodUpdatedAt,
  };
  writeChildDashboardState(childId, nextState);
  writeChildSupabaseSyncMeta(childId, {
    lastMoodSource: 'supabase-write',
    lastMoodPercent: nextState.comfort,
    lastMoodUpdatedAt: nextState.moodUpdatedAt,
    lastMoodDecayApplied: decayInfo?.decayApplied ?? false,
    lastMoodDisplayed: nextState.comfort,
  });
  return nextState;
}

export async function syncChildMood(
  childId: string,
  child: Child,
  moodPercent: number,
  moodUpdatedAt = new Date().toISOString()
) {
  const normalizedMood = clampMoodPercent(moodPercent);
  const remoteState = await updateChildMood(child, normalizedMood, moodUpdatedAt);

  if (remoteState) {
    return saveChildMoodToLocalCache(
      childId,
      child,
      remoteState.moodPercent,
      remoteState.moodUpdatedAt
    );
  }

  const nextState = saveChildMoodToLocalCache(childId, child, normalizedMood, moodUpdatedAt);
  writeChildSupabaseSyncMeta(childId, {
    lastMoodSource: 'local-fallback',
    lastSyncError: 'Supabase mood write skipped or unavailable.',
  });
  return nextState;
}

export async function hydrateChildDashboardStateFromSupabase(
  childId: string,
  child: Child
) {
  const storedState = readChildDashboardState(childId);
  const localState = mergeWithDefaultChildState(child, storedState);
  const syncMeta = readChildSupabaseSyncMeta(childId);
  const fetchedRemoteState = await fetchChildState(child);

  if (!fetchedRemoteState) {
    remoteHydrationFailedByChild.add(childId);
    writeChildSupabaseSyncMeta(childId, {
      lastSyncSource: 'local-fallback',
      lastSyncError: 'Supabase fetch unavailable. Using localStorage.',
      lastMoodSource: 'local-fallback',
      lastMoodPercent: localState.comfort,
      lastMoodUpdatedAt: localState.moodUpdatedAt,
      lastMoodDisplayed: localState.comfort,
    });
    return localState;
  }

  remoteHydrationFailedByChild.delete(childId);
  const remoteState = applyRemoteMoodDecay(childId, child, fetchedRemoteState);

  const mergedState = mergeSupabaseChildState(localState, remoteState);
  writeChildDashboardState(childId, mergedState);
  lastSupabaseMirrorByChild.set(childId, getSharedStateMirrorKey(mergedState));
  writeChildSupabaseSyncMeta(childId, {
    migratedToSupabase: true,
    lastRemoteUpdatedAt: remoteState.updatedAt,
    lastSyncSource: storedState && !syncMeta.migratedToSupabase
      ? 'supabase-skipped-stale-local'
      : 'supabase',
    lastSyncError: null,
  });
  return mergedState;
}

export function mergeWithDefaultChildState(
  child: Child,
  stored: Partial<ChildDashboardState> | null
): ChildDashboardState {
  const defaults = getDefaultChildDashboardState(child);
  const resetForNewDay = stored?.careResetDate && stored.careResetDate !== getTodayKey();
  const resetGoalsForNewDay = stored?.goalsDate && stored.goalsDate !== getTodayKey();
  const fallbackPet = defaults.activePetType;
  const unlockedPets = normalizeUnlockedPets(stored?.unlockedPets, fallbackPet);
  const ownedSkins = normalizeOwnedSkins(stored?.ownedSkins);
  const rawActiveSkins = normalizeActiveSkins(stored?.activeSkins);
  const activeSkins: Record<PetType, SkinId | null> = {
    luna:  ownedSkins.includes(rawActiveSkins.luna  as SkinId) ? rawActiveSkins.luna  : null,
    bubbo: ownedSkins.includes(rawActiveSkins.bubbo as SkinId) ? rawActiveSkins.bubbo : null,
    mochi: ownedSkins.includes(rawActiveSkins.mochi as SkinId) ? rawActiveSkins.mochi : null,
    ember: ownedSkins.includes(rawActiveSkins.ember as SkinId) ? rawActiveSkins.ember : null,
  };
  const requestedActivePet = stored?.activePetId ?? stored?.activePetType;
  const activePetId =
    requestedActivePet && unlockedPets.includes(requestedActivePet)
      ? requestedActivePet
      : fallbackPet;

  return {
    ...defaults,
    ...stored,
    stars: stored?.stars ?? defaults.stars,
    hearts: stored?.hearts ?? defaults.hearts,
    screenEnergy: normalizeScreenEnergy(stored?.screenEnergy ?? defaults.screenEnergy),
    activePetId,
    activePetType: activePetId,
    unlockedPets,
    activeEgg: normalizeActiveEgg(stored?.activeEgg),
    eggMessage: stored?.eggMessage ?? defaults.eggMessage,
    comfort: clampMoodPercent(stored?.comfort ?? defaults.comfort),
    completedMissions: resetGoalsForNewDay
      ? defaults.completedMissions
      : stored?.completedMissions ?? defaults.completedMissions,
    ownedSkins,
    activeSkins,
    dailyActionCounts: resetForNewDay
      ? defaults.dailyActionCounts
      : { ...defaults.dailyActionCounts, ...stored?.dailyActionCounts },
    lastActionTimestamps: resetForNewDay
      ? defaults.lastActionTimestamps
      : { ...defaults.lastActionTimestamps, ...stored?.lastActionTimestamps },
    poopEvents: reconcilePoopEvents(normalizePoopEvents(stored?.poopEvents), new Date()),
    careResetDate: resetForNewDay ? defaults.careResetDate : stored?.careResetDate ?? defaults.careResetDate,
    patHeartAwarded: resetForNewDay ? false : stored?.patHeartAwarded ?? defaults.patHeartAwarded,
    goalsDate: resetGoalsForNewDay ? defaults.goalsDate : stored?.goalsDate ?? defaults.goalsDate,
    moodUpdatedAt: stored?.moodUpdatedAt ?? defaults.moodUpdatedAt,
  };
}

export function saveChildDashboardState(
  childId: string,
  child: Child,
  updates: Partial<ChildDashboardState>,
  options: SaveChildDashboardOptions = {}
) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  const nextUnlockedPets = updates.unlockedPets
    ? Array.from(new Set([...current.unlockedPets, ...updates.unlockedPets]))
    : current.unlockedPets;
  const requestedActivePet = updates.activePetId ?? updates.activePetType ?? current.activePetId;
  const activePetId = nextUnlockedPets.includes(requestedActivePet)
    ? requestedActivePet
    : nextUnlockedPets[0] ?? current.activePetId;
  const nextState = {
    ...current,
    ...updates,
    completedMissions: updates.completedMissions ?? current.completedMissions,
    unlockedPets: nextUnlockedPets,
    activePetId,
    activePetType: activePetId,
    activeEgg: resolveActiveEggUpdate(current.activeEgg, updates.activeEgg, options),
    eggMessage: updates.eggMessage === undefined ? current.eggMessage : updates.eggMessage,
    ownedSkins: updates.ownedSkins ?? current.ownedSkins,
    activeSkins: updates.activeSkins ?? current.activeSkins,
    dailyActionCounts: updates.dailyActionCounts ?? current.dailyActionCounts,
    lastActionTimestamps: updates.lastActionTimestamps ?? current.lastActionTimestamps,
    poopEvents: updates.poopEvents
      ? reconcilePoopEvents(updates.poopEvents, new Date())
      : current.poopEvents,
    careResetDate: updates.careResetDate ?? current.careResetDate,
    patHeartAwarded: updates.patHeartAwarded ?? current.patHeartAwarded,
    goalsDate: updates.goalsDate ?? current.goalsDate,
    comfort: clampMoodPercent(updates.comfort ?? current.comfort),
    moodUpdatedAt: updates.moodUpdatedAt ?? current.moodUpdatedAt,
  };
  writeChildDashboardState(childId, nextState);
  mirrorChildDashboardStateToSupabase(childId, child, nextState);
  return nextState;
}

function resolveActiveEggUpdate(
  currentEgg: SecretEggState | null,
  updatedEgg: SecretEggState | null | undefined,
  options: SaveChildDashboardOptions
) {
  if (updatedEgg === undefined) return currentEgg;
  if (!updatedEgg) return null;
  if (!currentEgg || currentEgg.id !== updatedEgg.id) return updatedEgg;
  if (options.allowEggProgressRegression) return updatedEgg;
  if (updatedEgg.hatched && !currentEgg.hatched) return updatedEgg;
  if (currentEgg.hatched && !updatedEgg.hatched) return currentEgg;
  if (updatedEgg.progress < currentEgg.progress) return currentEgg;
  return updatedEgg;
}

export function setMissionCompletion(
  childId: string,
  child: Child,
  mission: DailyMission,
  completed: boolean,
  options: { mirrorToSupabase?: boolean } = {}
) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  const wasCompleted = current.completedMissions[mission.id] ?? false;

  if (wasCompleted === completed) {
    return current;
  }

  const completedMissions = {
    ...current.completedMissions,
    [mission.id]: completed,
  };

  const starReward = mission.starReward ?? mission.reward;
  const stars = clampStars(current.stars + (completed ? starReward : -starReward));
  const moodUpdatedAt = new Date().toISOString();
  const comfort = completed
    ? boostMoodPercent(current.comfort, VERIFIED_GOAL_MOOD_REWARD)
    : current.comfort;
  const nextState = { ...current, completedMissions, stars, comfort, moodUpdatedAt };
  writeChildDashboardState(childId, nextState);
  void updateDailyGoalCompletionForChild(childId, mission.id, completed);
  if (options.mirrorToSupabase !== false) {
    mirrorChildDashboardStateToSupabase(childId, child, nextState);
  }
  return nextState;
}

export const SECRET_EGG_COST = 50;
export const SECRET_EGG_REQUIRED_GOALS = 10;

export function getLockedPets(state: ChildDashboardState) {
  return PET_ROSTER.filter((pet) => !state.unlockedPets.includes(pet.id));
}

export function getRandomLockedPet(unlockedPets: PetRosterItem['id'][]) {
  const lockedPets = PET_ROSTER.filter((pet) => !unlockedPets.includes(pet.id));
  if (lockedPets.length === 0) return null;
  return lockedPets[Math.floor(Math.random() * lockedPets.length)];
}

export function createSecretEgg(childId: string, child: Child) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  if (current.activeEgg && !current.activeEgg.hatched) {
    return {
      state: current,
      ok: false,
      message: 'You already have a Secret Egg hatching!',
    };
  }

  if (getLockedPets(current).length === 0) {
    return {
      state: current,
      ok: false,
      message: 'You have unlocked all pets!',
    };
  }

  if (current.stars < SECRET_EGG_COST) {
    return {
      state: current,
      ok: false,
      message: 'Not enough stars for a Secret Egg.',
    };
  }

  const nextState = saveChildDashboardState(childId, child, {
    stars: clampStars(current.stars - SECRET_EGG_COST),
    activeEgg: {
      id: `secret-egg-${Date.now()}`,
      type: 'secret-egg',
      progress: 0,
      requiredGoals: SECRET_EGG_REQUIRED_GOALS,
      contributedGoalIds: [],
      hatched: false,
      unlockedPetId: null,
    },
    eggMessage: null,
  });

  return {
    state: nextState,
    ok: true,
    message: 'Secret Egg started hatching!',
  };
}

export function clearEggMessage(childId: string, child: Child) {
  return saveChildDashboardState(childId, child, { eggMessage: null });
}

export function selectActivePet(childId: string, child: Child, petId: PetRosterItem['id']) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  if (!current.unlockedPets.includes(petId)) return current;
  return saveChildDashboardState(childId, child, { activePetId: petId, activePetType: petId });
}

export function updateSecretEggProgressForGoal(
  childId: string,
  child: Child,
  goalContributionId: string,
  completed: boolean
) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  const egg = current.activeEgg;
  if (!egg || egg.hatched) return current;

  const hasContribution = egg.contributedGoalIds.includes(goalContributionId);
  if (completed && hasContribution) return current;
  if (!completed && !hasContribution) return current;

  const contributedGoalIds = completed
    ? [...egg.contributedGoalIds, goalContributionId]
    : egg.contributedGoalIds.filter((goalId) => goalId !== goalContributionId);
  const progress = completed
    ? Math.max(
        0,
        Math.min(egg.requiredGoals, Math.max(egg.progress + 1, contributedGoalIds.length))
      )
    : Math.max(
        0,
        Math.min(egg.requiredGoals, Math.min(egg.progress - 1, contributedGoalIds.length))
      );

  if (progress < egg.requiredGoals) {
    return saveChildDashboardState(childId, child, {
      activeEgg: {
        ...egg,
        progress,
        contributedGoalIds,
      },
    }, { allowEggProgressRegression: !completed });
  }

  const unlockedPet = getRandomLockedPet(current.unlockedPets);
  if (!unlockedPet) {
    return saveChildDashboardState(childId, child, {
      activeEgg: {
        ...egg,
        progress,
        contributedGoalIds,
        hatched: true,
      },
      eggMessage: 'Your Secret Egg hatched, but all pets are already unlocked!',
    });
  }

  return saveChildDashboardState(childId, child, {
    unlockedPets: [...current.unlockedPets, unlockedPet.id],
    activeEgg: {
      ...egg,
      progress: egg.requiredGoals,
      contributedGoalIds,
      hatched: true,
      unlockedPetId: unlockedPet.id,
    },
    eggMessage: `Your Secret Egg hatched! You unlocked ${unlockedPet.name}!`,
  });
}

export function purchaseSkin(childId: string, child: Child, skinId: SkinId) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  const skin = SKIN_ROSTER.find((s) => s.id === skinId);
  if (!skin) return { state: current, ok: false, message: 'Unknown skin.' };
  if (current.ownedSkins.includes(skinId)) return { state: current, ok: false, message: 'You already own this look!' };
  if (current.stars < skin.cost) return { state: current, ok: false, message: 'Not enough stars!' };

  const nextState = saveChildDashboardState(childId, child, {
    stars: clampStars(current.stars - skin.cost),
    ownedSkins: [...current.ownedSkins, skinId],
  });
  return { state: nextState, ok: true, message: `${skin.name} unlocked!` };
}

export function setActiveSkin(
  childId: string,
  child: Child,
  petType: PetType,
  skinId: SkinId | null
) {
  const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
  if (skinId !== null && !current.ownedSkins.includes(skinId)) return current;
  return saveChildDashboardState(childId, child, {
    activeSkins: { ...current.activeSkins, [petType]: skinId },
  });
}
