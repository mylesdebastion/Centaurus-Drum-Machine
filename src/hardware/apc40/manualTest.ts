/**
 * Manual APC40 Integration Test
 * 
 * This file can be used to manually test APC40 functionality.
 * Run this in the browser console to test hardware integration.
 */

import { apc40Integration } from './integration';
import { HardwareManager, useHardwareContext } from '../core/HardwareManager';

declare global {
  interface Window {
    testAPC40: () => Promise<void>;
    apc40Integration: typeof apc40Integration;
  }
}

/**
 * Manual test function for APC40 integration
 */
async function testAPC40Integration() {
  console.log('🎹 Starting APC40 Manual Test...');
  
  try {
    // Test 1: Registration
    console.log('Test 1: Registering APC40 controller...');
    const result = await apc40Integration.registerAPC40({
      autoConnect: true,
      autoDetect: true,
    });
    
    if (result.success) {
      console.log('✅ APC40 registration successful:', result.controller.name);
    } else {
      console.error('❌ APC40 registration failed:', result.error);
      return;
    }
    
    // Test 2: Connection Status
    console.log('Test 2: Checking connection status...');
    const status = apc40Integration.getConnectionStatus();
    console.log('Connection Status:', status);
    
    // Test 3: Setup Drum Machine Integration
    console.log('Test 3: Setting up drum machine integration...');
    apc40Integration.setupDrumMachineIntegration({
      onStepToggle: (step: number, intensity: number) => {
        console.log(`🥁 Step toggle: Step ${step}, Intensity ${intensity}`);
      },
      onTransportControl: (command: string) => {
        console.log(`⏯️ Transport control: ${command}`);
      },
      onConnectionChange: (connected: boolean, deviceName?: string) => {
        console.log(`🔗 Connection change: ${connected ? 'Connected' : 'Disconnected'}${deviceName ? ' - ' + deviceName : ''}`);
      },
    });
    
    // Test 4: Sequencer State Update
    console.log('Test 4: Testing sequencer state update...');
    const testSequencerState = {
      currentStep: 2,
      isPlaying: true,
      tempo: 120,
      pattern: [
        [true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
      ],
      trackCount: 2,
    };
    
    apc40Integration.updateSequencerState(testSequencerState);
    console.log('✅ Sequencer state updated');
    
    // Test 5: Get Debug Info
    console.log('Test 5: Getting debug information...');
    const debugInfo = apc40Integration.getDebugInfo();
    console.log('Debug Info:', debugInfo);
    
    console.log('🎉 Manual APC40 test completed successfully!');
    console.log('');
    console.log('Instructions:');
    console.log('1. Connect your APC40 via USB');
    console.log('2. Ensure you are on HTTPS or localhost');
    console.log('3. Press buttons on the APC40 grid to see step toggle events');
    console.log('4. Press transport controls (Play/Stop/Rec) to see transport events');
    console.log('5. Check the hardware status indicator in the UI');
    
  } catch (error) {
    console.error('❌ Manual APC40 test failed:', error);
  }
}

// Export test function globally for easy browser console access
if (typeof window !== 'undefined') {
  window.testAPC40 = testAPC40Integration;
  window.apc40Integration = apc40Integration;
  
  console.log('APC40 Manual Test loaded!');
  console.log('Run window.testAPC40() in console to start the test');
}

export { testAPC40Integration };