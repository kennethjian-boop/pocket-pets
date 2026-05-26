export type AnchorName =
  | 'head_center'
  | 'shoulder_left'
  | 'shoulder_right'
  | 'body_center'
  | 'back_center';

export interface AccessoryElement {
  anchor: AnchorName;
  // Offsets in container-% units (same coordinate space as anchor points)
  offsetX: number;
  offsetY: number;
  // Container div size as % of the 280px pet container
  widthPct: number;
  heightPct: number;
  // Optional CSS transform (e.g. 'translateY(-50%) scaleX(-1)' for left wing flip)
  transform?: string;
  zIndex: number;
}

export interface AccessoryConfig {
  id: string;
  elements: AccessoryElement[];
}

// Asset path convention: /pets/${petType}/accessories/${accessoryId}.png
// No per-element config needed — just place the file at the right path.

export const shopAccessoryConfigs: AccessoryConfig[] = [
  {
    id: 'sparkly-hat',
    elements: [
      {
        anchor: 'head_center',
        offsetX: 0,
        offsetY: 0,
        widthPct: 40,
        heightPct: 30,
        // translateX(-50%) centers the hat horizontally on the head anchor
        transform: 'translateX(-50%)',
        zIndex: 55,
      },
    ],
  },
  {
    id: 'magic-wings',
    elements: [
      {
        // Left wing — PNG is right-facing by convention; scaleX(-1) flips it outward
        anchor: 'shoulder_left',
        offsetX: -45,
        offsetY: 0,
        widthPct: 45,
        heightPct: 40,
        transform: 'translateY(-50%) scaleX(-1)',
        zIndex: 10,
      },
      {
        // Right wing — natural right-facing orientation
        anchor: 'shoulder_right',
        offsetX: 0,
        offsetY: 0,
        widthPct: 45,
        heightPct: 40,
        transform: 'translateY(-50%)',
        zIndex: 10,
      },
    ],
  },
];
