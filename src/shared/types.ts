export type OrderSource = 'arrowhead' | 'diveharder';

export type SectionStatus = 'ok' | 'standby' | 'unavailable' | 'stale' | 'config_error';

export type { OrderGoal, OrderGoalTone } from './orderGoals.js';
import type { OrderGoal } from './orderGoals.js';

export type NormalizedOrder = {
  title: string;
  objective: string;
  goals?: OrderGoal[];
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
  showForceRefreshButton: boolean;
  showReaddSidebarWidgetButton: boolean;
};

export type CachedOrders = {
  lastUpdated: string;
  settings: InstallSettings;
  major: SectionCache | null;
  personal: SectionCache | null;
};

export type OrdersApiPayload = Omit<OrdersApiResponse, 'viewer'>;

export type OrdersApiResponse = {
  lastUpdated: string | null;
  settings: InstallSettings;
  major: SectionCache | null;
  personal: SectionCache | null;
  attribution: {
    major: string;
    personal: string;
  };
  viewer: {
    isModerator: boolean;
  };
};

export const WIDGET_SHORT_NAME = 'SuperEarth Dispatch';
export const CACHE_KEY = 'orders:v1';
export const WIDGET_ID_KEY = 'widget:id';
export const WIDGET_KIND_KEY = 'widget:kind';
export const WIDGET_KIND_CUSTOM = 'custom';
export const SHOWCASE_POST_KEY = 'showcase:postId';

export const AHGS_BASE = 'https://api.live.prod.thehelldiversgame.com/api';
export const DIVEHARDER_PERSONAL_URL =
  'https://api.diveharder.com/v1/personal_order';

/** Shown when AHGS returns no active Major Order (empty assignment list). */
export const MAJOR_ORDER_STANDBY_MESSAGE =
  'Please stand by for new orders from Super Earth High Command.';
