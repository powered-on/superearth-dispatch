export type OrderSource = 'arrowhead' | 'diveharder';

export type SectionStatus = 'ok' | 'unavailable' | 'stale' | 'config_error';

export type NormalizedOrder = {
  title: string;
  objective: string;
  expiresAt?: string;
};

export type SectionCache = {
  status: SectionStatus;
  fetchedAt: string;
  source: OrderSource;
  data: NormalizedOrder | NormalizedOrder[];
  errorMessage?: string;
};

export type InstallSettings = {
  showMajorOrder: boolean;
  showPersonalObjectives: boolean;
  personalUseThirdPartyApi: boolean;
};

export type CachedOrders = {
  lastUpdated: string;
  settings: InstallSettings;
  major: SectionCache | null;
  personal: SectionCache | null;
};

export type OrdersApiResponse = {
  lastUpdated: string | null;
  settings: InstallSettings;
  major: SectionCache | null;
  personal: SectionCache | null;
  attribution: {
    major: string;
    personal: string;
  };
};

export const WIDGET_SHORT_NAME = 'SuperEarth Dispatch';
export const CACHE_KEY = 'orders:v1';
export const WIDGET_ID_KEY = 'widget:id';
export const SHOWCASE_POST_KEY = 'showcase:postId';

export const AHGS_BASE = 'https://api.live.prod.thehelldiversgame.com/api';
export const DIVEHARDER_PERSONAL_URL =
  'https://api.diveharder.com/v1/personal_order';
