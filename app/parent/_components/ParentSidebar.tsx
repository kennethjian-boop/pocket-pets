'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: '📊', label: 'Overview', href: '/parent/dashboard' },
  { icon: '✅', label: 'Goals & Verification', href: '/parent/goals' },
  { icon: '🎁', label: 'Rewards', href: '/parent/rewards' },
  { icon: '👾', label: 'Family Boss', href: '/parent/family-boss' },
  { icon: '📱', label: 'Screen Energy', href: '/parent/screen-energy' },
  { icon: '⚙️', label: 'Settings', href: '/parent/settings' },
];

export default function ParentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="border-b border-slate-100 px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-800">
            Pocket <span className="text-pink-500">Pets</span>
          </span>
        </Link>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Parent Dashboard
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ icon, label, href }) => {
          const active =
            pathname === href ||
            (href !== '/parent/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                active
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="space-y-0.5 border-t border-slate-100 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </p>
        <Link
          href="/parent/goals"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <span>✏️</span>
          <span>Edit Goals</span>
        </Link>
        <Link
          href="/parent/rewards"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <span>🎁</span>
          <span>Manage Rewards</span>
        </Link>
        <Link
          href="/parent/screen-energy"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <span>🔄</span>
          <span>Reset New Week</span>
        </Link>
        <Link
          href="/parent/settings"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
        >
          <span>🔒</span>
          <span>Change Parent PIN</span>
        </Link>
      </div>
    </aside>
  );
}
