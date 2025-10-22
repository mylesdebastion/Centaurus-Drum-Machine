# WLED Routing System Developer Guide

**Epic:** Epic 18 - Intelligent WLED Visualization Routing
**Target Audience:** Module developers, contributors
**Last Updated:** 2025-10-19

---

## Overview

The WLED Routing System automatically routes module visualizations to appropriate LED devices based on capabilities, context, and routing rules. This system eliminates manual device management and enables intelligent overlay composition.

---

## Quick Start

### 1. Add Module Capability Declaration

Create a capability file in `src/capabilities/`:

```typescript
// src/capabilities/myModuleCapability.ts
import { ModuleVisualizationCapability } from '@/types/visualization';

export const myModuleCapability: ModuleVisualizationCapability = {
  moduleId: 'my-module',
  produces: [
    {
      type: 'step-sequencer-grid', // Visualization type
      dimensionPreference: '2D',    // 1D, 2D, or 'either'
      overlayCompatible: false,     // Can overlay on other visualizations?
      priority: 10,                 // Higher = takes precedence (1-100)
    },
  ],
};
```

### 2. Register Module on Mount

In your React component:

```typescript
// src/components/MyModule/MyModule.tsx
import React from 'react';
import { ledCompositor } from '@/services/LEDCompositor';
import { myModuleCapability } from '@/capabilities/myModuleCapability';

export const MyModule: React.FC = () => {
  // Register module capability
  React.useEffect(() => {
    ledCompositor.registerModule(myModuleCapability);
    console.log('[MyModule] Registered with LEDCompositor');

    return () => {
      ledCompositor.unregisterModule('my-module');
      console.log('[MyModule] Unregistered from LEDCompositor');
    };
  }, []);

  // ... rest of component
};
```

### 3. Generate and Submit Frames

Generate LED frames in your module's generic format:

```typescript
// Generate frame (generic format: RGB bytes)
const frame = generateMyModuleFrame(state);

// Submit to LEDCompositor (automatic routing)
ledCompositor
  .submitFrameWithRouting({
    moduleId: 'my-module',
    pixelData: frame, // Uint8ClampedArray (RGB)
    timestamp: Date.now(),
  })
  .catch((error) => {
    console.error('[MyModule] Failed to submit frame:', error);
  });
```

### 4. Implement Frame Generation Function

Example for a step sequencer (6 tracks × 16 steps):

```typescript
function generateMyModuleFrame(
  tracks: Track[],
  activeStep: number
): Uint8ClampedArray {
  const numTracks = 6;
  const numSteps = 16;
  const frame = new Uint8ClampedArray(numTracks * numSteps * 3); // RGB

  for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
    for (let step = 0; step < numSteps; step++) {
      const pixelIndex = (trackIndex * numSteps + step) * 3;

      // Determine pixel color
      const isActive = tracks[trackIndex].steps[step];
      const isCurrentStep = step === activeStep;

      if (isCurrentStep && isActive) {
        // Bright color for active step
        frame[pixelIndex] = 255;     // R
        frame[pixelIndex + 1] = 255; // G
        frame[pixelIndex + 2] = 255; // B
      } else if (isActive) {
        // Blue for notes
        frame[pixelIndex] = 0;       // R
        frame[pixelIndex + 1] = 100; // G
        frame[pixelIndex + 2] = 255; // B
      } else {
        // Black for empty
        frame[pixelIndex] = 0;
        frame[pixelIndex + 1] = 0;
        frame[pixelIndex + 2] = 0;
      }
    }
  }

  return frame;
}
```

---

## Architecture Layers

### Layer 1: WLED Device Registry

**Purpose:** Persistent storage of LED hardware configuration

**Service:** `WLEDDeviceRegistry` (`src/services/WLEDDeviceRegistry.ts`)

**Storage:** Supabase `wled_devices` table

**Key Features:**
- Real-time sync across clients (Supabase Realtime)
- Row-Level Security (RLS) policies
- Device capability metadata (1D/2D, supported visualizations)

**API:**
```typescript
// Get all devices
const devices = await wledDeviceRegistry.getDevices();

// Create device
await wledDeviceRegistry.createDevice({
  name: 'My Grid',
  ip: '192.168.1.100',
  capabilities: {
    dimensions: '2D',
    ledCount: 150,
    gridConfig: { width: 6, height: 25, serpentine: true, orientation: 'horizontal' },
    supportedVisualizations: ['step-sequencer-grid'],
  },
});

// Update device
await wledDeviceRegistry.updateDevice(deviceId, { brightness: 200 });

// Delete device
await wledDeviceRegistry.deleteDevice(deviceId);
```

