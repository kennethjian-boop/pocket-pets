'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChildPageFrame } from '@/app/child/_components/ChildSidebar';
import { getChild, PET_ROSTER } from '@/lib/mock-data';
import {
  clampStars,
  hydrateChildDashboardStateFromSupabase,
  mergeWithDefaultChildState,
  readChildDashboardState,
  saveChildDashboardState,
} from '@/lib/mission-state';
import { resolvePetAvatarImage } from '@/lib/pet-avatar-image';
import { type PetType } from '@/lib/pet-skins';

type FallingItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  points: number;
  type: 'common' | 'rare' | 'bomb';
};

type ScorePop = {
  id: number;
  x: number;
  y: number;
  text: string;
  type: 'good' | 'bad';
};

const GAME_DURATION = 60;
const HEART_COST = 2;

const COMMON_ITEMS = [
  { emoji: '⭐', points: 1 },
  { emoji: '🍬', points: 1 },
  { emoji: '💎', points: 1 },
];

function getStarsEarned(score: number) {
  if (score > 130) return 20;
  if (score > 100) return 15;
  if (score > 70) return 10;
  if (score > 50) return 5;
  return 0;
}

function createItem(id: number): FallingItem {
  const roll = Math.random();

  if (roll < 0.1) {
    return {
      id,
      x: 8 + Math.random() * 84,
      y: -8,
      emoji: '💣',
      speed: 1.4 + Math.random() * 1.2,
      points: -2,
      type: 'bomb',
    };
  }

  if (roll < 0.16) {
    return {
      id,
      x: 8 + Math.random() * 84,
      y: -8,
      emoji: '🌈',
      speed: 1 + Math.random() * 0.8,
      points: 5,
      type: 'rare',
    };
  }

  const item = COMMON_ITEMS[Math.floor(Math.random() * COMMON_ITEMS.length)];

  return {
    id,
    x: 8 + Math.random() * 84,
    y: -8,
    emoji: item.emoji,
    speed: 1.2 + Math.random() * 1.2,
    points: item.points,
    type: 'common',
  };
}

