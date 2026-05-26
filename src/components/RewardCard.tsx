'use client';

import React from 'react';
import { Reward } from '@/lib/mock-data';
import { motion } from 'framer-motion';

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
    <motion.div
      className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onPurchase(reward)}
    >
      <div className="text-center">
        <div className="text-4xl mb-2">{reward.icon}</div>
        <h3 className="text-sm font-bold text-gray-800 mb-2">{reward.name}</h3>
        <div
          className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full ${
            hasEnoughStars
              ? 'bg-yellow-200 text-yellow-900'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          <span>⭐</span>
          <span className="font-bold text-sm">{reward.cost}</span>
        </div>
      </div>
    </motion.div>
  );
}
