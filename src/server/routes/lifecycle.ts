import { Hono } from 'hono';
import type { TriggerResponse } from '@devvit/web/shared';
import { createSidebarPost } from '../core/install.js';
import { readCache } from '../services/cache.js';
import { runRefreshPipeline } from '../services/refreshPipeline.js';
import { readdSidebarWidget } from '../services/sidebarWidget.js';
import { runWidgetSyncIfDue } from '../services/widgetSyncSchedule.js';

export const schedulerRoutes = new Hono();

schedulerRoutes.post('/refresh-orders', async (c) => {
  try {
    await runRefreshPipeline();
    return c.json({ status: 'success' });
  } catch (error) {
    console.error('refresh-orders cron failed', error);
    return c.json({ status: 'error', message: 'refresh failed' }, 500);
  }
});

schedulerRoutes.post('/sync-widget', async (c) => {
  try {
    const result = await runWidgetSyncIfDue();
    return c.json({ status: 'success', ...result });
  } catch (error) {
    console.error('sync-widget cron failed', error);
    return c.json({ status: 'error', message: 'widget sync failed' }, 500);
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

menu.post('/force-refresh-orders', async (c) => {
  try {
    await runRefreshPipeline();
    return c.json({ showToast: 'Force refresh complete.' });
  } catch (error) {
    console.error('force refresh failed', error);
    return c.json({ showToast: 'Force refresh failed — check app logs.' }, 500);
  }
});

menu.post('/readd-sidebar-widget', async (c) => {
  try {
    const cache = await readCache();
    if (!cache) {
      return c.json({ showToast: 'No cached orders yet — run refresh first.' }, 400);
    }

    const result = await readdSidebarWidget(cache);
    return c.json({ showToast: result.message });
  } catch (error) {
    console.error('re-add sidebar widget failed', error);
    const message = error instanceof Error ? error.message : 'Re-add sidebar widget failed';
    return c.json({ showToast: message }, 500);
  }
});