export default function PetCatchGamePage() {
  const params = useParams();
  const childId = params.childId as string;
  const child = getChild(childId);

  const [petX, setPetX] = useState(50);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [roundStarted, setRoundStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [ouch, setOuch] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [dashboardState, setDashboardState] = useState(() =>
    child ? mergeWithDefaultChildState(child, null) : null
  );

  const keys = useRef({ left: false, right: false });
  const petXRef = useRef(50);
  const scoreRef = useRef(0);
  const idRef = useRef(1);
  const popIdRef = useRef(1);
  const rewardGrantedRef = useRef(false);
  const arenaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartClientXRef = useRef(0);
  const dragStartPetXRef = useRef(50);

  const updatePetFromDrag = (clientX: number) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const deltaPct = ((clientX - dragStartClientXRef.current) / rect.width) * 100;
    const xPct = dragStartPetXRef.current + deltaPct;
    const clamped = Math.max(7, Math.min(93, xPct));
    petXRef.current = clamped;
    setPetX(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!roundStarted || gameOver) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartClientXRef.current = e.clientX;
    dragStartPetXRef.current = petXRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !roundStarted || gameOver) return;
    e.preventDefault();
    updatePetFromDrag(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      e.preventDefault();
    }
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (!child) return;

    const syncState = () => {
      setDashboardState(mergeWithDefaultChildState(child, readChildDashboardState(childId)));
    };

    syncState();
    void hydrateChildDashboardStateFromSupabase(childId, child).then(setDashboardState);
    const refreshTimer = window.setInterval(syncState, 1000);

    return () => window.clearInterval(refreshTimer);
  }, [child, childId]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!roundStarted || gameOver) return;
      if (event.key === 'ArrowLeft') keys.current.left = true;
      if (event.key === 'ArrowRight') keys.current.right = true;
    };

    const up = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') keys.current.left = false;
      if (event.key === 'ArrowRight') keys.current.right = false;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [child, childId, gameOver, roundStarted]);

  useEffect(() => {
    if (!roundStarted || gameOver) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!rewardGrantedRef.current) {
            rewardGrantedRef.current = true;
            const earned = getStarsEarned(scoreRef.current);
            setStarsEarned(earned);

            if (child && earned > 0) {
              const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));
              const nextState = saveChildDashboardState(childId, child, {
                stars: clampStars(current.stars + earned),
              });
              setDashboardState(nextState);
            }
          }

          setGameOver(true);
          setItems([]);
          keys.current.left = false;
          keys.current.right = false;
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [child, childId, gameOver, roundStarted]);

  useEffect(() => {
    if (!roundStarted || gameOver) return;

    const loop = window.setInterval(() => {
      const elapsed = GAME_DURATION - timeLeft;
      const speedMultiplier = elapsed <= 30 ? 0.5 : elapsed <= 45 ? 0.75 : 1.2;
      const spawnChance = elapsed <= 30 ? 0.045 : elapsed <= 45 ? 0.075 : 0.105;
      const maxItems = elapsed <= 30 ? 3 : elapsed <= 45 ? 5 : 7;

      setPetX((prev) => {
        let next = prev;
        if (keys.current.left) next -= 4;
        if (keys.current.right) next += 4;
        const clamped = Math.max(7, Math.min(93, next));
        petXRef.current = clamped;
        return clamped;
      });

      setItems((prev) => {
        let updated = prev
          .map((item) => ({ ...item, y: item.y + item.speed * speedMultiplier }))
          .filter((item) => item.y < 110);

        if (Math.random() < spawnChance && updated.length < maxItems) {
          updated.push(createItem(idRef.current++));
        }

        const caught: FallingItem[] = [];

        updated = updated.filter((item) => {
          const hitX = Math.abs(item.x - petXRef.current) < 8;
          const hitY = item.y > 68 && item.y < 88;

          if (hitX && hitY) {
            caught.push(item);
            return false;
          }

          return true;
        });

        if (caught.length > 0) {
          const totalPoints = caught.reduce((sum, item) => sum + item.points, 0);
          setScore((prevScore) => {
            const nextScore = Math.max(0, prevScore + totalPoints);
            scoreRef.current = nextScore;
            return nextScore;
          });

          if (caught.some((item) => item.type === 'bomb')) {
            setOuch(true);
            window.setTimeout(() => setOuch(false), 280);
          }

          const newPops = caught.map((item) => ({
            id: popIdRef.current++,
            x: item.x,
            y: item.y,
            text: item.points > 0 ? `+${item.points}` : `${item.points}`,
            type: item.points > 0 ? ('good' as const) : ('bad' as const),
          }));
          const newPopIds = new Set(newPops.map((pop) => pop.id));

          setScorePops((prevPops) => [...prevPops, ...newPops]);

          window.setTimeout(() => {
            setScorePops((prevPops) =>
              prevPops.filter((pop) => !newPopIds.has(pop.id))
            );
          }, 650);
        }

        return updated;
      });
    }, 35);

    return () => window.clearInterval(loop);
  }, [gameOver, roundStarted, timeLeft]);

  const avatar = useMemo(() => {
    if (!dashboardState) {
      return resolvePetAvatarImage({
        pet: 'bubbo',
        mood: 'happy',
        petName: 'Pocket Pets',
      });
    }

    const petType = dashboardState.activePetId as PetType;
    const activeSkinId = dashboardState.activeSkins[petType];
    const rosterPet = PET_ROSTER.find((pet) => pet.id === petType);

    return resolvePetAvatarImage({
      pet: petType,
      mood: 'happy',
      petName: rosterPet?.name ?? 'Pet',
      activeSkinId,
    });
  }, [dashboardState]);

  if (!child || !dashboardState) {
    return <div>Child not found</div>;
  }

  const canPlay = dashboardState.hearts >= HEART_COST;

  const startRound = () => {
    const current = mergeWithDefaultChildState(child, readChildDashboardState(childId));

    if (current.hearts < HEART_COST) {
      setDashboardState(current);
      setMessage('You need 2 hearts to play Pet Catch. Ask a parent or earn more hearts first.');
      return;
    }

    const nextState = saveChildDashboardState(childId, child, {
      hearts: current.hearts - HEART_COST,
    });

    setDashboardState(nextState);
    setMessage(null);
    setScore(0);
    scoreRef.current = 0;
    setStarsEarned(0);
    setItems([]);
    setScorePops([]);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setRoundStarted(true);
    setOuch(false);
    setPetX(50);
    petXRef.current = 50;
    rewardGrantedRef.current = false;
    keys.current.left = false;
    keys.current.right = false;
  };

  const setTouch = (side: 'left' | 'right', active: boolean) => {
    if (!roundStarted || gameOver) return;
    keys.current[side] = active;
  };

  return (
    <ChildPageFrame childId={childId}>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-sky-100 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-pink-500">
              2 hearts to play
            </p>
            <h1 className="mt-1 text-4xl font-black text-slate-800">Pet Catch Game</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold text-slate-500 sm:text-base">
              One minute challenge. Catch ⭐ 🍬 💎 for +1, 🌈 for +5, and dodge 💣 for -2.
            </p>
          </div>

          <motion.div
            ref={arenaRef}
            data-pet-catch-arena
            className="relative h-[620px] max-h-[72vh] touch-none overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-2xl backdrop-blur sm:h-[650px] sm:rounded-[40px]"
            animate={ouch ? { x: [-8, 8, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.25 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(186,230,253,0.6),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(255,220,180,0.55),transparent_38%)]" />
            {ouch && <div className="pointer-events-none absolute inset-0 z-20 bg-rose-200/25" />}
            <div className="absolute left-12 top-28 h-14 w-32 rounded-full bg-white/70 blur-[1px]" />
            <div className="absolute right-16 top-36 h-12 w-36 rounded-full bg-white/70 blur-[1px]" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-emerald-100/80 to-transparent" />

            <div className="absolute left-4 top-4 z-30 rounded-3xl border border-white bg-white/85 px-4 py-3 shadow-lg sm:left-5 sm:top-5 sm:px-5 sm:py-4">
              <div className="text-xs font-bold uppercase text-slate-400">Score</div>
              <div className="text-3xl font-black text-slate-800">{score}</div>
            </div>

            <div className="absolute right-4 top-4 z-30 rounded-3xl border border-white bg-white/85 px-4 py-3 text-right shadow-lg sm:right-5 sm:top-5 sm:px-5 sm:py-4">
              <div className="text-xs font-bold uppercase text-slate-400">Time</div>
              <div className="text-3xl font-black text-slate-800">{timeLeft}s</div>
            </div>

            <div className="absolute left-1/2 top-5 z-30 hidden -translate-x-1/2 gap-2 rounded-3xl border border-white bg-white/75 px-4 py-3 text-sm font-bold text-slate-600 shadow md:flex">
              <span>⭐🍬💎 +1</span>
              <span>🌈 +5</span>
              <span>💣 -2</span>
            </div>

            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  className={`absolute z-10 select-none drop-shadow-sm ${
                    item.type === 'rare' ? 'text-6xl' : 'text-5xl'
                  }`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    rotate: item.type === 'bomb' ? [0, -8, 8, 0] : [0, 10, -10, 0],
                    scale: item.type === 'rare' ? [1, 1.2, 1] : [1, 1.08, 1],
                  }}
                  transition={{ duration: item.type === 'rare' ? 0.75 : 1.2, repeat: Infinity }}
                >
                  {item.emoji}
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {scorePops.map((pop) => (
                <motion.div
                  key={pop.id}
                  className={`pointer-events-none absolute z-40 text-3xl font-black ${
                    pop.type === 'good' ? 'text-amber-500' : 'text-rose-500'
                  }`}
                  style={{
                    left: `${pop.x}%`,
                    top: `${pop.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ scale: 0.4, opacity: 1 }}
                  animate={{ scale: 1.8, opacity: 0, y: -34 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                >
                  {pop.type === 'good' ? '✨' : '💨'} {pop.text}
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div
              className="absolute bottom-5 z-20 flex h-28 w-28 items-end justify-center sm:h-32 sm:w-32"
              style={{ left: `${petX}%`, transform: 'translateX(-50%)' }}
              animate={ouch ? { rotate: [-5, 5, -3, 3, 0], y: [0, 3, 0] } : { y: [0, -7, 0] }}
              transition={ouch ? { duration: 0.25 } : { duration: 1.5, repeat: Infinity }}
            >
              <div
                className={`relative ${avatar.isSkin ? 'h-28 w-24 sm:h-32 sm:w-28' : 'h-28 w-28 sm:h-32 sm:w-32'}`}
              >
                <Image
                  src={avatar.src}
                  alt={avatar.alt}
                  fill
                  priority
                  className="object-contain drop-shadow-2xl"
                  sizes="128px"
                />
              </div>
            </motion.div>

            {!roundStarted && !gameOver && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/55 px-5 py-8 backdrop-blur-sm sm:p-4">
                <div
                  className="w-full max-w-[22rem] rounded-[36px] border border-white bg-white text-center shadow-2xl sm:max-w-sm"
                  style={{ padding: '2rem 1.5rem' }}
                >
                  <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center sm:h-28 sm:w-28">
                    <div className={`relative ${avatar.isSkin ? 'h-32 w-28 sm:h-28 sm:w-24' : 'h-32 w-32 sm:h-28 sm:w-28'}`}>
                      <Image
                        src={avatar.src}
                        alt={avatar.alt}
                        fill
                        loading="eager"
                        className="object-contain drop-shadow-xl"
                        sizes="112px"
                      />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">Ready to catch?</h2>
                  <p className="mx-auto mt-3 max-w-[16rem] text-base font-bold leading-relaxed text-slate-500 sm:text-sm">
                    {child.name} has {dashboardState.hearts} hearts. Each round costs 2 hearts.
                  </p>
                  {message && (
                    <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                      {message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={startRound}
                    disabled={!canPlay}
                    className="mt-7 flex min-h-16 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-slate-800 via-violet-700 to-pink-500 px-6 py-5 text-lg font-black leading-tight text-white shadow-xl shadow-pink-200/60 ring-4 ring-pink-100/80 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:ring-slate-100 sm:min-h-14 sm:py-4 sm:text-base"
                  >
                    Play Pet Catch - 2 💖
                  </button>
                  {!canPlay && (
                    <p className="mt-3 text-xs font-bold text-slate-400">
                      Earn more hearts from parent rewards or family victories.
                    </p>
                  )}
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/65 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-[36px] border border-white bg-white px-8 py-7 text-center shadow-2xl">
                  <div className="mb-3 text-5xl">🏁</div>
                  <div className="text-3xl font-black text-slate-800">Time Is Up!</div>
                  <div className="mt-4 rounded-3xl bg-amber-50 px-5 py-4">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Final Score
                    </div>
                    <div className="mt-1 text-6xl font-black text-amber-500">{score}</div>
                  </div>
                  <div className="mt-3 rounded-3xl bg-pink-50 px-5 py-4">
                    <div className="text-xs font-black uppercase tracking-wider text-pink-500">
                      Stars Earned
                    </div>
                    <div className="mt-1 text-4xl font-black text-pink-600">{starsEarned} ⭐</div>
                  </div>
                  <button
                    type="button"
                    onClick={startRound}
                    disabled={dashboardState.hearts < HEART_COST}
                    className="mt-5 w-full rounded-3xl bg-slate-800 px-6 py-4 font-black text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Play Again - 2 💖
                  </button>
                  {dashboardState.hearts < HEART_COST && (
                    <p className="mt-3 text-sm font-bold text-slate-400">
                      Not enough hearts for another round.
                    </p>
                  )}
                  <Link
                    href={`/child/${childId}`}
                    className="mt-3 block w-full rounded-3xl bg-sky-100 px-6 py-4 font-black text-sky-800 shadow-sm transition active:scale-95"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onTouchStart={() => setTouch('left', true)}
              onTouchEnd={() => setTouch('left', false)}
              onTouchCancel={() => setTouch('left', false)}
              onMouseDown={() => setTouch('left', true)}
              onMouseUp={() => setTouch('left', false)}
              onMouseLeave={() => setTouch('left', false)}
              className="rounded-3xl bg-white px-6 py-5 text-3xl shadow-lg transition active:scale-95 sm:py-4"
            >
              ◀
            </button>
            <button
              type="button"
              onTouchStart={() => setTouch('right', true)}
              onTouchEnd={() => setTouch('right', false)}
              onTouchCancel={() => setTouch('right', false)}
              onMouseDown={() => setTouch('right', true)}
              onMouseUp={() => setTouch('right', false)}
              onMouseLeave={() => setTouch('right', false)}
              className="rounded-3xl bg-white px-6 py-5 text-3xl shadow-lg transition active:scale-95 sm:py-4"
            >
              ▶
            </button>
          </div>

          <div className="mt-4 text-center text-sm font-semibold text-slate-500">
            Drag anywhere in the game area to move your pet. Keyboard: ← → · 60 seconds · no Screen Energy, boss damage, goals, or egg progress
          </div>
        </div>
      </div>
    </ChildPageFrame>
  );
}
