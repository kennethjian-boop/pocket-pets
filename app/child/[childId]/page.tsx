'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PET_ROSTER } from '@/lib/mock-data';
import {
  careActionConfig,
  clearEggMessage,
  getDefaultDailyActionCounts,
  getDefaultLastActionTimestamps,
  getPoopPenaltyInfo,
  getTodayKey,
  getUnclearedPoopEvents,
  readChildSupabaseSyncMeta,
  reconcilePoopEvents,
  resolveAuthoritativeDailyGoalsForChild,
  type CareActionType,
  type DailyActionCounts,
  type DailyMission,
  type LastActionTimestamps,
  type PoopEvent,
} from '@/lib/mission-state';
import { markPoopCleanedBy } from '@/lib/poop-rules';
import { fetchCareStateForChild } from '@/lib/supabase-care-state';
import { performCareActionAuthoritatively } from '@/lib/supabase-care-actions';
import { countCareActionsToday, getDisplayMood } from '@/lib/pet-mood';
import type { PetType } from '@/lib/pet-skins';
import type { BossBattleState } from '@/lib/boss-battle';
import { loadBossState } from '@/lib/boss-sync';
import type { PetReaction } from '@/components/pets/PetActionOverlay';
import { useDayPhase, getDayPhase } from '@/components/child/Scenery';
import { useChildState } from '@/app/child/_components/ChildStateProvider';
import { Habitat } from '@/app/child/_components/home/Habitat';
import { CareDock, type CareButtonState } from '@/app/child/_components/home/CareDock';
import { AdventureCards, EggCard, HatchedCard, QuestBoard } from '@/app/child/_components/home/Quests';

type CareSnapshot = {
  counts: DailyActionCounts;
  timestamps: LastActionTimestamps;
  poopEvents: PoopEvent[];
};

const REACTION_SPEECH: Record<CareActionType, string> = {
  feed: 'Yum yum! Thank you!',
  pat: 'Hehe, I love that!',
  clean: 'So fresh and sparkly!',
};

const GOAL_POLL_MS = 30_000;
const HATCH_SEEN_KEY = (childId: string) => `pocket-pets-hatch-seen-${childId}`;

function friendlyCareError(message: string, petName: string) {
  if (/limit/i.test(message)) return `${petName} has had enough of that for today!`;
  if (/cooldown/i.test(message)) return `Give ${petName} a little moment first!`;
  if (/supabase|fetch|network|failed/i.test(message)) return "Couldn't reach Pocket Pets. Try again!";
  return `${petName} needs a little rest. Try again soon!`;
}

