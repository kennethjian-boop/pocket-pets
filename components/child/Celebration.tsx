'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui/Icon';

const PIECES: { icon: IconName; angle: number; dist: number; size: number; delay: number }[] = Array.from({ length: 14 }, (_, i) => ({
  icon: (['star', 'heart', 'sparkle'] as IconName[])[i % 3],
  angle: (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1),
  dist: 110 + (i % 4) * 28,
  size: 22 + (i % 3) * 8,
  delay: (i % 5) * 0.03,
}));

/** A burst of stars/hearts from the centre of its (relative) container. */
export function Celebration({ show, burstKey }: { show: boolean; burstKey: number | string }) {
  return (
    <AnimatePresence>
      {show ? (
        <div key={burstKey} className="pointer-events-none absolute inset-0 z-40 grid place-items-center overflow-visible" aria-hidden="true">
          {PIECES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute"
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
              animate={{
                x: Math.cos(p.angle) * p.dist,
                y: Math.sin(p.angle) * p.dist - 20,
                scale: [0.2, 1.1, 0.9],
                opacity: [0, 1, 1, 0],
                rotate: (i % 2 ? 1 : -1) * 120,
              }}
              transition={{ duration: 1.3, delay: p.delay, ease: 'easeOut', times: [0, 0.2, 0.7, 1] }}
            >
              <Icon name={p.icon} size={p.size} />
            </motion.span>
          ))}
        </div>
      ) : null}
    </AnimatePresence>
  );
}
