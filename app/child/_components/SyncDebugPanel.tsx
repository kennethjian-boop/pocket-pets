'use client';

import { useEffect, useState } from 'react';
import { getChild } from '@/lib/mock-data';
import {
  mergeWithDefaultChildState,
  readChildDashboardState,
  readChildSupabaseSyncMeta,
} from '@/lib/mission-state';
import { fetchChildState, type SupabaseChildState } from '@/lib/supabase-child-state';

/** Developer-only panel shown with ?debugSync=1. */
export function SyncDebugPanel({ childId }: { childId: string }) {
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
