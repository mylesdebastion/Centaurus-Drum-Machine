/**
 * Vitest Test Setup
 * 
 * Global test configuration for the Centaurus Drum Machine project.
 * Sets up testing environment for React components and Web APIs.
 */

import '@testing-library/jest-dom';

// Mock Web MIDI API for hardware testing
global.navigator = global.navigator || {};
(global.navigator as any).requestMIDIAccess = vi.fn(() => Promise.resolve({
  inputs: new Map(),
  outputs: new Map(),
  onstatechange: null,
  sysexEnabled: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock performance.now() for consistent timing in tests
global.performance = global.performance || {};
global.performance.now = vi.fn(() => Date.now());

// Mock console methods to reduce test noise (optional)
global.console = {
  ...console,
  // Uncomment to silence console.log in tests
  // log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Web Audio API context if needed for future tests
(global as any).AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  destination: {},
  close: vi.fn(),
  resume: vi.fn(),
}));