### Layer 2: Module Capability Declarations

**Purpose:** Modules declare what visualizations they can produce

**Interface:** `ModuleVisualizationCapability` (`src/types/visualization.ts`)

**Registration:** `LEDCompositor.registerModule()`

**Example:**
```typescript
export const drumMachineCapability: ModuleVisualizationCapability = {
  moduleId: 'drum-machine',
  produces: [
    {
      type: 'step-sequencer-grid',
      dimensionPreference: '2D',
      overlayCompatible: false,
      priority: 10,
    },
    {
      type: 'step-sequencer-1d', // Fallback for 1D devices
      dimensionPreference: '1D',
      overlayCompatible: false,
      priority: 8,
    },
  ],
};
```

### Layer 3: Visualization Routing Matrix

**Purpose:** Intelligent routing algorithm (assigns modules to devices)

**Class:** `VisualizationRoutingMatrix` (`src/services/VisualizationRoutingMatrix.ts`)

**Algorithm:**
1. Calculate compatibility scores (module × device)
2. Apply routing rules (active module priority, guitar grid exclusive, etc.)
3. Assign primary modules to devices
4. Assign overlay modules

**Key Methods:**
```typescript
// Get current routing assignments
const assignments = routingMatrix.getCurrentAssignments();

// Set active module (gets priority in routing)
routingMatrix.setActiveModule('drum-machine');

// Debug routing table
routingMatrix.debugPrintRouting();
```

**DeviceAssignment Structure:**
```typescript
interface DeviceAssignment {
  device: WLEDDevice;
  primary: {
    moduleId: ModuleId;
    visualizationType: VisualizationType;
    compatibilityScore: number; // 0-100
  };
  overlays: Array<{
    moduleId: ModuleId;
    visualizationType: VisualizationType;
  }>;
}
```

### Layer 4: Routing Rules Engine

**Purpose:** Context-aware routing behaviors

**Interface:** `RoutingRule` (`src/services/routing-rules/`)

**Built-in Rules:**
- **ActiveModulePriorityRule:** Active module gets best device (+20 score)
- **GuitarGridExclusiveRule:** Guitar on 2D grid = no overlays
- **DrumMachineGridTakeoverRule:** Drum machine prefers 2D grids (+15 score)
- **PianoRoll1DFallbackRule:** Piano roll falls back to 1D if no 2D available
- **AudioReactiveOverlayRule:** Audio reactive always overlays (never primary)
- **GenericFallbackRule:** Fallback to generic-color-array if no match

**Creating Custom Rules:**
```typescript
// src/services/routing-rules/MyCustomRule.ts
import { RoutingRule } from '@/types/visualization';

export const myCustomRule: RoutingRule = {
  name: 'MyCustomRule',
  description: 'My custom routing logic',
  priority: 50, // Higher = applied first

  apply(assignments, devices, modules, context) {
    // Modify assignments based on your logic
    // Example: Boost score for specific module/device combo
    assignments.forEach((assignment) => {
      if (assignment.primary.moduleId === 'my-module' && assignment.device.name === 'My Favorite Device') {
        assignment.primary.compatibilityScore += 25;
      }
    });

    return assignments;
  },
};
```

**Register Custom Rule:**
```typescript
import { routingMatrix } from '@/services/VisualizationRoutingMatrix';
import { myCustomRule } from '@/services/routing-rules/MyCustomRule';

routingMatrix.registerRule(myCustomRule);
```

### Layer 5: LEDCompositor Integration

**Purpose:** Frame submission and routing orchestration

**Service:** `LEDCompositor` (`src/services/LEDCompositor.ts`)

**Key Features:**
- Frame submission with automatic routing
- Device-specific frame conversion (1D/2D adaptation)
- Overlay blending (additive composition)
- WLED HTTP API integration

**API:**
```typescript
// Submit frame for automatic routing
await ledCompositor.submitFrameWithRouting({
  moduleId: 'my-module',
  pixelData: frame, // Generic RGB format
  timestamp: Date.now(),
});

// Debug frame routing table
ledCompositor.debugPrintFrameRouting();
```

**Frame Conversion:**
LEDCompositor automatically converts generic frames to device-specific formats:

