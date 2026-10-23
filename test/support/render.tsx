import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { Product } from '@/features/products';
import type { Review } from '@/features/reviews';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderWithQuery(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: wrapperFor(createTestQueryClient()), ...options });
}

export function renderHookWithQuery<T>(hook: () => T) {
  return renderHook(hook, { wrapper: wrapperFor(createTestQueryClient()) });
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Uji Ceremonial',
    brand: 'Marukyu Koyamaen',
    category: 'matcha',
    grade: 'Ceremonial',
    regionName: 'Uji, Kyoto',
    supply: null,
    imageUrl: null,
    shopUrl: null,
    status: 'approved',
    addedBy: null,
    reviewNote: null,
    mergedInto: null,
    createdAt: '2026-09-01T00:00:00Z',
    avgStars: 4.5,
    reviewCount: 12,
    topNotes: [],
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    productId: 'p1',
    reviewerName: 'taster',
    stars: 4,
    notes: null,
    photoUrl: null,
    createdAt: '2026-09-01T00:00:00Z',
    flavorNotes: [],
    profile: {},
    prep: { method: null, doseG: null, waterMl: null, waterTempC: null },
    tastedOn: '2026-09-01',
    ...overrides,
  };
}
