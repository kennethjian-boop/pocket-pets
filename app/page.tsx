'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { readParentPin } from '@/lib/parent-pin';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const features = [
  { icon: '⭐', label: 'Complete Goals' },
  { icon: '💖', label: 'Care & Play' },
  { icon: '👾', label: 'Family Boss' },
  { icon: '🎁', label: 'Earn Rewards' },
];

const bottomFeatures = [
  { icon: '📋', title: 'Build Habits', desc: 'Complete daily goals and build positive routines.' },
  { icon: '🏆', title: 'Team Up', desc: 'Work together in family boss battles.' },
  { icon: '🥚', title: 'Unlock Pets', desc: 'Hatch secret eggs and discover companions.' },
  { icon: '🎁', title: 'Earn Rewards', desc: 'Trade stars for screen time and surprises.' },
];

const players = [
  {
    id: 'child-ansel',
    name: 'Ansel',
    petImage: '/pets/bubbo/moods/happy.png',
    petAlt: 'Bubbo',
    gradient: 'from-amber-100 via-yellow-200 to-amber-300',
    border: 'border-amber-300',
    badge: '⭐',
    badgeBg: 'bg-amber-50 border border-amber-200',
    nameColor: 'text-amber-900',
    btnClass: 'bg-amber-400 text-amber-950 hover:bg-amber-500',
  },
  {
    id: 'child-thea',
    name: 'Thea',
    petImage: '/pets/luna/moods/happy.png',
    petAlt: 'Luna',
    gradient: 'from-pink-100 via-rose-200 to-pink-300',
    border: 'border-pink-300',
    badge: '🌸',
    badgeBg: 'bg-pink-50 border border-pink-200',
    nameColor: 'text-pink-900',
    btnClass: 'bg-pink-400 text-white hover:bg-pink-500',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPin = () => {
    setPin('');
    setPinError(false);
    setPinOpen(true);
    // focus input after modal mounts
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const closePin = () => {
    setPinOpen(false);
    setPin('');
    setPinError(false);
  };

  const submitPin = () => {
    if (pin === readParentPin()) {
      closePin();
      router.push('/parent/dashboard');
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-sky-100">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-16 h-[520px] w-[520px] rounded-full bg-violet-200/50 blur-3xl" />
        <div className="absolute -right-24 top-10 h-[480px] w-[480px] rounded-full bg-pink-200/50 blur-3xl" />
        <div className="absolute bottom-48 left-1/3 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-16 right-1/3 h-72 w-72 rounded-full bg-violet-200/35 blur-3xl" />
      </div>

      {/* ─────────────────────────────────────────────────────────
          MASTER CENTERED COLUMN
          flex + items-center drives centering — not mx-auto —
          so it works even when * { margin:0 } overrides auto margins.
      ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* ===== NAV ===== */}
        <nav className="flex w-full max-w-4xl items-center justify-between px-8 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🐾</span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
              Pocket <span className="text-pink-500">Pets</span>
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openPin}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md sm:text-base"
          >
            <span>👨‍👩‍👧</span>
            <span className="hidden sm:inline">Parent Dashboard</span>
            <span className="sm:hidden">Parents</span>
          </motion.button>
        </nav>

        {/* ===== HERO ===== */}
        <motion.section
          className="flex w-full max-w-2xl flex-col items-center px-8 pb-6 pt-4 text-center sm:px-10 sm:pt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Sparkle row */}
          <div className="pointer-events-none mb-3 flex justify-center gap-7 select-none">
            {['✦', '✨', '✦', '✨', '✦'].map((s, i) => (
              <motion.span
                key={i}
                className="text-2xl text-yellow-400/80"
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3.2 + i * 0.35, repeat: Infinity, ease: 'easeInOut', delay: i * 0.45 }}
              >
                {s}
              </motion.span>
            ))}
          </div>

          {/* Floating paw */}
          <motion.div
            className="mb-4"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="inline-block text-7xl drop-shadow-lg sm:text-8xl">🐾</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-3 text-6xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm sm:text-7xl"
          >
            Pocket <span className="text-pink-500">Pets</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mb-8 text-lg leading-relaxed text-slate-600 sm:text-xl"
          >
            Raise magical pets, build habits, and grow together as a family.
          </motion.p>

          {/* Feature pills */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2.5">
            {features.map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm sm:px-5 sm:text-base"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ===== WHO IS PLAYING ===== */}
        <motion.section
          className="flex w-full max-w-2xl flex-col items-center px-8 py-10 sm:px-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Section heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/75 px-7 py-3 text-lg font-bold text-slate-700 shadow-sm backdrop-blur-sm">
              <span>✨</span>
              <span>Who is playing today?</span>
              <span>✨</span>
            </div>
          </motion.div>

          {/* Player cards */}
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
            {players.map((player) => (
              <motion.div key={player.id} variants={itemVariants}>
                <Link href={`/child/${player.id}`} className="block">
                  <motion.div
                    whileHover={{ scale: 1.04, y: -6 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative overflow-hidden rounded-[36px] border-2 ${player.border} bg-gradient-to-b ${player.gradient} px-7 py-7 shadow-2xl transition-shadow hover:shadow-[0_28px_56px_-8px_rgba(0,0,0,0.16)]`}
                  >
                    {/* Highlight sheen */}
                    <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-gradient-to-t from-white/0 via-white/10 to-white/45" />
                    {/* Corner glow */}
                    <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-white/30 blur-2xl" />
                    <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/30 blur-2xl" />

                    {/* Badge */}
                    <div className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl text-lg shadow-sm ${player.badgeBg}`}>
                      {player.badge}
                    </div>

                    {/* Pet image */}
                    <div className="relative mx-auto mb-4" style={{ width: 200, height: 200 }}>
                      <Image
                        src={player.petImage}
                        alt={player.petAlt}
                        fill
                        loading="eager"
                        className="object-contain drop-shadow-xl"
                        sizes="200px"
                      />
                    </div>

                    {/* Child name */}
                    <h2 className={`mb-5 text-center text-4xl font-extrabold tracking-tight ${player.nameColor}`}>
                      {player.name}
                    </h2>

                    {/* CTA */}
                    <div className={`flex items-center justify-center gap-2 rounded-2xl px-7 py-3 text-base font-bold shadow-md transition ${player.btnClass}`}>
                      <span>Enter World</span>
                      <span className="text-lg font-black">›</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ===== BOTTOM FEATURE CARDS ===== */}
        <motion.div
          className="w-full max-w-2xl px-8 pb-16 sm:px-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {bottomFeatures.map(({ icon, title, desc }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                className="rounded-[22px] border border-white/80 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm sm:p-5"
              >
                <div className="mb-2 text-2xl">{icon}</div>
                <h3 className="mb-1 text-sm font-bold text-slate-800 sm:text-base">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.p variants={itemVariants} className="mt-10 text-center text-sm font-medium text-slate-400 sm:text-base">
            Made with 💚 for families
          </motion.p>
        </motion.div>

      </div>{/* end master column */}

      {/* ===== PIN MODAL ===== */}
      <AnimatePresence>
        {pinOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closePin}
            />

            {/* Modal card */}
            <motion.div
              className="relative w-full max-w-xs rounded-[28px] border border-white/80 bg-white p-8 shadow-2xl"
              initial={{ scale: 0.9, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 12, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="mb-1 text-center text-3xl">🔒</div>
              <h2 className="mb-1 text-center text-xl font-extrabold text-slate-900">
                Parent Check
              </h2>
              <p className="mb-6 text-center text-sm text-slate-500">
                Enter the parent code to continue.
              </p>

              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitPin()}
                placeholder="••••"
                className="mb-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-pink-400 focus:bg-white"
              />

              <AnimatePresence>
                {pinError && (
                  <motion.p
                    className="mb-4 text-center text-sm font-semibold text-rose-500"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    Oops, that is not the parent code.
                  </motion.p>
                )}
              </AnimatePresence>

              {!pinError && <div className="mb-4" />}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closePin}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitPin}
                  disabled={pin.length !== 4}
                  className="flex-1 rounded-2xl bg-pink-400 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-pink-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Enter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
