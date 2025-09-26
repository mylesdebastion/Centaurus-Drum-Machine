/**
 * APC40 Controller Implementation
 * 
 * Implements the HardwareController interface for Akai APC40 MIDI controllers.
 * Provides bidirectional communication between APC40 hardware and drum sequencer.
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
  APC40_DEVICE_INFO,
  APC40_TIMING,
  APC40_ERROR_CODES,
  createModeSwitch,
  createLedControl,
  isAPC40Device,
  isValidGridNote,
  calculateConnectionHealth,
  CONNECTION_HEALTH,
  MIDI_MESSAGE_TYPES,
} from './constants';
import {
  apc40ErrorRecovery,
  getAPC40ErrorCode,
  createAPC40ErrorContext,
} from './errorRecovery';
import {
  defaultGridMapping,
  stepStateToLedColor,
  velocityToIntensity,
  APC40_TRANSPORT,
  type GridMapping,
} from './midiMapping';
import {
  getFinalLEDState,
  LEDAnimationController,
  type LEDState,
} from './ledPatterns';
import {
  LEDTimingSync,
  type TimingSyncConfig,
  type SequencerSyncState,
  type LEDUpdateEvent,
} from './timingSync';

export class APC40Controller implements HardwareController {
  // HardwareController interface properties
  public readonly id: string;
  public readonly name: string;
  public connectionStatus: ConnectionStatus = 'disconnected';
  public readonly capabilities: ControllerCapabilities;

  // APC40-specific properties
  private midiInput: WebMIDI.MIDIInput | null = null;
  private midiOutput: WebMIDI.MIDIOutput | null = null;
  private webMidiApi: WebMIDIApiWrapper;
  private gridMapping: GridMapping;
  private ledStates: Map<number, number> = new Map();
  private eventListeners: Map<HardwareEventType, Set<(event: HardwareEvent) => void>> = new Map();
  private connectionHealth: number = CONNECTION_HEALTH.HEALTHY;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: number | null = null;
  private reconnectAttempts: number = 0;
  private isInitialized: boolean = false;

  // LED Pattern System properties
  private ledAnimationController: LEDAnimationController;
  private ledTimingSync: LEDTimingSync;
  private currentPlaybackPosition: number = -1;
  private isToneJsSyncEnabled: boolean = false;
  private ledUpdateTiming: {
    lastUpdate: number;
    averageLatency: number;
    updateCount: number;
    totalLatency: number;
  } = {
    lastUpdate: 0,
    averageLatency: 0,
    updateCount: 0,
    totalLatency: 0,
  };

  // LED Update Batching System
  private ledUpdateQueue: Map<number, number> = new Map();
  private ledBatchTimeout: number | null = null;
  private readonly LED_BATCH_DELAY = 10; // 10ms batch delay
  private readonly MAX_BATCH_SIZE = 16; // Maximum LEDs per batch

  constructor(deviceId?: string) {
    this.id = deviceId || `apc40-${Date.now()}`;
    this.name = 'APC40 Controller';
    this.webMidiApi = new WebMIDIApiWrapper();
    this.gridMapping = defaultGridMapping;

    // Initialize LED animation controller
    this.ledAnimationController = new LEDAnimationController();

    // Initialize Tone.js timing synchronization
    this.ledTimingSync = new LEDTimingSync(this, {
      lookaheadTime: 25, // 25ms lookahead for smooth LED transitions
      updateInterval: '16n', // Update on 16th notes for smooth playback indication
      maxLatency: 50, // 50ms max latency warning
      enableLookahead: true,
    });

    // Subscribe to timing sync LED updates
    this.ledTimingSync.onLEDUpdate(this.handleTimingSyncUpdate.bind(this));
    
    // APC40 capabilities
    this.capabilities = {
      hasLEDs: true,
      hasVelocityPads: true,
      hasKnobs: true,
      hasTransportControls: true,
      stepButtonCount: 16, // Using 2 columns of 8x5 grid
      trackButtonCount: 8,
    };

    this.initializeEventListenerMap();
    this.setupErrorRecoveryListeners();
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
   * HardwareController Interface: Connect to APC40 device
   */
  public async connect(): Promise<void> {
    try {
      this.connectionStatus = 'disconnected';
      
      // Initialize Web MIDI API if needed
      if (!this.webMidiApi.isInitialized()) {
        await this.webMidiApi.initialize();
      }

      // Find APC40 device
      const device = await this.findAPC40Device();
      if (!device) {
        throw new Error('APC40 device not found');
      }

      // Connect to MIDI input/output
      await this.connectToDevice(device);
      
      // Initialize APC40 with SysEx mode switching
      await this.initializeDevice();
      
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      this.sendEvent({
        type: 'connection_change',
        data: { connected: true, deviceName: this.name },
      });

      console.log(`APC40Controller: Connected to ${device.name}`);
      
    } catch (error) {
      this.connectionStatus = 'error';
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Find connected APC40 device
   */
  private async findAPC40Device(): Promise<WebMIDI.MIDIInput | null> {
    const devices = await this.webMidiApi.enumerateDevices();
    
    for (const device of devices.inputs) {
      if (isAPC40Device(device.name || '')) {
        return device;
      }
    }
    
    return null;
  }

  /**
   * Connect to specific MIDI device
   */
  private async connectToDevice(inputDevice: WebMIDI.MIDIInput): Promise<void> {
    // Connect to input
    this.midiInput = inputDevice;
    this.midiInput.addEventListener('midimessage', this.handleMIDIMessage.bind(this));
    
    // Find corresponding output device
    const devices = await this.webMidiApi.enumerateDevices();
    const outputDevice = devices.outputs.find(output => 
      output.name === inputDevice.name
    );
    
    if (outputDevice) {
      this.midiOutput = outputDevice;
    } else {
      console.warn('APC40Controller: Output device not found, LED control unavailable');
    }
    
    this.name = inputDevice.name || 'APC40 Controller';
  }

  /**
   * Initialize APC40 device with SysEx mode switching
   */
  private async initializeDevice(): Promise<void> {
    if (!this.midiOutput) {
      console.warn('APC40Controller: Cannot initialize - no output device');
      return;
    }

    try {
      // Wait for device to be ready
      await new Promise(resolve => setTimeout(resolve, APC40_TIMING.INITIALIZATION_DELAY));
      
      // Switch to Ableton Live mode for LED control
      const modeSwitch = createModeSwitch();
      this.sendMidiMessage(modeSwitch);
      
      // Clear all LEDs
      await this.clearAllLEDs();
      
      this.isInitialized = true;
      console.log('APC40Controller: Device initialized in Ableton Live mode');
      
    } catch (error) {
      throw new Error(`APC40 initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * HardwareController Interface: Disconnect from device
   */
  public async disconnect(): Promise<void> {
    try {
      this.stopHeartbeat();

      // Stop LED animations and timing sync
      if (this.ledAnimationController.isRunning()) {
        this.ledAnimationController.stop();
      }

      if (this.isToneJsSyncEnabled) {
        this.disableToneJsSync();
      }

      // Process any pending LED updates and clear queue
      this.processBatchedLEDUpdates();

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

      // Clear error recovery state
      apc40ErrorRecovery.clearRecoveryState(this.id);

      this.sendEvent({
        type: 'connection_change',
        data: { connected: false },
      });

      console.log('APC40Controller: Disconnected');

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * HardwareController Interface: Handle errors
   */
  public handleError(error: Error): void {
    this.connectionStatus = 'error';
    this.connectionHealth = CONNECTION_HEALTH.CRITICAL;
    
    // Use APC40 error recovery system
    const errorCode = getAPC40ErrorCode(error.message);
    const context = createAPC40ErrorContext(this.id, this.name, {
      lastHeartbeat: this.lastHeartbeat,
      reconnectAttempts: this.reconnectAttempts,
      connectionHealth: this.connectionHealth,
      operation: 'error_handling',
    });

    const hardwareError = apc40ErrorRecovery.handleAPC40Error(error, errorCode, context);
    
    this.sendEvent({
      type: 'connection_change',
      data: { 
        connected: false,
        error: error.message,
        errorCode: hardwareError.code,
        timestamp: hardwareError.timestamp,
      },
    });

    // Attempt reconnection if not at max attempts
    if (this.reconnectAttempts < APC40_TIMING.MAX_RECONNECT_ATTEMPTS) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule automatic reconnection
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    setTimeout(async () => {
      try {
        console.log(`APC40Controller: Reconnection attempt ${this.reconnectAttempts}`);
        await this.connect();
      } catch (error) {
        console.error(`APC40Controller: Reconnection failed: ${(error as Error).message}`);
      }
    }, APC40_TIMING.RECONNECT_DELAY * this.reconnectAttempts);
  }

  /**
   * Handle incoming MIDI messages from APC40
   */
  private handleMIDIMessage(event: WebMIDI.MIDIMessageEvent): void {
    const [status, note, velocity] = event.data;
    this.lastHeartbeat = performance.now();
    
    // Handle Note On/Off messages (button presses)
    if (status === MIDI_MESSAGE_TYPES.NOTE_ON || status === MIDI_MESSAGE_TYPES.NOTE_OFF) {
      this.handleNoteMessage(note, velocity, status === MIDI_MESSAGE_TYPES.NOTE_ON);
    }
    // Handle Control Change messages
    else if (status === MIDI_MESSAGE_TYPES.CONTROL_CHANGE) {
      this.handleControlChange(note, velocity);
    }
  }

  /**
   * Handle note on/off messages (button presses)
   */
  private handleNoteMessage(note: number, velocity: number, isNoteOn: boolean): void {
    // Check if this is a grid button
    if (isValidGridNote(note)) {
      const step = this.gridMapping.noteToStep.get(note);
      if (step !== undefined && isNoteOn) {
        const intensity = velocityToIntensity(velocity);
        
        this.sendEvent({
          type: 'step_toggle',
          data: {
            step,
            velocity,
            intensity,
            note,
          },
        });
      }
    }
    // Check if this is a transport control
    else if (Object.values(APC40_TRANSPORT).includes(note)) {
      this.handleTransportControl(note, isNoteOn);
    }
  }

  /**
   * Handle transport control buttons
   */
  private handleTransportControl(note: number, isPressed: boolean): void {
    if (!isPressed) return;
    
    let command = '';
    
    switch (note) {
      case APC40_TRANSPORT.PLAY:
        command = 'play';
        break;
      case APC40_TRANSPORT.STOP:
        command = 'stop';
        break;
      case APC40_TRANSPORT.REC:
        command = 'record';
        break;
    }
    
    if (command) {
      this.sendEvent({
        type: 'hardware_input',
        data: { command, transport: true },
      });
    }
  }

  /**
   * Handle control change messages (knobs, faders)
   */
  private handleControlChange(ccNumber: number, value: number): void {
    this.sendEvent({
      type: 'hardware_input',
      data: {
        controlChange: true,
        ccNumber,
        value,
      },
    });
  }

  /**
   * HardwareController Interface: Update sequencer state
   */
  public updateSequencerState(state: SequencerState): void {
    if (!this.isInitialized || !this.midiOutput) return;

    try {
      // Update LED states for current pattern
      this.updateGridLEDs(state);

      // Update Tone.js sync if enabled
      if (this.isToneJsSyncEnabled) {
        const syncState: SequencerSyncState = {
          isPlaying: state.isPlaying || false,
          currentStep: state.currentStep || 0,
          bpm: state.bpm || 120,
          pattern: state.pattern || [],
          totalSteps: 16,
        };

        this.ledTimingSync.updateSequencerState(syncState);
      }

    } catch (error) {
      console.error('APC40Controller: Failed to update LEDs:', error);
    }
  }

  /**
   * Enable Tone.js synchronization for LED updates
   */
  public enableToneJsSync(sequencerState: SequencerSyncState): void {
    if (this.isToneJsSyncEnabled) {
      console.warn('APC40Controller: Tone.js sync already enabled');
      return;
    }

    try {
      this.ledTimingSync.startSync(sequencerState);
      this.isToneJsSyncEnabled = true;
      console.log('APC40Controller: Tone.js LED synchronization enabled');
    } catch (error) {
      console.error('APC40Controller: Failed to enable Tone.js sync:', error);
    }
  }

  /**
   * Disable Tone.js synchronization for LED updates
   */
  public disableToneJsSync(): void {
    if (!this.isToneJsSyncEnabled) return;

    try {
      this.ledTimingSync.stopSync();
      this.isToneJsSyncEnabled = false;
      console.log('APC40Controller: Tone.js LED synchronization disabled');
    } catch (error) {
      console.error('APC40Controller: Failed to disable Tone.js sync:', error);
    }
  }

  /**
   * Handle LED updates from timing synchronization
   */
  private handleTimingSyncUpdate(event: LEDUpdateEvent): void {
    try {
      // Update current playback position
      this.currentPlaybackPosition = event.stepIndex;

      // Send hardware event for external components
      this.sendEvent({
        type: 'hardware_input',
        data: {
          timingSync: true,
          eventType: event.type,
          currentStep: event.stepIndex,
          bpm: event.bpm,
          timestamp: event.timestamp,
          lookaheadSteps: event.lookaheadSteps,
        },
      });

      // Log timing sync events in development mode
      if (process.env.NODE_ENV === 'development') {
        const latency = performance.now() - event.timestamp;
        if (latency > 10) { // Log if latency > 10ms
          console.log(`APC40Controller: Timing sync latency: ${latency.toFixed(2)}ms`);
        }
      }

    } catch (error) {
      console.error('APC40Controller: Error handling timing sync update:', error);
    }
  }

  /**
   * Update grid LEDs based on sequencer state with velocity and playback position
   */
  private updateGridLEDs(state: SequencerState): void {
    if (!this.midiOutput) return;

    const startTime = performance.now();
    let updatedLEDs = 0;

    // Track playback position changes
    if (this.currentPlaybackPosition !== state.currentStep) {
      this.currentPlaybackPosition = state.currentStep;
    }

    // Update each step's LED with velocity-based intensity and playback indication
    for (let step = 0; step < 16; step++) {
      const note = this.gridMapping.stepToNote.get(step);
      if (note === undefined) continue;

      // Determine step state with velocity information
      let stepActive = false;
      let velocity = 100; // Default velocity

      // Check if step is active in any track and get velocity
      for (const track of state.pattern) {
        if (track[step]) {
          stepActive = true;
          // Get velocity from track data if available
          if (typeof track[step] === 'object' && 'velocity' in track[step]) {
            velocity = (track[step] as { velocity: number }).velocity;
          }
          break; // Use first active track's velocity
        }
      }

      const isPlaying = state.currentStep === step && state.isPlaying;

      // Get LED state using new pattern system
      const ledState = getFinalLEDState(
        stepActive,
        isPlaying,
        velocity,
        step,
        state.currentStep || -1,
        1 // lookahead steps
      );

      // Convert LED state to APC40 color value
      const ledColor = this.ledStateToAPC40Color(ledState);

      // Only update LED if state changed
      const currentLedState = this.ledStates.get(note);
      if (currentLedState !== ledColor) {
        this.queueLEDUpdate(note, ledColor);
        this.ledStates.set(note, ledColor);
        updatedLEDs++;
      }
    }

    // Track performance metrics
    this.recordLEDUpdateTiming(performance.now() - startTime, updatedLEDs);
  }

  /**
   * Convert LED state to APC40 color value
   */
  private ledStateToAPC40Color(ledState: LEDState): number {
    // Map our LED colors to APC40 values
    return ledState.color;
  }

  /**
   * Queue LED update for efficient batching
   */
  private queueLEDUpdate(note: number, color: number): void {
    if (!this.midiOutput) return;

    // Add to update queue
    this.ledUpdateQueue.set(note, color);

    // Process queue immediately if it gets too large
    if (this.ledUpdateQueue.size >= this.MAX_BATCH_SIZE) {
      this.processBatchedLEDUpdates();
      return;
    }

    // Schedule batched update if not already scheduled
    if (this.ledBatchTimeout === null) {
      this.ledBatchTimeout = window.setTimeout(() => {
        this.processBatchedLEDUpdates();
      }, this.LED_BATCH_DELAY);
    }
  }

  /**
   * Process queued LED updates in batches
   */
  private processBatchedLEDUpdates(): void {
    if (this.ledUpdateQueue.size === 0) return;

    const batchStartTime = performance.now();

    // Process all queued LED updates using MIDI Note On
    for (const [note, color] of this.ledUpdateQueue) {
      const ledCommand = createLedControl(note, color);
      this.sendMidiMessage(ledCommand);
    }

    const batchSize = this.ledUpdateQueue.size;

    // Clear the queue and timeout
    this.ledUpdateQueue.clear();
    if (this.ledBatchTimeout !== null) {
      clearTimeout(this.ledBatchTimeout);
      this.ledBatchTimeout = null;
    }

    // Track batch performance
    const batchDuration = performance.now() - batchStartTime;
    if (process.env.NODE_ENV === 'development' && batchDuration > 5) {
      console.log(`APC40Controller: LED batch processed: ${batchSize} LEDs in ${batchDuration.toFixed(2)}ms`);
    }
  }

  /**
   * Update single LED with intensity consideration (legacy method)
   */
  private updateLEDWithIntensity(note: number, color: number, intensity: number): void {
    // Use the new batched update system
    this.queueLEDUpdate(note, color);
  }

  /**
   * Record LED update performance metrics
   */
  private recordLEDUpdateTiming(duration: number, updatedCount: number): void {
    this.ledUpdateTiming.lastUpdate = performance.now();
    this.ledUpdateTiming.updateCount++;
    this.ledUpdateTiming.totalLatency += duration;
    this.ledUpdateTiming.averageLatency =
      this.ledUpdateTiming.totalLatency / this.ledUpdateTiming.updateCount;

    // Log performance warning if update takes too long
    if (duration > 50) { // 50ms threshold
      console.warn(`APC40Controller: LED update took ${duration.toFixed(2)}ms (${updatedCount} LEDs)`);
    }

    // Reset counters periodically to prevent overflow
    if (this.ledUpdateTiming.updateCount > 1000) {
      this.ledUpdateTiming.updateCount = 100;
      this.ledUpdateTiming.totalLatency = this.ledUpdateTiming.averageLatency * 100;
    }
  }

  /**
   * Update a single LED using MIDI Note On
   */
  private updateLED(note: number, color: number): void {
    if (!this.midiOutput) return;

    const ledCommand = createLedControl(note, color);
    this.sendMidiMessage(ledCommand);
  }

  /**
   * Clear all LEDs using batched updates
   */
  private async clearAllLEDs(): Promise<void> {
    if (!this.midiOutput) return;

    // Queue all LED clear operations (APC40 clip grid: 0-39)
    for (let note = 0; note <= 39; note++) {
      this.queueLEDUpdate(note, 0); // 0 = off
      this.ledStates.set(note, 0);
    }

    // Process the batch immediately for disconnect
    this.processBatchedLEDUpdates();
  }

  /**
   * Send MIDI message to device (supports both SysEx and Note On messages)
   */
  private sendMidiMessage(data: number[]): void {
    if (!this.midiOutput) return;

    try {
      this.midiOutput.send(data);
    } catch (error) {
      console.error('APC40Controller: MIDI send failed:', error);
    }
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
          console.error('APC40Controller: Event listener error:', error);
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
      lastUpdate: this.lastHeartbeat,
      data: {
        deviceName: this.name,
        connectionHealth: this.connectionHealth,
        reconnectAttempts: this.reconnectAttempts,
        isInitialized: this.isInitialized,
        ledCount: this.ledStates.size,
        ledUpdateTiming: {
          ...this.ledUpdateTiming,
          averageLatency: Math.round(this.ledUpdateTiming.averageLatency * 100) / 100,
        },
        playbackPosition: this.currentPlaybackPosition,
        ledAnimationRunning: this.ledAnimationController.isRunning(),
        toneJsSyncEnabled: this.isToneJsSyncEnabled,
        timingSyncMetrics: this.ledTimingSync.getSyncMetrics(),
        ledBatchingEnabled: true,
        ledBatchQueueSize: this.ledUpdateQueue.size,
        ledBatchDelay: this.LED_BATCH_DELAY,
        maxBatchSize: this.MAX_BATCH_SIZE,
      },
    };
  }

  /**
   * Get LED performance metrics for debugging
   */
  public getLEDPerformanceMetrics(): {
    averageLatency: number;
    updateCount: number;
    lastUpdate: number;
    isAnimationRunning: boolean;
  } {
    return {
      averageLatency: this.ledUpdateTiming.averageLatency,
      updateCount: this.ledUpdateTiming.updateCount,
      lastUpdate: this.ledUpdateTiming.lastUpdate,
      isAnimationRunning: this.ledAnimationController.isRunning(),
    };
  }

  /**
   * Reset LED performance metrics
   */
  public resetLEDMetrics(): void {
    this.ledUpdateTiming = {
      lastUpdate: 0,
      averageLatency: 0,
      updateCount: 0,
      totalLatency: 0,
    };
    console.log('APC40Controller: LED performance metrics reset');
  }

  /**
   * Force immediate processing of batched LED updates
   * Useful for urgent updates or when immediate feedback is required
   */
  public flushLEDUpdates(): void {
    this.processBatchedLEDUpdates();
  }

  /**
   * Get current LED batching performance info
   */
  public getLEDBatchingInfo(): {
    queueSize: number;
    batchDelay: number;
    maxBatchSize: number;
    hasPendingUpdates: boolean;
  } {
    return {
      queueSize: this.ledUpdateQueue.size,
      batchDelay: this.LED_BATCH_DELAY,
      maxBatchSize: this.MAX_BATCH_SIZE,
      hasPendingUpdates: this.ledBatchTimeout !== null,
    };
  }

  /**
   * Start connection health monitoring
   */
  private startHeartbeat(): void {
    this.lastHeartbeat = performance.now();
    
    this.heartbeatInterval = window.setInterval(() => {
      const now = performance.now();
      const timeSinceLastMessage = now - this.lastHeartbeat;
      
      if (timeSinceLastMessage > APC40_TIMING.HEARTBEAT_INTERVAL) {
        const previousHealth = this.connectionHealth;
        this.connectionHealth = calculateConnectionHealth(timeSinceLastMessage, 1);
        
        // Handle connection health degradation
        if (this.connectionHealth !== previousHealth) {
          const context = createAPC40ErrorContext(this.id, this.name, {
            lastHeartbeat: this.lastHeartbeat,
            reconnectAttempts: this.reconnectAttempts,
            connectionHealth: this.connectionHealth,
            operation: 'heartbeat_monitoring',
          });

          apc40ErrorRecovery.handleConnectionHealthDegradation(this.connectionHealth, context);
        }
        
        if (this.connectionHealth <= CONNECTION_HEALTH.CRITICAL) {
          this.handleError(new Error('Heartbeat timeout - device may be disconnected'));
        }
      }
    }, APC40_TIMING.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop connection health monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get error code for error message
   */
  private getErrorCode(errorMessage: string): string {
    if (errorMessage.includes('not found')) return APC40_ERROR_CODES.DEVICE_NOT_FOUND;
    if (errorMessage.includes('connection')) return APC40_ERROR_CODES.CONNECTION_FAILED;
    if (errorMessage.includes('initialization')) return APC40_ERROR_CODES.INITIALIZATION_FAILED;
    if (errorMessage.includes('SysEx')) return APC40_ERROR_CODES.SYSEX_FAILED;
    if (errorMessage.includes('LED')) return APC40_ERROR_CODES.LED_UPDATE_FAILED;
    if (errorMessage.includes('heartbeat')) return APC40_ERROR_CODES.HEARTBEAT_TIMEOUT;
    return 'UNKNOWN_ERROR';
  }

  /**
   * Setup error recovery event listeners
   */
  private setupErrorRecoveryListeners(): void {
    // Listen for recovery events from the error recovery system
    if (typeof window !== 'undefined') {
      window.addEventListener(`apc40-recovery-retry_requested`, (event: any) => {
        if (event.detail?.controllerId === this.id) {
          console.log('APC40Controller: Recovery retry requested');
          // Implement retry logic here if needed
        }
      });

      window.addEventListener(`apc40-recovery-reconnect_requested`, (event: any) => {
        if (event.detail?.controllerId === this.id) {
          console.log('APC40Controller: Recovery reconnection requested');
          setTimeout(() => {
            this.scheduleReconnect();
          }, event.detail?.delay || 0);
        }
      });

      window.addEventListener(`apc40-recovery-reset_requested`, (event: any) => {
        if (event.detail?.controllerId === this.id) {
          console.log('APC40Controller: Recovery reset requested');
          // Reset connection state
          this.reconnectAttempts = 0;
          this.connectionHealth = CONNECTION_HEALTH.HEALTHY;
          apc40ErrorRecovery.clearRecoveryState(this.id);
        }
      });

      window.addEventListener(`apc40-recovery-user_notification`, (event: any) => {
        if (event.detail?.controllerId === this.id) {
          console.log('APC40Controller: User notification:', event.detail?.message);
          // Send user notification event
          this.sendEvent({
            type: 'connection_change',
            data: {
              connected: this.connectionStatus === 'connected',
              notification: event.detail?.message,
            },
          });
        }
      });
    }
  }
}