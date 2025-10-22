/**
 * Launchpad Pro Controller Implementation
 *
 * Implements HardwareController interface for Novation Launchpad Pro (Mk3 and 2015).
 * Provides bidirectional communication with 8×8 RGB LED grid and velocity-sensitive pads.
 *
 * Reference: Story 8.1
 */

import type {
  HardwareController,
  ControllerCapabilities,
  ConnectionStatus,
  HardwareEvent,
  HardwareEventType,
  SequencerState,
  ControllerState,
} from '../core/types';

import { WebMIDIApiWrapper } from '../utils/webMidiApi';
import {
  MANUFACTURER_ID,
  DEVICE_IDS,
  SYSEX_COMMANDS,
  TIMING,
  MIDI_MESSAGE_TYPES,
  isMk3Device,
  is2015Device,
  isValidGridNote,
  isControlButton,
} from './constants';
import {
  createDefaultGridMapping,
  type GridMapping,
} from './midiMapping';
import {
  toLaunchpadRGB as _toLaunchpadRGB, // Reserved for future velocity mapping
  getTrackColorSpectrum,
  getPlaybackColor,
  type LaunchpadRGB,
} from './ledPatterns';

export type LaunchpadModel = 'mk3' | '2015';

export class LaunchpadProController implements HardwareController {
  // HardwareController interface properties
  public readonly id: string;
  public readonly name: string;
  public connectionStatus: ConnectionStatus = 'disconnected';
  public readonly capabilities: ControllerCapabilities;

  // Launchpad-specific properties
  private deviceModel: LaunchpadModel;
  private midiInput: MIDIInput | null = null;
  private midiOutput: MIDIOutput | null = null;
  private webMidiApi: WebMIDIApiWrapper;
  private gridMapping: GridMapping;
  private ledStates: Map<number, LaunchpadRGB> = new Map();
  private eventListeners: Map<HardwareEventType, Set<(event: HardwareEvent) => void>> = new Map();
  private isInitialized: boolean = false;

  // LED update queue for batching
  private ledUpdateQueue: Array<{ note: number; r: number; g: number; b: number }> = [];
  private ledFlushTimeout: number | null = null;

  constructor(model: LaunchpadModel, deviceId?: string) {
    this.deviceModel = model;
    this.id = deviceId || `launchpad-pro-${model}-${Date.now()}`;
    this.name = model === 'mk3' ? 'Launchpad Pro Mk3' : 'Launchpad Pro (2015)';
    this.webMidiApi = new WebMIDIApiWrapper();
    this.gridMapping = createDefaultGridMapping();

    // Launchpad Pro capabilities
    this.capabilities = {
      hasLEDs: true,
      hasVelocityPads: true,
      hasKnobs: false,
      hasTransportControls: false,
      stepButtonCount: 64, // 8×8 grid
      trackButtonCount: 8, // Using right column scene launch buttons
    };

    this.initializeEventListenerMap();
  }

  /**
   * Initialize event listener storage
   */
  private initializeEventListenerMap(): void {
    this.eventListeners.set('step_toggle', new Set());
    this.eventListeners.set('connection_change', new Set());
    this.eventListeners.set('hardware_input', new Set());
  }

