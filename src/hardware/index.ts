/**
 * Hardware Abstraction Layer - Main Export
 * 
 * Central export point for all hardware module functionality
 * following existing project barrel export patterns.
 */

// Core types and interfaces
export type {
  ConnectionStatus,
  HardwareEventType,
  ControllerCapabilities,
  HardwareEvent,
  HardwareController,
  SequencerState,
  ControllerState,
  HardwareContextType,
} from './core/types';

// Core components and hooks
export { HardwareManager, useHardwareContext } from './core/HardwareManager';
export { useHardware } from './core/useHardware';
export { HardwareErrorBoundary, withHardwareErrorBoundary, useHardwareErrorReset } from './core/HardwareErrorBoundary';

// Type exports
export type { UseHardwareReturn, HardwareStats } from './core/useHardware';
export type { HardwareManagerProps } from './core/HardwareManager';