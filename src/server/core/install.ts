import { context, reddit, redis } from '@devvit/web/server';
import type { InstallSettings, OrdersApiPayload } from '../../shared/types.js';
import { SHOWCASE_POST_KEY } from '../../shared/types.js';
import { readCache } from '../services/cache.js';

function personalAttribution(installSettings: InstallSettings): string {
  if (!installSettings.showPersonalObjectives) {
    return 'Hidden';
  }

  return installSettings.personalUseThirdPartyApi
    ? 'Diveharder (third-party)'
    : 'Arrowhead (official, when available)';
}

export function buildOrdersResponse(
  cache: Awaited<ReturnType<typeof readCache>>,
  installSettings: InstallSettings,
): OrdersApiPayload {
  return {
    lastUpdated: cache?.lastUpdated ?? null,
    settings: installSettings,
    major: installSettings.showMajorOrder ? (cache?.major ?? null) : null,
    personal: installSettings.showPersonalObjectives ? (cache?.personal ?? null) : null,
    attribution: {
      major: installSettings.showMajorOrder ? 'Arrowhead Game Studios' : 'Hidden',
      personal: personalAttribution(installSettings),
    },
  };
}

export async function createSidebarPost(): Promise<string | null> {
  const subredditName = context.subredditName;
  if (!subredditName) {
    return null;
  }

  const existingPostId = await redis.get(SHOWCASE_POST_KEY);
  if (existingPostId) {
    try {
      await reddit.getPostById(existingPostId as `t3_${string}`);
      return existingPostId;
    } catch {
      console.warn('[install] stored showcase post missing; creating a new one');
    }
  }

  const post = await reddit.submitCustomPost({
    subredditName,
    title: 'SuperEarth Dispatch — Live Orders',
    entry: 'default',
  });

  await redis.set(SHOWCASE_POST_KEY, post.id);
  return post.id;
}
