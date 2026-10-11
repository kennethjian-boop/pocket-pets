'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv, isDemoMode } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [email, setEmail] = useState(demo ? 'family@demo.pocketpets' : '');
  const [password, setPassword] = useState(demo ? 'demo' : '');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!hasSupabaseBrowserEnv()) {
      setErrorMessage('Supabase is not configured for this app.');
      return;
    }

    setLoading(true);
    const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setErrorMessage('Email or password was not recognised.');
      setPassword('');
      return;
    }

    router.replace('/');
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-plum-50 to-cream" aria-hidden="true" />
      <section className="surface w-full max-w-sm p-7">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-plum-50 text-plum-500">
            <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
              <ellipse cx="24" cy="31" rx="9" ry="7.5" fill="currentColor" />
              <circle cx="13" cy="21" r="4" fill="currentColor" />
              <circle cx="20" cy="13.5" r="4" fill="currentColor" />
              <circle cx="28" cy="13.5" r="4" fill="currentColor" />
              <circle cx="35" cy="21" r="4" fill="currentColor" />
            </svg>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
            Pocket <span className="text-berry-500">Pets</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-ink-soft">Sign in to visit your family pets.</p>
          {demo ? (
            <p className="mt-3 rounded-2xl bg-plum-50 px-3 py-2 text-sm font-bold text-plum-700">
              Preview with a sample family — just tap Sign in. Nothing here touches the real app.
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-extrabold text-ink">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="min-h-12 rounded-2xl border-2 border-plum-100 bg-white px-4 text-base font-bold text-ink outline-none transition focus:border-plum-400"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-extrabold text-ink">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="min-h-12 rounded-2xl border-2 border-plum-100 bg-white px-4 text-base font-bold text-ink outline-none transition focus:border-plum-400"
            />
          </label>

          {errorMessage ? (
            <p role="alert" className="rounded-2xl bg-berry-50 px-4 py-3 text-sm font-bold text-berry-700">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-chunky btn-plum mt-1 min-h-14 px-5 text-lg">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
