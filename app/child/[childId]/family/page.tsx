'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Celebration } from '@/components/child/Celebration';
import { useChildState } from '@/app/child/_components/ChildStateProvider';
import { mockChildren } from '@/lib/mock-data';
import { getBossRewardForChild, type BossBattleState } from '@/lib/boss-battle';
import { loadBossState } from '@/lib/boss-sync';

const POLL_MS = 20_000;
const SEEN_KEY = (childId: string) => `pocket-pets-boss-seen-${childId}`;

const TEAM_COLORS = ['from-sky-300 to-sky-400', 'from-berry-300 to-berry-400', 'from-honey-300 to-honey-400', 'from-mint-300 to-mint-400'];
const TEAM_DOT = ['bg-sky-400', 'bg-berry-400', 'bg-honey-400', 'bg-mint-400'];

function bossStatus(hp: number): { label: string; tone: string } {
  if (hp <= 0) return { label: 'Defeated!', tone: 'bg-mint-400 text-white' };
  if (hp <= 40) return { label: 'Weak', tone: 'bg-berry-400 text-white' };
  if (hp <= 75) return { label: 'Wobbling', tone: 'bg-honey-400 text-honey-700' };
  return { label: 'Strong', tone: 'bg-plum-500 text-white' };
}

function timeAgo(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.round(diff / 60000);
  if (Number.isNaN(minutes)) return '';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const STEPS: { icon: IconName; text: string }[] = [
  { icon: 'goals', text: 'Do a real quest' },
  { icon: 'check', text: 'A grown-up checks it' },
  { icon: 'sword', text: 'The boss takes a hit!' },
];

export default function FamilyBoss() {
  const { child, refresh } = useChildState();
  const [boss, setBoss] = useState<BossBattleState | null>(null);
  const [newHits, setNewHits] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [showAll, setShowAll] = useState(false);
  const claimedRef = useRef<boolean | null>(null);

  const load = useCallback(async () => {
    const next = await loadBossState();
    setBoss(next);
    setNow(Date.now());
    if (claimedRef.current === false && next.rewardClaimed) void refresh();
    claimedRef.current = next.rewardClaimed;

    // Play the hits that landed since this player last looked.
    try {
      const lastSeen = window.localStorage.getItem(SEEN_KEY(child.id));
      const fresh: number[] = [];
      for (const attack of next.attacks) {
        if (attack.id === lastSeen) break;
        fresh.push(attack.damage);
      }
      if (lastSeen && fresh.length > 0) setNewHits(fresh.slice(0, 5));
      if (next.attacks[0]) window.localStorage.setItem(SEEN_KEY(child.id), next.attacks[0].id);
    } catch {
      /* storage unavailable */
    }
  }, [child.id, refresh]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (newHits.length === 0) return;
    const t = window.setTimeout(() => setNewHits([]), 2600);
    return () => window.clearTimeout(t);
  }, [newHits]);

  const team = useMemo(
    () =>
      mockChildren.map((member, i) => {
        const attacks = boss?.attacks.filter((a) => a.childId === member.id) ?? [];
        return { member, i, damage: attacks.reduce((s, a) => s + a.damage, 0), hits: attacks.length };
      }),
    [boss]
  );
  const totalDamage = Math.max(1, team.reduce((s, t) => s + t.damage, 0));

  if (!boss) {
    return (
      <div className="mx-auto grid max-w-3xl gap-4 px-3 pt-4 sm:px-6">
        <div className="h-80 animate-pulse rounded-[2rem] bg-white/40" />
        <div className="h-40 animate-pulse rounded-[2rem] bg-white/40" />
      </div>
    );
  }

  const hpPercent = boss.maxHp > 0 ? Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100)) : 0;
  const status = bossStatus(boss.currentHp);
  const reward = getBossRewardForChild(boss, child.id);
  const visibleAttacks = showAll ? boss.attacks : boss.attacks.slice(0, 4);
  const hitAnimation = newHits.length > 0 ? { x: [0, -14, 12, -8, 6, 0], rotate: [0, -4, 3, -2, 0] } : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-6 pt-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start lg:gap-6">
        <div className="grid gap-4">
          {/* Battle stage */}
          <section
            aria-label={`${boss.bossName} battle`}
            className="relative isolate overflow-hidden rounded-[2rem] border-[3px] border-white/70 bg-gradient-to-b from-plum-900 via-plum-700 to-berry-400 p-4 pb-5 text-white shadow-pop sm:p-6"
          >
            <div className="pointer-events-none absolute left-1/2 top-[40%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum-300/40 blur-3xl" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-plum-200">{boss.weekLabel}</p>
                <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{boss.bossName}</h1>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 font-display text-sm font-semibold ${status.tone}`}>{status.label}</span>
            </div>

            <div className="relative mx-auto mt-1 h-[clamp(180px,30dvh,300px)] w-full max-w-md">
              <motion.div
                className="absolute inset-0"
                animate={hitAnimation ?? (boss.isDefeated ? { y: 0 } : { y: [0, -10, 0] })}
                transition={hitAnimation ? { duration: 0.6, repeat: Math.min(newHits.length, 3) - 1 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src={boss.bossImage}
                  alt={boss.bossName}
                  fill
                  sizes="(min-width: 1024px) 520px, 90vw"
                  loading="eager"
                  fetchPriority="high"
                  className={`object-contain drop-shadow-[0_18px_30px_rgb(20_10_40/0.5)] transition duration-700 ${boss.isDefeated ? 'grayscale opacity-60' : ''}`}
                />
              </motion.div>
              <AnimatePresence>
                {newHits.map((damage, i) => (
                  <motion.span
                    key={`${damage}-${i}`}
                    className="absolute left-1/2 top-1/3 font-display text-4xl font-semibold text-honey-200 drop-shadow-[0_3px_0_rgb(58_42_77)]"
                    initial={{ opacity: 0, y: 0, x: (i - 1) * 50, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 0], y: -90, scale: 1.2 }}
                    transition={{ duration: 1.3, delay: i * 0.35 }}
                  >
                    −{damage}
                  </motion.span>
                ))}
              </AnimatePresence>
              {boss.isDefeated ? (
                <>
                  <Celebration show burstKey={`win-${boss.bossId}`} />
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-2xl border-4 border-white bg-mint-400 px-5 py-2 font-display text-3xl font-semibold shadow-pop"
                    initial={{ scale: 2.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 }}
                  >
                    We won!
                  </motion.div>
                </>
              ) : null}
            </div>

            <div className="relative">
              <div className="flex items-center justify-between text-sm font-extrabold text-plum-100">
                <span className="flex items-center gap-1">
                  <Icon name="heart" size={18} /> Boss health
                </span>
                <span className="font-display text-base text-white">
                  {boss.currentHp} / {boss.maxHp}
                </span>
              </div>
              <div className="mt-1.5 h-6 overflow-hidden rounded-full bg-plum-900/60 p-1 ring-2 ring-white/30">
                <motion.div
                  className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-berry-400 via-berry-300 to-honey-300"
                  initial={false}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                  <span className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/40 motion-reduce:hidden" />
                </motion.div>
              </div>
              <p className="mt-2 text-sm font-bold text-plum-100">{boss.bossDescription}</p>
            </div>
          </section>

          {/* How it works */}
          <section className="surface p-4" aria-label="How we fight the boss">
            <ol className="grid grid-cols-3 gap-2">
              {STEPS.map((step, i) => (
                <li key={step.text} className="relative flex flex-col items-center gap-1.5 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream">
                    <Icon name={step.icon} size={step.icon === 'goals' ? 30 : 38} className={step.icon === 'goals' ? 'text-plum-500' : ''} />
                  </span>
                  <span className="text-xs font-extrabold leading-tight text-ink sm:text-sm">{step.text}</span>
                  {i < STEPS.length - 1 ? (
                    <Icon name="chevron-right" size={18} className="absolute -right-2 top-5 text-ink-faint" />
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="grid gap-4">
          {/* Team */}
          <section className="surface p-4 sm:p-5" aria-labelledby="team-title">
            <h2 id="team-title" className="font-display text-2xl font-semibold text-ink">
              Team power
            </h2>
            <ul className="mt-3 grid gap-3">
              {team.map(({ member, i, damage, hits }) => (
                <li key={member.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                      <span className={`grid h-9 w-9 place-items-center rounded-full ${TEAM_DOT[i % TEAM_DOT.length]} font-display text-base text-white`}>
                        {member.name.charAt(0)}
                      </span>
                      {member.name}
                      {member.id === child.id ? <span className="rounded-full bg-plum-50 px-2 text-xs font-extrabold text-plum-600">You</span> : null}
                    </span>
                    <span className="text-sm font-extrabold text-ink-soft">
                      {damage} damage · {hits} {hits === 1 ? 'hit' : 'hits'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${TEAM_COLORS[i % TEAM_COLORS.length]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(damage / totalDamage) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Victory rewards */}
          <section className="surface p-4 sm:p-5" aria-labelledby="reward-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="reward-title" className="font-display text-2xl font-semibold text-ink">
                Victory prize
              </h2>
              <Icon name="gift" size={34} />
            </div>
            <p className="text-sm font-bold text-ink-soft">Everyone gets this when the boss is beaten:</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { icon: 'star' as IconName, value: reward.stars, label: 'stars', bg: 'bg-honey-50' },
                { icon: 'heart' as IconName, value: reward.hearts, label: reward.hearts === 1 ? 'heart' : 'hearts', bg: 'bg-berry-50' },
                { icon: 'energy' as IconName, value: reward.screenEnergy, label: 'energy', bg: 'bg-sky-50' },
              ].map((r) => (
                <div key={r.label} className={`flex flex-col items-center rounded-2xl ${r.bg} py-2.5`}>
                  <Icon name={r.icon} size={32} />
                  <span className="font-display text-xl font-semibold text-ink">+{r.value}</span>
                  <span className="text-[11px] font-extrabold text-ink-soft">{r.label}</span>
                </div>
              ))}
            </div>
            <p
              className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold ${
                boss.rewardClaimed ? 'bg-mint-50 text-mint-700' : boss.isDefeated ? 'bg-honey-50 text-honey-700' : 'bg-white/70 text-ink-soft'
              }`}
            >
              <Icon name={boss.rewardClaimed ? 'check' : 'lock'} size={22} />
              {boss.rewardClaimed
                ? 'Prizes delivered — hooray!'
                : boss.isDefeated
                  ? 'Ask a grown-up to hand out the prizes!'
                  : 'Beat the boss together to win!'}
            </p>
          </section>

          {/* Hit feed */}
          <section className="surface p-4 sm:p-5" aria-labelledby="hits-title">
            <h2 id="hits-title" className="font-display text-2xl font-semibold text-ink">
              Recent hits
            </h2>
            {boss.attacks.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white/70 p-4 text-center text-sm font-bold text-ink-soft">
                No hits yet. Finish a quest and ask a grown-up to check it!
              </p>
            ) : (
              <>
                <ul className="mt-3 grid gap-2">
                  {visibleAttacks.map((attack) => {
                    const index = Math.max(0, mockChildren.findIndex((m) => m.id === attack.childId));
                    return (
                      <li key={attack.id} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TEAM_DOT[index % TEAM_DOT.length]}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-ink">{attack.title}</span>
                          <span className="block text-xs font-bold text-ink-faint">
                            {attack.childName}
                            {attack.sourceType === 'parent_bonus' ? ' · grown-up bonus' : ''} · {timeAgo(attack.createdAt, now)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 font-display text-base font-semibold text-berry-600">
                          <Icon name="sword" size={20} />−{attack.damage}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {boss.attacks.length > 4 ? (
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-11 w-full rounded-2xl text-sm font-extrabold text-plum-600">
                    {showAll ? 'Show fewer' : `See all ${boss.attacks.length} hits`}
                  </button>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
