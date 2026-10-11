import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { AuthGate } from "@/components/AuthGate";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Pocket Pets",
  description: "A cozy family pet adventure powered by real-life goals",
  appleWebApp: { capable: true, title: "Pocket Pets", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fff3e2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-dvh bg-paper font-sans text-ink">
        <MotionProvider>
          <AuthGate>{children}</AuthGate>
        </MotionProvider>
      </body>
    </html>
  );
}
