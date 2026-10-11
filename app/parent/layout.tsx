import type { Metadata } from 'next';
import { ParentPinGate } from '@/components/ParentPinGate';
import ParentSidebar from './_components/ParentSidebar';
import ParentMobileNav from './_components/ParentMobileNav';

export const metadata: Metadata = {
  title: 'Pocket Pets - Parent Mode',
  description: 'Parent dashboard for Pocket Pets',
};

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParentPinGate>
      <div className="flex h-[calc(100dvh-var(--demo-strip,0px))] overflow-hidden bg-[#f8f5fb]">
        <ParentSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
          <ParentMobileNav />
        </div>
      </div>
    </ParentPinGate>
  );
}
