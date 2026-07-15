import type { SectionCache } from './types.js';

export const ORDERS_CACHE_SCHEMA_VERSION = 1 as const;

export type OrdersCachePayload = {
  schemaVersion: typeof ORDERS_CACHE_SCHEMA_VERSION;
  lastUpdated: string;
  major: SectionCache | null;
  personal: SectionCache | null;
};

/** @deprecated Use {@link ORDERS_CACHE_SCHEMA_VERSION} */
export const HUB_WIKI_SCHEMA_VERSION = ORDERS_CACHE_SCHEMA_VERSION;

/** @deprecated Use {@link OrdersCachePayload} */
export type HubWikiPayload = OrdersCachePayload;

export class OrdersCacheParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrdersCacheParseError';
  }
}

/** @deprecated Use {@link OrdersCacheParseError} */
export const HubWikiParseError = OrdersCacheParseError;

function assertSectionCache(value: unknown, field: string): SectionCache | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'object' || value === null) {
    throw new OrdersCacheParseError(`Orders cache field "${field}" is not a valid section`);
  }

  const section = value as SectionCache;
  if (typeof section.status !== 'string' || typeof section.fetchedAt !== 'string') {
    throw new OrdersCacheParseError(`Orders cache field "${field}" is missing section metadata`);
  }

  return section;
}

function parseOrdersCacheRecord(parsed: unknown): OrdersCachePayload {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new OrdersCacheParseError('Orders cache JSON root must be an object');
  }

  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== ORDERS_CACHE_SCHEMA_VERSION) {
    throw new OrdersCacheParseError(
      `Orders cache schemaVersion must be ${ORDERS_CACHE_SCHEMA_VERSION}`,
    );
  }

  if (typeof record.lastUpdated !== 'string' || !record.lastUpdated) {
    throw new OrdersCacheParseError('Orders cache lastUpdated must be a non-empty string');
  }

  return {
    schemaVersion: ORDERS_CACHE_SCHEMA_VERSION,
    lastUpdated: record.lastUpdated,
    major: assertSectionCache(record.major, 'major'),
    personal: assertSectionCache(record.personal, 'personal'),
  };
}

export function parseOrdersCacheJson(content: string): OrdersCachePayload {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new OrdersCacheParseError('Orders cache JSON is empty');
  }

  try {
    return parseOrdersCacheRecord(JSON.parse(trimmed));
  } catch (error) {
    if (error instanceof OrdersCacheParseError) {
      throw error;
    }
    throw new OrdersCacheParseError('Orders cache JSON is invalid');
  }
}

export function serializeOrdersCacheJson(payload: OrdersCachePayload): string {
  return JSON.stringify(payload, null, 2);
}

/** Stable comparison for skip-if-unchanged uploads. */
export function ordersCachePayloadSignature(payload: OrdersCachePayload): string {
  return JSON.stringify({
    lastUpdated: payload.lastUpdated,
    major: payload.major,
    personal: payload.personal,
  });
}

/** @deprecated Use {@link ordersCachePayloadSignature} */
export const hubWikiPayloadSignature = ordersCachePayloadSignature;

/** @deprecated Use {@link serializeOrdersCacheJson} */
export function serializeHubWikiMarkdown(payload: OrdersCachePayload): string {
  const marker = '<!-- superearth-dispatch:orders-cache v1 -->';
  return `${marker}\n\n\`\`\`json\n${serializeOrdersCacheJson(payload)}\n\`\`\`\n`;
}

/** @deprecated Hub wiki transport only — S3 uses {@link parseOrdersCacheJson}. */
export function parseHubWikiMarkdown(content: string): OrdersCachePayload {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenceMatch?.[1]?.trim() ?? (trimmed.startsWith('{') ? trimmed : '');
  if (!raw) {
    throw new OrdersCacheParseError('Hub wiki page has no JSON payload');
  }
  try {
    return parseOrdersCacheRecord(JSON.parse(raw));
  } catch (error) {
    if (error instanceof OrdersCacheParseError) {
      throw error;
    }
    throw new OrdersCacheParseError('Hub wiki JSON is invalid');
  }
}
