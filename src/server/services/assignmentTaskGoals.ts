import planetNames from '../../shared/planetNames.json';
import {
  goalToneForFactionRace,
  type OrderGoal,
  type OrderGoalProgress,
} from '../../shared/orderGoals.js';

/** Community-reverse-engineered AHGS task types (helldive.py / helldivers-2 API). */
const TASK_TYPE = {
  ERADICATE: 3,
  COMPLETE_MISSIONS: 7,
  COMPLETE_OPERATIONS: 9,
  LIBERATION: 11,
  DEFENSE: 12,
  CONTROL: 13,
} as const;

const PLANET_TASK_TYPES = new Set<number>([
  TASK_TYPE.LIBERATION,
  TASK_TYPE.DEFENSE,
  TASK_TYPE.CONTROL,
]);

/** Community-reverse-engineered value type codes in task valueTypes[]. */
const VALUE_TYPE = {
  RACE: 1,
  GOAL: 3,
  LOCATION_INDEX: 12,
} as const;

const FACTION_NAMES: Record<number, string> = {
  1: 'Automatons',
  2: 'Terminids',
  3: 'Illuminate',
};

export type AssignmentTask = {
  type?: number;
  values?: number[];
  valueTypes?: number[];
};

function zipTaskValues(task: AssignmentTask): Map<number, number> {
  const values = task.values ?? [];
  const valueTypes = task.valueTypes ?? [];
  const mapped = new Map<number, number>();

  for (let index = 0; index < Math.min(values.length, valueTypes.length); index += 1) {
    const valueType = valueTypes[index];
    const value = values[index];
    if (typeof valueType === 'number' && typeof value === 'number') {
      mapped.set(valueType, value);
    }
  }

  return mapped;
}

function planetName(index: number): string {
  const name = planetNames[String(index) as keyof typeof planetNames];
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  return `Planet ${index}`;
}

function factionName(raceId: number): string {
  return FACTION_NAMES[raceId] ?? `Faction ${raceId}`;
}

function formatGoalCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function planetGoalLabel(taskType: number, planetIndex: number): string | null {
  const planet = planetName(planetIndex);

  switch (taskType) {
    case TASK_TYPE.LIBERATION:
      return `Liberate ${planet}`;
    case TASK_TYPE.DEFENSE:
      return `Defend ${planet}`;
    case TASK_TYPE.CONTROL:
      return `Hold ${planet}`;
    default:
      return null;
  }
}

function boxProgress(current: number | undefined): OrderGoalProgress {
  return { kind: 'box', complete: (current ?? 0) >= 1 };
}

function barProgress(current: number | undefined, goal: number): OrderGoalProgress {
  return { kind: 'bar', current: current ?? 0, goal };
}

function brandPlanetGoal(text: string, current: number | undefined): OrderGoal {
  return { text, tone: 'brand', progress: boxProgress(current) };
}

function brandGoal(text: string, current: number | undefined, goal: number): OrderGoal {
  return { text, tone: 'brand', progress: barProgress(current, goal) };
}

export function decodeAssignmentTaskGoal(
  task: AssignmentTask,
  current: number | undefined,
): OrderGoal | null {
  const taskType = task.type;
  if (typeof taskType !== 'number') {
    return null;
  }

  const values = zipTaskValues(task);
  const planetIndex = values.get(VALUE_TYPE.LOCATION_INDEX);

  if (typeof planetIndex === 'number' && planetIndex > 0) {
    const planetGoal = planetGoalLabel(taskType, planetIndex);
    if (planetGoal && PLANET_TASK_TYPES.has(taskType)) {
      return brandPlanetGoal(planetGoal, current);
    }
  }

  if (taskType === TASK_TYPE.ERADICATE) {
    const goal = values.get(VALUE_TYPE.GOAL);
    const race = values.get(VALUE_TYPE.RACE);
    if (typeof goal === 'number' && goal > 0) {
      const target = typeof race === 'number' ? factionName(race) : 'enemies';
      return {
        text: `Kill ${formatGoalCount(goal)} ${target}`,
        tone: goalToneForFactionRace(race),
        progress: barProgress(current, goal),
      };
    }
  }

  if (taskType === TASK_TYPE.COMPLETE_MISSIONS) {
    const goal = values.get(VALUE_TYPE.GOAL);
    if (typeof goal === 'number' && goal > 0) {
      return brandGoal(`Complete ${formatGoalCount(goal)} missions`, current, goal);
    }
  }

  if (taskType === TASK_TYPE.COMPLETE_OPERATIONS) {
    const goal = values.get(VALUE_TYPE.GOAL);
    if (typeof goal === 'number' && goal > 0) {
      return brandGoal(`Complete ${formatGoalCount(goal)} operations`, current, goal);
    }
  }

  return null;
}

export function normalizeAssignmentProgress(raw: unknown[] | undefined): number[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  return raw.map((value) => (typeof value === 'number' ? value : 0));
}

export function extractAssignmentGoals(
  tasks: AssignmentTask[] | undefined,
  progress: number[] | undefined,
): OrderGoal[] {
  if (!tasks?.length) {
    return [];
  }

  const goals: OrderGoal[] = [];
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (!task) {
      continue;
    }

    const goal = decodeAssignmentTaskGoal(task, progress?.[index]);
    if (goal && !goals.some((item) => item.text === goal.text)) {
      goals.push(goal);
    }
  }

  return goals;
}
