import { Draft } from '../types';

export const DRAFTS_STORAGE_KEY_V2 = 'covercraft_drafts_v2';
export const DRAFTS_LEGACY_KEY = 'drafts_local';
export const MAX_DRAFTS_COUNT = 30;

/**
 * Validate that an unknown object conforms to the Draft interface.
 */
export function isValidDraft(item: unknown): item is Draft {
  if (!item || typeof item !== 'object') return false;
  const d = item as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    d.id.trim().length > 0 &&
    typeof d.companyName === 'string' &&
    typeof d.coverLetter === 'string' &&
    d.coverLetter.trim().length > 0 &&
    typeof d.createdAt === 'string' &&
    !isNaN(Date.parse(d.createdAt))
  );
}

/**
 * Load drafts safely from localStorage with schema validation and legacy migration.
 */
export function loadSavedDrafts(): Draft[] {
  try {
    // 1. Try modern v2 storage
    const v2Raw = localStorage.getItem(DRAFTS_STORAGE_KEY_V2);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidDraft).slice(0, MAX_DRAFTS_COUNT);
      }
    }

    // 2. Check for legacy drafts and migrate
    const legacyRaw = localStorage.getItem(DRAFTS_LEGACY_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (Array.isArray(parsedLegacy)) {
        const migrated: Draft[] = parsedLegacy
          .filter(isValidDraft)
          .map((d) => ({
            id: d.id || crypto.randomUUID(),
            companyName: d.companyName || 'Untitled Draft',
            coverLetter: d.coverLetter,
            createdAt: d.createdAt || new Date().toISOString(),
          }))
          .slice(0, MAX_DRAFTS_COUNT);

        try {
          localStorage.setItem(DRAFTS_STORAGE_KEY_V2, JSON.stringify(migrated));
          localStorage.removeItem(DRAFTS_LEGACY_KEY);
        } catch {
          // Ignore quota error during migration
        }

        return migrated;
      }
    }

    return [];
  } catch (err) {
    console.error('Failed to load drafts from storage:', err);
    return [];
  }
}

/**
 * Save updated drafts list to localStorage with quota-exceeded recovery.
 */
export function persistDrafts(drafts: Draft[]): { success: boolean; error?: string } {
  try {
    const validDrafts = drafts.filter(isValidDraft).slice(0, MAX_DRAFTS_COUNT);
    localStorage.setItem(DRAFTS_STORAGE_KEY_V2, JSON.stringify(validDrafts));
    return { success: true };
  } catch (err) {
    // Check if error is quota exceeded
    const isQuotaError =
      err instanceof DOMException &&
      (err.code === 22 ||
        err.code === 1014 ||
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED');

    if (isQuotaError && drafts.length > 5) {
      // Auto-prune the oldest 3 drafts to recover space
      try {
        const pruned = drafts.slice(0, drafts.length - 3);
        localStorage.setItem(DRAFTS_STORAGE_KEY_V2, JSON.stringify(pruned));
        return {
          success: true,
          error: 'Browser storage was nearly full. The oldest drafts were removed to save your latest draft.',
        };
      } catch {
        // Still failed
      }
    }

    return {
      success: false,
      error: 'Could not save draft: browser local storage quota is full. Please delete older drafts.',
    };
  }
}

/**
 * Delete all saved drafts from localStorage.
 */
export function clearAllDrafts(): void {
  try {
    localStorage.removeItem(DRAFTS_STORAGE_KEY_V2);
    localStorage.removeItem(DRAFTS_LEGACY_KEY);
  } catch {
    // Ignore storage errors
  }
}
