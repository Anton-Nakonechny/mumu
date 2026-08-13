# Contract: LanguageSelector (new component)

**File**: `src/components/LanguageSelector.tsx`

## Props

```ts
interface LanguageSelectorProps {
  language: Language;
  onChange: (lang: Language) => void;
}
```

## Rendered HTML shape

```html
<div class="language-selector" role="radiogroup" aria-label="Language">
  <button
    type="button"
    role="radio"
    class="lang-button [active]"
    aria-checked="true|false"
    aria-label="Ukrainian"
    data-testid="lang-uk"
    onClick=…
  >🇺🇦</button>
  <!-- × 3 for uk, es, en in that order -->
</div>
```

Order: 🇺🇦 Ukrainian · 🇪🇸 Spanish · 🇺🇸 English (matches `LANGUAGES` array order).

## Visual states

| State    | CSS class           | Visual                          |
|----------|---------------------|---------------------------------|
| Active   | `lang-button active`| elevated scale (1.3×), outline  |
| Inactive | `lang-button`       | 80% opacity, normal size        |
| Hover    | (CSS `:hover`)      | 100% opacity                    |

## Sizing

Minimum tap target: 48 × 48 px. Flag emoji font-size: 2rem (32 px) at minimum; implementation may use 2.5rem for comfort. No text label rendered — `aria-label` carries the accessible name.

## Behavior

- Tapping an active flag → `onChange` is NOT called (no-op). No flicker or state reset. (Acceptance scenario 2.3)
- Tapping an inactive flag → `onChange(lang)` called immediately.
- The component is stateless — it reflects `language` prop; the parent owns state.

## Placement in App.tsx

```tsx
<main className="app">
  <LanguageSelector language={language} onChange={handleLanguageChange} />
  <ModeToggle mode={mode} onChange={setMode} />
  {mode === 'learn' ? <LearnMode … /> : <QuizMode … />}
</main>
```

## Test IDs

| Element        | data-testid     |
|----------------|-----------------|
| Ukrainian btn  | `lang-uk`       |
| Spanish btn    | `lang-es`       |
| English btn    | `lang-en`       |
| Container div  | `lang-selector` |
