/**
 * APC40 Test Component
 * 
 * A React component for testing APC40 functionality in the running application.
 */

import React, { useState, useEffect } from 'react';
import { apc40Integration } from './integration';
import { useHardwareContext } from '../core/HardwareManager';

export const APC40TestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>('None');
  const hardwareContext = useHardwareContext();

  useEffect(() => {
    // Initialize APC40 integration
    apc40Integration.initialize(hardwareContext);
  }, [hardwareContext]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleRegisterAPC40 = async () => {
    try {
      addResult('🎹 Registering APC40...');
      const result = await apc40Integration.registerAPC40({
        autoConnect: true,
        autoDetect: true,
      });
      
      if (result.success) {
        addResult(`✅ APC40 registered: ${result.controller.name}`);
        setIsConnected(result.controller.connectionStatus === 'connected');
      } else {
        addResult(`❌ Registration failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSetupIntegration = () => {
    try {
      apc40Integration.setupDrumMachineIntegration({
        onStepToggle: (step: number, intensity: number) => {
          const message = `🥁 Step ${step}, Intensity ${intensity}`;
          setLastEvent(message);
          addResult(message);
        },
        onTransportControl: (command: string) => {
          const message = `⏯️ Transport: ${command}`;
          setLastEvent(message);
          addResult(message);
        },
        onConnectionChange: (connected: boolean, deviceName?: string) => {
          const message = `🔗 ${connected ? 'Connected' : 'Disconnected'}${deviceName ? ' - ' + deviceName : ''}`;
          setIsConnected(connected);
          setLastEvent(message);
          addResult(message);
        },
      });
      addResult('✅ Integration callbacks setup');
    } catch (error) {
      addResult(`❌ Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestSequencerState = () => {
    try {
      const testState = {
        currentStep: Math.floor(Math.random() * 16),
        isPlaying: true,
        tempo: 120,
        pattern: [
          Array(16).fill(false).map(() => Math.random() > 0.7),
          Array(16).fill(false).map(() => Math.random() > 0.8),
        ],
        trackCount: 2,
      };
      
      apc40Integration.updateSequencerState(testState);
      addResult(`✅ Sequencer state updated - Step ${testState.currentStep}`);
    } catch (error) {
      addResult(`❌ Update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apc40Integration.disconnectAll();
      setIsConnected(false);
      addResult('🔌 All controllers disconnected');
    } catch (error) {
      addResult(`❌ Disconnect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setLastEvent('None');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">APC40 Hardware Test</h2>
      
      {/* Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-semibold">Connection Status:</span>
          <span className={`px-2 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold">Last Event:</span>
          <span className="text-gray-700">{lastEvent}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleRegisterAPC40}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Register APC40
        </button>
        
        <button
          onClick={handleSetupIntegration}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!isConnected}
        >
          Setup Integration
        </button>
        
        <button
          onClick={handleTestSequencerState}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={!isConnected}
        >
          Test LEDs
        </button>
        
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Connect your APC40 via USB</li>
          <li>Ensure you're on HTTPS or localhost</li>
          <li>Click "Register APC40" to connect</li>
          <li>Click "Setup Integration" to enable event handling</li>
          <li>Press buttons on the APC40 grid to see step events</li>
          <li>Press transport controls (Play/Stop/Rec) to see transport events</li>
          <li>Click "Test LEDs" to see LED feedback on the APC40</li>
        </ol>
      </div>

      {/* Results Log */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-white mb-2">Test Log:</h3>
        {testResults.length === 0 ? (
          <div className="text-gray-500">No test results yet...</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
};