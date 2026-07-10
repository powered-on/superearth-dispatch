import { Hono } from 'hono';
import type { OrdersApiResponse } from '../../shared/types.js';
import { buildOrdersResponse } from '../core/install.js';
import { readCache } from '../services/cache.js';
import { isCurrentUserModerator } from '../services/moderator.js';
import { runRefreshPipeline } from '../services/refreshPipeline.js';
import { readInstallSettings } from '../services/settings.js';
import { readdSidebarWidget } from '../services/sidebarWidget.js';

type ErrorResponse = {
  status: 'error';
  message: string;
};

async function buildOrdersPayload(): Promise<OrdersApiResponse> {
  const [cache, installSettings, isModerator] = await Promise.all([
    readCache(),
    readInstallSettings(),
    isCurrentUserModerator(),
  ]);

  return {
    ...buildOrdersResponse(cache, installSettings),
    viewer: { isModerator },
  };
}

export const api = new Hono();

api.get('/orders', async (c) => {
  try {
    return c.json(await buildOrdersPayload());
  } catch (error) {
    console.error('GET /api/orders failed', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Failed to load cached orders',
      },
      500,
    );
  }
});

api.post('/mod/force-refresh', async (c) => {
  if (!(await isCurrentUserModerator())) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Moderator access required' }, 403);
  }

  try {
    await runRefreshPipeline();
    return c.json(await buildOrdersPayload());
  } catch (error) {
    console.error('POST /api/mod/force-refresh failed', error);
    const message = error instanceof Error ? error.message : 'Force refresh failed';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

api.post('/mod/readd-sidebar-widget', async (c) => {
  if (!(await isCurrentUserModerator())) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Moderator access required' }, 403);
  }

  try {
    const cache = await readCache();
    if (!cache) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'No cached orders yet — run refresh first' },
        400,
      );
    }

    const result = await readdSidebarWidget(cache);
    return c.json({
      status: 'ok',
      message: result.message,
      widgetKind: result.kind,
      orders: await buildOrdersPayload(),
    });
  } catch (error) {
    console.error('POST /api/mod/readd-sidebar-widget failed', error);
    const message = error instanceof Error ? error.message : 'Re-add sidebar widget failed';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});
