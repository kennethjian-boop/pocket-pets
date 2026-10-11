'use client';

import { motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { CareActionType } from '@/lib/mission-state';

export type CareButtonState = {
  type: CareActionType;
  remaining: number;
  limit: number;
  /** 0 → ready, 1 → just used. */
  cooldownLeft: number;
  cooldownSeconds: number;
  highlight?: boolean;
};

const META: Record<CareActionType, { label: string; icon: IconName; doneLabel: string; edge: string; tint: string }> = {
  feed: { label: 'Feed', icon: 'feed', doneLabel: 'Full!', edge: '#c98204', tint: 'from-honey-50 to-white' },
  pat: { label: 'Pat', icon: 'pat', doneLabel: 'Loved!', edge: '#c9325d', tint: 'from-berry-50 to-white' },
  clean: { label: 'Clean', icon: 'clean', doneLabel: 'Sparkly!', edge: '#1f71b9', tint: 'from-sky-50 to-white' },
};

function CooldownRing({ progress, color }: { progress: number; color: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(58 42 77 / 0.08)" strokeWidth="6" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * progress}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

export function CareDock({
  buttons,
  busy,
  onCare,
  petName,
}: {
  buttons: CareButtonState[];
  busy: CareActionType | null;
  onCare: (type: CareActionType) => void;
  petName: string;
}) {
  return (
    <div className="surface relative z-10 mx-2 -mt-9 short:mx-0 short:mt-3 grid grid-cols-3 gap-1 px-2 pb-3 pt-3 sm:mx-6 sm:gap-3 sm:px-4">
      {buttons.map((button) => {
        const meta = META[button.type];
        const usedUp = button.remaining <= 0;
        const cooling = !usedUp && button.cooldownLeft > 0;
        const pressing = busy === button.type;
        const status = usedUp ? meta.doneLabel : cooling ? `${Math.ceil(button.cooldownLeft * button.cooldownSeconds)}s` : null;
        return (
          <motion.button
            key={button.type}
            type="button"
            onClick={() => onCare(button.type)}
            disabled={busy !== null}
            whileTap={{ scale: 0.92 }}
            aria-label={`${meta.label} ${petName}. ${button.remaining} of ${button.limit} left today${cooling ? ', resting' : ''}`}
            className="group flex flex-col items-center gap-1.5 rounded-2xl py-1 disabled:cursor-wait"
          >
            <span
              className={`relative grid h-[74px] w-[74px] place-items-center rounded-full bg-gradient-to-b ${meta.tint} transition sm:h-20 sm:w-20 ${
                usedUp ? 'opacity-55 saturate-50' : ''
              } ${button.highlight && !usedUp ? 'ring-4 ring-honey-300 ring-offset-2 ring-offset-white' : ''}`}
              style={{ boxShadow: `0 5px 0 ${usedUp ? '#d8d0e0' : meta.edge}, 0 12px 18px -12px ${meta.edge}` }}
            >
              {cooling ? <CooldownRing progress={button.cooldownLeft} color={meta.edge} /> : null}
              <motion.span
                animate={pressing ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
                transition={{ duration: 0.5, repeat: pressing ? Infinity : 0 }}
                className={cooling ? 'opacity-60' : ''}
              >
                <Icon name={meta.icon} size={44} />
              </motion.span>
              {status ? (
                <span className="absolute -bottom-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-extrabold text-white shadow">
                  {status}
                </span>
              ) : null}
            </span>
            <span className="font-display text-lg font-semibold leading-none text-ink">{meta.label}</span>
            <span className="flex gap-1" aria-hidden="true">
              {Array.from({ length: button.limit }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < button.remaining ? 'bg-plum-400' : 'bg-ink/15'}`}
                />
              ))}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
