'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
import { mergeWithDefaultChildState } from '@/lib/mission-state';
import { adjustCurrencies } from '@/lib/child-economy';
import { Icon } from '@/components/ui/Icon';
import { loadSavedRewardTemplates, persistRewardTemplates } from '../_lib';
import { fetchRewardTemplates, upsertRewardTemplates } from '@/lib/supabase-reward-templates';
import { Balances, ChildTabs, ParentBody, ParentHeader, SectionTitle, useParentToast } from '../_components/ParentUI';
import { useFamilyData } from '../_components/useFamilyData';

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

function getNextCustomTemplateId(templates: RewardTemplate[]): string {
  const existingIds = new Set(templates.map((t) => t.id));
  let index = templates.length + 1;
  while (existingIds.has(`custom-${index}`)) index += 1;
  return `custom-${index}`;
}

function toDelta(template: RewardTemplate) {
  const delta = getRewardDelta(template);
  if (template.currencyType === 'stars') return { stars: delta };
  if (template.currencyType === 'hearts') return { hearts: delta };
  return { screenEnergy: delta };
}

function RewardButton({
  template,
  busy,
  armed,
  onPress,
}: {
  template: RewardTemplate;
  busy: boolean;
  armed: boolean;
  onPress: () => void;
}) {
  const delta = getRewardDelta(template);
  const isDeduction = delta < 0;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={busy}
      className={`flex min-h-[58px] min-w-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.98] disabled:opacity-60 ${
        armed
          ? 'border-berry-400 bg-berry-500 text-white'
          : isDeduction
            ? 'border-berry-100 bg-white text-ink hover:bg-berry-50'
            : 'border-[#ece7f2] bg-white text-ink hover:border-plum-200'
      }`}
      aria-label={`${isDeduction ? 'Deduct' : 'Add'} ${Math.abs(delta)} ${currencyLabel[template.currencyType]} for ${template.label}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg ${armed ? 'bg-white/20' : 'bg-[#f6f2fa]'}`}>{template.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold leading-tight">{armed ? 'Tap again to deduct' : template.label}</span>
        <span className={`mt-0.5 block text-xs font-extrabold ${armed ? 'text-white/90' : isDeduction ? 'text-berry-600' : 'text-ink-faint'}`}>
          {delta > 0 ? '+' : '−'}
          {Math.abs(delta)} {currencyLabel[template.currencyType].toLowerCase()}
        </span>
      </span>
    </button>
  );
}

