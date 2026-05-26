'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { type PetMood } from '@/lib/pet-mood';
import { resolvePetAvatarImage } from '@/lib/pet-avatar-image';

type Pet = 'luna' | 'bubbo' | 'mochi' | 'ember';

interface PetAvatarProps {
  pet: Pet;
  childName: string;
  petName: string;
  stars: number;
  mood?: PetMood;
  variant?: 'full' | 'image-only';
  activeSkinId?: string | null;
}

const moodLabels: Record<PetMood, string> = {
  neutral: 'Cozy Calm',
  happy: 'Joyful',
  sad: 'Quiet',
  sleep: 'Dreamy',
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
  sleep: {
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

const skinFloat = {
  y: [0, -8, 0],
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
};

export function PetAvatar({
  pet,
  childName,
  petName,
  stars,
  mood: initialMood = 'neutral',
  variant = 'full',
  activeSkinId,
}: PetAvatarProps) {
  const [mood, setMood] = useState<PetMood>(initialMood);

  const displayMood = variant === 'image-only' ? initialMood : mood;
  const avatarImage = resolvePetAvatarImage({
    pet,
    mood: displayMood,
    petName,
    activeSkinId,
  });

  const moodClasses: Record<PetMood, string> = {
    neutral: 'bg-slate-50 text-slate-900',
    happy: 'bg-amber-50 text-amber-900',
    sad: 'bg-sky-50 text-sky-900',
    sleep: 'bg-indigo-50 text-indigo-900',
  };

  const petRoom = (
    <motion.div
      className="relative mx-auto flex w-full max-w-[360px] items-center justify-center rounded-[40px] border border-slate-200 bg-gradient-to-b from-indigo-100 via-slate-50 to-rose-100 shadow-xl"
      animate={avatarImage.isSkin ? skinFloat : moodMotion[displayMood]}
    >
      <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_42%)]" />
      <div className="absolute bottom-8 left-6 h-10 w-20 rounded-full bg-white/80 blur-sm" />
      <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/75 blur-sm" />

      <div className="relative flex w-full max-w-[280px] items-center justify-center rounded-[36px] bg-white/95 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)]">
        <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white via-slate-100 to-rose-100" />
        <div className="relative z-[2] w-full overflow-hidden rounded-[36px]">
          <div className="flex items-center justify-center">
            {avatarImage.isSkin ? (
              <div className="relative w-full max-w-[220px] overflow-hidden rounded-[32px] bg-transparent" style={{ aspectRatio: '4/5' }}>
                <Image
                  src={avatarImage.src}
                  alt={avatarImage.alt}
                  fill
                  loading="eager"
                  className="object-contain"
                  sizes="220px"
                />
              </div>
            ) : (
              <div className="relative w-full max-w-[280px] aspect-square overflow-hidden rounded-[32px] bg-transparent">
                <Image
                  src={avatarImage.src}
                  alt={avatarImage.alt}
                  fill
                  loading="eager"
                  className="object-contain"
                  sizes="(max-width: 640px) 280px, 360px"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (variant === 'image-only') {
    return petRoom;
  }

  return (
    <div className="rounded-[32px] border border-white/80 bg-gradient-to-br from-slate-100 via-rose-50 to-sky-50 p-5 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Cozy Room
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{petName}</h2>
          <p className="text-sm text-slate-600">A gentle companion for {childName}&apos;s bedroom adventures.</p>
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
          <div className="mb-6">{petRoom}</div>

          <div className="space-y-4">
            {!avatarImage.isSkin && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Mood</p>
                    <p className="text-lg font-semibold text-slate-900">{moodLabels[displayMood]}</p>
                  </div>
                  <div className={`rounded-2xl px-3 py-1 text-sm font-semibold ${moodClasses[displayMood]}`}>
                    {displayMood}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['neutral', 'happy', 'sleep', 'sad'] as PetMood[]).map((option) => (
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
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-950/95 p-5 text-white shadow-lg shadow-slate-900/20">
          <div className="mb-4 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 shadow-inner shadow-slate-900/30">
            <div className="mb-3 text-sm uppercase tracking-[0.24em] text-slate-400">Pet Nest</div>
            <h3 className="text-2xl font-bold text-white">{petName}</h3>
            <p className="mt-2 text-sm text-slate-300">A gentle creature that loves soft play and cozy moments.</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-slate-900/90 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Pet Type</span>
                <span className="capitalize">{pet}</span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 text-center text-sm font-semibold text-slate-300">
                {pet === 'luna' ? '🌙' : '⭐'}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/90 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Current Look</span>
                <span className="capitalize">{avatarImage.isSkin ? 'Skin' : 'Default'}</span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3 text-center text-sm text-slate-300">
                {avatarImage.skinName ?? `${displayMood} mood`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
