// Responsive hooks
export { useResponsive } from './useResponsive';
export type { ResponsiveState, Breakpoint, Orientation } from './useResponsive';

// Musical scale hooks
export { useMusicalScale } from './useMusicalScale';
export type { UseMusicalScaleOptions, UseMusicalScaleReturn, RootNote, ScaleName } from './useMusicalScale';
export { ROOT_POSITIONS, SCALE_PATTERNS, ROOT_NOTES, SCALE_NAMES, SCALE_DISPLAY_NAMES } from './useMusicalScale';

// Module context hooks (Epic 14 - Module Adapter Pattern)
export { useModuleContext } from './useModuleContext';
export type { ModuleContext } from './useModuleContext';

// Authentication hooks (Story 18.0 - User Authentication)
export { useAuth } from './useAuth';
export type { UseAuthReturn } from '../types/auth';
