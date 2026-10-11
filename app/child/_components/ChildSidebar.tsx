'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CurrencyPill } from '@/components/child/CurrencyPill';
import { PetFace } from '@/components/child/PetSprite';
import { SceneBackdrop, useDayPhase, type SceneVariant } from '@/components/child/Scenery';
import { PET_ROSTER } from '@/lib/mock-data';
import type { PetType } from '@/lib/pet-skins';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import { ChildStateProvider, useChildState, type ToastTone } from './ChildStateProvider';
import { SyncDebugPanel } from './SyncDebugPanel';

const NAV: { icon: IconName; label: string; hint: string; path: string }[] = [
  { icon: 'home', label: 'Home', hint: 'Visit your pet', path: '' },
  { icon: 'shop', label: 'Shop', hint: 'Looks, eggs & more', path: '/shop' },
  { icon: 'boss', label: 'Boss', hint: 'Team battle', path: '/family' },
  { icon: 'play', label: 'Play', hint: 'Pet Catch game', path: '/pet-catch' },
];

const PARENT_PIN_SESSION_KEY = 'pocket-pets-parent-pin-unlocked';

function useNavItems(childId: string) {
  const pathname = usePathname();
  return NAV.map((item) => {
    const href = `/child/${childId}${item.path}`;
    return { ...item, href, active: pathname === href };
  });
}

function useActivePet() {
  const { state, hasSnapshot } = useChildState();
  const pet = state.activePetId as PetType;
  return {
    pet,
    known: hasSnapshot,
    skinId: state.activeSkins[pet],
    name: PET_ROSTER.find((p) => p.id === pet)?.name ?? 'Pet',
  };
}

function PetAvatarSlot({ pet, size }: { pet: ReturnType<typeof useActivePet>; size: number }) {
  if (!pet.known) {
    return <span className="inline-block shrink-0 animate-pulse rounded-full bg-plum-100 ring-2 ring-white" style={{ width: size, height: size }} />;
  }
  return <PetFace pet={pet.pet} skinId={pet.skinId} size={size} />;
}

