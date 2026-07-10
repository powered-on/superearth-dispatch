import { context, reddit, redis } from '@devvit/web/server';
import type { OrderGoal } from '../../shared/orderGoals.js';
import { goalDisplayLabel, goalProgressPercent } from '../../shared/orderGoals.js';
import type { CachedOrders, NormalizedOrder, SectionCache } from '../../shared/types.js';
import {
  WIDGET_ID_KEY,
  WIDGET_KIND_CUSTOM,
  WIDGET_KIND_KEY,
  WIDGET_SHORT_NAME,
} from '../../shared/types.js';
import { isUsableOrderData, sectionErrorMessage } from '../../shared/sectionState.js';
import { computeWidgetHeight, SIDEBAR_WIDGET_CSS } from './sidebarWidgetCss.js';

const WIDGET_STYLES = {
  backgroundColor: '#0d0f11',
  headerColor: '#ffb900',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatCountdownRemaining(expiresAt?: string): string {
  if (!expiresAt) {
    return '';
  }

  const expiryMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryMs)) {
    return '';
  }

  const remainingSeconds = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
  const days = Math.floor(remainingSeconds / 86_400);
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

function goalToneClass(tone: OrderGoal['tone']): string {
  return tone === 'default' ? 'sed-goal--default' : `sed-goal--${tone}`;
}

function formatGoalHtml(goal: OrderGoal): string {
  const toneClass = goalToneClass(goal.tone);

  if (goal.progress?.kind === 'bar') {
    const percent = goalProgressPercent(goal.progress);
    return `<li class="sed-goal ${toneClass} sed-goal--bar">${escapeHtml(goal.text)} <span class="sed-pct" style="--sed-pct:${percent}%">${percent}%</span></li>`;
  }

  if (goal.progress?.kind === 'box') {
    const mark = goal.progress.complete ? '✓' : '○';
    const doneClass = goal.progress.complete ? ' sed-goal--done' : '';
    return `<li class="sed-goal ${toneClass}${doneClass}">${escapeHtml(goalDisplayLabel(goal))} <span class="sed-check">${mark}</span></li>`;
  }

  return `<li class="sed-goal ${toneClass}">${escapeHtml(goal.text)}</li>`;
}

function formatOrderHtml(order: NormalizedOrder): string {
  const countdown = formatCountdownRemaining(order.expiresAt);
  const countdownHtml = countdown
    ? ` <em class="sed-countdown">${escapeHtml(countdown)}</em>`
    : '';
  const lines = [
    `<p class="sed-order-title"><strong>${escapeHtml(order.title)}</strong>${countdownHtml}</p>`,
    `<p class="sed-order-body">${escapeHtml(order.objective)}</p>`,
  ];

  if (order.goals?.length) {
    lines.push(`<ul class="sed-goals">${order.goals.map(formatGoalHtml).join('')}</ul>`);
  }

  return lines.join('\n\n');
}

function renderSectionBlock(
  heading: string,
  section: SectionCache | null,
): string[] {
  if (!section) {
    return [];
  }

  const staleNote =
    section.status === 'stale'
      ? `<p class="sed-stale"><em>Stale — last fetched ${escapeHtml(new Date(section.fetchedAt).toLocaleString())}</em></p>`
      : '';

  if (section.status === 'standby') {
    const message = sectionErrorMessage(section) ?? 'Stand by for new orders.';
    return [`### ${heading}`, `<p class="sed-standby"><em>${escapeHtml(message)}</em></p>`];
  }

  if (
    (section.status === 'ok' || section.status === 'stale') &&
    isUsableOrderData(section.data)
  ) {
    if (Array.isArray(section.data)) {
      const lines = section.data.map((order) => formatOrderHtml(order));
      return [`### ${heading}`, `${lines.join('\n\n')}${staleNote}`];
    }

    return [`### ${heading}`, `${formatOrderHtml(section.data)}${staleNote}`];
  }

  const message = sectionErrorMessage(section) ?? 'Unavailable';
  return [`### ${heading}`, `<p class="sed-error"><em>${escapeHtml(message)}</em></p>`];
}

export function renderSidebarWidgetText(cache: CachedOrders): string {
  const blocks: string[] = [];

  if (cache.settings.showMajorOrder) {
    blocks.push(...renderSectionBlock('Major Order', cache.major));
  }

  if (cache.settings.showPersonalObjectives) {
    blocks.push(...renderSectionBlock('Personal Orders', cache.personal));
  }

  const footer = cache.lastUpdated
    ? `\n\n---\n<p class="sed-footer"><em>Updated ${escapeHtml(new Date(cache.lastUpdated).toLocaleString())}</em></p>`
    : '';

  const attribution = `<p class="sed-footer"><em>Major: Arrowhead · Personal: ${escapeHtml(cache.settings.personalUseThirdPartyApi ? 'Diveharder' : 'Arrowhead (when available)')}</em></p>`;

  return `${blocks.join('\n\n')}${footer}${attribution}`;
}

