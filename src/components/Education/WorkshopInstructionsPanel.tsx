/**
 * Workshop Instructions Panel for Boomwhacker Workshop (Story 21.2)
 *
 * Provides instructor guidance, teaching tips, and optional WLED setup instructions
 * for the Boomwhacker workshop lesson.
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

/**
 * Main Workshop Instructions Panel Component
 * Displays collapsible panel with teaching guidance and optional WLED setup
 */
export const WorkshopInstructionsPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [usingWLED, setUsingWLED] = useState(() => {
    return localStorage.getItem('workshopWLEDEnabled') === 'true';
  });
  const [wledExperience, setWLEDExperience] = useState<'returning' | 'firsttime' | null>(() => {
    return (localStorage.getItem('workshopWLEDExperience') as 'returning' | 'firsttime') || null;
  });

  // Persist WLED toggle to localStorage
  useEffect(() => {
    localStorage.setItem('workshopWLEDEnabled', String(usingWLED));
  }, [usingWLED]);

  // Persist WLED experience selection to localStorage
  useEffect(() => {
    if (wledExperience) {
      localStorage.setItem('workshopWLEDExperience', wledExperience);
    }
  }, [wledExperience]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
      {/* Panel Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700 transition-colors rounded-lg"
        aria-expanded={isExpanded}
        aria-controls="workshop-instructions-content"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Books">📚</span>
          <h3 className="text-lg font-semibold text-white">Workshop Instructions</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Panel Content - Conditional */}
      {isExpanded && (
        <div id="workshop-instructions-content" className="p-6 border-t border-gray-700 space-y-6">
          {/* Welcome Message */}
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Welcome, Instructor!</h4>
            <p className="text-gray-300 mb-4">
              This workshop teaches rhythm and melody fundamentals using color-coded Boomwhacker tubes. Students will:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-2">
              <li>Learn to follow the timeline (moving white bar)</li>
              <li>Identify their color note and play at the right time</li>
              <li>Practice ascending and up/down patterns</li>
              <li>Play "Twinkle Twinkle Little Star" as a group</li>
            </ol>
          </div>

          {/* Materials Needed */}
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Materials Needed:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300 ml-2">
              <li>One Boomwhacker tube per student (C, D, E, F, G, A, B)</li>
              <li>Projector or large screen to display this interface</li>
              <li>(Optional) WLED LED light strips for visual reinforcement</li>
            </ul>
          </div>

          {/* Teaching Tips */}
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Teaching Tips:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300 ml-2">
              <li>Use "Next Step" to advance when students are ready</li>
              <li>Start slow (90 BPM) and maintain steady tempo</li>
              <li>Encourage students to watch for their color block</li>
              <li>Emphasize "rest" (don't play) on empty steps</li>
            </ul>
          </div>

          {/* Separator Line */}
          <hr className="border-gray-600" />

          {/* WLED Toggle Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usingWLED"
              checked={usingWLED}
              onChange={(e) => {
                setUsingWLED(e.target.checked);
                // Reset experience selection when unchecking
                if (!e.target.checked) {
                  setWLEDExperience(null);
                }
              }}
              className="w-5 h-5 cursor-pointer"
            />
            <label htmlFor="usingWLED" className="text-white cursor-pointer">
              Are you using WLED LED light strips?
            </label>
          </div>

          {/* Conditional WLED Setup Guide */}
          {usingWLED && (
            <WLEDSetupGuide
              experience={wledExperience}
              onExperienceChange={setWLEDExperience}
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * WLED Setup Guide Subcomponent
 * Shows radio buttons for experience level and conditional setup instructions
 */
interface WLEDSetupGuideProps {
  experience: 'returning' | 'firsttime' | null;
  onExperienceChange: (experience: 'returning' | 'firsttime') => void;
}

const WLEDSetupGuide: React.FC<WLEDSetupGuideProps> = ({
  experience,
  onExperienceChange
}) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4 border border-gray-700">
      <h4 className="text-md font-semibold text-white">WLED Setup for Workshop</h4>

      <p className="text-gray-300 text-sm">Have you configured WLED devices before?</p>

      {/* Radio Buttons */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer touch-target">
          <input
            type="radio"
            name="wledExperience"
            value="returning"
            checked={experience === 'returning'}
            onChange={() => onExperienceChange('returning')}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-white">Yes, I've used WLED in this workshop before</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer touch-target">
          <input
            type="radio"
            name="wledExperience"
            value="firsttime"
            checked={experience === 'firsttime'}
            onChange={() => onExperienceChange('firsttime')}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-white">No, this is my first time setting up WLED</span>
        </label>
      </div>

      {/* Conditional Content Based on Experience */}
      {experience === 'returning' && <ReturningUserGuide />}
      {experience === 'firsttime' && <FirstTimeSetupGuide />}
    </div>
  );
};

/**
 * Quick Start Guide for Returning Users
 */
const ReturningUserGuide: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-600">
      <h5 className="text-md font-semibold text-cyan-400">Quick Start (Returning Users)</h5>

      <ol className="list-decimal list-inside space-y-3 text-gray-300 text-sm">
        <li>
          <strong className="text-white">Ensure WLED devices are powered on</strong> and connected to Wi-Fi (same network as this device)
        </li>

        <li>
          <strong className="text-white">Start the WLED WebSocket bridge:</strong>
          <pre className="bg-gray-900 rounded p-2 mt-2 overflow-x-auto">
            <code className="text-cyan-300 text-xs">node scripts/wled-websocket-bridge.cjs</code>
          </pre>
          <p className="text-gray-400 text-xs mt-1">
            Bridge should show "🌉 WLED WebSocket bridge started on port 21325"
          </p>
        </li>

        <li>
          <strong className="text-white">Click the "LED" button</strong> in the sequencer controls to open LED configuration
        </li>

        <li>
          <strong className="text-white">Load your saved tube configuration</strong>
          <p className="text-gray-400 text-xs mt-1">
            (192.168.8.101-108 for classroom workshop setup)
          </p>
        </li>

        <li>
          <strong className="text-white">Toggle "Enable"</strong> to activate LED output
        </li>
      </ol>

      {/* Troubleshooting */}
      <div className="bg-gray-900 rounded p-3 border-l-4 border-yellow-500">
        <h6 className="text-sm font-semibold text-yellow-400 mb-2">Troubleshooting:</h6>
        <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs">
          <li>Bridge won't connect? Check firewall settings</li>
          <li>LEDs not responding? Verify device IPs are correct</li>
          <li>
            <a
              href="https://github.com/your-repo/docs/troubleshooting/wled-websocket-cleanup.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
            >
              View detailed troubleshooting guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Comprehensive First-Time Setup Guide
 */
const FirstTimeSetupGuide: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-600">
      <h5 className="text-md font-semibold text-cyan-400">First-Time WLED Setup</h5>

      {/* What is WLED */}
      <div>
        <h6 className="text-sm font-semibold text-white mb-2">What is WLED?</h6>
        <p className="text-gray-300 text-sm">
          WLED is open-source software that controls addressable LED strips. Each student's Boomwhacker color can be visualized as a scrolling light strip for enhanced learning.
        </p>
      </div>

      {/* Prerequisites */}
      <div>
        <h6 className="text-sm font-semibold text-white mb-2">Prerequisites:</h6>
        <ul className="space-y-1 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✅</span>
            <span>WLED-compatible LED strips (WS2812B, SK6812, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✅</span>
            <span>ESP32 or ESP8266 microcontroller with WLED firmware</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✅</span>
            <span>Power supply for LED strips (5V, adequate amperage)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✅</span>
            <span>Wi-Fi network (same network as this device)</span>
          </li>
        </ul>
      </div>

      {/* Setup Steps */}
      <div>
        <h6 className="text-sm font-semibold text-white mb-3">Setup Steps:</h6>

        {/* Step 1: Install WLED Firmware */}
        <div className="space-y-3">
          <div className="bg-gray-900 rounded p-3">
            <h6 className="text-sm font-semibold text-cyan-300 mb-2">1. Install WLED Firmware</h6>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs ml-2">
              <li>
                Visit{' '}
                <a
                  href="https://kno.wled.ge/basics/install-binary/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                >
                  WLED Install Guide
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Flash WLED firmware to your ESP32/ESP8266</li>
              <li>Connect LED strips to controller (data pin, GND, 5V)</li>
            </ul>
          </div>

          {/* Step 2: Configure WLED Devices */}
          <div className="bg-gray-900 rounded p-3">
            <h6 className="text-sm font-semibold text-cyan-300 mb-2">2. Configure WLED Devices</h6>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs ml-2">
              <li>Connect to WLED AP (WLED-AP) with phone/laptop</li>
              <li>Configure Wi-Fi settings via WLED web interface</li>
              <li>Set static IP addresses (recommended):
                <ul className="list-none ml-4 mt-1 space-y-0.5 text-gray-400">
                  <li>• Tube 1 (C): 192.168.8.101</li>
                  <li>• Tube 2 (D): 192.168.8.102</li>
                  <li>• Tube 3 (E): 192.168.8.103</li>
                  <li>• ... (up to 192.168.8.108 for B)</li>
                </ul>
              </li>
              <li>Test each device by accessing http://192.168.8.101</li>
            </ul>
          </div>

          {/* Step 3: Start Bridge */}
          <div className="bg-gray-900 rounded p-3">
            <h6 className="text-sm font-semibold text-cyan-300 mb-2">3. Start WLED WebSocket Bridge</h6>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs ml-2">
              <li>Open terminal in project root directory</li>
              <li>Run: <code className="text-cyan-300 bg-gray-800 px-1 rounded">node scripts/wled-websocket-bridge.cjs</code></li>
              <li>Verify output shows bridge started on port 21325</li>
            </ul>
          </div>

          {/* Step 4: Configure Tubes */}
          <div className="bg-gray-900 rounded p-3">
            <h6 className="text-sm font-semibold text-cyan-300 mb-2">4. Configure Workshop LED Tubes</h6>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs ml-2">
              <li>Click "LED" button in sequencer controls</li>
              <li>Add one tube per note (C, D, E, F, G, A, B)</li>
              <li>Set IP address for each tube</li>
              <li>Set LED count (typically 90 LEDs per tube)</li>
              <li>Assign lane color (auto-matches Boomwhacker colors)</li>
              <li>Toggle "Enable" to activate</li>
            </ul>
          </div>

          {/* Step 5: Test */}
          <div className="bg-gray-900 rounded p-3">
            <h6 className="text-sm font-semibold text-cyan-300 mb-2">5. Test & Calibrate</h6>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs ml-2">
              <li>Press Play to start pattern playback</li>
              <li>Verify LEDs scroll in sync with timeline</li>
              <li>Adjust brightness/speed if needed in LED config</li>
            </ul>
          </div>
        </div>
      </div>

      {/* External Documentation Links */}
      <div className="bg-gray-900 rounded p-3 border-l-4 border-cyan-500">
        <h6 className="text-sm font-semibold text-cyan-400 mb-2">Need More Help?</h6>
        <ul className="space-y-1 text-xs">
          <li>
            <a
              href="https://kno.wled.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
            >
              WLED Official Documentation
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>
            <a
              href="https://kno.wled.ge/interfaces/udp-realtime/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
            >
              UDP Realtime Control Guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>
            <a
              href="https://github.com/your-repo/docs/troubleshooting/wled-websocket-cleanup.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
            >
              Centaurus WLED Troubleshooting
              <ExternalLink className="w-3 h-3" />
            </a>
          </li>
        </ul>
      </div>

      {/* Future Workshop Placeholder */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded p-3 border border-purple-500/30">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div>
            <h6 className="text-sm font-semibold text-purple-300 mb-2">Coming Soon: DIY LED Music Visualizer Workshop</h6>
            <p className="text-gray-300 text-xs mb-2">
              We're developing a comprehensive STEM workshop where students build their own LED music visualizers from scratch. This workshop will cover:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs ml-2">
              <li>Electronics basics (microcontrollers, LED strips, power)</li>
              <li>Soldering and circuit assembly</li>
              <li>WLED firmware installation and configuration</li>
              <li>Music visualization programming concepts</li>
            </ul>
            <p className="text-gray-400 text-xs mt-2">
              This will be perfect for maker spaces, STEM programs, and advanced music technology classes.
            </p>
            {/* PLACEHOLDER: Story 22.x - DIY LED Visualizer Workshop */}
            {/* TODO: Create full workshop curriculum with BOM, assembly guide, lesson plans */}
          </div>
        </div>
      </div>
    </div>
  );
};
