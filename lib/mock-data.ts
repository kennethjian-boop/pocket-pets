export interface Pet {
  id: string;
  childId: string;
  name: string;
  pet: 'luna' | 'bubbo' | 'mochi' | 'ember';
  mood: 'neutral' | 'happy' | 'sleepy' | 'sad';
  emoji: string;
}

export interface PetRosterItem {
  id: 'luna' | 'bubbo' | 'mochi' | 'ember';
  name: string;
  description: string;
  emoji: string;
  defaultMood: 'neutral' | 'happy' | 'sad' | 'sleep';
  moodImages: {
    neutral: string;
    happy: string;
    sad: string;
    sleep: string;
  };
}

export interface Child {
  id: string;
  name: string;
  petId: string;
  stars: number;
  hearts: number;
  screenEnergy: number;
}

export interface Streak {
  childId: string;
  type: string;
  count: number;
  lastDate: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  type: 'screen-energy' | 'egg';
  icon: string;
  helperText: string;
  effectAmount?: number;
}

export interface FamilyBoss {
  id: string;
  name: string;
  emoji: string;
  currentHealth: number;
  maxHealth: number;
  reward: {
    name: string;
    emoji: string;
  };
}

export const mockChildren: Child[] = [
  {
    id: 'child-ansel',
    name: 'Ansel',
    petId: 'pet-ansel',
    stars: 42,
    hearts: 3,
    screenEnergy: 3,
  },
  {
    id: 'child-thea',
    name: 'Thea',
    petId: 'pet-thea',
    stars: 38,
    hearts: 5,
    screenEnergy: 4,
  },
];

export const mockPets: Pet[] = [
  {
    id: 'pet-ansel',
    childId: 'child-ansel',
    name: 'Sparkle',
    pet: 'bubbo',
    mood: 'happy',
    emoji: '✨',
  },
  {
    id: 'pet-thea',
    childId: 'child-thea',
    name: 'Cozy',
    pet: 'luna',
    mood: 'neutral',
    emoji: '🌙',
  },
];

export const PET_ROSTER: PetRosterItem[] = [
  {
    id: 'bubbo',
    name: 'Bubbo',
    description: 'A gentle creature that loves soft play and cozy moments.',
    emoji: 'Bubble',
    defaultMood: 'neutral',
    moodImages: {
      neutral: '/pets/bubbo/moods/neutral.png',
      happy: '/pets/bubbo/moods/happy.png',
      sad: '/pets/bubbo/moods/sad.png',
      sleep: '/pets/bubbo/moods/sleepy.png',
    },
  },
  {
    id: 'luna',
    name: 'Luna',
    description: 'A cozy pet friend with a gentle heart.',
    emoji: 'Moon',
    defaultMood: 'neutral',
    moodImages: {
      neutral: '/pets/luna/moods/neutral.png',
      happy: '/pets/luna/moods/happy.png',
      sad: '/pets/luna/moods/sad.png',
      sleep: '/pets/luna/moods/sleepy.png',
    },
  },
  {
    id: 'mochi',
    name: 'Mochi',
    description: 'A soft and squishy companion who loves warm hugs.',
    emoji: '🍡',
    defaultMood: 'neutral',
    moodImages: {
      neutral: '/pets/mochi/neutral.png',
      happy: '/pets/mochi/happy.png',
      sad: '/pets/mochi/sad.png',
      sleep: '/pets/mochi/sleepy.png',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'A fiery little spirit full of energy and warmth.',
    emoji: '🔥',
    defaultMood: 'neutral',
    moodImages: {
      neutral: '/pets/ember/neutral.png',
      happy: '/pets/ember/happy.png',
      sad: '/pets/ember/sad.png',
      sleep: '/pets/ember/sleepy.png',
    },
  },
];

export const mockStreaks: Streak[] = [
  {
    childId: 'child-ansel',
    type: 'reading',
    count: 7,
    lastDate: new Date().toISOString(),
  },
  {
    childId: 'child-ansel',
    type: 'kind-listening',
    count: 3,
    lastDate: new Date().toISOString(),
  },
  {
    childId: 'child-thea',
    type: 'brushing-teeth',
    count: 12,
    lastDate: new Date().toISOString(),
  },
];

export const mockRewards: Reward[] = [
  {
    id: 'screen-energy-1',
    name: '1 Screen Energy',
    cost: 20,
    type: 'screen-energy',
    helperText: 'Adds 10 minutes weekend screen time',
    effectAmount: 1,
    icon: '📱',
  },
  {
    id: 'screen-energy-6',
    name: '6 Screen Energy',
    cost: 100,
    type: 'screen-energy',
    helperText: 'Best value. Adds 60 minutes weekend screen time',
    effectAmount: 6,
    icon: '📱',
  },
  {
    id: 'secret-egg',
    name: 'Secret Egg',
    cost: 50,
    type: 'egg',
    helperText: 'Hatches after 10 parent-verified goals',
    icon: 'Egg',
  },
];

export const mockFamilyBoss: FamilyBoss = {
  id: 'boss-1',
  name: 'Dust Monster',
  emoji: '👾',
  currentHealth: 45,
  maxHealth: 100,
  reward: {
    name: 'Movie Night',
    emoji: '🍿',
  },
};

export function getChild(childId: string): Child | undefined {
  return mockChildren.find((child) => child.id === childId);
}

export function getPet(petId: string): Pet | undefined {
  return mockPets.find((pet) => pet.id === petId);
}

export function getPetByChildId(childId: string): Pet | undefined {
  return mockPets.find((pet) => pet.childId === childId);
}

export function getChildStreaks(childId: string): Streak[] {
  return mockStreaks.filter((streak) => streak.childId === childId);
}

