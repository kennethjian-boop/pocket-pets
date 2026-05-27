'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { mockChildren } from '@/lib/mock-data';
import {
  CurrencyType,
  RewardTemplate,
  RewardType,
  currencyEmoji,
  currencyLabel,
  defaultRewardTemplates,
  getRewardDelta,
} from '@/lib/reward-templates';
import { saveChildDashboardState } from '@/lib/mission-state';
import {
  buildDashboardStates,
  buildDashboardStatesFromSupabase,
  feedbackClass,
  loadSavedRewardTemplates,
  panelHighlightClass,
  persistRewardTemplates,
  statPulseClass,
  DashboardStateByChild,
  FeedbackState,
  FeedbackTone,
  MockChild,
  PanelHighlight,
  StatKey,
  StatPulse,
} from '../_lib';
import { fetchRewardTemplates, upsertRewardTemplates } from '@/lib/supabase-reward-templates';
import { PillButton } from '../_components/PillButton';

type NewTemplateCategory =
  | 'stars-positive'
  | 'hearts-positive'
  | 'screen-energy-positive'
  | 'stars-deduction'
  | 'hearts-deduction'
  | 'screen-energy-deduction';

const categoryConfig: Record<
  NewTemplateCategory,
  { label: string; currencyType: CurrencyType; rewardType: RewardType; icon: string }
> = {
  'stars-positive': { label: 'Star Reward', currencyType: 'stars', rewardType: 'positive', icon: '⭐' },
  'hearts-positive': { label: 'Heart Reward', currencyType: 'hearts', rewardType: 'positive', icon: '❤️' },
  'screen-energy-positive': { label: 'Energy Reward', currencyType: 'screen-energy', rewardType: 'positive', icon: '⚡' },
  'stars-deduction': { label: 'Star Deduction', currencyType: 'stars', rewardType: 'deduction', icon: '❌' },
  'hearts-deduction': { label: 'Heart Deduction', currencyType: 'hearts', rewardType: 'deduction', icon: '❌' },
  'screen-energy-deduction': { label: 'Energy Deduction', currencyType: 'screen-energy', rewardType: 'deduction', icon: '❌' },
};

function applyCurrencyChange(
  child: MockChild,
  currencyType: CurrencyType,
  delta: number
): MockChild {
  if (currencyType === 'stars') return { ...child, stars: Math.max(0, child.stars + delta) };
  if (currencyType === 'hearts') return { ...child, hearts: Math.max(0, child.hearts + delta) };
  return { ...child, screenEnergy: Math.max(0, child.screenEnergy + delta) };
}

function getNextCustomTemplateId(templates: RewardTemplate[]): string {
  const existingIds = new Set(templates.map((t) => t.id));
  let index = templates.length + 1;
  while (existingIds.has(`custom-${index}`)) index += 1;
  return `custom-${index}`;
}

