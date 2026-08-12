import '@testing-library/jest-dom/vitest';

// jsdom lacks PointerEvent; back it with MouseEvent so clientX/clientY are honored in swipe tests.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  // @ts-expect-error assigning polyfill onto the jsdom window
  window.PointerEvent = PointerEvent;
}
