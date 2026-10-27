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

export interface LessonPractice {
  // The recipe to make; its page has the "Log a tasting with this recipe" button.
  recipeSlug: string;
  prompt: string;
}

export interface Lesson {
  slug: string;
  title: string;
  minutes: number;
  sections: GuideSection[];
  practice?: LessonPractice;
}

export interface Course {
  slug: string;
  title: string;
  summary: string;
  level: 'Beginner' | 'Next steps';
  lessons: Lesson[];
}
