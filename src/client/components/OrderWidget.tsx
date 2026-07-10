import type { NormalizedOrder, OrdersApiResponse, SectionCache } from '../../shared/types.js';
import { isUsableOrderData, sectionErrorMessage } from '../../shared/sectionState.js';

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

function formatExpiry(expiresAt?: string): string | null {
  if (!expiresAt) {
    return null;
  }

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `Expires ${date.toLocaleString()}`;
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
    return <p className="status-message">{message}</p>;
  }

  return null;
}

function OrderBlock({ order, labelledBy }: { order: NormalizedOrder; labelledBy?: string }) {
  const expiry = formatExpiry(order.expiresAt);

  return (
    <article className="section" aria-labelledby={labelledBy}>
      <p className="title">{order.title}</p>
      <p className="objective">{order.objective}</p>
      {expiry ? <p className="meta">{expiry}</p> : null}
    </article>
  );
}

function sectionHasDisplayData(section: SectionCache): boolean {
  return (
    (section.status === 'ok' || section.status === 'stale') &&
    isUsableOrderData(section.data)
  );
}

export function MajorOrderSection({ section }: { section: SectionCache | null }) {
  if (!section) {
    return null;
  }

  if (!sectionHasDisplayData(section)) {
    return (
      <section className="section" aria-labelledby="major-order-heading">
        <h3 id="major-order-heading">Major Order</h3>
        <SectionStatusMessage section={section} />
      </section>
    );
  }

  if (Array.isArray(section.data)) {
    return null;
  }

  return (
    <section className="section" aria-labelledby="major-order-heading">
      <h3 id="major-order-heading">Major Order</h3>
      <OrderBlock order={section.data} labelledBy="major-order-heading" />
      {section.status === 'stale' ? <SectionStatusMessage section={section} /> : null}
    </section>
  );
}

export function PersonalObjectivesSection({ section }: { section: SectionCache | null }) {
  if (!section) {
    return null;
  }

  if (!sectionHasDisplayData(section)) {
    return (
      <section className="section" aria-labelledby="personal-objectives-heading">
        <h3 id="personal-objectives-heading">Daily Objectives</h3>
        <SectionStatusMessage section={section} />
      </section>
    );
  }

  if (!Array.isArray(section.data)) {
    return null;
  }

  return (
    <section className="section" aria-labelledby="personal-objectives-heading">
      <h3 id="personal-objectives-heading">Daily Objectives</h3>
      {section.data.map((order: NormalizedOrder, index: number) => (
        <OrderBlock key={`${order.title}-${index}`} order={order} labelledBy="personal-objectives-heading" />
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
        Sources — Major: {payload.attribution.major}; Daily: {payload.attribution.personal}
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
      <PersonalObjectivesSection section={payload.personal} />
      <Footer payload={payload} />
    </div>
  );
}
