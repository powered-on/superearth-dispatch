import { DIVEHARDER_PERSONAL_URL } from '../../shared/types.js';
import type { AhgsAssignment } from './orderMapper.js';

export async function fetchPersonalOrders(): Promise<AhgsAssignment[]> {
  const response = await fetch(DIVEHARDER_PERSONAL_URL);
  if (!response.ok) {
    throw new Error(`diveharder personal_order failed: ${response.status}`);
  }

  const payload = (await response.json()) as AhgsAssignment[];
  if (!Array.isArray(payload)) {
    throw new Error('diveharder personal_order response is not an array');
  }

  return payload;
}
