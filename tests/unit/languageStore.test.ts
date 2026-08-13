import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageLanguageStore } from '../../src/services/languageStore';

describe('LocalStorageLanguageStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('load() returns "uk" when storage is empty', () => {
    const store = new LocalStorageLanguageStore();
    expect(store.load()).toBe('uk');
  });

  it('load() returns the stored valid Language', () => {
    localStorage.setItem('mumu-language', 'es');
    const store = new LocalStorageLanguageStore();
    expect(store.load()).toBe('es');
  });

  it('load() returns "uk" when stored value is unrecognized', () => {
    localStorage.setItem('mumu-language', 'fr');
    const store = new LocalStorageLanguageStore();
    expect(store.load()).toBe('uk');
  });

  it('save() writes the correct key/value', () => {
    const store = new LocalStorageLanguageStore();
    store.save('en');
    expect(localStorage.getItem('mumu-language')).toBe('en');
  });

  it('load() after save() returns the saved language', () => {
    const store = new LocalStorageLanguageStore();
    store.save('es');
    expect(store.load()).toBe('es');
  });

  it('load() never throws even when localStorage throws', () => {
    const store = new LocalStorageLanguageStore();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(() => store.load()).not.toThrow();
    expect(store.load()).toBe('uk');
    vi.restoreAllMocks();
  });

  it('save() never throws even when localStorage throws', () => {
    const store = new LocalStorageLanguageStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(() => store.save('en')).not.toThrow();
    vi.restoreAllMocks();
  });
});
