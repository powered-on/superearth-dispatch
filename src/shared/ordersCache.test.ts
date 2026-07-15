import { describe, expect, it } from 'vitest';
import {
  OrdersCacheParseError,
  ordersCachePayloadSignature,
  parseHubWikiMarkdown,
  parseOrdersCacheJson,
  serializeHubWikiMarkdown,
  serializeOrdersCacheJson,
  type OrdersCachePayload,
} from './ordersCache.js';

const samplePayload: OrdersCachePayload = {
  schemaVersion: 1,
  lastUpdated: '2026-07-14T12:00:00.000Z',
  major: {
    status: 'ok',
    fetchedAt: '2026-07-14T12:00:00.000Z',
    source: 'arrowhead',
    data: { title: 'Test Major', objective: 'Hold the line' },
  },
  personal: {
    status: 'ok',
    fetchedAt: '2026-07-14T12:00:00.000Z',
    source: 'diveharder',
    data: [{ title: 'Personal 1', objective: 'Kill bugs' }],
  },
};

describe('ordersCache', () => {
  it('round-trips raw JSON', () => {
    const json = serializeOrdersCacheJson(samplePayload);
    expect(parseOrdersCacheJson(json)).toEqual(samplePayload);
  });

  it('parses legacy hub wiki markdown wrapper', () => {
    const markdown = serializeHubWikiMarkdown(samplePayload);
    expect(parseHubWikiMarkdown(markdown)).toEqual(samplePayload);
  });

  it('rejects schemaVersion mismatch', () => {
    const bad = serializeOrdersCacheJson({
      ...samplePayload,
      schemaVersion: 2 as 1,
    });
    expect(() => parseOrdersCacheJson(bad)).toThrow(OrdersCacheParseError);
  });

  it('rejects missing JSON', () => {
    expect(() => parseOrdersCacheJson('')).toThrow(OrdersCacheParseError);
  });

  it('builds stable signature', () => {
    const a = ordersCachePayloadSignature(samplePayload);
    const b = ordersCachePayloadSignature(
      parseOrdersCacheJson(serializeOrdersCacheJson(samplePayload)),
    );
    expect(a).toBe(b);
  });
});
