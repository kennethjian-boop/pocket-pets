'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PetSprite } from '@/components/child/PetSprite';
import { Hills, PALETTES, Sky, useDayPhase } from '@/components/child/Scenery';
import { PinPad } from '@/components/PinPad';
import { PET_ROSTER, mockChildren, type Child } from '@/lib/mock-data';
import { mergeWithDefaultChildState, readChildDashboardState } from '@/lib/mission-state';
import { fetchChildState } from '@/lib/supabase-child-state';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import type { PetType } from '@/lib/pet-skins';

const PARENT_PIN_SESSION_KEY = 'pocket-pets-parent-pin-unlocked';

type PlayerView = { pet: PetType; skinId: string | null; stars: number; source: 'cache' | 'live' };

const PLAYER_STYLE: Record<string, { card: string; banner: string; glow: string }> = {
  'child-ansel': {
    card: 'from-sky-100 via-white to-honey-100',
    banner: 'btn-sky',
    glow: '#7ec6fb',
  },
  'child-thea': {
    card: 'from-berry-100 via-white to-plum-100',
    banner: 'btn-berry',
    glow: '#ff8fae',
  },
};

function readCachedPlayer(child: Child): PlayerView | null {
  const stored = readChildDashboardState(child.id);
  if (!stored) return null;
  const state = mergeWithDefaultChildState(child, stored);
  const pet = state.activePetId as PetType;
  return { pet, skinId: state.activeSkins[pet], stars: state.stars, source: 'cache' };
}

function usePlayers() {
  const [players, setPlayers] = useState<Record<string, PlayerView | null>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setPlayers(Object.fromEntries(mockChildren.map((c) => [c.id, readCachedPlayer(c)])));
      // Read-only fetch: the landing page never writes child state.
      const live = await Promise.all(mockChildren.map((c) => fetchChildState(c)));
      if (cancelled) return;
      setPlayers((current) => {
        const next = { ...current };
        live.forEach((remote, i) => {
          const child = mockChildren[i];
          if (remote) {
            next[child.id] = {
              pet: remote.equippedPet,
              skinId: remote.equippedSkinByPet[remote.equippedPet] ?? null,
              stars: remote.stars,
              source: 'live',
            };
          } else if (!next[child.id]) {
            const fallback = mergeWithDefaultChildState(child, null);
            next[child.id] = { pet: fallback.activePetId as PetType, skinId: null, stars: fallback.stars, source: 'cache' };
          }
        });
        return next;
      });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return { players, loaded };
}

function PlayerCard({ child, view, index }: { child: Child; view: PlayerView | null; index: number }) {
  const style = PLAYER_STYLE[child.id] ?? PLAYER_STYLE['child-ansel'];
  const petName = view ? PET_ROSTER.find((p) => p.id === view.pet)?.name : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.12, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <Link
        href={`/child/${child.id}`}
        className={`group relative flex h-full flex-col items-center overflow-hidden rounded-[2rem] border-[3px] border-white bg-gradient-to-b ${style.card} px-2 pb-3 pt-4 shadow-pop transition active:scale-[0.97] sm:px-4 sm:pb-5 sm:pt-6`}
        aria-label={`Play as ${child.name}${petName ? ` with ${petName}` : ''}`}
      >
        <div
          className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-2xl transition group-hover:opacity-80 sm:h-56 sm:w-56"
          style={{ background: style.glow }}
          aria-hidden="true"
        />
        <div className="relative h-[clamp(130px,30dvh,230px)] w-full">
          <div className="absolute inset-x-[14%] bottom-[4%] h-[14%] rounded-[50%] bg-white/80" aria-hidden="true" />
          {view ? (
            <PetSprite
              pet={view.pet}
              skinId={view.skinId}
              mood="happy"
              eager
              sizes="(min-width: 640px) 260px, 45vw"
              className="h-full w-full transition duration-300 group-hover:-translate-y-1 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-plum-300">
              <Icon name="paw" size={56} className="animate-pulse" />
            </div>
          )}
        </div>
        <h2 className="relative mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">{child.name}</h2>
        <p className="relative h-5 text-sm font-bold text-ink-soft">{petName ? `with ${petName}` : ' '}</p>
        <span className={`btn-chunky ${style.banner} relative mt-3 min-h-12 w-full max-w-[220px] px-3 text-lg sm:min-h-14 sm:text-xl`}>
          Let&apos;s go!
        </span>
      </Link>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const phase = useDayPhase();
  const { players } = usePlayers();
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const logOut = async () => {
    setBusy(true);
    if (hasSupabaseBrowserEnv()) await getSupabaseBrowserClient().auth.signOut();
    window.sessionStorage.removeItem(PARENT_PIN_SESSION_KEY);
    router.replace('/login');
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <Sky variant={phase} className="absolute inset-0" />
        <Hills palette={PALETTES[phase]} className="absolute inset-x-0 bottom-0 h-[30vh] w-full" />
      </div>

      <div className="pt-safe mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-6 sm:px-8">
        <header className="flex items-center justify-between py-3 sm:py-5">
          <div className="flex items-center gap-2 text-plum-600">
            <Icon name="paw" size={30} />
            <span className={`font-display text-2xl font-semibold ${phase === 'night' ? 'text-white' : 'text-ink'}`}>
              Pocket <span className="text-berry-400">Pets</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-extrabold text-ink shadow-soft backdrop-blur transition active:scale-95"
          >
            <Icon name="lock" size={20} /> Grown-ups
          </button>
        </header>

        <main className="flex flex-1 flex-col justify-center py-4">
          <motion.h1
            className={`text-center font-display text-4xl font-semibold leading-tight sm:text-5xl ${phase === 'night' ? 'text-white' : 'text-ink'}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Who&apos;s playing today?
          </motion.h1>
          <p className={`mt-2 text-center text-base font-bold ${phase === 'night' ? 'text-plum-100' : 'text-ink-soft'}`}>
            Tap your pet to start your adventure
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6">
            {mockChildren.map((child, index) => (
              <PlayerCard key={child.id} child={child} view={players[child.id] ?? null} index={index} />
            ))}
          </div>
        </main>

        <footer className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void logOut()}
            disabled={busy}
            className="min-h-11 rounded-full bg-white/60 px-4 text-sm font-extrabold text-ink-soft backdrop-blur"
          >
            {busy ? 'Logging out…' : 'Log out of Pocket Pets'}
          </button>
        </footer>
      </div>

      <AnimatePresence>
        {pinOpen ? (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={() => setPinOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Parent check"
              className="surface relative w-full max-w-sm p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <button
                type="button"
                onClick={() => setPinOpen(false)}
                className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
                aria-label="Close"
              >
                <Icon name="close" size={22} />
              </button>
              <PinPad
                onSuccess={() => {
                  window.sessionStorage.setItem(PARENT_PIN_SESSION_KEY, 'yes');
                  router.push('/parent/dashboard');
                }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
