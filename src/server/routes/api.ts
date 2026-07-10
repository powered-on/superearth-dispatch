import { Hono } from 'hono';
import type { OrdersApiResponse } from '../../shared/types.js';
import { buildOrdersResponse } from '../core/install.js';
import { readCache } from '../services/cache.js';
import { readInstallSettings } from '../services/settings.js';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

api.get('/orders', async (c) => {
  try {
    const [cache, installSettings] = await Promise.all([
      readCache(),
      readInstallSettings(),
    ]);

    const response: OrdersApiResponse = buildOrdersResponse(cache, installSettings);
    return c.json(response);
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
