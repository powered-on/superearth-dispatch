import { Hono } from 'hono';
import type { TriggerResponse } from '@devvit/web/shared';
import { createSidebarPost } from '../core/install.js';
import { readCache } from '../services/cache.js';
import { refreshOrders } from '../services/orderFetcher.js';
import { readInstallSettings } from '../services/settings.js';
import { syncSidebarWidget } from '../services/sidebarWidget.js';

export const schedulerRoutes = new Hono();

async function runRefreshPipeline(): Promise<void> {
  const installSettings = await readInstallSettings();
  await refreshOrders(installSettings);

  const cache = await readCache();
  if (cache) {
    await syncSidebarWidget(cache);
  }
}

schedulerRoutes.post('/refresh-orders', async (c) => {
  try {
    await runRefreshPipeline();
    return c.json({ status: 'success' });
  } catch (error) {
    console.error('refresh-orders cron failed', error);
    return c.json({ status: 'error', message: 'refresh failed' }, 500);
  }
});

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  const warnings: string[] = [];

  try {
    await runRefreshPipeline();
  } catch (error) {
    console.error('on-app-install refresh failed', error);
    warnings.push('initial refresh failed');
  }

  try {
    await createSidebarPost();
  } catch (error) {
    console.error('on-app-install showcase post failed', error);
    warnings.push('showcase post not created');
  }

  const message =
    warnings.length === 0
      ? 'SuperEarth Dispatch installed; initial refresh complete.'
      : `SuperEarth Dispatch installed with warnings: ${warnings.join(', ')}`;

  return c.json<TriggerResponse>({ status: 'success', message }, 200);
});

export const menu = new Hono();

menu.post('/refresh-orders', async (c) => {
  try {
    await runRefreshPipeline();
    return c.json({ showToast: 'Orders refreshed.' });
  } catch (error) {
    console.error('manual refresh failed', error);
    return c.json({ showToast: 'Refresh failed — check app logs.' }, 500);
  }
});
