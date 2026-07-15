import type { InstallSettings, SectionCache, SectionStatus } from '../../shared/types.js';
import { isUsablePrevious } from '../../shared/sectionState.js';
import { mergeCache, readCache } from './cache.js';
import { readOrdersCachePayload } from './ordersCacheReader.js';

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
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

function sectionForInstall(
  enabled: boolean,
  remoteSection: SectionCache | null,
  previous: SectionCache | null,
  source: SectionCache['source'],
  emptyData: SectionCache['data'],
  unavailableMessage: string,
): SectionCache | null {
  if (!enabled) {
    return null;
  }

  if (remoteSection && remoteSection.status !== 'unavailable') {
    return remoteSection;
  }

  if (remoteSection?.status === 'unavailable') {
    return sectionFromFailure(
      remoteSection.source ?? source,
      previous,
      'unavailable',
      emptyData,
      remoteSection.errorMessage ?? unavailableMessage,
    );
  }

  return sectionFromFailure(source, previous, 'unavailable', emptyData, unavailableMessage);
}

function isRemoteNewer(remoteLastUpdated: string, localLastUpdated: string | undefined): boolean {
  if (!localLastUpdated) {
    return true;
  }
  return remoteLastUpdated > localLastUpdated;
}

export async function refreshOrders(settings: InstallSettings): Promise<void> {
  const existing = await readCache();

  try {
    const remote = await readOrdersCachePayload();

    if (existing && !isRemoteNewer(remote.lastUpdated, existing.lastUpdated)) {
      console.info('[orders] orders cache unchanged — skip merge');
      return;
    }

    const patch: {
      lastUpdated: string;
      settings: InstallSettings;
      major?: SectionCache | null;
      personal?: SectionCache | null;
    } = {
      lastUpdated: remote.lastUpdated,
      settings,
    };

    if (settings.showMajorOrder) {
      patch.major = sectionForInstall(
        true,
        remote.major,
        existing?.major ?? null,
        'arrowhead',
        { title: '', objective: '' },
        'Major Order unavailable — orders cache missing or invalid.',
      );
    } else {
      console.info('[orders] major section disabled — skipping remote major section');
      patch.major = null;
    }

    if (settings.showPersonalObjectives) {
      patch.personal = sectionForInstall(
        true,
        remote.personal,
        existing?.personal ?? null,
        'diveharder',
        [],
        'Personal Orders unavailable — orders cache missing or invalid.',
      );
    } else {
      console.info('[orders] personal section disabled — skipping remote personal section');
      patch.personal = null;
    }

    await mergeCache(patch);
  } catch (error) {
    const message = errorMessage(error);
    console.error('[orders] orders cache read failed', message);

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
      patch.major = sectionFromFailure(
        'arrowhead',
        existing?.major ?? null,
        'unavailable',
        { title: '', objective: '' },
        message,
      );
    } else {
      patch.major = null;
    }

    if (settings.showPersonalObjectives) {
      patch.personal = sectionFromFailure(
        'diveharder',
        existing?.personal ?? null,
        'unavailable',
        [],
        message,
      );
    } else {
      patch.personal = null;
    }

    await mergeCache(patch);
  }
}
