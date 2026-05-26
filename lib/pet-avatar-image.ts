import { PET_ROSTER } from '@/lib/mock-data';
import { petMoodImages, type PetMood } from '@/lib/pet-mood';
import { getSkinById, type PetType } from '@/lib/pet-skins';

type ResolvePetAvatarImageOptions = {
  pet: PetType;
  mood: PetMood;
  petName?: string;
  activeSkinId?: string | null;
};

export function resolvePetAvatarImage({
  pet,
  mood,
  petName,
  activeSkinId,
}: ResolvePetAvatarImageOptions) {
  const activeSkin = activeSkinId ? getSkinById(activeSkinId) : null;
  const rosterPet = PET_ROSTER.find((item) => item.id === pet);
  const displayName = petName ?? rosterPet?.name ?? 'Pet';

  return {
    src: activeSkin?.imagePath ?? petMoodImages[pet][mood],
    alt: activeSkin?.name ?? `${displayName} ${mood}`,
    isSkin: Boolean(activeSkin),
    skinName: activeSkin?.name ?? null,
  };
}
