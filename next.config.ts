import type { NextConfig } from "next";

/**
 * Demo mode runs the app on an in-browser sample backend (lib/demo-backend) so a
 * build can never touch real family data. It is on when:
 *   • NEXT_PUBLIC_DEMO_MODE=1 is set explicitly (e.g. `npm run demo`), or
 *   • the build is a Vercel *preview* deployment (VERCEL_ENV=preview), unless
 *     POCKET_PETS_PREVIEW_BACKEND=supabase opts previews into a configured
 *     (staging) Supabase project.
 * Production builds are unaffected.
 */
const explicit = process.env.NEXT_PUBLIC_DEMO_MODE;
const vercelPreview =
  process.env.VERCEL_ENV === "preview" && process.env.POCKET_PETS_PREVIEW_BACKEND !== "supabase";
const demoMode = explicit === "1" || (explicit === undefined && vercelPreview) ? "1" : "0";

const nextConfig: NextConfig = {
  // Lets the demo build live beside a dev server (npm run demo uses .next-demo).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  env: {
    NEXT_PUBLIC_DEMO_MODE: demoMode,
  },
};

export default nextConfig;
