import "@testing-library/jest-dom";

// ─── Browser API stubs missing from jsdom ─────────────────────────────────────

// Radix UI components use ResizeObserver to measure trigger/content elements
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// window.matchMedia (used by some UI primitives)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media:   query,
    onchange: null,
    addListener:    jest.fn(),
    removeListener: jest.fn(),
    addEventListener:    jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent:       jest.fn(),
  }),
});
