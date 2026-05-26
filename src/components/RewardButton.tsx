'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RewardButtonProps {
  label: string;
  value: number;
  onReward: () => void;
  variant?: 'positive' | 'negative';
  icon?: string;
}

export function RewardButton({
  label,
  value,
  onReward,
  variant = 'positive',
  icon = '⭐',
}: RewardButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onReward();
    setTimeout(() => setIsAnimating(false), 600);
  };

  const bgClass =
    variant === 'positive'
      ? 'bg-gradient-to-br from-emerald-300 to-emerald-400 hover:shadow-lg'
      : 'bg-gradient-to-br from-orange-300 to-orange-400 hover:shadow-lg';

  const textColor = variant === 'positive' ? 'text-emerald-900' : 'text-orange-900';

  return (
    <motion.button
      onClick={handleClick}
      className={`${bgClass} rounded-2xl px-4 py-3 font-bold text-sm ${textColor} shadow-md transition-all active:scale-95`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center justify-center gap-2">
        {isAnimating && (
          <motion.div
            animate={{ scale: [1, 1.5, 0], opacity: [1, 0.5, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute text-lg"
          >
            {icon}
          </motion.div>
        )}
        <div className="text-lg">{icon}</div>
        <div>
          {label} <span className="font-bold">{value > 0 ? '+' : ''}{value}</span>
        </div>
      </div>
    </motion.button>
  );
}
