import { readFileSync, writeFileSync } from 'node:fs';
import {
  OrdersCacheParseError,
  ordersCachePayloadSignature,
  parseOrdersCacheJson,
  serializeOrdersCacheJson,
} from '../../src/shared/ordersCache.js';
import { buildOrdersCachePayload, payloadChanged } from './fetchOrders.js';

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  const outputPath = readArg('--output');
  const existingPath = readArg('--existing-file');
  const dryRun = hasFlag('--dry-run');

  const payload = await buildOrdersCachePayload();
  const json = serializeOrdersCacheJson(payload);

  let previousSignature: string | null = null;
  if (existingPath) {
    try {
      const existingContent = readFileSync(existingPath, 'utf8');
      previousSignature = ordersCachePayloadSignature(parseOrdersCacheJson(existingContent));
    } catch (error) {
      const message = error instanceof OrdersCacheParseError ? error.message : String(error);
      console.warn('[orders-sync] existing cache not parseable; will publish', message);
    }
  }

  if (!payloadChanged(payload, previousSignature)) {
    console.info('[orders-sync] unchanged — skip upload');
    return;
  }

  if (dryRun) {
    console.info('[orders-sync] dry-run — would publish updated orders cache');
    return;
  }

  if (!outputPath) {
    throw new Error('Missing required --output path');
  }

  writeFileSync(outputPath, json, 'utf8');
  console.info(`[orders-sync] wrote ${outputPath}`);
}

main().catch((error) => {
  console.error('[orders-sync] failed', error);
  process.exitCode = 1;
});
