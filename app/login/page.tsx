'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50 px-5 py-10">
      <section className="w-full max-w-sm rounded-[32px] border border-white/80 bg-white/90 p-7 shadow-xl">
        <div className="text-center">
          <div className="text-4xl font-black text-pink-400">PP</div>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Pocket Pets</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Log in to visit your family pets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-2xl bg-pink-400 px-5 py-3 text-base font-extrabold text-white shadow-sm transition hover:bg-pink-500 active:scale-[0.99] disabled:cursor-wait disabled:bg-slate-200 disabled:text-slate-400"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </section>
    </main>
  );
}
