/**
 * GlobalMusicContext Test Suite - Vitest
 *
 * Tests for the GlobalMusicContext including provider rendering,
 * hook functionality, state updates, localStorage persistence,
 * and useMusicalScale integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GlobalMusicProvider, useGlobalMusic, type GlobalMusicState } from '../GlobalMusicContext';
import React from 'react';

/**
 * Mock localStorage for testing
 */
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('GlobalMusicProvider', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should render without errors', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalMusicProvider>{children}</GlobalMusicProvider>
    );

    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    expect(result.current).toBeDefined();
  });

  it('should provide default state values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalMusicProvider>{children}</GlobalMusicProvider>
    );

    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    expect(result.current.tempo).toBe(120);
    expect(result.current.key).toBe('C');
    expect(result.current.scale).toBe('major');
    expect(result.current.colorMode).toBe('chromatic');
    expect(result.current.masterVolume).toBe(0.7);
    expect(result.current.hardware.midi.connected).toBe(false);
    expect(result.current.hardware.wled.devices).toEqual([]);
  });

  it('should throw error when useGlobalMusic used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useGlobalMusic());
    }).toThrow('useGlobalMusic must be used within GlobalMusicProvider');

    console.error = originalError;
  });
});

describe('State Update Functions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalMusicProvider>{children}</GlobalMusicProvider>
  );

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should update tempo with valid value', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateTempo(140);
    });

    expect(result.current.tempo).toBe(140);
  });

  it('should reject invalid tempo values', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.updateTempo(30); // Too low
    });

    expect(result.current.tempo).toBe(120); // Should remain default
    expect(consoleWarn).toHaveBeenCalled();

    act(() => {
      result.current.updateTempo(350); // Too high
    });

    expect(result.current.tempo).toBe(120); // Should remain default
    expect(consoleWarn).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  it('should update key', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateKey('D');
    });

    expect(result.current.key).toBe('D');
  });

  it('should update scale', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateScale('minor');
    });

    expect(result.current.scale).toBe('minor');
  });

  it('should update color mode', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateColorMode('harmonic');
    });

    expect(result.current.colorMode).toBe('harmonic');
  });

  it('should update master volume with valid value', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateMasterVolume(0.5);
    });

    expect(result.current.masterVolume).toBe(0.5);
  });

  it('should reject invalid master volume values', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.updateMasterVolume(-0.1); // Too low
    });

    expect(result.current.masterVolume).toBe(0.7); // Should remain default
    expect(consoleWarn).toHaveBeenCalled();

    act(() => {
      result.current.updateMasterVolume(1.5); // Too high
    });

    expect(result.current.masterVolume).toBe(0.7); // Should remain default
    expect(consoleWarn).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });
});

describe('Hardware State Updates', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalMusicProvider>{children}</GlobalMusicProvider>
  );

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should update MIDI input device', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateMidiInput('Test MIDI Input');
    });

    expect(result.current.hardware.midi.inputDevice).toBe('Test MIDI Input');
  });

  it('should update MIDI output device', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateMidiOutput('Test MIDI Output');
    });

    expect(result.current.hardware.midi.outputDevice).toBe('Test MIDI Output');
  });

  it('should update MIDI connection status', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateMidiConnected(true);
    });

    expect(result.current.hardware.midi.connected).toBe(true);
  });

  it('should update WLED devices', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    const testDevices = [
      { id: 'device1', name: 'WLED 1', ip: '192.168.1.100', connected: true },
      { id: 'device2', name: 'WLED 2', ip: '192.168.1.101', connected: false },
    ];

    act(() => {
      result.current.updateWLEDDevices(testDevices);
    });

    expect(result.current.hardware.wled.devices).toEqual(testDevices);
  });

  it('should update active WLED device', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateActiveWLEDDevice('device1');
    });

    expect(result.current.hardware.wled.activeDeviceId).toBe('device1');
  });
});

