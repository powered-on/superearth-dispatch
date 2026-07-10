import type {
  InstallSettings,
  SectionCache,
  SectionStatus,
} from '../../shared/types.js';
import { fetchCurrentWarId, fetchWarAssignments } from './ahgsClient.js';
import { mapAssignment, pickMajorAssignment } from './orderMapper.js';
import { isUsablePrevious } from '../../shared/sectionState.js';
import { mergeCache, readCache } from './cache.js';

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

function sectionFromSuccess<T>(
  source: SectionCache['source'],
  data: T,
): SectionCache {
  return {
    status: 'ok',
    fetchedAt: new Date().toISOString(),
    source,
    data: data as SectionCache['data'],
  };
}

function sectionFromFailure(
  source: SectionCache['source'],
  previous: SectionCache | null,
  status: SectionStatus,
  emptyData: SectionCache['data'],
  message: string,
): SectionCache {
  if (isUsablePrevious(previous) && previous) {
    return {
      status: 'stale',
      fetchedAt: previous.fetchedAt,
      source: previous.source,
      data: previous.data,
      errorMessage: message,
    };
  }

  return {
    status,
    fetchedAt: new Date().toISOString(),
    source,
    data: emptyData,
    errorMessage: message,
  };
}

export async function fetchMajorFromAhgs(previous: SectionCache | null): Promise<SectionCache> {
  try {
    console.info('[orders] upstream AHGS WarID');
    const warId = await fetchCurrentWarId();
    console.info(`[orders] upstream AHGS Assignment/War/${warId}`);
    const assignments = await fetchWarAssignments(warId);
    const majorAssignment = pickMajorAssignment(assignments);
    const mapped = majorAssignment ? mapAssignment(majorAssignment) : null;

    if (!mapped) {
      throw new Error('No major assignment in AHGS payload');
    }

    console.info(`[orders] major mapped: ${mapped.title}`);
    return sectionFromSuccess('arrowhead', mapped);
  } catch (error) {
    const message = errorMessage(error);
    console.error('[orders] major fetch failed', message);
    return sectionFromFailure('arrowhead', previous, 'unavailable', {
      title: '',
      objective: '',
    }, message);
  }
}

export async function fetchPersonalFromDiveharder(
  previous: SectionCache | null,
): Promise<SectionCache> {
  const message =
    'Third-party daily objectives require api.diveharder.com Devvit domain approval (not enabled in this app version).';
  console.warn('[orders] diveharder domain not declared in devvit.json');
  return sectionFromFailure('diveharder', previous, 'config_error', [], message);
}

export async function fetchPersonalFromAhgsOfficial(
  previous: SectionCache | null,
): Promise<SectionCache> {
  const message =
    'Official Arrowhead personal route not configured. Enable third-party API in install settings.';
  console.warn('[orders] official AHGS personal route not configured (SYN-A-014)');
  return sectionFromFailure('arrowhead', previous, 'config_error', [], message);
}

export async function refreshOrders(settings: InstallSettings): Promise<void> {
  const existing = await readCache();
  const patch: {
    lastUpdated: string;
    settings: InstallSettings;
    major?: SectionCache | null;
    personal?: SectionCache | null;
  } = {
    lastUpdated: new Date().toISOString(),
    settings,
  };

  if (settings.showMajorOrder) {
    patch.major = await fetchMajorFromAhgs(existing?.major ?? null);
  } else {
    console.info('[orders] major section disabled — no AHGS calls');
    patch.major = null;
  }

  if (settings.showPersonalObjectives) {
    if (settings.personalUseThirdPartyApi) {
      patch.personal = await fetchPersonalFromDiveharder(existing?.personal ?? null);
    } else {
      patch.personal = await fetchPersonalFromAhgsOfficial(existing?.personal ?? null);
    }
  } else {
    console.info('[orders] personal section disabled — no personal upstream calls');
    patch.personal = null;
  }

  await mergeCache(patch);
}
