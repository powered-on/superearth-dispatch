import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AhgsAssignment } from './orderMapper.js';
import {
  mapAssignment,
  mapAssignmentList,
  pickMajorAssignment,
} from './orderMapper.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadFixture<T>(name: string): T {
  const raw = readFileSync(join(root, 'fixtures', name), 'utf8');
  return JSON.parse(raw) as T;
}

describe('orderMapper', () => {
  it('maps AHGS major assignment setting fields', () => {
    const assignments = loadFixture<AhgsAssignment[]>('ahgs-major-assignments.json');
    const major = pickMajorAssignment(assignments);
    const mapped = mapAssignment(major!);

    expect(mapped?.title).toBe('MAJOR ORDER: HOLD THE LINE');
    expect(mapped?.objective).toContain('Kill the mandated number of Terminids');
    expect(mapped?.expiresAt).toBeTruthy();
  });

  it('maps diveharder personal objectives and ignores progress', () => {
    const personal = loadFixture<AhgsAssignment[]>('diveharder-personal-order.json');
    const mapped = mapAssignmentList(personal);

    expect(mapped).toHaveLength(1);
    expect(mapped[0]?.objective).toBe('Patrol 2 different planets in under 45 minutes.');
  });
});
