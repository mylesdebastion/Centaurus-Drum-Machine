/**
 * Tone.js Integration and LED Timing Synchronization
 *
 * Provides LED update synchronization with Tone.js Transport system
 * for real-time visual feedback during audio playback.
 */

import * as Tone from 'tone';
import type { APC40Controller } from './APC40Controller';

export interface TimingSyncConfig {
  lookaheadTime: number; // milliseconds
  updateInterval: string; // Tone.js time notation (e.g., "16n", "8n")
  maxLatency: number; // milliseconds
  enableLookahead: boolean;
}

export interface SequencerSyncState {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  pattern: boolean[][];
  totalSteps: number;
  startTime?: number;
}

export interface LEDUpdateEvent {
  type: 'step_change' | 'transport_start' | 'transport_stop' | 'transport_pause';
  stepIndex: number;
  timestamp: number;
  lookaheadSteps?: number[];
  bpm: number;
}

/**
 * LED Timing Synchronization Controller
 * Bridges Tone.js Transport timing with APC40 LED updates
 */
export class LEDTimingSync {
  // private _controller: APC40Controller; // May be used for future features
  private config: TimingSyncConfig;
  private isActive: boolean = false;
  private currentScheduleId: number | null = null;
  private syncState: SequencerSyncState = {
    isPlaying: false,
    currentStep: 0,
    bpm: 120,
    pattern: [],
    totalSteps: 16,
  };

  // Performance tracking
  private syncMetrics: {
    updateCount: number;
    averageLatency: number;
    totalLatency: number;
    maxLatency: number;
    syncErrors: number;
    lastUpdate: number;
  } = {
    updateCount: 0,
    averageLatency: 0,
    totalLatency: 0,
    maxLatency: 0,
    syncErrors: 0,
    lastUpdate: 0,
  };

  // LED update callbacks
  private updateCallbacks: Set<(event: LEDUpdateEvent) => void> = new Set();

  constructor(_controller: APC40Controller, config?: Partial<TimingSyncConfig>) {
    // this._controller = controller; // May be used for future features
    this.config = {
      lookaheadTime: 25, // 25ms lookahead
      updateInterval: '16n', // 16th note updates
      maxLatency: 50, // 50ms max latency warning
      enableLookahead: true,
      ...config,
    };

    // Subscribe to Transport events
    this.setupTransportListeners();
  }

  /**
   * Start LED timing synchronization with Tone.js Transport
   */
  public startSync(sequencerState: SequencerSyncState): void {
    if (this.isActive) {
      console.warn('LEDTimingSync: Already active, stopping previous sync');
      this.stopSync();
    }

    this.syncState = { ...sequencerState };
    this.isActive = true;

    // Schedule LED updates synchronized with audio
    this.currentScheduleId = Tone.Transport.scheduleRepeat((time) => {
      this.handleTransportStep(time);
    }, this.config.updateInterval, 0) as number;

    // Send initial LED update
    this.sendLEDUpdateEvent({
      type: 'transport_start',
      stepIndex: this.syncState.currentStep,
      timestamp: performance.now(),
      bpm: this.syncState.bpm,
    });

    console.log('LEDTimingSync: Started with config:', this.config);
  }

  /**
   * Stop LED timing synchronization
   */
  public stopSync(): void {
    if (!this.isActive) return;

    if (this.currentScheduleId !== null) {
      Tone.Transport.cancel(this.currentScheduleId);
      this.currentScheduleId = null;
    }

    this.isActive = false;

    // Send stop event
    this.sendLEDUpdateEvent({
      type: 'transport_stop',
      stepIndex: this.syncState.currentStep,
      timestamp: performance.now(),
      bpm: this.syncState.bpm,
    });

    console.log('LEDTimingSync: Stopped');
  }

  /**
   * Update sequencer state without restarting sync
   */
  public updateSequencerState(newState: Partial<SequencerSyncState>): void {
    const previousStep = this.syncState.currentStep;
    this.syncState = { ...this.syncState, ...newState };

    // If step changed, trigger immediate LED update
    if (newState.currentStep !== undefined && newState.currentStep !== previousStep) {
      this.sendLEDUpdateEvent({
        type: 'step_change',
        stepIndex: this.syncState.currentStep,
        timestamp: performance.now(),
        bpm: this.syncState.bpm,
        lookaheadSteps: this.config.enableLookahead ? this.calculateLookaheadSteps() : undefined,
      });
    }

    // Update BPM if changed
    if (newState.bpm !== undefined && newState.bpm !== this.syncState.bpm) {
      Tone.Transport.bpm.value = newState.bpm;
    }
  }

