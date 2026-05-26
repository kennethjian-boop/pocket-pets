'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavigationProps {
  type: 'parent' | 'child';
  childId?: string;
}

export function BottomNavigation({
  type,
  childId = 'child-ansel',
}: BottomNavigationProps) {
  const pathname = usePathname();

  const parentItems = [
    { label: 'Dashboard', icon: '👨‍👩‍👧', href: '/parent/dashboard' },
    { label: 'Rewards', icon: '⚙️', href: '/parent/settings/rewards' },
  ];

  const childItems = [
    { label: 'Home', icon: '🏠', href: `/child/${childId}` },
    { label: 'Shop', icon: '🛍️', href: `/child/${childId}/shop` },
    { label: 'Boss', icon: '👾', href: `/child/${childId}/family` },
  ];

  const items = type === 'parent' ? parentItems : childItems;

  return (
    <nav className="fixed bottom-5 left-1/2 z-40 w-full max-w-[600px] -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-3 py-3 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[100px] flex-1 flex-col items-center justify-center gap-1 rounded-full px-3 py-2.5 text-center transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-violet-100 via-pink-50 to-sky-100 text-slate-900 shadow-md ring-1 ring-white/80'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
