'use client';

import React from 'react';
import { motion, type TargetAndTransition } from 'framer-motion';

interface PetDisplayProps {
  name: string;
  emoji: string;
  mood: string;
  interactive?: boolean;
}

export function PetDisplay({
  name,
  emoji,
  mood,
  interactive = false,
}: PetDisplayProps) {
  const moodEmojis = {
    happy: '😊',
    sleepy: '😴',
    excited: '🤩',
    calm: '😌',
    'low-energy': '😔',
  };

  const bounceAnimation: TargetAndTransition = {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  const clickAnimation: TargetAndTransition = {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
    },
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 ${
        interactive ? 'cursor-pointer' : ''
      }`}
      animate={interactive ? bounceAnimation : { y: 0 }}
      whileTap={interactive ? clickAnimation : undefined}
    >
      <motion.div className="mb-4 text-8xl">{emoji}</motion.div>
      <div className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-600">
        {name}
      </div>
      <div className="text-2xl">
        {moodEmojis[mood as keyof typeof moodEmojis] || '😊'}
      </div>
    </motion.div>
  );
}
