/**
 * Minimal polyfills for the jsdom test environment.
 * jsdom strips TextDecoder/TextEncoder from Node globals — restore them.
 */
const { TextDecoder, TextEncoder } = require("util");
Object.defineProperty(globalThis, "TextDecoder", { writable: true, value: TextDecoder });
Object.defineProperty(globalThis, "TextEncoder", { writable: true, value: TextEncoder });
