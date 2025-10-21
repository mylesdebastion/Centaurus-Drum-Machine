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
export { useControllerSelection } from './core/useControllerSelection';

// Controller Registry
export {
  CONTROLLER_REGISTRY,
  getAvailableControllers,
  getAllControllers,
  createController,
  getControllerDefinition,
} from './core/ControllerRegistry';
export type { ControllerType, ControllerDefinition } from './core/ControllerRegistry';

// Type exports
export type { UseHardwareReturn, HardwareStats } from './core/useHardware';
export type { HardwareManagerProps } from './core/HardwareManager';
export type { UseControllerSelectionReturn } from './core/useControllerSelection';

// APC40 Hardware Controller
export { APC40Controller } from './apc40/APC40Controller';
export { apc40Integration } from './apc40/integration';
export type {
  APC40IntegrationOptions,
  APC40IntegrationResult
} from './apc40/integration';

// Launchpad Pro Hardware Controller
export { LaunchpadProController } from './launchpad/LaunchpadProController';
export type { LaunchpadModel } from './launchpad/LaunchpadProController';