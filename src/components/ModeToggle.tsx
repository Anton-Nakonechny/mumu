export type GameMode = 'learn' | 'quiz';

interface ModeToggleProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

/** Large labeled control to switch Learn ↔ Quiz at any time without restarting (FR-010). */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="Game mode">
      <button
        type="button"
        className={mode === 'learn' ? 'mode-button active' : 'mode-button'}
        aria-pressed={mode === 'learn'}
        onClick={() => onChange('learn')}
      >
        📖 Learn
      </button>
      <button
        type="button"
        className={mode === 'quiz' ? 'mode-button active' : 'mode-button'}
        aria-pressed={mode === 'quiz'}
        onClick={() => onChange('quiz')}
      >
        🎤 Quiz
      </button>
    </div>
  );
}
