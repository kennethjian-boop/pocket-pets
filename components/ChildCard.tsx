'use client';

import React from 'react';
import { Child, Pet } from '@/lib/mock-data';
import { StatCard } from './StatCard';
import { formatWeekendScreenTime } from '@/lib/screen-energy';

interface ChildCardProps {
  child: Child;
  pet: Pet;
}

export function ChildCard({ child, pet }: ChildCardProps) {
  return (
    <div className="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-lg transition-shadow hover:shadow-xl">
      <div className="mb-4 flex items-center gap-4">
        <div className="text-5xl">{pet.emoji}</div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-2xl font-bold text-gray-800">
            {child.name}
          </h3>
          <p className="text-sm text-gray-600">{pet.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Stars" value={child.stars} icon="⭐" color="yellow" />
        <StatCard label="Hearts" value={child.hearts} icon="❤️" color="pink" />
        <StatCard
          label="Weekend Screen"
          value={child.screenEnergy}
          icon="🔋"
          color="blue"
        />
        <StatCard label="Mood" value={pet.mood} icon="😊" color="purple" />
      </div>

      <div className="mt-3 rounded-2xl border border-blue-200 bg-white/60 p-3 text-sm font-semibold text-blue-900">
        {formatWeekendScreenTime(child.screenEnergy)}
      </div>

      <div className="mt-4 rounded-2xl border border-purple-200 bg-white/60 p-3">
        <div className="mb-1 text-xs font-bold uppercase text-gray-600">
          Current Streak
        </div>
        <div className="text-lg">🔥 7 days strong!</div>
      </div>
    </div>
  );
}
