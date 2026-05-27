import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoutButton } from '@/components/AuthGate';
import { ParentPinGate } from '@/components/ParentPinGate';
import ParentSidebar from './_components/ParentSidebar';
import ParentMobileNav from './_components/ParentMobileNav';

export const metadata: Metadata = {
  title: 'Pocket Pets - Parent Mode',
  description: 'Parent dashboard for Pocket Pets',
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ParentPinGate>
      <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50">
        <ParentSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white/25">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/70 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm lg:hidden">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <span className="text-lg font-black text-pink-500" aria-hidden="true">PP</span>
              <span className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                Pocket <span className="text-pink-500">Pets</span>
              </span>
            </Link>
            <LogoutButton inline className="flex min-h-10 shrink-0 items-center justify-center px-4 py-2 text-sm" />
          </div>
          {children}
          <ParentMobileNav />
        </div>
      </div>
    </ParentPinGate>
  );
}
