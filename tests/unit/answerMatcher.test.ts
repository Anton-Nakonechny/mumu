import { describe, it, expect } from 'vitest';
import { isAnswerCorrect } from '../../src/domain/answerMatcher';

const cowAnswers = ['muuu', 'moo', 'mooo', 'mu'];

describe('isAnswerCorrect (lenient, FR-013)', () => {
  it('accepts an exact accepted answer', () => {
    expect(isAnswerCorrect('moo', cowAnswers)).toBe(true);
  });

  it('accepts extra-long repeated vowels (child pronunciation, SC-004)', () => {
    expect(isAnswerCorrect('muuuuuuuu', cowAnswers)).toBe(true);
  });

  it('accepts a close mispronunciation within edit distance', () => {
    expect(isAnswerCorrect('mooo', cowAnswers)).toBe(true);
    expect(isAnswerCorrect('muu', cowAnswers)).toBe(true);
  });

  it('accepts the answer embedded in a short phrase', () => {
    expect(isAnswerCorrect('the cow says moo', cowAnswers)).toBe(true);
  });

  it('is case and punctuation insensitive', () => {
    expect(isAnswerCorrect('MOO!!!', cowAnswers)).toBe(true);
  });

  it('rejects clearly unrelated words (SC-005)', () => {
    expect(isAnswerCorrect('banana', cowAnswers)).toBe(false);
    expect(isAnswerCorrect('woof', cowAnswers)).toBe(false);
    expect(isAnswerCorrect('hello there', cowAnswers)).toBe(false);
  });

  it('rejects empty / no-speech transcripts', () => {
    expect(isAnswerCorrect('', cowAnswers)).toBe(false);
    expect(isAnswerCorrect('   ', cowAnswers)).toBe(false);
  });
});
