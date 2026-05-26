'use client';

import React from 'react';
import { Child, Pet } from '@/lib/mock-data';
import { StatCard } from './StatCard';

interface ChildCardProps {
  child: Child;
  pet: Pet;
}

export function ChildCard({ child, pet }: ChildCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl">{pet.emoji}</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800">{child.name}</h3>
          <p className="text-sm text-gray-600">{pet.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Stars" value={child.stars} icon="⭐" color="yellow" />
        <StatCard label="Hearts" value={child.hearts} icon="❤️" color="pink" />
        <StatCard label="Weekend Screen" value={child.screenEnergy} icon="SE" color="blue" />
        <StatCard label="Mood" value={pet.mood} icon="😊" color="purple" />
      </div>

      {/* Streak Info */}
      <div className="mt-4 bg-white bg-opacity-60 rounded-2xl p-3 border border-purple-200">
        <div className="text-xs font-bold text-gray-600 uppercase mb-1">Current Streak</div>
        <div className="text-lg">🔥 7 days strong!</div>
      </div>
    </div>
  );
}
