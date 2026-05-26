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
  cardStyle,
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
import { PillButton } from '../_components/PillButton';

type NewTemplateCategory =
  | 'stars-positive'
  | 'hearts-positive'
  | 'screen-energy-positive'
  | 'stars-deduction'
  | 'hearts-deduction'
  | 'screen-energy-deduction';

type RewardSectionTone = 'stars' | 'hearts' | 'screen-energy' | 'deduction';

const categoryConfig: Record<
  NewTemplateCategory,
  { label: string; currencyType: CurrencyType; rewardType: RewardType; icon: string }
> = {
  'stars-positive': {
    label: 'Star Reward',
    currencyType: 'stars',
    rewardType: 'positive',
    icon: '⭐',
  },
  'hearts-positive': {
    label: 'Heart Reward',
    currencyType: 'hearts',
    rewardType: 'positive',
    icon: '❤️',
  },
  'screen-energy-positive': {
    label: 'Energy Reward',
    currencyType: 'screen-energy',
    rewardType: 'positive',
    icon: '⚡',
  },
  'stars-deduction': {
    label: 'Star Deduction',
    currencyType: 'stars',
    rewardType: 'deduction',
    icon: '❌',
  },
  'hearts-deduction': {
    label: 'Heart Deduction',
    currencyType: 'hearts',
    rewardType: 'deduction',
    icon: '❌',
  },
  'screen-energy-deduction': {
    label: 'Energy Deduction',
    currencyType: 'screen-energy',
    rewardType: 'deduction',
    icon: '❌',
  },
};

const sectionStyles: Record<
  RewardSectionTone,
  { border: string; bg: string; eyebrow: string; title: string; icon: string }
> = {
  stars: {
    border: 'border-amber-200',
    bg: 'bg-gradient-to-br from-amber-50 to-white',
    eyebrow: 'text-amber-700',
    title: 'Star Rewards',
    icon: '⭐',
  },
  hearts: {
    border: 'border-pink-200',
    bg: 'bg-gradient-to-br from-pink-50 to-white',
    eyebrow: 'text-pink-700',
    title: 'Heart Rewards',
    icon: '❤️',
  },
  'screen-energy': {
    border: 'border-blue-200',
    bg: 'bg-gradient-to-br from-blue-50 to-white',
    eyebrow: 'text-blue-700',
    title: 'Energy Rewards',
    icon: '⚡',
  },
  deduction: {
    border: 'border-rose-200',
    bg: 'bg-gradient-to-br from-rose-50 to-white',
    eyebrow: 'text-rose-700',
    title: 'Deductions',
    icon: '❌',
  },
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
  const existingIds = new Set(templates.map((template) => template.id));
  let index = templates.length + 1;
  while (existingIds.has(`custom-${index}`)) index += 1;
  return `custom-${index}`;
}

function StatCard({
  label,
  value,
  icon,
  tone,
  pulseClass,
}: {
  label: string;
  value: number;
  icon: string;
  tone: 'amber' | 'pink' | 'blue';
  pulseClass: string;
}) {
  const styles = {
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    pink: 'border-pink-100 bg-pink-50 text-pink-800',
    blue: 'border-blue-100 bg-blue-50 text-blue-800',
  };

  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-300 ${styles[tone]} ${pulseClass}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-black uppercase tracking-wide opacity-70">
          {label}
        </span>
        <span className="block text-xl font-black tabular-nums leading-none">{value}</span>
      </span>
    </div>
  );
}

