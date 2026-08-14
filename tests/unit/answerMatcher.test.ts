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

// Phonetic matching: English acoustic model used as Ukrainian phonetic approximator.
// The English model hears Ukrainian phonemes and emits the nearest English words;
// a consonant-skeleton comparison bridges the gap for multi-word approximations.
describe('isAnswerCorrect — phonetic match (English model as Ukrainian approximator)', () => {
  it('P1 — "gov" (English model approximation of "гав") matches ["gav"]', () => {
    expect(isAnswerCorrect('gov', ['gav'])).toBe(true);
  });

  it('P2 — "gov gov" matches ["gav gav"]', () => {
    expect(isAnswerCorrect('gov gov', ['gav gav'])).toBe(true);
  });

  it('P3 — "cook a rico" (English model hears "кукуріку") matches ["kukuriku"]', () => {
    expect(isAnswerCorrect('cook a rico', ['kukuriku'])).toBe(true);
  });

  it('P4 — phonetic match does not false-accept unrelated English words', () => {
    expect(isAnswerCorrect('hello there', ['gav'])).toBe(false);
    expect(isAnswerCorrect('banana', ['moo'])).toBe(false);
  });

  it('P5 — short consonant skeletons do not collide (mama/home ≠ moo)', () => {
    // 'mama'→'mm' and 'home'→'hm' are within one skeleton-edit of 'moo'→'m' and used to
    // false-accept via phoneticMatch alone (no fuzzy/substring path reaches them). Now rejected.
    expect(isAnswerCorrect('mama', ['moo', 'mu'])).toBe(false);
    expect(isAnswerCorrect('home', ['moo', 'mu'])).toBe(false);
  });

  it('P6 — a single-letter accepted answer is not a near-wildcard', () => {
    // Regression: a length-1 answer ('m') must not match any transcript containing that letter.
    expect(isAnswerCorrect('banana', ['m'])).toBe(false);
    expect(isAnswerCorrect('hello', ['m'])).toBe(false);
    expect(isAnswerCorrect('n', ['m'])).toBe(false);
    expect(isAnswerCorrect('m', ['m'])).toBe(true); // exact still matches
  });
});
