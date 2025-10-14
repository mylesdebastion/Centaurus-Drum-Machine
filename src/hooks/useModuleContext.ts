import { useLocation } from 'react-router-dom';

/**
 * Module execution context
 * Determines how modules consume global state and render controls
 *
 * - 'standalone': Direct route access (/piano, /guitar-fretboard, etc.)
 * - 'studio': Loaded in Studio multi-module view
 * - 'jam': Loaded in JamSession collaborative view
 */
export type ModuleContext = 'standalone' | 'studio' | 'jam';

/**
 * Hook to detect module execution context
 *
 * Uses React Router location to determine if module is:
 * - 'standalone': Direct route access (/piano, /guitar-fretboard, etc.)
 * - 'studio': Loaded in Studio multi-module view
 * - 'jam': Loaded in JamSession collaborative view
 *
 * This enables modules to intelligently adapt behavior:
 * - Standalone: Use local state, show all controls
 * - Studio/Jam: Consume GlobalMusicContext, hide redundant controls
 *
 * @returns ModuleContext enum value
 *
 * @example
 * ```tsx
 * const context = useModuleContext();
 * const showLocalControls = context === 'standalone';
 *
 * // Graceful degradation pattern
 * const key = context === 'standalone' ? localKey : globalMusic.key;
 * ```
 *
 * @architecture
 * Epic 14, Story 14.2 - Module Adapter Pattern Implementation
 * Architecture document: docs/architecture/brownfield-module-refactoring.md (Section 5.1)
 */
export const useModuleContext = (): ModuleContext => {
  const location = useLocation();

  // Studio view detection
  if (location.pathname.startsWith('/studio')) {
    return 'studio';
  }

  // Jam session detection
  if (location.pathname.startsWith('/jam')) {
    return 'jam';
  }

  // Default to standalone (direct module access)
  // This ensures future routes default to safe behavior
  return 'standalone';
};
