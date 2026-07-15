import { context, reddit, redis } from '@devvit/web/server';
import type { OrderGoal } from '../../shared/orderGoals.js';
import {
  GOAL_BOX_COMPLETE_EMOJI,
  GOAL_BOX_PENDING_EMOJI,
  goalDisplayLabel,
  goalProgressPercent,
  goalToneEmoji,
} from '../../shared/orderGoals.js';
import type { CachedOrders, NormalizedOrder, SectionCache } from '../../shared/types.js';
import {
  WIDGET_ID_KEY,
  WIDGET_KIND_KEY,
  WIDGET_KIND_TEXTAREA,
  WIDGET_SHORT_NAME,
} from '../../shared/types.js';
import { isUsableOrderData, sectionErrorMessage } from '../../shared/sectionState.js';
import { recordWidgetSync } from './widgetSyncSchedule.js';

const WIDGET_STYLES = {
  backgroundColor: '#0d0f11',
  headerColor: '#ffb900',
} as const;

export { WIDGET_STYLES };

function normalizeHexColor(color: string | undefined): string {
  return (color ?? '').trim().toLowerCase();
}

export function hasExpectedWidgetStyles(
  styles: { backgroundColor?: string; headerColor?: string } | undefined,
): boolean {
  return (
    normalizeHexColor(styles?.backgroundColor) === WIDGET_STYLES.backgroundColor &&
    normalizeHexColor(styles?.headerColor) === WIDGET_STYLES.headerColor
  );
}

function sectionHeadingMarkdown(heading: string): string {
  return `**${heading}**`;
}

function sectionHeadingWithCountdown(heading: string, expiresAt?: string): string {
  const countdown = formatCountdownRemaining(expiresAt);
  return countdown ? `**${heading}** (${countdown})` : sectionHeadingMarkdown(heading);
}

const MAJOR_ORDER_TITLE_PREFIX = /^major order:\s*/i;

export function displayMajorOrderName(title: string): string {
  const trimmed = title.replace(MAJOR_ORDER_TITLE_PREFIX, '').trim();
  return trimmed || title.trim();
}

const MD_HARD_BREAK = '  ';

function mdHardBreakLine(line: string): string {
  return `${line}${MD_HARD_BREAK}`;
}

function formatMajorOrderNameLine(order: NormalizedOrder): string {
  return `**${displayMajorOrderName(order.title)}**`;
}

function formatMajorOrderBlock(heading: string, order: NormalizedOrder): string {
  const goalLines = (order.goals ?? []).map((goal) => formatGoalMarkdown(goal, 'major'));

  return [
    mdHardBreakLine(sectionHeadingWithCountdown(heading, order.expiresAt)),
    mdHardBreakLine(formatMajorOrderNameLine(order)),
    '',
    order.objective,
    '',
    ...goalLines,
  ].join('\n');
}

function formatPersonalOrderBlock(heading: string, order: NormalizedOrder): string {
  const lines = [
    mdHardBreakLine(sectionHeadingWithCountdown(heading, order.expiresAt)),
    mdHardBreakLine(order.objective),
    ...(order.goals ?? []).map((goal) => formatGoalMarkdown(goal, 'personal')),
  ];

  return lines.join('\n');
}

