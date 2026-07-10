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

function SectionHeading({
  id,
  title,
  expiresAt,
}: {
  id: string;
  title: string;
  expiresAt?: string | undefined;
}) {
  return (
    <div className="section-heading">
      <h3 id={id}>{title}</h3>
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
          <p className="title">{order.title}</p>
          <CountdownTimer expiresAt={order.expiresAt} />
        </div>
      ) : (
        <p className="title">{order.title}</p>
      )}
      <p className="objective">{order.objective}</p>
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
  if (section.status === 'stale') {
    return (
      <p className="status-message">
        Stale — last fetched {formatTimestamp(section.fetchedAt) ?? section.fetchedAt}
      </p>
    );
  }

  const message = sectionErrorMessage(section);
  if (message) {
    return (
      <p className={section.status === 'standby' ? 'status-message standby' : 'status-message'}>
        {message}
      </p>
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
      <section className="section" aria-labelledby="major-order-heading">
        <SectionHeading id="major-order-heading" title="Major Order" />
        <SectionStatusMessage section={section} />
      </section>
    );
  }

  if (Array.isArray(section.data)) {
    return null;
  }

  return (
    <section className="section" aria-labelledby="major-order-heading">
      <SectionHeading
        id="major-order-heading"
        title="Major Order"
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
      <section className="section" aria-labelledby="personal-orders-heading">
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
    <section className="section" aria-labelledby="personal-orders-heading">
      <SectionHeading
        id="personal-orders-heading"
        title="Personal Orders"
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
    <footer className="footer">
      {updated ? <p>Last updated: {updated}</p> : <p>No active order data yet</p>}
      <p>
        Sources — Major: {payload.attribution.major}; Personal: {payload.attribution.personal}
      </p>
    </footer>
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

  if (!hasMajor && !hasPersonal) {
    return (
      <div className="widget" role="status">
        <p className="status-message">No active order data yet</p>
        <Footer payload={payload} />
      </div>
    );
  }

  return (
    <div className="widget">
      <MajorOrderSection section={payload.major} />
      <PersonalOrdersSection section={payload.personal} />
      <Footer payload={payload} />
    </div>
  );
}
