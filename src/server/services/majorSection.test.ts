import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAJOR_ORDER_STANDBY_MESSAGE } from '../../shared/types.js';
import type { AhgsAssignment } from './orderMapper.js';
import { majorSectionFromAssignments } from './majorSection.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadFixture<T>(name: string): T {
  const raw = readFileSync(join(root, 'fixtures', name), 'utf8');
  return JSON.parse(raw) as T;
}

describe('majorSectionFromAssignments', () => {
  it('returns standby when AHGS assignment list is empty', () => {
    const assignments = loadFixture<AhgsAssignment[]>('ahgs-major-standby.json');
    const section = majorSectionFromAssignments(assignments);

    expect(section?.status).toBe('standby');
    expect(section?.source).toBe('arrowhead');
  });

  it('returns ok for an active major order fixture', () => {
    const assignments = loadFixture<AhgsAssignment[]>('ahgs-major-assignments.json');
    const section = majorSectionFromAssignments(assignments);

    expect(section?.status).toBe('ok');
    if (section && !Array.isArray(section.data)) {
      expect(section.data.title).toContain('MAJOR ORDER');
    }
  });

  it('uses the shared standby copy for empty assignment lists', () => {
    const section = majorSectionFromAssignments([]);

    expect(section?.status).toBe('standby');
    expect(MAJOR_ORDER_STANDBY_MESSAGE).toContain('stand by');
  });
});
