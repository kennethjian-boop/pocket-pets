import type { SVGProps } from 'react';

/**
 * Storybook icon set. Colour icons use the palette with a soft plum-ink outline to
 * match the pet artwork's linework; line icons (prefixed with nothing special)
 * inherit currentColor for calm parent UI.
 */
export type IconName =
  | 'star'
  | 'heart'
  | 'energy'
  | 'home'
  | 'shop'
  | 'boss'
  | 'play'
  | 'egg'
  | 'check'
  | 'lock'
  | 'sparkle'
  | 'feed'
  | 'pat'
  | 'clean'
  | 'crown'
  | 'gift'
  | 'moon'
  | 'sun'
  | 'poop'
  | 'sword'
  | 'paw'
  | 'trophy'
  | 'clock'
  | 'arrow-left'
  | 'chevron-right'
  | 'close'
  | 'swap'
  | 'logout'
  | 'dice'
  | 'pencil'
  | 'cog'
  | 'grid'
  | 'goals'
  | 'minus'
  | 'plus'
  | 'refresh'
  | 'undo'
  | 'book'
  | 'broom'
  | 'smile'
  | 'cloud'
  | 'pause'
  | 'resume'
  | 'jump'
  | 'run';

const INK = '#3a2a4d';
const OUT = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const LINE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function paths(name: IconName) {
  switch (name) {
    case 'star':
      return (
        <>
          <path d="M24 5.5l5.4 11.2 12.3 1.6-9 8.5 2.3 12.2L24 33.1 13 39l2.3-12.2-9-8.5 12.3-1.6z" fill="#fbbf3a" {...OUT} />
          <path d="M18.5 19.5l3-.4 1.4-2.9" fill="none" stroke="#fff3c4" strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case 'heart':
      return (
        <>
          <path d="M24 40.5S7 30.6 7 18.6C7 12.8 11.3 9 16 9c3.5 0 6.3 1.9 8 4.8C25.7 10.9 28.5 9 32 9c4.7 0 9 3.8 9 9.6C41 30.6 24 40.5 24 40.5z" fill="#f8678f" {...OUT} />
          <path d="M13.5 17.5c.3-2.4 1.9-4 4-4.4" fill="none" stroke="#ffd0dc" strokeWidth={2.6} strokeLinecap="round" />
        </>
      );
    case 'energy':
      return (
        <>
          <rect x="10" y="6" width="28" height="36" rx="7" fill="#7ec6fb" {...OUT} />
          <rect x="14.5" y="10.5" width="19" height="25" rx="3.5" fill="#eef8ff" />
          <path d="M26 13l-7 11h5l-2 9 7-11h-5z" fill="#fbbf3a" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        </>
      );
    case 'home':
      return (
        <>
          <path d="M7 22L24 8l17 14" fill="none" {...OUT} />
          <path d="M11 20v18a3 3 0 003 3h20a3 3 0 003-3V20L24 9.5z" fill="#ffb991" {...OUT} />
          <path d="M20 41V30a4 4 0 018 0v11" fill="#f8678f" {...OUT} />
          <circle cx="33" cy="12" r="2.4" fill="#fbbf3a" />
        </>
      );
    case 'shop':
      return (
        <>
          <path d="M9 16h30l-2 22.5a3.5 3.5 0 01-3.5 3.2h-19A3.5 3.5 0 0111 38.5z" fill="#fbbf3a" {...OUT} />
          <path d="M17 19v-5a7 7 0 0114 0v5" fill="none" {...OUT} />
          <path d="M24 26.5l1.8 3.6 4 .5-2.9 2.8.7 4L24 35.5 20.4 37.4l.7-4-2.9-2.8 4-.5z" fill="#fff" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
        </>
      );
    case 'boss':
      return (
        <>
          <path d="M12 16l-4-8 9 4M36 16l4-8-9 4" fill="#bea3fb" {...OUT} />
          <path d="M8 26c0-9 7-15 16-15s16 6 16 15-6.5 15-16 15S8 35 8 26z" fill="#9c7cf0" {...OUT} />
          <ellipse cx="18" cy="25" rx="3.2" ry="3.6" fill="#fff" />
          <ellipse cx="30" cy="25" rx="3.2" ry="3.6" fill="#fff" />
          <circle cx="18.6" cy="25.6" r="1.6" fill={INK} />
          <circle cx="30.6" cy="25.6" r="1.6" fill={INK} />
          <path d="M18 33.5c3.5 2.5 8.5 2.5 12 0" fill="none" {...OUT} />
          <path d="M21 34.3l1 2 1-1.6M26 34.3l1 2 1-1.6" fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        </>
      );
    case 'play':
      return (
        <>
          <path d="M14 14h20c5.5 0 9 4.6 9 11.5 0 7-2.3 12-6 12-3 0-4.7-3.6-7-5.5h-12c-2.3 1.9-4 5.5-7 5.5-3.7 0-6-5-6-12C5 18.6 8.5 14 14 14z" fill="#74d8a5" {...OUT} />
          <path d="M15 21v8M11 25h8" fill="none" {...OUT} />
          <circle cx="31.5" cy="22.5" r="2.3" fill="#f8678f" />
          <circle cx="36" cy="27" r="2.3" fill="#fbbf3a" />
        </>
      );
    case 'egg':
      return (
        <>
          <path d="M24 5c8 0 15 12 15 22 0 9-6.6 15-15 15S9 36 9 27C9 17 16 5 24 5z" fill="#fff3e2" {...OUT} />
          <circle cx="19" cy="22" r="3" fill="#bea3fb" />
          <circle cx="29" cy="30" r="3.6" fill="#ff8fae" />
          <circle cx="27" cy="16" r="2" fill="#7ec6fb" />
          <circle cx="17" cy="33" r="2" fill="#ffd25e" />
        </>
      );
    case 'check':
      return (
        <>
          <circle cx="24" cy="24" r="17" fill="#45c286" {...OUT} />
          <path d="M16 24.5l5.5 5.5L32.5 18.5" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'lock':
      return (
        <>
          <path d="M16 21v-5a8 8 0 0116 0v5" fill="none" {...OUT} />
          <rect x="10.5" y="20" width="27" height="21" rx="6" fill="#bea3fb" {...OUT} />
          <circle cx="24" cy="29.5" r="2.6" fill={INK} />
          <path d="M24 31v3.5" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case 'sparkle':
      return (
        <path d="M24 5c1.4 9.5 4.6 12.8 14 14-9.4 1.4-12.6 4.6-14 14-1.4-9.4-4.6-12.6-14-14C19.4 17.8 22.6 14.5 24 5z M37 30c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6z" fill="#ffd25e" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      );
    case 'feed':
      return (
        <>
          <circle cx="24" cy="24" r="16.5" fill="#f5b26b" {...OUT} />
          <path d="M14 18.5c2-5 7-8 13-7" fill="none" stroke="#ffd9a8" strokeWidth={2.6} strokeLinecap="round" />
          <circle cx="18" cy="23" r="2.4" fill="#7a4520" />
          <circle cx="27" cy="19" r="2.1" fill="#7a4520" />
          <circle cx="29" cy="29" r="2.6" fill="#7a4520" />
          <circle cx="20" cy="31" r="1.9" fill="#7a4520" />
        </>
      );
    case 'pat':
      return (
        <>
          <ellipse cx="24" cy="30" rx="10.5" ry="9" fill="#ff8fae" {...OUT} />
          <ellipse cx="12.5" cy="19.5" rx="4" ry="5" fill="#ff8fae" {...OUT} />
          <ellipse cx="20" cy="12.5" rx="4" ry="5" fill="#ff8fae" {...OUT} />
          <ellipse cx="28" cy="12.5" rx="4" ry="5" fill="#ff8fae" {...OUT} />
          <ellipse cx="35.5" cy="19.5" rx="4" ry="5" fill="#ff8fae" {...OUT} />
          <path d="M20 29.5c2.4-2 5.6-2 8 0" fill="none" stroke="#ffd0dc" strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case 'clean':
      return (
        <>
          <circle cx="20" cy="26" r="12" fill="#b3defe" {...OUT} />
          <circle cx="33.5" cy="15.5" r="6.5" fill="#d8eeff" {...OUT} />
          <circle cx="35" cy="33.5" r="4.5" fill="#d8eeff" {...OUT} />
          <path d="M13.5 22.5a7.5 7.5 0 016-5" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" />
          <path d="M31 13.5a3 3 0 012.5-2" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
    case 'crown':
      return (
        <>
          <path d="M8 16l8 7 8-12 8 12 8-7-3 22H11z" fill="#fbbf3a" {...OUT} />
          <circle cx="24" cy="29" r="3" fill="#f8678f" stroke={INK} strokeWidth={1.8} />
        </>
      );
    case 'gift':
      return (
        <>
          <rect x="8" y="18" width="32" height="22" rx="4" fill="#ff8fae" {...OUT} />
          <rect x="6" y="13" width="36" height="8" rx="3" fill="#f8678f" {...OUT} />
          <path d="M24 13v27" stroke="#fbbf3a" strokeWidth={5} />
          <path d="M24 13c-3-6-11-6-9-1 1 2 5 1.5 9 1zM24 13c3-6 11-6 9-1-1 2-5 1.5-9 1z" fill="#fbbf3a" {...OUT} />
        </>
      );
    case 'moon':
      return <path d="M30 6a17 17 0 10 12 26A14 14 0 0130 6z" fill="#ffe08a" {...OUT} />;
    case 'sun':
      return (
        <>
          <circle cx="24" cy="24" r="9" fill="#fbbf3a" {...OUT} />
          <path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.5 10.5l3.5 3.5M34 34l3.5 3.5M10.5 37.5L14 34M34 14l3.5-3.5" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case 'poop':
      return (
        <>
          <path d="M12 36c-4 0-5.5-5-2-7-2.5-3 0-7 3.5-6.5C13 18 17 15.5 20.5 17c0-4 3-7 6.5-8-1 3 1 4.5 2.5 6.5 3.5.5 5 4 3.5 7 4 0 5.5 4.5 3 7 3.5 2 2.5 7-1.5 7z" fill="#b9845a" {...OUT} />
          <circle cx="20" cy="27" r="1.8" fill={INK} />
          <circle cx="28" cy="27" r="1.8" fill={INK} />
          <path d="M21 31.5c2 1.5 4 1.5 6 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case 'sword':
      return (
        <>
          <path d="M35 6l7 0 0 7-18 18-7-7z" fill="#d8eeff" {...OUT} />
          <path d="M13 22l13 13M17 31l-8 8M10 34l4 4" fill="none" {...OUT} />
          <circle cx="9" cy="39" r="2.6" fill="#fbbf3a" stroke={INK} strokeWidth={2} />
        </>
      );
    case 'paw':
      return (
        <>
          <ellipse cx="24" cy="31" rx="9" ry="7.5" fill="currentColor" />
          <circle cx="13" cy="21" r="4" fill="currentColor" />
          <circle cx="20" cy="13.5" r="4" fill="currentColor" />
          <circle cx="28" cy="13.5" r="4" fill="currentColor" />
          <circle cx="35" cy="21" r="4" fill="currentColor" />
        </>
      );
    case 'trophy':
      return (
        <>
          <path d="M15 8h18v9a9 9 0 01-18 0z" fill="#fbbf3a" {...OUT} />
          <path d="M15 11H9c0 6 3 9 7 9M33 11h6c0 6-3 9-7 9" fill="none" {...OUT} />
          <path d="M24 26v7M17 40h14l-2-7H19z" fill="#f5b26b" {...OUT} />
        </>
      );
    case 'book':
      return (
        <>
          <path d="M24 12c-4-3-10-4-16-3v27c6-1 12 0 16 3 4-3 10-4 16-3V9c-6-1-12 0-16 3z" fill="#7ec6fb" {...OUT} />
          <path d="M24 12v27" {...OUT} />
          <path d="M12.5 16c3-.4 5.5 0 8 1M12.5 22c3-.4 5.5 0 8 1M27.5 17c2.5-1 5-1.4 8-1" fill="none" stroke="#eef8ff" strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
    case 'broom':
      return (
        <>
          <path d="M33 6l-9 17" {...OUT} />
          <path d="M17 22l12 6c-1 6-4 11-9 14-4-1-9-4-12-8 5-2 8-6 9-12z" fill="#ffd25e" {...OUT} />
          <path d="M15 33l5 3M18 28l4 2" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
        </>
      );
    case 'smile':
      return (
        <>
          <circle cx="24" cy="24" r="16.5" fill="#ffd25e" {...OUT} />
          <circle cx="18.5" cy="21" r="2.2" fill={INK} />
          <circle cx="29.5" cy="21" r="2.2" fill={INK} />
          <path d="M17 28c3.8 4 10.2 4 14 0" fill="none" {...OUT} />
          <circle cx="14.5" cy="27" r="2.4" fill="#ff8fae" opacity="0.8" />
          <circle cx="33.5" cy="27" r="2.4" fill="#ff8fae" opacity="0.8" />
        </>
      );
    case 'cloud':
      return (
        <path d="M14 37c-5.5 0-8-7-3.5-10-1-6 5-10 10-8 2-5 9-7 13-3 5-1 9 3 8 8 4 1 5 7 0 13z" fill="#d9c8ff" {...OUT} />
      );
    case 'pause':
      return <path d="M17 12v24M31 12v24" {...LINE} strokeWidth={5} />;
    case 'resume':
      return <path d="M16 11l22 13-22 13z" fill="currentColor" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" />;
    case 'jump':
      return <path d="M24 38V12M13 22l11-11 11 11" {...LINE} strokeWidth={4} />;
    case 'run':
      return (
        <>
          <path d="M6 38c6-10 14-14 22-12s12 4 14 0" fill="none" stroke="#45c286" strokeWidth={4} strokeLinecap="round" />
          <circle cx="30" cy="17" r="8" fill="#ffd25e" {...OUT} />
          <path d="M10 27h8M7 21h7" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M33 9l3-4M38 13l4-2" stroke="#fbbf3a" strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case 'clock':
      return (
        <>
          <circle cx="24" cy="24" r="16" {...LINE} />
          <path d="M24 15v9l6 4" {...LINE} />
        </>
      );
    case 'arrow-left':
      return <path d="M28 12L16 24l12 12" {...LINE} strokeWidth={3} />;
    case 'chevron-right':
      return <path d="M19 12l12 12-12 12" {...LINE} strokeWidth={3} />;
    case 'close':
      return <path d="M14 14l20 20M34 14L14 34" {...LINE} strokeWidth={3} />;
    case 'swap':
      return <path d="M10 18h26l-6-6M38 30H12l6 6" {...LINE} strokeWidth={2.8} />;
    case 'logout':
      return <path d="M20 10h-8a3 3 0 00-3 3v22a3 3 0 003 3h8M30 16l8 8-8 8M38 24H19" {...LINE} strokeWidth={2.8} />;
    case 'dice':
      return (
        <>
          <rect x="9" y="9" width="30" height="30" rx="7" {...LINE} />
          <circle cx="18" cy="18" r="2.3" fill="currentColor" />
          <circle cx="30" cy="30" r="2.3" fill="currentColor" />
          <circle cx="24" cy="24" r="2.3" fill="currentColor" />
        </>
      );
    case 'pencil':
      return <path d="M31 9l8 8-21 21H10v-8zM27 13l8 8" {...LINE} />;
    case 'cog':
      return (
        <>
          <circle cx="24" cy="24" r="6" {...LINE} />
          <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M11.3 36.7l4.2-4.2M32.5 15.5l4.2-4.2" {...LINE} />
        </>
      );
    case 'grid':
      return (
        <>
          <rect x="8" y="8" width="13" height="13" rx="3.5" {...LINE} />
          <rect x="27" y="8" width="13" height="13" rx="3.5" {...LINE} />
          <rect x="8" y="27" width="13" height="13" rx="3.5" {...LINE} />
          <rect x="27" y="27" width="13" height="13" rx="3.5" {...LINE} />
        </>
      );
    case 'goals':
      return (
        <>
          <rect x="9" y="7" width="30" height="35" rx="5" {...LINE} />
          <path d="M16 18l3 3 6-6M16 30l3 3 6-6M29 19h4M29 31h4" {...LINE} />
        </>
      );
    case 'minus':
      return <path d="M13 24h22" {...LINE} strokeWidth={3.4} />;
    case 'plus':
      return <path d="M24 13v22M13 24h22" {...LINE} strokeWidth={3.4} />;
    case 'refresh':
      return <path d="M38 22a14 14 0 00-25-7l-3 3M10 26a14 14 0 0025 7l3-3M10 10v8h8M38 38v-8h-8" {...LINE} />;
    case 'undo':
      return <path d="M14 18h16a9 9 0 010 18H18M14 18l6-6M14 18l6 6" {...LINE} />;
  }
}

export function Icon({
  name,
  size = 24,
  title,
  className,
  ...rest
}: { name: IconName; size?: number; title?: string } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...rest}
    >
      {paths(name)}
    </svg>
  );
}
