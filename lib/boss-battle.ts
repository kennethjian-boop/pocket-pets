import type { Child } from '@/lib/mock-data';

export type BossAttackSourceType = 'mission' | 'parent_bonus';

export type BossAttack = {
  id: string;
  childId: string;
  childName: string;
  sourceType: BossAttackSourceType;
  sourceId?: string;
  title: string;
  damage: number;
  createdAt: string;
};

export type BossRewardConfig = {
  stars: number;
  hearts: number;
  screenEnergy: number;
};

export type BossBattleState = {
  bossId: string;
  bossName: string;
  bossTheme: string;
  bossDescription: string;
  bossImage: string;
  maxHp: number;
  currentHp: number;
  startedAt: string;
  weekLabel: string;
  isDefeated: boolean;
  rewardClaimed: boolean;
  rewardsByChild?: Record<string, BossRewardConfig>;
  attacks: BossAttack[];
};

export type BossRosterItem = {
  id: string;
  name: string;
  theme: string;
  description: string;
  maxHp: number;
  image: string;
};

const BOSS_BATTLE_STORAGE_KEY = 'family-boss-battle-state';

export const BOSS_REWARD: BossRewardConfig = {
  stars: 20,
  hearts: 1,
  screenEnergy: 1,
};

export const BOSS_ROSTER: BossRosterItem[] = [
  {
    id: 'glitch-gremlin',
    name: 'Glitch Gremlin',
    theme: 'Screen chaos',
    description:
      'A mischievous troublemaker that feeds on too much screen time and tech chaos.',
    maxHp: 100,
    image: '/bosses/glitch-gremlin/Glitch Gremlin.png',
  },
  {
    id: 'sleepy-fog',
    name: 'Sleepy Fog',
    theme: 'Poor sleep habits',
    description:
      'A soft cloud of yawns that grows stronger when bedtime routines drift away.',
    maxHp: 100,
    image: '/bosses/sleepy-fog/the sleepy fog.png',
  },
  {
    id: 'mess-monster',
    name: 'Mess Monster',
    theme: 'Messy rooms and chores',
    description:
      'A clutter-loving creature that shrinks when the family tidies up together.',
    maxHp: 100,
    image: '/bosses/mess-monster/Mess Monster.png',
  },
  {
    id: 'grumble-golem',
    name: 'Grumble Golem',
    theme: 'Emotional storms',
    description:
      'A cranky stone giant that cracks when calm choices and kind words show up.',
    maxHp: 100,
    image: '/bosses/grumble-golem/Grumble Golem.png',
  },
  {
    id: 'delay-diva',
    name: 'Delay Diva',
    theme: 'Procrastination',
    description:
      'A dramatic dawdler that loses power when small jobs get started.',
    maxHp: 100,
    image: '/bosses/delay-diva/The Delay Diva.png',
  },
];

export const BOSS_DAMAGE_OPTIONS = [5, 10, 20] as const;

export function getBossBattleStorageKey() {
  return BOSS_BATTLE_STORAGE_KEY;
}

export function getWeekLabel(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
}

export function getMissionAttackSourceId(childId: string, missionId: string) {
  return `mission:${childId}:${missionId}`;
}

export function createDefaultBossBattleState(
  boss: BossRosterItem = BOSS_ROSTER[0]
): BossBattleState {
  return recalculateBossBattleState({
    bossId: boss.id,
    bossName: boss.name,
    bossTheme: boss.theme,
    bossDescription: boss.description,
    bossImage: boss.image,
    maxHp: boss.maxHp,
    currentHp: boss.maxHp,
    startedAt: new Date().toISOString(),
    weekLabel: getWeekLabel(),
    isDefeated: false,
    rewardClaimed: false,
    rewardsByChild: {},
    attacks: [],
  });
}

export function getBossRewardForChild(
  state: Pick<BossBattleState, 'rewardsByChild'>,
  childId: string
): BossRewardConfig {
  return state.rewardsByChild?.[childId] ?? BOSS_REWARD;
}

