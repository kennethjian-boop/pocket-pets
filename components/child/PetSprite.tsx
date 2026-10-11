import Image from 'next/image';
import type { PetMood } from '@/lib/pet-mood';
import type { PetType } from '@/lib/pet-skins';
import { resolvePetAvatarImage } from '@/lib/pet-avatar-image';

/**
 * The pet artwork standing on the ground: object-contain + bottom anchoring keeps
 * pets with different padding and aspect ratios planted at the same baseline.
 */
export function PetSprite({
  pet,
  mood = 'happy',
  skinId,
  petName,
  sizes = '320px',
  idle = true,
  shadow = true,
  eager = false,
  className = '',
  grayscale = false,
}: {
  pet: PetType;
  mood?: PetMood;
  skinId?: string | null;
  petName?: string;
  sizes?: string;
  idle?: boolean;
  shadow?: boolean;
  eager?: boolean;
  className?: string;
  grayscale?: boolean;
}) {
  const image = resolvePetAvatarImage({ pet, mood, petName, activeSkinId: skinId });
  const sleeping = !image.isSkin && mood === 'sleep';
  return (
    <div className={`relative ${className}`}>
      {shadow ? (
        <div
          className="absolute inset-x-[18%] bottom-[2%] h-[9%] rounded-[50%] bg-ink/20 blur-[6px]"
          aria-hidden="true"
        />
      ) : null}
      <div className={`absolute inset-0 ${idle ? (sleeping ? 'animate-breathe' : 'animate-float') : ''}`} style={{ transformOrigin: '50% 100%' }}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          className={`object-contain object-bottom drop-shadow-[0_6px_10px_rgb(58_42_77/0.18)] ${grayscale ? 'grayscale opacity-50' : ''}`}
        />
      </div>
    </div>
  );
}

/** Round portrait crop for chips, nav, and player cards. */
export function PetFace({
  pet,
  skinId,
  size = 40,
  className = '',
  ring = 'ring-white',
}: {
  pet: PetType;
  skinId?: string | null;
  size?: number;
  className?: string;
  ring?: string;
}) {
  const image = resolvePetAvatarImage({ pet, mood: 'happy', activeSkinId: skinId });
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-gradient-to-b from-plum-100 to-peach-100 ring-2 ${ring} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={image.src}
        alt=""
        fill
        sizes={`${size * 2}px`}
        className="scale-[1.35] object-cover object-[50%_30%]"
      />
    </span>
  );
}
