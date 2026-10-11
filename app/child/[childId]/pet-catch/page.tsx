'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PetSprite } from '@/components/child/PetSprite';
import { Celebration } from '@/components/child/Celebration';
import { Sky } from '@/components/child/Scenery';
import { useChildState } from '@/app/child/_components/ChildStateProvider';
import { PET_ROSTER } from '@/lib/mock-data';
import type { PetType } from '@/lib/pet-skins';
import { spendHearts } from '@/lib/child-economy';
import {
  PET_CATCH_DURATION_SECONDS,
  PET_CATCH_HEART_COST,
  getPetCatchPhase,
} from '@/lib/pet-catch-rules';

type ItemKind = 'star' | 'candy' | 'gem' | 'rainbow' | 'bomb';
type Item = { id: number; kind: ItemKind; x: number; y: number; speed: number; points: number; spin: number };
type Pop = { id: number; x: number; y: number; text: string; good: boolean };
type Phase = 'ready' | 'paying' | 'countdown' | 'playing' | 'finished';

// The original loop advanced items by `speed` (% of arena height) every 35ms.
const TICK_MS = 35;
const PER_SECOND = 1000 / TICK_MS;
const PET_SPEED_PER_SECOND = 4 * PER_SECOND; // keyboard/button speed, % per second
const PET_MIN = 7;
const PET_MAX = 93;

function createItem(id: number): Item {
  const roll = Math.random();
  const x = 8 + Math.random() * 84;
  const spin = (Math.random() - 0.5) * 120;
  if (roll < 0.1) return { id, kind: 'bomb', x, y: -8, speed: 1.4 + Math.random() * 1.2, points: -2, spin };
  if (roll < 0.16) return { id, kind: 'rainbow', x, y: -8, speed: 1 + Math.random() * 0.8, points: 5, spin: 0 };
  const kinds: ItemKind[] = ['star', 'candy', 'gem'];
  return { id, kind: kinds[Math.floor(Math.random() * 3)], x, y: -8, speed: 1.2 + Math.random() * 1.2, points: 1, spin };
}

function ItemArt({ kind }: { kind: ItemKind }) {
  const ink = { stroke: '#3a2a4d', strokeWidth: 2.4, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'star':
      return <Icon name="star" size={46} />;
    case 'candy':
      return (
        <svg viewBox="0 0 48 48" width={46} height={46} aria-hidden="true">
          <path d="M8 18l7 6-7 6zM40 18l-7 6 7 6z" fill="#ffb8cb" {...ink} />
          <circle cx="24" cy="24" r="10" fill="#f8678f" {...ink} />
          <path d="M18 20c3-3 9-3 12 1M17 27c4 3 10 3 14-1" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
        </svg>
      );
    case 'gem':
      return (
        <svg viewBox="0 0 48 48" width={46} height={46} aria-hidden="true">
          <path d="M14 10h20l8 10-18 20L6 20z" fill="#7ec6fb" {...ink} />
          <path d="M6 20h36M18 10l-4 10 10 20 10-20-4-10" fill="none" stroke="#3a2a4d" strokeWidth={1.8} strokeLinejoin="round" />
          <path d="M16 14l-2 4" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      );
    case 'rainbow':
      return (
        <svg viewBox="0 0 64 48" width={66} height={50} aria-hidden="true">
          <path d="M6 40a26 26 0 0152 0" fill="none" stroke="#f8678f" strokeWidth={7} />
          <path d="M13 40a19 19 0 0138 0" fill="none" stroke="#fbbf3a" strokeWidth={7} />
          <path d="M20 40a12 12 0 0124 0" fill="none" stroke="#45c286" strokeWidth={7} />
          <path d="M27 40a5 5 0 0110 0" fill="none" stroke="#4eabf2" strokeWidth={6} />
          <ellipse cx="9" cy="41" rx="8" ry="5" fill="#fff" {...ink} />
          <ellipse cx="55" cy="41" rx="8" ry="5" fill="#fff" {...ink} />
        </svg>
      );
    case 'bomb':
      return (
        <svg viewBox="0 0 48 48" width={46} height={46} aria-hidden="true">
          <circle cx="22" cy="28" r="14" fill="#4b3a66" {...ink} />
          <path d="M30 16l4-4" stroke="#3a2a4d" strokeWidth={4} strokeLinecap="round" />
          <path d="M35 11c2-3 5-3 7-1" fill="none" stroke="#c98204" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx="42" cy="8" r="3" fill="#fbbf3a" />
          <path d="M15 23c2-3 5-4 8-4" fill="none" stroke="#9c8cab" strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      );
  }
}

