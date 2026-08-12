/**
 * Tracks quiz attempts for the current animal and enforces the 2-miss reveal rule
 * (FR-008a): after two misses the correct sound is revealed and the child may move on.
 */

export type QuizPhase = 'listening' | 'correct' | 'tryAgain' | 'revealed';

export const REVEAL_AFTER_MISSES = 2;

export class QuizSession {
  private _attempts = 0;
  private _phase: QuizPhase = 'listening';

  get attempts(): number {
    return this._attempts;
  }

  get phase(): QuizPhase {
    return this._phase;
  }

  /**
   * Record a listen result. A match ends the round as correct; a miss increments the
   * attempt count and either invites another try or, on the 2nd miss, reveals the answer.
   */
  registerResult(isMatch: boolean): QuizPhase {
    if (isMatch) {
      this._phase = 'correct';
      return this._phase;
    }
    this._attempts += 1;
    this._phase = this._attempts >= REVEAL_AFTER_MISSES ? 'revealed' : 'tryAgain';
    return this._phase;
  }

  /** Reset when the shown animal changes or the mode changes. */
  reset(): void {
    this._attempts = 0;
    this._phase = 'listening';
  }
}
