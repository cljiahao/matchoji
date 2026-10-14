import type { z } from 'zod';

// Google sign-in is a full-page redirect, so in-progress form state would be lost. Drafts
// wait in sessionStorage meanwhile. Storage is user-editable, so reads are schema-checked,
// and blocked storage (private mode, cleared site data) degrades to "no draft".
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function defaultStorage(): DraftStorage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function saveDraft(key: string, draft: unknown, storage: DraftStorage | null): void {
  try {
    storage?.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage blocked: sign-in still proceeds, the user just re-enters the form.
  }
}

export function loadDraft<S extends z.ZodType>(
  key: string,
  schema: S,
  storage: DraftStorage | null
): z.infer<S> | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string, storage: DraftStorage | null): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
