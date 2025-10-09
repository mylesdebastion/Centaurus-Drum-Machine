import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  orientation: Orientation;
  isTouchDevice: boolean;
  width: number;
  height: number;
}

// Breakpoint constants matching Tailwind config
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Comprehensive responsive hook for breakpoint detection and device information
 *
 * Features:
 * - Breakpoint detection (mobile/tablet/desktop)
 * - Device type detection (iOS/Android/desktop)
 * - Orientation tracking (portrait/landscape)
 * - Touch capability detection
 * - Debounced resize handling (150ms)
 *
 * @returns ResponsiveState object with all responsive information
 */
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Initialize with current window dimensions
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
        orientation: 'landscape',
        isTouchDevice: false,
        width: 1024,
        height: 768,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg;
    const orientation: Orientation = height > width ? 'portrait' : 'landscape';
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let breakpoint: Breakpoint = 'desktop';
    if (isMobile) breakpoint = 'mobile';
    else if (isTablet) breakpoint = 'tablet';

    return {
      isMobile,
      isTablet,
      isDesktop,
      breakpoint,
      orientation,
      isTouchDevice,
      width,
      height,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const updateResponsiveState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;
      const orientation: Orientation = height > width ? 'portrait' : 'landscape';
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      let breakpoint: Breakpoint = 'desktop';
      if (isMobile) breakpoint = 'mobile';
      else if (isTablet) breakpoint = 'tablet';

      setState({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint,
        orientation,
        isTouchDevice,
        width,
        height,
      });
    };

    const handleResize = () => {
      // Debounce resize events (150ms as per story spec)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateResponsiveState, 150);
    };

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    // Listen for orientation change events
    window.addEventListener('orientationchange', updateResponsiveState);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateResponsiveState);
    };
  }, []);

  return state;
};
