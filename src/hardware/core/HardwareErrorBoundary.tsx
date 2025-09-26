/**
 * Hardware Error Boundary - Protects main application from hardware errors
 * 
 * React Error Boundary that isolates hardware module errors to prevent
 * crashes in the main sequencer application. Provides graceful degradation
 * when hardware components fail.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for HardwareErrorBoundary component
 */
interface HardwareErrorBoundaryProps {
  children: ReactNode;
  /** Callback when hardware error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom fallback UI when error occurs */
  fallback?: ReactNode;
  /** Whether to show error details in development */
  showErrorDetails?: boolean;
}

/**
 * State for HardwareErrorBoundary component
 */
interface HardwareErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Default fallback UI for hardware errors
 */
const DefaultHardwareErrorFallback: React.FC<{ 
  error?: Error | null; 
  showDetails?: boolean; 
}> = ({ error, showDetails = false }) => (
  <div 
    style={{
      padding: '16px',
      margin: '8px 0',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#b91c1c'
    }}
  >
    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
      ⚠️ Hardware Module Error
    </div>
    <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
      Hardware controller functionality is temporarily unavailable. 
      The main drum machine continues to work normally.
    </div>
    {showDetails && error && (
      <details style={{ marginTop: '8px', fontSize: '11px' }}>
        <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
          Technical Details
        </summary>
        <pre style={{ 
          marginTop: '4px', 
          padding: '8px', 
          backgroundColor: '#fee2e2',
          borderRadius: '4px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {error.message}
          {error.stack && `\n\nStack Trace:\n${error.stack}`}
        </pre>
      </details>
    )}
  </div>
);

/**
 * Hardware Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the hardware component tree,
 * logs the errors, and displays a fallback UI instead of crashing
 * the entire application.
 */
export class HardwareErrorBoundary extends Component<
  HardwareErrorBoundaryProps,
  HardwareErrorBoundaryState
> {
  constructor(props: HardwareErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<HardwareErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Handle error and perform logging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error following existing console logging patterns
    console.error('Hardware Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, provide more detailed error information
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.group('🔧 Hardware Error Boundary - Development Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  /**
   * Reset error boundary state
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showErrorDetails = false } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultHardwareErrorFallback 
          error={error} 
          showDetails={showErrorDetails} 
        />
      );
    }

    // No error, render children normally
    return children;
  }
}

/**
 * Higher-order component for wrapping components with hardware error boundary
 */
export const withHardwareErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<HardwareErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <HardwareErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </HardwareErrorBoundary>
  );

  WrappedComponent.displayName = `withHardwareErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
};

/**
 * Hook for programmatic error boundary reset
 */
export const useHardwareErrorReset = () => {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setResetKey(prev => prev + 1);
  }, []);

  return { resetKey, reset };
};