'use client';

import React from 'react';
import Image from 'next/image';

interface BossCardProps {
  name: string;
  emoji: string;
  imageSrc?: string;
  imageAlt?: string;
  description?: string;
  currentHealth: number;
  maxHealth: number;
  reward: { name: string; emoji: string; details?: string[] };
}

export function BossCard({
  name,
  emoji,
  imageSrc,
  imageAlt,
  description,
  currentHealth,
  maxHealth,
  reward,
}: BossCardProps) {
  const healthPercentage = (currentHealth / maxHealth) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl p-6 border-3 border-purple-300 shadow-lg">
      {/* Boss Name and Image */}
      <div className="text-center mb-6">
        {imageSrc ? (
          <div className="relative mx-auto mb-4 w-full max-w-[280px] sm:max-w-[320px] aspect-square">
            <Image
              src={imageSrc}
              alt={imageAlt ?? `${name} boss monster`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 208px, 240px"
              loading="eager"
              priority
            />
          </div>
        ) : (
          <div className="text-7xl mb-2">{emoji}</div>
        )}
        <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
        {description ? (
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">
            {description}
          </p>
        ) : null}
      </div>

      {/* Health Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-700">Health</span>
          <span className="text-sm font-bold text-gray-700">
            {currentHealth} / {maxHealth}
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden border-2 border-gray-400">
          <div
            className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Reward Info */}
      <div className="bg-white bg-opacity-70 rounded-2xl p-4 border-2 border-purple-200">
        <div className="text-center">
          <div className="text-xs font-bold text-gray-600 uppercase mb-1">
            Family Reward
          </div>
          <div className="text-2xl">{reward.emoji}</div>
          <div className="text-sm font-bold text-gray-800">{reward.name}</div>
          {reward.details && reward.details.length > 0 ? (
            <div className="mt-3 grid gap-2 text-sm font-semibold text-gray-700 sm:grid-cols-3">
              {reward.details.map((detail) => (
                <div key={detail} className="rounded-xl bg-white/80 px-3 py-2">
                  {detail}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
