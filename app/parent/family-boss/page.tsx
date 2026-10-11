'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Icon, type IconName } from '@/components/ui/Icon';
import { mockChildren } from '@/lib/mock-data';
import { BOSS_DAMAGE_OPTIONS, getNextBoss, getSharedBossReward, type BossRewardConfig } from '@/lib/boss-battle';
import { claimVictoryRewards, launchBonusAttack, startNextBoss, updateVictoryReward, type BossResult } from '@/lib/boss-sync';
import { mergeWithDefaultChildState } from '@/lib/mission-state';
import { ChildTabs, ParentBody, ParentHeader, SectionTitle, useParentToast } from '../_components/ParentUI';
import { useFamilyData } from '../_components/useFamilyData';

const REWARD_META: { key: keyof BossRewardConfig; label: string; icon: IconName }[] = [
  { key: 'stars', label: 'Stars', icon: 'star' },
  { key: 'hearts', label: 'Hearts', icon: 'heart' },
  { key: 'screenEnergy', label: 'Energy', icon: 'energy' },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function FamilyBossControlsPage() {
  const family = useFamilyData();
  const toast = useParentToast();
  const [bonusChildId, setBonusChildId] = useState(mockChildren[0]?.id ?? '');
  const [bonusDamage, setBonusDamage] = useState<number>(10);
  const [bonusTitle, setBonusTitle] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [showAll, setShowAll] = useState(false);

  const boss = family.boss;

  const run = async (key: string, action: () => Promise<BossResult>, success: string) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(key);
    const result = await action();
    busyRef.current = false;
    setBusy(null);
    family.setBoss(result.state);
    toast.show(result.ok ? success : result.message, result.ok ? 'success' : 'error');
    return result;
  };

  if (!boss) {
    return (
      <>
        <ParentHeader title="Family Boss" />
        <ParentBody>
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        </ParentBody>
      </>
    );
  }

  const hp = boss.maxHp > 0 ? Math.round((boss.currentHp / boss.maxHp) * 100) : 0;
  const reward = getSharedBossReward(boss);
  const bonusChild = mockChildren.find((c) => c.id === bonusChildId) ?? mockChildren[0];
  const attacks = showAll ? boss.attacks : boss.attacks.slice(0, 6);

  const claim = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy('claim');
    const result = await claimVictoryRewards(mockChildren);
    busyRef.current = false;
    setBusy(null);
    family.setBoss(result.state);
    Object.entries(result.childStates).forEach(([id, state]) => family.setChildState(id, state));
    if (result.ok) toast.show('Victory prizes delivered to everyone!');
    else toast.show(result.message, result.alreadyClaimed ? 'info' : 'error');
  };

  return (
    <>
      <ParentHeader title="Family Boss" subtitle={boss.weekLabel} />
      <ParentBody wide>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <section className="p-card overflow-hidden" aria-label="Current boss">
              <div className="flex items-center gap-3 bg-gradient-to-r from-plum-900 to-plum-600 p-3 text-white">
                <div className="relative h-20 w-24 shrink-0">
                  <Image src={boss.bossImage} alt={boss.bossName} fill sizes="120px" className={`object-contain ${boss.isDefeated ? 'grayscale' : ''}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-2xl font-semibold">{boss.bossName}</h2>
                  <p className="truncate text-sm font-bold text-plum-100">{boss.bossTheme}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm font-extrabold text-ink">
                  <span>{boss.isDefeated ? 'Defeated' : `${boss.currentHp} / ${boss.maxHp} HP`}</span>
                  <span className="text-ink-faint">{boss.attacks.length} hits</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-[#f1ecf7]">
                  <div className="h-full rounded-full bg-gradient-to-r from-berry-400 to-honey-300 transition-all duration-700" style={{ width: `${hp}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {mockChildren.map((c) => {
                    const dmg = boss.attacks.filter((a) => a.childId === c.id).reduce((s, a) => s + a.damage, 0);
                    return (
                      <div key={c.id} className="rounded-xl bg-[#f6f2fa] px-3 py-2">
                        <p className="text-xs font-extrabold text-ink-faint">{c.name}</p>
                        <p className="font-display text-lg font-semibold text-ink">{dmg} dmg</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {boss.isDefeated ? (
              <section className="p-card border-mint-200 bg-mint-50 p-4">
                <SectionTitle>Victory!</SectionTitle>
                <p className="mt-1 text-sm font-bold text-ink-soft">
                  {boss.rewardClaimed
                    ? `Prizes delivered. Ready for ${getNextBoss(boss.bossId).name}?`
                    : `Give each child +${reward.stars} stars, +${reward.hearts} heart and +${reward.screenEnergy} energy. This can only happen once.`}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void claim()}
                    disabled={boss.rewardClaimed || busy !== null}
                    className="min-h-12 rounded-xl bg-mint-500 text-sm font-extrabold text-white shadow-[0_3px_0_#1c8455] disabled:bg-mint-200 disabled:shadow-none"
                  >
                    {boss.rewardClaimed ? 'Prizes delivered' : busy === 'claim' ? 'Claiming…' : 'Give prizes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void run('next', startNextBoss, 'A new boss has arrived!')}
                    disabled={!boss.rewardClaimed || busy !== null}
                    className="min-h-12 rounded-xl border border-[#ece7f2] bg-white text-sm font-extrabold text-ink disabled:opacity-50"
                  >
                    Start next boss
                  </button>
                </div>
              </section>
            ) : null}

            <section className="p-card p-4" aria-label="Bonus attack">
              <SectionTitle>Bonus attack</SectionTitle>
              <p className="text-xs font-bold text-ink-faint">For real-life moments outside today&apos;s goals. Doesn&apos;t add stars or egg progress.</p>
              <div className="mt-3 grid gap-3">
                <ChildTabs
                  items={mockChildren.map((c) => ({ id: c.id, name: c.name, state: family.states[c.id] ?? mergeWithDefaultChildState(c, null) }))}
                  activeId={bonusChild.id}
                  onChange={setBonusChildId}
                />
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Damage">
                  {BOSS_DAMAGE_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="radio"
                      aria-checked={bonusDamage === d}
                      onClick={() => setBonusDamage(d)}
                      className={`min-h-12 rounded-xl border font-display text-lg font-semibold transition ${
                        bonusDamage === d ? 'border-plum-500 bg-plum-500 text-white' : 'border-[#ece7f2] bg-white text-ink'
                      }`}
                    >
                      −{d}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  placeholder="What did they do? e.g. helped a friend"
                  maxLength={60}
                  className="min-h-12 rounded-xl border border-[#ece7f2] bg-white px-3 text-[15px] font-bold text-ink placeholder:text-ink-faint focus:border-plum-300 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!bonusTitle.trim() || busy !== null || boss.isDefeated}
                  onClick={async () => {
                    const r = await run('bonus', () => launchBonusAttack(bonusChild, bonusTitle.trim(), bonusDamage), `${bonusChild.name} hit the boss for ${bonusDamage}!`);
                    if (r?.ok) setBonusTitle('');
                  }}
                  className="min-h-12 rounded-xl bg-plum-500 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  {busy === 'bonus' ? 'Launching…' : `Launch −${bonusDamage} for ${bonusChild.name}`}
                </button>
              </div>
            </section>
          </div>

          <div className="grid content-start gap-4">
            <section className="p-card p-4" aria-label="Victory prize">
              <SectionTitle>{boss.rewardClaimed ? 'Victory prize (locked)' : 'Victory prize per child'}</SectionTitle>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {REWARD_META.map((meta) => (
                  <div key={meta.key} className="rounded-xl bg-[#f6f2fa] p-2 text-center">
                    <p className="flex items-center justify-center gap-1 text-xs font-extrabold text-ink-faint">
                      <Icon name={meta.icon} size={16} /> {meta.label}
                    </p>
                    <p className="font-display text-2xl font-semibold text-ink">{reward[meta.key]}</p>
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      {[-1, 1].map((step) => (
                        <button
                          key={step}
                          type="button"
                          disabled={boss.rewardClaimed || busy !== null || (step < 0 && reward[meta.key] <= 0)}
                          onClick={() =>
                            void run(
                              'reward',
                              () => updateVictoryReward({ ...reward, [meta.key]: Math.max(0, Math.min(999, reward[meta.key] + step)) }),
                              'Victory prize updated.'
                            )
                          }
                          className="grid h-9 place-items-center rounded-lg bg-white text-ink disabled:opacity-40"
                          aria-label={`${step < 0 ? 'Decrease' : 'Increase'} ${meta.label}`}
                        >
                          <Icon name={step < 0 ? 'minus' : 'plus'} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-card p-4" aria-label="Hit log">
              <SectionTitle>Hit log</SectionTitle>
              {boss.attacks.length === 0 ? (
                <p className="mt-2 text-sm font-bold text-ink-faint">No hits yet. Verified goals and bonus attacks appear here.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[#f1ecf7]">
                  {attacks.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 py-2">
                      <Icon name={a.sourceType === 'parent_bonus' ? 'sparkle' : 'check'} size={22} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-ink">{a.title}</p>
                        <p className="text-xs font-bold text-ink-faint">
                          {a.childName} · {a.sourceType === 'parent_bonus' ? 'bonus' : 'goal'} · {formatTime(a.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 font-display text-base font-semibold text-berry-600">−{a.damage}</span>
                    </li>
                  ))}
                </ul>
              )}
              {boss.attacks.length > 6 ? (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 min-h-10 w-full text-xs font-extrabold text-plum-600">
                  {showAll ? 'Show fewer' : `Show all ${boss.attacks.length}`}
                </button>
              ) : null}
            </section>
          </div>
        </div>
      </ParentBody>
      {toast.node}
    </>
  );
}
