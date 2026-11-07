import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSavedDrafts,
  persistDrafts,
  clearAllDrafts,
  isValidDraft,
  DRAFTS_STORAGE_KEY_V2,
  DRAFTS_LEGACY_KEY,
} from '../services/draftStorage';
import { Draft } from '../types';

// Mock localStorage for test environment
class MockLocalStorage {
  private store = new Map<string, string>();
  public shouldThrowOnSet = false;

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) {
      const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
      throw err;
    }
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Draft Storage & Schema Migration', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (global as unknown as { localStorage: MockLocalStorage }).localStorage = mockStorage;
  });

  it('validates draft shapes correctly', () => {
    assert.equal(
      isValidDraft({
        id: '123',
        companyName: 'Google',
        coverLetter: 'Dear Hiring Manager...',
        createdAt: new Date().toISOString(),
      }),
      true
    );

    assert.equal(isValidDraft(null), false);
    assert.equal(isValidDraft({}), false);
    assert.equal(isValidDraft({ id: '', companyName: 'Google', coverLetter: '' }), false);
    assert.equal(
      isValidDraft({ id: '1', companyName: 'X', coverLetter: 'Y', createdAt: 'invalid-date' }),
      false
    );
  });

  it('migrates legacy drafts_local records to v2 storage', () => {
    const legacyDrafts = [
      {
        id: 'legacy-1',
        companyName: 'Acme Inc',
        coverLetter: 'I am applying for engineer...',
        createdAt: '2026-01-15T10:00:00.000Z',
      },
    ];

    mockStorage.setItem(DRAFTS_LEGACY_KEY, JSON.stringify(legacyDrafts));

    const loaded = loadSavedDrafts();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].companyName, 'Acme Inc');

    // Confirm v2 storage was written and legacy key removed
    assert.ok(mockStorage.getItem(DRAFTS_STORAGE_KEY_V2));
    assert.equal(mockStorage.getItem(DRAFTS_LEGACY_KEY), null);
  });

  it('survives corrupted JSON without throwing', () => {
    mockStorage.setItem(DRAFTS_STORAGE_KEY_V2, 'not valid json {{{');
    const drafts = loadSavedDrafts();
    assert.deepEqual(drafts, []);
  });

  it('persists and deletes drafts cleanly', () => {
    const draft: Draft = {
      id: 'd1',
      companyName: 'Stripe',
      coverLetter: 'Cover letter content',
      createdAt: new Date().toISOString(),
    };

    const res = persistDrafts([draft]);
    assert.equal(res.success, true);

    const loaded = loadSavedDrafts();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].companyName, 'Stripe');

    clearAllDrafts();
    assert.deepEqual(loadSavedDrafts(), []);
  });

  it('recovers from storage quota error by pruning older drafts', () => {
    const drafts: Draft[] = Array.from({ length: 8 }, (_, i) => ({
      id: `draft-${i}`,
      companyName: `Company ${i}`,
      coverLetter: 'Letter content '.repeat(20),
      createdAt: new Date().toISOString(),
    }));

    // Trigger quota error on first write
    let callCount = 0;
    const realSetItem = mockStorage.setItem.bind(mockStorage);
    mockStorage.setItem = (key: string, value: string) => {
      callCount++;
      if (callCount === 1) {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      }
      realSetItem(key, value);
    };

    const result = persistDrafts(drafts);
    assert.equal(result.success, true);
    assert.ok(result.error?.includes('storage was nearly full'));
  });
});
