import type { Metadata } from 'next';
import ParentSidebar from './_components/ParentSidebar';

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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50">
      <ParentSidebar />
      <div className="flex min-w-0 flex-1 h-full flex-col bg-white/25">{children}</div>
    </div>
  );
}
