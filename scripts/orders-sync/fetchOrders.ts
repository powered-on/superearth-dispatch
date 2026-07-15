import {
  ORDERS_CACHE_SCHEMA_VERSION,
  ordersCachePayloadSignature,
  type OrdersCachePayload,
} from '../../src/shared/ordersCache.js';
import type { SectionCache } from '../../src/shared/types.js';
import { fetchCurrentWarId, fetchWarAssignments } from '../../src/server/services/ahgsClient.js';
import { fetchPersonalOrders } from '../../src/server/services/diveharderClient.js';
import { majorSectionFromAssignments } from '../../src/server/services/majorSection.js';
import { mapAssignmentList } from '../../src/server/services/orderMapper.js';

function sectionFromSuccess<T>(source: SectionCache['source'], data: T): SectionCache {
  return {
    status: 'ok',
    fetchedAt: new Date().toISOString(),
    source,
    data: data as SectionCache['data'],
  };
}

function sectionUnavailable(
  source: SectionCache['source'],
  emptyData: SectionCache['data'],
  message: string,
): SectionCache {
  return {
    status: 'unavailable',
    fetchedAt: new Date().toISOString(),
    source,
    data: emptyData,
    errorMessage: message,
  };
}

export async function fetchMajorSection(): Promise<SectionCache> {
  try {
    console.info('[orders-sync] upstream api.helldivers2.dev WarID');
    const warId = await fetchCurrentWarId();
    console.info(`[orders-sync] upstream api.helldivers2.dev Assignment/War/${warId}`);
    const assignments = await fetchWarAssignments(warId);
    const section = majorSectionFromAssignments(assignments);

    if (!section) {
      throw new Error('Failed to build major section from HD2 API payload');
    }

    return section;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[orders-sync] major fetch failed', message);
    return sectionUnavailable('arrowhead', { title: '', objective: '' }, message);
  }
}

export async function fetchPersonalSection(): Promise<SectionCache> {
  try {
    console.info('[orders-sync] upstream diveharder /v1/personal_order');
    const assignments = await fetchPersonalOrders();
    const mapped = mapAssignmentList(assignments);

    if (mapped.length === 0) {
      throw new Error('No personal objectives in diveharder payload');
    }

    return sectionFromSuccess('diveharder', mapped);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[orders-sync] personal fetch failed (non-fatal)', message);
    return sectionUnavailable(
      'diveharder',
      [],
      'Personal Orders unavailable — third-party API unreachable.',
    );
  }
}

export async function buildOrdersCachePayload(): Promise<OrdersCachePayload> {
  const [major, personal] = await Promise.all([fetchMajorSection(), fetchPersonalSection()]);

  return {
    schemaVersion: ORDERS_CACHE_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    major,
    personal,
  };
}

export function payloadChanged(
  current: OrdersCachePayload,
  previousSignature: string | null,
): boolean {
  if (!previousSignature) {
    return true;
  }

  return ordersCachePayloadSignature(current) !== previousSignature;
}

/** @deprecated Use {@link buildOrdersCachePayload} */
export const buildHubWikiPayload = buildOrdersCachePayload;
