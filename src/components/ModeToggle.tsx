import type { UI_STRINGS } from '../domain/language';

export type GameMode = 'learn' | 'quiz';

interface ModeToggleProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
  strings: typeof UI_STRINGS['en'];
}

/** Large labeled control to switch Learn ↔ Quiz at any time without restarting (FR-010). */
export function ModeToggle({ mode, onChange, strings }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="Game mode">
      <button
        type="button"
        className={mode === 'learn' ? 'mode-button active' : 'mode-button'}
        aria-pressed={mode === 'learn'}
        onClick={() => onChange('learn')}
      >
        📖 {strings.learn}
      </button>
      <button
        type="button"
        className={mode === 'quiz' ? 'mode-button active' : 'mode-button'}
        aria-pressed={mode === 'quiz'}
        onClick={() => onChange('quiz')}
      >
        🎤 {strings.quiz}
      </button>
    </div>
  );
}