function Balances({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { state, hasSnapshot, settled } = useChildState();
  const common = { size, quiet: !settled, placeholder: !hasSnapshot };
  return (
    <>
      <CurrencyPill kind="star" value={state.stars} {...common} />
      <CurrencyPill kind="heart" value={state.hearts} {...common} />
      <CurrencyPill kind="energy" value={state.screenEnergy} {...common} />
    </>
  );
}

async function logOut(router: ReturnType<typeof useRouter>) {
  if (hasSupabaseBrowserEnv()) await getSupabaseBrowserClient().auth.signOut();
  window.sessionStorage.removeItem(PARENT_PIN_SESSION_KEY);
  router.replace('/login');
}

function PlayerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { child } = useChildState();
  const pet = useActivePet();
  const [busy, setBusy] = useState(false);
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Player menu"
            className="surface relative m-3 w-full max-w-sm p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="flex items-center gap-3">
              <PetAvatarSlot pet={pet} size={56} />
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold text-ink">{child.name}</p>
                <p className="text-sm font-bold text-ink-soft">Playing with {pet.name}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <Link href="/" onClick={onClose} className="btn-chunky btn-plum min-h-14 px-5 text-lg">
                <Icon name="swap" size={22} /> Switch player
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void logOut(router);
                }}
                className="btn-chunky btn-paper min-h-12 px-5 text-base"
              >
                <Icon name="logout" size={20} /> {busy ? 'Logging out…' : 'Log out'}
              </button>
              <button type="button" onClick={onClose} className="min-h-11 text-sm font-extrabold text-ink-soft">
                Back to playing
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function TopBar() {
  const { child } = useChildState();
  const pet = useActivePet();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="pt-safe sticky top-0 z-30 xl:hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/60 bg-paper/75 px-3 py-2 backdrop-blur-md short:py-1 short:pl-[max(0.75rem,env(safe-area-inset-left))] short:pr-[max(0.75rem,env(safe-area-inset-right))]">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 transition active:scale-95"
          aria-label={`${child.name}'s menu`}
        >
          <PetAvatarSlot pet={pet} size={38} />
          <span className="truncate font-display text-lg font-semibold text-ink max-[359px]:hidden">{child.name}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Balances size="sm" />
        </div>
      </div>
      <PlayerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

function BottomNav({ childId }: { childId: string }) {
  const items = useNavItems(childId);
  return (
    <nav aria-label="Pocket Pets" className="sticky bottom-0 z-30 xl:hidden">
      <div className="pb-safe border-t border-white/70 bg-paper/85 shadow-[0_-8px_24px_-16px_rgb(58_42_77/0.35)] backdrop-blur-md">
        <ul className="mx-auto grid max-w-xl grid-cols-4 px-2 pt-1.5">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className="group flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-2xl pb-1.5 short:min-h-[46px] short:flex-row short:gap-2 short:pb-0"
              >
                <span
                  className={`grid h-11 w-14 place-items-center rounded-2xl transition-all duration-200 group-active:scale-90 short:h-9 short:w-10 ${
                    item.active ? '-translate-y-1 short:translate-y-0 bg-white shadow-[0_4px_0_rgb(58_42_77/0.08),0_8px_16px_-8px_rgb(58_42_77/0.4)]' : ''
                  }`}
                >
                  <Icon name={item.icon} size={item.active ? 34 : 30} />
                </span>
                <span className={`font-display text-[13px] font-semibold leading-none ${item.active ? 'text-plum-600' : 'text-ink-soft'}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Sidebar({ childId }: { childId: string }) {
  const router = useRouter();
  const items = useNavItems(childId);
  const { child } = useChildState();
  const pet = useActivePet();
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/60 bg-paper/70 px-4 py-5 backdrop-blur-md xl:flex">
      <Link href="/" className="flex items-center gap-2 px-2 text-plum-600">
        <Icon name="paw" size={30} />
        <span className="font-display text-2xl font-semibold text-ink">
          Pocket <span className="text-berry-500">Pets</span>
        </span>
      </Link>

      <div className="surface p-4">
        <div className="flex items-center gap-3">
          <PetAvatarSlot pet={pet} size={56} />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-ink">{child.name}</p>
            <p className="truncate text-sm font-bold text-ink-soft">with {pet.name}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Balances size="sm" />
        </div>
      </div>

      <nav aria-label="Pocket Pets" className="grid gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`group flex min-h-16 items-center gap-3 rounded-2xl px-3 transition ${
              item.active
                ? 'bg-white shadow-[0_3px_0_rgb(58_42_77/0.07),0_10px_20px_-14px_rgb(58_42_77/0.5)]'
                : 'hover:bg-white/60'
            }`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/80 transition group-hover:-rotate-6 group-active:scale-90">
              <Icon name={item.icon} size={34} />
            </span>
            <span>
              <span className={`block font-display text-lg font-semibold leading-tight ${item.active ? 'text-plum-600' : 'text-ink'}`}>
                {item.label}
              </span>
              <span className="block text-xs font-bold text-ink-faint">{item.hint}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto grid gap-2">
        <Link href="/" className="btn-chunky btn-paper min-h-12 px-4 text-base">
          <Icon name="swap" size={20} /> Switch player
        </Link>
        <button type="button" onClick={() => void logOut(router)} className="min-h-10 text-sm font-extrabold text-ink-faint hover:text-ink">
          Log out
        </button>
      </div>
    </aside>
  );
}

const TOAST_STYLE: Record<ToastTone, { bg: string; icon: IconName }> = {
  success: { bg: 'bg-white text-ink ring-mint-200', icon: 'check' },
  info: { bg: 'bg-white text-ink ring-plum-200', icon: 'sparkle' },
  warning: { bg: 'bg-white text-ink ring-berry-200', icon: 'heart' },
  celebrate: { bg: 'bg-gradient-to-r from-honey-100 via-white to-berry-100 text-ink ring-honey-200', icon: 'star' },
};

function ToastLayer() {
  const { toast } = useChildState();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 xl:bottom-8 xl:left-72">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 font-display text-lg font-semibold shadow-pop ring-2 ${TOAST_STYLE[toast.tone].bg}`}
            initial={{ y: 24, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <Icon name={TOAST_STYLE[toast.tone].icon} size={30} className="shrink-0" />
            <span className="leading-snug">{toast.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function sceneForPath(pathname: string, childId: string): SceneVariant | 'auto' {
  const base = `/child/${childId}`;
  if (pathname.startsWith(`${base}/shop`)) return 'golden';
  if (pathname.startsWith(`${base}/family`)) return 'storm';
  if (pathname.startsWith(`${base}/pet-catch`)) return 'meadow';
  return 'auto';
}

function Frame({ childId, children }: { childId: string; children: ReactNode }) {
  const phase = useDayPhase();
  const scene = sceneForPath(usePathname(), childId);
  const searchParams = useSearchParams();
  const showDebugSync = searchParams.get('debugSync') === '1';
  return (
    <div className="relative min-h-dvh xl:flex">
      <SceneBackdrop variant={scene === 'auto' ? phase : scene} />
      <Sidebar childId={childId} />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1">{children}</main>
        <BottomNav childId={childId} />
      </div>
      <ToastLayer />
      {showDebugSync && <SyncDebugPanel childId={childId} />}
    </div>
  );
}

/** Shared child world shell, mounted once by app/child/[childId]/layout.tsx. */
export function ChildPageFrame({ childId, children }: { childId: string; children: ReactNode }) {
  return (
    <ChildStateProvider childId={childId}>
      <Frame childId={childId}>
        {children}
      </Frame>
    </ChildStateProvider>
  );
}
