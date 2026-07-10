import {
  HD2_API_CLIENT,
  HD2_API_CONTACT,
  HD2_COMMUNITY_API_BASE,
} from '../../shared/types.js';
import type { AhgsAssignment } from './orderMapper.js';

const HD2_API_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US',
  'User-Agent':
    'SuperEarth-Dispatch/0.1 (Reddit Devvit; +https://developers.reddit.com/apps/superearth-dispatch)',
  'X-Super-Client': HD2_API_CLIENT,
  'X-Super-Contact': HD2_API_CONTACT,
};

async function readUpstreamError(response: Response): Promise<string> {
  const snippet = (await response.text()).trim().slice(0, 200);
  return snippet ? `${response.status}: ${snippet}` : String(response.status);
}

async function hd2ApiFetch(url: string): Promise<Response> {
  const response = await fetch(url, { headers: HD2_API_HEADERS });
  if (!response.ok) {
    throw new Error(`HD2 API ${url} failed — ${await readUpstreamError(response)}`);
  }
  return response;
}

function parseWarIdBody(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('HD2 API WarID empty response');
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

  throw new Error(`HD2 API WarID unexpected body: ${trimmed.slice(0, 100)}`);
}

export async function fetchCurrentWarId(): Promise<number> {
  const response = await hd2ApiFetch(`${HD2_COMMUNITY_API_BASE}/WarSeason/current/WarID`);
  return parseWarIdBody(await response.text());
}

export async function fetchWarAssignments(season: number): Promise<AhgsAssignment[]> {
  const response = await hd2ApiFetch(`${HD2_COMMUNITY_API_BASE}/v2/Assignment/War/${season}`);
  const payload = (await response.json()) as AhgsAssignment[];
  if (!Array.isArray(payload)) {
    throw new Error('HD2 API Assignment/War response is not an array');
  }

  return payload;
}
