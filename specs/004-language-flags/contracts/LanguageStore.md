# Contract: LanguageStore (new)

**File**: `src/services/languageStore.ts`

## Interface

```ts
export interface LanguageStore {
  load(): Language;
  save(lang: Language): void;
}
```

## LocalStorageLanguageStore implementation

```ts
const STORAGE_KEY = 'mumu-language';
const VALID: ReadonlySet<string> = new Set(['en', 'uk', 'es']);

export class LocalStorageLanguageStore implements LanguageStore {
  load(): Language {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID.has(stored)) return stored as Language;
    } catch {
      // localStorage blocked (private browsing, storage quota) — silently default
    }
    return DEFAULT_LANGUAGE; // 'uk'
  }

  save(lang: Language): void {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // silently ignore — persistence is best-effort
    }
  }
}
```

## Invariants

- `load()` always returns a valid `Language` — never throws.
- `save()` never throws — storage failures are silently swallowed.
- If `localStorage` contains an unrecognized value, `load()` returns `'uk'`.

## Usage in App.tsx

```ts
const store = useMemo(() => new LocalStorageLanguageStore(), []);
const [language, setLanguage] = useState<Language>(() => store.load());

const handleLanguageChange = (lang: Language) => {
  store.save(lang);
  setLanguage(lang);
};
```

The store is created once via `useMemo`. `useState` uses a lazy initializer (`() => store.load()`) so it reads `localStorage` exactly once on mount.
