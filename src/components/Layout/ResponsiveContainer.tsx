import React, { createContext, useContext } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import type { LayoutStrategy, ResponsiveContextValue } from '../../types';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  strategy?: LayoutStrategy;
  enableMobileNavPadding?: boolean;
}

// Create context for child components to access responsive state
const ResponsiveContext = createContext<ResponsiveContextValue | undefined>(undefined);

/**
 * Hook to access responsive context from child components
 * @throws Error if used outside ResponsiveContainer
 */
export const useResponsiveContext = (): ResponsiveContextValue => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within ResponsiveContainer');
  }
  return context;
};

/**
 * Enhanced responsive container with layout strategy support and context provision
 *
 * Features:
 * - Comprehensive breakpoint detection via useResponsive hook
 * - Layout strategy support (tabs, collapsible, hybrid)
 * - Automatic mobile navigation padding (pb-20 when mobile nav visible)
 * - Safe-area-inset support for notched devices
 * - Exposes responsive state via React Context
 *
 * @param children - Child components
 * @param className - Additional CSS classes
 * @param strategy - Layout strategy (tabs, collapsible, hybrid)
 * @param enableMobileNavPadding - Auto-add bottom padding for mobile navigation (default: true)
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  strategy,
  enableMobileNavPadding = true,
}) => {
  const responsive = useResponsive();
  const { isMobile, isTablet, breakpoint } = responsive;

  // Construct context value with layout strategy
  const contextValue: ResponsiveContextValue = {
    ...responsive,
    layoutStrategy: strategy,
  };

  // Auto-padding for mobile navigation (only on mobile breakpoint)
  const mobileNavPadding = enableMobileNavPadding && isMobile ? 'pb-20' : '';

  // Safe-area-inset support for iOS notches and Android gesture bars
  const safeAreaClasses = 'safe-area-inset';

  return (
    <ResponsiveContext.Provider value={contextValue}>
      <div
        className={`
          ${className}
          ${isMobile ? 'mobile-layout' : ''}
          ${isTablet ? 'tablet-layout' : ''}
          ${mobileNavPadding}
          ${safeAreaClasses}
        `}
        data-breakpoint={breakpoint}
        data-layout-strategy={strategy}
      >
        {children}
      </div>
    </ResponsiveContext.Provider>
  );
};
