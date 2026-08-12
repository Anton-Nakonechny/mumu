import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimalCard } from '../../src/components/AnimalCard';
import type { Animal } from '../../src/domain/animal';

const cow: Animal = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.avif',
  soundWord: 'muuuu',
  acceptedAnswers: ['moo'],
};

function setup() {
  const onNext = vi.fn();
  const onPrev = vi.fn();
  const onReplay = vi.fn();
  const { container } = render(
    <AnimalCard animal={cow} onNext={onNext} onPrev={onPrev} onReplay={onReplay} />,
  );
  return { onNext, onPrev, onReplay, container };
}

describe('AnimalCard', () => {
  it('renders the animal picture', () => {
    setup();
    const img = screen.getByRole('img', { name: 'cow' }) as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('cow.avif');
  });

  it('fires onNext / onPrev from the large buttons', () => {
    const { onNext, onPrev } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous animal' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('fires the replay callback', () => {
    const { onReplay } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Say it again' }));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('navigates on horizontal swipe (left → next, right → prev)', () => {
    const { onNext, onPrev, container } = setup();
    const card = container.querySelector('.animal-card')!;
    fireEvent.pointerDown(card, { clientX: 250 });
    fireEvent.pointerUp(card, { clientX: 120 }); // swipe left
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(card, { clientX: 120 });
    fireEvent.pointerUp(card, { clientX: 250 }); // swipe right
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('ignores tiny movements below the swipe threshold', () => {
    const { onNext, onPrev, container } = setup();
    const card = container.querySelector('.animal-card')!;
    fireEvent.pointerDown(card, { clientX: 200 });
    fireEvent.pointerUp(card, { clientX: 190 });
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });
});
