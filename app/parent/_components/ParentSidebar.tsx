'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/AuthGate';
import { Icon } from '@/components/ui/Icon';
import { PARENT_NAV, isParentNavActive } from './parentNav';

export default function ParentSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#ece7f2] bg-white lg:flex">
      <div className="px-5 pb-4 pt-5">
        <Link href="/" className="flex items-center gap-2 text-plum-500">
          <Icon name="paw" size={26} />
          <span className="font-display text-xl font-semibold text-ink">
            Pocket <span className="text-berry-500">Pets</span>
          </span>
        </Link>
        <p className="mt-1 pl-0.5 text-[11px] font-extrabold uppercase tracking-wider text-ink-faint">Parent controls</p>
      </div>
      <nav aria-label="Parent" className="flex-1 space-y-0.5 px-3">
        {PARENT_NAV.map(({ icon, label, href }) => {
          const active = isParentNavActive(pathname, href);
          const isColor = icon === 'gift' || icon === 'sword';
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-extrabold transition ${
                active ? 'bg-plum-50 text-plum-700' : 'text-ink-soft hover:bg-[#f6f2fa] hover:text-ink'
              }`}
            >
              <Icon name={icon} size={22} className={isColor && !active ? 'opacity-80 saturate-50' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#ece7f2] p-3">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-extrabold text-ink-soft hover:bg-[#f6f2fa]">
          <Icon name="swap" size={20} /> Back to players
        </Link>
        <LogoutButton inline className="mt-2 flex min-h-10 w-full items-center justify-center text-sm" />
      </div>
    </aside>
  );
}
