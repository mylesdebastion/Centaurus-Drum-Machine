/**
 * Layout Manager for Launchpad Pro Grid Orientation
 *
 * Manages grid layout orientation switching between horizontal and vertical modes.
 * Persists user preference to localStorage.
 *
 * Reference: Story 8.2, AC 6
 */

import {
  stepToNote_Horizontal,
  stepToNote_Vertical,
  noteToStep_Horizontal,
  noteToStep_Vertical,
  type StepCoordinates,
} from './layoutMapping';

export type LayoutOrientation = 'horizontal' | 'vertical';

const STORAGE_KEY = 'launchpad-layout-orientation';

/**
 * Event emitted when layout orientation changes
 */
export interface OrientationChangedEvent {
  orientation: LayoutOrientation;
  timestamp: number;
}

/**
 * Layout Manager
 *
 * Provides unified interface for grid coordinate conversion with orientation switching.
 */
export class LayoutManager {
  private _orientation: LayoutOrientation;
  private listeners: Set<(event: OrientationChangedEvent) => void> = new Set();

  constructor(initialOrientation?: LayoutOrientation) {
    // Load saved orientation from localStorage or use default
    const savedOrientation = this.loadOrientation();
    this._orientation = initialOrientation ?? savedOrientation ?? 'horizontal';

    // Save initial orientation if not already saved
    if (!savedOrientation) {
      this.saveOrientation(this._orientation);
    }
  }

  /**
   * Get current orientation
   */
  public get orientation(): LayoutOrientation {
    return this._orientation;
  }

  /**
   * Set orientation (triggers save and event)
   */
  public set orientation(value: LayoutOrientation) {
    if (this._orientation !== value) {
      this._orientation = value;
      this.saveOrientation(value);
      this.emitOrientationChanged();
    }
  }

  /**
   * Toggle between horizontal and vertical orientations
   */
  public toggleOrientation(): void {
    this.orientation = this._orientation === 'horizontal' ? 'vertical' : 'horizontal';
  }

  /**
   * Convert step coordinates to MIDI note using active layout
   *
   * @param track Track/pitch index (0-7)
   * @param step Step/time index (0-7)
   * @returns MIDI note number (0-119)
   */
  public getNoteForStep(track: number, step: number): number {
    if (this._orientation === 'horizontal') {
      return stepToNote_Horizontal(track, step);
    } else {
      return stepToNote_Vertical(track, step);
    }
  }

  /**
   * Convert MIDI note to step coordinates using active layout
   *
   * @param note MIDI note number (0-119)
   * @returns Step coordinates {track, step}
   */
  public getStepForNote(note: number): StepCoordinates {
    if (this._orientation === 'horizontal') {
      return noteToStep_Horizontal(note);
    } else {
      return noteToStep_Vertical(note);
    }
  }

  /**
   * Register listener for orientation change events
   *
   * @param listener Callback function
   */
  public onOrientationChanged(listener: (event: OrientationChangedEvent) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Unregister orientation change listener
   *
   * @param listener Callback function to remove
   */
  public offOrientationChanged(listener: (event: OrientationChangedEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit orientation changed event to all listeners
   */
  private emitOrientationChanged(): void {
    const event: OrientationChangedEvent = {
      orientation: this._orientation,
      timestamp: performance.now(),
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('LayoutManager: Error in orientation change listener', error);
      }
    });
  }

  /**
   * Load orientation from localStorage
   */
  private loadOrientation(): LayoutOrientation | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'horizontal' || saved === 'vertical') {
        return saved;
      }
      return null;
    } catch (error) {
      console.warn('LayoutManager: Failed to load orientation from localStorage', error);
      return null;
    }
  }

  /**
   * Save orientation to localStorage
   */
  private saveOrientation(orientation: LayoutOrientation): void {
    try {
      localStorage.setItem(STORAGE_KEY, orientation);
    } catch (error) {
      console.warn('LayoutManager: Failed to save orientation to localStorage', error);
    }
  }
}