function renderTextareaFooter(cache: CachedOrders): string {
  if (!cache.lastUpdated) {
    return '';
  }

  const personalSource = cache.personal?.source === 'diveharder'
    ? 'Diveharder (external sync)'
    : 'Orders cache';

  return `\n---\n${mdHardBreakLine(`*Updated ${new Date(cache.lastUpdated).toLocaleString()}*`)}\n*Major: Arrowhead (external sync)*|*Personal: ${personalSource}*`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatWidgetError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function resolveSubredditName(): Promise<string> {
  if (context.subredditName) {
    return context.subredditName;
  }

  const subreddit = await reddit.getCurrentSubreddit();
  return subreddit.name;
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
    const doneClass = goal.progress.complete ? ' sed-goal--done' : '';
    const boxClass = goal.progress.complete ? ' sed-box--complete' : '';
    return `<li class="sed-goal ${toneClass} sed-goal--box${doneClass}"><span class="sed-box${boxClass}" aria-hidden="true"></span><span class="sed-goal-label">${escapeHtml(goalDisplayLabel(goal))}</span></li>`;
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

/** Block-char progress bar for textarea widgets. */
const TEXTAREA_PROGRESS_BAR_WIDTH = 10;

export function formatTextareaProgressBar(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.max(
    0,
    Math.min(TEXTAREA_PROGRESS_BAR_WIDTH, Math.round((clamped / 100) * TEXTAREA_PROGRESS_BAR_WIDTH)),
  );
  return `${'█'.repeat(filled)}${'░'.repeat(TEXTAREA_PROGRESS_BAR_WIDTH - filled)} ${clamped}%`;
}

function formatGoalMarkdown(goal: OrderGoal, layout: 'major' | 'personal'): string {
  const marker = goalToneEmoji(goal.tone);
  const indent = layout === 'major' ? ' ' : '';

  if (goal.progress?.kind === 'bar') {
    const percent = goalProgressPercent(goal.progress);
    const bar = formatTextareaProgressBar(percent);
    return `${mdHardBreakLine(`${indent}${marker} **${goal.text}**`)}\n${mdHardBreakLine(`${indent}${bar}`)}`;
  }

  if (goal.progress?.kind === 'box') {
    const label = goalDisplayLabel(goal);
    const box = goal.progress.complete ? GOAL_BOX_COMPLETE_EMOJI : GOAL_BOX_PENDING_EMOJI;
    return mdHardBreakLine(`${indent}${box} **${label}**`);
  }

  return mdHardBreakLine(`${indent}${marker} **${goal.text}**`);
}

type SidebarSectionKind = 'major' | 'personal';

function renderSectionBlockMarkdown(
  heading: string,
  section: SectionCache | null,
  kind: SidebarSectionKind,
): string {
  if (!section) {
    return '';
  }

  const staleNote =
    section.status === 'stale'
      ? mdHardBreakLine(`**⚠** *Stale — last fetched ${new Date(section.fetchedAt).toLocaleString()}*`)
      : '';

  if (section.status === 'standby') {
    const message = sectionErrorMessage(section) ?? 'Stand by for new orders.';
    return `${sectionHeadingMarkdown(heading)}\n*${message}*`;
  }

  if (
    (section.status === 'ok' || section.status === 'stale') &&
    isUsableOrderData(section.data)
  ) {
    const body = Array.isArray(section.data)
      ? kind === 'major'
        ? section.data.map((order) => formatMajorOrderBlock(heading, order)).join('\n\n')
        : section.data.map((order) => formatPersonalOrderBlock(heading, order)).join('\n\n')
      : kind === 'major'
        ? formatMajorOrderBlock(heading, section.data)
        : formatPersonalOrderBlock(heading, section.data);

    return `${body}${staleNote ? `\n${staleNote}` : ''}`;
  }

  const message = sectionErrorMessage(section) ?? 'Unavailable';
  return `${sectionHeadingMarkdown(heading)}\n${mdHardBreakLine(`**⚠** *${message}*`)}`;
}

export function renderSidebarWidgetMarkdownPlain(cache: CachedOrders): string {
  const blocks: string[] = [];

  if (cache.settings.showMajorOrder) {
    const major = renderSectionBlockMarkdown('Major Order', cache.major, 'major');
    if (major) {
      blocks.push(major);
    }
  }

  if (cache.settings.showPersonalObjectives) {
    const personal = renderSectionBlockMarkdown('Personal Orders', cache.personal, 'personal');
    if (personal) {
      blocks.push(personal);
    }
  }

  return `${blocks.join('\n\n')}${renderTextareaFooter(cache)}`;
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

/** @deprecated Custom widgets are unsupported; HTML renderer kept for tests. */
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

  const personalLabel = cache.personal?.source === 'diveharder'
    ? 'Diveharder (external sync)'
    : 'Orders cache';
  const attribution = `<p class="sed-footer"><em>Major: Arrowhead (external sync) · Personal: ${escapeHtml(personalLabel)}</em></p>`;

  return `${blocks.join('\n\n')}${footer}${attribution}`;
}

/** @deprecated Use {@link renderSidebarWidgetText}. */
export const renderSidebarMarkdown = renderSidebarWidgetText;

type SidebarWidgetRecord = {
  id: string;
  name: string;
  css?: string;
  height?: number;
  styles?: {
    backgroundColor?: string;
    headerColor?: string;
  };
};

export function isCustomSidebarWidget(widget: SidebarWidgetRecord): boolean {
  return typeof widget.css === 'string' && typeof widget.height === 'number';
}

type TextareaWidgetPayload = {
  type: 'textarea';
  subreddit: string;
  shortName: string;
  text: string;
  styles: typeof WIDGET_STYLES;
};

export type SidebarWidgetCreateResult = {
  widgetId: string;
  kind: typeof WIDGET_KIND_TEXTAREA;
  message: string;
};

export type SidebarWidgetSyncPlan = {
  targetId?: string;
  duplicateIds: string[];
};

function buildTextareaWidgetPayload(subredditName: string, text: string): TextareaWidgetPayload {
  return {
    type: 'textarea',
    subreddit: subredditName,
    shortName: WIDGET_SHORT_NAME,
    text,
    styles: WIDGET_STYLES,
  };
}

export function planSidebarWidgetSync(matching: SidebarWidgetRecord[]): SidebarWidgetSyncPlan {
  const textareaWidgets = matching.filter((widget) => !isCustomSidebarWidget(widget));
  const legacyCustomIds = matching.filter(isCustomSidebarWidget).map((widget) => widget.id);

  return {
    targetId: textareaWidgets[0]?.id,
    duplicateIds: [...textareaWidgets.slice(1).map((widget) => widget.id), ...legacyCustomIds],
  };
}

async function deleteWidgetOrThrow(subredditName: string, widgetId: string): Promise<void> {
  try {
    await reddit.deleteWidget(subredditName, widgetId);
  } catch (error) {
    throw new Error(`Failed to delete widget ${widgetId}: ${formatWidgetError(error)}`);
  }
}

async function removeAllNamedWidgets(subredditName: string): Promise<void> {
  const findMatching = async () => {
    const widgets = await reddit.getWidgets(subredditName);
    return widgets.filter(
      (widget) => widget.name.toLowerCase() === WIDGET_SHORT_NAME.toLowerCase(),
    );
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const matching = await findMatching();
    if (matching.length === 0) {
      return;
    }

    for (const widget of matching) {
      console.info('[widget] removing widget', widget.id);
      await deleteWidgetOrThrow(subredditName, widget.id);
    }
  }

  const remaining = await findMatching();
  if (remaining.length > 0) {
    throw new Error(
      `Could not remove existing "${WIDGET_SHORT_NAME}" widget(s): ${remaining.map((widget) => widget.id).join(', ')}`,
    );
  }
}

async function createTextareaSidebarWidget(subredditName: string, cache: CachedOrders): Promise<string> {
  const plainText = renderSidebarWidgetMarkdownPlain(cache);
  const created = await reddit.addWidget(buildTextareaWidgetPayload(subredditName, plainText));
  return created.id;
}

async function removeWidgetsById(subredditName: string, widgetIds: string[], reason: string): Promise<void> {
  for (const widgetId of widgetIds) {
    console.info(`[widget] removing ${reason}`, widgetId);
    await deleteWidgetOrThrow(subredditName, widgetId);
  }
}

async function syncTextareaSidebarWidget(
  subredditName: string,
  cache: CachedOrders,
  plan: SidebarWidgetSyncPlan,
  targetWidget?: SidebarWidgetRecord,
): Promise<void> {
  const plainText = renderSidebarWidgetMarkdownPlain(cache);

  await removeWidgetsById(subredditName, plan.duplicateIds, 'duplicate or legacy custom widget');

  const needsStyleRecreate =
    plan.targetId &&
    targetWidget &&
    !hasExpectedWidgetStyles(targetWidget.styles);

  if (plan.targetId && !needsStyleRecreate) {
    try {
      await reddit.updateWidget({
        ...buildTextareaWidgetPayload(subredditName, plainText),
        id: plan.targetId,
      });
      await redis.set(WIDGET_ID_KEY, plan.targetId);
      await redis.set(WIDGET_KIND_KEY, WIDGET_KIND_TEXTAREA);
      return;
    } catch (error) {
      console.warn('[widget] textarea update failed, will recreate', error);
      await deleteWidgetOrThrow(subredditName, plan.targetId);
    }
  } else if (plan.targetId && needsStyleRecreate) {
    console.info('[widget] recreating textarea widget to apply HD2 chrome styles');
    await deleteWidgetOrThrow(subredditName, plan.targetId);
  }

  const widgetId = await createTextareaSidebarWidget(subredditName, cache);
  await redis.set(WIDGET_ID_KEY, widgetId);
  await redis.set(WIDGET_KIND_KEY, WIDGET_KIND_TEXTAREA);
}

async function syncSidebarWidgetState(subredditName: string, cache: CachedOrders): Promise<void> {
  const widgets = await reddit.getWidgets(subredditName);
  const matching = widgets.filter(
    (widget) => widget.name.toLowerCase() === WIDGET_SHORT_NAME.toLowerCase(),
  ) as SidebarWidgetRecord[];

  const plan = planSidebarWidgetSync(matching);
  await syncTextareaSidebarWidget(
    subredditName,
    cache,
    plan,
    matching.find((widget) => widget.id === plan.targetId),
  );
}

export async function readdSidebarWidget(cache: CachedOrders): Promise<SidebarWidgetCreateResult> {
  const subredditName = await resolveSubredditName();

  await removeAllNamedWidgets(subredditName);
  await redis.del(WIDGET_ID_KEY, WIDGET_KIND_KEY);

  const widgetId = await createTextareaSidebarWidget(subredditName, cache);
  await redis.set(WIDGET_ID_KEY, widgetId);
  await redis.set(WIDGET_KIND_KEY, WIDGET_KIND_TEXTAREA);

  return {
    widgetId,
    kind: WIDGET_KIND_TEXTAREA,
    message: 'SuperEarth Dispatch sidebar widget re-added.',
  };
}

export async function syncSidebarWidget(cache: CachedOrders): Promise<boolean> {
  const subredditName = await resolveSubredditName();

  try {
    await syncSidebarWidgetState(subredditName, cache);
    await recordWidgetSync();
    return true;
  } catch (error) {
    console.error('[widget] sidebar sync failed', error);
    return false;
  }
}
