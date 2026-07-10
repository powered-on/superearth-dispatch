import { redis } from '@devvit/web/server';
import type { CachedOrders, NormalizedOrder } from '../../shared/types.js';
import { WIDGET_LAST_SYNC_KEY } from '../../shared/types.js';
import { isUsableOrderData } from '../../shared/sectionState.js';
import { readCache } from './cache.js';
import { syncSidebarWidget } from './sidebarWidget.js';

/** Widget countdown resync when no major order or more than one hour remains. */
export const WIDGET_SYNC_INTERVAL_MS = 45 * 60 * 1000;

/** Widget countdown resync during the major order's final hour. */
export const WIDGET_SYNC_URGENT_INTERVAL_MS = 5 * 60 * 1000;

export const MAJOR_ORDER_URGENT_WINDOW_MS = 60 * 60 * 1000;

export function majorOrderFromCache(cache: CachedOrders): NormalizedOrder | null {
  if (!cache.settings.showMajorOrder || !cache.major) {
    return null;
  }

  if (cache.major.status !== 'ok' && cache.major.status !== 'stale') {
    return null;
  }

  if (!isUsableOrderData(cache.major.data)) {
    return null;
  }

  if (Array.isArray(cache.major.data)) {
    return cache.major.data[0] ?? null;
  }

  return cache.major.data;
}

export function majorOrderRemainingMs(cache: CachedOrders, nowMs: number = Date.now()): number | null {
  const order = majorOrderFromCache(cache);
  if (!order?.expiresAt) {
    return null;
  }

  const expiryMs = new Date(order.expiresAt).getTime();
  if (Number.isNaN(expiryMs)) {
    return null;
  }

  return expiryMs - nowMs;
}

export function isMajorOrderFinalHour(
  cache: CachedOrders,
  nowMs: number = Date.now(),
): boolean {
  const remainingMs = majorOrderRemainingMs(cache, nowMs);
  if (remainingMs === null) {
    return false;
  }

  return remainingMs > 0 && remainingMs <= MAJOR_ORDER_URGENT_WINDOW_MS;
}

export function widgetSyncIntervalMs(
  cache: CachedOrders,
  nowMs: number = Date.now(),
): number {
  return isMajorOrderFinalHour(cache, nowMs)
    ? WIDGET_SYNC_URGENT_INTERVAL_MS
    : WIDGET_SYNC_INTERVAL_MS;
}

export function isWidgetSyncDue(
  cache: CachedOrders,
  lastSyncAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!lastSyncAt) {
    return true;
  }

  const lastSyncMs = new Date(lastSyncAt).getTime();
  if (Number.isNaN(lastSyncMs)) {
    return true;
  }

  const elapsedMs = nowMs - lastSyncMs;
  return elapsedMs >= widgetSyncIntervalMs(cache, nowMs);
}

export async function recordWidgetSync(now: Date = new Date()): Promise<void> {
  await redis.set(WIDGET_LAST_SYNC_KEY, now.toISOString());
}

export async function readWidgetLastSyncAt(): Promise<string | null> {
  const value = await redis.get(WIDGET_LAST_SYNC_KEY);
  return value ?? null;
}

export type WidgetSyncIfDueResult = {
  synced: boolean;
  reason: 'no-cache' | 'not-due' | 'synced' | 'sync-failed';
  intervalMs?: number;
};

export async function runWidgetSyncIfDue(): Promise<WidgetSyncIfDueResult> {
  const cache = await readCache();
  if (!cache) {
    return { synced: false, reason: 'no-cache' };
  }

  const lastSyncAt = await readWidgetLastSyncAt();
  const intervalMs = widgetSyncIntervalMs(cache);

  if (!isWidgetSyncDue(cache, lastSyncAt)) {
    return { synced: false, reason: 'not-due', intervalMs };
  }

  try {
    const synced = await syncSidebarWidget(cache);
    if (!synced) {
      return { synced: false, reason: 'sync-failed', intervalMs };
    }

    return { synced: true, reason: 'synced', intervalMs };
  } catch (error) {
    console.error('[widget] scheduled sync failed', error);
    return { synced: false, reason: 'sync-failed', intervalMs };
  }
}
