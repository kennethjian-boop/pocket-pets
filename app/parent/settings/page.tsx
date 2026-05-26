'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { readParentPin, writeParentPin } from '@/lib/parent-pin';
import { cardStyle, feedbackClass, FeedbackState, FeedbackTone } from '../_lib';

export default function SettingsPage() {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pinFormOpen, setPinFormOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const showFeedback = (message: string, tone: FeedbackTone = 'success') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 1800);
  };

  const handleChangePIN = () => {
    if (currentPinInput !== readParentPin()) {
      setPinMessage({ ok: false, text: 'Current PIN is incorrect.' });
      setCurrentPinInput('');
      return;
    }
    if (newPinInput.length !== 4) {
      setPinMessage({ ok: false, text: 'Please enter a 4-digit PIN.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ ok: false, text: 'New PINs do not match.' });
      setConfirmPinInput('');
      return;
    }
    writeParentPin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinMessage({ ok: true, text: 'Parent PIN updated.' });
    showFeedback('Parent PIN updated successfully.', 'success');
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-xl">🐾</span>
          <span className="text-base font-extrabold text-slate-800">
            Pocket <span className="text-pink-500">Pets</span>
          </span>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-lg font-extrabold text-slate-900">Settings</h1>
          <p className="text-xs text-slate-400">Manage parent dashboard settings</p>
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

      {/* Body */}
      <motion.main
        className="flex-1 overflow-y-auto flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-[1400px] space-y-6 px-6 py-6 lg:px-10 lg:py-8">

          {/* Feedback banner */}
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

          {/* Change PIN */}
          <section className={cardStyle}>
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">🔒 Parent PIN</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  The code used to enter the Parent Dashboard.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setPinFormOpen((o) => !o); setPinMessage(null); }}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Change Parent PIN</p>
                    <p className="text-xs text-slate-400">
                      Update the code used to enter this dashboard
                    </p>
                  </div>
                </div>
                <span className="text-slate-400">{pinFormOpen ? '▲' : '▼'}</span>
              </button>

              <AnimatePresence>
                {pinFormOpen && (
                  <motion.div
                    key="pin-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          {
                            label: 'Current PIN',
                            value: currentPinInput,
                            onChange: (v: string) => {
                              setCurrentPinInput(v);
                              setPinMessage(null);
                            },
                          },
                          {
                            label: 'New PIN',
                            value: newPinInput,
                            onChange: (v: string) => {
                              setNewPinInput(v);
                              setPinMessage(null);
                            },
                          },
                          {
                            label: 'Confirm New PIN',
                            value: confirmPinInput,
                            onChange: (v: string) => {
                              setConfirmPinInput(v);
                              setPinMessage(null);
                            },
                          },
                        ].map(({ label, value, onChange }) => (
                          <div key={label}>
                            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                              {label}
                            </p>
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={4}
                              value={value}
                              onChange={(e) =>
                                onChange(e.target.value.replace(/\D/g, '').slice(0, 4))
                              }
                              placeholder="••••"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-base font-bold tracking-[0.4em] text-slate-900 transition focus:border-purple-300 focus:bg-white focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      {pinMessage && (
                        <p
                          className={`mt-3 text-sm font-semibold ${
                            pinMessage.ok ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {pinMessage.text}
                        </p>
                      )}
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={handleChangePIN}
                          disabled={
                            currentPinInput.length !== 4 ||
                            newPinInput.length !== 4 ||
                            confirmPinInput.length !== 4
                          }
                          className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          Update PIN
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPinFormOpen(false);
                            setPinMessage(null);
                            setCurrentPinInput('');
                            setNewPinInput('');
                            setConfirmPinInput('');
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Notifications placeholder */}
          <section className={cardStyle}>
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-extrabold text-slate-900">🔔 Notifications</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-400">
                    Coming Soon
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-400">
                  Goal reminders, achievement alerts, and weekly summaries.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-6">
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <p className="text-2xl">🔕</p>
                <p className="mt-2 text-sm font-semibold text-slate-400">Notification settings coming in a future update.</p>
              </div>
            </div>
          </section>

          {/* App Preferences placeholder */}
          <section className={cardStyle}>
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-extrabold text-slate-900">🎨 App Preferences</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-400">
                    Coming Soon
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-400">
                  Themes, display options, and family customisation.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-6">
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <p className="text-2xl">🎨</p>
                <p className="mt-2 text-sm font-semibold text-slate-400">Customisation options coming in a future update.</p>
              </div>
            </div>
          </section>

          {/* Children placeholder */}
          <section className={cardStyle}>
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-extrabold text-slate-900">👨‍👩‍👧‍👦 Manage Children</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-400">
                    Coming Soon
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-400">
                  Add, remove, or rename children in the family.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-6">
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <p className="text-2xl">👶</p>
                <p className="mt-2 text-sm font-semibold text-slate-400">Family management coming in a future update.</p>
              </div>
            </div>
          </section>

        </div>
      </motion.main>
    </>
  );
}
