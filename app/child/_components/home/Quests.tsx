'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui/Icon';
import { EggArt } from '@/components/child/EggArt';
import { PetSprite } from '@/components/child/PetSprite';
import type { DailyMission, SecretEggState } from '@/lib/mission-state';
import type { BossBattleState } from '@/lib/boss-battle';
import { PET_ROSTER } from '@/lib/mock-data';

const CATEGORY_ICON: Record<string, IconName> = {
  reading: 'book',
  learning: 'book',
  chores: 'broom',
  'self-care': 'smile',
  calm: 'cloud',
  kindness: 'heart',
  family: 'home',
};

export function QuestBoard({
  missions,
  completed,
  loaded,
  justVerified,
}: {
  missions: DailyMission[];
  completed: Record<string, boolean>;
  loaded: boolean;
  justVerified: string | null;
}) {
  const doneCount = missions.filter((m) => completed[m.id]).length;
  const allDone = missions.length > 0 && doneCount === missions.length;

  return (
    <section className="surface p-4 sm:p-5" aria-labelledby="quests-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="quests-title" className="font-display text-2xl font-semibold text-ink">
          Today&apos;s quests
        </h2>
        {missions.length > 0 ? (
          <div className="flex items-center gap-0.5" aria-label={`${doneCount} of ${missions.length} done`}>
            {missions.map((m, i) => (
              <motion.span key={m.id} initial={false} animate={{ scale: i < doneCount ? 1 : 0.8, opacity: i < doneCount ? 1 : 0.3 }}>
                <Icon name="star" size={26} className={i < doneCount ? '' : 'grayscale'} />
              </motion.span>
            ))}
          </div>
        ) : null}
      </div>

      {!loaded ? (
        <div className="mt-4 grid gap-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-plum-50/80 p-4">
          <Icon name="sparkle" size={44} className="shrink-0" />
          <p className="text-base font-bold text-ink-soft">
            Your quests are on the way! Ask a grown-up to pick today&apos;s quests.
          </p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-2.5">
          {missions.map((mission) => {
            const done = Boolean(completed[mission.id]);
            const reward = mission.starReward ?? mission.reward;
            return (
              <motion.li
                key={mission.id}
                layout
                className={`relative flex min-h-16 items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 ring-1 ${
                  done ? 'bg-mint-50 ring-mint-200' : 'bg-white/85 ring-white'
                }`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${done ? 'bg-white' : 'bg-cream'}`}>
                  <Icon name={CATEGORY_ICON[mission.category ?? ''] ?? 'sparkle'} size={30} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-display text-[17px] font-semibold leading-tight ${done ? 'text-mint-700' : 'text-ink'}`}>
                    {mission.title}
                  </span>
                  <span className="block truncate text-xs font-bold text-ink-faint">
                    {done ? 'Checked by a grown-up!' : mission.description}
                  </span>
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.span
                      key="done"
                      className="flex shrink-0 items-center gap-1"
                      initial={justVerified === mission.id ? { scale: 2.2, rotate: -25, opacity: 0 } : false}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                    >
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-mint-600">+{reward}</span>
                      <Icon name="check" size={32} />
                    </motion.span>
                  ) : (
                    <motion.span key="todo" className="flex shrink-0 items-center gap-0.5 rounded-full bg-honey-50 py-0.5 pl-1 pr-2 ring-1 ring-honey-200">
                      <Icon name="star" size={20} />
                      <span className="font-display text-sm font-semibold text-honey-700">{reward}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}

      {missions.length > 0 ? (
        <p className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold ${allDone ? 'bg-honey-50 text-honey-700' : 'bg-white/60 text-ink-soft'}`}>
          <Icon name={allDone ? 'trophy' : 'lock'} size={22} className="shrink-0" />
          {allDone ? 'All quests done today — amazing!' : 'Finished one? Ask a grown-up to check it.'}
        </p>
      ) : null}
    </section>
  );
}

export function EggCard({ egg }: { egg: SecretEggState }) {
  return (
    <section className="surface flex items-center gap-4 p-4" aria-label="Secret Egg">
      <EggArt progress={egg.progress} required={egg.requiredGoals} size={74} />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-semibold text-ink">Secret Egg</h2>
        <p className="text-sm font-bold text-ink-soft">
          {egg.requiredGoals - egg.progress <= 1
            ? 'One more checked quest to hatch!'
            : `${egg.requiredGoals - egg.progress} more checked quests to hatch`}
        </p>
        <div className="mt-2 flex gap-1" aria-label={`${egg.progress} of ${egg.requiredGoals}`}>
          {Array.from({ length: egg.requiredGoals }, (_, i) => (
            <span key={i} className={`h-2.5 flex-1 rounded-full ${i < egg.progress ? 'bg-gradient-to-r from-plum-300 to-berry-300' : 'bg-ink/10'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HatchedCard({ petId, childId, onDismiss }: { petId: string; childId: string; onDismiss: () => void }) {
  const pet = PET_ROSTER.find((p) => p.id === petId);
  if (!pet) return null;
  return (
    <motion.section
      className="surface relative overflow-hidden p-4"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      aria-label="Your egg hatched"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-honey-100/70 via-white/0 to-berry-100/70" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <PetSprite pet={pet.id} mood="happy" className="h-24 w-24 shrink-0" sizes="96px" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-berry-500">Your egg hatched!</p>
          <h2 className="font-display text-2xl font-semibold text-ink">Meet {pet.name}!</h2>
          <div className="mt-2 flex gap-2">
            <Link href={`/child/${childId}/shop#pets`} className="btn-chunky btn-berry min-h-11 px-4 text-base">
              Say hello
            </Link>
            <button type="button" onClick={onDismiss} className="min-h-11 px-2 text-sm font-extrabold text-ink-soft">
              Later
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function AdventureCards({ childId, boss, hearts }: { childId: string; boss: BossBattleState | null; hearts: number }) {
  const hp = boss && boss.maxHp > 0 ? Math.round((boss.currentHp / boss.maxHp) * 100) : 100;
  const canPlay = hearts >= 2;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href={`/child/${childId}/family`} className="surface group relative flex flex-col overflow-hidden p-3 transition active:scale-[0.98]">
        <div className="absolute inset-0 bg-gradient-to-b from-plum-200/60 to-white/0" aria-hidden="true" />
        <div className="relative flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">Family Boss</span>
          <Icon name="chevron-right" size={18} className="text-ink-faint" />
        </div>
        <div className="relative mx-auto my-1 h-20 w-28">
          {boss ? (
            <Image
              src={boss.bossImage}
              alt={boss.bossName}
              fill
              sizes="160px"
              className={`object-contain transition group-hover:scale-105 ${boss.isDefeated ? 'grayscale' : ''}`}
            />
          ) : null}
        </div>
        <p className="relative truncate text-xs font-extrabold text-ink-soft">
          {boss ? (boss.isDefeated ? 'Defeated — hooray!' : boss.bossName) : 'Loading…'}
        </p>
        <div className="relative mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-gradient-to-r from-berry-400 to-honey-300" style={{ width: `${hp}%` }} />
        </div>
      </Link>

      <Link
        href={`/child/${childId}/play`}
        className="surface group relative flex flex-col overflow-hidden p-3 transition active:scale-[0.98]"
        aria-label="Play Room: Adventure Run and Pet Catch"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-mint-200/60 to-white/0" aria-hidden="true" />
        <div className="relative flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">Play Room</span>
          <Icon name="chevron-right" size={18} className="text-ink-faint" />
        </div>
        <div className="relative my-1 flex h-20 items-center justify-center gap-2">
          <Icon name="run" size={52} className="transition group-hover:-rotate-6" />
          <Icon name="play" size={52} className="transition group-hover:rotate-6" />
        </div>
        <p className={`relative flex items-center gap-1 text-xs font-extrabold ${canPlay ? 'text-mint-700' : 'text-ink-faint'}`}>
          <Icon name="heart" size={16} /> {canPlay ? '2 games · 2 hearts each' : 'Need 2 hearts'}
        </p>
      </Link>
    </div>
  );
}
