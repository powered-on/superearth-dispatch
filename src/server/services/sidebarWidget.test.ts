import { describe, expect, it } from 'vitest';
import type { CachedOrders } from '../../shared/types.js';
import { MAJOR_ORDER_STANDBY_MESSAGE } from '../../shared/types.js';
import { computeWidgetHeight } from './sidebarWidgetCss.js';
import { isCustomSidebarWidget, renderSidebarWidgetMarkdownPlain, renderSidebarWidgetText } from './sidebarWidget.js';

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
    expect(text).toContain('sed-check">✓');
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
  it('renders markdown goals without HTML wrappers', () => {
    const text = renderSidebarWidgetMarkdownPlain(baseCache);

    expect(text).toContain('### Major Order');
    expect(text).toContain('- Kill 600,000,000 Terminids (25%)');
    expect(text).toContain('TERREK ✓');
    expect(text).not.toContain('<li class="sed-goal');
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
