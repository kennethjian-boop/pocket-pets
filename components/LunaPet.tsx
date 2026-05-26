'use client';

/**
 * @deprecated Use PetAvatar instead
 * This component is kept for backward compatibility.
 * PetAvatar provides a reusable multi-pet architecture.
 */

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PetAvatar } from './PetAvatar';

type MoonMood = 'neutral' | 'happy' | 'sleepy' | 'sad';
type AccessorySlot = 'head' | 'face' | 'body' | 'back';

interface AccessoryItem {
  id: string;
  name: string;
  slot: AccessorySlot;
  asset: string;
  description: string;
  emoji?: string;
}

interface LunaPetProps {
  childName: string;
  petName: string;
  stars: number;
  initialMood?: 'neutral' | 'happy' | 'sleepy' | 'sad';
}

export function LunaPet({
  childName,
  petName,
  stars,
  initialMood = 'neutral',
}: LunaPetProps) {
  const displayMood = initialMood === 'sleepy' ? 'sleep' : initialMood;

  return (
    <PetAvatar
      pet="luna"
      childName={childName}
      petName={petName}
      stars={stars}
      mood={displayMood}
    />
  );
}


const moodLabels: Record<MoonMood, string> = {
  neutral: 'Cozy Calm',
  happy: 'Joyful',
  sleepy: 'Dreamy',
  sad: 'Quiet',
};

const inventoryItems: AccessoryItem[] = [
  {
    id: 'pink-bow',
    name: 'Pink Bow',
    slot: 'head',
    asset: '/pets/luna/accessories/pink-bow.png',
    description: 'Soft bow that sits between Luna’s ears.',
  },
  {
    id: 'headphones',
    name: 'Headphones',
    slot: 'face',
    asset: '/pets/luna/accessories/headphones.png',
    description: 'Cozy headphones around Luna’s head.',
  },
  {
    id: 'cozy-scarf',
    name: 'Cozy Scarf',
    slot: 'body',
    asset: '/pets/luna/accessories/cozy-scarf.png',
    description: 'Snug scarf around Luna’s neck and chest.',
  },
];

const slotOrder: AccessorySlot[] = ['back', 'body', 'face', 'head'];

const accessoryLayout: Record<string, { top: string; left: string; width: string; height: string; zIndex: number; rotate?: string }> = {
  'pink-bow': {
    top: '8%',
    left: '50%',
    width: '24%',
    height: '16%',
    zIndex: 50,
  },
  headphones: {
    top: '8%',
    left: '50%',
    width: '30%',
    height: '18%',
    zIndex: 45,
    rotate: '-2deg',
  },
  'cozy-scarf': {
    top: '56%',
    left: '50%',
    width: '38%',
    height: '18%',
    zIndex: 35,
    rotate: '1deg',
  },
  'moon-wings': {
    top: '30%',
    left: '50%',
    width: '48%',
    height: '36%',
    zIndex: 15,
  },
};