function StatStrip({
  child,
  getStatClass,
}: {
  child: MockChild;
  getStatClass: (childId: string, stat: StatKey) => string;
}) {
  const stats: { label: string; value: number; icon: string; key: StatKey; toneClass: string }[] = [
    { label: 'Stars', value: child.stars, icon: '⭐', key: 'stars', toneClass: 'border-amber-100 bg-amber-50 text-amber-800' },
    { label: 'Hearts', value: child.hearts, icon: '❤️', key: 'hearts', toneClass: 'border-pink-100 bg-pink-50 text-pink-800' },
    { label: 'Energy', value: child.screenEnergy, icon: '⚡', key: 'screenEnergy', toneClass: 'border-blue-100 bg-blue-50 text-blue-800' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ label, value, icon, key, toneClass }) => (
        <div
          key={key}
          className={`flex flex-col items-center rounded-2xl border px-2 py-3 transition-all duration-300 ${toneClass} ${getStatClass(child.id, key)}`}
        >
          <span className="text-xl">{icon}</span>
          <span className="text-2xl font-black tabular-nums leading-none">{value}</span>
          <span className="mt-0.5 text-[10px] font-black uppercase tracking-wide opacity-70">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RewardsPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>(defaultRewardTemplates);
  const [activeTab, setActiveTab] = useState<string>(mockChildren[0]?.id ?? 'templates');
  const [newIcon, setNewIcon] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<NewTemplateCategory>('stars-positive');
  const [newAmount, setNewAmount] = useState('1');
  const [addError, setAddError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastAction, setLastAction] = useState('');
  const [panelHighlight, setPanelHighlight] = useState<PanelHighlight | null>(null);
  const [statPulse, setStatPulse] = useState<StatPulse[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveRewardTemplates = (templates: RewardTemplate[]) => {
    persistRewardTemplates(templates);
    void upsertRewardTemplates(templates);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([
        buildDashboardStatesFromSupabase(),
        fetchRewardTemplates(),
      ]).then(([hydrated, remoteTemplates]) => {
        setDashboardStates(hydrated);
        setChildrenData((cur) =>
          cur.map((child) => {
            const s = hydrated[child.id];
            return { ...child, stars: s.stars, hearts: s.hearts, screenEnergy: s.screenEnergy };
          })
        );
        if (remoteTemplates) {
          persistRewardTemplates(remoteTemplates);
          setRewardTemplates(remoteTemplates);
        } else {
          const localTemplates = loadSavedRewardTemplates();
          setRewardTemplates(localTemplates);
          void upsertRewardTemplates(localTemplates);
        }
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
      if (statTimerRef.current) clearTimeout(statTimerRef.current);
    };
  }, []);

  const showFeedback = (message: string, tone: FeedbackTone = 'success') => {
    setFeedback({ message, tone });
    setLastAction(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 1800);
  };

  const highlightChildPanel = (childId: string, tone: FeedbackTone) => {
    setPanelHighlight({ childId, tone });
    if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
    panelTimerRef.current = setTimeout(() => {
      setPanelHighlight(null);
      panelTimerRef.current = null;
    }, 800);
  };

  const pulseChildStat = (childId: string, stat: StatKey) => {
    if (!childId) return;
    setStatPulse((cur) => [
      ...cur.filter((item) => !(item.childId === childId && item.stat === stat)),
      { childId, stat },
    ]);
    if (statTimerRef.current) clearTimeout(statTimerRef.current);
    statTimerRef.current = setTimeout(() => {
      setStatPulse([]);
      statTimerRef.current = null;
    }, 650);
  };

  const getStatClass = (childId: string, stat: StatKey) =>
    statPulse.some((item) => item.childId === childId && item.stat === stat)
      ? statPulseClass[stat]
      : '';

  const handleReward = (childId: string, template: RewardTemplate) => {
    const delta = getRewardDelta(template);
    const child = childrenData.find((c) => c.id === childId);
    const statKey: StatKey =
      template.currencyType === 'screen-energy' ? 'screenEnergy' : template.currencyType;

    if (child) {
      const tone: FeedbackTone = delta < 0 ? 'warning' : 'success';
      const verb = delta < 0 ? 'deducted from' : 'added to';
      showFeedback(
        `${delta > 0 ? '+' : '-'}${Math.abs(delta)} ${currencyEmoji[template.currencyType]} ${currencyLabel[template.currencyType]} ${verb} ${child.name}: ${template.label}`,
        tone
      );
      highlightChildPanel(child.id, tone);
      pulseChildStat(child.id, statKey);
    }

    setChildrenData((cur) =>
      cur.map((c) => {
        if (c.id !== childId) return c;
        const nextChild = applyCurrencyChange(c, template.currencyType, delta);
        const nextState = saveChildDashboardState(c.id, c, {
          stars: nextChild.stars,
          hearts: nextChild.hearts,
          screenEnergy: nextChild.screenEnergy,
        });
        setDashboardStates((ds) => ({ ...ds, [c.id]: nextState }));
        return nextChild;
      })
    );
  };

  const handleTemplateEdit = (id: string, field: 'icon' | 'label' | 'amount', value: string) => {
    setRewardTemplates((cur) => {
      const next = cur.map((t) =>
        t.id === id
          ? {
              ...t,
              [field]:
                field === 'amount'
                  ? Math.max(0, Math.floor(Number(value) || 0))
                  : value,
            }
          : t
      );
      saveRewardTemplates(next);
      return next;
    });
  };

  const handleResetTemplates = () => {
    setRewardTemplates(defaultRewardTemplates);
    saveRewardTemplates(defaultRewardTemplates);
    showFeedback('Reward values reset to defaults.', 'info');
  };

  const handleAddTemplate = () => {
    const label = newLabel.trim();
    if (!label) { setAddError('Please enter a label.'); return; }
    const amount = Math.floor(Number(newAmount));
    if (!amount || amount <= 0) { setAddError('Amount must be more than 0.'); return; }
    setRewardTemplates((cur) => {
      const selected = categoryConfig[newCategory];
      const newTemplate: RewardTemplate = {
        id: getNextCustomTemplateId(cur),
        label,
        icon: newIcon.trim() || selected.icon,
        amount,
        currencyType: selected.currencyType,
        rewardType: selected.rewardType,
      };
      const next = [...cur, newTemplate];
      saveRewardTemplates(next);
      return next;
    });
    setNewIcon('');
    setNewLabel('');
    setNewAmount('1');
    setAddError('');
    showFeedback(`"${label}" reward added.`, 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    setRewardTemplates((cur) => {
      const next = cur.filter((t) => t.id !== id);
      saveRewardTemplates(next);
      return next;
    });
  };

  const positiveTemplates = rewardTemplates.filter((t) => t.rewardType === 'positive');
  const deductionTemplates = rewardTemplates.filter((t) => t.rewardType === 'deduction');

  const editorGroups: { label: string; color: string; templates: RewardTemplate[] }[] = [
    { label: 'Star Rewards', color: 'text-amber-700', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'stars') },
    { label: 'Heart Rewards', color: 'text-pink-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'hearts') },
    { label: 'Energy Rewards', color: 'text-blue-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy') },
    { label: 'Deductions', color: 'text-rose-600', templates: deductionTemplates },
  ].filter((g) => g.templates.length > 0);

  const activeChild = childrenData.find((c) => c.id === activeTab);

  const tabs = [
    ...mockChildren.map((c) => ({ id: c.id, label: c.name })),
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl lg:hidden">🎁</span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 lg:text-lg">Rewards</h1>
            {lastAction && (
              <p className="text-xs text-slate-400">Last: {lastAction}</p>
            )}
          </div>
        </div>
        <Link href="/">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          >
            ← Exit
          </button>
        </Link>
      </header>

      <motion.main
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
          {/* Feedback toast */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mb-3 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm ${feedbackClass[feedback.tone]}`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
          <div className="mb-4 flex gap-1.5 rounded-2xl bg-slate-100 p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.id === 'templates' ? '✏️ ' : ''}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CHILD TAB ───────────────────────────────────────────────────── */}
          {activeChild && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Stats card */}
              <div
                className={`rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg transition-all duration-300 ${
                  panelHighlight?.childId === activeChild.id
                    ? panelHighlightClass[panelHighlight.tone]
                    : ''
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 text-lg font-black text-purple-700 shadow-sm">
                    {activeChild.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{activeChild.name}</h2>
                    <p className="text-xs font-bold text-slate-400">Current balance</p>
                  </div>
                </div>
                <StatStrip child={activeChild} getStatClass={getStatClass} />
              </div>

              {/* Quick rewards grid */}
              {positiveTemplates.length > 0 && (
                <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                    ⭐ Quick Rewards
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {positiveTemplates.map((template) => (
                      <PillButton
                        key={template.id}
                        template={template}
                        onReward={() => handleReward(activeChild.id, template)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Consequences grid */}
              {deductionTemplates.length > 0 && (
                <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-4 shadow-lg">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-rose-600">
                    ❌ Consequences
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {deductionTemplates.map((template) => (
                      <PillButton
                        key={template.id}
                        template={template}
                        onReward={() => handleReward(activeChild.id, template)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TEMPLATES TAB ───────────────────────────────────────────────── */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Add custom reward */}
              <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-purple-600">
                  ➕ Add Custom Reward
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      placeholder="⭐"
                      className="w-14 shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-base font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    />
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => {
                        setNewLabel(e.target.value);
                        setAddError('');
                      }}
                      placeholder="Label (e.g. Homework Hero)"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value as NewTemplateCategory);
                        setAddError('');
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    >
                      {Object.entries(categoryConfig).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={newAmount}
                      onChange={(e) => {
                        setNewAmount(e.target.value);
                        setAddError('');
                      }}
                      className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    />
                    <button
                      type="button"
                      onClick={handleAddTemplate}
                      className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-purple-700 active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                  {addError && (
                    <p className="text-xs font-bold text-rose-500">{addError}</p>
                  )}
                </div>
              </div>

              {/* Template groups */}
              {editorGroups.map((group) => (
                <div
                  key={group.label}
                  className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg"
                >
                  <p className={`mb-3 text-xs font-black uppercase tracking-wide ${group.color}`}>
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.templates.map((template) => {
                      const delta = getRewardDelta(template);
                      return (
                        <div
                          key={template.id}
                          className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5"
                        >
                          <input
                            type="text"
                            value={template.icon}
                            onChange={(e) =>
                              handleTemplateEdit(template.id, 'icon', e.target.value)
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-center text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-300"
                          />
                          <input
                            type="text"
                            value={template.label}
                            onChange={(e) =>
                              handleTemplateEdit(template.id, 'label', e.target.value)
                            }
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                          />
                          <input
                            type="number"
                            min={0}
                            value={template.amount}
                            onChange={(e) =>
                              handleTemplateEdit(template.id, 'amount', e.target.value)
                            }
                            className="w-14 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                          />
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600 shadow-sm">
                            {currencyEmoji[template.currencyType]}{' '}
                            {delta > 0 ? '+' : '-'}
                            {Math.abs(delta)}
                          </span>
                          {template.id.startsWith('custom-') ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-lg font-black text-rose-500 transition hover:bg-rose-100 active:scale-95"
                              aria-label={`Delete ${template.label}`}
                            >
                              ×
                            </button>
                          ) : (
                            <span className="h-8 w-8 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Reset defaults */}
              <button
                type="button"
                onClick={handleResetTemplates}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
              >
                Reset to defaults
              </button>
            </motion.div>
          )}
        </div>
      </motion.main>
    </>
  );
}
