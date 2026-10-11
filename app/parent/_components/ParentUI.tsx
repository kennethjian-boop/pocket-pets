'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PetFace } from '@/components/child/PetSprite';
import type { ChildDashboardState, DailyMission } from '@/lib/mission-state';
import type { PetType } from '@/lib/pet-skins';

// ─── Layout ───────────────────────────────────────────────────────────────────

export function ParentHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-[#ece7f2] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:max-w-5xl">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold text-ink">{title}</h1>
          {subtitle ? <p className="truncate text-xs font-bold text-ink-faint">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <Link
            href="/"
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#ece7f2] bg-white px-3 text-sm font-extrabold text-ink-soft transition hover:text-ink active:scale-95"
          >
            <Icon name="swap" size={18} /> Players
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ParentBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className={`mx-auto grid gap-4 px-4 py-4 sm:px-6 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>{children}</div>
    </main>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export type ParentToastTone = 'success' | 'error' | 'info';

export function useParentToast() {
  const [toast, setToast] = useState<{ id: number; message: string; tone: ParentToastTone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useRef(0);
  const show = useCallback((message: string, tone: ParentToastTone = 'success') => {
    if (!message) return;
    id.current += 1;
    setToast({ id: id.current, message, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), tone === 'error' ? 5000 : 2600);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const node = (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-6 lg:left-60">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-pop ${
              toast.tone === 'error' ? 'bg-berry-600' : toast.tone === 'info' ? 'bg-ink' : 'bg-mint-600'
            }`}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
  return { show, node };
}

// ─── Children ───────────────────────────────────────────────────────────────

export function Balances({ state, size = 'sm' }: { state: ChildDashboardState; size?: 'sm' | 'md' }) {
  const chip = size === 'md' ? 'h-9 gap-1.5 px-3 text-base' : 'h-7 gap-1 px-2 text-sm';
  const icon = size === 'md' ? 22 : 18;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center rounded-full bg-honey-50 font-display font-semibold tabular-nums text-honey-700 ${chip}`} title="Stars">
        <Icon name="star" size={icon} /> {state.stars}
      </span>
      <span className={`inline-flex items-center rounded-full bg-berry-50 font-display font-semibold tabular-nums text-berry-700 ${chip}`} title="Hearts">
        <Icon name="heart" size={icon} /> {state.hearts}
      </span>
      <span className={`inline-flex items-center rounded-full bg-sky-50 font-display font-semibold tabular-nums text-sky-700 ${chip}`} title="Screen Energy">
        <Icon name="energy" size={icon} /> {state.screenEnergy}
      </span>
    </div>
  );
}

export function ChildTabs({
  items,
  activeId,
  onChange,
}: {
  items: { id: string; name: string; state: ChildDashboardState; badge?: number }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Choose child" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#f1ecf7] p-1.5">
      {items.map((item) => {
        const active = item.id === activeId;
        const pet = item.state.activePetId as PetType;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 font-display text-base font-semibold transition ${
              active ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
            }`}
          >
            <PetFace pet={pet} skinId={item.state.activeSkins[pet]} size={28} ring={active ? 'ring-plum-200' : 'ring-transparent'} />
            {item.name}
            {item.badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-honey-400 px-1 text-[11px] font-extrabold text-honey-700">{item.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ─── Goal verification ───────────────────────────────────────────────────────

export function GoalVerifyList({
  missions,
  completed,
  pendingKeys,
  childId,
  onVerify,
}: {
  missions: DailyMission[];
  completed: Record<string, boolean>;
  pendingKeys: Set<string>;
  childId: string;
  onVerify: (mission: DailyMission, completed: boolean) => void;
}) {
  const [confirmUndo, setConfirmUndo] = useState<string | null>(null);
  return (
    <ul className="grid gap-2">
      {missions.map((mission) => {
        const done = Boolean(completed[mission.id]);
        const busy = pendingKeys.has(`${childId}:${mission.id}`);
        const reward = mission.starReward ?? mission.reward;
        const asking = confirmUndo === mission.id;
        return (
          <li
            key={mission.id}
            className={`rounded-2xl border px-3 py-2.5 transition ${done ? 'border-mint-200 bg-mint-50' : 'border-[#ece7f2] bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] font-extrabold leading-tight ${done ? 'text-mint-700' : 'text-ink'}`}>{mission.title}</p>
                <p className="mt-0.5 text-xs font-bold text-ink-faint">
                  +{reward} stars · boss −{mission.bossDamage ?? 10}
                  {done ? ' · verified' : ''}
                </p>
              </div>
              {done ? (
                <button
                  type="button"
                  onClick={() => setConfirmUndo(asking ? null : mission.id)}
                  disabled={busy}
                  className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm font-extrabold text-mint-700 hover:bg-mint-100 disabled:opacity-50"
                  aria-label={`Undo verification of ${mission.title}`}
                >
                  <Icon name="check" size={24} />
                  <Icon name="undo" size={18} className="text-ink-faint" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onVerify(mission, true)}
                  disabled={busy}
                  className="min-h-11 shrink-0 rounded-xl bg-mint-500 px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#1c8455] transition active:translate-y-0.5 active:shadow-none disabled:opacity-60"
                >
                  {busy ? 'Saving…' : 'Verify'}
                </button>
              )}
            </div>
            {asking ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                <p className="text-xs font-bold text-ink-soft">Undo? This removes {reward} stars and the boss hit.</p>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => setConfirmUndo(null)} className="min-h-9 rounded-lg px-3 text-xs font-extrabold text-ink-soft">
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmUndo(null);
                      onVerify(mission, false);
                    }}
                    className="min-h-9 rounded-lg bg-berry-500 px-3 text-xs font-extrabold text-white"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
