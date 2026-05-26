import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FallingItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  points: number;
  type: "common" | "rare" | "bomb";
};

type ScorePop = {
  id: number;
  x: number;
  y: number;
  text: string;
  type: "good" | "bad";
};

const GAME_DURATION = 60;

const COMMON_ITEMS = [
  { emoji: "⭐", points: 1 },
  { emoji: "🍬", points: 1 },
  { emoji: "💎", points: 1 },
];

function createItem(id: number): FallingItem {
  const roll = Math.random();

  if (roll < 0.1) {
    return {
      id,
      x: 8 + Math.random() * 84,
      y: -8,
      emoji: "💣",
      speed: 1.4 + Math.random() * 1.2,
      points: -2,
      type: "bomb",
    };
  }

  if (roll < 0.16) {
    return {
      id,
      x: 8 + Math.random() * 84,
      y: -8,
      emoji: "🌈",
      speed: 1 + Math.random() * 0.8,
      points: 5,
      type: "rare",
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
    type: "common",
  };
}

function DragonKnightBubbo() {
  return (
    <div className="relative flex h-32 w-32 select-none items-center justify-center scale-75 sm:scale-85 origin-bottom">
      <div className="absolute bottom-4 left-4 h-28 w-24 rotate-[-18deg] rounded-b-[60px] bg-red-400 opacity-90" />
      <div className="absolute bottom-4 right-4 h-28 w-24 rotate-[18deg] rounded-b-[60px] bg-red-500 opacity-90" />
      <div className="absolute bottom-2 h-24 w-28 rounded-[44px] border-4 border-emerald-200 bg-emerald-100 shadow-xl" />
      <div className="absolute bottom-3 left-8 h-12 w-10 rounded-full border-4 border-emerald-200 bg-emerald-100" />
      <div className="absolute bottom-3 right-8 h-12 w-10 rounded-full border-4 border-emerald-200 bg-emerald-100" />
      <div className="absolute top-[72px] h-32 w-36 rounded-[48px] border-4 border-emerald-200 bg-emerald-100 shadow-2xl" />
      <div className="absolute top-8 h-18 w-38 overflow-hidden rounded-t-[60px] rounded-b-xl border-4 border-slate-400 bg-slate-300" />
      <div className="absolute top-6 h-5 w-40 rounded-full border-2 border-amber-500 bg-amber-400" />
      <div className="absolute top-2 h-12 w-12 rounded-full bg-red-500 blur-[0.5px]" />
      <div className="absolute top-0 h-14 w-8 rotate-[-15deg] rounded-full bg-red-400" />
      <div className="absolute left-20 top-0 h-14 w-8 rotate-[18deg] rounded-full bg-red-500" />
      <div className="absolute left-[52px] top-[52px] flex gap-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} className="h-8 w-3 rotate-[8deg] rounded-full bg-slate-600" />
        ))}
      </div>
      <div className="absolute left-14 top-28 h-8 w-6 rounded-full bg-slate-800">
        <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-white" />
      </div>
      <div className="absolute right-14 top-28 h-8 w-6 rounded-full bg-slate-800">
        <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-white" />
      </div>
      <div className="absolute left-11 top-[152px] h-4 w-8 rounded-full bg-rose-300 opacity-80" />
      <div className="absolute right-11 top-[152px] h-4 w-8 rounded-full bg-rose-300 opacity-80" />
      <div className="absolute top-[156px] text-xl text-slate-700">⌣</div>
      <div className="absolute bottom-[68px] h-3 w-30 rounded-full border border-sky-500 bg-sky-300" />
      <div className="absolute bottom-[60px] h-7 w-7 rotate-45 rounded-md border-2 border-amber-500 bg-amber-300" />
      <div className="absolute bottom-8 left-2 flex h-14 w-12 rotate-[-10deg] items-center justify-center rounded-t-lg rounded-b-[24px] border-4 border-amber-400 bg-slate-500 text-xl">
        🔥
      </div>
      <div className="absolute bottom-12 right-1 h-20 w-4 rotate-[32deg] rounded-t-full border-2 border-slate-400 bg-slate-200" />
      <div className="absolute bottom-12 right-10 h-3 w-10 rotate-[32deg] rounded-full bg-amber-500" />
    </div>
  );
}

