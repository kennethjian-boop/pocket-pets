'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { fetchParentSettings } from '@/lib/supabase-parent-settings';
import { readParentPin, writeParentPin } from '@/lib/parent-pin';

/**
 * Child-resistant parent check (not real authentication — see APP_RULES).
 * Checks the local PIN first, then the family PIN saved in Supabase in case it
 * was changed on another device.
 */
export async function checkParentPin(pin: string) {
  if (pin === readParentPin()) return true;
  const remote = await fetchParentSettings();
  if (remote && pin === remote.pin) {
    writeParentPin(remote.pin);
    return true;
  }
  return false;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function PinPad({ onSuccess, title = 'Grown-ups only', subtitle = 'Enter the parent code' }: { onSuccess: () => void; title?: string; subtitle?: string }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  // Refs keep fast typing (physical keyboards) from reading a stale value between renders.
  const pinRef = useRef('');
  const checkingRef = useRef(false);
  const controls = useAnimationControls();

  const submit = useCallback(
    async (value: string) => {
      checkingRef.current = true;
      setChecking(true);
      const ok = await checkParentPin(value);
      checkingRef.current = false;
      setChecking(false);
      if (ok) {
        onSuccess();
        return;
      }
      setError(true);
      pinRef.current = '';
      setPin('');
      void controls.start({ x: [0, -12, 12, -8, 8, 0], transition: { duration: 0.4 } });
    },
    [controls, onSuccess]
  );

  const press = useCallback(
    (key: string) => {
      if (checkingRef.current) return;
      setError(false);
      const current = pinRef.current;
      if (key === 'del') {
        pinRef.current = current.slice(0, -1);
        setPin(pinRef.current);
        return;
      }
      if (current.length >= 4) return;
      const next = current + key;
      pinRef.current = next;
      setPin(next);
      if (next.length === 4) void submit(next);
    },
    [submit]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key);
      else if (event.key === 'Backspace') press('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  return (
    <div className="flex flex-col items-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-50">
        <Icon name="lock" size={36} />
      </span>
      <h2 className="mt-3 font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className={`mt-1 text-sm font-bold ${error ? 'text-berry-600' : 'text-ink-soft'}`} role={error ? 'alert' : undefined}>
        {error ? "That's not the parent code." : checking ? 'Checking…' : subtitle}
      </p>
      <motion.div animate={controls} className="my-5 flex gap-4" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full transition ${i < pin.length ? 'scale-110 bg-plum-500' : 'bg-ink/15'} ${error ? 'bg-berry-300' : ''}`}
          />
        ))}
      </motion.div>
      <div className="grid w-full max-w-[280px] grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              disabled={checking}
              aria-label={key === 'del' ? 'Delete' : key}
              className="grid h-16 place-items-center rounded-2xl bg-white font-display text-2xl font-semibold text-ink shadow-[0_3px_0_#e2d8ea] transition active:translate-y-0.5 active:shadow-none disabled:opacity-60"
            >
              {key === 'del' ? <Icon name="arrow-left" size={24} /> : key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
