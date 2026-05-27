'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchParentSettings } from '@/lib/supabase-parent-settings';
import { readParentPin, writeParentPin } from '@/lib/parent-pin';

const PARENT_PIN_SESSION_KEY = 'pocket-pets-parent-pin-unlocked';

export function ParentPinGate({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(PARENT_PIN_SESSION_KEY) === 'yes');
    setChecking(false);

    void fetchParentSettings().then((remote) => {
      if (remote) writeParentPin(remote.pin);
    });
  }, []);

  useEffect(() => {
    if (!checking && !unlocked) {
      inputRef.current?.focus();
    }
  }, [checking, unlocked]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const localPin = readParentPin();
    const remote = pin === localPin ? null : await fetchParentSettings();
    const validPin = pin === localPin || (remote && pin === remote.pin);

    if (!validPin) {
      setError('That is not the parent code.');
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 40);
      return;
    }

    if (remote) writeParentPin(remote.pin);
    window.sessionStorage.setItem(PARENT_PIN_SESSION_KEY, 'yes');
    setUnlocked(true);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <p className="rounded-[24px] bg-white/85 px-6 py-4 text-sm font-extrabold text-slate-600 shadow-sm">
          Checking parent access...
        </p>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <section className="w-full max-w-xs rounded-[28px] border border-white/80 bg-white p-7 text-center shadow-xl">
        <div className="text-3xl">Lock</div>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">Parent Check</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Enter the parent code to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            placeholder="0000"
            className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white"
          />

          {error ? <p className="text-sm font-bold text-rose-500">{error}</p> : null}

          <button
            type="submit"
            disabled={pin.length !== 4}
            className="rounded-2xl bg-pink-400 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Enter
          </button>
        </form>
      </section>
    </main>
  );
}
