import { scanResponseSchema, type ScanResponse } from '../schemas';
import { downscaleImage } from './downscale-image';

export type ScanFailure = 'unreadable' | 'rate-limited' | 'offline' | 'unavailable' | 'failed';

export class LabelScanError extends Error {
  constructor(readonly failure: ScanFailure) {
    super(failure);
  }
}

export const SCAN_ERROR_MESSAGES: Record<ScanFailure, string> = {
  unreadable: "Couldn't read that label. Try a closer, well-lit photo of the front of the tin.",
  'rate-limited': "You've scanned a lot of labels today. Try again tomorrow, or search by name.",
  offline: "You're offline. Reconnect and try again, or search by name.",
  unavailable: 'Label scanning is not available right now. Search by name instead.',
  failed: 'The scan did not work. Try again, or search by name.',
};

function failureFor(status: number): ScanFailure {
  if (status === 422) return 'unreadable';
  if (status === 429) return 'rate-limited';
  if (status === 503) return 'unavailable';
  return 'failed';
}

export async function scanLabel(file: File): Promise<ScanResponse> {
  const body = new FormData();
  body.set('image', await downscaleImage(file));

  let response: Response;
  try {
    response = await fetch('/api/label-scan', { method: 'POST', body });
  } catch {
    throw new LabelScanError('offline');
  }
  if (!response.ok) throw new LabelScanError(failureFor(response.status));

  const parsed = scanResponseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new LabelScanError('failed');
  return parsed.data;
}

export async function fetchScanEnabled(): Promise<boolean> {
  try {
    const response = await fetch('/api/label-scan');
    if (!response.ok) return false;
    const data: unknown = await response.json();
    return typeof data === 'object' && data !== null && 'enabled' in data && data.enabled === true;
  } catch {
    return false;
  }
}
