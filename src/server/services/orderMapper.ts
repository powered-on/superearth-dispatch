import type { NormalizedOrder } from '../../shared/types.js';

export type AhgsAssignment = {
  expiresIn?: number;
  setting?: {
    overrideTitle?: string;
    overrideBrief?: string;
    taskDescription?: string;
    type?: number;
  };
  progress?: unknown[];
};

export function mapAssignment(assignment: AhgsAssignment): NormalizedOrder | null {
  const setting = assignment.setting;
  if (!setting) {
    return null;
  }

  const title = (setting.overrideTitle ?? '').trim();
  const objective = (
    setting.taskDescription?.trim() ||
    setting.overrideBrief?.trim() ||
    ''
  ).trim();

  if (!title && !objective) {
    return null;
  }

  const order: NormalizedOrder = {
    title: title || 'Major Order',
    objective: objective || title,
  };

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
