'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

/** "Are you sure?" bottom sheet for spending — prevents accidental taps by little fingers. */
export function ConfirmSheet({
  open,
  title,
  art,
  cost,
  balance,
  confirmLabel = 'Yes, buy it!',
  busy = false,
  onConfirm,
  onCancel,
  note,
}: {
  open: boolean;
  title: string;
  art?: ReactNode;
  cost: number;
  balance: number;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  note?: string;
}) {
  const after = balance - cost;
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Cancel" className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={busy ? undefined : onCancel} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="surface relative w-full max-w-sm p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            {art ? <div className="mx-auto -mt-1 mb-2 grid place-items-center">{art}</div> : null}
            <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
            <div className="mx-auto mt-3 flex w-fit items-center gap-3 rounded-2xl bg-honey-50 px-4 py-2 ring-1 ring-honey-200">
              <span className="flex items-center gap-1 font-display text-xl font-semibold text-honey-700">
                <Icon name="star" size={26} /> {cost}
              </span>
              <span className="text-sm font-bold text-ink-soft">
                You&apos;ll have {after} left
              </span>
            </div>
            {note ? <p className="mt-3 text-sm font-bold text-ink-soft">{note}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={onCancel} disabled={busy} className="btn-chunky btn-paper min-h-14 px-3 text-lg">
                Not now
              </button>
              <button type="button" onClick={onConfirm} disabled={busy} className="btn-chunky btn-honey min-h-14 px-3 text-lg">
                {busy ? 'Buying…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
