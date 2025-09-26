/**
 * Browser Compatibility Message Component
 * Displays browser-specific guidance and download links
 */

import React from 'react';
import { AlertTriangle, Download, Info, Shield } from 'lucide-react';
import { BrowserCompatibilityDetector, type CompatibilityInfo } from '../utils/browserCompatibility';

interface BrowserCompatibilityMessageProps {
  compatibility?: CompatibilityInfo;
  showDetails?: boolean;
  className?: string;
}

export const BrowserCompatibilityMessage: React.FC<BrowserCompatibilityMessageProps> = ({
  compatibility = BrowserCompatibilityDetector.detect(),
  showDetails = false,
  className = ''
}) => {
  const profile = BrowserCompatibilityDetector.getBrowserProfile(compatibility.browserName);

  const getStatusIcon = () => {
    switch (compatibility.supportLevel) {
      case 'full':
        return <Info className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'none':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (compatibility.supportLevel) {
      case 'full':
        return 'border-green-200 bg-green-50';
      case 'partial':
        return 'border-yellow-200 bg-yellow-50';
      case 'none':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getMessage = () => {
    if (compatibility.requiresHttps) {
      return {
        title: 'HTTPS Required',
        description: 'Hardware controllers require HTTPS or localhost for security. Please use HTTPS to enable MIDI features.',
        showHttpsSetup: true
      };
    }

    switch (compatibility.supportLevel) {
      case 'full':
        return {
          title: 'Hardware Support Available',
          description: `${profile.name} fully supports hardware controllers. Connect your MIDI device to get started.`
        };
      case 'partial':
        return {
          title: 'Limited Hardware Support',
          description: `${profile.name} has basic MIDI support. Some advanced features may not work.`
        };
      case 'none':
        return {
          title: 'Hardware Not Supported',
          description: `${profile.name} doesn't support Web MIDI API. You can still use all software features.`
        };
      default:
        return {
          title: 'Hardware Support Unknown',
          description: 'Unable to detect hardware support in your current browser.'
        };
    }
  };

  const message = getMessage();

  const SupportedBrowsersList = () => {
    const supportedBrowsers = BrowserCompatibilityDetector.getSupportedBrowsers();

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Browsers:</h4>
        <div className="space-y-2">
          {supportedBrowsers.map((browser) => (
            <div key={browser.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {browser.name} {browser.supportLevel === 'full' ? '(Full)' : '(Basic)'}
              </span>
              {browser.downloadUrl && (
                <a
                  href={browser.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-500 hover:text-blue-600"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const HttpsSetupGuide = () => (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-start">
        <Shield className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 mb-1">HTTPS Setup Options:</p>
          <ul className="text-blue-800 space-y-1">
            <li>• Access via HTTPS URL (e.g., https://yourdomain.com)</li>
            <li>• Use localhost for development (localhost is considered secure)</li>
            <li>• Deploy to a secure hosting provider</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-start">
        {getStatusIcon()}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{message.title}</h3>
          <p className="mt-1 text-sm text-gray-700">{message.description}</p>

          {showDetails && (
            <div className="mt-3">
              {compatibility.limitations.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Limitations:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {compatibility.limitations.map((limitation, index) => (
                      <li key={index}>• {limitation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {compatibility.recommendations.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Recommendations:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {compatibility.recommendations.map((recommendation, index) => (
                      <li key={index}>• {recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {compatibility.supportLevel === 'none' && <SupportedBrowsersList />}
              {message.showHttpsSetup && <HttpsSetupGuide />}

              <div className="mt-3 text-xs text-gray-500">
                Detected: {profile.name} {compatibility.browserVersion}
                {compatibility.hasSecureContext ? ' (Secure)' : ' (Insecure)'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};