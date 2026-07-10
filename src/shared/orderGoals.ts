export type OrderGoalTone = 'brand' | 'terminid' | 'automaton' | 'illuminate' | 'default';

export type OrderGoalProgress =
  | { kind: 'bar'; current: number; goal: number }
  | { kind: 'box'; complete: boolean };

export type OrderGoal = {
  text: string;
  tone: OrderGoalTone;
  progress?: OrderGoalProgress;
};

/** Helldivers brand + faction goal colors. */
export const GOAL_TONE_COLORS: Record<Exclude<OrderGoalTone, 'default'>, string> = {
  brand: '#FFE900',
  terminid: '#FFB900',
  automaton: '#FF7171',
  illuminate: '#CD8AE9',
};

/**
 * Colored square emoji for textarea widget goals.
 * Reddit strips inline HTML/CSS in TextAreaWidget markdown — emoji are the reliable fallback.
 */
export const GOAL_TONE_EMOJI: Record<OrderGoalTone, string> = {
  brand: '🟨',
  terminid: '🟧',
  automaton: '🟥',
  illuminate: '🟪',
  default: '▪',
};

export function goalToneEmoji(tone: OrderGoalTone): string {
  return GOAL_TONE_EMOJI[tone];
}

/** Planet hold box markers for textarea widgets (mirrors grey/green completion boxes). */
export const GOAL_BOX_PENDING_EMOJI = '⬛';
export const GOAL_BOX_COMPLETE_EMOJI = '🟩';

const FACTION_RACE_TO_TONE: Record<number, OrderGoalTone> = {
  1: 'automaton',
  2: 'terminid',
  3: 'illuminate',
};

export function goalToneForFactionRace(raceId: number | undefined): OrderGoalTone {
  if (typeof raceId !== 'number') {
    return 'brand';
  }

  return FACTION_RACE_TO_TONE[raceId] ?? 'brand';
}

export function goalClassName(tone: OrderGoalTone): string {
  if (tone === 'default') {
    return 'goal-brand';
  }

  return `goal-${tone}`;
}

export function goalProgressPercent(progress: Extract<OrderGoalProgress, { kind: 'bar' }>): number {
  if (progress.goal <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((progress.current / progress.goal) * 100));
}

export function goalDisplayLabel(goal: OrderGoal): string {
  if (goal.progress?.kind === 'box') {
    return goal.text.replace(/^(Hold|Liberate|Defend)\s+/i, '');
  }

  return goal.text;
}
