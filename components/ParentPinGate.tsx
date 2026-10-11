'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { fetchParentSettings } from '@/lib/supabase-parent-settings';
import { writeParentPin } from '@/lib/parent-pin';
import { PinPad } from '@/components/PinPad';

const PARENT_PIN_SESSION_KEY = 'pocket-pets-parent-pin-unlocked';

export function ParentPinGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'locked' | 'unlocked'>('checking');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setStatus(window.sessionStorage.getItem(PARENT_PIN_SESSION_KEY) === 'yes' ? 'unlocked' : 'locked');
      const remote = await fetchParentSettings();
      if (remote) writeParentPin(remote.pin);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return <div className="min-h-dvh bg-paper" aria-busy="true" />;
  }

  if (status === 'unlocked') {
    return <>{children}</>;
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-plum-50 to-paper px-5 py-10">
      <section className="surface w-full max-w-sm p-6">
        <PinPad
          onSuccess={() => {
            window.sessionStorage.setItem(PARENT_PIN_SESSION_KEY, 'yes');
            setStatus('unlocked');
          }}
        />
        <Link href="/" className="mt-5 block text-center text-sm font-extrabold text-ink-soft">
          Back to players
        </Link>
      </section>
    </main>
  );
}
