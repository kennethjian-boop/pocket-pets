'use client';

import { useState } from 'react';
import { isDemoMode } from '@/lib/supabase-browser';
import { resetDemoData } from '@/lib/demo-backend/demo-fetch';

/** Slim notice shown only in demo builds so nobody mistakes sample data for the real app. */
export function DemoStrip() {
  const [busy, setBusy] = useState(false);
  if (!isDemoMode()) return null;
  return (
    <div className="flex h-[var(--demo-strip)] items-center justify-center gap-2 bg-ink px-3 text-[12px] font-extrabold text-white">
      <span className="truncate">Preview · sample family · parent code 1234</span>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          try {
            window.sessionStorage.clear();
          } catch {
            /* ignore */
          }
          resetDemoData('default');
          window.location.assign('/');
        }}
        className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] hover:bg-white/25"
      >
        {busy ? 'Resetting…' : 'Reset'}
      </button>
    </div>
  );
}
