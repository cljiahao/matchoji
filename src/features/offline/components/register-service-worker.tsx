'use client';

import { useEffect } from 'react';

import { SERVICE_WORKER_URL } from '../constants';

// Production only: a worker caching build files would fight hot reload in dev.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' }).catch(() => {
      // Without a worker the site simply works online only.
    });
  }, []);
  return null;
}
