import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pocket Pets - Parent Mode",
  description: "Parent dashboard for Pocket Pets",
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
