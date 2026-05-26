'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: '📊', label: 'Home', href: '/parent/dashboard' },
  { icon: '✅', label: 'Goals', href: '/parent/goals' },
  { icon: '🎁', label: 'Rewards', href: '/parent/rewards' },
  { icon: '👾', label: 'Boss', href: '/parent/family-boss' },
  { icon: '📱', label: 'Screen', href: '/parent/screen-energy' },
  { icon: '⚙️', label: 'Settings', href: '/parent/settings' },
];

export default function ParentMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-6">
        {navItems.map(({ icon, label, href }) => {
          const active =
            pathname === href ||
            (href !== '/parent/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1 py-2 text-center transition active:scale-95 ${
                active ? 'text-purple-700' : 'text-slate-400'
              }`}
            >
              <span className={`text-[22px] leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span
                className={`text-[9px] font-bold leading-none tracking-wide ${
                  active ? 'text-purple-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
              <span
                className={`mt-0.5 h-0.5 w-4 rounded-full transition-all duration-200 ${
                  active ? 'bg-purple-500' : 'bg-transparent'
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
