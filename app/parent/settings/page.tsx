'use client';

import { useEffect, useState } from 'react';
import { LogoutButton } from '@/components/AuthGate';
import { Icon } from '@/components/ui/Icon';
import { readParentPin, writeParentPin } from '@/lib/parent-pin';
import { fetchParentSettings, upsertParentSettings } from '@/lib/supabase-parent-settings';
import { ParentBody, ParentHeader, SectionTitle, useParentToast } from '../_components/ParentUI';

function PinInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="min-h-12 rounded-xl border border-[#ece7f2] bg-white px-3 text-center font-display text-2xl font-semibold tracking-[0.5em] text-ink focus:border-plum-300 focus:outline-none"
      />
    </label>
  );
}

export default function SettingsPage() {
  const toast = useParentToast();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  // Reflect PIN changes made on other devices.
  useEffect(() => {
    void fetchParentSettings().then((remote) => {
      if (remote) writeParentPin(remote.pin);
    });
  }, []);

  const changePin = () => {
    setError('');
    if (currentPin !== readParentPin()) {
      setError('Current PIN is incorrect.');
      setCurrentPin('');
      return;
    }
    if (newPin.length !== 4) {
      setError('Please enter a 4-digit PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PINs do not match.');
      setConfirmPin('');
      return;
    }
    writeParentPin(newPin);
    void upsertParentSettings(newPin);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    toast.show('Parent PIN updated.');
  };

  return (
    <>
      <ParentHeader title="Settings" />
      <ParentBody>
        <section className="p-card p-4" aria-label="Parent PIN">
          <SectionTitle>Parent PIN</SectionTitle>
          <p className="text-xs font-bold text-ink-faint">
            Keeps little hands out of the parent area. It&apos;s a child-resistant gate, not account security.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <PinInput label="Current" value={currentPin} onChange={setCurrentPin} />
            <PinInput label="New" value={newPin} onChange={setNewPin} />
            <PinInput label="Confirm" value={confirmPin} onChange={setConfirmPin} />
          </div>
          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-berry-50 px-3 py-2 text-sm font-bold text-berry-700">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={changePin}
            disabled={currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
            className="mt-3 min-h-12 w-full rounded-xl bg-plum-500 text-sm font-extrabold text-white disabled:opacity-50"
          >
            Update PIN
          </button>
        </section>

        <section className="p-card p-4" aria-label="Account">
          <SectionTitle>Family account</SectionTitle>
          <p className="text-xs font-bold text-ink-faint">Logging out signs out this device for everyone.</p>
          <LogoutButton inline className="mt-3 flex min-h-12 w-full items-center justify-center text-sm" />
        </section>

        <section className="flex items-start gap-3 rounded-2xl border border-plum-100 bg-plum-50/50 p-4 text-sm font-bold text-ink-soft">
          <Icon name="paw" size={22} className="mt-0.5 shrink-0 text-plum-400" />
          <p>
            Stars come only from goals you verify, your rewards and boss victories. Pet care and Pet Catch are just for
            fun. Children can never verify goals or hand out boss prizes themselves.
          </p>
        </section>
      </ParentBody>
      {toast.node}
    </>
  );
}
