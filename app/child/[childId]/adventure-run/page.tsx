'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PetSprite } from '@/components/child/PetSprite';
import { Celebration } from '@/components/child/Celebration';
import { GemArt, ObstacleArt, ParallaxLayer } from '@/components/child/RunArt';
import { Sky } from '@/components/child/Scenery';
import { useChildState } from '@/app/child/_components/ChildStateProvider';
import { PET_ROSTER } from '@/lib/mock-data';
import type { PetType } from '@/lib/pet-skins';
import { resolvePetAvatarImage } from '@/lib/pet-avatar-image';
import { spendHearts } from '@/lib/child-economy';
import { isDemoMode } from '@/lib/supabase-browser';
import {
  GROUND_Y,
  MODES,
  PET_H,
  PET_W,
  PET_X,
  RUN_DURATION_SECONDS,
  RUN_HEART_COST,
  bestScoreKey,
  createRun,
  currentSpeed,
  stepRun,
  type RunMode,
  type RunState,
} from '@/lib/adventure-run-rules';

type Phase = 'select' | 'paying' | 'countdown' | 'playing' | 'paused' | 'finished';
type Pop = { id: number; x: number; y: number; text: string; tone: 'good' | 'bad' | 'nice' };
type Frame = Pick<RunState, 'petY' | 'petVy' | 'grounded' | 'score' | 'elapsed' | 'distance' | 'slowLeft' | 'invulnerableLeft' | 'obstacles' | 'gemsOnField' | 'duration'> & { speed: number };

/** Widest visible world (units); beyond this the scene zooms in instead. */
const MAX_WORLD_WIDTH = 210;
const PET_ART_SCALE = 1.3;

const MODE_INFO: Record<RunMode, { title: string; blurb: string; tone: string }> = {
  easy: { title: 'Easy', blurb: 'A gentle stroll. Floaty jumps.', tone: 'from-mint-100 to-sky-50 ring-mint-300' },
  challenge: { title: 'Challenge', blurb: 'Speedy forest. Big leaps!', tone: 'from-berry-100 to-honey-50 ring-berry-300' },
};

/** QA-only knobs (seed, shorter rounds) — never honoured in a production non-demo build. */
function readQaParams() {
  if (process.env.NODE_ENV === 'production' && !isDemoMode()) return { seed: undefined, seconds: undefined };
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('qaSeed');
  const seconds = params.get('qaSeconds');
  return {
    seed: seed ? Number(seed) : undefined,
    seconds: seconds ? Math.max(5, Math.min(RUN_DURATION_SECONDS, Number(seconds))) : undefined,
  };
}

function snapshot(s: RunState): Frame {
  return {
    petY: s.petY,
    petVy: s.petVy,
    grounded: s.grounded,
    score: s.score,
    elapsed: s.elapsed,
    distance: s.distance,
    slowLeft: s.slowLeft,
    invulnerableLeft: s.invulnerableLeft,
    obstacles: s.obstacles.map((o) => ({ ...o })),
    gemsOnField: s.gemsOnField.map((g) => ({ ...g })),
    duration: s.duration,
    speed: currentSpeed(s),
  };
}