export default function ChildHome() {
  const { child, state, ready, hasSnapshot, applyState, notify, refresh } = useChildState();
  const searchParams = useSearchParams();
  const debug = searchParams.get('debug') === '1';
  const phaseNow = useDayPhase();

  const pet = state.activePetId as PetType;
  const petName = PET_ROSTER.find((p) => p.id === pet)?.name ?? 'Your pet';
  const skinId = state.activeSkins[pet] ?? null;

  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [justVerified, setJustVerified] = useState<string | null>(null);
  const completedRef = useRef<Record<string, boolean> | null>(null);

  const [care, setCare] = useState<CareSnapshot | null>(null);
  const [boss, setBoss] = useState<BossBattleState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [busy, setBusy] = useState<CareActionType | null>(null);
  const busyRef = useRef(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionId = useRef(0);
  const [hatchSeen, setHatchSeen] = useState<string | null>(null);
  const [debugHour, setDebugHour] = useState<number | null>(null);
  const [debugComfort, setDebugComfort] = useState<number | null>(null);

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadGoals = useCallback(async () => {
    const resolved = await resolveAuthoritativeDailyGoalsForChild(child.id);
    const nextCompleted = resolved.record.completed ?? {};
    const previous = completedRef.current;
    if (previous) {
      const newlyChecked = resolved.goals.find((g) => nextCompleted[g.id] && !previous[g.id]);
      if (newlyChecked) {
        setJustVerified(newlyChecked.id);
        notify(
          `A grown-up checked “${newlyChecked.title}”! +${newlyChecked.starReward ?? newlyChecked.reward} stars`,
          'celebrate'
        );
        void refresh();
      }
    }
    completedRef.current = nextCompleted;
    setMissions(resolved.goals);
    setCompleted(nextCompleted);
    setGoalsLoaded(true);
  }, [child.id, notify, refresh]);

  const loadCare = useCallback(async () => {
    const careState = await fetchCareStateForChild(child.id);
    if (!careState) return;
    const isToday = careState.date === getTodayKey();
    setCare({
      counts: isToday ? careState.actionCounts : getDefaultDailyActionCounts(),
      timestamps: isToday ? careState.lastTimestamps : getDefaultLastActionTimestamps(),
      poopEvents: careState.poopEvents,
    });
  }, [child.id]);

  const loadBoss = useCallback(async () => {
    setBoss(await loadBossState());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        setHatchSeen(window.localStorage.getItem(HATCH_SEEN_KEY(child.id)));
      } catch {
        /* storage unavailable */
      }
      await Promise.all([loadGoals(), loadCare(), loadBoss()]);
    })();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadGoals();
      void loadBoss();
    }, GOAL_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [child.id, loadGoals, loadCare, loadBoss]);

  useEffect(() => {
    if (!state.eggMessage) return;
    const t = window.setTimeout(() => {
      notify(state.eggMessage ?? '', 'celebrate');
      clearEggMessage(child.id, child);
    }, 0);
    return () => window.clearTimeout(t);
  }, [child, notify, state.eggMessage]);

  useEffect(
    () => () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    },
    []
  );

  // ── Derived care + mood ────────────────────────────────────────────────────

  const counts = care?.counts ?? state.dailyActionCounts;
  const timestamps = care?.timestamps ?? state.lastActionTimestamps;
  const poopEvents = useMemo(
    () => markPoopCleanedBy(reconcilePoopEvents(care?.poopEvents ?? state.poopEvents, new Date(now)), timestamps.clean),
    [care?.poopEvents, state.poopEvents, now, timestamps.clean]
  );
  const hasPoop = getUnclearedPoopEvents(poopEvents).length > 0;
  const penalty = getPoopPenaltyInfo(poopEvents, new Date(now)).penaltyAmount;
  const comfort = debugComfort ?? Math.min(100, Math.max(30, state.comfort - penalty));
  const hour = debugHour ?? new Date(now).getHours();
  const phase = debugHour !== null ? getDayPhase(debugHour) : phaseNow;
  const completedCount = missions.filter((m) => completed[m.id]).length;
  const mood = getDisplayMood({
    comfort,
    completedMissionsToday: completedCount,
    careActionsToday: countCareActionsToday(counts),
    hourNow: hour,
  });

  const cooldownActive = (Object.keys(careActionConfig) as CareActionType[]).some(
    (type) => now - (timestamps[type] ?? 0) < careActionConfig[type].cooldownMs
  );
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), cooldownActive ? 1000 : 30_000);
    return () => window.clearInterval(timer);
  }, [cooldownActive]);

  const careButtons: CareButtonState[] = (['feed', 'pat', 'clean'] as CareActionType[]).map((type) => {
    const config = careActionConfig[type];
    const last = (timestamps[type] ?? 0) > now ? 0 : timestamps[type] ?? 0;
    const left = Math.max(0, config.cooldownMs - (now - last));
    return {
      type,
      limit: config.dailyLimit,
      remaining: Math.max(0, config.dailyLimit - (counts[type] ?? 0)),
      cooldownLeft: left / config.cooldownMs,
      cooldownSeconds: config.cooldownMs / 1000,
      highlight: type === 'clean' && hasPoop,
    };
  });

  const statusLine =
    mood === 'sleep'
      ? `${petName} is fast asleep. Shhh…`
      : hasPoop
        ? `Oops! ${petName} needs a clean-up.`
        : comfort >= 70
          ? `${petName} feels cozy and happy!`
          : comfort >= 40
            ? `${petName} would love some attention.`
            : `${petName} misses you. Give some love!`;

  // ── Care actions (authoritative RPC; animations never trigger writes) ──────

  const showReaction = (type: CareActionType, blocked: boolean, message: string) => {
    reactionId.current += 1;
    setReaction({ id: reactionId.current, type, blocked, message });
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => setReaction(null), blocked ? 1600 : 1900);
  };

  const performCare = async (type: CareActionType) => {
    if (busyRef.current) return;
    const config = careActionConfig[type];
    const nowMs = Date.now();
    const used = counts[type] ?? 0;
    const lastUsed = (timestamps[type] ?? 0) > nowMs ? 0 : timestamps[type] ?? 0;

    if (used >= config.dailyLimit) {
      showReaction(type, true, config.limitMessage.replace('{petName}', petName));
      return;
    }
    if (nowMs - lastUsed < config.cooldownMs) {
      showReaction(type, true, `Give ${petName} a little moment first!`);
      return;
    }

    busyRef.current = true;
    setBusy(type);
    let starReward = 0;
    try {
      const result = await performCareActionAuthoritatively(child, type);
      starReward = result.starReward;
      applyState(result.childState);
      setCare({
        counts: result.careState.actionCounts,
        timestamps: result.careState.lastTimestamps,
        poopEvents: result.careState.poopEvents,
      });
      setNow(Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      showReaction(type, true, friendlyCareError(message, petName));
      void loadCare();
      return;
    } finally {
      busyRef.current = false;
      setBusy(null);
    }

    showReaction(type, false, type === 'clean' && hasPoop ? 'All tidy again!' : REACTION_SPEECH[type]);
    if (starReward > 0) {
      notify(`${petName} is so happy! +${starReward} star${starReward === 1 ? '' : 's'}`, 'celebrate');
    }
  };

  const reactionAnimation =
    reaction && !reaction.blocked
      ? reaction.type === 'pat'
        ? { y: [0, -10, 0], rotate: [0, -4, 4, 0], scale: [1, 1.05, 1] }
        : reaction.type === 'clean'
          ? { y: [0, -6, 0], scale: [1, 1.05, 1] }
          : { y: [0, -18, 0], scale: [1, 1.08, 1] }
      : reaction?.blocked
        ? { x: [0, -6, 6, -3, 0] }
        : { y: 0, x: 0, rotate: 0, scale: 1 };

  const egg = state.activeEgg;
  const showHatched = Boolean(egg?.hatched && egg.unlockedPetId && hatchSeen !== egg.id);

  const dismissHatch = () => {
    if (!egg) return;
    setHatchSeen(egg.id);
    try {
      window.localStorage.setItem(HATCH_SEEN_KEY(child.id), egg.id);
    } catch {
      /* storage unavailable */
    }
  };

  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-6 pt-3 sm:px-6 sm:pt-5 short:pt-2 lg:px-8 lg:py-8">
      <div className="grid gap-4 short:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:items-start lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] lg:items-start lg:gap-7">
        <div className="min-w-0">
          <Habitat
            phase={phase}
            pet={pet}
            petName={petName}
            skinId={skinId}
            mood={mood}
            moodPercent={comfort}
            statusLine={ready ? statusLine : `Waking up ${petName}…`}
            reaction={reaction}
            reactionAnimation={reactionAnimation}
            hasPoop={hasPoop}
            onPoopTap={() => void performCare('clean')}
            petVisible={hasSnapshot}
          />
          <CareDock buttons={careButtons} busy={busy} onCare={(type) => void performCare(type)} petName={petName} />
        </div>

        <div className="grid min-w-0 gap-4">
          <p className="hidden font-display text-2xl font-semibold text-ink lg:block">
            {greeting}, {child.name}!
          </p>
          {showHatched && egg?.unlockedPetId ? (
            <HatchedCard petId={egg.unlockedPetId} childId={child.id} onDismiss={dismissHatch} />
          ) : null}
          <QuestBoard missions={missions} completed={completed} loaded={goalsLoaded} justVerified={justVerified} />
          {egg && !egg.hatched ? <EggCard egg={egg} /> : null}
          <AdventureCards childId={child.id} boss={boss} hearts={state.hearts} />
        </div>
      </div>

      {debug ? (
        <section className="surface mt-6 grid gap-3 p-4 text-xs font-bold text-ink-soft">
          <p className="font-display text-base text-ink">Debug (only with ?debug=1)</p>
          <p>
            Sync: {readChildSupabaseSyncMeta(child.id).lastSyncSource} · mood {state.comfort}% − poop {penalty} ·
            displayed {comfort}% · mood image {mood} · care {JSON.stringify(counts)}
          </p>
          <label className="flex items-center gap-2">
            Fake hour
            <input type="number" min={0} max={23} value={debugHour ?? ''} onChange={(e) => setDebugHour(e.target.value === '' ? null : Number(e.target.value))} className="w-20 rounded-lg border px-2 py-1" />
          </label>
          <label className="flex items-center gap-2">
            Fake mood %
            <input type="number" min={30} max={100} value={debugComfort ?? ''} onChange={(e) => setDebugComfort(e.target.value === '' ? null : Number(e.target.value))} className="w-20 rounded-lg border px-2 py-1" />
          </label>
          <p>Display-only overrides — nothing is saved.</p>
        </section>
      ) : null}
    </div>
  );
}
