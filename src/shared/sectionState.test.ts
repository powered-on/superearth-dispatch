import { describe, expect, it } from 'vitest';
import { isUsableOrderData, isUsablePrevious } from './sectionState.js';
import type { SectionCache } from './types.js';

describe('sectionState', () => {
  it('rejects placeholder major order data', () => {
    expect(
      isUsableOrderData({
        title: 'Unavailable',
        objective: 'Major order data is currently unavailable.',
      }),
    ).toBe(false);
  });

  it('accepts real major order data', () => {
    expect(
      isUsableOrderData({
        title: 'MAJOR ORDER',
        objective: 'Liberate regions',
      }),
    ).toBe(true);
  });

  it('does not treat unavailable cache as reusable previous', () => {
    const previous: SectionCache = {
      status: 'unavailable',
      fetchedAt: '2026-07-10T00:10:12.000Z',
      source: 'arrowhead',
      data: {
        title: 'Unavailable',
        objective: 'Major order data is currently unavailable.',
      },
    };

    expect(isUsablePrevious(previous)).toBe(false);
  });
});
