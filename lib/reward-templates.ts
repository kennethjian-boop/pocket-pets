export type CurrencyType = 'stars' | 'hearts' | 'screen-energy';
export type RewardType = 'positive' | 'deduction';

export interface RewardTemplate {
  id: string;
  label: string;
  icon: string;
  amount: number;
  currencyType: CurrencyType;
  rewardType: RewardType;
}

export const currencyEmoji: Record<CurrencyType, string> = {
  stars: '⭐',
  hearts: '❤️',
  'screen-energy': '🔋',
};

export const currencyLabel: Record<CurrencyType, string> = {
  stars: 'Stars',
  hearts: 'Hearts',
  'screen-energy': 'Screen Energy',
};

export const defaultRewardTemplates: RewardTemplate[] = [
  {
    id: 'reading',
    label: 'Reading',
    icon: '📚',
    amount: 5,
    currencyType: 'stars',
    rewardType: 'positive',
  },
  {
    id: 'good-listening',
    label: 'Listening',
    icon: '👂',
    amount: 5,
    currencyType: 'stars',
    rewardType: 'positive',
  },
  {
    id: 'chores',
    label: 'Chores',
    icon: '🧺',
    amount: 5,
    currencyType: 'stars',
    rewardType: 'positive',
  },
  {
    id: 'pet-care',
    label: 'Pet Care',
    icon: '🐾',
    amount: 3,
    currencyType: 'stars',
    rewardType: 'positive',
  },
  {
    id: 'kindness',
    label: 'Kindness',
    icon: '💚',
    amount: 1,
    currencyType: 'hearts',
    rewardType: 'positive',
  },
  {
    id: 'honesty',
    label: 'Honesty',
    icon: '✨',
    amount: 1,
    currencyType: 'hearts',
    rewardType: 'positive',
  },
  {
    id: 'calm-down',
    label: 'Calm Down',
    icon: '😌',
    amount: 1,
    currencyType: 'hearts',
    rewardType: 'positive',
  },
  {
    id: 'perseverance',
    label: 'Kept Trying',
    icon: '🌱',
    amount: 1,
    currencyType: 'hearts',
    rewardType: 'positive',
  },
  {
    id: 'screaming',
    label: 'Screaming',
    icon: '🌧️',
    amount: 5,
    currencyType: 'stars',
    rewardType: 'deduction',
  },
  {
    id: 'not-listening',
    label: 'Not Listening',
    icon: '🙉',
    amount: 5,
    currencyType: 'stars',
    rewardType: 'deduction',
  },
  {
    id: 'weekend-screen-energy',
    label: 'Weekend Screen',
    icon: 'SE',
    amount: 1,
    currencyType: 'screen-energy',
    rewardType: 'positive',
  },
  {
    id: 'remove-screen-energy',
    label: 'Screen Energy',
    icon: 'SE',
    amount: 1,
    currencyType: 'screen-energy',
    rewardType: 'deduction',
  },
];

export function getRewardDelta(template: RewardTemplate) {
  return template.rewardType === 'deduction' ? -template.amount : template.amount;
}

export function getRewardTemplate(id: string): RewardTemplate | undefined {
  return defaultRewardTemplates.find((template) => template.id === id);
}
