import { describe, expect, it } from 'vitest';
import { isUsableOrderData, isUsablePrevious, sectionErrorMessage } from './sectionState.js';
import { MAJOR_ORDER_STANDBY_MESSAGE } from './types.js';
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

  it('returns standby copy for major order downtime', () => {
    const section: SectionCache = {
      status: 'standby',
      fetchedAt: '2026-07-10T12:00:00.000Z',
      source: 'arrowhead',
      data: { title: '', objective: '' },
    };

    expect(isUsableOrderData(section.data)).toBe(false);
    expect(isUsablePrevious(section)).toBe(false);
    expect(sectionErrorMessage(section)).toBe(MAJOR_ORDER_STANDBY_MESSAGE);
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
