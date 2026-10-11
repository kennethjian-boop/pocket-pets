'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogoutButton } from '@/components/AuthGate';
import { getChild } from '@/lib/mock-data';
import {
  mergeWithDefaultChildState,
  readChildDashboardState,
  readChildSupabaseSyncMeta,
} from '@/lib/mission-state';
import { fetchChildState, type SupabaseChildState } from '@/lib/supabase-child-state';

const navItems = [
  { icon: '🏡', label: 'My Pet', shortLabel: 'Home', path: '', hint: 'Your cozy home', accent: 'from-rose-100 to-amber-100' },
  { icon: '🛍️', label: 'Magic Shop', shortLabel: 'Shop', path: '/shop', hint: 'New looks await', accent: 'from-amber-100 to-yellow-100' },
  { icon: '🐉', label: 'Family Boss', shortLabel: 'Boss', path: '/family', hint: 'Team up together', accent: 'from-violet-100 to-sky-100' },
  { icon: '🎮', label: 'Pet Catch', shortLabel: 'Play', path: '/pet-catch', hint: 'Catch some magic', accent: 'from-emerald-100 to-teal-100' },
];

function getHref(childId: string, path: string) {
  return `/child/${childId}${path}`;
}

function isActive(pathname: string, href: string) {
  return pathname === href;
}

function ChildNavItems({ childId, compact = false }: { childId: string; compact?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {navItems.map((item) => {
        const href = getHref(childId, item.path);
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`group flex items-center rounded-2xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 active:scale-[0.98] ${compact ? 'min-h-[66px] flex-col justify-center gap-1 px-1 py-2 text-center' : 'min-h-[68px] gap-3 px-3 py-2.5'} ${active ? `border-white bg-gradient-to-r ${item.accent} text-slate-900 shadow-sm` : 'border-transparent bg-white/40 text-slate-600 hover:border-white/90 hover:bg-white/90 hover:text-slate-900'}`}
          >
            <span className={`${compact ? 'text-2xl' : 'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/70 text-2xl'} transition-transform group-hover:scale-110`} aria-hidden="true">{item.icon}</span>
            <span className="min-w-0">
              <span className={`block font-black leading-tight ${compact ? 'text-[11px] sm:text-xs' : 'text-sm'}`}>{compact ? item.shortLabel : item.label}</span>
              {!compact && <span className="mt-1 block text-[11px] font-semibold text-slate-500">{item.hint}</span>}
            </span>
            {active && !compact && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />}
          </Link>
        );
      })}
    </>
  );
}

function BrandBlock() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-violet-500">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-200 via-amber-100 to-violet-200 text-2xl shadow-sm transition-transform group-hover:-rotate-6" aria-hidden="true">
        🐾
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Pocket <span className="text-pink-500">Pets</span>
      </span>
    </Link>
  );
}

export function ChildSidebar({ childId }: { childId: string }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-violet-100/80 bg-gradient-to-b from-white/95 via-rose-50/90 to-violet-50/95 shadow-sm backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen">
        <div className="border-b border-white/70 px-5 py-5">
          <BrandBlock />
          <p className="mt-3 rounded-2xl bg-white/65 px-3 py-2 text-xs font-black tracking-wide text-violet-700">
            ✨ Your magical adventure
          </p>
        </div>

        <nav aria-label="Your adventure" className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
          <ChildNavItems childId={childId} />
        </nav>

        <div className="border-t border-white/70 px-3 py-4">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold text-slate-600 transition hover:bg-white/75 hover:text-slate-900 active:scale-95"
          >
            <span aria-hidden="true">↩</span>
            <span>Switch User</span>
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-gradient-to-r from-rose-50/95 via-white/95 to-violet-50/95 px-3 py-3 shadow-sm backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3 px-1">
          <BrandBlock />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="flex min-h-10 items-center justify-center rounded-full bg-violet-50 px-3 py-2 text-center text-xs font-extrabold text-violet-700 shadow-sm active:scale-95"
          >
            Switch User
          </Link>
          <LogoutButton inline className="flex min-h-10 w-full items-center justify-center px-3 py-2 text-center" />
        </div>
        <nav aria-label="Your adventure" className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
          <ChildNavItems childId={childId} compact />
        </nav>
      </header>
    </>
  );
}

export function ChildPageFrame({
  childId,
  children,
}: {
  childId: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const showDebugSync = searchParams.get('debugSync') === '1';

  return (
    <div className="min-h-screen md:flex">
      <ChildSidebar childId={childId} />
      <main className="min-w-0 flex-1">{children}</main>
      {showDebugSync && <SyncDebugPanel childId={childId} />}
    </div>
  );
}

function SyncDebugPanel({ childId }: { childId: string }) {
  const [remoteState, setRemoteState] = useState<SupabaseChildState | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const child = getChild(childId);
  const localState = child
    ? mergeWithDefaultChildState(child, readChildDashboardState(childId))
    : null;
  const syncMeta = readChildSupabaseSyncMeta(childId);

  useEffect(() => {
    if (!child) return;

    let cancelled = false;
    void fetchChildState(child)
      .then((state) => {
        if (!cancelled) {
          setRemoteState(state);
          setRemoteError(state ? null : 'No Supabase row or env unavailable.');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRemoteError(error instanceof Error ? error.message : 'Supabase fetch failed.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [child, childId]);

  if (!child || !localState) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-50 max-h-[70vh] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 text-xs font-semibold text-slate-700 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900">Sync Status</h2>
          <p className="text-slate-400">{child.name} · {childId}</p>
        </div>
        <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-black uppercase text-purple-700">
          Debug
        </span>
      </div>

      <dl className="space-y-2">
        <DebugRow label="Source" value={syncMeta.lastSyncSource} />
        <DebugRow label="Migrated" value={syncMeta.migratedToSupabase ? 'yes' : 'no'} />
        <DebugRow label="Remote updated" value={syncMeta.lastRemoteUpdatedAt ?? 'none'} />
        <DebugRow label="Local write" value={syncMeta.lastLocalWriteAt ?? 'none'} />
        <DebugRow label="Supabase write" value={syncMeta.lastSupabaseWriteAt ?? 'none'} />
        <DebugRow label="Error" value={syncMeta.lastSyncError ?? remoteError ?? 'none'} />
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <DebugStateCard
          title="Local"
          stars={localState.stars}
          hearts={localState.hearts}
          screenEnergy={localState.screenEnergy}
          pet={localState.activePetId}
          updatedAt={syncMeta.lastLocalWriteAt}
        />
        <DebugStateCard
          title="Supabase"
          stars={remoteState?.stars}
          hearts={remoteState?.hearts}
          screenEnergy={remoteState?.screenEnergy}
          pet={remoteState?.equippedPet}
          updatedAt={remoteState?.updatedAt}
        />
      </div>
    </aside>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="break-words text-slate-700">{value}</dd>
    </div>
  );
}

function DebugStateCard({
  title,
  stars,
  hearts,
  screenEnergy,
  pet,
  updatedAt,
}: {
  title: string;
  stars?: number;
  hearts?: number;
  screenEnergy?: number;
  pet?: string;
  updatedAt?: string | null;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <h3 className="mb-2 font-black text-slate-900">{title}</h3>
      <p>⭐ {stars ?? '-'}</p>
      <p>❤️ {hearts ?? '-'}</p>
      <p>⚡ {screenEnergy ?? '-'}</p>
      <p>Pet: {pet ?? '-'}</p>
      <p className="mt-2 break-words text-[10px] text-slate-400">{updatedAt ?? 'no timestamp'}</p>
    </div>
  );
}
