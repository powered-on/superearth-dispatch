import type { ReactNode } from 'react';
import type { NormalizedOrder, OrdersApiResponse, SectionCache } from '../../shared/types.js';
import { isUsableOrderData, sectionErrorMessage } from '../../shared/sectionState.js';
import { CountdownTimer } from './CountdownTimer.js';
import { GoalItem } from './GoalItem.js';

function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

function sectionBadge(section: SectionCache): ReactNode {
  if (section.status === 'stale' && isUsableOrderData(section.data)) {
    return <span className="badge badge--stale">Stale</span>;
  }

  if (section.status === 'ok' && isUsableOrderData(section.data)) {
    return <span className="badge badge--live">Active</span>;
  }

  return null;
}

function SectionHeading({
  id,
  title,
  expiresAt,
  badge,
}: {
  id: string;
  title: string;
  expiresAt?: string | undefined;
  badge?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2 id={id}>
        {title}
        {badge}
      </h2>
      {expiresAt ? <CountdownTimer expiresAt={expiresAt} /> : null}
    </div>
  );
}

function OrderBlock({
  order,
  labelledBy,
  showTitleCountdown = false,
}: {
  order: NormalizedOrder;
  labelledBy?: string;
  showTitleCountdown?: boolean;
}) {
  return (
    <article className="order-block" aria-labelledby={labelledBy}>
      {showTitleCountdown && order.expiresAt ? (
        <div className="order-heading">
          <p className="order-title">{order.title}</p>
          <CountdownTimer expiresAt={order.expiresAt} />
        </div>
      ) : (
        <p className="order-title">{order.title}</p>
      )}
      <p className="order-body">{order.objective}</p>
      {order.goals && order.goals.length > 0 ? (
        <ul className="order-goals">
          {order.goals.map((goal) => (
            <GoalItem key={goal.text} goal={goal} />
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function sectionHasDisplayData(section: SectionCache): boolean {
  return (
    (section.status === 'ok' || section.status === 'stale') &&
    isUsableOrderData(section.data)
  );
}

function SectionStatusMessage({ section }: { section: SectionCache }) {
  if (section.status === 'stale' && isUsableOrderData(section.data)) {
    return (
      <div className="callout warn">
        <p>Stale — last fetched {formatTimestamp(section.fetchedAt) ?? section.fetchedAt}</p>
      </div>
    );
  }

  const message = sectionErrorMessage(section);
  if (message) {
    if (section.status === 'standby') {
      return <p className="status-message standby">{message}</p>;
    }

    return (
      <div className="callout danger">
        <p>{message}</p>
      </div>
    );
  }

  return null;
}

export function MajorOrderSection({ section }: { section: SectionCache | null }) {
  if (!section) {
    return null;
  }

  if (!sectionHasDisplayData(section)) {
    return (
      <section className="panel" aria-labelledby="major-order-heading">
        <SectionHeading id="major-order-heading" title="Major Order" />
        <SectionStatusMessage section={section} />
      </section>
    );
  }

  if (Array.isArray(section.data)) {
    return null;
  }

  return (
    <section className="panel" aria-labelledby="major-order-heading">
      <SectionHeading
        id="major-order-heading"
        title="Major Order"
        badge={sectionBadge(section)}
        {...(section.data.expiresAt ? { expiresAt: section.data.expiresAt } : {})}
      />
      <OrderBlock order={section.data} labelledBy="major-order-heading" />
      {section.status === 'stale' ? <SectionStatusMessage section={section} /> : null}
    </section>
  );
}

export function PersonalOrdersSection({ section }: { section: SectionCache | null }) {
  if (!section) {
    return null;
  }

  if (!sectionHasDisplayData(section)) {
    return (
      <section className="panel" aria-labelledby="personal-orders-heading">
        <SectionHeading id="personal-orders-heading" title="Personal Orders" />
        <SectionStatusMessage section={section} />
      </section>
    );
  }

  if (!Array.isArray(section.data)) {
    return null;
  }

  const orders = section.data;
  const singleOrder = orders.length === 1 ? orders[0] : undefined;

  return (
    <section className="panel" aria-labelledby="personal-orders-heading">
      <SectionHeading
        id="personal-orders-heading"
        title="Personal Orders"
        badge={sectionBadge(section)}
        {...(singleOrder?.expiresAt ? { expiresAt: singleOrder.expiresAt } : {})}
      />
      {orders.map((order: NormalizedOrder, index: number) => (
        <OrderBlock
          key={`${order.title}-${index}`}
          order={order}
          labelledBy="personal-orders-heading"
          showTitleCountdown={orders.length > 1}
        />
      ))}
      {section.status === 'stale' ? <SectionStatusMessage section={section} /> : null}
    </section>
  );
}

export function Footer({ payload }: { payload: OrdersApiResponse }) {
  const updated = formatTimestamp(payload.lastUpdated);

  return (
    <footer className="widget-footer doc-disclaimer">
      {updated ? <p>Last updated: {updated}</p> : <p>No active order data yet</p>}
      <p>
        Sources — Major: {payload.attribution.major}; Personal: {payload.attribution.personal}
      </p>
      <p>
        Fan/community tooling for Helldivers 2. Not affiliated with Arrowhead Game Studios, Sony,
        or Reddit.
      </p>
    </footer>
  );
}

export function WidgetHeader() {
  return (
    <header className="widget-header">
      <p className="kicker">Managed democracy feed</p>
      <h1>SuperEarth Dispatch</h1>
      <p className="subtitle">Helldivers 2 war status for your subreddit</p>
    </header>
  );
}

export function OrderWidget({ payload }: { payload: OrdersApiResponse }) {
  const hasMajor =
    payload.settings.showMajorOrder &&
    payload.major &&
    (sectionHasDisplayData(payload.major) || sectionErrorMessage(payload.major));
  const hasPersonal =
    payload.settings.showPersonalObjectives &&
    payload.personal &&
    (sectionHasDisplayData(payload.personal) || sectionErrorMessage(payload.personal));
  const activeSectionCount = [hasMajor, hasPersonal].filter(Boolean).length;

  if (!hasMajor && !hasPersonal) {
    return (
      <div className="hd2-post" role="status">
        <WidgetHeader />
        <section className="panel">
          <p className="status-message">No active order data yet</p>
        </section>
        <Footer payload={payload} />
      </div>
    );
  }

  return (
    <div className="hd2-post">
      <WidgetHeader />
      <div
        className={
          activeSectionCount < 2 ? 'hd2-post__body hd2-post__body--single' : 'hd2-post__body'
        }
      >
        <MajorOrderSection section={payload.major} />
        <PersonalOrdersSection section={payload.personal} />
      </div>
      <Footer payload={payload} />
    </div>
  );
}
