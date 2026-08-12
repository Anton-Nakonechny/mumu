import { describe, it, expect } from 'vitest';
import { parseAnimal, parseAnimals } from '../../src/services/animalsRepository';

const valid = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.avif',
  soundWord: 'muuuu',
  acceptedAnswers: ['MUUU', 'Moo'],
};

describe('parseAnimal validation & normalization', () => {
  it('accepts a valid entry and lowercases acceptedAnswers', () => {
    const a = parseAnimal(valid);
    expect(a).not.toBeNull();
    expect(a!.acceptedAnswers).toEqual(['muuu', 'moo']);
  });

  it('rejects entries missing required fields', () => {
    expect(parseAnimal({ ...valid, id: '' })).toBeNull();
    expect(parseAnimal({ ...valid, name: undefined })).toBeNull();
    expect(parseAnimal({ ...valid, image: '  ' })).toBeNull();
    expect(parseAnimal({ ...valid, soundWord: '' })).toBeNull();
  });

  it('rejects entries with no valid acceptedAnswers', () => {
    expect(parseAnimal({ ...valid, acceptedAnswers: [] })).toBeNull();
    expect(parseAnimal({ ...valid, acceptedAnswers: ['', '   '] })).toBeNull();
    expect(parseAnimal({ ...valid, acceptedAnswers: 'moo' })).toBeNull();
  });
});

describe('parseAnimals list handling', () => {
  it('skips invalid entries and keeps valid ones', () => {
    const list = parseAnimals([valid, { id: 'bad' }, { ...valid, id: 'dog', name: 'dog' }]);
    expect(list.map((a) => a.id)).toEqual(['cow', 'dog']);
  });

  it('drops duplicate ids (first wins)', () => {
    const list = parseAnimals([valid, { ...valid, soundWord: 'moo2' }]);
    expect(list).toHaveLength(1);
  });

  it('returns empty array for non-array input', () => {
    expect(parseAnimals(null)).toEqual([]);
    expect(parseAnimals({})).toEqual([]);
  });
});
