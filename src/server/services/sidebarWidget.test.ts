import { describe, expect, it } from 'vitest';
import type { CachedOrders } from '../../shared/types.js';
import { MAJOR_ORDER_STANDBY_MESSAGE } from '../../shared/types.js';
import { computeWidgetHeight } from './sidebarWidgetCss.js';
import {
  buildCustomWidgetUpdatePayload,
  formatTextareaProgressBar,
  isCustomSidebarWidget,
  planSidebarWidgetSync,
  renderSidebarWidgetMarkdownPlain,
  renderSidebarWidgetText,
} from './sidebarWidget.js';
import { WIDGET_KIND_CUSTOM, WIDGET_KIND_TEXTAREA, WIDGET_SHORT_NAME } from '../../shared/types.js';

const baseCache: CachedOrders = {
  lastUpdated: '2026-07-10T16:15:00.000Z',
  settings: {
    showMajorOrder: true,
    showPersonalObjectives: true,
    personalUseThirdPartyApi: true,
    showForceRefreshButton: true,
    showReaddSidebarWidgetButton: true,
  },
  major: {
    status: 'ok',
    fetchedAt: '2026-07-10T16:15:00.000Z',
    source: 'arrowhead',
    data: {
      title: 'MAJOR ORDER: HOLD THE LINE',
      objective: 'Hold the line against Terminids.',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      goals: [
        {
          text: 'Kill 600,000,000 Terminids',
          tone: 'terminid',
          progress: { kind: 'bar', current: 150_000_000, goal: 600_000_000 },
        },
        {
          text: 'Hold TERREK',
          tone: 'brand',
          progress: { kind: 'box', complete: true },
        },
      ],
    },
  },
  personal: null,
};

describe('renderSidebarWidgetText', () => {
  it('renders HTML goals with faction classes and progress', () => {
    const text = renderSidebarWidgetText(baseCache);

    expect(text).toContain('### Major Order');
    expect(text).toContain('sed-goal--terminid');
    expect(text).toContain('sed-goal--bar');
    expect(text).toContain('--sed-pct:25%');
    expect(text).toContain('sed-goal--brand');
    expect(text).toContain('sed-goal--box');
    expect(text).toContain('sed-box--complete');
    expect(text).toContain('sed-countdown');
    expect(text).toContain('Major: Arrowhead · Personal: Diveharder');
  });

  it('renders standby message with styling class', () => {
    const text = renderSidebarWidgetText({
      ...baseCache,
      major: {
        status: 'standby',
        fetchedAt: '2026-07-10T16:15:00.000Z',
        source: 'arrowhead',
        data: [],
      },
    });

    expect(text).toContain('sed-standby');
    expect(text).toContain(MAJOR_ORDER_STANDBY_MESSAGE);
  });
});

describe('renderSidebarWidgetMarkdownPlain', () => {
  it('renders markdown goals with blockquote panels and progress bars', () => {
    const text = renderSidebarWidgetMarkdownPlain(baseCache);

    expect(text).toContain('### Major Order');
    expect(text).toContain('**MAJOR ORDER: HOLD THE LINE**');
    expect(text).toContain('> 🟧 Kill 600,000,000 Terminids');
    expect(text).toMatch(/█+░+ 25%/);
    expect(text).toContain('> 🟩 TERREK');
    expect(text).not.toContain('> 🟨 TERREK');
    expect(text).not.toContain('<li class="sed-goal');
    expect(text).not.toContain('☑');
  });

  it('renders unavailable sections as blockquote callouts', () => {
    const text = renderSidebarWidgetMarkdownPlain({
      ...baseCache,
      personal: {
        status: 'unavailable',
        fetchedAt: '2026-07-10T16:15:00.000Z',
        source: 'diveharder',
        data: [],
        errorMessage: 'Personal Orders unavailable — third-party API unreachable.',
      },
    });

    expect(text).toContain('> ⚠ *Personal Orders unavailable');
  });
});

describe('formatTextareaProgressBar', () => {
  it('renders a fixed-width block bar', () => {
    expect(formatTextareaProgressBar(25)).toBe('███░░░░░░░ 25%');
    expect(formatTextareaProgressBar(100)).toBe('██████████ 100%');
    expect(formatTextareaProgressBar(0)).toBe('░░░░░░░░░░ 0%');
  });
});

describe('computeWidgetHeight', () => {
  it('clamps height between 150 and 500', () => {
    expect(computeWidgetHeight('short')).toBeGreaterThanOrEqual(150);
    expect(computeWidgetHeight('x\n'.repeat(200) + 'sed-goal'.repeat(50))).toBeLessThanOrEqual(500);
  });
});

describe('isCustomSidebarWidget', () => {
  it('detects custom widgets by css and height', () => {
    expect(
      isCustomSidebarWidget({
        id: 'w1',
        name: 'SuperEarth Dispatch',
        css: '.foo{}',
        height: 200,
      }),
    ).toBe(true);
  });

  it('treats textarea widgets as legacy', () => {
    expect(
      isCustomSidebarWidget({
        id: 'w2',
        name: 'SuperEarth Dispatch',
      }),
    ).toBe(false);
  });
});

describe('planSidebarWidgetSync', () => {
  it('prefers custom widgets over textarea widgets', () => {
    const plan = planSidebarWidgetSync([
      { id: 'textarea-1', name: WIDGET_SHORT_NAME },
      { id: 'custom-1', name: WIDGET_SHORT_NAME, css: '.sed{}', height: 220 },
      { id: 'custom-2', name: WIDGET_SHORT_NAME, css: '.sed{}', height: 220 },
    ]);

    expect(plan).toEqual({
      mode: WIDGET_KIND_CUSTOM,
      targetId: 'custom-1',
      duplicateIds: ['custom-2'],
      legacyTextareaIds: ['textarea-1'],
    });
  });

  it('falls back to textarea when no custom widget exists', () => {
    const plan = planSidebarWidgetSync([
      { id: 'textarea-1', name: WIDGET_SHORT_NAME },
      { id: 'textarea-2', name: WIDGET_SHORT_NAME },
    ]);

    expect(plan).toEqual({
      mode: WIDGET_KIND_TEXTAREA,
      targetId: 'textarea-1',
      duplicateIds: ['textarea-2'],
    });
  });
});

describe('buildCustomWidgetUpdatePayload', () => {
  it('includes scoped CSS and computed height without imageData', () => {
    const text = renderSidebarWidgetText(baseCache);
    const payload = buildCustomWidgetUpdatePayload('superearth_dispat_dev', text, 'widget-123');

    expect(payload.type).toBe('custom');
    expect(payload.id).toBe('widget-123');
    expect(payload.css).toContain('.sed-goal');
    expect(payload.height).toBe(computeWidgetHeight(text));
    expect('imageData' in payload).toBe(false);
  });
});