export default function PetCatchGamePrototype() {
  const [petX, setPetX] = useState(50);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ouch, setOuch] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);

  const keys = useRef({ left: false, right: false });
  const idRef = useRef(1);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keys.current.left = true;
      if (e.key === "ArrowRight") keys.current.right = true;
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keys.current.left = false;
      if (e.key === "ArrowRight") keys.current.right = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (paused || gameOver) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
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
  }, [paused, gameOver]);

  useEffect(() => {
    if (paused || gameOver) return;

    const loop = window.setInterval(() => {
      const elapsed = GAME_DURATION - timeLeft;
      const speedMultiplier = elapsed < 30 ? 0.5 : elapsed < 45 ? 0.75 : 1.2;
      const spawnChance = elapsed < 30 ? 0.055 : elapsed < 45 ? 0.085 : 0.13;
      const maxItems = elapsed < 30 ? 4 : elapsed < 45 ? 6 : 8;

      setPetX((prev) => {
        let next = prev;
        if (keys.current.left) next -= 4;
        if (keys.current.right) next += 4;
        return Math.max(5, Math.min(95, next));
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
          const hitX = Math.abs(item.x - petX) < 8;
          const hitY = item.y > 68 && item.y < 88;

          if (hitX && hitY) {
            caught.push(item);
            return false;
          }

          return true;
        });

        if (caught.length > 0) {
          const totalPoints = caught.reduce((sum, item) => sum + item.points, 0);
          setScore((prevScore) => Math.max(0, prevScore + totalPoints));

          const hasBomb = caught.some((item) => item.type === "bomb");
          if (hasBomb) {
            setOuch(true);
            window.setTimeout(() => setOuch(false), 280);
          }

          setScorePops((prevPops) => [
            ...prevPops,
            ...caught.map((item) => ({
              id: item.id,
              x: item.x,
              y: item.y,
              text: item.points > 0 ? `+${item.points}` : `${item.points}`,
              type: item.points > 0 ? ("good" as const) : ("bad" as const),
            })),
          ]);

          window.setTimeout(() => {
            setScorePops((prevPops) =>
              prevPops.filter((pop) => !caught.some((item) => item.id === pop.id))
            );
          }, 650);
        }

        return updated;
      });
    }, 35);

    return () => window.clearInterval(loop);
  }, [paused, petX, gameOver, timeLeft]);

  const setTouch = (side: "left" | "right", active: boolean) => {
    if (gameOver) return;
    keys.current[side] = active;
  };

  const restartGame = () => {
    setScore(0);
    setItems([]);
    setScorePops([]);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setPaused(false);
    setOuch(false);
    setPetX(50);
    keys.current.left = false;
    keys.current.right = false;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-rose-50 to-sky-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-4 text-center">
          <h1 className="text-4xl font-black text-slate-800">Pet Catch Game</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            One minute challenge: starts easy, gets busier near the end. Catch ⭐ 🍬 💎 for +1, 🌈 for +5, avoid 💣 for -2.
          </p>
        </div>

        <motion.div
          className="relative h-[620px] max-h-[72vh] overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-2xl backdrop-blur sm:h-[650px] sm:rounded-[40px]"
          animate={ouch ? { x: [-8, 8, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(186,230,253,0.6),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(255,220,180,0.55),transparent_38%)]" />
          {ouch && <div className="pointer-events-none absolute inset-0 z-20 bg-rose-200/25" />}
          <div className="absolute left-12 top-28 h-14 w-32 rounded-full bg-white/70 blur-[1px]" />
          <div className="absolute right-16 top-36 h-12 w-36 rounded-full bg-white/70 blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-emerald-100/80 to-transparent" />

          <div className="absolute left-5 top-5 z-30 rounded-3xl border border-white bg-white/85 px-5 py-4 shadow-lg">
            <div className="text-xs font-bold uppercase text-slate-400">Prototype Score</div>
            <div className="text-3xl font-black text-slate-800">{score}</div>
          </div>

          <button
            disabled={gameOver}
            onClick={() => setPaused((value) => !value)}
            className="absolute right-6 top-6 z-30 rounded-3xl border border-white bg-white/85 px-6 py-4 font-black text-slate-700 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {paused ? "Resume" : "Pause"}
          </button>

          <div className="absolute left-1/2 top-6 z-30 hidden -translate-x-1/2 gap-2 rounded-3xl border border-white bg-white/75 px-4 py-3 text-sm font-bold text-slate-600 shadow sm:flex">
            <span>⏱ {timeLeft}s</span>
            <span>⭐🍬💎 +1</span>
            <span>🌈 +5</span>
            <span>💣 -2</span>
          </div>

          <div className="absolute left-5 top-28 z-30 rounded-3xl border border-white bg-white/85 px-5 py-3 shadow-lg sm:hidden">
            <div className="text-xs font-bold uppercase text-slate-400">Time</div>
            <div className="text-2xl font-black text-slate-800">{timeLeft}s</div>
          </div>

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                className={`absolute z-10 select-none drop-shadow-sm ${
                  item.type === "rare" ? "text-6xl" : "text-5xl"
                }`}
                style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
                animate={{
                  rotate: item.type === "bomb" ? [0, -8, 8, 0] : [0, 10, -10, 0],
                  scale: item.type === "rare" ? [1, 1.2, 1] : [1, 1.08, 1],
                }}
                transition={{ duration: item.type === "rare" ? 0.75 : 1.2, repeat: Infinity }}
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
                  pop.type === "good" ? "text-amber-500" : "text-rose-500"
                }`}
                style={{ left: `${pop.x}%`, top: `${pop.y}%`, transform: "translate(-50%, -50%)" }}
                initial={{ scale: 0.4, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0, y: -34 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65 }}
              >
                {pop.type === "good" ? "✨" : "💨"} {pop.text}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            className="absolute bottom-6 z-20"
            style={{ left: `${petX}%`, transform: "translateX(-50%)" }}
            animate={ouch ? { rotate: [-5, 5, -3, 3, 0], y: [0, 3, 0] } : { y: [0, -7, 0] }}
            transition={ouch ? { duration: 0.25 } : { duration: 1.5, repeat: Infinity }}
          >
            <DragonKnightBubbo />
          </motion.div>

          {gameOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/65 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[36px] border border-white bg-white px-8 py-7 text-center shadow-2xl">
                <div className="mb-3 text-5xl">🏁</div>
                <div className="text-3xl font-black text-slate-800">Time Is Up!</div>
                <div className="mt-2 text-slate-500">Final Prototype Score</div>
                <div className="mt-2 text-6xl font-black text-amber-500">{score}</div>
                <button
                  onClick={restartGame}
                  className="mt-6 w-full rounded-3xl bg-slate-800 px-6 py-4 font-black text-white shadow-lg active:scale-95"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {paused && !gameOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-xl">
                <div className="mb-2 text-4xl">🌙</div>
                <div className="text-2xl font-black text-slate-800">Paused</div>
                <div className="text-slate-500">Bubbo is taking a tiny rest.</div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onTouchStart={() => setTouch("left", true)}
            onTouchEnd={() => setTouch("left", false)}
            onMouseDown={() => setTouch("left", true)}
            onMouseUp={() => setTouch("left", false)}
            className="rounded-3xl bg-white px-6 py-5 text-3xl shadow-lg active:scale-95 sm:py-4"
          >
            ◀
          </button>
          <button
            onTouchStart={() => setTouch("right", true)}
            onTouchEnd={() => setTouch("right", false)}
            onMouseDown={() => setTouch("right", true)}
            onMouseUp={() => setTouch("right", false)}
            className="rounded-3xl bg-white px-6 py-5 text-3xl shadow-lg active:scale-95 sm:py-4"
          >
            ▶
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-slate-500">
          Keyboard: ← → · 1 minute challenge · Prototype only · No rewards connected
        </div>
      </div>
    </div>
  );
}
