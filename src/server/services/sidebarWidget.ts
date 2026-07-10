import { context, reddit, redis } from '@devvit/web/server';
import type { CachedOrders, NormalizedOrder, SectionCache } from '../../shared/types.js';
import { WIDGET_ID_KEY, WIDGET_SHORT_NAME } from '../../shared/types.js';
import { isUsableOrderData, sectionErrorMessage } from '../../shared/sectionState.js';

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
    return ` (${days}d ${hours}h left)`;
  }

  if (hours > 0) {
    return ` (${hours}h ${minutes}m left)`;
  }

  return ` (${minutes}m left)`;
}

function formatOrder(order: NormalizedOrder): string {
  const lines = [`**${order.title}**${formatCountdownRemaining(order.expiresAt)}`, order.objective];
  if (order.goals?.length) {
    lines.push(
      order.goals
        .map((goal) => {
          if (goal.progress?.kind === 'bar') {
            const percent = Math.min(
              100,
              Math.round((goal.progress.current / goal.progress.goal) * 100),
            );
            return `- ${goal.text} (${percent}%)`;
          }

          if (goal.progress?.kind === 'box') {
            return `- ${goal.text} ${goal.progress.complete ? '✓' : '○'}`;
          }

          return `- ${goal.text}`;
        })
        .join('\n'),
    );
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
      ? `\n\n*Stale — last fetched ${new Date(section.fetchedAt).toLocaleString()}*`
      : '';

  if (section.status === 'standby') {
    const message = sectionErrorMessage(section) ?? 'Stand by for new orders.';
    return [`### ${heading}`, `*${message}*`];
  }

  if (
    (section.status === 'ok' || section.status === 'stale') &&
    isUsableOrderData(section.data)
  ) {
    if (Array.isArray(section.data)) {
      const lines = section.data.map((order) => formatOrder(order));
      return [`### ${heading}`, `${lines.join('\n\n')}${staleNote}`];
    }

    return [`### ${heading}`, `${formatOrder(section.data)}${staleNote}`];
  }

  const message = sectionErrorMessage(section) ?? 'Unavailable';
  return [`### ${heading}`, `*${message}*`];
}

export function renderSidebarMarkdown(cache: CachedOrders): string {
  const blocks: string[] = [];

  if (cache.settings.showMajorOrder) {
    blocks.push(...renderSectionBlock('Major Order', cache.major));
  }

  if (cache.settings.showPersonalObjectives) {
    blocks.push(...renderSectionBlock('Personal Orders', cache.personal));
  }

  const footer = cache.lastUpdated
    ? `\n\n---\n*Updated ${new Date(cache.lastUpdated).toLocaleString()}*`
    : '';

  const attribution = `\n*Major: Arrowhead · Daily: ${cache.settings.personalUseThirdPartyApi ? 'Diveharder' : 'Arrowhead (when available)'}*`;

  return `${blocks.join('\n\n')}${footer}${attribution}`;
}

export async function syncSidebarWidget(cache: CachedOrders): Promise<void> {
  const subredditName = context.subredditName;
  if (!subredditName) {
    return;
  }

  const text = renderSidebarMarkdown(cache);
  const styles = {
    backgroundColor: '',
    headerColor: '',
  };

  try {
    const storedWidgetId = await redis.get(WIDGET_ID_KEY);

    if (storedWidgetId) {
      try {
        await reddit.updateWidget({
          type: 'textarea',
          subreddit: subredditName,
          id: storedWidgetId,
          shortName: WIDGET_SHORT_NAME,
          text,
          styles,
        });
        return;
      } catch (error) {
        console.warn('[widget] update by stored id failed, will recreate', error);
      }
    }

    const widgets = await reddit.getWidgets(subredditName);
    const existing = widgets.find(
      (widget) => widget.name.toLowerCase() === WIDGET_SHORT_NAME.toLowerCase(),
    );

    if (existing) {
      await reddit.updateWidget({
        type: 'textarea',
        subreddit: subredditName,
        id: existing.id,
        shortName: WIDGET_SHORT_NAME,
        text,
        styles,
      });
      await redis.set(WIDGET_ID_KEY, existing.id);
      return;
    }

    const created = await reddit.addWidget({
      type: 'textarea',
      subreddit: subredditName,
      shortName: WIDGET_SHORT_NAME,
      text,
      styles,
    });

    await redis.set(WIDGET_ID_KEY, created.id);
  } catch (error) {
    console.error('[widget] sidebar sync failed (non-fatal)', error);
  }
}