/** @deprecated Use {@link renderSidebarWidgetText}. */
export const renderSidebarMarkdown = renderSidebarWidgetText;

type SidebarWidgetRecord = {
  id: string;
  name: string;
  css?: string;
  height?: number;
};

export function isCustomSidebarWidget(widget: SidebarWidgetRecord): boolean {
  return typeof widget.css === 'string' && typeof widget.height === 'number';
}

type CustomWidgetPayload = {
  type: 'custom';
  subreddit: string;
  shortName: string;
  text: string;
  css: string;
  height: number;
  imageData: [];
  styles: typeof WIDGET_STYLES;
};

function buildCustomWidgetPayload(subredditName: string, text: string): CustomWidgetPayload {
  return {
    type: 'custom',
    subreddit: subredditName,
    shortName: WIDGET_SHORT_NAME,
    text,
    css: SIDEBAR_WIDGET_CSS,
    height: computeWidgetHeight(text),
    imageData: [],
    styles: WIDGET_STYLES,
  };
}

async function deleteWidgetQuietly(subredditName: string, widgetId: string): Promise<void> {
  try {
    await reddit.deleteWidget(subredditName, widgetId);
  } catch (error) {
    console.warn('[widget] delete failed (non-fatal)', error);
  }
}

async function syncCustomWidget(subredditName: string, text: string): Promise<void> {
  const basePayload = buildCustomWidgetPayload(subredditName, text);
  const widgets = await reddit.getWidgets(subredditName);
  const matching = widgets.filter(
    (widget) => widget.name.toLowerCase() === WIDGET_SHORT_NAME.toLowerCase(),
  ) as SidebarWidgetRecord[];

  const customWidgets = matching.filter(isCustomSidebarWidget);
  const legacyWidgets = matching.filter((widget) => !isCustomSidebarWidget(widget));

  for (const legacy of legacyWidgets) {
    console.info('[widget] removing legacy textarea widget', legacy.id);
    await deleteWidgetQuietly(subredditName, legacy.id);
  }

  const customTarget = customWidgets[0];
  if (customTarget) {
    for (const duplicate of customWidgets.slice(1)) {
      console.info('[widget] removing duplicate custom widget', duplicate.id);
      await deleteWidgetQuietly(subredditName, duplicate.id);
    }

    try {
      await reddit.updateWidget({
        ...basePayload,
        id: customTarget.id,
      });
      await redis.set(WIDGET_ID_KEY, customTarget.id);
      await redis.set(WIDGET_KIND_KEY, WIDGET_KIND_CUSTOM);
      return;
    } catch (error) {
      console.warn('[widget] custom update failed, will recreate', error);
      await deleteWidgetQuietly(subredditName, customTarget.id);
    }
  }

  const created = await reddit.addWidget(basePayload);
  await redis.set(WIDGET_ID_KEY, created.id);
  await redis.set(WIDGET_KIND_KEY, WIDGET_KIND_CUSTOM);
}

export async function readdSidebarWidget(cache: CachedOrders): Promise<void> {
  const subredditName = context.subredditName;
  if (!subredditName) {
    throw new Error('Subreddit context is required to re-add the sidebar widget');
  }

  const widgets = await reddit.getWidgets(subredditName);
  const matching = widgets.filter(
    (widget) => widget.name.toLowerCase() === WIDGET_SHORT_NAME.toLowerCase(),
  );

  for (const widget of matching) {
    console.info('[widget] re-add: removing existing widget', widget.id);
    await deleteWidgetQuietly(subredditName, widget.id);
  }

  await redis.del(WIDGET_ID_KEY);
  await redis.del(WIDGET_KIND_KEY);

  const text = renderSidebarWidgetText(cache);
  await syncCustomWidget(subredditName, text);
}

export async function syncSidebarWidget(cache: CachedOrders): Promise<void> {
  const subredditName = context.subredditName;
  if (!subredditName) {
    return;
  }

  const text = renderSidebarWidgetText(cache);

  try {
    await syncCustomWidget(subredditName, text);
  } catch (error) {
    console.error('[widget] sidebar sync failed (non-fatal)', error);
  }
}
