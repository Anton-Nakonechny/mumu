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

// Contract cases from contracts/answer-matcher.md
describe('isAnswerCorrect — multilingual contract cases', () => {
  // Ukrainian (Cyrillic)
  it('C1 — uk exact: "муу" matches ["му","муу"]', () => {
    expect(isAnswerCorrect('муу', ['му', 'муу'])).toBe(true);
  });

  it('C2 — uk repeated + uppercase: "МУУУУУ" matches ["му","муу"]', () => {
    expect(isAnswerCorrect('МУУУУУ', ['му', 'муу'])).toBe(true);
  });

  it('C3 — uk embedded: "корова каже гав" matches ["гав","гав гав"]', () => {
    expect(isAnswerCorrect('корова каже гав', ['гав', 'гав гав'])).toBe(true);
  });

  // Spanish
  it('C4 — es exact: "muu" matches ["mu","muu"]', () => {
    expect(isAnswerCorrect('muu', ['mu', 'muu'])).toBe(true);
  });

  it('C5 — es stretched: "muuuuuu" matches ["mu","muu"]', () => {
    expect(isAnswerCorrect('muuuuuu', ['mu', 'muu'])).toBe(true);
  });

  // English (regression)
  it('C6 — en punctuation: "MOO!!!" matches ["moo","mu","mooo"]', () => {
    expect(isAnswerCorrect('MOO!!!', ['moo', 'mu', 'mooo'])).toBe(true);
  });

  it('C7 — en phrase: "the cow says moo" matches ["moo","mu"]', () => {
    expect(isAnswerCorrect('the cow says moo', ['moo', 'mu'])).toBe(true);
  });

  // Reject cases
  it('C8 — uk unrelated: "банан" does not match ["му","муу"]', () => {
    expect(isAnswerCorrect('банан', ['му', 'муу'])).toBe(false);
  });

  it('C9 — es unrelated: "hola" does not match ["mu","muu"]', () => {
    expect(isAnswerCorrect('hola', ['mu', 'muu'])).toBe(false);
  });

  it('C10 — uk cross-language: "woof" does not match ["му","муу"]', () => {
    expect(isAnswerCorrect('woof', ['му', 'муу'])).toBe(false);
  });

  it('C11 — empty/whitespace: does not match any answers', () => {
    expect(isAnswerCorrect('', ['му', 'mu'])).toBe(false);
    expect(isAnswerCorrect('   ', ['му', 'mu'])).toBe(false);
  });
});
