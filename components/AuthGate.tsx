'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';

const PARENT_PIN_SESSION_KEY = 'pocket-pets-parent-pin-unlocked';

function CozyLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50 px-6">
      <div className="rounded-[28px] border border-white/80 bg-white/85 px-7 py-6 text-center shadow-sm">
        <div className="text-3xl font-black text-pink-400">PP</div>
        <p className="mt-3 text-sm font-extrabold text-slate-700">Checking Pocket Pets...</p>
      </div>
    </main>
  );
}

export function LogoutButton({
  className = '',
  inline = false,
}: {
  className?: string;
  inline?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const positionClass = inline ? '' : 'fixed right-4 top-4 z-[80]';

  const handleLogout = async () => {
    if (!hasSupabaseBrowserEnv()) return;
    setBusy(true);
    await getSupabaseBrowserClient().auth.signOut();
    window.sessionStorage.removeItem(PARENT_PIN_SESSION_KEY);
    router.replace('/login');
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={busy}
      className={`${positionClass} rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-extrabold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-wait disabled:text-slate-400 ${className}`}
    >
      {busy ? 'Logging out...' : 'Logout'}
    </button>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const isChildPage = pathname?.startsWith('/child');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseBrowserEnv()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);

      if (!data.session && !isLoginPage) {
        router.replace('/login');
      }

      if (data.session && isLoginPage) {
        router.replace('/');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (!nextSession && !isLoginPage) {
        router.replace('/login');
      }

      if (nextSession && isLoginPage) {
        router.replace('/');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  if (!hasSupabaseBrowserEnv()) {
    return <>{children}</>;
  }

  if (loading) {
    return <CozyLoading />;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!session) {
    return <CozyLoading />;
  }

  return (
    <>
      <LogoutButton className={isChildPage ? 'hidden md:inline-flex' : ''} />
      {children}
    </>
  );
}