export default function PetCatchGamePage() {
  const { child, state, hasSnapshot, applyState, notify } = useChildState();
  const pet = state.activePetId as PetType;
  const petName = PET_ROSTER.find((p) => p.id === pet)?.name ?? 'Your pet';
  const skinId = state.activeSkins[pet] ?? null;

  const [phase, setPhase] = useState<Phase>('ready');
  const [countdown, setCountdown] = useState(3);
  const [items, setItems] = useState<Item[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PET_CATCH_DURATION_SECONDS);
  const [petX, setPetX] = useState(50);
  const [facing, setFacing] = useState<1 | -1>(1);
  // Fun-only: a personal best kept on this device. The game never pays out currency.
  const [roundResult, setRoundResult] = useState<{ best: number; newBest: boolean } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const shake = useAnimationControls();
  const itemsRef = useRef<Item[]>([]);
  const petXRef = useRef(50);
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const idRef = useRef(1);
  const keys = useRef({ left: false, right: false });
  const drag = useRef<{ active: boolean; startX: number; startPet: number }>({ active: false, startX: 0, startPet: 50 });
  const rewardGranted = useRef(false);
  const paying = useRef(false);

  const canPlay = state.hearts >= PET_CATCH_HEART_COST;

  const finishRound = useCallback(async () => {
    setPhase('finished');
    itemsRef.current = [];
    setItems([]);
    keys.current = { left: false, right: false };
    if (rewardGranted.current) return;
    rewardGranted.current = true;
    const key = `pocket-pets-catch-best-${child.id}`;
    let previous = 0;
    try {
      previous = Number(window.localStorage.getItem(key) ?? 0) || 0;
      if (scoreRef.current > previous) window.localStorage.setItem(key, String(scoreRef.current));
    } catch {
      /* storage unavailable */
    }
    setRoundResult({ best: Math.max(previous, scoreRef.current), newBest: scoreRef.current > previous && scoreRef.current > 0 });
  }, [child.id]);

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    let frame = 0;
    let last = performance.now();

    const step = (time: number) => {
      // Clamp dt so a backgrounded tab doesn't teleport everything.
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      if (document.visibilityState !== 'visible') {
        frame = requestAnimationFrame(step);
        return;
      }
      elapsedRef.current += dt;
      const elapsed = elapsedRef.current;
      const { speedMultiplier, spawnChance, maxItems } = getPetCatchPhase(Math.floor(elapsed));

      // Pet movement from keys / hold buttons.
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      if (dir !== 0) {
        petXRef.current = Math.max(PET_MIN, Math.min(PET_MAX, petXRef.current + dir * PET_SPEED_PER_SECOND * dt));
        setFacing(dir > 0 ? 1 : -1);
      }

      let next = itemsRef.current
        .map((item) => ({ ...item, y: item.y + item.speed * speedMultiplier * PER_SECOND * dt }))
        .filter((item) => item.y < 110);
      // Same expected spawn rate as the original per-tick chance.
      if (next.length < maxItems && Math.random() < 1 - Math.pow(1 - spawnChance, dt * PER_SECOND)) {
        next.push(createItem(idRef.current++));
      }

      const caught: Item[] = [];
      next = next.filter((item) => {
        const hit = Math.abs(item.x - petXRef.current) < 8 && item.y > 68 && item.y < 88;
        if (hit) caught.push(item);
        return !hit;
      });

      if (caught.length > 0) {
        const points = caught.reduce((s, i) => s + i.points, 0);
        scoreRef.current = Math.max(0, scoreRef.current + points);
        setScore(scoreRef.current);
        if (caught.some((i) => i.kind === 'bomb')) {
          void shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.3 } });
          navigator.vibrate?.(60);
        }
        const newPops = caught.map((i) => ({ id: i.id, x: i.x, y: i.y, text: i.points > 0 ? `+${i.points}` : `${i.points}`, good: i.points > 0 }));
        setPops((p) => [...p.slice(-8), ...newPops]);
      }

      itemsRef.current = next;
      setItems(next);
      setPetX(petXRef.current);

      const remaining = Math.max(0, Math.ceil(PET_CATCH_DURATION_SECONDS - elapsed));
      setTimeLeft(remaining);
      if (elapsed >= PET_CATCH_DURATION_SECONDS) {
        void finishRound();
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, finishRound, shake]);

  useEffect(() => {
    if (pops.length === 0) return;
    const t = window.setTimeout(() => setPops((p) => p.slice(1)), 700);
    return () => window.clearTimeout(t);
  }, [pops]);

  // Countdown before the round.
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      const t = window.setTimeout(() => setPhase('playing'), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 750);
    return () => window.clearTimeout(t);
  }, [phase, countdown]);

  // Keyboard controls.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.current.left = true;
      if (e.key === 'ArrowRight') keys.current.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.current.left = false;
      if (e.key === 'ArrowRight') keys.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const startRound = async () => {
    if (paying.current) return;
    paying.current = true;
    setMessage(null);
    setPhase('paying');
    const result = await spendHearts(child, PET_CATCH_HEART_COST);
    applyState(result.state);
    paying.current = false;
    if (!result.ok) {
      setPhase('ready');
      setMessage(result.code === 'insufficient' ? 'You need 2 hearts to play. Hearts come from grown-up rewards and boss victories!' : result.message);
      return;
    }
    itemsRef.current = [];
    scoreRef.current = 0;
    elapsedRef.current = 0;
    petXRef.current = 50;
    rewardGranted.current = false;
    setItems([]);
    setPops([]);
    setScore(0);
    setPetX(50);
    setTimeLeft(PET_CATCH_DURATION_SECONDS);
    setRoundResult(null);
    setCountdown(3);
    setPhase('countdown');
  };

  // ── Drag controls ─────────────────────────────────────────────────────────
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return;
    drag.current = { active: true, startX: e.clientX, startPet: petXRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || phase !== 'playing' || !arenaRef.current) return;
    const width = arenaRef.current.getBoundingClientRect().width;
    const next = Math.max(PET_MIN, Math.min(PET_MAX, drag.current.startPet + ((e.clientX - drag.current.startX) / width) * 100));
    if (Math.abs(next - petXRef.current) > 0.3) setFacing(next > petXRef.current ? 1 : -1);
    petXRef.current = next;
    setPetX(next);
  };
  const endDrag = () => {
    drag.current.active = false;
  };

  const hold = (side: 'left' | 'right', active: boolean) => {
    keys.current[side] = active;
  };

  const timeFraction = timeLeft / PET_CATCH_DURATION_SECONDS;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-3 pb-3 pt-3 sm:px-6 short:max-w-none short:pt-2 short:pb-2 xl:py-8">
      <motion.div
        ref={arenaRef}
        data-pet-catch-arena
        className="relative h-[max(400px,calc(100dvh-230px))] touch-none select-none overflow-hidden rounded-[2rem] border-[3px] border-white shadow-pop sm:h-[min(640px,calc(100dvh-220px))] xl:h-[min(660px,calc(100dvh-140px))] short:h-[calc(100dvh-112px)] short:min-h-[220px]"
        animate={shake}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <Sky variant="meadow" className="absolute inset-0" />
        <svg className="absolute inset-x-0 bottom-0 h-[24%] w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 C 80 10, 160 20, 230 36 S 350 20, 400 30 L400 100 L0 100 Z" fill="#c6ead0" />
          <path d="M0 62 C 90 40, 180 50, 250 60 S 360 48, 400 56 L400 100 L0 100 Z" fill="#a7dcb6" />
        </svg>

        {/* HUD */}
        <div className="absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/90 py-1.5 pl-2 pr-3.5 shadow-soft">
            <Icon name="sparkle" size={30} />
            <span className="font-display text-3xl font-semibold tabular-nums text-ink" aria-label={`Score ${score}`}>
              {score}
            </span>
          </div>
          <div className="hidden items-center gap-3 rounded-2xl bg-white/80 px-3 py-1.5 text-sm font-extrabold text-ink-soft shadow-soft sm:flex" aria-hidden="true">
            <span className="flex items-center gap-1"><span className="scale-75"><ItemArt kind="gem" /></span>+1</span>
            <span className="flex items-center gap-1"><span className="scale-75"><ItemArt kind="rainbow" /></span>+5</span>
            <span className="flex items-center gap-1"><span className="scale-75"><ItemArt kind="bomb" /></span>−2</span>
          </div>
          <div className="relative grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-soft" aria-label={`${timeLeft} seconds left`}>
            <svg className="absolute inset-1 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(58 42 77 / 0.1)" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={timeLeft <= 10 ? '#e84a76' : '#7d5ce0'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - timeFraction)}
              />
            </svg>
            <span className={`font-display text-xl font-semibold tabular-nums ${timeLeft <= 10 ? 'text-berry-600' : 'text-ink'}`}>{timeLeft}</span>
          </div>
        </div>

        {/* Falling items */}
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-none absolute z-10 drop-shadow-[0_3px_3px_rgb(58_42_77/0.2)]"
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) rotate(${item.spin * (item.y / 100)}deg)` }}
          >
            <ItemArt kind={item.kind} />
          </div>
        ))}

        {/* Score pops */}
        <AnimatePresence>
          {pops.map((pop) => (
            <motion.span
              key={pop.id}
              className={`pointer-events-none absolute z-30 font-display text-3xl font-semibold drop-shadow-[0_2px_0_white] ${pop.good ? 'text-honey-600' : 'text-berry-600'}`}
              style={{ left: `${pop.x}%`, top: `${pop.y}%` }}
              initial={{ opacity: 1, scale: 0.6, x: '-50%', y: 0 }}
              animate={{ opacity: 0, scale: 1.4, y: -50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              {pop.text}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Player pet */}
        <div className="pointer-events-none absolute bottom-[6%] z-20 h-[22%] min-h-28 w-[26%] min-w-28 max-w-40" style={{ left: `${petX}%`, transform: 'translateX(-50%)' }}>
          <div className="h-full w-full transition-transform duration-150" style={{ transform: `scaleX(${facing})` }}>
            <PetSprite pet={pet} mood="happy" skinId={skinId} petName={petName} idle={phase !== 'playing'} sizes="200px" eager className="h-full w-full" />
          </div>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {phase === 'ready' || phase === 'paying' ? (
            <motion.div key="ready" className="absolute inset-0 z-40 grid place-items-center bg-white/45 p-4 backdrop-blur-[3px] short:p-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="surface max-h-full w-full max-w-sm overflow-y-auto p-5 text-center short:max-w-lg short:p-3">
                <div className="mx-auto h-32 w-36 short:hidden">
                  {hasSnapshot ? <PetSprite pet={pet} mood="happy" skinId={skinId} petName={petName} sizes="160px" eager className="h-full w-full" /> : null}
                </div>
                <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Pet Catch</h1>
                <p className="text-sm font-bold text-ink-soft">Help {petName} catch treats for 60 seconds!</p>
                <p className="hidden text-sm font-bold text-ink-soft short:block">Stars, candy &amp; gems +1 · rainbows +5 · bombs −2</p>
                <div className="mt-3 grid grid-cols-3 gap-2 short:hidden" aria-label="Catch stars, candy and gems for 1 point, rainbows for 5, avoid bombs which take 2">
                  <div className="flex flex-col items-center rounded-2xl bg-white/80 py-2">
                    <div className="flex -space-x-3"><ItemArt kind="star" /><ItemArt kind="gem" /></div>
                    <span className="font-display text-lg font-semibold text-mint-600">+1</span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-white/80 py-2">
                    <ItemArt kind="rainbow" />
                    <span className="font-display text-lg font-semibold text-mint-600">+5</span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl bg-white/80 py-2">
                    <ItemArt kind="bomb" />
                    <span className="font-display text-lg font-semibold text-berry-600">−2</span>
                  </div>
                </div>
                {message ? <p className="mt-3 rounded-2xl bg-berry-50 px-3 py-2 text-sm font-bold text-berry-700">{message}</p> : null}
                <button
                  type="button"
                  onClick={() => (canPlay ? void startRound() : setMessage('You need 2 hearts to play. Hearts come from grown-up rewards and boss victories!'))}
                  disabled={phase === 'paying'}
                  aria-disabled={!canPlay}
                  className={`btn-chunky mt-4 min-h-16 w-full text-xl ${canPlay ? 'btn-mint' : 'btn-paper opacity-75'}`}
                >
                  {phase === 'paying' ? 'Getting ready…' : (
                    <>
                      Play for {PET_CATCH_HEART_COST} <Icon name="heart" size={26} />
                    </>
                  )}
                </button>
                {canPlay ? (
                  <p className="mt-2 text-xs font-bold text-ink-faint">
                    You have {state.hearts} hearts · Drag to move, or hold the arrows
                  </p>
                ) : (
                  <p className="mt-2 flex items-center justify-center gap-1 text-sm font-extrabold text-berry-600">
                    <Icon name="heart" size={18} />
                    {PET_CATCH_HEART_COST - state.hearts === 1 ? 'One more heart to play!' : `${PET_CATCH_HEART_COST - state.hearts} more hearts to play!`}
                  </p>
                )}
              </div>
            </motion.div>
          ) : null}

          {phase === 'countdown' ? (
            <motion.div key="count" className="absolute inset-0 z-40 grid place-items-center bg-white/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={countdown}
                  className="font-display text-8xl font-semibold text-white drop-shadow-[0_6px_0_rgb(58_42_77/0.6)]"
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                >
                  {countdown > 0 ? countdown : 'Go!'}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          ) : null}

          {phase === 'finished' ? (
            <motion.div key="done" className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-white/50 p-4 backdrop-blur-[3px] short:p-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative w-full max-w-sm">
                <Celebration show={roundResult !== null} burstKey={`end-${roundResult?.best}`} />
                <motion.div className="surface p-5 text-center" initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <h2 className="font-display text-3xl font-semibold text-ink">{roundResult?.newBest ? 'New best score!' : 'Time’s up!'}</h2>
                  <p className="text-sm font-bold text-ink-soft">{petName} had so much fun!</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-plum-50 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-plum-500">Score</p>
                      <p className="font-display text-4xl font-semibold text-ink">{score}</p>
                    </div>
                    <div className="rounded-2xl bg-honey-50 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-honey-600">Best</p>
                      <p className="flex items-center justify-center gap-1 font-display text-4xl font-semibold text-honey-700">
                        <Icon name="trophy" size={34} /> {roundResult?.best ?? score}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => (canPlay ? void startRound() : notify('You need 2 hearts for another round.', 'info'))}
                      aria-disabled={!canPlay}
                      className={`btn-chunky min-h-14 text-lg ${canPlay ? 'btn-mint' : 'btn-paper opacity-75'}`}
                    >
                      Play again · {PET_CATCH_HEART_COST} <Icon name="heart" size={22} />
                    </button>
                    <Link href={`/child/${child.id}`} className="btn-chunky btn-paper min-h-12 text-base">
                      <Icon name="home" size={22} /> Back home
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Hold-to-move buttons */}
      <div className="mt-3 grid grid-cols-2 gap-3 short:hidden">
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            type="button"
            aria-label={`Move ${side}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              hold(side, true);
            }}
            onPointerUp={() => hold(side, false)}
            onPointerCancel={() => hold(side, false)}
            onLostPointerCapture={() => hold(side, false)}
            onContextMenu={(e) => e.preventDefault()}
            className="btn-chunky btn-paper min-h-16 touch-none text-ink"
          >
            <Icon name={side === 'left' ? 'arrow-left' : 'chevron-right'} size={36} />
          </button>
        ))}
      </div>
    </div>
  );
}
