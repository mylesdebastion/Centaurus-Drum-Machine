/**
 * Browser Compatibility Message Component Tests
 * Tests the browser compatibility UI component rendering and behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserCompatibilityMessage } from '../../ui/BrowserCompatibilityMessage';
import type { CompatibilityInfo } from '../../utils/browserCompatibility';

// Mock the browserCompatibility module
vi.mock('../../utils/browserCompatibility', () => ({
  BrowserCompatibilityDetector: {
    detect: vi.fn(),
    getBrowserProfile: vi.fn(),
    getSupportedBrowsers: vi.fn().mockReturnValue([
      {
        name: 'Google Chrome',
        supportLevel: 'full',
        downloadUrl: 'https://www.google.com/chrome/'
      },
      {
        name: 'Microsoft Edge',
        supportLevel: 'full',
        downloadUrl: 'https://www.microsoft.com/edge'
      },
      {
        name: 'Mozilla Firefox',
        supportLevel: 'partial',
        downloadUrl: 'https://www.mozilla.org/firefox/'
      }
    ])
  }
}));

import { BrowserCompatibilityDetector } from '../../utils/browserCompatibility';

describe('BrowserCompatibilityMessage', () => {
  const mockFullSupport: CompatibilityInfo = {
    webMidiSupported: true,
    browserName: 'chrome',
    browserVersion: '91.0.4472.124',
    requiresHttps: false,
    hasSecureContext: true,
    supportLevel: 'full',
    limitations: [],
    recommendations: ['Recommended browser for hardware integration']
  };

  const mockPartialSupport: CompatibilityInfo = {
    webMidiSupported: true,
    browserName: 'firefox',
    browserVersion: '89.0',
    requiresHttps: false,
    hasSecureContext: true,
    supportLevel: 'partial',
    limitations: ['Limited SysEx support', 'Some advanced MIDI features may not work'],
    recommendations: ['Basic MIDI functionality available', 'Consider Chrome/Edge for full hardware features']
  };

  const mockNoSupport: CompatibilityInfo = {
    webMidiSupported: false,
    browserName: 'safari',
    browserVersion: '14.1.1',
    requiresHttps: false,
    hasSecureContext: true,
    supportLevel: 'none',
    limitations: ['Web MIDI API not supported', 'Hardware controllers cannot connect'],
    recommendations: ['Use Chrome, Firefox, or Edge for hardware support', 'Safari users can still use software features']
  };

  const mockHttpsRequired: CompatibilityInfo = {
    webMidiSupported: true,
    browserName: 'chrome',
    browserVersion: '91.0.4472.124',
    requiresHttps: true,
    hasSecureContext: false,
    supportLevel: 'full',
    limitations: ['HTTPS required for Web MIDI access'],
    recommendations: ['Recommended browser for hardware integration']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('full support display', () => {
    beforeEach(() => {
      vi.mocked(BrowserCompatibilityDetector.detect).mockReturnValue(mockFullSupport);
      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Google Chrome',
        supportLevel: 'full',
        limitations: [],
        recommendations: ['Recommended browser for hardware integration'],
        downloadUrl: 'https://www.google.com/chrome/'
      });
    });

    it('should display full support message', () => {
      render(<BrowserCompatibilityMessage />);

      expect(screen.getByText('Hardware Support Available')).toBeInTheDocument();
      expect(screen.getByText(/Google Chrome fully supports hardware controllers/)).toBeInTheDocument();
    });

    it('should show green status indicator for full support', () => {
      render(<BrowserCompatibilityMessage />);

      // Find the root container with the correct classes
      const container = screen.getByText('Hardware Support Available').closest('div[class*="border-green"]');
      expect(container).toHaveClass('border-green-200', 'bg-green-50');
    });

    it('should show browser version in details', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText(/Detected: Google Chrome 91.0.4472.124/)).toBeInTheDocument();
      expect(screen.getByText(/\(Secure\)/)).toBeInTheDocument();
    });

    it('should display recommendations when showDetails is true', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText('Recommendations:')).toBeInTheDocument();
      expect(screen.getByText(/Recommended browser for hardware integration/)).toBeInTheDocument();
    });
  });

  describe('partial support display', () => {
    beforeEach(() => {
      vi.mocked(BrowserCompatibilityDetector.detect).mockReturnValue(mockPartialSupport);
      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Mozilla Firefox',
        supportLevel: 'partial',
        limitations: ['Limited SysEx support', 'Some advanced MIDI features may not work'],
        recommendations: ['Basic MIDI functionality available', 'Consider Chrome/Edge for full hardware features'],
        downloadUrl: 'https://www.mozilla.org/firefox/'
      });
    });

    it('should display partial support message', () => {
      render(<BrowserCompatibilityMessage />);

      expect(screen.getByText('Limited Hardware Support')).toBeInTheDocument();
      expect(screen.getByText(/Mozilla Firefox has basic MIDI support/)).toBeInTheDocument();
    });

    it('should show yellow status indicator for partial support', () => {
      render(<BrowserCompatibilityMessage />);

      // Find the root container with the correct classes
      const container = screen.getByText('Limited Hardware Support').closest('div[class*="border-yellow"]');
      expect(container).toHaveClass('border-yellow-200', 'bg-yellow-50');
    });

    it('should display limitations when showDetails is true', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText('Limitations:')).toBeInTheDocument();
      expect(screen.getByText(/Limited SysEx support/)).toBeInTheDocument();
      expect(screen.getByText(/Some advanced MIDI features may not work/)).toBeInTheDocument();
    });
  });

  describe('no support display', () => {
    beforeEach(() => {
      vi.mocked(BrowserCompatibilityDetector.detect).mockReturnValue(mockNoSupport);
      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Safari',
        supportLevel: 'none',
        limitations: ['Web MIDI API not supported', 'Hardware controllers cannot connect'],
        recommendations: ['Use Chrome, Firefox, or Edge for hardware support', 'Safari users can still use software features'],
        downloadUrl: 'https://www.google.com/chrome/'
      });
    });

    it('should display no support message', () => {
      render(<BrowserCompatibilityMessage />);

      expect(screen.getByText('Hardware Not Supported')).toBeInTheDocument();
      expect(screen.getByText(/Safari doesn't support Web MIDI API/)).toBeInTheDocument();
    });

    it('should show red status indicator for no support', () => {
      render(<BrowserCompatibilityMessage />);

      // Find the root container with the correct classes
      const container = screen.getByText('Hardware Not Supported').closest('div[class*="border-red"]');
      expect(container).toHaveClass('border-red-200', 'bg-red-50');
    });

    it('should display supported browsers list when showDetails is true', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText('Supported Browsers:')).toBeInTheDocument();
      expect(screen.getByText(/Google Chrome \(Full\)/)).toBeInTheDocument();
      expect(screen.getByText(/Microsoft Edge \(Full\)/)).toBeInTheDocument();
      expect(screen.getByText(/Mozilla Firefox \(Basic\)/)).toBeInTheDocument();
    });

    it('should display download links for supported browsers', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      const downloadLinks = screen.getAllByText('Download');
      expect(downloadLinks).toHaveLength(3);

      // Check that links have correct href attributes
      const chromeLink = screen.getByText(/Google Chrome/).closest('div')?.querySelector('a');
      expect(chromeLink).toHaveAttribute('href', 'https://www.google.com/chrome/');
    });
  });

  describe('HTTPS required display', () => {
    beforeEach(() => {
      vi.mocked(BrowserCompatibilityDetector.detect).mockReturnValue(mockHttpsRequired);
      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Google Chrome',
        supportLevel: 'full',
        limitations: ['HTTPS required for Web MIDI access'],
        recommendations: ['Recommended browser for hardware integration'],
        downloadUrl: 'https://www.google.com/chrome/'
      });
    });

    it('should display HTTPS required message', () => {
      render(<BrowserCompatibilityMessage />);

      expect(screen.getByText('HTTPS Required')).toBeInTheDocument();
      expect(screen.getByText(/Hardware controllers require HTTPS or localhost/)).toBeInTheDocument();
    });

    it('should show HTTPS setup guide when showDetails is true', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText('HTTPS Setup Options:')).toBeInTheDocument();
      expect(screen.getByText(/Access via HTTPS URL/)).toBeInTheDocument();
      expect(screen.getByText(/Use localhost for development/)).toBeInTheDocument();
      expect(screen.getByText(/Deploy to a secure hosting provider/)).toBeInTheDocument();
    });

    it('should show insecure context indicator', () => {
      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText(/\(Insecure\)/)).toBeInTheDocument();
    });
  });

  describe('props and customization', () => {
    it('should accept custom compatibility info', () => {
      const customCompatibility: CompatibilityInfo = {
        ...mockPartialSupport,
        browserName: 'custom',
        browserVersion: '1.0.0'
      };

      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Custom Browser',
        supportLevel: 'partial',
        limitations: ['Custom limitation'],
        recommendations: ['Custom recommendation']
      });

      render(<BrowserCompatibilityMessage compatibility={customCompatibility} />);

      expect(screen.getByText(/Custom Browser has basic MIDI support/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<BrowserCompatibilityMessage className="custom-class" />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('should hide details by default', () => {
      render(<BrowserCompatibilityMessage />);

      expect(screen.queryByText('Limitations:')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommendations:')).not.toBeInTheDocument();
    });

    it('should show details when showDetails prop is true', () => {
      vi.mocked(BrowserCompatibilityDetector.detect).mockReturnValue(mockPartialSupport);
      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Mozilla Firefox',
        supportLevel: 'partial',
        limitations: ['Limited SysEx support'],
        recommendations: ['Basic MIDI functionality available']
      });

      render(<BrowserCompatibilityMessage showDetails={true} />);

      expect(screen.getByText('Limitations:')).toBeInTheDocument();
      expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(<BrowserCompatibilityMessage />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible download links', () => {
      render(<BrowserCompatibilityMessage showDetails={true} compatibility={mockNoSupport} />);

      const downloadLinks = screen.getAllByRole('link', { name: /Download/ });
      downloadLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should use semantic list for limitations and recommendations', () => {
      render(
        <BrowserCompatibilityMessage
          showDetails={true}
          compatibility={mockPartialSupport}
        />
      );

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);

      // Check that list items exist
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty limitations gracefully', () => {
      const emptyLimitationsCompatibility: CompatibilityInfo = {
        ...mockFullSupport,
        limitations: []
      };

      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Test Browser',
        supportLevel: 'full',
        limitations: [],
        recommendations: ['Test recommendation']
      });

      render(
        <BrowserCompatibilityMessage
          showDetails={true}
          compatibility={emptyLimitationsCompatibility}
        />
      );

      expect(screen.queryByText('Limitations:')).not.toBeInTheDocument();
      expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    });

    it('should handle empty recommendations gracefully', () => {
      const emptyRecommendationsCompatibility: CompatibilityInfo = {
        ...mockPartialSupport,
        recommendations: []
      };

      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Test Browser',
        supportLevel: 'partial',
        limitations: ['Test limitation'],
        recommendations: []
      });

      render(
        <BrowserCompatibilityMessage
          showDetails={true}
          compatibility={emptyRecommendationsCompatibility}
        />
      );

      expect(screen.getByText('Limitations:')).toBeInTheDocument();
      expect(screen.queryByText('Recommendations:')).not.toBeInTheDocument();
    });

    it('should handle unknown browser gracefully', () => {
      const unknownBrowserCompatibility: CompatibilityInfo = {
        ...mockNoSupport,
        browserName: 'unknown',
        browserVersion: ''
      };

      vi.mocked(BrowserCompatibilityDetector.getBrowserProfile).mockReturnValue({
        name: 'Unknown Browser',
        supportLevel: 'none',
        limitations: ['Browser compatibility unknown'],
        recommendations: ['Use Chrome or Edge for guaranteed hardware support']
      });

      render(<BrowserCompatibilityMessage compatibility={unknownBrowserCompatibility} />);

      expect(screen.getByText('Hardware Not Supported')).toBeInTheDocument();
      expect(screen.getByText(/Unknown Browser doesn't support Web MIDI API/)).toBeInTheDocument();
    });
  });
});