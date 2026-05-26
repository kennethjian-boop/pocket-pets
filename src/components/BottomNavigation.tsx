'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavigationProps {
  type: 'parent' | 'child';
}

export function BottomNavigation({ type }: BottomNavigationProps) {
  const pathname = usePathname();

  const parentItems = [
    { label: 'Dashboard', icon: '👨‍👩‍👧', href: '/parent/dashboard' },
    { label: 'Rewards', icon: '🎁', href: '/parent/rewards' },
    { label: 'Settings', icon: '⚙️', href: '/parent/settings' },
  ];

  const childItems = [
    { label: 'Home', icon: '🏠', href: '/child/[childId]' },
    { label: 'Shop', icon: '🛍️', href: '/child/[childId]/shop' },
    { label: 'Boss', icon: '👾', href: '/child/[childId]/family' },
  ];

  const items = type === 'parent' ? parentItems : childItems;

  return (
    <nav className="bg-gradient-to-t from-white to-gray-50 border-t-2 border-gray-200 shadow-xl">
      <div className="mx-auto max-w-6xl flex justify-around items-center px-6 py-4">
        {items.map((item) => {
          const isActive =
            type === 'parent'
              ? pathname === item.href
              : pathname?.includes(item.href.replace('/[childId]', ''));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-blue-200 to-blue-100 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-bold uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