const moodMotion = {
  neutral: {
    y: [0, -8, 0],
    rotate: [0, 0.7, 0],
    transition: { duration: 4.4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  happy: {
    y: [0, -14, 0],
    scale: [1, 1.04, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeOut' as const },
  },
  sleepy: {
    y: [0, -6, 0],
    opacity: [0.9, 1, 0.9],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
  },
  sad: {
    y: [0, -5, 0],
    rotate: [0, -0.5, 0],
    transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

function LunaPetDetail({ childName, petName, stars, initialMood = 'neutral' }: LunaPetProps) {
  const [mood, setMood] = useState<MoonMood>(initialMood);
  const [equipped, setEquipped] = useState<Record<AccessorySlot, string | null>>({
    head: null,
    face: null,
    body: null,
    back: null,
  });

  const equippedAccessories = useMemo(
    () =>
      inventoryItems.reduce<Record<AccessorySlot, AccessoryItem | null>>((result, item) => {
        if (equipped[item.slot] === item.id) {
          result[item.slot] = item;
        } else {
          result[item.slot] = result[item.slot] ?? null;
        }
        return result;
      }, {
        back: null,
        body: null,
        face: null,
        head: null,
      }),
    [equipped]
  );

  const toggleAccessory = (item: AccessoryItem) => {
    setEquipped((current) => ({
      ...current,
      [item.slot]: current[item.slot] === item.id ? null : item.id,
    }));
  };

  const moodClasses: Record<MoonMood, string> = {
    neutral: 'bg-slate-50 text-slate-900',
    happy: 'bg-amber-50 text-amber-900',
    sleepy: 'bg-indigo-50 text-indigo-900',
    sad: 'bg-sky-50 text-sky-900',
  };

  return (
    <div className="rounded-[32px] border border-white/80 bg-gradient-to-br from-slate-100 via-rose-50 to-sky-50 p-5 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Cozy Room
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Luna</h2>
          <p className="text-sm text-slate-600">A gentle companion for {childName}’s bedroom adventures.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-center shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Stars</div>
          <div className="mt-2 flex items-center justify-center gap-2 text-2xl font-bold text-amber-600">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-inner shadow-slate-200/30">
          <motion.div
            className="relative mx-auto mb-6 flex w-full max-w-[360px] items-center justify-center rounded-[40px] border border-slate-200 bg-gradient-to-b from-indigo-100 via-slate-50 to-rose-100 shadow-xl"
            animate={moodMotion[mood]}
          >
            <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_42%)]" />
            <div className="absolute bottom-8 left-6 h-10 w-20 rounded-full bg-white/80 blur-sm" />
            <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/75 blur-sm" />

              <div className="relative flex w-full max-w-[280px] items-center justify-center rounded-[36px] bg-white/95 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] overflow-hidden">
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white via-slate-100 to-rose-100" />
              <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-slate-50">
                <div className="absolute inset-0 bg-slate-50/80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-full w-full max-w-[280px] overflow-hidden rounded-[32px] bg-transparent">
                    <Image
                      src={`/pets/luna/moods/${mood}.png`}
                      alt={`Luna ${mood}`}
                      width={280}
                      height={280}
                      className="relative h-auto w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {slotOrder.map((slot) => {
                const item = equippedAccessories[slot];
                if (!item) return null;
                const layout = accessoryLayout[item.id];
                if (!layout) return null;

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      top: layout.top,
                      left: layout.left,
                      width: layout.width,
                      height: layout.height,
                      zIndex: layout.zIndex,
                      transform: `translateX(-50%) ${layout.rotate ?? ''}`,
                    }}
                  >
                    <Image
                      src={item.asset}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-contain"
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Mood</p>
                  <p className="text-lg font-semibold text-slate-900">{moodLabels[mood]}</p>
                </div>
                <div className={`rounded-2xl px-3 py-1 text-sm font-semibold ${moodClasses[mood]}`}>
                  {mood}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['neutral', 'happy', 'sleepy', 'sad'] as MoonMood[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMood(option)}
                    className={`rounded-2xl border px-3 py-2 text-sm transition-all hover:border-slate-400 ${
                      mood === option
                        ? 'border-blue-300 bg-blue-50 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Equipment</p>
                  <p className="text-sm text-slate-600">Tap to equip or remove accessories.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {Object.values(equipped).filter(Boolean).length}/3 used
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {inventoryItems.map((item) => {
                  const isActive = equipped[item.slot] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleAccessory(item)}
                      className={`rounded-3xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                          {item.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.description}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                        <span>{item.slot}</span>
                        <span>{isActive ? 'Equipped' : 'Tap to equip'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-950/95 p-5 text-white shadow-lg shadow-slate-900/20">
          <div className="mb-4 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 shadow-inner shadow-slate-900/30">
            <div className="mb-3 text-sm uppercase tracking-[0.24em] text-slate-400">Pet Nest</div>
            <h3 className="text-2xl font-bold text-white">{petName}</h3>
            <p className="mt-2 text-sm text-slate-300">Luna loves gentle play and soft star glow.</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-slate-900/90 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Head slot</span>
                <span>{equipped.head ? 'Filled' : 'Empty'}</span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 text-center text-3xl">
                {equipped.head ? inventoryItems.find((item) => item.id === equipped.head)?.emoji : '🎩'}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/90 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Body slot</span>
                <span>{equipped.body ? 'Filled' : 'Empty'}</span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 text-center text-3xl">
                {equipped.body ? inventoryItems.find((item) => item.id === equipped.body)?.emoji : '🧸'}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/90 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Back slot</span>
                <span>{equipped.back ? 'Filled' : 'Empty'}</span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 text-center text-3xl">
                {equipped.back ? inventoryItems.find((item) => item.id === equipped.back)?.emoji : '✨'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
