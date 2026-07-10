import type {
  InstallSettings,
  SectionCache,
  SectionStatus,
} from '../../shared/types.js';
import { fetchCurrentWarId, fetchWarAssignments } from './ahgsClient.js';
import { fetchPersonalOrders } from './diveharderClient.js';
import { majorSectionFromAssignments } from './majorSection.js';
import { mapAssignmentList } from './orderMapper.js';
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
    const section = majorSectionFromAssignments(assignments);

    if (!section) {
      throw new Error('Failed to build major section from AHGS payload');
    }

    if (section.status === 'standby') {
      console.info('[orders] major order standby — no active assignment');
      return section;
    }

    if (!Array.isArray(section.data)) {
      console.info(`[orders] major mapped: ${section.data.title}`);
    }

    return section;
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
  try {
    console.info('[orders] upstream diveharder /v1/personal_order');
    const assignments = await fetchPersonalOrders();
    const mapped = mapAssignmentList(assignments);

    if (mapped.length === 0) {
      throw new Error('No personal objectives in diveharder payload');
    }

    return sectionFromSuccess('diveharder', mapped);
  } catch (error) {
    const message = errorMessage(error);
    console.error('[orders] personal third-party fetch failed', message);
    return sectionFromFailure(
      'diveharder',
      previous,
      'unavailable',
      [],
      'Daily objectives unavailable — third-party API unreachable.',
    );
  }
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
