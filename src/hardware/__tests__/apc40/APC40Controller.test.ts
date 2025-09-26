/**
 * APC40Controller Integration Tests
 * 
 * Tests the APC40Controller class implementation including MIDI communication,
 * SysEx initialization, LED control, and hardware event handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { APC40Controller } from '../../apc40/APC40Controller';
import { WebMIDIApiWrapper } from '../../utils/webMidiApi';
import {
  MIDI_MESSAGE_TYPES,
  APC40_SYSEX,
  CONNECTION_HEALTH,
} from '../../apc40/constants';
import { 
  defaultGridMapping,
  APC40_LED_COLORS,
  APC40_TRANSPORT,
} from '../../apc40/midiMapping';
import type { SequencerState, HardwareEvent } from '../../core/types';

// Mock WebMIDIApiWrapper
vi.mock('../../utils/webMidiApi');

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn();
vi.stubGlobal('performance', { now: mockPerformanceNow });

// Mock Date.now for consistent ID generation
const mockDateNow = vi.fn();
vi.stubGlobal('Date', { ...Date, now: mockDateNow });

// Mock window.setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
const mockSetTimeout = vi.fn();
vi.stubGlobal('setInterval', mockSetInterval);
vi.stubGlobal('clearInterval', mockClearInterval);
vi.stubGlobal('setTimeout', mockSetTimeout);

describe('APC40Controller', () => {
  let controller: APC40Controller;
  let mockWebMidiApi: vi.Mocked<WebMIDIApiWrapper>;
  let mockMidiInput: WebMIDI.MIDIInput;
  let mockMidiOutput: WebMIDI.MIDIOutput;
  let eventCallbacks: Map<string, Function>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
    mockDateNow.mockReturnValue(1000);
    
    // Create mock MIDI devices
    eventCallbacks = new Map();
    mockMidiInput = {
      id: 'apc40-input',
      name: 'APC40 mkII',
      addEventListener: vi.fn((event, callback) => {
        eventCallbacks.set(event, callback);
      }),
      removeEventListener: vi.fn(),
    } as any;

    mockMidiOutput = {
      id: 'apc40-output',
      name: 'APC40 mkII',
      send: vi.fn(),
    } as any;

    // Mock WebMIDIApiWrapper
    mockWebMidiApi = {
      initialize: vi.fn().mockResolvedValue(undefined),
      isInitialized: vi.fn().mockReturnValue(true),
      enumerateDevices: vi.fn().mockResolvedValue({
        inputs: [mockMidiInput],
        outputs: [mockMidiOutput],
      }),
    } as any;

    (WebMIDIApiWrapper as any).mockImplementation(() => mockWebMidiApi);

    // Create controller instance
    controller = new APC40Controller('test-apc40');
  });

  afterEach(async () => {
    if (controller.connectionStatus === 'connected') {
      await controller.disconnect();
    }
  });

  describe('Constructor and Properties', () => {
    it('should initialize with correct properties', () => {
      expect(controller.id).toEqual('test-apc40');
      expect(controller.name).toEqual('APC40 Controller');
      expect(controller.connectionStatus).toEqual('disconnected');
      expect(controller.capabilities).toEqual({
        hasLEDs: true,
        hasVelocityPads: true,
        hasKnobs: true,
        hasTransportControls: true,
        stepButtonCount: 16,
        trackButtonCount: 8,
      });
    });

    it('should generate unique ID when none provided', () => {
      mockDateNow.mockReturnValueOnce(1000);
      mockDateNow.mockReturnValueOnce(2000);
      
      const controller1 = new APC40Controller();
      const controller2 = new APC40Controller();
      
      expect(controller1.id).not.toEqual(controller2.id);
      expect(controller1.id).toMatch(/^apc40-\d+$/);
    });
  });

  describe('Connection Management', () => {
    it('should connect to APC40 device successfully', async () => {
      mockWebMidiApi.isInitialized.mockReturnValue(false);
      
      await controller.connect();

      // Verify initialization sequence
      expect(mockWebMidiApi.initialize).toHaveBeenCalled();
      expect(mockWebMidiApi.enumerateDevices).toHaveBeenCalled();
      expect(mockMidiInput.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
      expect(controller.connectionStatus).toEqual('connected');
      expect(controller.name).toEqual('APC40 mkII');
    });

    it('should handle device not found error', async () => {
      mockWebMidiApi.enumerateDevices.mockResolvedValue({
        inputs: [],
        outputs: [],
      });

      await expect(controller.connect()).rejects.toThrow('APC40 device not found');
      expect(controller.connectionStatus).toEqual('error');
    });

    it('should send SysEx mode switch on initialization', async () => {
      await controller.connect();

      // Wait for initialization delay
      await new Promise(resolve => setTimeout(resolve, 110));

      // Verify SysEx mode switch was sent
      expect(mockMidiOutput.send).toHaveBeenCalledWith([
        ...APC40_SYSEX.HEADER,
        APC40_SYSEX.COMMANDS.SET_MODE,
        APC40_SYSEX.MODES.GENERIC_MODE,
        ...APC40_SYSEX.FOOTER,
      ]);
    });

    it('should disconnect properly', async () => {
      await controller.connect();
      await controller.disconnect();

      expect(mockMidiInput.removeEventListener).toHaveBeenCalled();
      expect(controller.connectionStatus).toEqual('disconnected');
    });

    it('should start heartbeat monitoring on connection', async () => {
      await controller.connect();

      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        10000 // APC40_TIMING.HEARTBEAT_INTERVAL
      );
    });
  });

  describe('MIDI Message Handling', () => {
    beforeEach(async () => {
      await controller.connect();
    });

    it('should handle grid button note on messages', () => {
      const eventListeners: HardwareEvent[] = [];
      controller.addEventListener('step_toggle', (event) => {
        eventListeners.push(event);
      });

      // Simulate note 32 (first grid button) press with velocity 100
      const midiCallback = eventCallbacks.get('midimessage');
      expect(midiCallback).toBeDefined();

      const mockEvent = {
        data: [MIDI_MESSAGE_TYPES.NOTE_ON, 32, 100],
      } as WebMIDI.MIDIMessageEvent;

      midiCallback!(mockEvent);

      expect(eventListeners).toHaveLength(1);
      expect(eventListeners[0]).toMatchObject({
        type: 'step_toggle',
        controllerId: controller.id,
        data: {
          step: 0, // Note 32 maps to step 0 based on grid mapping
          velocity: 100,
          intensity: 4, // High velocity maps to max intensity
          note: 32,
        },
      });
    });

    it('should handle transport control messages', () => {
      const eventListeners: HardwareEvent[] = [];
      controller.addEventListener('hardware_input', (event) => {
        eventListeners.push(event);
      });

      // Simulate play button press
      const midiCallback = eventCallbacks.get('midimessage');
      const mockEvent = {
        data: [MIDI_MESSAGE_TYPES.NOTE_ON, APC40_TRANSPORT.PLAY, 127],
      } as WebMIDI.MIDIMessageEvent;

      midiCallback!(mockEvent);

      expect(eventListeners).toHaveLength(1);
      expect(eventListeners[0]).toMatchObject({
        type: 'hardware_input',
        data: { command: 'play', transport: true },
      });
    });

    it('should handle control change messages', () => {
      const eventListeners: HardwareEvent[] = [];
      controller.addEventListener('hardware_input', (event) => {
        eventListeners.push(event);
      });

      // Simulate knob adjustment
      const midiCallback = eventCallbacks.get('midimessage');
      const mockEvent = {
        data: [MIDI_MESSAGE_TYPES.CONTROL_CHANGE, 48, 64],
      } as WebMIDI.MIDIMessageEvent;

      midiCallback!(mockEvent);

      expect(eventListeners).toHaveLength(1);
      expect(eventListeners[0]).toMatchObject({
        type: 'hardware_input',
        data: {
          controlChange: true,
          ccNumber: 48,
          value: 64,
        },
      });
    });

    it('should ignore note off messages for grid buttons', () => {
      const eventListeners: HardwareEvent[] = [];
      controller.addEventListener('step_toggle', (event) => {
        eventListeners.push(event);
      });

      // Simulate note off message
      const midiCallback = eventCallbacks.get('midimessage');
      const mockEvent = {
        data: [MIDI_MESSAGE_TYPES.NOTE_OFF, 32, 0],
      } as WebMIDI.MIDIMessageEvent;

      midiCallback!(mockEvent);

      expect(eventListeners).toHaveLength(0);
    });
  });

  describe('LED Control and Sequencer State', () => {
    beforeEach(async () => {
      await controller.connect();
      // Clear initialization calls
      vi.clearAllMocks();
    });

    it('should update LEDs based on sequencer state', () => {
      const sequencerState: SequencerState = {
        currentStep: 2,
        isPlaying: true,
        tempo: 120,
        pattern: [
          [true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
          [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        ],
        trackCount: 2,
      };

      controller.updateSequencerState(sequencerState);

      // Check that LED updates were sent
      expect(mockMidiOutput.send).toHaveBeenCalled();
      
      // Verify specific LED updates
      const calls = (mockMidiOutput.send as MockedFunction<any>).mock.calls;
      
      // Should update LEDs for active steps and current step
      expect(calls.some(([data]) => 
        data.includes(APC40_SYSEX.COMMANDS.LED_CONTROL) &&
        data[data.indexOf(APC40_SYSEX.COMMANDS.LED_CONTROL) + 2] === APC40_LED_COLORS.RED_BLINK // Current step
      )).toBe(true);
    });

    it('should not update LEDs when not initialized', () => {
      // Create disconnected controller
      const disconnectedController = new APC40Controller();
      
      const sequencerState: SequencerState = {
        currentStep: 0,
        isPlaying: false,
        tempo: 120,
        pattern: [[true]],
        trackCount: 1,
      };

      disconnectedController.updateSequencerState(sequencerState);

      expect(mockMidiOutput.send).not.toHaveBeenCalled();
    });

    it('should clear all LEDs on disconnect', async () => {
      await controller.disconnect();

      // Should send LED off commands for grid range
      const calls = (mockMidiOutput.send as MockedFunction<any>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // Check that some calls are LED clear commands
      expect(calls.some(([data]) => 
        data.includes(APC40_SYSEX.COMMANDS.LED_CONTROL) &&
        data[data.indexOf(APC40_SYSEX.COMMANDS.LED_CONTROL) + 2] === 0 // LED off
      )).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle connection errors gracefully', async () => {
      mockWebMidiApi.initialize.mockRejectedValue(new Error('MIDI API unavailable'));

      await expect(controller.connect()).rejects.toThrow('MIDI API unavailable');
      expect(controller.connectionStatus).toEqual('error');
    });

    it('should handle SysEx send errors', async () => {
      await controller.connect();
      
      // Mock SysEx send failure
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockMidiOutput.send.mockImplementation(() => {
        throw new Error('SysEx send failed');
      });

      // Trigger LED update that will fail
      const sequencerState: SequencerState = {
        currentStep: 0,
        isPlaying: false,
        tempo: 120,
        pattern: [[true]],
        trackCount: 1,
      };

      controller.updateSequencerState(sequencerState);

      expect(consoleSpy).toHaveBeenCalledWith('APC40Controller: SysEx send failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should attempt reconnection on error', async () => {
      await controller.connect();

      // Simulate connection error
      controller.handleError(new Error('Connection lost'));

      expect(controller.connectionStatus).toEqual('error');
      
      // Should schedule reconnection
      expect(mockSetTimeout).toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    it('should manage event listeners correctly', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      controller.addEventListener('step_toggle', callback1);
      controller.addEventListener('step_toggle', callback2);

      // Send test event
      controller.sendEvent({
        type: 'step_toggle',
        data: { step: 0 },
      });

      expect(callback1).toHaveBeenCalledWith({
        type: 'step_toggle',
        controllerId: controller.id,
        data: { step: 0 },
        timestamp: 1000,
      });
      expect(callback2).toHaveBeenCalledWith(expect.objectContaining({
        type: 'step_toggle',
        controllerId: controller.id,
      }));

      // Remove listener
      controller.removeEventListener('step_toggle', callback1);

      controller.sendEvent({
        type: 'step_toggle',
        data: { step: 1 },
      });

      expect(callback1).toHaveBeenCalledTimes(1); // Not called again
      expect(callback2).toHaveBeenCalledTimes(2); // Called again
    });

    it('should handle event listener errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      controller.addEventListener('step_toggle', faultyCallback);

      controller.sendEvent({
        type: 'step_toggle',
        data: { step: 0 },
      });

      expect(consoleSpy).toHaveBeenCalledWith('APC40Controller: Event listener error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Controller State', () => {
    it('should return correct state information', async () => {
      const state = controller.getState();

      expect(state).toMatchObject({
        connected: false,
        lastUpdate: 1000,
        data: {
          deviceName: 'APC40 Controller',
          connectionHealth: CONNECTION_HEALTH.HEALTHY,
          reconnectAttempts: 0,
          isInitialized: false,
          ledCount: 0,
        },
      });

      // Connect and verify state changes
      await controller.connect();
      const connectedState = controller.getState();

      expect(connectedState.connected).toBe(true);
      expect(connectedState.data.deviceName).toBe('APC40 mkII');
      expect(connectedState.data.isInitialized).toBe(true);
    });
  });

  describe('Grid Mapping Integration', () => {
    beforeEach(async () => {
      await controller.connect();
    });

    it('should use correct grid mapping for step events', () => {
      const eventListeners: HardwareEvent[] = [];
      controller.addEventListener('step_toggle', (event) => {
        eventListeners.push(event);
      });

      // Test various grid positions based on actual mapping
      const testCases = [
        { note: 32, expectedStep: 0 },   // Top-left (step 0)
        { note: 33, expectedStep: 8 },   // Top-left, second column (step 8)
        { note: 24, expectedStep: 7 },   // Bottom-left (step 7)
      ];

      const midiCallback = eventCallbacks.get('midimessage');

      testCases.forEach(({ note, expectedStep }, index) => {
        const mockEvent = {
          data: [MIDI_MESSAGE_TYPES.NOTE_ON, note, 100],
        } as WebMIDI.MIDIMessageEvent;

        midiCallback!(mockEvent);

        expect(eventListeners[index]).toMatchObject({
          data: { step: expectedStep },
        });
      });
    });

    it('should ignore notes outside grid range', () => {
      const eventListeners: HardwareEvent[] = [];
      controller.addEventListener('step_toggle', (event) => {
        eventListeners.push(event);
      });

      // Test notes outside valid grid range
      const midiCallback = eventCallbacks.get('midimessage');
      const mockEvent = {
        data: [MIDI_MESSAGE_TYPES.NOTE_ON, 52, 100], // Below grid range
      } as WebMIDI.MIDIMessageEvent;

      midiCallback!(mockEvent);

      expect(eventListeners).toHaveLength(0);
    });
  });
});