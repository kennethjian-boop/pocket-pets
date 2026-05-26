'use client';

import React from 'react';

interface BossCardProps {
  name: string;
  emoji: string;
  currentHealth: number;
  maxHealth: number;
  reward: { name: string; emoji: string };
}

export function BossCard({
  name,
  emoji,
  currentHealth,
  maxHealth,
  reward,
}: BossCardProps) {
  const healthPercentage = (currentHealth / maxHealth) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl p-6 border-3 border-purple-300 shadow-lg">
      {/* Boss Name and Emoji */}
      <div className="text-center mb-6">
        <div className="text-7xl mb-2">{emoji}</div>
        <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
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
        </div>
      </div>
    </div>
  );
}
