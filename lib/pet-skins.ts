export type PetType = 'luna' | 'bubbo' | 'mochi' | 'ember';

export type SkinId =
  | 'astronaut-bubbo'
  | 'dragon-knight-bubbo'
  | 'forest-druid-bubbo'
  | 'pirate-captain-bubbo'
  | 'sakura-festival-bubbo'
  | 'candy-princess-luna'
  | 'magical-idol-luna'
  | 'moon-priestess-luna'
  | 'rainbow-carnival-luna'
  | 'royal-tea-party-luna'
  | 'angel-mochi'
  | 'forest-spirit-mochi'
  | 'magical-idol-mochi'
  | 'royal-prince-mochi'
  | 'strawberry-shortcake-mochi'
  | 'aurora-spirit-ember'
  | 'candy-witch-ember'
  | 'celestial-guardian-ember'
  | 'dragon-knight-ember'
  | 'moonlight-sorcerer-ember';

export interface PetSkin {
  id: SkinId;
  petType: PetType;
  name: string;
  imagePath: string;
  cost: number;
}

export const SKIN_COST = 50;

export const SKIN_ROSTER: PetSkin[] = [
  // Bubbo
  { id: 'astronaut-bubbo',      petType: 'bubbo', name: 'Astronaut Bubbo',      imagePath: '/pets/skins-transparent/Astronaut Bubbo.png',      cost: SKIN_COST },
  { id: 'dragon-knight-bubbo',  petType: 'bubbo', name: 'Dragon Knight Bubbo',  imagePath: '/pets/skins-transparent/Dragon Knight Bubbo.png',  cost: SKIN_COST },
  { id: 'forest-druid-bubbo',   petType: 'bubbo', name: 'Forest Druid Bubbo',   imagePath: '/pets/skins-transparent/Forest Druid Bubbo.png',   cost: SKIN_COST },
  { id: 'pirate-captain-bubbo', petType: 'bubbo', name: 'Pirate Captain Bubbo', imagePath: '/pets/skins-transparent/Pirate Captain Bubbo.png', cost: SKIN_COST },
  { id: 'sakura-festival-bubbo',petType: 'bubbo', name: 'Sakura Festival Bubbo',imagePath: '/pets/skins-transparent/Sakura Festival Bubbo.png',cost: SKIN_COST },
  // Luna
  { id: 'candy-princess-luna',  petType: 'luna',  name: 'Candy Princess Luna',  imagePath: '/pets/skins-transparent/Candy Princess Luna.png',  cost: SKIN_COST },
  { id: 'magical-idol-luna',    petType: 'luna',  name: 'Magical Idol Luna',    imagePath: '/pets/skins-transparent/Magical Idol Luna.png',    cost: SKIN_COST },
  { id: 'moon-priestess-luna',  petType: 'luna',  name: 'Moon Priestess Luna',  imagePath: '/pets/skins-transparent/Moon Priestess Luna.png',  cost: SKIN_COST },
  { id: 'rainbow-carnival-luna',petType: 'luna',  name: 'Rainbow Carnival Luna',imagePath: '/pets/skins-transparent/Rainbow Carnival Luna.png',cost: SKIN_COST },
  { id: 'royal-tea-party-luna', petType: 'luna',  name: 'Royal Tea Party Luna', imagePath: '/pets/skins-transparent/Royal Tea Party Luna.png', cost: SKIN_COST },
  // Mochi
  { id: 'angel-mochi',               petType: 'mochi', name: 'Angel Mochi',               imagePath: '/pets/skins-transparent/Angel Mochi.png',               cost: SKIN_COST },
  { id: 'forest-spirit-mochi',       petType: 'mochi', name: 'Forest Spirit Mochi',       imagePath: '/pets/skins-transparent/Forest Spirit Mochi.png',       cost: SKIN_COST },
  { id: 'magical-idol-mochi',        petType: 'mochi', name: 'Magical Idol Mochi',        imagePath: '/pets/skins-transparent/Magical Idol Mochi.png',        cost: SKIN_COST },
  { id: 'royal-prince-mochi',        petType: 'mochi', name: 'Royal Prince Mochi',        imagePath: '/pets/skins-transparent/Royal Prince Mochi.png',        cost: SKIN_COST },
  { id: 'strawberry-shortcake-mochi',petType: 'mochi', name: 'Strawberry Shortcake Mochi',imagePath: '/pets/skins-transparent/Strawberry Shortcake Mochi.png',cost: SKIN_COST },
  // Ember
  { id: 'aurora-spirit-ember',      petType: 'ember', name: 'Aurora Spirit Ember',      imagePath: '/pets/skins-transparent/Aurora Spirit Ember.png',      cost: SKIN_COST },
  { id: 'candy-witch-ember',        petType: 'ember', name: 'Candy Witch Ember',        imagePath: '/pets/skins-transparent/Candy Witch Ember.png',        cost: SKIN_COST },
  { id: 'celestial-guardian-ember', petType: 'ember', name: 'Celestial Guardian Ember', imagePath: '/pets/skins-transparent/Celestial Guardian Ember.png', cost: SKIN_COST },
  { id: 'dragon-knight-ember',      petType: 'ember', name: 'Dragon Knight Ember',      imagePath: '/pets/skins-transparent/Dragon Knight Ember.png',      cost: SKIN_COST },
  { id: 'moonlight-sorcerer-ember', petType: 'ember', name: 'Moonlight Sorcerer Ember', imagePath: '/pets/skins-transparent/Moonlight Sorcerer Ember.png', cost: SKIN_COST },
];

export const VALID_SKIN_IDS = new Set<string>(SKIN_ROSTER.map((s) => s.id));

export const skinsByPet: Record<PetType, PetSkin[]> = {
  bubbo: SKIN_ROSTER.filter((s) => s.petType === 'bubbo'),
  luna:  SKIN_ROSTER.filter((s) => s.petType === 'luna'),
  mochi: SKIN_ROSTER.filter((s) => s.petType === 'mochi'),
  ember: SKIN_ROSTER.filter((s) => s.petType === 'ember'),
};

export function getSkinById(id: string): PetSkin | undefined {
  return SKIN_ROSTER.find((s) => s.id === id);
}
