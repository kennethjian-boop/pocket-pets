'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: '🏠', label: 'Home', path: '' },
  { icon: '🛍️', label: 'Shop', path: '/shop' },
  { icon: '👾', label: 'Boss', path: '/family' },
];

function getHref(childId: string, path: string) {
  return `/child/${childId}${path}`;
}

function isActive(pathname: string, href: string) {
  return pathname === href;
}

function ChildNavItems({ childId }: { childId: string }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map(({ icon, label, path }) => {
        const href = getHref(childId, path);
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition-all active:scale-95 ${
              active
                ? 'bg-gradient-to-r from-pink-100 via-violet-100 to-sky-100 text-slate-950 shadow-sm ring-1 ring-white/80'
                : 'text-slate-600 hover:bg-white/75 hover:text-slate-900'
            }`}
          >
            <span className="text-lg" aria-hidden="true">
              {icon}
            </span>
            <span>{label}</span>
            {active && <span className="ml-auto h-2 w-2 rounded-full bg-pink-400" />}
          </Link>
        );
      })}
    </>
  );
}

function BrandBlock() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="text-2xl" aria-hidden="true">
        🐾
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Pocket <span className="text-pink-500">Pets</span>
      </span>
    </Link>
  );
}

export function ChildSidebar({ childId }: { childId: string }) {
  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/70 bg-white/80 shadow-sm backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen">
        <div className="border-b border-white/70 px-5 py-5">
          <BrandBlock />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
            Kids&apos; Quest
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <ChildNavItems childId={childId} />
        </nav>

        <div className="border-t border-white/70 px-3 py-4">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold text-slate-600 transition hover:bg-white/75 hover:text-slate-900 active:scale-95"
          >
            <span aria-hidden="true">↩</span>
            <span>Switch User</span>
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <BrandBlock />
          <Link
            href="/"
            className="rounded-full bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700"
          >
            Switch User
          </Link>
        </div>
        <nav className="grid grid-cols-3 gap-2">
          <ChildNavItems childId={childId} />
        </nav>
      </header>
    </>
  );
}

export function ChildPageFrame({
  childId,
  children,
}: {
  childId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:flex">
      <ChildSidebar childId={childId} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
