import { useState } from 'react';
import type { InstallSettings } from '../../shared/types.js';

type ModToolbarProps = {
  settings: InstallSettings;
  isModerator: boolean;
  onReload: () => Promise<void>;
};

export function ModToolbar({ settings, isModerator, onReload }: ModToolbarProps) {
  const [pendingAction, setPendingAction] = useState<'refresh' | 'readd' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isModerator) {
    return null;
  }

  const showRefresh = settings.showForceRefreshButton;
  const showReadd = settings.showReaddSidebarWidgetButton;

  if (!showRefresh && !showReadd) {
    return null;
  }

  async function runAction(
    action: 'refresh' | 'readd',
    endpoint: string,
    successMessage: string,
  ): Promise<void> {
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(endpoint, { method: 'POST' });
      const body = (await response.json()) as { message?: string; status?: string };

      if (!response.ok) {
        throw new Error(body.message ?? `Request failed (${response.status})`);
      }

      setMessage(body.message ?? successMessage);
      await onReload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mod-toolbar" aria-label="Moderator controls">
      <p className="mod-toolbar__label">Moderator controls</p>
      <div className="mod-toolbar__actions">
        {showRefresh ? (
          <button
            type="button"
            className="mod-toolbar__button"
            disabled={pendingAction !== null}
            onClick={() =>
              void runAction('refresh', '/api/mod/force-refresh', 'Force refresh complete.')
            }
          >
            {pendingAction === 'refresh' ? 'Refreshing…' : 'Force refresh'}
          </button>
        ) : null}
        {showReadd ? (
          <button
            type="button"
            className="mod-toolbar__button mod-toolbar__button--secondary"
            disabled={pendingAction !== null}
            onClick={() =>
              void runAction(
                'readd',
                '/api/mod/readd-sidebar-widget',
                'Sidebar widget re-added.',
              )
            }
          >
            {pendingAction === 'readd' ? 'Re-adding…' : 'Re-add sidebar widget'}
          </button>
        ) : null}
      </div>
      {message ? (
        <p className="mod-toolbar__status mod-toolbar__status--ok" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mod-toolbar__status mod-toolbar__status--error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
