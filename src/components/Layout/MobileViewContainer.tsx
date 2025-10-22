import React from 'react';

interface MobileViewContainerProps {
  children: React.ReactNode;
  visible: boolean;
  className?: string;
  enablePadding?: boolean;
}

/**
 * Container for tab-based mobile views with automatic show/hide
 *
 * Features:
 * - Automatic visibility control based on visible prop
 * - Safe-area-insets for iOS notches and Android gesture bars
 * - Auto bottom-padding for mobile navigation (pb-20)
 * - Smooth transitions on show/hide
 * - Handles notched devices properly
 *
 * @param children - View content
 * @param visible - Whether this view is currently active
 * @param className - Additional CSS classes
 * @param enablePadding - Enable automatic bottom padding for mobile nav (default: true)
 */
export const MobileViewContainer: React.FC<MobileViewContainerProps> = ({
  children,
  visible,
  className = '',
  enablePadding = true,
}) => {
  // Auto-padding for mobile navigation
  const bottomPadding = enablePadding ? 'pb-20' : '';

  // Safe-area-inset support
  const safeAreaPadding = 'safe-area-padding';

  return (
    <div
      className={`
        ${visible ? 'block' : 'hidden'}
        ${bottomPadding}
        ${safeAreaPadding}
        ${className}
        transition-opacity duration-200
      `}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: enablePadding
          ? 'calc(env(safe-area-inset-bottom) + 5rem)'
          : 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
};
