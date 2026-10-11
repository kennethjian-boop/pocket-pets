#!/usr/bin/env node
// `npm run demo` — builds and serves Pocket Pets with the in-browser sample family.
// No real data is read or written. Uses .next-demo so it can sit beside a dev server.
import { spawn } from 'node:child_process';
import os from 'node:os';

const port = process.env.PORT ?? '3200';
const lan = Object.values(os.networkInterfaces())
  .flat()
  .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
const env = { ...process.env, NEXT_PUBLIC_DEMO_MODE: '1', NEXT_DIST_DIR: '.next-demo' };

console.log('Building the Pocket Pets demo (about a minute)…');
const build = spawn('npx next build', { env, stdio: 'inherit', shell: true });
build.on('exit', (code) => {
  if (code !== 0) process.exit(code ?? 1);
  console.log(`\nPocket Pets demo (sample data only)\n  This computer: http://localhost:${port}`);
  if (lan) console.log(`  Same Wi-Fi (phone/iPad), if your firewall allows it: http://${lan}:${port}`);
  console.log('  Tap Sign in (details are pre-filled) · parent code 1234\n');
  spawn(`npx next start -p ${port} -H 0.0.0.0`, { env, stdio: 'inherit', shell: true });
});
