import { settings } from '@devvit/web/server';
import type { InstallSettings } from '../../shared/types.js';

export async function readInstallSettings(): Promise<InstallSettings> {
  const values = await settings.getAll<InstallSettings>();
  return {
    showMajorOrder: values.showMajorOrder ?? true,
    showPersonalObjectives: values.showPersonalObjectives ?? true,
    personalUseThirdPartyApi: values.personalUseThirdPartyApi ?? true,
  };
}
