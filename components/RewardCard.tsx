'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Reward } from '@/lib/mock-data';

interface RewardCardProps {
  reward: Reward;
  onPurchase: (reward: Reward) => void;
  hasEnoughStars: boolean;
}

export function RewardCard({
  reward,
  onPurchase,
  hasEnoughStars,
}: RewardCardProps) {
  return (
    <motion.button
      className="w-full cursor-pointer rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-4 text-left shadow-md transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55"
      whileHover={hasEnoughStars ? { scale: 1.02 } : undefined}
      whileTap={hasEnoughStars ? { scale: 0.95 } : undefined}
      onClick={() => hasEnoughStars && onPurchase(reward)}
      disabled={!hasEnoughStars}
    >
      <div className="text-center">
        <div className="mb-2 text-4xl">{reward.icon}</div>
        <h3 className="mb-2 text-sm font-bold text-gray-800">{reward.name}</h3>
        <div
          className={`mx-auto flex w-fit items-center justify-center gap-1 rounded-full px-3 py-1 ${
            hasEnoughStars
              ? 'bg-yellow-200 text-yellow-900'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          <span>⭐</span>
          <span className="text-sm font-bold">{reward.cost}</span>
        </div>
      </div>
    </motion.button>
  );
}
