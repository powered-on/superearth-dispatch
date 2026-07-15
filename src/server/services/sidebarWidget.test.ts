import { describe, expect, it } from 'vitest';
import type { CachedOrders } from '../../shared/types.js';
import { MAJOR_ORDER_STANDBY_MESSAGE } from '../../shared/types.js';
import { computeWidgetHeight } from './sidebarWidgetCss.js';
import {
  displayMajorOrderName,
  formatTextareaProgressBar,
  hasExpectedWidgetStyles,
  isCustomSidebarWidget,
  planSidebarWidgetSync,
  renderSidebarWidgetMarkdownPlain,
  renderSidebarWidgetText,
} from './sidebarWidget.js';
import { WIDGET_SHORT_NAME } from '../../shared/types.js';

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
    expect(text).toContain('Major: Arrowhead (external sync) · Personal: Orders cache');
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

    expect(text).toMatch(/\*\*Major Order\*\* \((\d+d \d+h|\d+h \d+m) left\)  /);
    expect(text).toContain('**HOLD THE LINE**  ');
    expect(text).not.toMatch(/\*\*HOLD THE LINE\*\* \(/);
    expect(text).not.toContain('**MAJOR ORDER: HOLD THE LINE**');
    expect(text).not.toContain('DAILY ORDER');
    expect(text).toContain(' 🟧 **Kill 600,000,000 Terminids**  ');
    expect(text).toMatch(/ ███░░░░░░░ 25%  /);
    expect(text).toContain(' 🟩 **TERREK**  ');
    expect(text).not.toContain('> 🟧');
    expect(text).not.toContain('### Major Order');
    expect(text).not.toContain('<li class="sed-goal');
    expect(text).not.toContain('☑');
    expect(text).toContain('*Major: Arrowhead (external sync)*|*Personal: Orders cache*');
    expect(text).not.toContain('*Major: Arrowhead*\n*Personal');
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

    expect(text).toContain('**⚠** *Personal Orders unavailable');
    expect(text).not.toContain('> **⚠**');
  });
});

describe('displayMajorOrderName', () => {
  it('strips the MAJOR ORDER prefix from API titles', () => {
    expect(displayMajorOrderName('MAJOR ORDER: HOLD THE LINE')).toBe('HOLD THE LINE');
    expect(displayMajorOrderName('HOLD THE LINE')).toBe('HOLD THE LINE');
  });
});

describe('renderSidebarWidgetMarkdownPlain personal heading', () => {
  it('puts countdown on Personal Orders heading without a daily order title', () => {
    const text = renderSidebarWidgetMarkdownPlain({
      ...baseCache,
      major: null,
      personal: {
        status: 'ok',
        fetchedAt: '2026-07-10T16:15:00.000Z',
        source: 'diveharder',
        data: {
          title: 'DAILY ORDER',
          objective: 'Complete patrols on designated worlds.',
          expiresAt: new Date(Date.now() + 43_200_000).toISOString(),
          goals: [
            {
              text: 'Patrol 2 different planets in under 45 minutes.',
              tone: 'brand',
            },
          ],
        },
      },
    });

    expect(text).toMatch(/\*\*Personal Orders\*\* \(\d+h \d+m left\)  /);
    expect(text).not.toContain('**DAILY ORDER**');
    expect(text).toContain('Complete patrols on designated worlds.  ');
    expect(text).toContain('🟨 **Patrol 2 different planets in under 45 minutes.**');
  });
});

describe('hasExpectedWidgetStyles', () => {
  it('matches HD2 widget chrome colors', () => {
    expect(
      hasExpectedWidgetStyles({
        backgroundColor: '#0d0f11',
        headerColor: '#ffb900',
      }),
    ).toBe(true);
  });

  it('rejects missing or default styles', () => {
    expect(hasExpectedWidgetStyles(undefined)).toBe(false);
    expect(hasExpectedWidgetStyles({ backgroundColor: '#1a1a1b', headerColor: '#818384' })).toBe(false);
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
  it('removes legacy custom widgets and keeps one textarea target', () => {
    const plan = planSidebarWidgetSync([
      { id: 'textarea-1', name: WIDGET_SHORT_NAME },
      { id: 'custom-1', name: WIDGET_SHORT_NAME, css: '.sed{}', height: 220 },
      { id: 'custom-2', name: WIDGET_SHORT_NAME, css: '.sed{}', height: 220 },
    ]);

    expect(plan).toEqual({
      targetId: 'textarea-1',
      duplicateIds: ['custom-1', 'custom-2'],
    });
  });

  it('schedules duplicate textarea widgets for removal', () => {
    const plan = planSidebarWidgetSync([
      { id: 'textarea-1', name: WIDGET_SHORT_NAME },
      { id: 'textarea-2', name: WIDGET_SHORT_NAME },
    ]);

    expect(plan).toEqual({
      targetId: 'textarea-1',
      duplicateIds: ['textarea-2'],
    });
  });

  it('creates fresh textarea when only legacy custom widgets exist', () => {
    const plan = planSidebarWidgetSync([
      { id: 'custom-1', name: WIDGET_SHORT_NAME, css: '.sed{}', height: 220 },
    ]);

    expect(plan).toEqual({
      targetId: undefined,
      duplicateIds: ['custom-1'],
    });
  });
});
