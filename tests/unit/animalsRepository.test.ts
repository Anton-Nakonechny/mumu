import { describe, it, expect } from 'vitest';
import { parseAnimal, parseAnimals, parseLocalizedAnimal, parseLocalizedAnimals } from '../../src/services/animalsRepository';
import { resolveAnimal, resolveAnimals, AnimalCollection } from '../../src/domain/animal';
import animalsData from '../../public/assets/animals.json';

const valid = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.webp',
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

const validLocalized = {
  id: 'cow',
  image: 'assets/animals/cow.webp',
  translations: {
    en: { name: 'cow', soundWord: 'moo', acceptedAnswers: ['Moo', 'MOOO'] },
    uk: { name: 'корова', soundWord: 'муу', acceptedAnswers: ['Муу', 'Му'], learnPhrase: 'Корова каже... муу!' },
    es: { name: 'vaca', soundWord: 'mu', acceptedAnswers: ['mu'] },
  },
};

describe('parseLocalizedAnimal', () => {
  it('parses a valid localized entry and lowercases acceptedAnswers', () => {
    const result = parseLocalizedAnimal(validLocalized);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('cow');
    expect(result!.translations.en!.acceptedAnswers).toEqual(['moo', 'mooo']);
    expect(result!.translations.uk!.acceptedAnswers).toEqual(['муу', 'му']);
  });

  it('rejects entries without id', () => {
    expect(parseLocalizedAnimal({ ...validLocalized, id: '' })).toBeNull();
    expect(parseLocalizedAnimal({ ...validLocalized, id: undefined })).toBeNull();
  });

  it('rejects entries without image', () => {
    expect(parseLocalizedAnimal({ ...validLocalized, image: '' })).toBeNull();
  });

  it('rejects entries missing translations object', () => {
    expect(parseLocalizedAnimal({ ...validLocalized, translations: null })).toBeNull();
    expect(parseLocalizedAnimal({ ...validLocalized, translations: undefined })).toBeNull();
  });

  it('rejects entries missing english translation', () => {
    const noEn = { ...validLocalized, translations: { uk: validLocalized.translations.uk } };
    expect(parseLocalizedAnimal(noEn)).toBeNull();
  });

  it('rejects entries where english translation has no valid acceptedAnswers', () => {
    const badEn = {
      ...validLocalized,
      translations: { ...validLocalized.translations, en: { name: 'cow', soundWord: 'moo', acceptedAnswers: [] } },
    };
    expect(parseLocalizedAnimal(badEn)).toBeNull();
  });

  it('includes optional languages when present and valid', () => {
    const result = parseLocalizedAnimal(validLocalized);
    expect(result!.translations.uk).toBeDefined();
    expect(result!.translations.uk!.learnPhrase).toBe('Корова каже... муу!');
    expect(result!.translations.es).toBeDefined();
  });

  it('silently skips invalid optional language translations', () => {
    const withBadUk = {
      ...validLocalized,
      translations: {
        ...validLocalized.translations,
        uk: { name: '', soundWord: 'муу', acceptedAnswers: ['му'] },
      },
    };
    const result = parseLocalizedAnimal(withBadUk);
    expect(result).not.toBeNull();
    expect(result!.translations.uk).toBeUndefined();
  });
});

describe('parseLocalizedAnimals', () => {
  it('drops invalid entries', () => {
    const list = parseLocalizedAnimals([validLocalized, { id: 'bad' }]);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('cow');
  });

  it('drops duplicate ids (first wins)', () => {
    const list = parseLocalizedAnimals([validLocalized, { ...validLocalized, image: 'other.png' }]);
    expect(list).toHaveLength(1);
  });

  it('returns empty array for non-array input', () => {
    expect(parseLocalizedAnimals(null)).toEqual([]);
  });
});

describe('resolveAnimal', () => {
  const data = parseLocalizedAnimal(validLocalized)!;

  it('resolves to the requested language', () => {
    const animal = resolveAnimal(data, 'uk');
    expect(animal).not.toBeNull();
    expect(animal!.name).toBe('корова');
    expect(animal!.soundWord).toBe('муу');
    expect(animal!.learnPhrase).toBe('Корова каже... муу!');
  });

  it('falls back to en when requested language is absent', () => {
    const enOnly = parseLocalizedAnimal({
      ...validLocalized,
      translations: { en: validLocalized.translations.en },
    })!;
    const animal = resolveAnimal(enOnly, 'uk');
    expect(animal).not.toBeNull();
    expect(animal!.name).toBe('cow');
  });

  it('returns null when neither requested lang nor en fallback is valid', () => {
    const empty = { id: 'x', image: 'x.png', translations: {} };
    expect(resolveAnimal(empty as Parameters<typeof resolveAnimal>[0], 'uk')).toBeNull();
  });
});

