/**
 * Hardware Status Indicator Component
 * Shows real-time connection status and device information
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  Loader2,
  Settings,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { connectionManager, type ConnectionState } from '../utils/connectionManager';
import { BrowserCompatibilityDetector } from '../utils/browserCompatibility';
import { BrowserCompatibilityMessage } from './BrowserCompatibilityMessage';

interface HardwareStatusIndicatorProps {
  showDeviceInfo?: boolean;
  showCompatibilityInfo?: boolean;
  className?: string;
}

export const HardwareStatusIndicator: React.FC<HardwareStatusIndicatorProps> = ({
  showDeviceInfo = true,
  showCompatibilityInfo = true,
  className = ''
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    connectionManager.getState()
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
    };

    connectionManager.addEventListener('stateChange', handleStateChange);

    return () => {
      connectionManager.removeEventListener('stateChange', handleStateChange);
    };
  }, []);

  const getStatusDisplay = () => {
    switch (connectionState.status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4 text-green-500" />,
          label: 'Connected',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
          label: 'Connecting...',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          label: 'Error',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'unsupported':
        return {
          icon: <WifiOff className="w-4 h-4 text-gray-500" />,
          label: 'Unsupported',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      case 'requires_https':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
          label: 'HTTPS Required',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff className="w-4 h-4 text-gray-500" />,
          label: 'Disconnected',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const handleRetry = async () => {
    if (connectionState.status === 'error' || connectionState.status === 'disconnected') {
      await connectionManager.retry();
    }
  };

  const handleConnect = async () => {
    if (connectionState.status === 'disconnected') {
      await connectionManager.connect();
    }
  };

  const status = getStatusDisplay();
  const canRetry = connectionState.status === 'error' || connectionState.status === 'disconnected';
  const canConnect = connectionState.status === 'disconnected' &&
                    BrowserCompatibilityDetector.canUseMIDI();

  return (
    <div className={className}>
      {/* Main Status Indicator */}
      <div
        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${status.bgColor} ${status.borderColor} ${status.color} border`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {status.icon}
        <span className="ml-2">Hardware: {status.label}</span>
        <Settings className="w-3 h-3 ml-2 opacity-50" />
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          {/* Connection Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {status.icon}
              <span className="ml-2 font-medium text-gray-900">{status.label}</span>
            </div>
            {canRetry && (
              <button
                onClick={handleRetry}
                className="flex items-center px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                disabled={connectionState.status === 'connecting'}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </button>
            )}
            {canConnect && (
              <button
                onClick={handleConnect}
                className="flex items-center px-2 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Connect
              </button>
            )}
          </div>

          {/* Device Information */}
          {showDeviceInfo && connectionState.device && (
            <div className="mb-3 p-2 bg-gray-50 rounded">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Connected Device:</h4>
              <p className="text-sm text-gray-900">{connectionState.device.name}</p>
              <p className="text-xs text-gray-500">
                {connectionState.device.manufacturer} • {connectionState.device.type}
              </p>
            </div>
          )}

          {/* Error Information */}
          {connectionState.lastError && (
            <div className="mb-3 p-2 bg-red-50 rounded border border-red-200">
              <h4 className="text-xs font-medium text-red-700 mb-1">Error:</h4>
              <p className="text-sm text-red-800">{connectionState.lastError}</p>
              {connectionState.reconnectAttempts > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Reconnect attempts: {connectionState.reconnectAttempts}
                </p>
              )}
            </div>
          )}

          {/* Browser Compatibility */}
          {showCompatibilityInfo && connectionState.compatibility && (
            <div className="mb-3">
              <BrowserCompatibilityMessage
                compatibility={{
                  ...connectionState.compatibility,
                  browserVersion: '',
                  supportLevel: connectionState.compatibility.webMidiSupported ? 'full' : 'none',
                  limitations: [],
                  recommendations: []
                }}
                showDetails={false}
              />
            </div>
          )}

          {/* Action Links */}
          <div className="flex justify-between items-center text-xs border-t pt-2">
            <button
              onClick={() => setShowDetails(false)}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <div className="flex space-x-3">
              {(connectionState.status === 'requires_https' || connectionState.status === 'unsupported') && (
                <a
                  href="#setup-guide"
                  className="flex items-center text-blue-500 hover:text-blue-600"
                  onClick={() => {
                    // This would scroll to or open setup documentation
                    console.log('Open HTTPS setup guide');
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Setup Guide
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareStatusIndicator;