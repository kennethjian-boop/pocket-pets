#!/usr/bin/env node
// Starts `next dev` on :3100 pointed at the local fake Supabase (never the real project).
import { spawn } from 'node:child_process';

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54399',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'qa-anon-key',
};
spawn('npx', ['next', 'dev', '-p', '3100'], { env, stdio: 'inherit', shell: true });
