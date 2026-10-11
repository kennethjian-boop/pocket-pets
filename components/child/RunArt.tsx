import type { GemKind, ObstacleKind } from '@/lib/adventure-run-rules';

/** Storybook artwork for Pet Adventure Run (inline SVG, no image assets). */

const INK = '#3a2a4d';

export function ObstacleArt({ kind }: { kind: ObstacleKind }) {
  if (kind === 'log') {
    return (
      <svg viewBox="0 0 140 80" className="h-full w-full overflow-visible" aria-hidden="true">
        <ellipse cx="70" cy="78" rx="66" ry="6" fill={INK} opacity="0.15" />
        <rect x="10" y="18" width="118" height="58" rx="28" fill="#b9845a" stroke={INK} strokeWidth="5" />
        <path d="M34 34c18 6 46 6 70 0M30 56c22 6 50 6 76 0" fill="none" stroke="#8d5d3b" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="22" cy="47" rx="16" ry="27" fill="#e9c08f" stroke={INK} strokeWidth="5" />
        <ellipse cx="22" cy="47" rx="8" ry="14" fill="none" stroke="#b9845a" strokeWidth="3" />
        <path d="M96 18c4-12 14-14 18-6" fill="none" stroke="#5b9a6e" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="114" cy="12" rx="8" ry="5" fill="#7cc48e" />
      </svg>
    );
  }
  if (kind === 'mushroom') {
    return (
      <svg viewBox="0 0 90 120" className="h-full w-full overflow-visible" aria-hidden="true">
        <ellipse cx="45" cy="118" rx="38" ry="5" fill={INK} opacity="0.15" />
        <path d="M32 62h26l4 54H28z" fill="#fff3e2" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M6 64C6 30 24 8 45 8s39 22 39 56z" fill="#f8678f" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="30" cy="36" r="7" fill="#fff" />
        <circle cx="56" cy="28" r="5" fill="#fff" />
        <circle cx="64" cy="50" r="6" fill="#fff" />
        <circle cx="38" cy="96" r="3" fill={INK} />
        <circle cx="52" cy="96" r="3" fill={INK} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 150 30" className="h-full w-full overflow-visible" aria-hidden="true">
      <ellipse cx="75" cy="17" rx="72" ry="12" fill="#7ec6fb" stroke={INK} strokeWidth="4" />
      <ellipse cx="60" cy="14" rx="26" ry="4" fill="#d8eeff" />
      <circle cx="104" cy="16" r="3" fill="#eef8ff" />
    </svg>
  );
}

export function GemArt({ kind }: { kind: GemKind }) {
  const rainbow = kind === 'rainbow';
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill={rainbow ? '#ffd25e' : '#b3defe'} opacity="0.35" />
      {rainbow ? (
        <defs>
          <linearGradient id="run-rainbow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8fae" />
            <stop offset="0.35" stopColor="#ffd25e" />
            <stop offset="0.7" stopColor="#74d8a5" />
            <stop offset="1" stopColor="#7ec6fb" />
          </linearGradient>
        </defs>
      ) : null}
      <path d="M14 12h20l8 10-18 20L6 22z" fill={rainbow ? 'url(#run-rainbow)' : '#4eabf2'} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M6 22h36M18 12l-4 10 10 20 10-20-4-10" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" opacity="0.7" />
      <path d="M16 16l-2 4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** Horizontally repeating parallax layer; `offset` is in px and wraps every `tile` px. */
export function ParallaxLayer({
  layer,
  offset,
  tile,
  className = '',
}: {
  layer: 'hills' | 'trees' | 'ground';
  offset: number;
  tile: number;
  className?: string;
}) {
  const shift = -(((offset % tile) + tile) % tile);
  const id = `run-${layer}`;
  return (
    <svg
      className={`pointer-events-none absolute left-0 h-full ${className}`}
      style={{ width: `calc(100% + ${tile}px)`, transform: `translate3d(${shift}px,0,0)` }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        {layer === 'hills' ? (
          <pattern id={id} width={tile} height="100%" patternUnits="userSpaceOnUse">
            <svg viewBox="0 0 400 100" width={tile} height="100%" preserveAspectRatio="none">
              <path d="M0 60 C 60 25, 120 25, 200 55 S 330 30, 400 60 L400 100 L0 100 Z" fill="#c6ead0" />
            </svg>
          </pattern>
        ) : layer === 'trees' ? (
          <pattern id={id} width={tile} height="100%" patternUnits="userSpaceOnUse">
            <svg viewBox="0 0 400 100" width={tile} height="100%" preserveAspectRatio="xMidYMax meet">
              {[20, 95, 160, 250, 330].map((x, i) => (
                <g key={x} transform={`translate(${x} ${i % 2 ? 18 : 6})`}>
                  <rect x="17" y="58" width="10" height="36" rx="3" fill="#a77b58" />
                  <circle cx="22" cy="46" r={i % 2 ? 20 : 26} fill={i % 3 ? '#8fcf9d' : '#74c08a'} />
                  <circle cx={i % 2 ? 10 : 34} cy="38" r="12" fill={i % 3 ? '#a7dcb6' : '#8fcf9d'} />
                </g>
              ))}
            </svg>
          </pattern>
        ) : (
          <pattern id={id} width={tile} height="100%" patternUnits="userSpaceOnUse">
            <svg viewBox="0 0 400 100" width={tile} height="100%" preserveAspectRatio="none">
              <rect width="400" height="100" fill="#9fd9ae" />
              <rect y="0" width="400" height="14" fill="#7cc48e" />
              <path d="M0 40h400" stroke="#e8d3a8" strokeWidth="26" opacity="0.65" />
              {[30, 110, 190, 270, 350].map((x) => (
                <path key={x} d={`M${x} 14l4-10 4 10 4-8 4 8`} fill="none" stroke="#5b9a6e" strokeWidth="3" strokeLinecap="round" />
              ))}
              {[70, 230, 310].map((x) => (
                <circle key={x} cx={x} cy="72" r="5" fill="#ff8fae" />
              ))}
            </svg>
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
