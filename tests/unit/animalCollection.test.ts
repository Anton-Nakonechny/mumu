import { describe, it, expect } from 'vitest';
import { AnimalCollection, learnPhraseFor, quizPromptFor, type Animal } from '../../src/domain/animal';

const cow: Animal = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.webp',
  soundWord: 'muuuu',
  acceptedAnswers: ['muuu', 'moo'],
};
const dog: Animal = {
  id: 'dog',
  name: 'dog',
  image: 'assets/animals/dog.png',
  soundWord: 'woof woof',
  acceptedAnswers: ['woof'],
};

describe('AnimalCollection', () => {
  it('starts at the first animal', () => {
    const c = new AnimalCollection([cow, dog]);
    expect(c.current()).toEqual(cow);
    expect(c.currentIndex).toBe(0);
    expect(c.isEmpty).toBe(false);
  });

  it('advances to the next animal', () => {
    const c = new AnimalCollection([cow, dog]);
    expect(c.next()).toEqual(dog);
  });

  it('wraps to the first animal after the last (loop, FR-015)', () => {
    const c = new AnimalCollection([cow, dog]);
    c.next(); // dog
    expect(c.next()).toEqual(cow);
  });

  it('wraps to the last animal when going back from the first', () => {
    const c = new AnimalCollection([cow, dog]);
    expect(c.prev()).toEqual(dog);
  });

  it('treats an empty collection as empty and no-ops navigation', () => {
    const c = new AnimalCollection([]);
    expect(c.isEmpty).toBe(true);
    expect(c.current()).toBeUndefined();
    expect(c.next()).toBeUndefined();
    expect(c.prev()).toBeUndefined();
  });
});

describe('phrase helpers', () => {
  it('composes the default learn phrase', () => {
    expect(learnPhraseFor(cow)).toBe('The cow says muuuu');
  });

  it('composes the default quiz prompt', () => {
    expect(quizPromptFor(cow)).toBe('What does the cow say?');
  });

  it('honors explicit overrides', () => {
    const custom: Animal = { ...cow, learnPhrase: 'Moo!', quizPrompt: 'Cow?' };
    expect(learnPhraseFor(custom)).toBe('Moo!');
    expect(quizPromptFor(custom)).toBe('Cow?');
  });
});