| Visualization Type | Generic Format | 1D Device | 2D Device |
|--------------------|---------------|-----------|-----------|
| step-sequencer-grid | 6×16 RGB grid | Map to strip (6 sections) | Center-align on grid |
| step-sequencer-1d | 6×16 RGB grid | Direct copy | N/A |
| piano-keys | 88 RGB pixels | Direct copy | N/A |
| fretboard-grid | 6×N RGB grid | N/A | Map to grid |
| midi-trigger-ripple | Ripple state | Generate ripple on strip | Generate ripple on grid |
| generic-color-array | RGB array | Scale to fit | Scale to fit |

---

## Common Patterns

### Pattern 1: Exclusive Visualization (e.g., Drum Machine)

**Use Case:** Module needs full device (no overlays)

```typescript
{
  type: 'step-sequencer-grid',
  dimensionPreference: '2D',
  overlayCompatible: false, // Exclusive (no overlays)
  priority: 10,
}
```

### Pattern 2: Overlay Visualization (e.g., Audio Reactive)

**Use Case:** Module overlays on top of other visualizations

```typescript
{
  type: 'midi-trigger-ripple',
  dimensionPreference: 'either', // Works on 1D or 2D
  overlayCompatible: true,       // Can overlay on anything
  priority: 3,                   // Low priority (background effect)
}
```

### Pattern 3: Fallback Visualization

**Use Case:** Module has preferred visualization + fallback

```typescript
produces: [
  {
    type: 'piano-keys',
    dimensionPreference: '1D', // Preferred
    overlayCompatible: false,
    priority: 10,
  },
  {
    type: 'note-trigger-flash',
    dimensionPreference: 'either', // Fallback
    overlayCompatible: true,
    priority: 5,
  },
]
```

### Pattern 4: Multi-Device Support

**Use Case:** Module can produce multiple visualizations simultaneously

```typescript
produces: [
  {
    type: 'step-sequencer-grid',
    dimensionPreference: '2D',
    overlayCompatible: false,
    priority: 10,
  },
  {
    type: 'step-sequencer-1d',
    dimensionPreference: '1D',
    overlayCompatible: false,
    priority: 8,
  },
]
```

---

## Debugging

### Debug Commands

Run these in Browser Console (F12):

```javascript
// Print registered modules
ledCompositor.debugPrintCapabilities();

// Print routing table
routingMatrix.debugPrintRouting();

// Print registered rules
routingMatrix.debugPrintRules();

// Print frame routing table
ledCompositor.debugPrintFrameRouting();

// Get all devices
wledDeviceRegistry.getDevices().then(console.log);

// Set active module
routingMatrix.setActiveModule('drum-machine');

// Check if module is registered
ledCompositor.isModuleRegistered('my-module');
```

### Common Issues

#### Issue: Module not routing to any device

**Symptoms:** No frames sent, no console logs

**Diagnosis:**
```javascript
// Check if module registered
ledCompositor.isModuleRegistered('my-module');

// Check devices configured
wledDeviceRegistry.getDevices().then(console.log);

// Check routing assignments
routingMatrix.getCurrentAssignments();
```

**Solutions:**
- Ensure module calls `ledCompositor.registerModule()` on mount
- Verify devices are configured in WLED Manager
- Check device `enabled` flag is `true`

#### Issue: Wrong device assigned

**Symptoms:** Module routed to unexpected device

**Diagnosis:**
```javascript
// Print routing with compatibility scores
routingMatrix.debugPrintRouting();
```

**Solutions:**
- Adjust module priority (higher = takes precedence)
- Change dimension preference (`'1D'`, `'2D'`, `'either'`)
- Check routing rules (may be modifying scores)

#### Issue: Overlays not blending

**Symptoms:** Overlay module not visible

**Diagnosis:**
```javascript
// Check if overlay module is submitting frames
ledCompositor.debugPrintFrameRouting();
```

**Solutions:**
- Ensure overlay module calls `submitFrameWithRouting()` regularly
- Verify `overlayCompatible: true` in module capability
- Check console for overlay frame submission logs

#### Issue: Performance issues (dropped frames)

**Symptoms:** Console warnings about slow frame routing

**Diagnosis:**
```javascript
// Check frame routing duration
// Console: "[LEDCompositor] Frame routing took 5.23ms (target: <2ms)"
```

