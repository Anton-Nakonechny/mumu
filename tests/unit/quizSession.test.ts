import { describe, it, expect } from 'vitest';
import { QuizSession } from '../../src/domain/quizSession';

describe('QuizSession (2-miss reveal, FR-008a)', () => {
  it('starts listening with zero attempts', () => {
    const s = new QuizSession();
    expect(s.phase).toBe('listening');
    expect(s.attempts).toBe(0);
  });

  it('marks correct on a match', () => {
    const s = new QuizSession();
    expect(s.registerResult(true)).toBe('correct');
    expect(s.attempts).toBe(0);
  });

  it('invites another try after the first miss', () => {
    const s = new QuizSession();
    expect(s.registerResult(false)).toBe('tryAgain');
    expect(s.attempts).toBe(1);
  });

  it('reveals the answer after the second miss', () => {
    const s = new QuizSession();
    s.registerResult(false);
    expect(s.registerResult(false)).toBe('revealed');
    expect(s.attempts).toBe(2);
  });

  it('resets attempts and phase on animal/mode change', () => {
    const s = new QuizSession();
    s.registerResult(false);
    s.registerResult(false);
    s.reset();
    expect(s.phase).toBe('listening');
    expect(s.attempts).toBe(0);
  });
});
