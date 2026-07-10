import type { NormalizedOrder } from '../../shared/types.js';
import type { OrderGoal } from '../../shared/orderGoals.js';
import { extractAssignmentGoals, normalizeAssignmentProgress, type AssignmentTask } from './assignmentTaskGoals.js';

export type AhgsAssignment = {
  expiresIn?: number;
  setting?: {
    overrideTitle?: string;
    overrideBrief?: string;
    taskDescription?: string;
    type?: number;
    tasks?: AssignmentTask[];
  };
  progress?: unknown[];
};

function buildGoals(
  setting: NonNullable<AhgsAssignment['setting']>,
  progress: unknown[] | undefined,
): OrderGoal[] {
  const brief = setting.overrideBrief?.trim() ?? '';
  const taskDescription = setting.taskDescription?.trim() ?? '';
  const taskGoals = extractAssignmentGoals(
    setting.tasks,
    normalizeAssignmentProgress(progress),
  );

  const goals: OrderGoal[] = [];
  if (taskDescription && brief && !taskGoals.some((goal) => goal.text === taskDescription)) {
    goals.push({ text: taskDescription, tone: 'brand' });
  }

  for (const goal of taskGoals) {
    if (!goals.some((item) => item.text === goal.text)) {
      goals.push(goal);
    }
  }

  return goals;
}

export function mapAssignment(assignment: AhgsAssignment): NormalizedOrder | null {
  const setting = assignment.setting;
  if (!setting) {
    return null;
  }

  const title = (setting.overrideTitle ?? '').trim();
  const brief = setting.overrideBrief?.trim() ?? '';
  const taskDescription = setting.taskDescription?.trim() ?? '';
  const goals = buildGoals(setting, assignment.progress);

  const objective = brief || taskDescription || title;
  if (!title && !objective) {
    return null;
  }

  const order: NormalizedOrder = {
    title: title || 'Major Order',
    objective: objective || title,
  };

  if (goals.length > 0) {
    order.goals = goals;
  }

  if (typeof assignment.expiresIn === 'number' && assignment.expiresIn > 0) {
    order.expiresAt = new Date(Date.now() + assignment.expiresIn * 1000).toISOString();
  }

  return order;
}

export function mapAssignmentList(assignments: AhgsAssignment[]): NormalizedOrder[] {
  return assignments
    .map(mapAssignment)
    .filter((order): order is NormalizedOrder => order !== null);
}

export function pickMajorAssignment(assignments: AhgsAssignment[]): AhgsAssignment | null {
  if (assignments.length === 0) {
    return null;
  }

  const typedMajor = assignments.find((item) => item.setting?.type === 4);
  return typedMajor ?? assignments[0] ?? null;
}
