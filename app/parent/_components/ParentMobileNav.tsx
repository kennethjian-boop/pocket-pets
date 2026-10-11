'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { PARENT_NAV, isParentNavActive } from './parentNav';

export default function ParentMobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Parent" className="pb-safe shrink-0 border-t border-[#ece7f2] bg-white lg:hidden">
      <ul className="grid grid-cols-6">
        {PARENT_NAV.map(({ icon, short, href }) => {
          const active = isParentNavActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 px-0.5 transition active:scale-95 ${
                  active ? 'text-plum-600' : 'text-ink-faint'
                }`}
              >
                <span className={`grid h-7 w-11 place-items-center rounded-full transition ${active ? 'bg-plum-50' : ''}`}>
                  <Icon name={icon} size={22} className={!active && (icon === 'gift' || icon === 'sword') ? 'opacity-70 saturate-0' : ''} />
                </span>
                <span className="text-[10px] font-extrabold leading-none">{short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