function RewardSection({
  tone,
  helper,
  templates,
  onReward,
}: {
  tone: RewardSectionTone;
  helper: string;
  templates: RewardTemplate[];
  onReward: (template: RewardTemplate) => void;
}) {
  if (templates.length === 0) return null;
  const styles = sectionStyles[tone];

  return (
    <section className={`rounded-3xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          {styles.icon}
        </span>
        <div className="min-w-0">
          <h3 className={`text-sm font-black uppercase tracking-wide ${styles.eyebrow}`}>
            {styles.title}
          </h3>
          <p className="text-xs font-semibold leading-snug text-slate-500">{helper}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((template) => (
          <PillButton
            key={template.id}
            template={template}
            onReward={() => onReward(template)}
          />
        ))}
      </div>
    </section>
  );
}

export default function RewardsPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>(
    defaultRewardTemplates
  );
  const [rewardEditorOpen, setRewardEditorOpen] = useState(false);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void buildDashboardStatesFromSupabase().then((hydrated) => {
      setDashboardStates(hydrated);
      setRewardTemplates(loadSavedRewardTemplates());
      setChildrenData((cur) =>
        cur.map((child) => {
          const s = hydrated[child.id];
          return { ...child, stars: s.stars, hearts: s.hearts, screenEnergy: s.screenEnergy };
        })
      );
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

  const getPanelClass = (childId: string) =>
    panelHighlight?.childId === childId ? panelHighlightClass[panelHighlight.tone] : '';

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
        `${delta > 0 ? '+' : '-'}${Math.abs(delta)} ${
          currencyEmoji[template.currencyType]
        } ${currencyLabel[template.currencyType]} ${verb} ${child.name}: ${template.label}`,
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

  const handleTemplateEdit = (id: string, field: 'label' | 'amount', value: string) => {
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
      persistRewardTemplates(next);
      return next;
    });
  };

  const handleResetTemplates = () => {
    setRewardTemplates(defaultRewardTemplates);
    persistRewardTemplates(defaultRewardTemplates);
    showFeedback('Reward values reset to defaults.', 'info');
  };

  const handleAddTemplate = () => {
    const label = newLabel.trim();
    if (!label) {
      setAddError('Please enter a label.');
      return;
    }
    const amount = Math.floor(Number(newAmount));
    if (!amount || amount <= 0) {
      setAddError('Amount must be more than 0.');
      return;
    }
    setRewardTemplates((cur) => {
      const selected = categoryConfig[newCategory];
      const newTemplate: RewardTemplate = {
        id: getNextCustomTemplateId(cur),
        label,
        icon: selected.icon,
        amount,
        currencyType: selected.currencyType,
        rewardType: selected.rewardType,
      };
      const next = [...cur, newTemplate];
      persistRewardTemplates(next);
      return next;
    });
    setNewLabel('');
    setNewAmount('1');
    setAddError('');
    showFeedback(`"${label}" reward added.`, 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    setRewardTemplates((cur) => {
      const next = cur.filter((t) => t.id !== id);
      persistRewardTemplates(next);
      return next;
    });
  };

  const starRewards = rewardTemplates.filter(
    (t) => t.rewardType === 'positive' && t.currencyType === 'stars'
  );
  const heartRewards = rewardTemplates.filter(
    (t) => t.rewardType === 'positive' && t.currencyType === 'hearts'
  );
  const energyRewards = rewardTemplates.filter(
    (t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy'
  );
  const deductionTemplates = rewardTemplates.filter((t) => t.rewardType === 'deduction');

  const editorGroups: { label: string; color: string; templates: RewardTemplate[] }[] = [
    { label: 'Star Rewards', color: 'text-amber-700', templates: starRewards },
    { label: 'Heart Rewards', color: 'text-pink-600', templates: heartRewards },
    { label: 'Energy Rewards', color: 'text-blue-600', templates: energyRewards },
    { label: 'Deductions', color: 'text-rose-600', templates: deductionTemplates },
  ].filter((g) => g.templates.length > 0);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-xl">🐾</span>
          <span className="text-base font-extrabold text-slate-800">
            Pocket <span className="text-pink-500">Pets</span>
          </span>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-xl font-black text-slate-900">Rewards</h1>
          {lastAction ? (
            <p className="text-xs font-semibold text-slate-400">Last: {lastAction}</p>
          ) : (
            <p className="text-xs font-semibold text-slate-400">
              Give quick rewards and adjust family reward buttons.
            </p>
          )}
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
        <div className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          <AnimatePresence>
            {feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className={`rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${feedbackClass[feedback.tone]}`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {childrenData.map((child) => (
              <article
                key={child.id}
                className={`${cardStyle} transition-all duration-300 ${getPanelClass(child.id)}`}
              >
                <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 text-2xl font-black text-purple-700 shadow-sm">
                        {child.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-2xl font-black text-slate-900">
                          {child.name}
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Quick add rewards
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRewardEditorOpen((o) => !o)}
                      className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 transition hover:bg-purple-100 active:scale-95"
                    >
                      ✏️ Edit values
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <StatCard
                      label="Stars"
                      value={child.stars}
                      icon="⭐"
                      tone="amber"
                      pulseClass={getStatClass(child.id, 'stars')}
                    />
                    <StatCard
                      label="Hearts"
                      value={child.hearts}
                      icon="❤️"
                      tone="pink"
                      pulseClass={getStatClass(child.id, 'hearts')}
                    />
                    <StatCard
                      label="Energy"
                      value={child.screenEnergy}
                      icon="⚡"
                      tone="blue"
                      pulseClass={getStatClass(child.id, 'screenEnergy')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:p-5">
                  <RewardSection
                    tone="stars"
                    helper="Positive task and productivity rewards."
                    templates={starRewards}
                    onReward={(template) => handleReward(child.id, template)}
                  />
                  <RewardSection
                    tone="hearts"
                    helper="Emotional, social, and resilience moments."
                    templates={heartRewards}
                    onReward={(template) => handleReward(child.id, template)}
                  />
                  <RewardSection
                    tone="screen-energy"
                    helper="Weekend screen-time energy adjustments."
                    templates={energyRewards}
                    onReward={(template) => handleReward(child.id, template)}
                  />
                  <RewardSection
                    tone="deduction"
                    helper="Consequences always show the affected currency."
                    templates={deductionTemplates}
                    onReward={(template) => handleReward(child.id, template)}
                  />
                </div>
              </article>
            ))}
          </section>

          <section className={cardStyle}>
            <button
              type="button"
              onClick={() => setRewardEditorOpen((o) => !o)}
              className="flex w-full items-center justify-between px-5 py-5 text-left transition hover:bg-slate-50"
            >
              <div>
                <h2 className="text-base font-black text-slate-900">✏️ Manage Reward Values</h2>
                <p className="mt-0.5 text-sm font-semibold text-slate-400">
                  Edit labels and amounts, then add custom rewards with explicit currency.
                </p>
              </div>
              <span className="ml-4 shrink-0 text-slate-400">
                {rewardEditorOpen ? '▲' : '▼'}
              </span>
            </button>

            <AnimatePresence>
              {rewardEditorOpen && (
                <motion.div
                  key="reward-editor"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                      <p className="text-sm font-semibold text-slate-500">
                        Saved reward buttons update immediately and persist locally.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetTemplates}
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                      >
                        Reset defaults
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {editorGroups.map((group) => (
                        <div key={group.label} className="px-5 py-5">
                          <p className={`mb-3 text-xs font-black uppercase tracking-wide ${group.color}`}>
                            {group.label}
                          </p>
                          <div className="grid gap-2 lg:grid-cols-2">
                            {group.templates.map((template) => {
                              const delta = getRewardDelta(template);
                              return (
                                <div
                                  key={template.id}
                                  className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_112px_auto] sm:items-center"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                                      {template.icon}
                                    </span>
                                    <input
                                      type="text"
                                      value={template.label}
                                      onChange={(e) =>
                                        handleTemplateEdit(template.id, 'label', e.target.value)
                                      }
                                      className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                      placeholder="Label"
                                    />
                                  </div>
                                  <input
                                    type="number"
                                    min={0}
                                    value={template.amount}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'amount', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                  />
                                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                                      {currencyEmoji[template.currencyType]}{' '}
                                      {delta > 0 ? '+' : '-'}
                                      {Math.abs(delta)} {currencyLabel[template.currencyType]}
                                    </span>
                                    {template.id.startsWith('custom-') ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-xl font-black text-rose-500 transition hover:bg-rose-100 active:scale-95"
                                        aria-label={`Delete ${template.label}`}
                                      >
                                        ×
                                      </button>
                                    ) : (
                                      <span className="h-9 w-9 shrink-0" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
                      <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        Add Custom Reward
                      </p>
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_92px_auto] lg:items-end">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-400">Label</span>
                          <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => {
                              setNewLabel(e.target.value);
                              setAddError('');
                            }}
                            placeholder="e.g. Homework"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-400">Currency & action</span>
                          <select
                            value={newCategory}
                            onChange={(e) => {
                              setNewCategory(e.target.value as NewTemplateCategory);
                              setAddError('');
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                          >
                            {Object.entries(categoryConfig).map(([value, config]) => (
                              <option key={value} value={value}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-400">Amount</span>
                          <input
                            type="number"
                            min={1}
                            value={newAmount}
                            onChange={(e) => {
                              setNewAmount(e.target.value);
                              setAddError('');
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleAddTemplate}
                          className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-purple-700 active:scale-95"
                        >
                          Add
                        </button>
                      </div>
                      {addError && (
                        <p className="mt-2 text-sm font-bold text-rose-500">{addError}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </motion.main>
    </>
  );
}
