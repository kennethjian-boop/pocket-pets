'use client';

/**
 * Demo mode: the Supabase client's fetch is routed to an in-browser sample
 * backend (core.mjs) whose data lives in this browser's localStorage. Nothing
 * leaves the device, so a demo build can never read or change real family data.
 */
import { getDemoState, handleRequest, resetDemo, setDemoState } from './core.mjs';

export const DEMO_SUPABASE_URL = 'https://demo.pocketpets.local';
const STORAGE_KEY = 'pocket-pets-demo-db-v1';
let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setDemoState(JSON.parse(raw));
      return;
    }
  } catch {
    /* fall through to a fresh sample family */
  }
  resetDemo('default');
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(getDemoState()));
  } catch {
    /* storage unavailable: demo still works for this page view */
  }
}

export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  ensureLoaded();
  const request = new Request(input, init);
  const text = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const out = handleRequest({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body,
  });
  if (request.method !== 'GET') persist();
  // A little latency keeps loading and saving states honest.
  await new Promise((resolve) => setTimeout(resolve, 90));
  return new Response(out.status === 204 || out.body === '' ? null : out.body, { status: out.status, headers: out.headers });
}

/** Restore the sample family (used by the demo banner's reset button). */
export function resetDemoData(scenario: 'default' | 'fresh' | 'victory' | 'rich' = 'default') {
  ensureLoaded();
  resetDemo(scenario);
  persist();
}
