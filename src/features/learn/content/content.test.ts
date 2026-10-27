import { describe, expect, it } from 'vitest';

import { PREP_METHODS } from '@/features/reviews';

import { COURSES, findCourse, findLesson } from './courses';
import { GUIDES, findGuide } from './guides';
import { RECIPES, findRecipe } from './recipes';

describe('recipes', () => {
  it('have unique slugs and can be found by them', () => {
    expect(new Set(RECIPES.map((r) => r.slug)).size).toBe(RECIPES.length);
    for (const recipe of RECIPES) expect(findRecipe(recipe.slug)).toBe(recipe);
    expect(findRecipe('nope')).toBeUndefined();
  });

  // The log button hands these to the tasting form, so they must pass the database's checks.
  it('use a logged prep method and values the tasting form accepts', () => {
    for (const recipe of RECIPES) {
      expect(PREP_METHODS).toContain(recipe.prepMethod);
      expect(recipe.doseG).toBeGreaterThan(0);
      expect(recipe.doseG).toBeLessThanOrEqual(50);
      expect(recipe.waterMl).toBeGreaterThan(0);
      expect(recipe.waterMl).toBeLessThanOrEqual(1000);
      expect(recipe.waterTempC).toBeGreaterThan(0);
      expect(recipe.waterTempC).toBeLessThanOrEqual(100);
    }
  });

  it('each have ingredients, tools, steps and tips', () => {
    for (const recipe of RECIPES) {
      for (const list of [recipe.ingredients, recipe.tools, recipe.steps, recipe.tips]) {
        expect(list.length).toBeGreaterThan(0);
        expect(new Set(list).size).toBe(list.length);
      }
    }
  });
});

describe('guides', () => {
  it('have unique slugs and can be found by them', () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
    for (const guide of GUIDES) expect(findGuide(guide.slug)).toBe(guide);
    expect(findGuide('nope')).toBeUndefined();
  });

  it('have sections with text and link only within the site', () => {
    for (const guide of GUIDES) {
      expect(guide.sections.length).toBeGreaterThan(0);
      for (const section of guide.sections) expect(section.paragraphs.length).toBeGreaterThan(0);
      for (const link of guide.related) expect(link.href).toMatch(/^\/[a-z]/);
    }
  });
});

describe('courses', () => {
  it('have unique course and lesson slugs that the progress table accepts', () => {
    expect(new Set(COURSES.map((c) => c.slug)).size).toBe(COURSES.length);
    for (const course of COURSES) {
      expect(course.slug).toMatch(/^[a-z0-9-]{1,60}$/);
      expect(findCourse(course.slug)).toBe(course);
      expect(new Set(course.lessons.map((l) => l.slug)).size).toBe(course.lessons.length);
      for (const lesson of course.lessons) expect(lesson.slug).toMatch(/^[a-z0-9-]{1,60}$/);
    }
  });

  it('give every lesson text, and practice only with recipes that exist', () => {
    for (const course of COURSES) {
      expect(course.lessons.length).toBeGreaterThan(0);
      for (const lesson of course.lessons) {
        expect(lesson.sections.length).toBeGreaterThan(0);
        if (lesson.practice) expect(findRecipe(lesson.practice.recipeSlug)).toBeDefined();
      }
    }
  });

  it('find a lesson with its place in the course', () => {
    expect(findLesson('matcha-101', 'first-usucha')).toMatchObject({ index: 2 });
    expect(findLesson('matcha-101', 'nope')).toBeUndefined();
    expect(findLesson('nope', 'first-usucha')).toBeUndefined();
  });
});
