'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RewardTemplate,
  currencyEmoji,
  currencyLabel,
  getRewardDelta,
} from '@/lib/reward-templates';

const buttonTone: Record<string, string> = {
  'stars-positive':
    'border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-300 hover:bg-amber-100',
  'hearts-positive':
    'border-pink-200 bg-pink-50 text-pink-950 hover:border-pink-300 hover:bg-pink-100',
  'screen-energy-positive':
    'border-blue-200 bg-blue-50 text-blue-950 hover:border-blue-300 hover:bg-blue-100',
  'stars-deduction':
    'border-rose-200 bg-rose-50 text-rose-950 hover:border-rose-300 hover:bg-rose-100',
  'hearts-deduction':
    'border-rose-200 bg-rose-50 text-rose-950 hover:border-rose-300 hover:bg-rose-100',
  'screen-energy-deduction':
    'border-rose-200 bg-rose-50 text-rose-950 hover:border-rose-300 hover:bg-rose-100',
};

export function PillButton({
  template,
  onReward,
}: {
  template: RewardTemplate;
  onReward: () => void;
}) {
  const [clicked, setClicked] = useState(false);
  const delta = getRewardDelta(template);
  const isDeduction = delta < 0;
  const toneKey = `${template.currencyType}-${template.rewardType}`;

  const handleClick = () => {
    setClicked(true);
    window.setTimeout(() => setClicked(false), 450);
    onReward();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.96 }}
      className={`group flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 active:scale-95 ${
        buttonTone[toneKey] ?? buttonTone['stars-positive']
      } ${clicked ? (isDeduction ? 'ring-2 ring-rose-300' : 'ring-2 ring-emerald-300') : ''}`}
      aria-label={`${isDeduction ? 'Deduct' : 'Add'} ${Math.abs(delta)} ${
        currencyLabel[template.currencyType]
      } for ${template.label}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xl shadow-sm">
        {template.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`mb-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black leading-none ${
            isDeduction ? 'bg-white text-rose-700' : 'bg-white text-slate-700'
          }`}
        >
          {currencyEmoji[template.currencyType]} {delta > 0 ? '+' : '-'}
          {Math.abs(delta)}
        </span>
        <span className="block truncate text-sm font-extrabold leading-tight text-slate-900">
          {template.label}
        </span>
        <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {isDeduction ? 'Deducts' : 'Adds'} {currencyLabel[template.currencyType]}
        </span>
      </span>
    </motion.button>
  );
}
