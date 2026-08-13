import { useRef, type ReactNode } from 'react';
import type { Animal } from '../domain/animal';

const SWIPE_THRESHOLD_PX = 50;

interface AnimalCardProps {
  animal: Animal;
  onNext: () => void;
  onPrev: () => void;
  onReplay: () => void;
  /** Overlay content (mode-specific: sentence text, feedback, quiz controls). */
  children?: ReactNode;
}

/**
 * Shared presentation of one animal: large picture, big Prev/Next buttons, horizontal
 * swipe navigation, and a replay control (FR-001, FR-003, FR-014). Reused by Learn and
 * Quiz modes so navigation behaves identically (FR-009).
 */
export function AnimalCard({ animal, onNext, onPrev, onReplay, children }: AnimalCardProps) {
  const startX = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx <= -SWIPE_THRESHOLD_PX) onNext();
    else if (dx >= SWIPE_THRESHOLD_PX) onPrev();
  };

  return (
    <div className="animal-card" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <div className="animal-stage">
        <img
          className="animal-image"
          src={animal.image}
          alt={animal.name}
          draggable={false}
        />
        <button
          type="button"
          className="replay-button"
          aria-label="Say it again"
          onClick={onReplay}
        >
          🔊
        </button>
        {children}
      </div>

      <div className="nav-row">
        <button
          type="button"
          className="nav-button nav-prev"
          aria-label="Previous animal"
          onClick={onPrev}
        >
          ◀
        </button>
        <button
          type="button"
          className="nav-button nav-next"
          aria-label="Next animal"
          onClick={onNext}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