  /**
   * HardwareController Interface: Connect to Launchpad Pro device
   */
  public async connect(): Promise<void> {
    try {
      this.connectionStatus = 'disconnected';

      // Initialize Web MIDI API if needed
      if (!this.webMidiApi.isInitialized()) {
        await this.webMidiApi.initialize();
      }

      // Find Launchpad Pro device
      const device = await this.findLaunchpadDevice();
      if (!device) {
        throw new Error(`Launchpad Pro ${this.deviceModel} device not found`);
      }

      // Detect actual device model from name
      await this.detectDeviceModel(device.name || '');

      // Connect to MIDI input/output
      await this.connectToDevice(device);

      // Initialize device into Programmer Mode
      await this.initializeDevice();

      this.connectionStatus = 'connected';

      this.sendEvent({
        type: 'connection_change',
        data: { connected: true, deviceName: this.name, model: this.deviceModel },
      });

      console.log(`LaunchpadProController: Connected to ${device.name} (${this.deviceModel})`);
    } catch (error) {
      this.connectionStatus = 'error';
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Find connected Launchpad Pro device
   */
  private async findLaunchpadDevice(): Promise<MIDIInput | null> {
    const devices = await this.webMidiApi.enumerateDevices();

    for (const device of devices.inputs) {
      const deviceName = device.name || '';

      // Check if device matches requested model
      if (this.deviceModel === 'mk3' && isMk3Device(deviceName)) {
        return device;
      }
      if (this.deviceModel === '2015' && is2015Device(deviceName)) {
        return device;
      }
    }

    return null;
  }

  /**
   * Detect device model from MIDI device name
   */
  private async detectDeviceModel(deviceName: string): Promise<void> {
    if (isMk3Device(deviceName)) {
      this.deviceModel = 'mk3';
      console.log('LaunchpadProController: Detected Mk3 model');
    } else if (is2015Device(deviceName)) {
      this.deviceModel = '2015';
      console.log('LaunchpadProController: Detected 2015 model');
    } else {
      console.warn(`LaunchpadProController: Could not detect model from "${deviceName}", using ${this.deviceModel}`);
    }
  }

  /**
   * Connect to specific MIDI device
   */
  private async connectToDevice(inputDevice: MIDIInput): Promise<void> {
    // Connect to input
    this.midiInput = inputDevice;
    this.midiInput.addEventListener('midimessage', this.handleMIDIMessage.bind(this));

    // Find corresponding output device
    const devices = await this.webMidiApi.enumerateDevices();
    const outputDevice = devices.outputs.find(output => output.name === inputDevice.name);

    if (outputDevice) {
      this.midiOutput = outputDevice;
    } else {
      console.warn('LaunchpadProController: Output device not found, LED control unavailable');
    }
  }

  /**
   * Initialize Launchpad Pro device with SysEx mode switching
   */
  private async initializeDevice(): Promise<void> {
    if (!this.midiOutput) {
      console.warn('LaunchpadProController: Cannot initialize - no output device');
      return;
    }

    try {
      // Wait for device to be ready
      await new Promise(resolve => setTimeout(resolve, TIMING.INIT_DELAY));

      // Send Enter Programmer Mode SysEx message
      const programmerModeSysEx = this.createProgrammerModeSysEx();
      this.sendMidiMessage(programmerModeSysEx);

      // Wait for device to respond
      await new Promise(resolve => setTimeout(resolve, TIMING.INIT_DELAY));

      // Verify device is ready (MIDI input/output should be available)
      if (!this.midiInput || !this.midiOutput) {
        throw new Error('Device not ready after initialization');
      }

      this.isInitialized = true;
      console.log(`LaunchpadProController: ${this.deviceModel} initialized in Programmer Mode`);
    } catch (error) {
      throw new Error(`Launchpad Pro initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create Enter Programmer Mode SysEx message
   * Format: [0xF0, 0x00, 0x20, 0x29, 0x02, deviceId, 0x0E, 0x01, 0xF7]
   */
  private createProgrammerModeSysEx(): number[] {
    const deviceId = this.deviceModel === 'mk3' ? DEVICE_IDS.MK3 : DEVICE_IDS.LEGACY_2015;

    return [
      0xF0, // SysEx start
      ...MANUFACTURER_ID, // Novation manufacturer ID
      ...deviceId, // Device ID (Mk3 or 2015)
      SYSEX_COMMANDS.PROGRAMMER_MODE, // Programmer mode command
      0x01, // Enter programmer mode (0x00 = exit)
      0xF7, // SysEx end
    ];
  }

  /**
   * HardwareController Interface: Disconnect from device
   */
  public async disconnect(): Promise<void> {
    try {
      // Flush any pending LED updates
      this.flushLEDQueue();

      // Clear LEDs before disconnect
      if (this.isInitialized && this.midiOutput) {
        await this.clearAllLEDs();
      }

      // Disconnect MIDI devices
      if (this.midiInput) {
        this.midiInput.removeEventListener('midimessage', this.handleMIDIMessage.bind(this));
        this.midiInput = null;
      }

      this.midiOutput = null;
      this.connectionStatus = 'disconnected';
      this.isInitialized = false;

      this.sendEvent({
        type: 'connection_change',
        data: { connected: false },
      });

      console.log('LaunchpadProController: Disconnected');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * HardwareController Interface: Handle errors
   */
  public handleError(error: Error): void {
    this.connectionStatus = 'error';

    this.sendEvent({
      type: 'connection_change',
      data: {
        connected: false,
        error: error.message,
        timestamp: performance.now(),
      },
    });

    console.error(`LaunchpadProController: Error - ${error.message}`);
  }

  /**
   * Handle incoming MIDI messages from Launchpad Pro
   */
  private handleMIDIMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 3) return;

    const [status, note, velocity] = Array.from(event.data);

    // Handle Note On messages (button presses)
    if (status === MIDI_MESSAGE_TYPES.NOTE_ON) {
      this.handleNoteOn(note, velocity);
    }
    // Handle Note Off messages (button releases)
    else if (status === MIDI_MESSAGE_TYPES.NOTE_OFF) {
      this.handleNoteOff(note);
    }
    // Handle Polyphonic Aftertouch (Mk3 only)
    else if (status === MIDI_MESSAGE_TYPES.POLY_AFTERTOUCH) {
      this.handleAftertouch(note, velocity);
    }
  }

  /**
   * Handle Note On messages (button press)
   */
  private handleNoteOn(note: number, velocity: number): void {
    // Grid pad press
    if (isValidGridNote(note)) {
      const step = this.gridMapping.noteToStep.get(note);
      if (step !== undefined) {
        this.sendEvent({
          type: 'step_toggle',
          data: {
            step,
            note,
            velocity,
            pressed: true,
          },
        });

        // Also emit generic hardware input event
        this.sendEvent({
          type: 'hardware_input',
          data: {
            inputType: 'pad_press',
            note,
            step,
            velocity,
          },
        });
      }
    }
    // Control button press
    else if (isControlButton(note)) {
      this.sendEvent({
        type: 'hardware_input',
        data: {
          inputType: 'control_button',
          note,
          velocity,
          pressed: true,
        },
      });
    }
  }

  /**
   * Handle Note Off messages (button release)
   */
  private handleNoteOff(note: number): void {
    // Grid pad release
    if (isValidGridNote(note)) {
      const step = this.gridMapping.noteToStep.get(note);
      if (step !== undefined) {
        this.sendEvent({
          type: 'hardware_input',
          data: {
            inputType: 'pad_release',
            note,
            step,
            pressed: false,
          },
        });
      }
    }
    // Control button release
    else if (isControlButton(note)) {
      this.sendEvent({
        type: 'hardware_input',
        data: {
          inputType: 'control_button',
          note,
          pressed: false,
        },
      });
    }
  }

  /**
   * Handle Polyphonic Aftertouch messages (Mk3 only)
   * Launchpad Pro 2015 does not support aftertouch
   */
  private handleAftertouch(note: number, pressure: number): void {
    if (this.deviceModel !== 'mk3') {
      // 2015 model doesn't have aftertouch
      return;
    }

    this.sendEvent({
      type: 'hardware_input',
      data: {
        inputType: 'aftertouch',
        note,
        pressure,
      },
    });
  }

  /**
   * HardwareController Interface: Update sequencer state
   */
  public updateSequencerState(state: SequencerState): void {
    if (!this.isInitialized || !this.midiOutput) return;

    try {
      this.updateGridLEDs(state);
    } catch (error) {
      console.error('LaunchpadProController: Failed to update state:', error);
    }
  }

  /**
   * Update grid LEDs based on sequencer state
   */
  private updateGridLEDs(state: SequencerState): void {
    if (!this.midiOutput) return;

    // Update each step's LED with track color and playback indication
    for (let step = 0; step < 64; step++) {
      const note = this.gridMapping.stepToNote.get(step);
      if (note === undefined) continue;

      // Determine if step is active in any track
      let stepActive = false;
      let activeTrack = -1;

      for (let trackIdx = 0; trackIdx < state.pattern.length; trackIdx++) {
        const track = state.pattern[trackIdx];
        if (track[step]) {
          stepActive = true;
          activeTrack = trackIdx;
          break; // Use first active track for color
        }
      }

      // Get LED color
      let color: LaunchpadRGB;
      const isCurrentStep = state.currentStep === step && state.isPlaying;

      if (isCurrentStep && stepActive) {
        // Playing step: bright white
        color = getPlaybackColor();
      } else if (stepActive) {
        // Active step: track color
        color = getTrackColorSpectrum(activeTrack);
      } else if (isCurrentStep) {
        // Current position but no note: dim white
        color = { r: 16, g: 16, b: 16 };
      } else {
        // Inactive: off
        color = { r: 0, g: 0, b: 0 };
      }

      // Queue LED update if state changed
      const currentLedState = this.ledStates.get(note);
      const colorChanged =
        !currentLedState ||
        currentLedState.r !== color.r ||
        currentLedState.g !== color.g ||
        currentLedState.b !== color.b;

      if (colorChanged) {
        this.setLED(note, color.r, color.g, color.b);
        this.ledStates.set(note, color);
      }
    }
  }

  /**
   * Set LED color using RGB SysEx message
   * Format: [0xF0, 0x00, 0x20, 0x29, 0x02, deviceId, 0x0B, note, R, G, B, 0xF7]
   *
   * @param note MIDI note number (0-119)
   * @param r Red value (0-63)
   * @param g Green value (0-63)
   * @param b Blue value (0-63)
   */
  private setLED(note: number, r: number, g: number, b: number): void {
    if (!this.midiOutput) return;

    // Add to LED update queue for batching
    this.ledUpdateQueue.push({ note, r, g, b });

    // Process queue immediately if it gets too large
    if (this.ledUpdateQueue.length >= TIMING.MAX_BATCH_SIZE) {
      this.flushLEDQueue();
      return;
    }

    // Schedule batched update if not already scheduled
    if (this.ledFlushTimeout === null) {
      this.ledFlushTimeout = window.setTimeout(() => {
        this.flushLEDQueue();
      }, TIMING.LED_FLUSH_INTERVAL);
    }
  }

  /**
   * Flush LED update queue - sends batched RGB SysEx messages
   */
  public flushLEDQueue(): void {
    if (this.ledUpdateQueue.length === 0) return;
    if (!this.midiOutput) return;

    // Create batched RGB SysEx message
    // Format: [0xF0, 0x00, 0x20, 0x29, 0x02, deviceId, 0x0B, note1, R, G, B, note2, R, G, B, ..., 0xF7]
    const deviceId = this.deviceModel === 'mk3' ? DEVICE_IDS.MK3 : DEVICE_IDS.LEGACY_2015;
    const batch: number[] = [
      0xF0, // SysEx start
      ...MANUFACTURER_ID,
      ...deviceId,
      SYSEX_COMMANDS.RGB_LED, // RGB LED command
    ];

    // Add each LED update to batch (note, R, G, B)
    for (const led of this.ledUpdateQueue) {
      batch.push(led.note, led.r, led.g, led.b);
    }

    batch.push(0xF7); // SysEx end

    // Send batched update
    this.sendMidiMessage(batch);

    // Clear queue and timeout
    this.ledUpdateQueue = [];
    if (this.ledFlushTimeout !== null) {
      clearTimeout(this.ledFlushTimeout);
      this.ledFlushTimeout = null;
    }
  }

  /**
   * Clear all LEDs
   */
  private async clearAllLEDs(): Promise<void> {
    if (!this.midiOutput) return;

    // Queue all grid LEDs to off (notes 0-119)
    for (let note = 0; note <= 119; note++) {
      this.ledUpdateQueue.push({ note, r: 0, g: 0, b: 0 });
      this.ledStates.set(note, { r: 0, g: 0, b: 0 });
    }

    // Flush immediately
    this.flushLEDQueue();
  }

  /**
   * HardwareController Interface: Add event listener
   */
  public addEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * HardwareController Interface: Remove event listener
   */
  public removeEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * HardwareController Interface: Send event
   */
  public sendEvent(event: Omit<HardwareEvent, 'controllerId' | 'timestamp'>): void {
    const fullEvent: HardwareEvent = {
      ...event,
      controllerId: this.id,
      timestamp: performance.now(),
    };

    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(fullEvent);
        } catch (error) {
          console.error('LaunchpadProController: Event listener error:', error);
        }
      });
    }
  }

  /**
   * HardwareController Interface: Get controller state
   */
  public getState(): ControllerState {
    return {
      connected: this.connectionStatus === 'connected',
      lastUpdate: performance.now(),
      data: {
        deviceName: this.name,
        deviceModel: this.deviceModel,
        isInitialized: this.isInitialized,
        ledCount: this.ledStates.size,
        ledQueueSize: this.ledUpdateQueue.length,
      },
    };
  }

  /**
   * Send MIDI message to device
   * Supports both SysEx and Note On messages
   */
  private sendMidiMessage(data: number[]): void {
    if (!this.midiOutput) return;

    try {
      this.midiOutput.send(data);
    } catch (error) {
      console.error('LaunchpadProController: MIDI send failed:', error);
      this.handleError(new Error(`MIDI send failed: ${(error as Error).message}`));
    }
  }
}
