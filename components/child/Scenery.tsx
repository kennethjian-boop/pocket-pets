'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type SceneVariant = DayPhase | 'golden' | 'storm' | 'meadow';

/** Matches the pet sleep window in lib/pet-mood.ts (9pm–6am is night). */
export function getDayPhase(hour: number): DayPhase {
  if (hour >= 21 || hour < 6) return 'night';
  if (hour < 9) return 'dawn';
  if (hour < 17) return 'day';
  return 'dusk';
}

export function useDayPhase() {
  const [phase, setPhase] = useState<DayPhase>('day');
  useEffect(() => {
    const update = () => setPhase(getDayPhase(new Date().getHours()));
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return phase;
}

type Palette = {
  sky: [string, string, string];
  hillBack: string;
  hillFront: string;
  glow: string;
  cloud: string;
  stars: boolean;
};

export const PALETTES: Record<SceneVariant, Palette> = {
  dawn: { sky: ['#ffd9c4', '#ffe9dc', '#fff4e6'], hillBack: '#cfe8c4', hillFront: '#b4dcb0', glow: '#fff1c9', cloud: '#ffffff', stars: false },
  day: { sky: ['#bfe2ff', '#e6e2ff', '#fff3e4'], hillBack: '#c6ead0', hillFront: '#a7dcb6', glow: '#ffffff', cloud: '#ffffff', stars: false },
  dusk: { sky: ['#b7a2ee', '#f2b9cc', '#ffdcbc'], hillBack: '#a8c9b8', hillFront: '#8fb9a6', glow: '#ffd7b0', cloud: '#fde3ef', stars: false },
  night: { sky: ['#241a52', '#41337f', '#6f5fae'], hillBack: '#3c4a7c', hillFront: '#2f3c69', glow: '#9c8cff', cloud: '#7d70b8', stars: true },
  golden: { sky: ['#ffe3a8', '#ffd9c9', '#fff4e4'], hillBack: '#f6d7a8', hillFront: '#f0c58e', glow: '#fff6d8', cloud: '#ffffff', stars: false },
  storm: { sky: ['#3b2d6e', '#7b62b5', '#e9b9d3'], hillBack: '#5b4a8c', hillFront: '#46397a', glow: '#d6b8ff', cloud: '#a796d6', stars: true },
  meadow: { sky: ['#c4e8ff', '#e8f4ff', '#fff7e8'], hillBack: '#c6ead0', hillFront: '#9fd9ae', glow: '#ffffff', cloud: '#ffffff', stars: false },
};

const STAR_POINTS = [
  [8, 12, 1.4], [18, 6, 1], [27, 18, 1.2], [38, 9, 1.6], [47, 16, 1], [58, 7, 1.3],
  [66, 19, 1.1], [74, 10, 1.5], [83, 15, 1], [92, 7, 1.4], [13, 26, 1], [52, 27, 1.1], [88, 28, 1.2],
];

export function Hills({ palette, className = '' }: { palette: Palette; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 58 C 60 30, 120 30, 190 52 S 320 34, 400 48 L400 120 L0 120 Z" fill={palette.hillBack} />
      <path d="M0 82 C 80 58, 150 66, 220 80 S 340 66, 400 74 L400 120 L0 120 Z" fill={palette.hillFront} />
    </svg>
  );
}

function Cloud({ className = '', color, style }: { className?: string; color: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 50" aria-hidden="true">
      <path
        d="M20 42 C 6 42 4 26 18 24 C 18 12 34 6 44 14 C 50 4 70 2 78 14 C 92 8 108 16 104 28 C 116 30 116 42 104 42 Z"
        fill={color}
        opacity="0.9"
      />
    </svg>
  );
}

export function Sky({ variant, children, className = '', clouds = true }: { variant: SceneVariant; children?: ReactNode; className?: string; clouds?: boolean }) {
  const p = PALETTES[variant];
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ background: `linear-gradient(180deg, ${p.sky[0]} 0%, ${p.sky[1]} 55%, ${p.sky[2]} 100%)` }}
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: p.glow }}
      />
      {p.stars ? (
        <div className="pointer-events-none absolute inset-0">
          {STAR_POINTS.map(([x, y, s], i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{ left: `${x}%`, top: `${y}%`, width: s * 3, height: s * 3, animationDelay: `${i * 0.37}s` }}
            />
          ))}
        </div>
      ) : clouds ? (
        <div className="pointer-events-none absolute inset-x-0 top-[6%] h-24">
          <Cloud className="absolute w-28 animate-drift" color={p.cloud} style={{ animationDelay: '-8s' }} />
          <Cloud className="absolute top-10 w-20 animate-drift" color={p.cloud} style={{ animationDelay: '-24s', animationDuration: '52s' }} />
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Fixed full-page backdrop that sits behind the shell. */
export function SceneBackdrop({ variant }: { variant: SceneVariant }) {
  const p = PALETTES[variant];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <Sky variant={variant} className="absolute inset-0" clouds={false} />
      <Hills palette={p} className="absolute inset-x-0 bottom-0 h-[26vh] w-full opacity-70" />
    </div>
  );
}
