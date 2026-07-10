import { describe, expect, it } from 'vitest';
import type { CachedOrders } from '../../shared/types.js';
import {
  isMajorOrderFinalHour,
  isWidgetSyncDue,
  WIDGET_SYNC_INTERVAL_MS,
  WIDGET_SYNC_URGENT_INTERVAL_MS,
  widgetSyncIntervalMs,
} from './widgetSyncSchedule.js';

const baseSettings: CachedOrders['settings'] = {
  showMajorOrder: true,
  showPersonalObjectives: true,
  personalUseThirdPartyApi: false,
  showForceRefreshButton: true,
  showReaddSidebarWidgetButton: true,
};

function cacheWithMajorExpiresIn(seconds: number, nowMs: number): CachedOrders {
  return {
    lastUpdated: new Date(nowMs).toISOString(),
    settings: baseSettings,
    major: {
      status: 'ok',
      fetchedAt: new Date(nowMs).toISOString(),
      source: 'arrowhead',
      data: {
        title: 'MAJOR ORDER',
        objective: 'Hold the line.',
        expiresAt: new Date(nowMs + seconds * 1000).toISOString(),
      },
    },
    personal: null,
  };
}

describe('widgetSyncIntervalMs', () => {
  const now = Date.parse('2026-07-10T18:00:00.000Z');

  it('uses 45 minutes when there is no active major order', () => {
    const cache: CachedOrders = {
      lastUpdated: new Date(now).toISOString(),
      settings: baseSettings,
      major: {
        status: 'standby',
        fetchedAt: new Date(now).toISOString(),
        source: 'arrowhead',
        data: [],
      },
      personal: null,
    };

    expect(widgetSyncIntervalMs(cache, now)).toBe(WIDGET_SYNC_INTERVAL_MS);
  });

  it('uses 45 minutes when more than one hour remains', () => {
    const cache = cacheWithMajorExpiresIn(90 * 60, now);
    expect(widgetSyncIntervalMs(cache, now)).toBe(WIDGET_SYNC_INTERVAL_MS);
  });

  it('uses 5 minutes during the final hour', () => {
    const cache = cacheWithMajorExpiresIn(30 * 60, now);
    expect(widgetSyncIntervalMs(cache, now)).toBe(WIDGET_SYNC_URGENT_INTERVAL_MS);
  });

  it('uses 45 minutes after the major order has ended', () => {
    const cache = cacheWithMajorExpiresIn(-60, now);
    expect(isMajorOrderFinalHour(cache, now)).toBe(false);
    expect(widgetSyncIntervalMs(cache, now)).toBe(WIDGET_SYNC_INTERVAL_MS);
  });
});

describe('isWidgetSyncDue', () => {
  const now = Date.parse('2026-07-10T18:00:00.000Z');

  it('is due immediately when there is no prior sync', () => {
    const cache = cacheWithMajorExpiresIn(2 * 60 * 60, now);
    expect(isWidgetSyncDue(cache, null, now)).toBe(true);
  });

  it('waits 45 minutes outside the final hour', () => {
    const cache = cacheWithMajorExpiresIn(2 * 60 * 60, now);
    const lastSync = new Date(now - 30 * 60 * 1000).toISOString();

    expect(isWidgetSyncDue(cache, lastSync, now)).toBe(false);

    const dueSync = new Date(now - 46 * 60 * 1000).toISOString();
    expect(isWidgetSyncDue(cache, dueSync, now)).toBe(true);
  });

  it('waits 5 minutes during the final hour', () => {
    const cache = cacheWithMajorExpiresIn(20 * 60, now);
    const recentSync = new Date(now - 3 * 60 * 1000).toISOString();
    const dueSync = new Date(now - 6 * 60 * 1000).toISOString();

    expect(isWidgetSyncDue(cache, recentSync, now)).toBe(false);
    expect(isWidgetSyncDue(cache, dueSync, now)).toBe(true);
  });
});
