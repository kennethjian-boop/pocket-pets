'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getChild, getPetByChildId } from '@/lib/mock-data';
import { PetAvatar } from '@/components/PetAvatar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { motion } from 'framer-motion';

export default function ChildHome() {
  const params = useParams();
  const childId = params.childId as string;

  const child = getChild(childId);
  const pet = getPetByChildId(childId);

  const [interaction, setInteraction] = useState<string | null>(null);

  if (!child || !pet) {
    return <div>Child not found</div>;
  }

  const handleInteraction = (type: string) => {
    setInteraction(type);
    setTimeout(() => setInteraction(null), 1000);
  };

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
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  const moodEmojis = {
    neutral: '😊',
    happy: '🤩',
    sleepy: '😴',
    sad: '😔',
  };

  const moodLabels = {
    neutral: 'Cozy feels neutral.',
    happy: 'Cozy is joyful!',
    sleepy: 'Cozy is dreamy.',
    sad: 'Cozy is quiet.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-150 via-pink-100 to-blue-100 py-8 px-4">
      <motion.div
        className="mx-auto max-w-6xl px-6 py-8 pb-28 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== HEADER ===== */}
        <motion.header
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 mb-12"
        >
          <div className="justify-self-start hidden md:block">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-white/80 px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-white hover:shadow-md"
              >
                ← Switch User
              </motion.button>
            </Link>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">Welcome, {child.name}! 👋</h1>
            <p className="mt-2 text-sm font-medium text-gray-500 uppercase tracking-widest">It&apos;s a perfect day for cozy adventures.</p>
          </div>
          <div className="justify-self-end hidden md:block">
            <div className="inline-flex items-center gap-2 text-lg font-black text-gray-800 uppercase tracking-tighter">
              <span className="text-2xl">🐾</span> Pocket Pets
            </div>
          </div>
        </motion.header>

        {/* ===== HERO SECTION: Pet + Mood + Equipment ===== */}
        <motion.div
          variants={itemVariants}
          className="mb-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]"
        >
          {/* LEFT: Pet Showcase Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-100 via-pink-100 to-purple-50 p-6 shadow-xl">
            {/* Your Pet Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white bg-opacity-70 px-4 py-1.5 text-sm font-semibold text-gray-700">
              <span className="text-lg">💖</span>
              <span>Your Pet</span>
            </div>

            {/* Pet Display Area */}
            <div className="mb-6 flex items-center justify-center">
              <div className="w-full max-w-[320px]">
                <PetAvatar
                  pet={pet.pet}
                  childName={child.name}
                  petName={pet.name}
                  stars={child.stars}
                  mood={pet.mood === 'sleepy' ? 'sleep' : pet.mood}
                />
                {interaction && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 0], opacity: [1, 0.5, 0] }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 flex items-center justify-center text-4xl"
                  >
                    {interaction === 'feed' && '😋'}
                    {interaction === 'pat' && '😊'}
                    {interaction === 'clean' && '✨'}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Pet Info */}
            <div className="mx-auto max-w-[24rem] text-center">
              <h2 className="text-3xl font-bold text-gray-800">{pet.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                A gentle companion who loves soft play and cozy moments.
              </p>
            </div>

            {/* Stars Badge - Top Right */}
            <div className="absolute top-6 right-6 inline-flex items-center gap-2 rounded-full bg-yellow-200 px-4 py-2 font-bold text-yellow-800">
              <span className="text-xl">⭐</span>
              <span className="text-lg">{child.stars}</span>
            </div>
          </div>

          {/* RIGHT: Mood + Equipment */}
          <div className="flex flex-col gap-6">
            {/* MOOD CARD */}
            <div className="overflow-hidden rounded-[32px] bg-white bg-opacity-85 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Mood</h3>
                <button className="text-2xl text-gray-400 hover:text-gray-600">ℹ️</button>
              </div>
              <div className="mb-4 flex flex-col items-center">
                <div className="mb-2 text-7xl">
                  {moodEmojis[pet.mood as keyof typeof moodEmojis] || '😊'}
                </div>
                <p className="text-sm text-gray-600">
                  {moodLabels[pet.mood as keyof typeof moodLabels] || 'Neutral'}
                </p>
              </div>
              <div className="mb-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-400"
                  style={{ width: '50%' }}
                />
              </div>
              <div className="text-center text-xs font-semibold text-gray-600">
                Neutral
              </div>
            </div>

            {/* EQUIPMENT CARD */}
            <div className="overflow-hidden rounded-[32px] bg-white bg-opacity-85 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Equipment</h3>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-800">
                  0 / 3
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Pink Bow */}
                <div className="flex flex-col rounded-2xl bg-gradient-to-br from-pink-100 to-pink-150 p-3 text-center">
                  <div className="mb-2 text-4xl">🎀</div>
                  <h4 className="text-xs font-bold text-gray-800">Pink Bow</h4>
                  <p className="mt-1 text-xs text-gray-600">Soft & pretty</p>
                  <button className="mt-2 rounded-lg bg-pink-300 px-2 py-1 text-xs font-semibold text-pink-900 hover:bg-pink-400 transition-colors">
                    EQUIP
                  </button>
                </div>

                {/* Cozy Headphones */}
                <div className="flex flex-col rounded-2xl bg-gradient-to-br from-purple-100 to-purple-150 p-3 text-center">
                  <div className="mb-2 text-4xl">🎧</div>
                  <h4 className="text-xs font-bold text-gray-800">Headphones</h4>
                  <p className="mt-1 text-xs text-gray-600">Fun tunes</p>
                  <button className="mt-2 rounded-lg bg-purple-300 px-2 py-1 text-xs font-semibold text-purple-900 hover:bg-purple-400 transition-colors">
                    EQUIP
                  </button>
                </div>

                {/* Cozy Scarf */}
                <div className="flex flex-col rounded-2xl bg-gradient-to-br from-rose-100 to-rose-150 p-3 text-center">
                  <div className="mb-2 text-4xl">🧣</div>
                  <h4 className="text-xs font-bold text-gray-800">Scarf</h4>
                  <p className="mt-1 text-xs text-gray-600">Snug & warm</p>
                  <button className="mt-2 rounded-lg bg-rose-300 px-2 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-400 transition-colors">
                    EQUIP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== STATS ROW ===== */}
        <motion.div
          variants={itemVariants}
          className="mb-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
        >
          <div className="flex flex-col items-center rounded-2xl bg-white bg-opacity-85 p-6 shadow-lg">
            <div className="text-4xl">⭐</div>
            <div className="mt-3 text-2xl font-bold text-gray-800">{child.stars}</div>
            <div className="mt-1 text-sm text-gray-600">Stars</div>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white bg-opacity-85 p-6 shadow-lg">
            <div className="text-4xl">💖</div>
            <div className="mt-3 text-2xl font-bold text-gray-800">{child.hearts}</div>
            <div className="mt-1 text-sm text-gray-600">Hearts</div>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white bg-opacity-85 p-6 shadow-lg">
            <div className="text-4xl">🔋</div>
            <div className="mt-3 text-2xl font-bold text-gray-800">
              {child.screenEnergy}
            </div>
            <div className="mt-1 text-sm text-gray-600">Weekend Screen</div>
            <div className="mt-1 text-xs text-gray-500">
              {child.screenEnergy * 10} min weekend screen time
            </div>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white bg-opacity-85 p-6 shadow-lg">
            <div className="text-4xl">🎯</div>
            <div className="mt-3 text-2xl font-bold text-gray-800">7 🔥</div>
            <div className="mt-1 text-sm text-gray-600">Day Streak</div>
          </div>
        </motion.div>

        {/* ===== ACTION BUTTONS ===== */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInteraction('feed')}
            className="flex items-center justify-between rounded-[24px] bg-gradient-to-br from-yellow-300 to-orange-400 px-4 py-3 font-bold text-gray-900 shadow-md transition-all hover:shadow-lg min-h-[64px]"
          >
            <div className="text-left">
              <div className="text-base">Feed</div>
              <div className="text-xs opacity-80">Yummy treat!</div>
            </div>
            <div className="text-3xl">🍖</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInteraction('pat')}
            className="flex items-center justify-between rounded-[24px] bg-gradient-to-br from-pink-300 to-rose-400 px-4 py-3 font-bold text-gray-900 shadow-md transition-all hover:shadow-lg min-h-[64px]"
          >
            <div className="text-left">
              <div className="text-base">Pat</div>
              <div className="text-xs opacity-80">Give love!</div>
            </div>
            <div className="text-3xl">👐</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInteraction('clean')}
            className="flex items-center justify-between rounded-[24px] bg-gradient-to-br from-blue-300 to-cyan-400 px-4 py-3 font-bold text-gray-900 shadow-md transition-all hover:shadow-lg min-h-[64px]"
          >
            <div className="text-left">
              <div className="text-base">Clean</div>
              <div className="text-xs opacity-80">Keep it cozy!</div>
            </div>
            <div className="text-3xl">🧼</div>
          </motion.button>
        </motion.div>

        {/* ===== MISSION + SHOP/BOSS ===== */}
        <motion.div
          variants={itemVariants}
          className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
        >
          {/* LEFT: TODAY'S MISSION */}
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-100 to-green-100 p-8 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">📝 Today&apos;s Mission</h3>
              <span className="rounded-full bg-green-300 px-4 py-1 font-bold text-green-900">
                0 / 3
              </span>
            </div>
            <p className="mb-6 text-sm text-gray-700">Little steps, big adventures!</p>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-4">
                <input type="checkbox" className="h-6 w-6 rounded-lg" />
                <span className="flex-1 text-sm text-gray-800">Read for 15 minutes</span>
                <span className="font-bold text-green-700">+10</span>
              </label>
              <label className="flex cursor-pointer items-center gap-4">
                <input type="checkbox" className="h-6 w-6 rounded-lg" />
                <span className="flex-1 text-sm text-gray-800">Brush teeth twice</span>
                <span className="font-bold text-green-700">+10</span>
              </label>
              <label className="flex cursor-pointer items-center gap-4">
                <input type="checkbox" className="h-6 w-6 rounded-lg" />
                <span className="flex-1 text-sm text-gray-800">Help with dinner</span>
                <span className="font-bold text-green-700">+10</span>
              </label>
            </div>
          </div>

          {/* RIGHT: SHOP + BOSS */}
          <div className="flex flex-col gap-4">
            {/* Reward Shop */}
            <Link href={`/child/${childId}/shop`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-100 to-yellow-100 p-6 shadow-lg transition-all hover:shadow-xl h-full flex items-center"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">Reward Shop</h3>
                  <p className="mt-1 text-sm text-gray-700">Redeem stars for fun rewards!</p>
                </div>
                <div className="ml-4 text-3xl">🏪</div>
                <div className="ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white bg-opacity-70 text-xl font-bold text-gray-800">
                  →
                </div>
              </motion.div>
            </Link>

            {/* Family Boss */}
            <Link href={`/child/${childId}/family`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-100 to-indigo-100 p-6 shadow-lg transition-all hover:shadow-xl h-full flex items-center"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">Family Boss</h3>
                  <p className="mt-1 text-sm text-gray-700">Team up, complete goals, and unlock more!</p>
                </div>
                <div className="ml-4 text-3xl">👾</div>
                <div className="ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white bg-opacity-70 text-xl font-bold text-gray-800">
                  →
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ===== ENCOURAGEMENT ===== */}
        <motion.div
          variants={itemVariants}
          className="mt-12 text-center text-base font-semibold text-gray-700"
        >
          💖 You&apos;re doing amazing, {child.name}! ✨
        </motion.div>
      </motion.div>

      <BottomNavigation type="child" childId={childId} />
    </div>
  );
}
