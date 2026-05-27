import type { Pet } from '@/lib/mock-data';
import type { CareActionType, CompletedMissions, DailyActionCounts } from '@/lib/mission-state';

export type PetMood = 'neutral' | 'happy' | 'sad' | 'sleep';
export type PetType = Pet['pet'];

export const INITIAL_MOOD_PERCENT = 70;
export const MIN_MOOD_PERCENT = 30;
export const MAX_MOOD_PERCENT = 100;
export const MOOD_DECAY_PERCENT = 10;
export const MOOD_DECAY_INTERVAL_MS = 12 * 60 * 60 * 1000;

export type MoodDecayResult = {
  moodPercent: number;
  moodUpdatedAt: string;
  decayApplied: boolean;
  decaySteps: number;
};

export const petMoodImages: Record<PetType, Record<PetMood, string>> = {
  bubbo: {
    neutral: '/pets/bubbo/moods/neutral.png',
    happy: '/pets/bubbo/moods/happy.png',
    sad: '/pets/bubbo/moods/sad.png',
    sleep: '/pets/bubbo/moods/sleepy.png',
  },
  luna: {
    neutral: '/pets/luna/moods/neutral.png',
    happy: '/pets/luna/moods/happy.png',
    sad: '/pets/luna/moods/sad.png',
    sleep: '/pets/luna/moods/sleepy.png',
  },
  mochi: {
    neutral: '/pets/mochi/neutral.png',
    happy: '/pets/mochi/happy.png',
    sad: '/pets/mochi/sad.png',
    sleep: '/pets/mochi/sleepy.png',
  },
  ember: {
    neutral: '/pets/ember/neutral.png',
    happy: '/pets/ember/happy.png',
    sad: '/pets/ember/sad.png',
    sleep: '/pets/ember/sleepy.png',
  },
};

type DisplayMoodInput = {
  comfort: number;
  completedMissionsToday: number;
  careActionsToday: number;
  hourNow: number;
};

export function getDisplayMood({
  comfort,
  completedMissionsToday,
  careActionsToday,
  hourNow,
}: DisplayMoodInput): PetMood {
  const isSleepTime = hourNow >= 21 || hourNow < 6;

  if (isSleepTime) {
    return 'sleep';
  }

  if (
    comfort < 35 ||
    (hourNow >= 18 && completedMissionsToday === 0 && careActionsToday === 0)
  ) {
    return 'sad';
  }

  if (comfort >= 70 && (completedMissionsToday > 0 || careActionsToday > 0)) {
    return 'happy';
  }

  return 'neutral';
}

export function clampMoodPercent(value: number) {
  if (!Number.isFinite(value)) return INITIAL_MOOD_PERCENT;
  return Math.max(MIN_MOOD_PERCENT, Math.min(MAX_MOOD_PERCENT, Math.round(value)));
}

export function applyMoodDecay(
  moodPercent: number,
  moodUpdatedAt: string | null | undefined,
  now = new Date()
): MoodDecayResult {
  const normalizedMood = clampMoodPercent(moodPercent);
  const parsedUpdatedAt = moodUpdatedAt ? new Date(moodUpdatedAt) : null;

  if (!parsedUpdatedAt || Number.isNaN(parsedUpdatedAt.getTime())) {
    return {
      moodPercent: normalizedMood,
      moodUpdatedAt: now.toISOString(),
      decayApplied: false,
      decaySteps: 0,
    };
  }

  const elapsedMs = now.getTime() - parsedUpdatedAt.getTime();
  const decaySteps = Math.max(0, Math.floor(elapsedMs / MOOD_DECAY_INTERVAL_MS));
  const decayedMood = clampMoodPercent(normalizedMood - decaySteps * MOOD_DECAY_PERCENT);
  const decayApplied = decayedMood !== normalizedMood;

  return {
    moodPercent: decayedMood,
    moodUpdatedAt: decayApplied ? now.toISOString() : parsedUpdatedAt.toISOString(),
    decayApplied,
    decaySteps,
  };
}

export function boostMoodPercent(currentMood: number, boost: number) {
  return Math.min(MAX_MOOD_PERCENT, clampMoodPercent(currentMood) + boost);
}

export function countCompletedMissionsToday(completedMissions: CompletedMissions) {
  return Object.values(completedMissions).filter(Boolean).length;
}

export function countCareActionsToday(dailyActionCounts: DailyActionCounts) {
  return (Object.keys(dailyActionCounts) as CareActionType[]).reduce(
    (total, action) => total + (dailyActionCounts[action] ?? 0),
    0
  );
}
