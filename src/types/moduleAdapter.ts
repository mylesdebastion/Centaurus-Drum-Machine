/**
 * Module Adapter Pattern Type Definitions
 *
 * Epic 14, Story 14.2 - Module Adapter Pattern Implementation
 * Architecture document: docs/architecture/brownfield-module-refactoring.md (Section 4, Section 5)
 *
 * These types support the module adapter pattern, enabling modules to intelligently
 * adapt to their execution context (standalone vs. Studio vs. Jam) and consume
 * global musical parameters with graceful degradation.
 */

/**
 * Module execution context
 *
 * Determines how modules consume global state and render controls:
 * - 'standalone': Direct route access (/piano, /guitar-fretboard, etc.) - Use local state, show all controls
 * - 'studio': Loaded in Studio multi-module view - Consume GlobalMusicContext, hide redundant controls
 * - 'jam': Loaded in JamSession collaborative view - Consume GlobalMusicContext, hide redundant controls
 */
export type ModuleContext = 'standalone' | 'studio' | 'jam';

/**
 * Module adapter props interface
 *
 * Optional interface for future module wrapper components
 * Currently unused but reserved for potential Story 14.3+ requirements
 *
 * @example
 * ```tsx
 * interface ModuleWrapperProps extends ModuleAdapterProps {
 *   children: React.ReactNode;
 * }
 * ```
 */
export interface ModuleAdapterProps {
  /**
   * Force specific context (for testing or special cases)
   * Overrides automatic context detection
   */
  forceContext?: ModuleContext;

  /**
   * Disable context detection
   * Always use local state regardless of route
   */
  disableContextDetection?: boolean;
}

/**
 * Module state resolution result
 *
 * Returned by potential future `useModuleState()` hook
 * Provides resolved state values with graceful degradation
 *
 * @example
 * ```tsx
 * const { key, scale, tempo, isGlobalState } = useModuleState();
 * ```
 */
export interface ModuleStateResolution {
  /**
   * Whether resolved state comes from GlobalMusicContext
   * true = using global state (embedded in Studio/Jam)
   * false = using local state (standalone view)
   */
  isGlobalState: boolean;

  /**
   * Current module execution context
   */
  context: ModuleContext;

  /**
   * Whether local controls should be visible
   * Shorthand for `context === 'standalone'`
   */
  showLocalControls: boolean;
}