**Solutions:**
- Optimize frame generation function
- Reduce frame submission rate (e.g., 30 FPS instead of 60 FPS)
- Simplify conversion logic in LEDCompositor

---

## Best Practices

### 1. Always Unregister on Unmount

```typescript
React.useEffect(() => {
  ledCompositor.registerModule(myModuleCapability);

  return () => {
    ledCompositor.unregisterModule('my-module');
  };
}, []);
```

### 2. Use Generic Frame Format

Modules should generate frames in a generic format (not device-specific):

```typescript
// ✅ GOOD: Generic 6x16 grid
const frame = new Uint8ClampedArray(6 * 16 * 3);

// ❌ BAD: Device-specific 6x25 grid
const frame = new Uint8ClampedArray(6 * 25 * 3);
```

### 3. Handle Submission Errors

```typescript
ledCompositor
  .submitFrameWithRouting(frame)
  .catch((error) => {
    console.error('[MyModule] Frame submission failed:', error);
  });
```

### 4. Optimize Frame Generation

```typescript
// Cache frame buffer (reuse instead of allocating new)
const frameBuffer = new Uint8ClampedArray(6 * 16 * 3);

function generateFrame(state) {
  // Modify frameBuffer in-place
  for (let i = 0; i < frameBuffer.length; i++) {
    frameBuffer[i] = /* calculate pixel */;
  }

  return frameBuffer;
}
```

### 5. Log Debug Info

```typescript
React.useEffect(() => {
  ledCompositor.registerModule(myModuleCapability);

  console.log(`[MyModule] Registered with LEDCompositor`);
  console.log(`[MyModule] Produces: ${myModuleCapability.produces.map(p => p.type).join(', ')}`);

  // ...
}, []);
```

---

## Further Reading

- **Architecture:** [WLED Visualization Routing](../architecture/wled-visualization-routing.md)
- **Epic 18 PRD:** [Epic 18 - Intelligent WLED Routing](../prd/epic-18-intelligent-wled-routing.md)
- **User Guide:** [WLED Manager User Guide](./wled-manager-user-guide.md)
- **Test Scenarios:** [Epic 18 Test Scenarios](../testing/epic-18-test-scenarios.md)

---

## Examples

### Complete Module Integration Example

```typescript
// src/capabilities/simpleSequencerCapability.ts
import { ModuleVisualizationCapability } from '@/types/visualization';

export const simpleSequencerCapability: ModuleVisualizationCapability = {
  moduleId: 'simple-sequencer',
  produces: [
    {
      type: 'step-sequencer-grid',
      dimensionPreference: '2D',
      overlayCompatible: false,
      priority: 8,
    },
  ],
};

// src/components/SimpleSequencer/SimpleSequencer.tsx
import React from 'react';
import { ledCompositor } from '@/services/LEDCompositor';
import { simpleSequencerCapability } from '@/capabilities/simpleSequencerCapability';

export const SimpleSequencer: React.FC = () => {
  const [pattern, setPattern] = React.useState(/* ... */);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Register module
  React.useEffect(() => {
    ledCompositor.registerModule(simpleSequencerCapability);
    return () => ledCompositor.unregisterModule('simple-sequencer');
  }, []);

  // Submit frames
  React.useEffect(() => {
    if (!isPlaying) return;

    const frame = generateSequencerFrame(pattern, currentStep);

    ledCompositor
      .submitFrameWithRouting({
        moduleId: 'simple-sequencer',
        pixelData: frame,
        timestamp: Date.now(),
      })
      .catch(console.error);
  }, [isPlaying, currentStep, pattern]);

  return (
    <div>
      {/* Sequencer UI */}
    </div>
  );
};

function generateSequencerFrame(
  pattern: boolean[][],
  activeStep: number
): Uint8ClampedArray {
  const frame = new Uint8ClampedArray(6 * 16 * 3);

  // Generate visualization
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 16; col++) {
      const index = (row * 16 + col) * 3;
      const isActive = pattern[row][col];
      const isCurrentStep = col === activeStep;

      if (isCurrentStep && isActive) {
        frame[index] = 255;
        frame[index + 1] = 255;
        frame[index + 2] = 255;
      } else if (isActive) {
        frame[index] = 0;
        frame[index + 1] = 150;
        frame[index + 2] = 255;
      }
    }
  }

  return frame;
}
```

---

**Questions?** See [Troubleshooting Guide](../troubleshooting/wled-routing.md) or file an issue on GitHub.
