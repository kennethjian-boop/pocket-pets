'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

export type CurrencyKind = 'star' | 'heart' | 'energy';

const META: Record<CurrencyKind, { label: (n: number) => string; ring: string; text: string }> = {
  star: { label: (n) => `${n} star${n === 1 ? '' : 's'}`, ring: 'ring-honey-200', text: 'text-honey-700' },
  heart: { label: (n) => `${n} heart${n === 1 ? '' : 's'}`, ring: 'ring-berry-200', text: 'text-berry-700' },
  energy: { label: (n) => `${n} Screen Energy (${n * 10} minutes)`, ring: 'ring-sky-200', text: 'text-sky-700' },
};

/** Compact balance chip that does a little hop whenever the value changes. */
export function CurrencyPill({
  kind,
  value,
  size = 'md',
  className = '',
  quiet = false,
  placeholder = false,
}: {
  kind: CurrencyKind;
  value: number;
  /** Update silently (e.g. while the first load reconciles cached and live values). */
  quiet?: boolean;
  /** Show a soft placeholder instead of a number before any data is available. */
  placeholder?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const meta = META[kind];
  const previous = useRef(value);
  const [bump, setBump] = useState(0);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (previous.current === value) return;
    const change = value - previous.current;
    previous.current = value;
    if (quiet) return;
    const t = window.setTimeout(() => {
      setDelta(change);
      setBump((b) => b + 1);
    }, 0);
    return () => window.clearTimeout(t);
  }, [value, quiet]);

  const dims =
    size === 'lg'
      ? 'h-12 gap-2 pl-1.5 pr-4 text-xl'
      : size === 'sm'
        ? 'h-8 gap-1 pl-1 pr-2.5 text-sm'
        : 'h-10 gap-1.5 pl-1 pr-3 text-base';
  const icon = size === 'lg' ? 34 : size === 'sm' ? 22 : 28;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center rounded-full bg-white/90 font-display font-semibold tabular-nums shadow-[0_2px_0_rgb(58_42_77/0.08)] ring-1 ${meta.ring} ${dims} ${className}`}
    >
      <span className="sr-only">{meta.label(value)}</span>
      <motion.span key={`i-${bump}`} initial={bump ? { scale: 1.35, rotate: -12 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}>
        <Icon name={kind} size={icon} />
      </motion.span>
      <motion.span key={`v-${bump}`} aria-hidden="true" className={meta.text} initial={bump ? { y: -6, opacity: 0.4 } : false} animate={{ y: 0, opacity: 1 }}>
        {placeholder ? <span className="inline-block h-3 w-6 animate-pulse rounded-full bg-ink/10 align-middle" /> : value}
      </motion.span>
      {bump > 0 && delta !== 0 ? (
        <motion.span
          key={`d-${bump}`}
          className={`pointer-events-none absolute -top-3 right-0 rounded-full px-1.5 text-xs font-bold ${delta > 0 ? 'bg-mint-400 text-white' : 'bg-ink/70 text-white'}`}
          initial={{ y: 4, opacity: 0 }}
          animate={{ y: -8, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, times: [0, 0.15, 0.75, 1] }}
          aria-hidden="true"
        >
          {delta > 0 ? `+${delta}` : delta}
        </motion.span>
      ) : null}
    </span>
  );
}
