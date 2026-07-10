import { redis } from '@devvit/web/server';
import type { CachedOrders } from '../../shared/types.js';
import { CACHE_KEY } from '../../shared/types.js';

export async function readCache(): Promise<CachedOrders | null> {
  const raw = await redis.get(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CachedOrders;
  } catch (error) {
    console.error('Failed to parse orders cache', error);
    return null;
  }
}

export async function writeCache(cache: CachedOrders): Promise<void> {
  await redis.set(CACHE_KEY, JSON.stringify(cache));
}

export async function mergeCache(patch: Partial<CachedOrders>): Promise<CachedOrders> {
  const existing = (await readCache()) ?? {
    lastUpdated: new Date().toISOString(),
    settings: {
      showMajorOrder: true,
      showPersonalObjectives: true,
      personalUseThirdPartyApi: false,
      showForceRefreshButton: true,
      showReaddSidebarWidgetButton: true,
    },
    major: null,
    personal: null,
  };

  const merged: CachedOrders = {
    ...existing,
    ...patch,
    major: patch.major !== undefined ? patch.major : existing.major,
    personal: patch.personal !== undefined ? patch.personal : existing.personal,
    settings: patch.settings ?? existing.settings,
    lastUpdated: patch.lastUpdated ?? new Date().toISOString(),
  };

  await writeCache(merged);
  return merged;
}
