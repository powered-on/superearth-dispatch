import type { SectionCache } from '../../shared/types.js';
import type { AhgsAssignment } from './orderMapper.js';
import { mapAssignment, pickMajorAssignment } from './orderMapper.js';

const EMPTY_MAJOR_DATA = { title: '', objective: '' } as const;

export function majorSectionFromAssignments(
  assignments: AhgsAssignment[],
): SectionCache | null {
  if (assignments.length === 0) {
    return {
      status: 'standby',
      fetchedAt: new Date().toISOString(),
      source: 'arrowhead',
      data: { ...EMPTY_MAJOR_DATA },
    };
  }

  const majorAssignment = pickMajorAssignment(assignments);
  const mapped = majorAssignment ? mapAssignment(majorAssignment) : null;

  if (!mapped) {
    return {
      status: 'standby',
      fetchedAt: new Date().toISOString(),
      source: 'arrowhead',
      data: { ...EMPTY_MAJOR_DATA },
    };
  }

  return {
    status: 'ok',
    fetchedAt: new Date().toISOString(),
    source: 'arrowhead',
    data: mapped,
  };
}
