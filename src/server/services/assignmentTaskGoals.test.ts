import { describe, expect, it } from 'vitest';
import { decodeAssignmentTaskGoal, extractAssignmentGoals } from './assignmentTaskGoals.js';

describe('assignmentTaskGoals', () => {
  it('decodes eradicate and control tasks from major order fixture shape', () => {
    const goals = extractAssignmentGoals(
      [
        {
          type: 3,
          values: [2, 0, 600000000, 0, 0, 0, 0, 0, 0, 0],
          valueTypes: [1, 2, 3, 4, 6, 5, 8, 9, 11, 12],
        },
        {
          type: 13,
          values: [1, 1, 76],
          valueTypes: [3, 11, 12],
        },
        {
          type: 13,
          values: [1, 1, 168],
          valueTypes: [3, 11, 12],
        },
      ],
      [424422551, 1, 1],
    );

    expect(goals).toEqual([
      {
        text: 'Kill 600,000,000 Terminids',
        tone: 'terminid',
        progress: { kind: 'bar', current: 424422551, goal: 600000000 },
      },
      {
        text: 'Hold TERREK',
        tone: 'brand',
        progress: { kind: 'box', complete: true },
      },
      {
        text: 'Hold ERATA PRIME',
        tone: 'brand',
        progress: { kind: 'box', complete: true },
      },
    ]);
  });

  it('assigns faction tones to eradicate tasks', () => {
    expect(
      decodeAssignmentTaskGoal(
        {
          type: 3,
          values: [1, 0, 250000000],
          valueTypes: [1, 2, 3],
        },
        125000000,
      ),
    ).toEqual({
      text: 'Kill 250,000,000 Automatons',
      tone: 'automaton',
      progress: { kind: 'bar', current: 125000000, goal: 250000000 },
    });

    expect(
      decodeAssignmentTaskGoal(
        {
          type: 3,
          values: [3, 0, 180000000],
          valueTypes: [1, 2, 3],
        },
        90000000,
      ),
    ).toEqual({
      text: 'Kill 180,000,000 Illuminate',
      tone: 'illuminate',
      progress: { kind: 'bar', current: 90000000, goal: 180000000 },
    });
  });

  it('defaults unknown eradicate factions to brand tone', () => {
    expect(
      decodeAssignmentTaskGoal(
        {
          type: 3,
          values: [9, 0, 1000000],
          valueTypes: [1, 2, 3],
        },
        250000,
      ),
    ).toEqual({
      text: 'Kill 1,000,000 Faction 9',
      tone: 'brand',
      progress: { kind: 'bar', current: 250000, goal: 1000000 },
    });
  });

  it('decodes liberation tasks with brand box progress', () => {
    const goal = decodeAssignmentTaskGoal(
      {
        type: 11,
        values: [0, 0, 57],
        valueTypes: [1, 2, 12],
      },
      0,
    );

    expect(goal?.text).toMatch(/^Liberate /);
    expect(goal?.tone).toBe('brand');
    expect(goal?.progress).toEqual({ kind: 'box', complete: false });
  });
});
