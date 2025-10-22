import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Tone from 'tone';
import { AudioEngine, TransportState } from '../audioEngine';

// Mock Tone.js
vi.mock('tone', () => {
  const mockTransport = {
    state: 'stopped',
    position: '0:0:0',
    bpm: {
      value: 120,
    },
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
  };

  const mockContext = {
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
  };

  const mockVolume = {
    volume: {
      value: 0,
    },
    toDestination: vi.fn().mockReturnThis(),
  };

  return {
    Transport: mockTransport,
    context: mockContext,
    Volume: vi.fn(() => mockVolume),
    start: vi.fn().mockResolvedValue(undefined),
    now: vi.fn(() => 0),
    Frequency: vi.fn(() => ({ toNote: () => 'C4' })),
    MembraneSynth: vi.fn().mockImplementation(() => ({
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      connect: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    NoiseSynth: vi.fn().mockImplementation(() => ({
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      connect: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    MetalSynth: vi.fn().mockImplementation(() => ({
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      connect: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    PolySynth: vi.fn().mockImplementation(() => ({
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      triggerAttack: vi.fn(),
      triggerRelease: vi.fn(),
      connect: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    Synth: vi.fn(),
  };
});

describe('AudioEngine - Transport State Persistence', () => {
  let audioEngine: AudioEngine;

  beforeEach(async () => {
    // Reset Tone.js mocks
    vi.clearAllMocks();
    (Tone.Transport.state as any) = 'stopped';
    (Tone.Transport.position as any) = '0:0:0';
    Tone.Transport.bpm.value = 120;
    (Tone.context.state as any) = 'running';

    // Get AudioEngine instance
    audioEngine = AudioEngine.getInstance();

    // Initialize audio engine
    await audioEngine.initialize();
  });

  describe('getTransportState', () => {
    it('should capture current transport state', () => {
      // Set transport state
      (Tone.Transport.state as any) = 'started';
      (Tone.Transport.position as any) = '4:2:1';
      Tone.Transport.bpm.value = 140;

      const state = audioEngine.getTransportState();

      expect(state.state).toBe('started');
      expect(state.position).toBe('4:2:1');
      expect(state.bpm).toBe(140);
      expect(state.timestamp).toBeTypeOf('number');
    });

    it('should capture stopped state', () => {
      (Tone.Transport.state as any) = 'stopped';

      const state = audioEngine.getTransportState();

      expect(state.state).toBe('stopped');
    });

    it('should capture paused state', () => {
      (Tone.Transport.state as any) = 'paused';

      const state = audioEngine.getTransportState();

      expect(state.state).toBe('paused');
    });

    it('should return default state if not initialized', () => {
      // Create a new instance without initializing
      const uninitializedEngine = Object.create(AudioEngine.prototype);
      (uninitializedEngine as any).isInitialized = false;

      const state = uninitializedEngine.getTransportState();

      expect(state.state).toBe('stopped');
      expect(state.position).toBe('0:0:0');
      expect(state.bpm).toBe(120);
    });
  });

  describe('restoreTransportState', () => {
    it('should restore started state', () => {
      const state: TransportState = {
        state: 'started',
        position: '8:0:0',
        bpm: 160,
        timestamp: performance.now(),
      };

      audioEngine.restoreTransportState(state);

      expect(Tone.Transport.bpm.value).toBe(160);
      expect(Tone.Transport.position).toBe('8:0:0');
      expect(Tone.Transport.start).toHaveBeenCalled();
    });

    it('should restore stopped state', () => {
      (Tone.Transport.state as any) = 'started';

      const state: TransportState = {
        state: 'stopped',
        position: '0:0:0',
        bpm: 120,
        timestamp: performance.now(),
      };

      audioEngine.restoreTransportState(state);

      expect(Tone.Transport.stop).toHaveBeenCalled();
    });

    it('should restore paused state', () => {
      (Tone.Transport.state as any) = 'started';

      const state: TransportState = {
        state: 'paused',
        position: '2:1:2',
        bpm: 100,
        timestamp: performance.now(),
      };

      audioEngine.restoreTransportState(state);

      expect(Tone.Transport.bpm.value).toBe(100);
      expect(Tone.Transport.position).toBe('2:1:2');
      expect(Tone.Transport.pause).toHaveBeenCalled();
    });

    it('should not restore if already in correct state', () => {
      (Tone.Transport.state as any) = 'started';

      const state: TransportState = {
        state: 'started',
        position: '4:0:0',
        bpm: 130,
        timestamp: performance.now(),
      };

      audioEngine.restoreTransportState(state);

      // Should not call start again if already started
      expect(Tone.Transport.start).not.toHaveBeenCalled();
    });

    it('should handle invalid state gracefully', () => {
      const uninitializedEngine = Object.create(AudioEngine.prototype);
      (uninitializedEngine as any).isInitialized = false;

      const state: TransportState = {
        state: 'started',
        position: '0:0:0',
        bpm: 120,
        timestamp: performance.now(),
      };

      // Should not throw
      expect(() => uninitializedEngine.restoreTransportState(state)).not.toThrow();
    });
  });

  describe('getAudioContextState', () => {
    it('should return running state', () => {
      (Tone.context.state as any) = 'running';

      const state = audioEngine.getAudioContextState();

      expect(state).toBe('running');
    });

    it('should return suspended state', () => {
      (Tone.context.state as any) = 'suspended';

      const state = audioEngine.getAudioContextState();

      expect(state).toBe('suspended');
    });

    it('should return closed state', () => {
      (Tone.context.state as any) = 'closed';

      const state = audioEngine.getAudioContextState();

      expect(state).toBe('closed');
    });
  });

  describe('ensureAudioContext', () => {
    it('should resume suspended audio context', async () => {
      (Tone.context.state as any) = 'suspended';

      await audioEngine.ensureAudioContext();

      expect(Tone.context.resume).toHaveBeenCalled();
    });

    it('should not resume if already running', async () => {
      (Tone.context.state as any) = 'running';

      await audioEngine.ensureAudioContext();

      expect(Tone.context.resume).not.toHaveBeenCalled();
    });

    it('should handle resume errors gracefully', async () => {
      (Tone.context.state as any) = 'suspended';
      (Tone.context.resume as any).mockRejectedValueOnce(new Error('Resume failed'));

      // Should not throw
      await expect(audioEngine.ensureAudioContext()).resolves.not.toThrow();
    });
  });

  describe('syncTransportBPM', () => {
    it('should sync transport BPM', () => {
      audioEngine.syncTransportBPM(150);

      expect(Tone.Transport.bpm.value).toBe(150);
    });

    it('should handle different BPM values', () => {
      audioEngine.syncTransportBPM(80);
      expect(Tone.Transport.bpm.value).toBe(80);

      audioEngine.syncTransportBPM(200);
      expect(Tone.Transport.bpm.value).toBe(200);
    });

    it('should not sync if not initialized', () => {
      const uninitializedEngine = Object.create(AudioEngine.prototype);
      (uninitializedEngine as any).isInitialized = false;

      const originalBpm = Tone.Transport.bpm.value;
      uninitializedEngine.syncTransportBPM(180);

      // BPM should not change
      expect(Tone.Transport.bpm.value).toBe(originalBpm);
    });
  });

  describe('Integration: Full Navigation Cycle', () => {
    it('should preserve state across save/restore cycle', () => {
      // Set transport to specific state
      (Tone.Transport.state as any) = 'started';
      (Tone.Transport.position as any) = '16:3:2';
      Tone.Transport.bpm.value = 175;

      // Capture state (simulating navigation away)
      const savedState = audioEngine.getTransportState();

      // Change transport state (simulating different view)
      (Tone.Transport.state as any) = 'stopped';
      (Tone.Transport.position as any) = '0:0:0';
      Tone.Transport.bpm.value = 120;

      // Restore state (simulating navigation back)
      audioEngine.restoreTransportState(savedState);

      // Verify state was restored
      expect(Tone.Transport.bpm.value).toBe(175);
      expect(Tone.Transport.position).toBe('16:3:2');
      expect(Tone.Transport.start).toHaveBeenCalled();
    });

    it('should handle rapid navigation without loss', () => {
      const states: TransportState[] = [];

      // Simulate rapid navigation
      for (let i = 0; i < 5; i++) {
        (Tone.Transport.position as any) = `${i}:0:0`;
        Tone.Transport.bpm.value = 120 + i * 10;
        states.push(audioEngine.getTransportState());
      }

      // Verify each state was captured correctly
      states.forEach((state, index) => {
        expect(state.position).toBe(`${index}:0:0`);
        expect(state.bpm).toBe(120 + index * 10);
      });
    });
  });
});
