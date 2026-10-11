'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PetSprite } from '@/components/child/PetSprite';
import { Hills, PALETTES, Sky, type DayPhase } from '@/components/child/Scenery';
import { PetActionOverlay, type PetReaction } from '@/components/pets/PetActionOverlay';
import type { PetMood } from '@/lib/pet-mood';
import type { PetType } from '@/lib/pet-skins';

const MOOD_CHIP: Record<PetMood, { label: string; tone: string }> = {
  happy: { label: 'Happy', tone: 'bg-honey-100 text-honey-700' },
  neutral: { label: 'Calm', tone: 'bg-plum-100 text-plum-700' },
  sad: { label: 'Needs love', tone: 'bg-sky-100 text-sky-700' },
  sleep: { label: 'Sleeping', tone: 'bg-plum-900/70 text-white' },
};

function Flower({ x, color, delay = 0 }: { x: string; color: string; delay?: number }) {
  return (
    <svg
      className="absolute bottom-[13%] w-5 animate-float-slow sm:w-6"
      style={{ left: x, animationDelay: `${delay}s` }}
      viewBox="0 0 24 36"
      aria-hidden="true"
    >
      <path d="M12 34V16" stroke="#5b9a6e" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 26c-4-1-6-4-6-6 3 0 5 2 6 6z" fill="#7cc48e" />
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="12" cy="7" rx="3.4" ry="5" fill={color} transform={`rotate(${r} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3" fill="#ffd25e" />
    </svg>
  );
}

function MoodHearts({ value }: { value: number }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * 5);
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span key={i} initial={false} animate={{ scale: i < filled ? 1 : 0.82, opacity: i < filled ? 1 : 0.35 }}>
          <Icon name="heart" size={20} className={i < filled ? '' : 'grayscale'} />
        </motion.span>
      ))}
    </div>
  );
}

export function Habitat({
  phase,
  pet,
  petName,
  skinId,
  mood,
  moodPercent,
  statusLine,
  reaction,
  reactionAnimation,
  hasPoop,
  onPoopTap,
  overlay,
  petVisible = true,
}: {
  phase: DayPhase;
  pet: PetType;
  petName: string;
  skinId: string | null;
  mood: PetMood;
  moodPercent: number;
  statusLine: string;
  reaction: PetReaction | null;
  reactionAnimation: TargetAndTransition;
  hasPoop: boolean;
  onPoopTap: () => void;
  overlay?: ReactNode;
  /** Hidden until the first cached/live snapshot so the default pet never flashes. */
  petVisible?: boolean;
}) {
  const palette = PALETTES[phase];
  const night = phase === 'night';
  const chip = MOOD_CHIP[skinId ? (mood === 'sleep' ? 'sleep' : 'happy') : mood];
  const bubble = reaction?.message ?? statusLine;

  return (
    <section
      aria-label={`${petName}'s home`}
      className="relative isolate h-[clamp(330px,52dvh,440px)] short:h-[calc(100dvh-112px)] short:min-h-[230px] overflow-hidden rounded-[2rem] border-[3px] border-white shadow-pop sm:h-[440px] lg:h-[min(560px,62dvh)]"
    >
      <Sky variant={phase} className="absolute inset-0" />
      {night ? (
        <div className="absolute right-[12%] top-[10%] animate-float-slow">
          <Icon name="moon" size={46} />
        </div>
      ) : (
        <div className="absolute right-[10%] top-[8%] opacity-90">
          <Icon name="sun" size={44} />
        </div>
      )}
      <Hills palette={palette} className="absolute inset-x-0 bottom-0 h-[38%] w-full" />
      {/* Cozy rug the pet sits on */}
      <div
        className="absolute bottom-[9%] left-1/2 h-[13%] w-[62%] -translate-x-1/2 rounded-[50%]"
        style={{
          background: night
            ? 'radial-gradient(ellipse at center, #8a7bd0 0%, #6a5bb0 60%, #5a4b9e 100%)'
            : 'radial-gradient(ellipse at center, #fff6e8 0%, #ffd9c2 55%, #ffc3a0 100%)',
          boxShadow: 'inset 0 -6px 0 rgb(58 42 77 / 0.12)',
        }}
        aria-hidden="true"
      />
      {!night ? (
        <>
          <Flower x="7%" color="#ff8fae" />
          <Flower x="16%" color="#bea3fb" delay={1.2} />
          <Flower x="83%" color="#7ec6fb" delay={0.6} />
        </>
      ) : null}

      {/* Name plate + mood */}
      <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
        <h1 className={`rounded-2xl bg-white/85 px-3 py-1 font-display text-2xl font-semibold leading-tight text-ink shadow-soft backdrop-blur sm:text-3xl`}>
          {petVisible ? petName : ' '}
        </h1>
        <div className="flex items-center gap-2 rounded-full bg-white/85 py-1 pl-2.5 pr-3 shadow-soft backdrop-blur">
          <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${chip.tone}`}>{chip.label}</span>
          <MoodHearts value={moodPercent} />
          <span className="sr-only">Mood {moodPercent} percent</span>
        </div>
      </div>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={reaction ? `r-${reaction.id}` : `s-${bubble}`}
          className={`absolute left-1/2 top-[22%] z-20 max-w-[78%] -translate-x-1/2 rounded-2xl px-3.5 py-2 text-center font-display text-base font-semibold shadow-soft sm:top-[20%] sm:text-lg short:left-auto short:right-3 short:top-3 short:max-w-[48%] short:translate-x-0 ${
            reaction?.blocked ? 'bg-white/90 text-ink-soft' : 'bg-white text-ink'
          }`}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          aria-live="polite"
        >
          {bubble}
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-inherit" aria-hidden="true" />
        </motion.div>
      </AnimatePresence>

      {/* The pet */}
      <motion.div
        className="absolute bottom-[10%] left-1/2 z-10 h-[52%] w-[68%] max-w-[360px] -translate-x-1/2"
        animate={reactionAnimation}
        transition={{ duration: reaction?.blocked ? 0.35 : 0.65, ease: 'easeOut' }}
      >
        {petVisible ? (
          <PetSprite pet={pet} mood={mood} skinId={skinId} petName={petName} sizes="(min-width: 1024px) 420px, 70vw" eager className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center text-white/80">
            <Icon name="paw" size={64} className="animate-pulse" />
          </div>
        )}
        <AnimatePresence>
          {reaction && !reaction.blocked ? <PetActionOverlay key={`overlay-${reaction.id}`} reaction={reaction} /> : null}
        </AnimatePresence>
      </motion.div>

      {hasPoop ? (
        <motion.button
          type="button"
          onClick={onPoopTap}
          className="absolute bottom-[11%] right-[3%] z-20 grid h-12 w-12 place-items-center rounded-full bg-white/70 shadow-soft"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -6, 6, 0] }}
          transition={{ rotate: { duration: 1.6, repeat: Infinity, repeatDelay: 1.4 } }}
          aria-label="Poop to clean — tap to clean"
        >
          <Icon name="poop" size={36} />
        </motion.button>
      ) : null}
      {overlay}
    </section>
  );
}
