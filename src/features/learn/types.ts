import type { ProductCategory } from '@/features/products';
import type { PrepMethod } from '@/features/reviews';

export interface Recipe {
  slug: string;
  title: string;
  summary: string;
  category: ProductCategory;
  // Pre-fills the tasting form, so it must be one of the logged prep methods.
  prepMethod: PrepMethod;
  minutes: number;
  doseG: number;
  waterMl: number;
  waterTempC: number;
  milkMl?: number;
  ingredients: string[];
  tools: string[];
  steps: string[];
  tips: string[];
}

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface GuideLink {
  label: string;
  href: string;
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  sections: GuideSection[];
  related: GuideLink[];
}
