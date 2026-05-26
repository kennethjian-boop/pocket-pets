import type { Metadata } from 'next';
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
    <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50">
      <ParentSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white/25">
        {children}
        <ParentMobileNav />
      </div>
    </div>
  );
}
