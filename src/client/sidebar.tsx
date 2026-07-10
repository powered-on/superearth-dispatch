import './sidebar.css';
import './hd2-post.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { OrdersApiResponse } from '../shared/types.js';
import { OrderWidget } from './components/OrderWidget.js';

function App() {
  const [payload, setPayload] = useState<OrdersApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const data = (await response.json()) as OrdersApiResponse;
        if (!cancelled) {
          setPayload(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load orders');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="hd2-post" role="alert">
        <p className="status-message">Unable to load order data: {error}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="hd2-post" role="status" aria-live="polite">
        <p className="status-message">Updating orders…</p>
      </div>
    );
  }

  return <OrderWidget payload={payload} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
