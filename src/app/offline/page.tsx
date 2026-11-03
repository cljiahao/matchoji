import type { Metadata } from 'next';

import { OfflineScreen } from '@/features/offline';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

// Precached by the service worker; it must read the same for everyone, so it asks for no session.
export default function OfflinePage() {
  return <OfflineScreen />;
}