describe('resolveAnimals', () => {
  it('resolves all animals and drops nulls', () => {
    const noEn = { id: 'bad', image: 'bad.png', translations: {} };
    const list = resolveAnimals(
      [parseLocalizedAnimal(validLocalized)!, noEn as Parameters<typeof resolveAnimals>[0][0]],
      'uk',
    );
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('корова');
  });
});

// T011 — 9-animal roster (006-add-more-animals)
describe('9-animal roster — 006-add-more-animals', () => {
  const NEW_IDS = ['duck', 'chicken', 'rooster', 'wolf', 'goat', 'sheep', 'turkey'];

  it('parseLocalizedAnimals(animals.json) yields 9 entries', () => {
    const list = parseLocalizedAnimals(animalsData);
    expect(list).toHaveLength(9);
  });

  it('each new animal resolves in en with non-empty name, soundWord, and image', () => {
    const list = parseLocalizedAnimals(animalsData);
    const resolved = resolveAnimals(list, 'en');
    for (const id of NEW_IDS) {
      const animal = resolved.find((a) => a.id === id);
      expect(animal, `${id}: missing from resolved en roster`).toBeDefined();
      expect(animal!.name.length, `${id}: empty name`).toBeGreaterThan(0);
      expect(animal!.soundWord.length, `${id}: empty soundWord`).toBeGreaterThan(0);
      expect(animal!.image.length, `${id}: empty image`).toBeGreaterThan(0);
    }
  });

  it('AnimalCollection.next() wraps from last animal back to first across 9 animals', () => {
    const coll = new AnimalCollection(resolveAnimals(parseLocalizedAnimals(animalsData), 'en'));
    expect(coll.size).toBe(9);
    for (let i = 0; i < 8; i++) coll.next();
    expect(coll.currentIndex).toBe(8);
    coll.next();
    expect(coll.currentIndex).toBe(0);
  });

  it('AnimalCollection.prev() wraps from first animal back to last across 9 animals', () => {
    const coll = new AnimalCollection(resolveAnimals(parseLocalizedAnimals(animalsData), 'en'));
    coll.prev();
    expect(coll.currentIndex).toBe(8);
  });
});

// T019 — UK/ES localization for new animals (006-add-more-animals)
describe('UK/ES localization for new animals — 006-add-more-animals', () => {
  const NEW_IDS = ['duck', 'chicken', 'rooster', 'wolf', 'goat', 'sheep', 'turkey'];

  it('each new animal resolves a localized (non-fallback) name in uk', () => {
    const list = parseLocalizedAnimals(animalsData);
    const enResolved = resolveAnimals(list, 'en');
    const ukResolved = resolveAnimals(list, 'uk');
    for (const id of NEW_IDS) {
      const enAnimal = enResolved.find((a) => a.id === id);
      const ukAnimal = ukResolved.find((a) => a.id === id);
      expect(ukAnimal, `${id}: missing from uk roster`).toBeDefined();
      expect(ukAnimal!.name, `${id}: uk name equals en fallback — no uk block`).not.toBe(enAnimal?.name);
    }
  });

  it('each new animal resolves a localized (non-fallback) name in es', () => {
    const list = parseLocalizedAnimals(animalsData);
    const enResolved = resolveAnimals(list, 'en');
    const esResolved = resolveAnimals(list, 'es');
    for (const id of NEW_IDS) {
      const enAnimal = enResolved.find((a) => a.id === id);
      const esAnimal = esResolved.find((a) => a.id === id);
      expect(esAnimal, `${id}: missing from es roster`).toBeDefined();
      expect(esAnimal!.name, `${id}: es name equals en fallback — no es block`).not.toBe(enAnimal?.name);
    }
  });

  it('each new animal uk block contains at least one Latin sound-alike in acceptedAnswers', () => {
    const list = parseLocalizedAnimals(animalsData);
    const LATIN_CHAR = /[a-z]/i;
    for (const entry of list.filter((d) => NEW_IDS.includes(d.id))) {
      const ukTrans = entry.translations['uk'];
      expect(ukTrans, `${entry.id}: missing uk block`).toBeDefined();
      const hasLatin = ukTrans!.acceptedAnswers.some((a) => LATIN_CHAR.test(a));
      expect(hasLatin, `${entry.id}: uk block has no Latin sound-alike in acceptedAnswers`).toBe(true);
    }
  });
});