function readBest(childId: string, mode: RunMode) {
  try {
    return Number(window.localStorage.getItem(bestScoreKey(childId, mode)) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export default function AdventureRunPage() {
  const { child, state, hasSnapshot, applyState, notify } = useChildState();
  const pet = state.activePetId as PetType;
  const petName = PET_ROSTER.find((p) => p.id === pet)?.name ?? 'Your pet';
  const skinId = state.activeSkins[pet] ?? null;
  const avatar = resolvePetAvatarImage({ pet, mood: 'happy', petName, activeSkinId: skinId });

  const [phase, setPhase] = useState<Phase>('select');
  const [mode, setMode] = useState<RunMode>('easy');
  const [countdown, setCountdown] = useState(3);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [bests, setBests] = useState<Record<RunMode, number>>({ easy: 0, challenge: 0 });
  const [result, setResult] = useState<{ score: number; best: number; newBest: boolean; gems: number; cleared: number; hits: number } | null>(null);
  const [petReady, setPetReady] = useState(false);
  const [arena, setArena] = useState({ w: 0, h: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<RunState | null>(null);
  const jumpRef = useRef(false);
  const payingRef = useRef(false);
  const popId = useRef(1);
  const shake = useAnimationControls();
  const canPlay = state.hearts >= RUN_HEART_COST;

  // Personal bests are per child and per mode, on this device only.
  useEffect(() => {
    const t = window.setTimeout(() => setBests({ easy: readBest(child.id, 'easy'), challenge: readBest(child.id, 'challenge') }), 0);
    return () => window.clearTimeout(t);
  }, [child.id]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    const t = window.setTimeout(update, 0);
    mq.addEventListener('change', update);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener('change', update);
    };
  }, []);

  // The game is "ready" only once the pet artwork has decoded and the field has a size.
  useEffect(() => {
    if (!hasSnapshot) return;
    let cancelled = false;
    const img = new window.Image();
    img.src = avatar.src;
    img
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setPetReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [avatar.src, hasSnapshot]);

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setArena({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const addPop = useCallback((pop: Omit<Pop, 'id'>) => {
    const id = popId.current++;
    setPops((p) => [...p.slice(-5), { ...pop, id }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 750);
  }, []);

  const finish = useCallback(
    (run: RunState) => {
      const previous = readBest(child.id, run.mode);
      const newBest = run.score > previous && run.score > 0;
      if (newBest) {
        try {
          window.localStorage.setItem(bestScoreKey(child.id, run.mode), String(run.score));
        } catch {
          /* storage unavailable */
        }
      }
      const best = Math.max(previous, run.score);
      setBests((b) => ({ ...b, [run.mode]: best }));
      setResult({ score: run.score, best, newBest, gems: run.gems, cleared: run.cleared, hits: run.hits });
      setPhase('finished');
    },
    [child.id]
  );

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const run = runRef.current;
      if (!run) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const events = stepRun(run, dt, jumpRef.current);
      jumpRef.current = false;
      for (const e of events) {
        if (e.type === 'gem') addPop({ x: e.x, y: e.y, text: `+${e.points}`, tone: 'good' });
        if (e.type === 'cleared') addPop({ x: PET_X, y: GROUND_Y + PET_H + 6, text: 'Nice!', tone: 'nice' });
        if (e.type === 'hit') {
          addPop({ x: PET_X, y: GROUND_Y + PET_H + 8, text: e.penalty ? `Oops −${e.penalty}` : 'Oops!', tone: 'bad' });
          if (!reducedMotion) void shake.start({ x: [0, -8, 8, -4, 0], transition: { duration: 0.3 } });
          navigator.vibrate?.(40);
        }
      }
      setFrame(snapshot(run));
      if (run.finished) {
        finish(run);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, addPop, finish, reducedMotion, shake]);

  // Pause when the tab is hidden; resume with a fresh countdown (no extra charge).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setPhase((p) => (p === 'playing' || p === 'countdown' ? 'paused' : p));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      const t = window.setTimeout(() => setPhase('playing'), 350);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => window.clearTimeout(t);
  }, [phase, countdown]);

  const jump = useCallback(() => {
    if (phase === 'playing') jumpRef.current = true;
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        if (phase === 'playing') e.preventDefault();
        jump();
      }
      if (e.key === 'Escape' || e.key === 'p') setPhase((p) => (p === 'playing' ? 'paused' : p));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump, phase]);

  /** Charge exactly once per round, only when everything is ready, then start. */
  const startRound = async (chosen: RunMode) => {
    if (payingRef.current || phase === 'paying' || phase === 'countdown' || phase === 'playing') return;
    if (!petReady || arena.w === 0) {
      setMessage('Getting the forest ready…');
      return;
    }
    if (!canPlay) {
      setMessage(`You need ${RUN_HEART_COST} hearts to play. Hearts come from grown-up rewards and boss wins!`);
      return;
    }
    payingRef.current = true;
    setMessage(null);
    setPhase('paying');
    const charge = await spendHearts(child, RUN_HEART_COST);
    applyState(charge.state);
    payingRef.current = false;
    if (!charge.ok) {
      setPhase('select');
      setMessage(charge.code === 'insufficient' ? `You need ${RUN_HEART_COST} hearts to play.` : charge.message);
      return;
    }
    const qa = readQaParams();
    const unit = Math.max(arena.h / 100, arena.w / MAX_WORLD_WIDTH);
    const run = createRun(chosen, arena.w / unit / 100, qa.seed ?? Date.now(), qa.seconds ?? RUN_DURATION_SECONDS);
    runRef.current = run;
    setMode(chosen);
    setFrame(snapshot(run));
    setResult(null);
    setPops([]);
    jumpRef.current = false;
    setCountdown(3);
    setPhase('countdown');
  };

  const resume = () => {
    if (phase !== 'paused' || !runRef.current) return;
    setCountdown(3);
    setPhase('countdown');
  };

  const onArenaPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    jump();
  };

  // ── Render helpers (world units → px) ───────────────────────────────────────
  // One world unit in px. Very wide screens scale by width so sprites stay big.
  const u = Math.max(arena.h / 100, arena.w / MAX_WORLD_WIDTH);
  const f = frame;
  const pos = (x: number, y: number) => `translate3d(${x * u}px, ${-y * u}px, 0)`;
  const timeLeft = f ? Math.max(0, Math.ceil(f.duration - f.elapsed)) : RUN_DURATION_SECONDS;
  const timeFraction = f ? 1 - f.elapsed / f.duration : 1;
  const distancePx = (f?.distance ?? 0) * u;
  const airborne = f ? !f.grounded : false;
  const bob = !f || reducedMotion || airborne ? 0 : Math.abs(Math.sin(f.distance * 0.45)) * 1.2;
  const tilt = !f || reducedMotion ? 0 : airborne ? (f.petVy > 0 ? -8 : 6) : Math.sin(f.distance * 0.45) * 2;
  const recovering = Boolean(f && f.invulnerableLeft > 0);
  const blinking = recovering && (reducedMotion || Math.floor((f?.invulnerableLeft ?? 0) * 10) % 2 === 0);
  const speed = f?.speed ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-3 pb-3 pt-3 sm:px-6 short:max-w-none short:pt-2 short:pb-2 xl:py-8">
      <motion.div
        ref={arenaRef}
        data-run-arena
        data-phase={phase}
        data-score={f?.score ?? 0}
        data-pet-y={f ? f.petY.toFixed(1) : GROUND_Y}
        data-elapsed={f ? f.elapsed.toFixed(1) : 0}
        className="relative aspect-[4/5] max-h-[calc(100dvh-250px)] sm:aspect-[1.15/1] w-full touch-none select-none overflow-hidden rounded-[2rem] border-[3px] border-white shadow-pop short:aspect-auto short:h-[calc(100dvh-128px)] short:max-h-none short:min-h-[220px] sm:max-h-[calc(100dvh-270px)] xl:max-h-[calc(100dvh-170px)]"
        animate={shake}
        onPointerDown={onArenaPointer}
        aria-label="Pet Adventure Run. Tap to jump."
        role="application"
      >
        <Sky variant="day" className="absolute inset-0" clouds={!reducedMotion} />
        {arena.h > 0 ? (
          <>
            <ParallaxLayer layer="hills" offset={distancePx * 0.15} tile={arena.w} className="bottom-[10%] top-[38%]" />
            <ParallaxLayer layer="trees" offset={distancePx * 0.4} tile={Math.max(360, arena.w * 0.8)} className="bottom-[12%] top-[30%]" />
          </>
        ) : null}
        <div className="absolute inset-x-0 bottom-0" style={{ height: u > 0 ? GROUND_Y * u : `${GROUND_Y}%` }} aria-hidden="true">
          {arena.h > 0 ? <ParallaxLayer layer="ground" offset={distancePx} tile={Math.max(300, arena.h * 1.2)} className="inset-0" /> : null}
        </div>

        {/* World objects anchored at bottom-left, moved with transforms. */}
        {f && arena.h > 0 ? (
          <div className="pointer-events-none absolute inset-0">
            {f.gemsOnField.map((g) => (
              <div
                key={g.id}
                className="absolute bottom-0 left-0"
                style={{ width: 7 * u, height: 7 * u, transform: `${pos(g.x - 3.5, g.y - 3.5)}${reducedMotion ? '' : ` translateY(${Math.sin((f.distance + g.id * 9) * 0.25) * u}px)`}` }}
              >
                <GemArt kind={g.kind} />
              </div>
            ))}
            {f.obstacles.map((o) => (
              <div
                key={o.id}
                className={`absolute bottom-0 left-0 transition-opacity ${o.hit ? 'opacity-60' : ''}`}
                style={{ width: o.w * u, height: Math.max(o.h, 2.5) * u, transform: pos(o.x, GROUND_Y - (o.kind === 'puddle' ? 1 : 0.5)) }}
              >
                <ObstacleArt kind={o.kind} />
              </div>
            ))}
            {/* The pet, with its equipped look. */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                // Art is drawn a little larger than the (forgiving) hitbox so the pet reads clearly on phones.
                width: PET_W * PET_ART_SCALE * 1.25 * u,
                height: PET_H * PET_ART_SCALE * u,
                transform: `${pos(PET_X - (PET_W * PET_ART_SCALE * 1.25) / 2, f.petY - 0.5 + bob)} rotate(${tilt}deg)`,
                opacity: blinking ? (reducedMotion ? 0.6 : 0.45) : 1,
                transformOrigin: '50% 100%',
              }}
            >
              <PetSprite pet={pet} mood="happy" skinId={skinId} petName={petName} idle={false} shadow={!airborne} eager sizes="200px" className="h-full w-full" />
              {f.slowLeft > 0 ? (
                <span className="absolute -top-[18%] left-1/2 flex -translate-x-1/2 gap-0.5" aria-hidden="true">
                  <Icon name="sparkle" size={Math.max(14, 4 * u)} className={reducedMotion ? '' : 'animate-spin'} />
                </span>
              ) : null}
            </div>
            <AnimatePresence>
              {pops.map((p) => (
                <motion.span
                  key={p.id}
                  className={`absolute bottom-0 left-0 whitespace-nowrap font-display font-semibold drop-shadow-[0_2px_0_white] ${
                    p.tone === 'bad' ? 'text-berry-600' : p.tone === 'nice' ? 'text-plum-600' : 'text-honey-600'
                  }`}
                  style={{ fontSize: Math.max(18, 6 * u), transform: pos(p.x - 4, p.y) }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: reducedMotion ? 0 : -6 * u }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75 }}
                >
                  {p.text}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        ) : null}

        {/* HUD */}
        <div className="absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/90 py-1.5 pl-2 pr-3.5 shadow-soft">
            <Icon name="sparkle" size={28} />
            <span className="font-display text-3xl font-semibold tabular-nums text-ink" aria-label={`Score ${f?.score ?? 0}`}>
              {f?.score ?? 0}
            </span>
          </div>
          {phase === 'playing' || phase === 'countdown' ? (
            <span className="hidden rounded-full bg-white/80 px-3 py-1 font-display text-sm font-semibold text-ink-soft shadow-soft sm:inline">
              {MODES[mode].label}{speed > 0 && f && f.elapsed > f.duration * 0.66 ? " · faster!" : ""}
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            {phase === 'playing' ? (
              <button
                type="button"
                onClick={() => setPhase('paused')}
                className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-ink shadow-soft"
                aria-label="Pause"
              >
                <Icon name="pause" size={26} />
              </button>
            ) : null}
            <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white/90 shadow-soft" aria-label={`${timeLeft} seconds left`}>
              <svg className="absolute inset-1 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(58 42 77 / 0.1)" strokeWidth="9" />
                <circle cx="50" cy="50" r="44" fill="none" stroke={timeLeft <= 10 ? '#e84a76' : '#45c286'} strokeWidth="9" strokeLinecap="round" strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - timeFraction)} />
              </svg>
              <span className={`font-display text-lg font-semibold tabular-nums ${timeLeft <= 10 ? 'text-berry-600' : 'text-ink'}`}>{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {phase === 'select' || phase === 'paying' ? (
            <motion.div key="select" className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-white/45 p-3 backdrop-blur-[3px] short:place-items-start short:p-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="surface w-full max-w-md p-4 text-center short:max-w-2xl short:p-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-20 w-20 shrink-0 short:hidden">
                    {hasSnapshot ? <PetSprite pet={pet} mood="happy" skinId={skinId} petName={petName} sizes="96px" eager className="h-full w-full" /> : null}
                  </div>
                  <div className="text-left">
                    <h1 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">Adventure Run</h1>
                    <p className="text-sm font-bold text-ink-soft short:hidden">Jump over logs and puddles with {petName}. Grab the gems!</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose a mode">
                  {(['easy', 'challenge'] as RunMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      onClick={() => setMode(m)}
                      className={`rounded-2xl bg-gradient-to-b p-3 text-left transition ${MODE_INFO[m].tone} ${mode === m ? 'ring-4' : 'ring-1 ring-white opacity-80'}`}
                    >
                      <span className="flex items-center justify-between font-display text-xl font-semibold text-ink">
                        {MODE_INFO[m].title}
                        {mode === m ? <Icon name="check" size={22} /> : null}
                      </span>
                      <span className="block text-xs font-bold text-ink-soft short:hidden">{MODE_INFO[m].blurb}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs font-extrabold text-honey-700">
                        <Icon name="trophy" size={16} /> Best {bests[m]}
                      </span>
                    </button>
                  ))}
                </div>
                {message ? <p className="mt-3 rounded-2xl bg-berry-50 px-3 py-2 text-sm font-bold text-berry-700">{message}</p> : null}
                <button
                  type="button"
                  onClick={() => void startRound(mode)}
                  disabled={phase === 'paying' || !petReady}
                  aria-disabled={!canPlay}
                  className={`btn-chunky mt-3 min-h-16 w-full text-xl short:mt-2 short:min-h-12 short:text-lg ${canPlay ? 'btn-mint' : 'btn-paper opacity-75'}`}
                >
                  {phase === 'paying' ? 'Getting ready…' : !petReady ? 'Loading the forest…' : (
                    <>
                      Play {MODE_INFO[mode].title} for {RUN_HEART_COST} <Icon name="heart" size={26} />
                    </>
                  )}
                </button>
                <p className={`mt-2 text-xs font-bold ${canPlay ? 'text-ink-faint' : 'text-berry-600'}`}>
                  {canPlay
                    ? `You have ${state.hearts} hearts · Tap the forest or press Space to jump`
                    : RUN_HEART_COST - state.hearts === 1
                      ? 'One more heart to play!'
                      : `${RUN_HEART_COST - state.hearts} more hearts to play!`}
                </p>
              </div>
            </motion.div>
          ) : null}

          {phase === 'countdown' ? (
            <motion.div key="count" className="absolute inset-0 z-40 grid place-items-center bg-white/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={countdown}
                  className="font-display text-8xl font-semibold text-white drop-shadow-[0_6px_0_rgb(58_42_77/0.6)]"
                  initial={{ scale: reducedMotion ? 1 : 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: reducedMotion ? 1 : 0.4, opacity: 0 }}
                >
                  {countdown > 0 ? countdown : 'Go!'}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          ) : null}

          {phase === 'paused' ? (
            <motion.div key="paused" className="absolute inset-0 z-40 grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="surface w-full max-w-xs p-5 text-center">
                <h2 className="font-display text-3xl font-semibold text-ink">Paused</h2>
                <p className="text-sm font-bold text-ink-soft">{petName} is waiting for you.</p>
                <button type="button" onClick={resume} className="btn-chunky btn-mint mt-4 min-h-14 w-full text-lg">
                  <Icon name="resume" size={22} /> Keep running
                </button>
                <button
                  type="button"
                  onClick={() => runRef.current && finish(runRef.current)}
                  className="mt-2 min-h-11 w-full text-sm font-extrabold text-ink-soft"
                >
                  End run
                </button>
              </div>
            </motion.div>
          ) : null}

          {phase === 'finished' && result ? (
            <motion.div key="done" className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-white/50 p-3 backdrop-blur-[3px] short:p-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative w-full max-w-sm short:max-w-xl">
                <Celebration show burstKey={`run-${result.score}-${result.best}`} />
                <motion.div className="surface p-4 text-center short:p-3" initial={{ scale: reducedMotion ? 1 : 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <h2 className="font-display text-3xl font-semibold text-ink short:text-2xl">{result.newBest ? 'New best score!' : 'What a run!'}</h2>
                  <p className="text-sm font-bold text-ink-soft short:hidden">
                    {petName} jumped {result.cleared} {result.cleared === 1 ? 'obstacle' : 'obstacles'} and found {result.gems} {result.gems === 1 ? 'gem' : 'gems'}.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 short:mt-2">
                    <div className="rounded-2xl bg-plum-50 py-2.5 short:py-1">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-plum-500">Score</p>
                      <p className="font-display text-4xl font-semibold text-ink">{result.score}</p>
                    </div>
                    <div className="rounded-2xl bg-honey-50 py-2.5 short:py-1">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-honey-600">Best · {MODES[mode].label}</p>
                      <p className="flex items-center justify-center gap-1 font-display text-4xl font-semibold text-honey-700">
                        <Icon name="trophy" size={32} /> {result.best}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 short:mt-2 short:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => (canPlay ? void startRound(mode) : notify(`You need ${RUN_HEART_COST} hearts for another run.`, 'info'))}
                      aria-disabled={!canPlay}
                      className={`btn-chunky min-h-14 text-lg short:min-h-12 ${canPlay ? 'btn-mint' : 'btn-paper opacity-75'}`}
                    >
                      Run again · {RUN_HEART_COST} <Icon name="heart" size={22} />
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPhase('select')} className="btn-chunky btn-paper min-h-12 text-base">
                        Change mode
                      </button>
                      <Link href={`/child/${child.id}/play`} className="btn-chunky btn-paper min-h-12 text-base">
                        Play Room
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Big jump button for thumbs (portrait). In landscape, tap the forest. */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          jump();
        }}
        disabled={phase !== 'playing'}
        className="btn-chunky btn-sky mt-3 min-h-20 w-full touch-none text-2xl short:hidden disabled:opacity-60"
        aria-label="Jump"
      >
        <Icon name="jump" size={34} /> Jump!
      </button>
      <p className="mt-2 hidden text-center text-xs font-bold text-ink-faint lg:block">Space or ↑ to jump · P to pause</p>
    </div>
  );
}
