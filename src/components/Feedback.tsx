import type { QuizPhase } from '../domain/quizSession';
import type { UI_STRINGS } from '../domain/language';

interface FeedbackProps {
  phase: QuizPhase;
  soundWord: string;
  listeningUnavailable: boolean;
  strings: typeof UI_STRINGS['en'];
}

/** Child-appropriate feedback for the current quiz phase (FR-008, FR-008a). */
export function Feedback({ phase, soundWord, listeningUnavailable, strings }: FeedbackProps) {
  if (listeningUnavailable) {
    return (
      <p className="feedback feedback-unavailable" role="status" data-testid="feedback">
        🎤 {strings.micUnavailable}
      </p>
    );
  }
  switch (phase) {
    case 'correct':
      return (
        <p className="feedback feedback-correct" role="status" data-testid="feedback">
          {strings.quizCorrect}
        </p>
      );
    case 'tryAgain':
      return (
        <p className="feedback feedback-try-again" role="status" data-testid="feedback">
          {strings.quizTryAgain}
        </p>
      );
    case 'revealed':
      return (
        <p className="feedback feedback-revealed" role="status" data-testid="feedback">
          {strings.quizRevealed.replace('{sound}', soundWord)}
        </p>
      );
    default:
      return (
        <p className="feedback feedback-listening" role="status" data-testid="feedback">
          {strings.quizListening}
        </p>
      );
  }
}
