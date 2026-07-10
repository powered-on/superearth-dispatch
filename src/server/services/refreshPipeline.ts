import { readCache } from './cache.js';
import { refreshOrders } from './orderFetcher.js';
import { readInstallSettings } from './settings.js';
import { syncSidebarWidget } from './sidebarWidget.js';

export async function runRefreshPipeline(): Promise<void> {
  const installSettings = await readInstallSettings();
  await refreshOrders(installSettings);

  const cache = await readCache();
  if (cache) {
    await syncSidebarWidget(cache);
  }
}
