import type { QuizPhase } from '../domain/quizSession';

interface FeedbackProps {
  phase: QuizPhase;
  soundWord: string;
  listeningUnavailable: boolean;
}

/** Child-appropriate feedback for the current quiz phase (FR-008, FR-008a). */
export function Feedback({ phase, soundWord, listeningUnavailable }: FeedbackProps) {
  if (listeningUnavailable) {
    return (
      <p className="feedback feedback-unavailable" role="status" data-testid="feedback">
        🎤 Listening isn’t available — tap ▶ to see the next animal, or 🔊 to hear the sound.
      </p>
    );
  }
  switch (phase) {
    case 'correct':
      return (
        <p className="feedback feedback-correct" role="status" data-testid="feedback">
          🎉 Yay! That’s right!
        </p>
      );
    case 'tryAgain':
      return (
        <p className="feedback feedback-try-again" role="status" data-testid="feedback">
          🙂 Good try — say it again!
        </p>
      );
    case 'revealed':
      return (
        <p className="feedback feedback-revealed" role="status" data-testid="feedback">
          It says “{soundWord}”. Great trying! Tap ▶ for the next animal.
        </p>
      );
    default:
      return (
        <p className="feedback feedback-listening" role="status" data-testid="feedback">
          👂 Listening…
        </p>
      );
  }
}
