import { AHGS_BASE } from '../../shared/types.js';
import type { AhgsAssignment } from './orderMapper.js';

const AHGS_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US',
  'User-Agent':
    'SuperEarth-Dispatch/0.1 (Reddit Devvit; +https://developers.reddit.com/apps/superearth-dispatch)',
};

async function readAhgsError(response: Response): Promise<string> {
  const snippet = (await response.text()).trim().slice(0, 200);
  return snippet ? `${response.status}: ${snippet}` : String(response.status);
}

async function ahgsFetch(url: string): Promise<Response> {
  const response = await fetch(url, { headers: AHGS_HEADERS });
  if (!response.ok) {
    throw new Error(`AHGS ${url} failed — ${await readAhgsError(response)}`);
  }
  return response;
}

function parseWarIdBody(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('AHGS WarID empty response');
  }

  try {
    const payload = JSON.parse(trimmed) as { id?: number } | number;
    if (typeof payload === 'number') {
      return payload;
    }
    if (typeof payload.id === 'number') {
      return payload.id;
    }
  } catch {
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) {
      return asNumber;
    }
  }

  throw new Error(`AHGS WarID unexpected body: ${trimmed.slice(0, 100)}`);
}

export async function fetchCurrentWarId(): Promise<number> {
  const response = await ahgsFetch(`${AHGS_BASE}/WarSeason/current/WarID`);
  return parseWarIdBody(await response.text());
}

export async function fetchWarAssignments(season: number): Promise<AhgsAssignment[]> {
  const response = await ahgsFetch(`${AHGS_BASE}/v2/Assignment/War/${season}`);
  const payload = (await response.json()) as AhgsAssignment[];
  if (!Array.isArray(payload)) {
    throw new Error('AHGS Assignment/War response is not an array');
  }

  return payload;
}