export default function RewardsPage() {
  const family = useFamilyData();
  const toast = useParentToast();
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
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [armed, setArmed] = useState<string | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (message: string, tone: 'success' | 'info' | 'warning' = 'success') =>
    toast.show(message, tone === 'warning' ? 'error' : tone);

  const saveRewardTemplates = (templates: RewardTemplate[]) => {
    persistRewardTemplates(templates);
    void upsertRewardTemplates(templates);
  };

  useEffect(() => {
    let cancelled = false;
    void fetchRewardTemplates().then((remote) => {
      if (cancelled) return;
      if (remote) {
        persistRewardTemplates(remote);
        setRewardTemplates(remote);
      } else {
        const local = loadSavedRewardTemplates();
        setRewardTemplates(local);
        void upsertRewardTemplates(local);
      }
    });
    return () => {
      cancelled = true;
      if (armTimer.current) clearTimeout(armTimer.current);
    };
  }, []);

  const activeChild = mockChildren.find((c) => c.id === activeChildId) ?? mockChildren[0];
  const activeState = family.states[activeChild.id] ?? mergeWithDefaultChildState(activeChild, null);

  const applyReward = async (template: RewardTemplate) => {
    if (busyRef.current) return;
    const key = `${activeChild.id}:${template.id}`;
    const delta = getRewardDelta(template);
    if (delta < 0 && armed !== key) {
      setArmed(key);
      if (armTimer.current) clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(null), 3000);
      return;
    }
    setArmed(null);
    busyRef.current = true;
    setBusyKey(key);
    const result = await adjustCurrencies(activeChild, toDelta(template));
    busyRef.current = false;
    setBusyKey(null);
    family.setChildState(activeChild.id, result.state);
    if (!result.ok) {
      toast.show(result.message, 'error');
      return;
    }
    toast.show(
      `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${currencyLabel[template.currencyType]} ${delta > 0 ? 'for' : 'from'} ${activeChild.name} · ${template.label}`,
      delta > 0 ? 'success' : 'info'
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
  const rewardGroups = [
    { label: 'Stars', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'stars') },
    { label: 'Hearts', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'hearts') },
    { label: 'Screen Energy', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy') },
  ].filter((group) => group.templates.length > 0);
  const editorGroups: { label: string; color: string; templates: RewardTemplate[] }[] = [
    { label: 'Star Rewards', color: 'text-honey-700', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'stars') },
    { label: 'Heart Rewards', color: 'text-berry-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'hearts') },
    { label: 'Screen Energy', color: 'text-sky-600', templates: rewardTemplates.filter((t) => t.rewardType === 'positive' && t.currencyType === 'screen-energy') },
    { label: 'Consequences', color: 'text-berry-700', templates: deductionTemplates },
  ].filter((g) => g.templates.length > 0);

  return (
    <>
      <ParentHeader
        title={isManaging ? 'Manage rewards' : 'Rewards'}
        subtitle={isManaging ? 'Edit the quick reward buttons' : 'Tap to give or take away'}
        action={
          !isManaging ? (
            <button
              type="button"
              onClick={() => setIsManaging(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#ece7f2] bg-white text-ink-soft"
              aria-label="Manage reward buttons"
            >
              <Icon name="pencil" size={18} />
            </button>
          ) : null
        }
      />
      <ParentBody>
        {!isManaging ? (
          <>
            <ChildTabs
              items={mockChildren.map((c) => ({ id: c.id, name: c.name, state: family.states[c.id] ?? mergeWithDefaultChildState(c, null) }))}
              activeId={activeChild.id}
              onChange={(id) => {
                setActiveChildId(id);
                setArmed(null);
              }}
            />
            <section className="p-card flex flex-wrap items-center justify-between gap-2 p-3">
              <p className="text-sm font-extrabold text-ink-soft">{activeChild.name} has</p>
              <Balances state={activeState} size="md" />
            </section>
            {rewardGroups.map((group) => (
              <section key={group.label}>
                <SectionTitle>{group.label}</SectionTitle>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.templates.map((template) => (
                    <RewardButton
                      key={template.id}
                      template={template}
                      busy={busyKey !== null}
                      armed={false}
                      onPress={() => void applyReward(template)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {deductionTemplates.length > 0 ? (
              <section className="rounded-2xl border border-berry-100 bg-berry-50/40 p-3">
                <SectionTitle>Consequences</SectionTitle>
                <p className="text-xs font-bold text-ink-faint">Tap twice to deduct — balances never go below zero.</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {deductionTemplates.map((template) => (
                    <RewardButton
                      key={template.id}
                      template={template}
                      busy={busyKey !== null}
                      armed={armed === `${activeChild.id}:${template.id}`}
                      onPress={() => void applyReward(template)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <div>
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
                className="text-sm font-black text-plum-700 transition hover:text-plum-900 active:scale-95"
              >
                ← Back to rewards
              </button>

              <div className="rounded-2xl border border-plum-100/70 bg-white/90 shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTemplate((current) => !current);
                    setExpandedTemplateId(null);
                    setAddError('');
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-sm font-black text-plum-700 transition hover:bg-plum-50 active:scale-[0.99]"
                  aria-expanded={isCreatingTemplate}
                >
                  <span>＋ Create Reward</span>
                  <span className="text-base" aria-hidden="true">{isCreatingTemplate ? '−' : '+'}</span>
                </button>
                {isCreatingTemplate && (
                  <div className="space-y-2 border-t border-plum-100/70 px-3.5 py-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        placeholder="⭐"
                        aria-label="New reward icon"
                        className="w-12 shrink-0 rounded-xl border border-[#ece7f2] bg-white px-2 py-2 text-center text-base font-bold text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
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
                        className="min-w-0 flex-1 rounded-xl border border-[#ece7f2] bg-white px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
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
                        className="min-w-0 flex-1 rounded-xl border border-[#ece7f2] bg-white px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
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
                        className="w-16 rounded-xl border border-[#ece7f2] bg-white px-2 py-2 text-center text-sm font-black text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddTemplate}
                        className="rounded-xl bg-plum-600 px-3.5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-plum-700 active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                    {addError && (
                      <p className="text-xs font-bold text-berry-500">{addError}</p>
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
                          className="overflow-hidden rounded-xl border border-[#ece7f2] bg-[#f6f2fa]"
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
                            <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-ink">
                              {template.label}
                            </span>
                            <span className={`shrink-0 text-xs font-black ${delta < 0 ? 'text-berry-600' : 'text-ink-soft'}`}>
                              {delta > 0 ? '+' : '-'}{Math.abs(delta)} {currencyEmoji[template.currencyType]}
                            </span>
                            <span className="shrink-0 text-xs font-black text-ink-faint" aria-hidden="true">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="space-y-3 border-t border-[#ece7f2] bg-white/80 px-3 py-3">
                              <div className="grid grid-cols-[48px_minmax(0,1fr)_68px] gap-2">
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-ink-faint">
                                  Icon
                                  <input
                                    type="text"
                                    value={template.icon}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'icon', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-[#ece7f2] bg-white px-2 text-center text-base text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
                                  />
                                </label>
                                <label className="min-w-0 space-y-1 text-[10px] font-black uppercase tracking-wide text-ink-faint">
                                  Label
                                  <input
                                    type="text"
                                    value={template.label}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'label', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-[#ece7f2] bg-white px-2.5 text-sm font-bold normal-case tracking-normal text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
                                  />
                                </label>
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-ink-faint">
                                  Amount
                                  <input
                                    type="number"
                                    min={0}
                                    value={template.amount}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'amount', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-[#ece7f2] bg-white px-2 text-center text-sm font-black tracking-normal text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
                                  />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-ink-faint">
                                  Currency
                                  <select
                                    value={template.currencyType}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'currencyType', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-[#ece7f2] bg-white px-2 text-xs font-bold normal-case tracking-normal text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
                                  >
                                    {Object.entries(currencyLabel).map(([value, label]) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-ink-faint">
                                  Type
                                  <select
                                    value={template.rewardType}
                                    onChange={(e) =>
                                      handleTemplateEdit(template.id, 'rewardType', e.target.value)
                                    }
                                    className="h-9 w-full rounded-xl border border-[#ece7f2] bg-white px-2 text-xs font-bold normal-case tracking-normal text-ink focus:outline-none focus:ring-1 focus:ring-plum-300"
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
                                    className="text-xs font-black text-berry-500 transition hover:text-berry-700 active:scale-95"
                                  >
                                    Delete reward
                                  </button>
                                ) : (
                                  <span />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedTemplateId(null)}
                                  className="ml-auto rounded-full bg-[#f6f2fa] px-3 py-1.5 text-xs font-black text-ink-soft transition hover:bg-[#ece7f2] active:scale-95"
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
                className="w-full rounded-2xl border border-[#ece7f2] bg-white px-4 py-3 text-sm font-bold text-ink-soft shadow-sm transition hover:bg-[#f6f2fa] hover:text-ink active:scale-95"
              >
                Reset to defaults
              </button>
            </motion.div>
          </div>
        )}
      </ParentBody>
      {toast.node}
    </>
  );
}
