import { useEffect, useState } from 'react';

function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'Ended';
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function CountdownTimer({
  expiresAt,
  className,
}: {
  expiresAt?: string;
  className?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setLabel(null);
      return;
    }

    const expiryMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiryMs)) {
      setLabel(null);
      return;
    }

    const tick = () => {
      setLabel(formatCountdown(expiryMs - Date.now()));
    };

    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!label) {
    return null;
  }

  return (
    <span className={className ?? 'countdown'} aria-live="polite">
      {label}
    </span>
  );
}
