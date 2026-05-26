import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pocket Pets - Child Mode",
  description: "Child experience for Pocket Pets",
};

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
