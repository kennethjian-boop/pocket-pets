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
    { label: 'Stars', value: child.stars, icon: '⭐', key: 'stars', toneClass: 'border-amber-100/70 bg-amber-50 text-amber-800' },
    { label: 'Hearts', value: child.hearts, icon: '❤️', key: 'hearts', toneClass: 'border-pink-100/70 bg-pink-50 text-pink-800' },
    { label: 'Energy', value: child.screenEnergy, icon: '⚡', key: 'screenEnergy', toneClass: 'border-blue-100/70 bg-blue-50 text-blue-800' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ label, value, icon, key, toneClass }) => (
        <div
          key={key}
          className={`flex flex-col items-center justify-center rounded-xl border px-1.5 py-2 transition-all duration-300 ${toneClass} ${getStatClass(child.id, key)}`}
        >
          <span className="flex items-center gap-1">
            <span className="text-sm">{icon}</span>
            <span className="text-lg font-black tabular-nums leading-none">{value}</span>
          </span>
          <span className="mt-0.5 text-[9px] font-black uppercase tracking-wide opacity-70">{label}</span>
        </div>
      ))}
    </div>
  );
}

function DailyRewardButton({
  template,
  onReward,
}: {
  template: RewardTemplate;
  onReward: () => void;
}) {
  const delta = getRewardDelta(template);
  const isDeduction = delta < 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onReward}
      className={`flex min-h-[54px] min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left shadow-sm transition active:scale-95 ${
        isDeduction
          ? 'border-rose-100 bg-white text-rose-950 hover:bg-rose-50'
          : 'border-slate-100 bg-white text-slate-900 hover:bg-slate-50'
      }`}
      aria-label={`${isDeduction ? 'Deduct' : 'Add'} ${Math.abs(delta)} ${
        currencyLabel[template.currencyType]
      } for ${template.label}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-base">
        {template.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold leading-tight">
          {template.label}
        </span>
        <span className={`mt-0.5 block text-xs font-black ${isDeduction ? 'text-rose-500' : 'text-slate-500'}`}>
          {delta > 0 ? '+' : '-'}{Math.abs(delta)} {currencyLabel[template.currencyType].toLowerCase()}
        </span>
      </span>
    </motion.button>
  );
}

export default function RewardsPage() {
  const [childrenData, setChildrenData] = useState(mockChildren);
  const [, setDashboardStates] = useState<DashboardStateByChild>(
    () => buildDashboardStates(false)
  );
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>(defaultRewardTemplates);
  const [activeChildId, setActiveChildId] = useState<string>(mockChildren[0]?.id ?? '');
  const [isManaging, setIsManaging] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
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

  const handleTemplateEdit = (
    id: string,
    field: 'icon' | 'label' | 'amount' | 'currencyType' | 'rewardType',
    value: string
  ) => {
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
    setIsCreatingTemplate(false);
    showFeedback(`"${label}" reward added.`, 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    setRewardTemplates((cur) => {
      const next = cur.filter((t) => t.id !== id);
      saveRewardTemplates(next);
      return next;
    });
    setExpandedTemplateId(null);
  };

  const deductionTemplates = rewardTemplates.filter((t) => t.rewardType === 'deduction');
  const rewardGroups: { label: string; color: string; templates: RewardTemplate[] }[] = [
    { label: 'Star Rewards', color: 'text-amber-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'stars') },
    { label: 'Heart Rewards', color: 'text-pink-500', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'hearts') },
    { label: 'Screen Energy', color: 'text-blue-500', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy') },
  ].filter((group) => group.templates.length > 0);

  const editorGroups: { label: string; color: string; templates: RewardTemplate[] }[] = [
    { label: 'Star Rewards', color: 'text-amber-700', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'stars') },
    { label: 'Heart Rewards', color: 'text-pink-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'hearts') },
    { label: 'Screen Energy', color: 'text-blue-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy') },
    { label: 'Consequences', color: 'text-rose-600', templates: deductionTemplates },
  ].filter((g) => g.templates.length > 0);

  const activeChild = childrenData.find((c) => c.id === activeChildId);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl lg:hidden">🎁</span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 lg:text-lg">
              {isManaging ? 'Manage Rewards' : 'Rewards'}
            </h1>
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

          {!isManaging && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5">
                {mockChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setActiveChildId(child.id)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                      activeChildId === child.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>

              {activeChild && (
                <>
                  <div
                    className={`rounded-2xl border border-white/50 bg-white/90 p-3 shadow-md transition-all duration-300 ${
                      panelHighlight?.childId === activeChild.id
                        ? panelHighlightClass[panelHighlight.tone]
                        : ''
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-slate-900">{activeChild.name}</h2>
                        <p className="text-xs font-bold text-slate-400">Current balance</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManaging(true)}
                        className="shrink-0 rounded-full border border-purple-100/70 bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700 shadow-sm transition hover:bg-purple-100 active:scale-95"
                      >
                        ⚙ Manage Rewards
                      </button>
                    </div>
                    <StatStrip child={activeChild} getStatClass={getStatClass} />
                  </div>

                  {rewardGroups.map((group) => (
                    <section
                      key={group.label}
                      className="rounded-2xl border border-white/50 bg-white/90 p-3 shadow-md"
                    >
                      <h2 className={`mb-1.5 text-[10px] font-extrabold uppercase tracking-wide ${group.color}`}>
                        {group.label}
                      </h2>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {group.templates.map((template) => (
                          <DailyRewardButton
                            key={template.id}
                            template={template}
                            onReward={() => handleReward(activeChild.id, template)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}

                  {deductionTemplates.length > 0 && (
                    <section className="rounded-2xl border border-rose-100/70 bg-rose-50/50 p-3 shadow-md">
                      <h2 className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-500">
                        Consequences
                      </h2>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {deductionTemplates.map((template) => (
                          <DailyRewardButton
                            key={template.id}
                            template={template}
                            onReward={() => handleReward(activeChild.id, template)}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </motion.div>
          )}

          {isManaging && (
            <motion.div
              key="manage-rewards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setIsManaging(false)}
                className="text-sm font-black text-purple-700 transition hover:text-purple-900 active:scale-95"
              >
                ← Back to rewards
              </button>

              <div className="rounded-2xl border border-purple-100/70 bg-white/90 shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTemplate((current) => !current);
                    setExpandedTemplateId(null);
                    setAddError('');
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-sm font-black text-purple-700 transition hover:bg-purple-50 active:scale-[0.99]"
                  aria-expanded={isCreatingTemplate}
                >
                  <span>＋ Create Reward</span>
                  <span className="text-base" aria-hidden="true">{isCreatingTemplate ? '−' : '+'}</span>
                </button>
                {isCreatingTemplate && (
                  <div className="space-y-2 border-t border-purple-100/70 px-3.5 py-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        placeholder="⭐"
                        aria-label="New reward icon"
                        className="w-12 shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-base font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => {
                          setNewLabel(e.target.value);
                          setAddError('');
                        }}
                        placeholder="Label (e.g. Homework Hero)"
                        aria-label="New reward label"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value as NewTemplateCategory);
                          setAddError('');
                        }}
                        aria-label="New reward category"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
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
                        aria-label="New reward amount"
                        className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddTemplate}
                        className="rounded-xl bg-purple-600 px-3.5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-purple-700 active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                    {addError && (
                      <p className="text-xs font-bold text-rose-500">{addError}</p>
                    )}
                  </div>
                )}
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
                  <div className="space-y-1.5">
                    {group.templates.map((template) => {
                      const delta = getRewardDelta(template);
                      const isExpanded = expandedTemplateId === template.id;
                      return (
                        <div
                          key={template.id}
                          className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedTemplateId(isExpanded ? null : template.id);
                              setIsCreatingTemplate(false);
                            }}
                            className="flex min-h-12 w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-white active:scale-[0.99]"
                            aria-expanded={isExpanded}
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                              {template.icon}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-800">
                              {template.label}
                            </span>
                            <span className={`shrink-0 text-xs font-black ${delta < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                              {delta > 0 ? '+' : '-'}{Math.abs(delta)} {currencyEmoji[template.currencyType]}
                            </span>
                            <span className="shrink-0 text-xs font-black text-slate-400" aria-hidden="true">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="space-y-3 border-t border-slate-100 bg-white/80 px-3 py-3">
                              <div className="grid grid-cols-[48px_minmax(0,1fr)_68px] gap-2">
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                                  Icon
                                  <input
                                    type="text"
                                    value={template.icon}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'icon', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-base text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                  />
                                </label>
                                <label className="min-w-0 space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                                  Label
                                  <input
                                    type="text"
                                    value={template.label}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'label', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-bold normal-case tracking-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                  />
                                </label>
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                                  Amount
                                  <input
                                    type="number"
                                    min={0}
                                    value={template.amount}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'amount', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-black tracking-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                  />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                                  Currency
                                  <select
                                    value={template.currencyType}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'currencyType', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold normal-case tracking-normal text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                  >
                                    {Object.entries(currencyLabel).map(([value, label]) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                                  Type
                                  <select
                                    value={template.rewardType}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'rewardType', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold normal-case tracking-normal text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                  >
                                    <option value="positive">Reward</option>
                                    <option value="deduction">Consequence</option>
                                  </select>
                                </label>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                {template.id.startsWith('custom-') ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="text-xs font-black text-rose-500 transition hover:text-rose-700 active:scale-95"
                                  >
                                    Delete reward
                                  </button>
                                ) : (
                                  <span />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedTemplateId(null)}
                                  className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-200 active:scale-95"
                                >
                                  Collapse
                                </button>
                              </div>
                            </div>
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
