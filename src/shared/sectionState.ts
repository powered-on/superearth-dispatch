import type { NormalizedOrder, SectionCache } from './types.js';
import { MAJOR_ORDER_STANDBY_MESSAGE } from './types.js';

export function isUsableOrderData(
  data: NormalizedOrder | NormalizedOrder[],
): boolean {
  if (Array.isArray(data)) {
    return data.length > 0;
  }

  return Boolean(data.title.trim() && data.title !== 'Unavailable');
}

export function isUsablePrevious(section: SectionCache | null): boolean {
  if (!section) {
    return false;
  }

  if (section.status !== 'ok' && section.status !== 'stale') {
    return false;
  }

  return isUsableOrderData(section.data);
}

export function sectionErrorMessage(section: SectionCache): string | null {
  if (section.status === 'standby') {
    return MAJOR_ORDER_STANDBY_MESSAGE;
  }

  if (section.errorMessage) {
    return section.errorMessage;
  }

  if (section.status === 'unavailable') {
    return 'Unavailable';
  }

  if (section.status === 'config_error') {
    return 'Official Arrowhead route not configured.';
  }

  return null;
}
