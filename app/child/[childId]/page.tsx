'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PET_ROSTER, getChild, getPetByChildId, type PetRosterItem } from '@/lib/mock-data';
import {
  CareActionType,
  DailyActionCounts,
  DailyMission,
  LastActionTimestamps,
  PoopEvent,
  SecretEggState,
  SkinId,
  PetType,
  clearPoopEvents,
  clearEggMessage,
  careActionConfig,
  getPoopPenaltyInfo,
  getDailyGoalsStorageKey,
  getDefaultDailyActionCounts,
  getDefaultLastActionTimestamps,
  getUnclearedPoopEvents,
  getTodayKey,
  hydrateChildDashboardStateFromSupabase,
  mergeWithDefaultChildState,
  readChildDashboardState,
  readChildSupabaseSyncMeta,
  reconcilePoopEvents,
  resolveAuthoritativeDailyGoalsForChild,
  saveChildDashboardState,
  setActiveSkin,
  syncChildMood,
  writeChildDashboardState,
} from '@/lib/mission-state';
import { fetchCareStateForChild, upsertCareStateForChild } from '@/lib/supabase-care-state';
import { hasSupabaseBrowserEnv } from '@/lib/supabase-browser';

type SyncDebugInfo = {
  supabaseEnv: boolean;
  childId: string;
  dateKey: string;
  hydratedStars: number;
  syncSource: string;
  syncError: string | null;
  goalsDate: string | null;
  supabaseGoalRowId: string | null;
  supabaseGoalRowDate: string | null;
  goalsIds: string;
  goalsSource: 'supabase' | 'supabase-generated' | 'local-fallback';
  goalsTitles: string;
  completedStates: string;
  generationHappened: boolean;
  randomiseHappened: boolean;
  localStorageFallbackUsed: boolean;
  completedGoalIds: string;
  moodSource: string;
  moodPercent: number;
  moodUpdatedAt: string | null;
  moodDecayApplied: boolean;
  displayedMoodPercent: number;
  poopPresent: boolean;
  unclearedPoopCount: number;
  oldestPoopTime: string | null;
  poopPenaltyApplied: boolean;
  poopPenaltyAmount: number;
};
import { getSkinById, skinsByPet } from '@/lib/pet-skins';
import { PetAvatar } from '@/components/PetAvatar';
import {
  PetActionOverlay,
  type PetReaction,
} from '@/components/pets/PetActionOverlay';
import {
  boostMoodPercent,
  countCareActionsToday,
  getDisplayMood,
  petMoodImages,
} from '@/lib/pet-mood';
import { formatWeekendScreenTime } from '@/lib/screen-energy';
import { ChildPageFrame } from '@/app/child/_components/ChildSidebar';
import { AnimatePresence, motion } from 'framer-motion';

const reactionSpeech: Record<CareActionType, string> = {
  feed: 'Yum yum!',
  pat: 'I love that!',
  clean: 'So clean!',
};

const floatingLabel: Record<CareActionType, string> = {
  feed: 'Yummy!',
  pat: 'I feel loved!',
  clean: 'So fresh!',
};

type DebugMoodValues = {
  comfort: number;
  completedMissionsToday: number;
  feed: number;
  pat: number;
  clean: number;
  hourNow: number;
};

