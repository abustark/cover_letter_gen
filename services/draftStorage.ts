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

export interface DraftsBackupPayload {
  version: '2.0';
  exportedAt: string;
  totalCount: number;
  drafts: Draft[];
}

/**
 * Triggers an instant JSON download of all saved drafts.
 */
export function exportDraftsBackup(drafts: Draft[]): void {
  const validDrafts = drafts.filter(isValidDraft);
  const payload: DraftsBackupPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    totalCount: validDrafts.length,
    drafts: validDrafts,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `covercraft-drafts-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and merges imported JSON drafts with the current drafts library.
 */
export function importDraftsBackup(
  rawJson: string,
  currentDrafts: Draft[]
): { success: boolean; merged: Draft[]; addedCount: number; error?: string } {
  try {
    const parsed = JSON.parse(rawJson);
    let incomingDrafts: unknown[] = [];

    if (Array.isArray(parsed)) {
      incomingDrafts = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { drafts?: unknown[] }).drafts)) {
      incomingDrafts = (parsed as { drafts: unknown[] }).drafts;
    } else {
      return { success: false, merged: currentDrafts, addedCount: 0, error: 'Unrecognized backup format.' };
    }

    const validIncoming = incomingDrafts.filter(isValidDraft);
    if (validIncoming.length === 0) {
      return { success: false, merged: currentDrafts, addedCount: 0, error: 'No valid drafts found in backup file.' };
    }

    // Merge by id (incoming take precedence or new added)
    const existingIds = new Set(currentDrafts.map((d) => d.id));
    const newItems = validIncoming.filter((d) => !existingIds.has(d.id));

    const merged = [...newItems, ...currentDrafts].slice(0, MAX_DRAFTS_COUNT);
    persistDrafts(merged);

    return {
      success: true,
      merged,
      addedCount: newItems.length,
    };
  } catch (err) {
    return {
      success: false,
      merged: currentDrafts,
      addedCount: 0,
      error: err instanceof Error ? err.message : 'Invalid JSON file.',
    };
  }
}
