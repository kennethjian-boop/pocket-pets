'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CurrencyType,
  RewardTemplate,
  RewardType,
  currencyEmoji,
  currencyLabel,
  defaultRewardTemplates,
} from '@/lib/reward-templates';
import { BottomNavigation } from '@/components/BottomNavigation';

const blankTemplate: RewardTemplate = {
  id: '',
  label: '',
  icon: '⭐',
  amount: 1,
  currencyType: 'stars',
  rewardType: 'positive',
};

export default function RewardSettingsPage() {
  const [templates, setTemplates] = useState(defaultRewardTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RewardTemplate>(blankTemplate);

  const isEditing = editingId !== null;
  const canSave = draft.label.trim().length > 0 && draft.amount > 0;

  const title = useMemo(
    () => (isEditing ? 'Edit Reward' : 'Add Reward'),
    [isEditing]
  );

  const resetForm = () => {
    setEditingId(null);
    setDraft(blankTemplate);
  };

  const handleEdit = (template: RewardTemplate) => {
    setEditingId(template.id);
    setDraft(template);
  };

  const handleRemove = (templateId: string) => {
    setTemplates((current) =>
      current.filter((template) => template.id !== templateId)
    );
    if (editingId === templateId) {
      resetForm();
    }
  };

  const handleSave = () => {
    if (!canSave) return;

    const nextTemplate = {
      ...draft,
      id: isEditing ? draft.id : `${Date.now()}-${draft.label.toLowerCase()}`,
      label: draft.label.trim(),
      amount: Math.max(1, Math.round(draft.amount)),
    };

    setTemplates((current) =>
      isEditing
        ? current.map((template) =>
            template.id === editingId ? nextTemplate : template
          )
        : [...current, nextTemplate]
    );
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50 pb-32 px-4 pt-6">
      <main className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reward Templates</h1>
            <p className="mt-1 text-sm text-gray-600">
              Keep the buttons simple enough to use in the moment.
            </p>
          </div>
          <Link
            href="/parent/dashboard"
            className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-gray-700 shadow-md transition hover:bg-white"
          >
            Done
          </Link>
        </div>

        <section className="mb-6 rounded-3xl border-2 border-white bg-white/75 p-4 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-800">{title}</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-bold text-gray-700">
              Label
              <input
                value={draft.label}
                onChange={(event) =>
                  setDraft({ ...draft, label: event.target.value })
                }
                className="rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 text-base outline-none focus:border-pink-300"
                placeholder="Kindness"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-bold text-gray-700">
              Icon
              <input
                value={draft.icon}
                onChange={(event) =>
                  setDraft({ ...draft, icon: event.target.value.slice(0, 4) })
                }
                className="rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 text-base outline-none focus:border-pink-300"
                placeholder="💚"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-bold text-gray-700">
              Amount
              <input
                type="number"
                min="1"
                value={draft.amount}
                onChange={(event) =>
                  setDraft({ ...draft, amount: Number(event.target.value) })
                }
                className="rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 text-base outline-none focus:border-pink-300"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-bold text-gray-700">
              Currency
              <select
                value={draft.currencyType}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    currencyType: event.target.value as CurrencyType,
                  })
                }
                className="rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 text-base outline-none focus:border-pink-300"
              >
                {Object.entries(currencyLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {currencyEmoji[value as CurrencyType]} {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['positive', 'deduction'] as RewardType[]).map((rewardType) => (
              <button
                key={rewardType}
                onClick={() => setDraft({ ...draft, rewardType })}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  draft.rewardType === rewardType
                    ? 'bg-blue-300 text-blue-950 shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {rewardType === 'positive' ? 'Positive' : 'Deduction'}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-400 py-3 font-bold text-emerald-950 shadow-md transition disabled:opacity-40"
            >
              {isEditing ? 'Save Changes' : 'Add Template'}
            </button>
            {isEditing && (
              <button
                onClick={resetForm}
                className="rounded-2xl bg-gray-100 px-5 py-3 font-bold text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              layout
              className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white/75 p-3 shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
                {template.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-gray-800">
                  {template.rewardType === 'deduction' ? '-' : '+'}
                  {template.amount} {currencyEmoji[template.currencyType]}{' '}
                  {template.label}
                </div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  {currencyLabel[template.currencyType]} · {template.rewardType}
                </div>
              </div>
              <button
                onClick={() => handleEdit(template)}
                className="rounded-full bg-blue-100 px-3 py-2 text-sm font-bold text-blue-900"
              >
                Edit
              </button>
              <button
                onClick={() => handleRemove(template.id)}
                className="rounded-full bg-rose-100 px-3 py-2 text-sm font-bold text-rose-900"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </section>
      </main>

      <BottomNavigation type="parent" />
    </div>
  );
}
