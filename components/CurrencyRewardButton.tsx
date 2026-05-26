'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RewardTemplate,
  currencyEmoji,
  getRewardDelta,
} from '@/lib/reward-templates';

interface CurrencyRewardButtonProps {
  template: RewardTemplate;
  onReward: () => void;
}

export function CurrencyRewardButton({
  template,
  onReward,
}: CurrencyRewardButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const delta = getRewardDelta(template);

  const handleClick = () => {
    setIsAnimating(true);
    onReward();
    setTimeout(() => setIsAnimating(false), 600);
  };

  const colorSchemes = {
    stars: {
      positive:
        'bg-gradient-to-br from-yellow-200 to-amber-300 text-yellow-950 border-yellow-300',
      deduction:
        'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-950 border-orange-300',
    },
    hearts: {
      positive:
        'bg-gradient-to-br from-rose-100 to-pink-200 text-rose-950 border-rose-300',
      deduction:
        'bg-gradient-to-br from-red-100 to-red-200 text-red-950 border-red-300',
    },
    'screen-energy': {
      positive:
        'bg-gradient-to-br from-sky-100 to-blue-200 text-blue-950 border-blue-300',
      deduction:
        'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-950 border-indigo-300',
    },
  };

  const colorClass = colorSchemes[template.currencyType][template.rewardType];

  return (
    <motion.button
      onClick={handleClick}
      className={`${colorClass} min-h-24 rounded-2xl border-2 px-3 py-3 text-sm shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-1`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative flex h-7 items-center justify-center">
        {isAnimating && (
          <motion.div
            animate={{ scale: [1, 1.5, 0], opacity: [1, 0.5, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute text-xl"
          >
            {currencyEmoji[template.currencyType]}
          </motion.div>
        )}
        <div className="text-2xl">{template.icon}</div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-base font-extrabold">
          {delta > 0 ? '+' : '-'}
          {Math.abs(delta)} {currencyEmoji[template.currencyType]}
        </div>
        <div className="text-xs font-bold opacity-90">{template.label}</div>
      </div>
    </motion.button>
  );
}