export function setBossRewardForChild(
  state: BossBattleState,
  childId: string,
  reward: BossRewardConfig
): BossBattleState {
  return {
    ...state,
    rewardsByChild: {
      ...state.rewardsByChild,
      [childId]: {
        stars: Math.max(0, Math.floor(reward.stars)),
        hearts: Math.max(0, Math.floor(reward.hearts)),
        screenEnergy: Math.max(0, Math.floor(reward.screenEnergy)),
      },
    },
  };
}

export function getNextBoss(currentBossId?: string) {
  if (BOSS_ROSTER.length === 0) {
    throw new Error('BOSS_ROSTER must include at least one boss.');
  }

  const currentIndex = BOSS_ROSTER.findIndex((boss) => boss.id === currentBossId);
  if (currentIndex < 0) {
    return BOSS_ROSTER[0];
  }

  return BOSS_ROSTER[(currentIndex + 1) % BOSS_ROSTER.length];
}

export function recalculateBossBattleState(state: BossBattleState): BossBattleState {
  const totalDamage = state.attacks.reduce((sum, attack) => sum + attack.damage, 0);
  const currentHp = Math.max(0, state.maxHp - totalDamage);

  return {
    ...state,
    currentHp,
    isDefeated: currentHp === 0,
  };
}

export function readBossBattleState(): BossBattleState {
  if (typeof window === 'undefined') return createDefaultBossBattleState();

  try {
    const stored = window.localStorage.getItem(BOSS_BATTLE_STORAGE_KEY);
    if (!stored) return createDefaultBossBattleState();

    const parsed = JSON.parse(stored) as Partial<BossBattleState>;
    return recalculateBossBattleState({
      ...createDefaultBossBattleState(),
      ...parsed,
      attacks: Array.isArray(parsed.attacks) ? parsed.attacks : [],
      maxHp: typeof parsed.maxHp === 'number' ? parsed.maxHp : 100,
      rewardClaimed: parsed.rewardClaimed ?? false,
      rewardsByChild: parsed.rewardsByChild ?? {},
    });
  } catch (error) {
    console.error('Failed to load boss battle state', error);
    return createDefaultBossBattleState();
  }
}

export function writeBossBattleState(state: BossBattleState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    BOSS_BATTLE_STORAGE_KEY,
    JSON.stringify(recalculateBossBattleState(state))
  );
}

export function addBossAttack(
  state: BossBattleState,
  attack: Omit<BossAttack, 'id' | 'createdAt'>
) {
  if (
    attack.sourceId &&
    state.attacks.some((item) => item.sourceId === attack.sourceId)
  ) {
    return state;
  }

  return recalculateBossBattleState({
    ...state,
    attacks: [
      {
        ...attack,
        id: `${attack.sourceType}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        damage: Math.max(0, attack.damage),
        createdAt: new Date().toISOString(),
      },
      ...state.attacks,
    ],
  });
}

export function removeBossAttackBySourceId(
  state: BossBattleState,
  sourceId: string
) {
  return recalculateBossBattleState({
    ...state,
    attacks: state.attacks.filter((attack) => attack.sourceId !== sourceId),
  });
}

export function resetBossBattle(boss: BossRosterItem = BOSS_ROSTER[0]) {
  const nextState = createDefaultBossBattleState(boss);
  writeBossBattleState(nextState);
  return nextState;
}

export function startNextBossBattle(currentState: BossBattleState) {
  const nextBoss = getNextBoss(currentState.bossId);
  return resetBossBattle(nextBoss);
}

export function claimBossRewardsForChildren(
  children: Child[],
  saveChild: (child: Child, updates: Pick<Child, 'stars' | 'hearts' | 'screenEnergy'>) => void
) {
  const state = readBossBattleState();
  if (!state.isDefeated || state.rewardClaimed) {
    return { state, children };
  }

  const nextChildren = children.map((child) => {
    const reward = getBossRewardForChild(state, child.id);
    const nextChild = {
      ...child,
      stars: child.stars + reward.stars,
      hearts: child.hearts + reward.hearts,
      screenEnergy: child.screenEnergy + reward.screenEnergy,
    };

    saveChild(child, {
      stars: nextChild.stars,
      hearts: nextChild.hearts,
      screenEnergy: nextChild.screenEnergy,
    });

    return nextChild;
  });

  const nextState = { ...state, rewardClaimed: true };
  writeBossBattleState(nextState);

  return { state: nextState, children: nextChildren };
}
