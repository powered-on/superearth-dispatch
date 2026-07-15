import {
  OrdersCacheParseError,
  parseOrdersCacheJson,
  type OrdersCachePayload,
} from '../../shared/ordersCache.js';
import { ORDERS_CACHE_URL } from '../../shared/ordersDataConfig.js';

export async function readOrdersCachePayload(): Promise<OrdersCachePayload> {
  console.info(`[orders] orders cache read ${ORDERS_CACHE_URL}`);
  const response = await fetch(ORDERS_CACHE_URL);

  if (!response.ok) {
    throw new Error(`Orders cache fetch failed: ${response.status}`);
  }

  const body = await response.text();

  try {
    return parseOrdersCacheJson(body);
  } catch (error) {
    const message = error instanceof OrdersCacheParseError ? error.message : 'Orders cache parse failed';
    throw new Error(message);
  }
}
