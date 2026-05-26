import type { PetType } from '@/lib/pet-mood';

export interface PetAnchors {
  head_center:    { x: number; y: number };
  shoulder_left:  { x: number; y: number };
  shoulder_right: { x: number; y: number };
  body_center:    { x: number; y: number };
  back_center?:   { x: number; y: number };
}

// Anchor points are percentages of the 280×280px pet container.
// Since all pet PNGs are square and rendered with object-contain in a square
// container, the image fills the container exactly — no padding correction needed.
//
// To calibrate: pass showAnchorDebug to PetAvatar (dev only) and adjust values
// until the colored dots land on the correct body parts.
export const petAnchorDefinitions: Record<PetType, PetAnchors> = {
  luna: {
    // Tall fluffy bunny/unicorn — "Neutral/Happy/etc." text is baked into bottom of PNGs
    head_center:    { x: 50, y: 3  }, // crown between ears
    shoulder_left:  { x: 19, y: 48 }, // left body edge at shoulder height
    shoulder_right: { x: 81, y: 48 }, // right body edge at shoulder height
    body_center:    { x: 50, y: 65 },
    back_center:    { x: 50, y: 48 },
  },
  bubbo: {
    // Compact dino — crest spikes occupy y≈3–14%, hat sits below them
    head_center:    { x: 50, y: 14 }, // below spiky crest
    shoulder_left:  { x: 24, y: 44 },
    shoulder_right: { x: 76, y: 44 },
    body_center:    { x: 50, y: 62 },
    back_center:    { x: 50, y: 44 },
  },
  mochi: {
    // Round fluffy cat with collar
    head_center:    { x: 50, y: 5  },
    shoulder_left:  { x: 20, y: 46 },
    shoulder_right: { x: 80, y: 46 },
    body_center:    { x: 50, y: 65 },
    back_center:    { x: 50, y: 46 },
  },
  ember: {
    // Purple dragon — has natural wings; accessory wings overlay them
    head_center:    { x: 50, y: 3  },
    shoulder_left:  { x: 15, y: 46 },
    shoulder_right: { x: 85, y: 46 },
    body_center:    { x: 50, y: 65 },
    back_center:    { x: 50, y: 46 },
  },
};