function CareParticles({ type }: { type: CareActionType }) {
  const particles = Array.from({ length: type === 'pat' ? 6 : 7 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[40px]">
      {particles.map((_, index) => {
        const left = 18 + index * 10 + (index % 2) * 6;
        const delay = index * 0.05;

        if (type === 'clean') {
          return (
            <motion.span
              key={index}
              className="absolute bottom-16 h-3 w-3 rounded-full border border-cyan-200 bg-cyan-100/70 shadow-sm"
              style={{ left: `${left}%` }}
              initial={{ y: 18, opacity: 0, scale: 0.5 }}
              animate={{ y: -72 - index * 4, opacity: [0, 1, 0], scale: [0.5, 1.05, 0.8] }}
              transition={{ duration: 0.95, delay, ease: 'easeOut' }}
            />
          );
        }

        if (type === 'pat') {
          return (
            <motion.span
              key={index}
              className="absolute bottom-20 text-lg font-bold text-pink-400"
              style={{ left: `${left}%` }}
              initial={{ y: 16, opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ y: -78 - index * 3, opacity: [0, 1, 0], scale: [0.6, 1.15, 0.9], rotate: 8 }}
              transition={{ duration: 1, delay, ease: 'easeOut' }}
            >
              &hearts;
            </motion.span>
          );
        }

        return (
          <motion.span
            key={index}
            className="absolute bottom-14 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
            style={{ left: `${left}%` }}
            initial={{ y: 12, opacity: 0, scale: 0.4 }}
            animate={{ y: -58 - index * 5, opacity: [0, 1, 0], scale: [0.4, 1.2, 0.7] }}
            transition={{ duration: 0.85, delay, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

export default function ChildHome() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = params.childId as string;

  const child = getChild(childId);
  const pet = getPetByChildId(childId);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const [stars, setStars] = useState(child?.stars ?? 0);
  const [hearts, setHearts] = useState(child?.hearts ?? 0);
  const [screenEnergy, setScreenEnergy] = useState(child?.screenEnergy ?? 0);
  const [activePetType, setActivePetType] = useState<PetRosterItem['id']>(
    pet?.pet ?? 'bubbo'
  );
  const [activeEgg, setActiveEgg] = useState<SecretEggState | null>(null);
  const [eggMessage, setEggMessage] = useState<string | null>(null);
  const [comfort, setComfort] = useState(70);
  const [moodUpdatedAt, setMoodUpdatedAt] = useState<string | null>(null);
  const [missionTemplates, setMissionTemplates] = useState<DailyMission[]>(
    []
  );
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});
  const [dailyActionCounts, setDailyActionCounts] = useState<DailyActionCounts>(
    getDefaultDailyActionCounts
  );
  const [lastActionTimestamps, setLastActionTimestamps] = useState<LastActionTimestamps>(
    getDefaultLastActionTimestamps
  );
  const [poopEvents, setPoopEvents] = useState<PoopEvent[]>([]);
  const [careResetDate, setCareResetDate] = useState('');
  const [patHeartAwarded, setPatHeartAwarded] = useState(false);
  const [ownedSkins, setOwnedSkins] = useState<SkinId[]>([]);
  const [activeSkins, setActiveSkins] = useState<Record<PetType, SkinId | null>>({ luna: null, bubbo: null, mochi: null, ember: null });
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [careWriteInFlight, setCareWriteInFlight] = useState<CareActionType | null>(null);
  const [careReaction, setCareReaction] = useState<PetReaction | null>(null);
  const [comfortPulseKey, setComfortPulseKey] = useState(0);
  const [hourNow, setHourNow] = useState(() => new Date().getHours());
  const [showMoodDebug, setShowMoodDebug] = useState(false);
  const [useDebugMoodValues, setUseDebugMoodValues] = useState(false);
  const [syncDebug, setSyncDebug] = useState<SyncDebugInfo | null>(null);
  const [debugMoodValues, setDebugMoodValues] = useState<DebugMoodValues>({
    comfort: 50,
    completedMissionsToday: 0,
    feed: 0,
    pat: 0,
    clean: 0,
    hourNow: 10,
  });
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionIdRef = useRef(0);
  const lastCareStateKeyRef = useRef('');
  const careWriteInFlightRef = useRef(false);

  useEffect(() => {
    if (!child) return;

    // Applies all React state from a parsed dashboard state object.
    // Does NOT set dashboardLoaded — that must only happen after Supabase hydration
    // to prevent stale localStorage values from being written back to Supabase.
    const applyDashboardState = (
      parsed: ReturnType<typeof mergeWithDefaultChildState>,
      goals?: DailyMission[]
    ) => {
      if (goals) setMissionTemplates(goals);
      setStars(parsed.stars);
      setHearts(parsed.hearts);
      setScreenEnergy(parsed.screenEnergy);
      setActivePetType(parsed.activePetId);
      setActiveEgg(parsed.activeEgg);
      setEggMessage(parsed.eggMessage);
      setComfort(parsed.comfort);
      setMoodUpdatedAt(parsed.moodUpdatedAt);
      if (goals) setCompletedMissions(parsed.completedMissions);
      setDailyActionCounts(parsed.dailyActionCounts);
      setLastActionTimestamps(parsed.lastActionTimestamps);
      setPoopEvents(parsed.poopEvents);
      setCareResetDate(parsed.careResetDate);
      setPatHeartAwarded(parsed.patHeartAwarded);
      setOwnedSkins(parsed.ownedSkins);
      setActiveSkins(parsed.activeSkins);
    };

    const syncFromStorage = () => {
      applyDashboardState(mergeWithDefaultChildState(child, readChildDashboardState(childId)));
    };

    syncFromStorage();

    let capturedGoals: Awaited<ReturnType<typeof resolveAuthoritativeDailyGoalsForChild>> | null = null;
    let capturedCareState: {
      date: string;
      actionCounts: DailyActionCounts;
      lastTimestamps: LastActionTimestamps;
      poopEvents: PoopEvent[];
      patHeartAwarded: boolean;
    } | null = null;

    void Promise.all([
      hydrateChildDashboardStateFromSupabase(childId, child),
      resolveAuthoritativeDailyGoalsForChild(childId).then((resolved) => {
        capturedGoals = resolved;
        console.log(
          '[Goals] Child page authoritative goals:',
          resolved.record.goals,
          'date:',
          resolved.record.date,
          'source:',
          resolved.source,
          'generated:',
          resolved.generationHappened
        );
      }),
      fetchCareStateForChild(childId).then((careState) => {
        capturedCareState = careState;
      }),
    ]).then(([hydratedState]) => {
      const today = getTodayKey();
      // If Supabase has valid care state for today, overlay it on the hydrated state.
      // Older Supabase care rows can still carry uncleared poop events for penalty sync,
      // but their daily action counts must not carry into a new day.
      // Writing back to localStorage prevents the 1-second syncFromStorage interval
      // from re-reading stale care counts from the old local cache.
      const syncedPoopEvents = capturedCareState
        ? reconcilePoopEvents(capturedCareState.poopEvents)
        : hydratedState.poopEvents;
      const mergedState =
        capturedCareState && capturedCareState.date === today
          ? {
              ...hydratedState,
              dailyActionCounts: capturedCareState.actionCounts,
              lastActionTimestamps: capturedCareState.lastTimestamps,
              poopEvents: syncedPoopEvents,
              patHeartAwarded: capturedCareState.patHeartAwarded,
              careResetDate: today,
            }
          : {
              ...hydratedState,
              poopEvents: syncedPoopEvents,
            };
      if (capturedCareState) {
        writeChildDashboardState(childId, mergedState);
      }
      const resolvedGoals = capturedGoals?.goals ?? [];
      const dailyGoalCompletedMissions = capturedGoals?.record.completed;
      const displayState = dailyGoalCompletedMissions
        ? {
            ...mergedState,
            completedMissions: dailyGoalCompletedMissions,
            goalsDate: capturedGoals?.record.date ?? getTodayKey(),
          }
        : mergedState;
      applyDashboardState(displayState, resolvedGoals);
      // setDashboardLoaded MUST be set here (post-hydration) not in syncFromStorage.
      // Setting it early causes saveChildDashboardState to fire with stale localStorage
      // values (stars=0 etc) which then race-write to Supabase before the fetch returns.
      setDashboardLoaded(true);
      const syncMeta = readChildSupabaseSyncMeta(childId);
      const todayKey = getTodayKey();
      const poopPenalty = getPoopPenaltyInfo(mergedState.poopEvents);
      setSyncDebug({
        supabaseEnv: hasSupabaseBrowserEnv(),
        childId,
        dateKey: todayKey,
        hydratedStars: hydratedState.stars,
        syncSource: syncMeta.lastSyncSource,
        syncError: syncMeta.lastSyncError,
        goalsDate: capturedGoals?.record.date ?? null,
        supabaseGoalRowId: capturedGoals?.remote?.id ?? null,
        supabaseGoalRowDate: capturedGoals?.remote?.date ?? null,
        goalsIds: capturedGoals?.record.goals.join(', ') ?? 'none',
        goalsSource: capturedGoals?.source ?? 'local-fallback',
        goalsTitles: resolvedGoals.map((g) => g.title).join(' / '),
        completedStates: capturedGoals?.record.goalItems
          ?.map((goal) => `${goal.id}:${goal.completed ? 'yes' : 'no'}`)
          .join(', ') ?? 'none',
        generationHappened: capturedGoals?.generationHappened ?? false,
        randomiseHappened: false,
        localStorageFallbackUsed: capturedGoals?.localStorageFallbackUsed ?? false,
        completedGoalIds:
          Object.keys(displayState.completedMissions ?? {})
            .filter((id) => (displayState.completedMissions ?? {})[id])
            .join(', ') || 'none',
        moodSource: syncMeta.lastMoodSource,
        moodPercent: syncMeta.lastMoodPercent,
        moodUpdatedAt: syncMeta.lastMoodUpdatedAt,
        moodDecayApplied: syncMeta.lastMoodDecayApplied,
        displayedMoodPercent: clamp(hydratedState.comfort - poopPenalty.penaltyAmount, 30, 100),
        poopPresent: poopPenalty.unclearedCount > 0,
        unclearedPoopCount: poopPenalty.unclearedCount,
        oldestPoopTime: poopPenalty.oldestPoopTime,
        poopPenaltyApplied: poopPenalty.penaltyApplied,
        poopPenaltyAmount: poopPenalty.penaltyAmount,
      });
    });

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === `child-dashboard-state-${childId}` ||
        event.key === getDailyGoalsStorageKey()
      ) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    const refreshTimer = window.setInterval(syncFromStorage, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(refreshTimer);
    };
  }, [child, childId]);

  useEffect(() => {
    if (!child || searchParams.get('resetCare') !== '1') return;

    const resetTimer = window.setTimeout(() => {
      const resetCounts = getDefaultDailyActionCounts();
      const resetTimestamps = getDefaultLastActionTimestamps();
      const resetDate = getTodayKey();

      saveChildDashboardState(childId, child, {
        dailyActionCounts: resetCounts,
        lastActionTimestamps: resetTimestamps,
        poopEvents: [],
        careResetDate: resetDate,
        patHeartAwarded: false,
      });
      setDailyActionCounts(resetCounts);
      setLastActionTimestamps(resetTimestamps);
      setPoopEvents([]);
      setCareResetDate(resetDate);
      setPatHeartAwarded(false);
      setFeedbackMessage('Care actions reset for testing.');
      router.replace(`/child/${childId}`);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [child, childId, router, searchParams]);

  useEffect(() => {
    if (!dashboardLoaded || !child) return;

    saveChildDashboardState(childId, child, {
      hearts,
      screenEnergy,
      activePetId: activePetType,
      activePetType,
      activeEgg,
      eggMessage,
      dailyActionCounts,
      lastActionTimestamps,
      poopEvents,
      careResetDate,
      patHeartAwarded,
      ownedSkins,
      activeSkins,
    });
  }, [
    childId,
    child,
    dashboardLoaded,
    hearts,
    screenEnergy,
    activePetType,
    activeEgg,
    eggMessage,
    dailyActionCounts,
    lastActionTimestamps,
    poopEvents,
    careResetDate,
    patHeartAwarded,
    ownedSkins,
    activeSkins,
  ]);

  useEffect(() => {
    if (!dashboardLoaded) return;
    const careKey = JSON.stringify({ dailyActionCounts, lastActionTimestamps, poopEvents, patHeartAwarded });
    if (lastCareStateKeyRef.current === careKey) return;
    lastCareStateKeyRef.current = careKey;
    void upsertCareStateForChild(childId, {
      date: getTodayKey(),
      actionCounts: dailyActionCounts,
      lastTimestamps: lastActionTimestamps,
      poopEvents,
      patHeartAwarded,
    });
  }, [childId, dashboardLoaded, dailyActionCounts, lastActionTimestamps, poopEvents, patHeartAwarded]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hourTimer = window.setInterval(() => {
      setHourNow(new Date().getHours());
    }, 60 * 1000);

    return () => window.clearInterval(hourTimer);
  }, []);

  if (!child || !pet) {
    return <div>Child not found</div>;
  }

  const activePetName =
    PET_ROSTER.find((rosterPet) => rosterPet.id === activePetType)?.name ?? pet.name;
  const activePetDescription =
    PET_ROSTER.find((rosterPet) => rosterPet.id === activePetType)?.description ??
    'A gentle creature that loves soft play and cozy moments.';
  const poopPenalty = getPoopPenaltyInfo(poopEvents);
  const unclearedPoopEvents = getUnclearedPoopEvents(poopEvents);
  const hasPoop = unclearedPoopEvents.length > 0;
  const displayedComfort = clamp(comfort - poopPenalty.penaltyAmount, 30, 100);

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimerRef.current = null;
    }, 1800);
  };

  const dismissEggMessage = () => {
    if (!child) return;
    clearEggMessage(childId, child);
    setEggMessage(null);
  };

  const triggerCareReaction = (
    type: CareActionType,
    blocked: boolean,
    message: string,
    stat?: string
  ) => {
    reactionIdRef.current += 1;
    setCareReaction({ id: reactionIdRef.current, type, blocked, message, stat });
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
    }
    reactionTimerRef.current = setTimeout(() => {
      setCareReaction(null);
      reactionTimerRef.current = null;
    }, blocked ? 900 : 1200);
  };

  const performCareAction = async (type: CareActionType) => {
    if (!child || careWriteInFlightRef.current) return;

    const now = Date.now();
    const config = careActionConfig[type];
    const usedToday = dailyActionCounts[type] ?? 0;
    const storedLastUsedAt = lastActionTimestamps[type] ?? 0;
    const lastUsedAt = storedLastUsedAt > now ? 0 : storedLastUsedAt;

    if (usedToday >= config.dailyLimit) {
      const limitMsg = config.limitMessage.replace('{petName}', activePetName);
      showFeedback(limitMsg);
      triggerCareReaction(type, true, limitMsg);
      return;
    }

    if (now - lastUsedAt < config.cooldownMs) {
      const cooldownMessage = `Give ${activePetName} a little moment first!`;
      showFeedback(cooldownMessage);
      triggerCareReaction(type, true, cooldownMessage);
      return;
    }

    careWriteInFlightRef.current = true;
    setCareWriteInFlight(type);
    const moodUpdatedAtNow = new Date().toISOString();
    const nextMood = boostMoodPercent(displayedComfort, config.comfortBoost);
    const nextPoopEvents = type === 'clean' ? clearPoopEvents(poopEvents) : poopEvents;

    setDailyActionCounts((current) => ({
      ...current,
      [type]: (current[type] ?? 0) + 1,
    }));
    setLastActionTimestamps((current) => ({
      ...current,
      [type]: now,
    }));
    if (type === 'clean') {
      setPoopEvents(nextPoopEvents);
    }
    setComfort(nextMood);
    setMoodUpdatedAt(moodUpdatedAtNow);
    setComfortPulseKey((current) => current + 1);

    try {
      const syncedState = await syncChildMood(childId, child, nextMood, moodUpdatedAtNow);
      setComfort(syncedState.comfort);
      setMoodUpdatedAt(syncedState.moodUpdatedAt);
      const syncMeta = readChildSupabaseSyncMeta(childId);
      setSyncDebug((current) =>
        current
          ? {
              ...current,
              moodSource: syncMeta.lastMoodSource,
              moodPercent: syncMeta.lastMoodPercent,
              moodUpdatedAt: syncMeta.lastMoodUpdatedAt,
              moodDecayApplied: syncMeta.lastMoodDecayApplied,
              displayedMoodPercent: syncedState.comfort,
              poopPresent: getUnclearedPoopEvents(nextPoopEvents).length > 0,
              unclearedPoopCount: getUnclearedPoopEvents(nextPoopEvents).length,
              oldestPoopTime: getPoopPenaltyInfo(nextPoopEvents).oldestPoopTime,
              poopPenaltyApplied: getPoopPenaltyInfo(nextPoopEvents).penaltyApplied,
              poopPenaltyAmount: getPoopPenaltyInfo(nextPoopEvents).penaltyAmount,
            }
          : current
      );
    } finally {
      careWriteInFlightRef.current = false;
      setCareWriteInFlight(null);
    }

    showFeedback(config.successMessage.replace('{petName}', activePetName));
    triggerCareReaction(
      type,
      false,
      type === 'clean' && hasPoop ? 'All tidy again!' : reactionSpeech[type],
      `+${config.comfortBoost} Mood`
    );
  };

  const handleToggleSkin = (skinId: SkinId) => {
    if (!child) return;
    const skin = getSkinById(skinId);
    if (!ownedSkins.includes(skinId)) {
      showFeedback('Buy this look in the Reward Shop first.');
      return;
    }
    const isActive = activeSkins[activePetType as PetType] === skinId;
    const nextSkinId = isActive ? null : skinId;
    const nextState = setActiveSkin(childId, child, activePetType as PetType, nextSkinId);
    setActiveSkins(nextState.activeSkins);
    showFeedback(isActive ? `${skin?.name ?? 'Look'} removed.` : `${skin?.name ?? 'Look'} equipped!`);
  };

  const moodStatusMessage =
    displayedComfort >= 70
      ? `${activePetName} feels cozy and happy.`
      : displayedComfort >= 40
      ? `${activePetName} feels calm and content.`
      : `${activePetName} could use a little extra care.`;

  const petMoodLabel =
    displayedComfort >= 70 ? 'Happy' : displayedComfort >= 40 ? 'Okay' : 'Needs Care';

  const completedMissionCount = missionTemplates.filter(
    (mission) => completedMissions[mission.id],
  ).length;

  const careActionsToday = countCareActionsToday(dailyActionCounts);
  const debugCareActionsToday =
    debugMoodValues.feed + debugMoodValues.pat + debugMoodValues.clean;
  const moodInputs = useDebugMoodValues
    ? {
        comfort: debugMoodValues.comfort,
        completedMissionsToday: debugMoodValues.completedMissionsToday,
        careActionsToday: debugCareActionsToday,
        hourNow: debugMoodValues.hourNow,
      }
    : {
        comfort: displayedComfort,
        completedMissionsToday: completedMissionCount,
        careActionsToday,
        hourNow,
      };
  const displayMood = getDisplayMood({
    comfort: moodInputs.comfort,
    completedMissionsToday: moodInputs.completedMissionsToday,
    careActionsToday: moodInputs.careActionsToday,
    hourNow: moodInputs.hourNow,
  });
  const displayMoodImage = petMoodImages[activePetType][displayMood];

  const getRemainingCareUses = (type: CareActionType) =>
    Math.max(0, careActionConfig[type].dailyLimit - (dailyActionCounts[type] ?? 0));

  const updateDebugMoodValue = (
    key: keyof DebugMoodValues,
    value: number,
    min: number,
    max: number
  ) => {
    setDebugMoodValues((current) => ({
      ...current,
      [key]: clamp(Number.isNaN(value) ? min : value, min, max),
    }));
  };

  const petReactionAnimation =
    careReaction && !careReaction.blocked
      ? careReaction.type === 'pat'
        ? { y: [0, -8, 0], rotate: [0, -3, 3, 0], scale: [1, 1.03, 1] }
        : careReaction.type === 'clean'
          ? {
              y: [0, -6, 0],
              scale: [1, 1.04, 1],
              filter: [
                'drop-shadow(0 0 0 rgba(34,211,238,0))',
                'drop-shadow(0 0 18px rgba(34,211,238,0.5))',
                'drop-shadow(0 0 0 rgba(34,211,238,0))',
              ],
            }
          : { y: [0, -14, 0], scale: [1, 1.06, 1] }
      : careReaction?.blocked
        ? { x: [0, -4, 4, -2, 0] }
        : { y: 0, x: 0, rotate: 0, scale: 1 };

  const getCareButtonAnimation = (type: CareActionType) =>
    careReaction?.type === type && !careReaction.blocked
      ? {
          scale: [1, 0.97, 1.03, 1],
          boxShadow: [
            '0 1px 2px rgba(15,23,42,0.08)',
            '0 0 22px rgba(251,191,36,0.42)',
            '0 1px 2px rgba(15,23,42,0.08)',
          ],
        }
      : { scale: 1 };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const cardStyle =
    'rounded-[28px] border border-white/70 bg-white/90 shadow-lg';

  return (
    <ChildPageFrame childId={childId}>
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_30%),linear-gradient(180deg,#ffe8f4_0%,#f8efff_45%,#ecf5ff_100%)]">
        <div className="pointer-events-none absolute left-8 top-28 h-36 w-36 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-24 h-28 w-28 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="pointer-events-none absolute left-[50%] top-40 h-24 w-24 -translate-x-1/2 rounded-full bg-violet-200/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-64 h-28 w-28 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute left-16 top-80 h-10 w-10 rounded-full bg-white/30 blur-2xl" />
        <div className="pointer-events-none absolute left-[72%] top-16 h-2 w-2 rounded-full bg-white/80 shadow-[0_0_16px_rgba(255,255,255,0.65)]" />
        <motion.div
          className="mx-auto max-w-[1200px] space-y-4 px-3 py-5 sm:px-8 sm:py-10 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== HEADER ===== */}
        <motion.div
          variants={itemVariants}
          className="hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm md:block"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                >
                  ← Switch User
                </motion.button>
              </Link>
              <div className="rounded-3xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                Pocket Pets
              </div>
            </div>

            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Welcome, {child.name}! 👋
              </h1>
              <p className="mt-2 text-base leading-7 text-slate-600 sm:text-lg">
                Your cozy pet world is ready for soft adventures and caring moments.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
              <div className="rounded-3xl bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-900 shadow-sm">
                ⭐ {stars}
              </div>
              <div className="rounded-3xl bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-900 shadow-sm">
                💖 {hearts}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[320px_minmax(0,1fr)_380px] items-start">
          <motion.div variants={itemVariants} className={`order-1 ${cardStyle} p-4 md:p-6`}>
            <div className="grid gap-4 md:gap-5">
              <div>
                <div className="relative">
                  <motion.div
                    className="mx-auto max-w-[260px] md:max-w-none"
                    style={{ margin: '0 auto' }}
                    animate={petReactionAnimation}
                    transition={{ duration: careReaction?.blocked ? 0.35 : 0.65, ease: 'easeOut' }}
                  >
                    <PetAvatar
                      pet={activePetType}
                      childName={child.name}
                      petName={activePetName}
                      stars={stars}
                      mood={displayMood}
                      variant="image-only"
                      activeSkinId={activeSkins[activePetType as PetType]}
                    />
                    {hasPoop ? (
                      <div className="absolute bottom-4 right-4 z-20 rounded-full border border-amber-100 bg-amber-50/95 px-3 py-2 text-2xl shadow-lg md:bottom-5 md:right-5">
                        <span aria-label="Poop to clean" role="img">💩</span>
                      </div>
                    ) : null}
                  </motion.div>

                  <AnimatePresence>
                    {careReaction ? (
                      <motion.div
                        key={`speech-${careReaction.id}`}
                        className={`pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-3xl px-4 py-2 text-sm font-bold shadow-lg ${
                          careReaction.blocked
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-white text-slate-900'
                        }`}
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {careReaction.message}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {careReaction && !careReaction.blocked ? (
                      <motion.div
                        key={`float-${careReaction.id}`}
                        className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 text-center"
                        initial={{ opacity: 0, y: 18, scale: 0.9 }}
                        animate={{ opacity: 1, y: -18, scale: 1 }}
                        exit={{ opacity: 0, y: -46, scale: 0.95 }}
                        transition={{ duration: 0.85, ease: 'easeOut' }}
                      >
                        <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-extrabold text-amber-800 shadow-lg">
                          {floatingLabel[careReaction.type]}
                        </div>
                        {careReaction.stat ? (
                          <div className="mt-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow">
                            {careReaction.stat}
                          </div>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {careReaction && !careReaction.blocked ? (
                      <PetActionOverlay
                        key={`action-overlay-${careReaction.id}`}
                        reaction={careReaction}
                      />
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {careReaction && !careReaction.blocked ? (
                      <CareParticles key={`particles-${careReaction.id}`} type={careReaction.type} />
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <p className="hidden text-sm uppercase tracking-[0.22em] text-slate-500 md:block">Pet Nest</p>
                  <h2 className="mt-2 text-center text-3xl font-bold text-slate-900 md:mt-3 md:text-left">{activePetName}</h2>
                  <p className="hidden mt-2 text-sm leading-6 text-slate-600 md:block">
                    {activePetDescription}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 md:hidden">
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-center text-sm font-extrabold text-amber-800 shadow-sm">
                    <div>⭐</div>
                    <div>{stars}</div>
                  </div>
                  <div className="rounded-2xl bg-pink-50 px-3 py-2 text-center text-sm font-extrabold text-pink-800 shadow-sm">
                    <div>💖</div>
                    <div>{hearts}</div>
                  </div>
                  <div className="rounded-2xl bg-sky-50 px-3 py-2 text-center text-sm font-extrabold text-sky-800 shadow-sm">
                    <div>📱</div>
                    <div>{screenEnergy}</div>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-extrabold text-emerald-800 shadow-sm md:hidden">
                  {petMoodLabel} mood · {displayedComfort}%
                </div>
                <div className="hidden gap-3 grid-cols-3 md:grid">
                  <div className="rounded-[20px] bg-gradient-to-br from-violet-50 to-purple-50 p-3.5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-violet-500">Mood</p>
                    <p className="mt-1.5 text-lg font-extrabold text-slate-900 capitalize">{petMoodLabel}</p>
                  </div>
                  <div className="rounded-[20px] bg-gradient-to-br from-sky-50 to-blue-50 p-3.5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-500">Screen</p>
                    <p className="mt-1.5 text-lg font-extrabold text-slate-900">{screenEnergy}</p>
                    <p className="text-[10px] font-semibold text-sky-400">
                      {formatWeekendScreenTime(screenEnergy)}
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-gradient-to-br from-pink-50 to-rose-50 p-3.5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-pink-500">Look</p>
                    <p className="mt-1.5 text-sm font-extrabold leading-snug text-slate-900">
                      {activeSkins[activePetType as PetType]
                        ? getSkinById(activeSkins[activePetType as PetType]!)?.name ?? 'Skin'
                        : 'Default'}
                    </p>
                  </div>
                </div>
                {eggMessage ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm">
                    <div>{eggMessage}</div>
                    <button
                      type="button"
                      onClick={dismissEggMessage}
                      className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700"
                    >
                      Got it
                    </button>
                  </div>
                ) : activeEgg && !activeEgg.hatched ? (
                  <div className="rounded-[24px] border border-purple-200 bg-purple-50 p-4 text-sm font-bold text-purple-800 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span>Secret Egg</span>
                      <span>
                        {activeEgg.progress} / {activeEgg.requiredGoals}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                        style={{
                          width: `${(activeEgg.progress / activeEgg.requiredGoals) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-purple-700">
                      Parent-verified goals help it hatch.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>

          <div className="order-2 space-y-4 md:space-y-6 lg:order-2">
            <motion.div variants={itemVariants} className={`hidden md:block ${cardStyle} p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pet Status</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">{moodStatusMessage}</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  Mood {displayedComfort}%
                </span>
              </div>
              <div className="mt-5 space-y-4 rounded-[24px] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm text-slate-700">{petMoodLabel} mood is steady.</p>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <motion.div
                    key={comfortPulseKey}
                    className="h-full rounded-full bg-gradient-to-r from-orange-300 via-pink-300 to-purple-400"
                    initial={false}
                    animate={{
                      width: `${displayedComfort}%`,
                      boxShadow: [
                        '0 0 0 rgba(251,191,36,0)',
                        '0 0 18px rgba(251,191,36,0.65)',
                        '0 0 0 rgba(251,191,36,0)',
                      ],
                    }}
                    transition={{ width: { duration: 0.45, ease: 'easeOut' }, boxShadow: { duration: 0.65 } }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Cozy meter</span>
                  <span>Mood {displayedComfort}%</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className={`hidden md:block ${cardStyle} p-6`}>
              {(() => {
                const currentSkinId = activeSkins[activePetType as PetType];
                const activePetSkins = skinsByPet[activePetType as PetType] ?? [];
                const purchasedSkins = activePetSkins.filter((s) => ownedSkins.includes(s.id));
                return (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Current Look</p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                          {currentSkinId
                            ? getSkinById(currentSkinId)?.name ?? 'Skin Active'
                            : 'Default Style'}
                        </h3>
                      </div>
                      {currentSkinId && (
                        <button
                          type="button"
                          onClick={() => handleToggleSkin(currentSkinId)}
                          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {purchasedSkins.length > 0 ? (
                      <div className="mt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          ✨ My Wardrobe
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {purchasedSkins.map((skin) => {
                            const isWorn = currentSkinId === skin.id;
                            const skinLabel = skin.name.replace(` ${activePetName}`, '').trim();
                            return (
                              <button
                                key={skin.id}
                                type="button"
                                onClick={() => handleToggleSkin(skin.id)}
                                className={`flex flex-col items-center rounded-2xl border-2 p-2.5 transition active:scale-95 ${
                                  isWorn
                                    ? 'border-pink-300 bg-gradient-to-b from-pink-50 to-violet-50 shadow-md ring-2 ring-pink-200 ring-offset-1'
                                    : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50'
                                }`}
                              >
                                <div className="relative w-[68px] overflow-hidden rounded-xl" style={{ aspectRatio: '4/5' }}>
                                  <Image
                                    src={skin.imagePath}
                                    alt={skin.name}
                                    fill
                                    loading="eager"
                                    className="object-contain"
                                    sizes="68px"
                                  />
                                </div>
                                <p className="mt-1.5 w-full text-center text-[10px] font-bold leading-snug text-slate-700">
                                  {skinLabel}
                                </p>
                                {isWorn && (
                                  <span className="mt-1 rounded-full bg-pink-200 px-2 py-0.5 text-[9px] font-extrabold text-pink-800">
                                    ✨ Worn
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        {activePetName} is using default mood styles. Visit the Reward Shop to unlock looks.
                      </p>
                    )}
                  </>
                );
              })()}
            </motion.div>

            <motion.div variants={itemVariants} className={`hidden md:block ${cardStyle} p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Care Actions</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">Spend time with {activePetName}</h3>
                </div>
                <p className="text-sm text-slate-600">Interactive care feels playful and cozy.</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={getCareButtonAnimation('feed')}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  disabled={careWriteInFlight !== null}
                  onClick={() => void performCareAction('feed')}
                  className="group rounded-[28px] border border-amber-100 bg-gradient-to-br from-yellow-50 to-amber-50 p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-100 text-3xl shadow-sm">🍖</div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Feed</p>
                      <p className="mt-1 text-sm text-slate-600">Yummy treat!</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {getRemainingCareUses('feed')}/{careActionConfig.feed.dailyLimit} left
                      </p>
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={getCareButtonAnimation('pat')}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  disabled={careWriteInFlight !== null}
                  onClick={() => void performCareAction('pat')}
                  className="group rounded-[28px] border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-50 to-rose-100 text-3xl shadow-sm">👐</div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Pat</p>
                      <p className="mt-1 text-sm text-slate-600">Give love!</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {getRemainingCareUses('pat')}/{careActionConfig.pat.dailyLimit} left
                      </p>
                    </div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={getCareButtonAnimation('clean')}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  disabled={careWriteInFlight !== null}
                  onClick={() => void performCareAction('clean')}
                  className="group rounded-[28px] border border-cyan-100 bg-gradient-to-br from-cyan-50 to-sky-50 p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-50 to-sky-100 text-3xl shadow-sm">🧼</div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Clean</p>
                      <p className="mt-1 text-sm text-slate-600">Keep it cozy!</p>
                      {hasPoop ? (
                        <p className="mt-1 text-xs font-extrabold text-amber-700">Poop to clean!</p>
                      ) : null}
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {getRemainingCareUses('clean')}/{careActionConfig.clean.dailyLimit} left
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
              {feedbackMessage ? (
                <div className="mt-4 rounded-[24px] bg-slate-100 px-4 py-3 text-sm text-slate-700 shadow-sm">
                  {feedbackMessage}
                </div>
              ) : null}
            </motion.div>
            <motion.div variants={itemVariants} className={`${cardStyle} p-4 md:hidden`}>
              <details {...(hasPoop ? { open: true } : {})}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[24px] bg-white px-4 py-3 text-left">
                  <div>
                    <p className="text-sm font-extrabold text-slate-500">Care for pet</p>
                    <h3 className="text-xl font-black text-slate-900">Spend time with {activePetName}</h3>
                  </div>
                  <span className="rounded-full bg-pink-50 px-3 py-1 text-sm font-black text-pink-600">Open</span>
                </summary>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    disabled={careWriteInFlight !== null}
                    onClick={() => void performCareAction('feed')}
                    className="flex items-center gap-4 rounded-[24px] border border-amber-100 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 text-left shadow-sm active:scale-[0.99]"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">🍖</span>
                    <span>
                      <span className="block text-xl font-black text-slate-900">Feed</span>
                      <span className="block text-sm font-bold text-slate-500">
                        {getRemainingCareUses('feed')}/{careActionConfig.feed.dailyLimit} left
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={careWriteInFlight !== null}
                    onClick={() => void performCareAction('pat')}
                    className="flex items-center gap-4 rounded-[24px] border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-4 text-left shadow-sm active:scale-[0.99]"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">👏</span>
                    <span>
                      <span className="block text-xl font-black text-slate-900">Pat</span>
                      <span className="block text-sm font-bold text-slate-500">
                        {getRemainingCareUses('pat')}/{careActionConfig.pat.dailyLimit} left
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={careWriteInFlight !== null}
                    onClick={() => void performCareAction('clean')}
                    className={`flex items-center gap-4 rounded-[24px] border p-4 text-left shadow-sm active:scale-[0.99] ${
                      hasPoop
                        ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-sky-50 ring-2 ring-amber-100'
                        : 'border-cyan-100 bg-gradient-to-br from-cyan-50 to-sky-50'
                    }`}
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">🧼</span>
                    <span>
                      <span className="block text-xl font-black text-slate-900">Clean</span>
                      {hasPoop ? (
                        <span className="block text-sm font-extrabold text-amber-700">Poop to clean!</span>
                      ) : null}
                      <span className="block text-sm font-bold text-slate-500">
                        {getRemainingCareUses('clean')}/{careActionConfig.clean.dailyLimit} left
                      </span>
                    </span>
                  </button>
                </div>
                {feedbackMessage ? (
                  <div className="mt-4 rounded-[20px] bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                    {feedbackMessage}
                  </div>
                ) : null}
              </details>
            </motion.div>
          </div>

          <div className="order-3 space-y-4 md:space-y-6 lg:order-3">
            <motion.div variants={itemVariants} className={`${cardStyle} p-4 md:p-6`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="hidden text-sm font-medium text-slate-500 md:block">Today&apos;s Adventure</p>
                  <h3 className="text-2xl font-black text-slate-900 md:mt-2 md:font-bold">Today&apos;s goals</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-extrabold text-emerald-800 md:font-semibold">
                  {completedMissionCount} / {missionTemplates.length} Completed
                </span>
              </div>
              <div className="mt-4 space-y-3 md:mt-5">
                {missionTemplates.map((mission) => {
                  const completed = completedMissions[mission.id] ?? false;
                  return (
                    <div
                      key={mission.id}
                      className={`w-full rounded-[24px] border p-4 text-left shadow-sm md:rounded-[28px] ${
                        completed ? 'border-emerald-200 bg-emerald-50 text-slate-600' : 'border-white/80 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm md:h-10 md:w-10 ${
                            completed ? 'text-emerald-600' : ''
                          }`}>
                            {completed ? (
                              <span aria-hidden="true">&#10003;</span>
                            ) : (
                              <span
                                aria-hidden="true"
                                className="h-3 w-3 rounded-full border-2 border-slate-300"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-black leading-tight text-slate-900 md:text-base md:font-semibold">{mission.title}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500 md:text-xs md:font-normal">{mission.description}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-700 md:font-semibold">
                          +{mission.starReward ?? mission.reward} ⭐
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 rounded-[20px] bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 md:font-medium">
                Ask a parent to check this when you are done.
              </p>
            </motion.div>
            <div className="grid gap-3 md:gap-6">
              {hearts >= 2 ? (
                <Link href={`/child/${childId}/pet-catch`} className="group">
                  <div className="rounded-[28px] bg-white p-4 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md md:rounded-[32px] md:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-pink-100 text-3xl">🎮</div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 md:text-lg md:font-bold">Play Pet Catch</h3>
                        <p className="mt-1 text-base font-semibold text-slate-600 md:text-sm md:font-normal">Spend 2 hearts for a cozy 60-second game.</p>
                      </div>
                    </div>
                    <div className="mt-5 hidden rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-800 md:inline-flex">
                      Play for 2 💖
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => showFeedback('You need 2 hearts to play Pet Catch. Ask a parent or earn more hearts first.')}
                  className="rounded-[28px] bg-white p-4 text-left opacity-80 shadow-sm transition active:scale-[0.99] md:rounded-[32px] md:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-3xl grayscale">🎮</div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 md:text-lg md:font-bold">Play Pet Catch</h3>
                      <p className="mt-1 text-base font-semibold text-slate-600 md:text-sm md:font-normal">You need 2 hearts to start a round.</p>
                    </div>
                  </div>
                  <div className="mt-5 hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 md:inline-flex">
                    Need 2 💖
                  </div>
                </button>
              )}
              <Link href={`/child/${childId}/shop`} className="group">
                <div className="rounded-[28px] bg-white p-4 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md md:rounded-[32px] md:p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-100 text-3xl">🏪</div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 md:text-lg md:font-bold">Visit Shop</h3>
                      <p className="mt-1 text-base font-semibold text-slate-600 md:text-sm md:font-normal">Spend stars on cute items.</p>
                    </div>
                  </div>
                  <div className="mt-5 hidden rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 md:inline-flex">
                    Visit Shop
                  </div>
                </div>
              </Link>
              <Link href={`/child/${childId}/family`} className="group">
                <div className="rounded-[28px] bg-white p-4 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md md:rounded-[32px] md:p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-100 text-3xl">👾</div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 md:text-lg md:font-bold">Family Boss</h3>
                      <p className="mt-1 text-base font-semibold text-slate-600 md:text-sm md:font-normal">Team up and grow stronger.</p>
                    </div>
                  </div>
                  <div className="mt-5 hidden rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 md:inline-flex">
                    Go to Family Boss
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom stat strip — fills lower page with lightweight data */}
        <motion.div variants={itemVariants} className="hidden md:block">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">✅ Goals</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{completedMissionCount}/{missionTemplates.length}</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-500">completed today</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 px-5 py-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">⭐ Stars</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{stars}</p>
              <p className="mt-0.5 text-xs font-semibold text-amber-500">to spend in shop</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 px-5 py-5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600">📱 Screen Time</p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{screenEnergy}</p>
              <p className="mt-0.5 text-xs font-semibold text-sky-400">{formatWeekendScreenTime(screenEnergy)}</p>
            </div>
            {activeEgg && !activeEgg.hatched ? (
              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 px-5 py-5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-purple-600">🥚 Secret Egg</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{activeEgg.progress}<span className="text-lg text-purple-300">/{activeEgg.requiredGoals}</span></p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-purple-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400" style={{ width: `${(activeEgg.progress / activeEgg.requiredGoals) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 px-5 py-5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-pink-600">❤️ Hearts</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{hearts}</p>
                <p className="mt-0.5 text-xs font-semibold text-pink-400">pet bond</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`mx-auto w-full max-w-3xl ${showMoodDebug ? 'block' : 'hidden md:block'}`}>
          <button
            type="button"
            onClick={() => setShowMoodDebug((current) => !current)}
            className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-400 shadow-sm transition hover:bg-slate-300/70"
          >
            ⚙ debug
          </button>

          {showMoodDebug ? (
            <div className="mt-3 rounded-[24px] border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">

              {/* ── Sync status ── */}
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5">
                <p className="mb-1 font-extrabold text-blue-800">Supabase Sync Status</p>
                {syncDebug ? (
                  <div className="grid gap-0.5 text-blue-700">
                    <p>child_id: <span className="font-mono font-bold">{syncDebug.childId}</span></p>
                    <p>supabase env: <span className="font-bold">{syncDebug.supabaseEnv ? '✅ present' : '❌ MISSING — localStorage only'}</span></p>
                    <p>sync source: <span className="font-bold">{syncDebug.syncSource}</span></p>
                    {syncDebug.syncError && <p className="text-red-600">error: {syncDebug.syncError}</p>}
                    <p>hydrated stars: <span className="font-bold">{syncDebug.hydratedStars}</span></p>
                    <p>date key: <span className="font-mono">{syncDebug.dateKey}</span></p>
                    <p>goals date: <span className="font-mono">{syncDebug.goalsDate ?? 'none in Supabase'}</span></p>
                    <p>supabase row id: <span className="font-mono">{syncDebug.supabaseGoalRowId ?? 'none'}</span></p>
                    <p>supabase row date: <span className="font-mono">{syncDebug.supabaseGoalRowDate ?? 'none'}</span></p>
                    <p>goals ids: <span className="font-mono">{syncDebug.goalsIds}</span></p>
                    <p>goals source: <span className="font-bold">{syncDebug.goalsSource}</span></p>
                    <p>goals titles: <span className="font-mono">{syncDebug.goalsTitles}</span></p>
                    <p>completed states: <span className="font-mono">{syncDebug.completedStates}</span></p>
                    <p>generation happened: <span className="font-bold">{syncDebug.generationHappened ? 'yes' : 'no'}</span></p>
                    <p>randomise happened: <span className="font-bold">{syncDebug.randomiseHappened ? 'yes' : 'no'}</span></p>
                    <p>localStorage fallback used: <span className="font-bold">{syncDebug.localStorageFallbackUsed ? 'yes' : 'no'}</span></p>
                    <p>completed ids: <span className="font-mono">{syncDebug.completedGoalIds}</span></p>
                    <p>mood source: <span className="font-bold">{syncDebug.moodSource}</span></p>
                    <p>mood_percent: <span className="font-bold">{syncDebug.moodPercent}</span></p>
                    <p>mood_updated_at: <span className="font-mono">{syncDebug.moodUpdatedAt ?? 'none'}</span></p>
                    <p>decay applied: <span className="font-bold">{syncDebug.moodDecayApplied ? 'yes' : 'no'}</span></p>
                    <p>final displayed mood: <span className="font-bold">{syncDebug.displayedMoodPercent}</span></p>
                    <p>poop present: <span className="font-bold">{syncDebug.poopPresent ? 'yes' : 'no'}</span></p>
                    <p>uncleared poop count: <span className="font-bold">{syncDebug.unclearedPoopCount}</span></p>
                    <p>oldest poop time: <span className="font-mono">{syncDebug.oldestPoopTime ?? 'none'}</span></p>
                    <p>poop penalty applied: <span className="font-bold">{syncDebug.poopPenaltyApplied ? 'yes' : 'no'}</span></p>
                    <p>poop penalty amount: <span className="font-bold">{syncDebug.poopPenaltyAmount}</span></p>
                  </div>
                ) : (
                  <p className="text-blue-500 italic">Hydrating from Supabase…</p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={useDebugMoodValues}
                    onChange={(event) => setUseDebugMoodValues(event.target.checked)}
                    className="h-4 w-4 accent-slate-900"
                  />
                  Use debug mood values
                </label>
                <div className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
                  Current display mood: {displayMood}
                </div>
              </div>

              <div className="mt-3 text-xs font-medium text-slate-500">
                Image path: {displayMoodImage}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1">
                  <span className="font-semibold">Comfort</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={debugMoodValues.comfort}
                    onChange={(event) =>
                      updateDebugMoodValue('comfort', Number(event.target.value), 0, 100)
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={debugMoodValues.comfort}
                    onChange={(event) =>
                      updateDebugMoodValue('comfort', Number(event.target.value), 0, 100)
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>

                {[
                  ['completedMissionsToday', 'Completed Missions', 0, 3],
                  ['hourNow', 'Fake Hour', 0, 23],
                  ['feed', 'Feed Count', 0, 4],
                  ['pat', 'Pat Count', 0, 5],
                  ['clean', 'Clean Count', 0, 3],
                ].map(([key, label, min, max]) => (
                  <label key={key} className="grid gap-1">
                    <span className="font-semibold">{label}</span>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={debugMoodValues[key as keyof DebugMoodValues]}
                      onChange={(event) =>
                        updateDebugMoodValue(
                          key as keyof DebugMoodValues,
                          Number(event.target.value),
                          Number(min),
                          Number(max)
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                ))}

                <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  Debug mode only affects the displayed pet mood image. Care actions,
                  missions, stars, and localStorage stay on the normal app flow.
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-[28px] border border-white/70 bg-white/70 px-6 py-5 text-center shadow-sm">
          <p className="text-lg font-extrabold text-slate-800">💖 You&apos;re doing amazing, {child.name}! ✨</p>
          <p className="mt-1 text-sm text-slate-500">Keep caring for your pet and completing goals every day.</p>
        </motion.div>
        </motion.div>
      </div>
    </ChildPageFrame>
  );
}