  /**
   * Add callback for LED update events
   */
  public onLEDUpdate(callback: (event: LEDUpdateEvent) => void): () => void {
    this.updateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Get current synchronization metrics
   */
  public getSyncMetrics(): typeof this.syncMetrics {
    return { ...this.syncMetrics };
  }

  /**
   * Reset sync performance metrics
   */
  public resetMetrics(): void {
    this.syncMetrics = {
      updateCount: 0,
      averageLatency: 0,
      totalLatency: 0,
      maxLatency: 0,
      syncErrors: 0,
      lastUpdate: 0,
    };
    console.log('LEDTimingSync: Metrics reset');
  }

  /**
   * Handle Transport step events (called by Tone.js scheduler)
   */
  private handleTransportStep(time: number): void {
    const scheduleTime = time * 1000; // Convert to milliseconds
    const currentTime = performance.now();
    const actualTime = currentTime + ((scheduleTime - Tone.now() * 1000));

    try {
      // Calculate lookahead steps if enabled
      const lookaheadSteps = this.config.enableLookahead ? this.calculateLookaheadSteps() : undefined;

      // Advance step position
      this.syncState.currentStep = (this.syncState.currentStep + 1) % this.syncState.totalSteps;

      // Send LED update event
      this.sendLEDUpdateEvent({
        type: 'step_change',
        stepIndex: this.syncState.currentStep,
        timestamp: actualTime,
        bpm: this.syncState.bpm,
        lookaheadSteps,
      });

      // Track performance metrics
      this.trackSyncPerformance(actualTime, currentTime);

    } catch (error) {
      this.syncMetrics.syncErrors++;
      console.error('LEDTimingSync: Error in transport step:', error);
    }
  }

  /**
   * Setup Transport event listeners
   */
  private setupTransportListeners(): void {
    // Handle transport state changes
    Tone.Transport.on('start', () => {
      if (this.isActive) {
        this.syncState.isPlaying = true;
        this.syncState.startTime = performance.now();

        this.sendLEDUpdateEvent({
          type: 'transport_start',
          stepIndex: this.syncState.currentStep,
          timestamp: performance.now(),
          bpm: this.syncState.bpm,
        });
      }
    });

    Tone.Transport.on('stop', () => {
      if (this.isActive) {
        this.syncState.isPlaying = false;

        this.sendLEDUpdateEvent({
          type: 'transport_stop',
          stepIndex: this.syncState.currentStep,
          timestamp: performance.now(),
          bpm: this.syncState.bpm,
        });
      }
    });

    Tone.Transport.on('pause', () => {
      if (this.isActive) {
        this.syncState.isPlaying = false;

        this.sendLEDUpdateEvent({
          type: 'transport_pause',
          stepIndex: this.syncState.currentStep,
          timestamp: performance.now(),
          bpm: this.syncState.bpm,
        });
      }
    });
  }

  /**
   * Calculate lookahead steps for smooth LED transitions
   */
  private calculateLookaheadSteps(): number[] {
    const lookaheadSteps: number[] = [];
    const stepsToLook = Math.ceil(this.config.lookaheadTime / (60000 / this.syncState.bpm / 4)); // Convert lookahead time to steps

    for (let i = 1; i <= stepsToLook; i++) {
      const futureStep = (this.syncState.currentStep + i) % this.syncState.totalSteps;
      lookaheadSteps.push(futureStep);
    }

    return lookaheadSteps;
  }

  /**
   * Send LED update event to all subscribers
   */
  private sendLEDUpdateEvent(event: LEDUpdateEvent): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('LEDTimingSync: Error in update callback:', error);
      }
    });
  }

  /**
   * Track synchronization performance metrics
   */
  private trackSyncPerformance(scheduledTime: number, actualTime: number): void {
    const latency = Math.abs(actualTime - scheduledTime);

    this.syncMetrics.updateCount++;
    this.syncMetrics.totalLatency += latency;
    this.syncMetrics.averageLatency = this.syncMetrics.totalLatency / this.syncMetrics.updateCount;
    this.syncMetrics.maxLatency = Math.max(this.syncMetrics.maxLatency, latency);
    this.syncMetrics.lastUpdate = actualTime;

    // Log performance warnings
    if (latency > this.config.maxLatency) {
      console.warn(`LEDTimingSync: High latency detected: ${latency.toFixed(2)}ms`);
    }

    // Reset counters periodically to prevent overflow
    if (this.syncMetrics.updateCount > 1000) {
      this.syncMetrics.updateCount = 100;
      this.syncMetrics.totalLatency = this.syncMetrics.averageLatency * 100;
    }
  }

  /**
   * Check if synchronization is currently active
   */
  public isSync(): boolean {
    return this.isActive;
  }

  /**
   * Get current synchronization configuration
   */
  public getConfig(): TimingSyncConfig {
    return { ...this.config };
  }

  /**
   * Update synchronization configuration
   */
  public updateConfig(newConfig: Partial<TimingSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // If sync is active, restart with new config
    if (this.isActive) {
      const currentState = { ...this.syncState };
      this.stopSync();
      this.startSync(currentState);
    }

    console.log('LEDTimingSync: Config updated:', this.config);
  }

  /**
   * Cleanup and dispose of timing sync
   */
  public dispose(): void {
    this.stopSync();
    this.updateCallbacks.clear();

    // Clean up Transport listeners - note: Tone.js doesn't provide off() method
    // The listeners are automatically cleaned up when Transport is disposed

    console.log('LEDTimingSync: Disposed');
  }
}