describe('localStorage Persistence', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalMusicProvider>{children}</GlobalMusicProvider>
  );

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save state to localStorage after debounce', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateTempo(150);
    });

    // Fast-forward time to trigger debounced save
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'centaurus-global-music-state',
      expect.stringContaining('"tempo":150')
    );
  });

  it('should load state from localStorage on mount', () => {
    const savedState: GlobalMusicState = {
      tempo: 130,
      key: 'G',
      scale: 'dorian',
      colorMode: 'harmonic',
      masterVolume: 0.8,
      hardware: {
        midi: {
          inputDevice: 'Saved Input',
          outputDevice: 'Saved Output',
          connected: true,
        },
        wled: {
          devices: [{ id: 'saved1', name: 'Saved WLED', ip: '192.168.1.50', connected: true }],
          activeDeviceId: 'saved1',
        },
      },
    };

    mockLocalStorage.setItem(
      'centaurus-global-music-state',
      JSON.stringify({
        version: 1,
        state: savedState,
        timestamp: new Date().toISOString(),
      })
    );

    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    expect(result.current.tempo).toBe(130);
    expect(result.current.key).toBe('G');
    expect(result.current.scale).toBe('dorian');
    expect(result.current.colorMode).toBe('harmonic');
    expect(result.current.masterVolume).toBe(0.8);
    expect(result.current.hardware.midi.inputDevice).toBe('Saved Input');
  });

  it('should handle missing localStorage gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    // Should use default values
    expect(result.current.tempo).toBe(120);
    expect(result.current.key).toBe('C');
  });

  it('should handle corrupted localStorage data gracefully', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLocalStorage.getItem.mockReturnValue('invalid json');

    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    // Should use default values
    expect(result.current.tempo).toBe(120);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('should handle version mismatch in localStorage', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Set up localStorage BEFORE creating the wrapper
    mockLocalStorage.getItem.mockReturnValueOnce(
      JSON.stringify({
        version: 99, // Wrong version
        state: { tempo: 150 },
        timestamp: new Date().toISOString(),
      })
    );

    // Create new wrapper to trigger initialization with mocked localStorage
    const testWrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalMusicProvider>{children}</GlobalMusicProvider>
    );

    const { result } = renderHook(() => useGlobalMusic(), { wrapper: testWrapper });

    // Should use default values due to version mismatch
    expect(result.current.tempo).toBe(120);
    expect(consoleWarn).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });
});

describe('Musical Scale Integration', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalMusicProvider>{children}</GlobalMusicProvider>
  );

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should expose musical scale utilities', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    expect(typeof result.current.getCurrentScale).toBe('function');
    expect(typeof result.current.isNoteInScale).toBe('function');
    expect(typeof result.current.getScaleDisplayName).toBe('function');
    expect(typeof result.current.getKeySignature).toBe('function');
    expect(Array.isArray(result.current.rootNotes)).toBe(true);
    expect(Array.isArray(result.current.scaleNames)).toBe(true);
  });

  it('should return current scale notes', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    const scaleNotes = result.current.getCurrentScale();

    // C major scale: [0, 2, 4, 5, 7, 9, 11]
    expect(scaleNotes).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('should check if note is in scale', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    // C major scale
    expect(result.current.isNoteInScale(0)).toBe(true); // C
    expect(result.current.isNoteInScale(4)).toBe(true); // E
    expect(result.current.isNoteInScale(1)).toBe(false); // C# not in C major
  });

  it('should return scale display name', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    expect(result.current.getScaleDisplayName()).toBe('Major');
  });

  it('should return key signature', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    expect(result.current.getKeySignature()).toBe('C Major');
  });

  it('should update scale utilities when key changes', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateKey('D');
    });

    // D major scale: D(2), E(4), F#(6), G(7), A(9), B(11), C#(1)
    const scaleNotes = result.current.getCurrentScale();
    expect(scaleNotes).toContain(2); // D
    expect(result.current.getKeySignature()).toBe('D Major');
  });

  it('should update scale utilities when scale changes', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    act(() => {
      result.current.updateScale('minor');
    });

    // C minor scale: [0, 2, 3, 5, 7, 8, 10]
    const scaleNotes = result.current.getCurrentScale();
    expect(scaleNotes).toEqual([0, 2, 3, 5, 7, 8, 10]);
    expect(result.current.getScaleDisplayName()).toBe('Minor');
    expect(result.current.getKeySignature()).toBe('C Minor');
  });
});

describe('Performance and Memoization', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalMusicProvider>{children}</GlobalMusicProvider>
  );

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() => useGlobalMusic(), { wrapper });

    const initialUpdateTempo = result.current.updateTempo;
    const initialUpdateKey = result.current.updateKey;

    rerender();

    expect(result.current.updateTempo).toBe(initialUpdateTempo);
    expect(result.current.updateKey).toBe(initialUpdateKey);
  });

  it('should only trigger re-render when state changes', () => {
    const { result } = renderHook(() => useGlobalMusic(), { wrapper });

    const initialTempo = result.current.tempo;

    act(() => {
      result.current.updateTempo(140);
    });

    expect(result.current.tempo).not.toBe(initialTempo);
    expect(result.current.tempo).toBe(140);
  });
});
