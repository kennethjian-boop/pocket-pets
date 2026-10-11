'use client';

import { motion } from 'framer-motion';

/**
 * Secret Egg illustration. Cracks appear as parent-verified quests add progress,
 * and it wobbles when it is close to hatching.
 */
export function EggArt({
  progress,
  required,
  size = 96,
  glow = true,
  className = '',
}: {
  progress: number;
  required: number;
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  const ratio = required > 0 ? Math.min(1, Math.max(0, progress / required)) : 0;
  const stage = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
  const nearHatch = stage === 3;

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size * 1.12, transformOrigin: '50% 90%' }}
      animate={nearHatch ? { rotate: [0, -6, 6, -4, 4, 0] } : { rotate: [0, -2, 2, 0] }}
      transition={{ duration: nearHatch ? 1.2 : 3.4, repeat: Infinity, repeatDelay: nearHatch ? 0.8 : 1.6 }}
      aria-hidden="true"
    >
      {glow ? (
        <div
          className="absolute inset-[-14%] rounded-full blur-xl"
          style={{ background: `radial-gradient(circle, rgba(255,214,120,${0.25 + ratio * 0.45}), transparent 65%)` }}
        />
      ) : null}
      <svg viewBox="0 0 100 112" className="relative h-full w-full">
        <defs>
          <linearGradient id="egg-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffaf0" />
            <stop offset="100%" stopColor="#f7e3cf" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="106" rx="30" ry="5" fill="#3a2a4d" opacity="0.15" />
        <path
          d="M50 6C70 6 88 40 88 66c0 23-17 38-38 38S12 89 12 66C12 40 30 6 50 6z"
          fill="url(#egg-shell)"
          stroke="#3a2a4d"
          strokeWidth="3"
        />
        <circle cx="36" cy="48" r="7" fill="#d9c8ff" />
        <circle cx="64" cy="70" r="9" fill="#ffb8cb" />
        <circle cx="60" cy="34" r="4.5" fill="#b3defe" />
        <circle cx="34" cy="80" r="5" fill="#ffe08a" />
        <path d="M30 30c4-8 9-12 14-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
        {stage >= 1 ? <path d="M50 52l-6 8 7 5-5 9" fill="none" stroke="#3a2a4d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {stage >= 2 ? <path d="M70 46l-8 5 4 7-7 4" fill="none" stroke="#3a2a4d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {stage >= 3 ? <path d="M24 62l9 3-3 8 9 3" fill="none" stroke="#3a2a4d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
    </motion.div>
  );
}
