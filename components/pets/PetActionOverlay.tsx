'use client';

import { motion } from 'framer-motion';
import type { CareActionType } from '@/lib/mission-state';

export type PetReaction = {
  id: number;
  type: CareActionType;
  blocked: boolean;
  message: string;
  stat?: string;
};

type PetActionOverlayProps = {
  reaction: PetReaction | null;
};

function FeedOverlay() {
  const sparkles = [
    { left: '47%', top: '42%', delay: 0.42 },
    { left: '56%', top: '38%', delay: 0.48 },
    { left: '51%', top: '50%', delay: 0.54 },
    { left: '61%', top: '47%', delay: 0.58 },
  ];

  return (
    <>
      <motion.span
        className="absolute left-[27%] top-[67%] text-4xl drop-shadow-lg"
        initial={{ opacity: 0, x: -40, y: 30, scale: 0.7, rotate: -10 }}
        animate={{
          opacity: [0, 1, 1, 0],
          x: [0, 42, 62, 70],
          y: [0, -34, -58, -62],
          scale: [0.7, 1.05, 0.95, 0.85],
          rotate: [-10, 8, -2, 0],
        }}
        transition={{ duration: 0.82, ease: 'easeOut' }}
      >
        &#127850;
      </motion.span>

      {sparkles.map((sparkle, index) => (
        <motion.span
          key={index}
          className="absolute h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
          style={{ left: sparkle.left, top: sparkle.top }}
          initial={{ opacity: 0, scale: 0.25 }}
          animate={{ opacity: [0, 1, 0], scale: [0.25, 1.35, 0.7], y: [0, -10, -18] }}
          transition={{ duration: 0.48, delay: sparkle.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function PatOverlay() {
  const hearts = [
    { left: '33%', top: '32%', delay: 0.2 },
    { left: '63%', top: '30%', delay: 0.28 },
    { left: '43%', top: '22%', delay: 0.36 },
    { left: '57%', top: '21%', delay: 0.44 },
  ];

  return (
    <>
      <motion.span
        className="absolute left-1/2 top-[13%] -translate-x-1/2 text-5xl drop-shadow-lg"
        initial={{ opacity: 0, y: -30, scale: 0.8, rotate: -8 }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          y: [-30, 8, -2, 10, -12],
          scale: [0.8, 1, 0.96, 1, 0.9],
          rotate: [-8, 2, -3, 2, 0],
        }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        &#128075;
      </motion.span>

      {hearts.map((heart, index) => (
        <motion.span
          key={index}
          className="absolute text-xl font-bold text-pink-400 drop-shadow"
          style={{ left: heart.left, top: heart.top }}
          initial={{ opacity: 0, y: 12, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], y: [12, -24, -46], scale: [0.6, 1.15, 0.9] }}
          transition={{ duration: 0.8, delay: heart.delay, ease: 'easeOut' }}
        >
          &hearts;
        </motion.span>
      ))}
    </>
  );
}

function CleanOverlay() {
  const bubbles = [
    { left: '25%', bottom: '24%', delay: 0.18 },
    { left: '42%', bottom: '22%', delay: 0.3 },
    { left: '58%', bottom: '25%', delay: 0.42 },
    { left: '72%', bottom: '21%', delay: 0.54 },
  ];

  return (
    <>
      <motion.span
        className="absolute bottom-[17%] left-[12%] text-5xl drop-shadow-lg"
        initial={{ opacity: 0, x: -30, y: 0, rotate: -8, scale: 0.9 }}
        animate={{
          opacity: [0, 1, 1, 0],
          x: [-30, 30, 82, 112],
          rotate: [-8, 6, -4, 0],
          scale: [0.9, 1, 1, 0.95],
        }}
        transition={{ duration: 0.92, ease: 'easeInOut' }}
      >
        &#129529;
      </motion.span>

      {bubbles.map((bubble, index) => (
        <motion.span
          key={index}
          className="absolute h-4 w-4 rounded-full border border-cyan-200 bg-cyan-100/70 shadow-sm"
          style={{ left: bubble.left, bottom: bubble.bottom }}
          initial={{ opacity: 0, y: 10, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], y: [10, -16, -34], scale: [0.4, 1.05, 0.75] }}
          transition={{ duration: 0.72, delay: bubble.delay, ease: 'easeOut' }}
        />
      ))}

      <motion.span
        className="absolute bottom-[31%] right-[24%] text-2xl text-cyan-300 drop-shadow"
        initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1.3, 0.8], rotate: [-20, 10, 0] }}
        transition={{ duration: 0.62, delay: 0.58, ease: 'easeOut' }}
      >
        &#10022;
      </motion.span>
    </>
  );
}

export function PetActionOverlay({ reaction }: PetActionOverlayProps) {
  if (!reaction || reaction.blocked) {
    return null;
  }

  return (
    <motion.div
      key={reaction.id}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[40px]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {reaction.type === 'feed' ? <FeedOverlay /> : null}
      {reaction.type === 'pat' ? <PatOverlay /> : null}
      {reaction.type === 'clean' ? <CleanOverlay /> : null}
    </motion.div>
  );
}
