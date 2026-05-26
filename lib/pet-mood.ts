import type { Pet } from '@/lib/mock-data';
import type { CareActionType, CompletedMissions, DailyActionCounts } from '@/lib/mission-state';

export type PetMood = 'neutral' | 'happy' | 'sad' | 'sleep';
export type PetType = Pet['pet'];

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

export function countCompletedMissionsToday(completedMissions: CompletedMissions) {
  return Object.values(completedMissions).filter(Boolean).length;
}

export function countCareActionsToday(dailyActionCounts: DailyActionCounts) {
  return (Object.keys(dailyActionCounts) as CareActionType[]).reduce(
    (total, action) => total + (dailyActionCounts[action] ?? 0),
    0
  );
}
