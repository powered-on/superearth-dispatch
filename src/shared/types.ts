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
export const WIDGET_KIND_TEXTAREA = 'textarea';
export const WIDGET_LAST_SYNC_KEY = 'widget:lastSyncAt';
export const SHOWCASE_POST_KEY = 'showcase:postId';

/** Community API raw passthrough (https://github.com/helldivers-2/api). */
export const HD2_COMMUNITY_API_BASE = 'https://api.helldivers2.dev/raw/api';
export const HD2_API_CLIENT = 'superearth-dispatch';
export const HD2_API_CONTACT = 'github.com/powered-on/superearth-dispatch';
export const DIVEHARDER_PERSONAL_URL =
  'https://api.diveharder.com/v1/personal_order';

/** Shown when upstream returns no active Major Order (empty assignment list). */
export const MAJOR_ORDER_STANDBY_MESSAGE =
  'Please stand by for new orders from Super Earth High Command.';
