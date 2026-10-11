'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PetSprite } from '@/components/child/PetSprite';
import { GemArt, ObstacleArt, ParallaxLayer } from '@/components/child/RunArt';
import { Sky } from '@/components/child/Scenery';
import { CurrencyPill } from '@/components/child/CurrencyPill';
import { useChildState } from '@/app/child/_components/ChildStateProvider';
import { PET_ROSTER } from '@/lib/mock-data';
import type { PetType } from '@/lib/pet-skins';
import { RUN_HEART_COST, bestScoreKey } from '@/lib/adventure-run-rules';
import { PET_CATCH_HEART_COST } from '@/lib/pet-catch-rules';

function readNumber(key: string) {
  try {
    return Number(window.localStorage.getItem(key) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export default function PlayRoom() {
  const { child, state, hasSnapshot, settled } = useChildState();
  const pet = state.activePetId as PetType;
  const petName = PET_ROSTER.find((p) => p.id === pet)?.name ?? 'Your pet';
  const skinId = state.activeSkins[pet] ?? null;
  const [bests, setBests] = useState({ runEasy: 0, runChallenge: 0, catch: 0 });

  useEffect(() => {
    const t = window.setTimeout(
      () =>
        setBests({
          runEasy: readNumber(bestScoreKey(child.id, 'easy')),
          runChallenge: readNumber(bestScoreKey(child.id, 'challenge')),
          catch: readNumber(`pocket-pets-catch-best-${child.id}`),
        }),
      0
    );
    return () => window.clearTimeout(t);
  }, [child.id]);

  const games = [
    {
      href: `/child/${child.id}/adventure-run`,
      title: 'Adventure Run',
      blurb: `Run through the forest with ${petName}. Jump logs, grab gems!`,
      cost: RUN_HEART_COST,
      best: `Best: Easy ${bests.runEasy} · Challenge ${bests.runChallenge}`,
      art: (
        <>
          <Sky variant="day" className="absolute inset-0" clouds={false} />
          <ParallaxLayer layer="trees" offset={0} tile={260} className="bottom-[22%] top-[20%]" />
          <div className="absolute inset-x-0 bottom-0 h-[24%]">
            <ParallaxLayer layer="ground" offset={0} tile={240} className="inset-0" />
          </div>
          <div className="absolute bottom-[20%] right-[18%] h-[22%] w-[16%]"><ObstacleArt kind="log" /></div>
          <div className="absolute right-[22%] top-[22%] h-[18%] w-[11%] animate-float"><GemArt kind="gem" /></div>
          <div className="absolute right-[42%] top-[34%] h-[14%] w-[9%] animate-float" style={{ animationDelay: '-1.5s' }}><GemArt kind="rainbow" /></div>
          {hasSnapshot ? (
            <div className="absolute bottom-[22%] left-[14%] h-[58%] w-[34%] -rotate-6">
              <PetSprite pet={pet} mood="happy" skinId={skinId} petName={petName} sizes="200px" eager className="h-full w-full" />
            </div>
          ) : null}
        </>
      ),
    },
    {
      href: `/child/${child.id}/pet-catch`,
      title: 'Pet Catch',
      blurb: `Help ${petName} catch falling treats — and dodge the bombs!`,
      cost: PET_CATCH_HEART_COST,
      best: `Best: ${bests.catch}`,
      art: (
        <>
          <Sky variant="meadow" className="absolute inset-0" clouds={false} />
          <div className="absolute inset-x-0 bottom-0 h-[22%] bg-mint-200" />
          <div className="absolute left-[18%] top-[14%] animate-float"><Icon name="star" size={40} /></div>
          <div className="absolute right-[20%] top-[24%] animate-float" style={{ animationDelay: '-2s' }}><Icon name="heart" size={34} /></div>
          <div className="absolute left-[44%] top-[8%] h-[16%] w-[10%] animate-float" style={{ animationDelay: '-1s' }}><GemArt kind="gem" /></div>
          {hasSnapshot ? (
            <div className="absolute bottom-[10%] left-1/2 h-[56%] w-[34%] -translate-x-1/2">
              <PetSprite pet={pet} mood="happy" skinId={skinId} petName={petName} sizes="200px" eager className="h-full w-full" />
            </div>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-6 pt-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Play Room</h1>
          <p className="text-sm font-bold text-ink-soft">Each game costs 2 hearts. Games are just for fun.</p>
        </div>
        <CurrencyPill kind="heart" value={state.hearts} size="lg" placeholder={!hasSnapshot} quiet={!settled} />
      </div>

      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {games.map((game, i) => (
          <motion.li key={game.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link href={game.href} className="surface group flex h-full flex-col overflow-hidden transition active:scale-[0.98]" aria-label={`Play ${game.title}`}>
              <div className="relative aspect-[2/1] overflow-hidden md:aspect-[16/9]" aria-hidden="true">
                {game.art}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold text-ink">{game.title}</h2>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-berry-50 px-2.5 py-1 font-display text-sm font-semibold text-berry-700 ring-1 ring-berry-200">
                    {game.cost} <Icon name="heart" size={16} />
                  </span>
                </div>
                <p className="text-sm font-bold text-ink-soft">{game.blurb}</p>
                <p className="flex items-center gap-1 text-xs font-extrabold text-honey-700">
                  <Icon name="trophy" size={16} /> {game.best}
                </p>
                <span className="btn-chunky btn-mint mt-2 min-h-14 text-lg">
                  Play {game.title}
                </span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
      {hasSnapshot && state.hearts < 2 ? (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-ink-soft">
          <Icon name="heart" size={22} /> Hearts come from grown-up rewards and boss victories.
        </p>
      ) : null}
    </div>
  );
}
