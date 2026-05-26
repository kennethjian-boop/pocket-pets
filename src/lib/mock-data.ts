// Mock data for Pocket Pets Phase 1

export interface Pet {
  id: string;
  childId: string;
  name: string;
  mood: 'happy' | 'sleepy' | 'excited' | 'calm' | 'low-energy';
  emoji: string;
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
  type: 'screen-energy' | 'cosmetic' | 'unlock';
  icon: string;
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

// Mock children
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

// Mock pets
export const mockPets: Pet[] = [
  {
    id: 'pet-ansel',
    childId: 'child-ansel',
    name: 'Sparkle',
    mood: 'happy',
    emoji: '✨',
  },
  {
    id: 'pet-thea',
    childId: 'child-thea',
    name: 'Cozy',
    mood: 'calm',
    emoji: '🌙',
  },
];

// Mock streaks
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

// Mock rewards
export const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    name: '1 Screen Energy',
    cost: 20,
    type: 'screen-energy',
    icon: '📱',
  },
  {
    id: 'reward-2',
    name: '2 Screen Energy',
    cost: 40,
    type: 'screen-energy',
    icon: '📱',
  },
  {
    id: 'reward-3',
    name: 'Sparkly Hat',
    cost: 10,
    type: 'cosmetic',
    icon: '👒',
  },
  {
    id: 'reward-4',
    name: 'Magic Wings',
    cost: 15,
    type: 'cosmetic',
    icon: '🪶',
  },
  {
    id: 'reward-5',
    name: 'Secret Egg',
    cost: 20,
    type: 'unlock',
    icon: '🥚',
  },
];

// Mock family boss
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

// Helper function to get child by ID
export function getChild(childId: string): Child | undefined {
  return mockChildren.find((c) => c.id === childId);
}

// Helper function to get pet by ID
export function getPet(petId: string): Pet | undefined {
  return mockPets.find((p) => p.id === petId);
}

// Helper function to get pet by child ID
export function getPetByChildId(childId: string): Pet | undefined {
  return mockPets.find((p) => p.childId === childId);
}

// Helper function to get streaks by child ID
export function getChildStreaks(childId: string): Streak[] {
  return mockStreaks.filter((s) => s.childId === childId);
}
