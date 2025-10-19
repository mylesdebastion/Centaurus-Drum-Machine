# WLED Visualization Routing System

**Architecture Document**
**Date:** 2025-10-18
**Architect:** Winston
**Status:** APPROVED - Epic 18 Implementation Pending

---

## Executive Summary

The **Visualization Routing System** is an intelligent middleware layer that automatically routes module visualizations to physical WLED hardware based on device capabilities, module requirements, and context-aware rules.

**Core Principle:** *"Configure hardware once, visualize any module automatically"*

---

## System Architecture

### High-Level Flow

```
[Modules] → [Visualization Routing Matrix] → [WLED Device Registry] → [Physical LEDs]
   ↓              ↓                               ↓
Piano Roll    Intelligence Layer            6x25 Grid (saved to DB)
DrumMachine   (Capability Matching)         90-LED Strip (saved to DB)
Guitar        (Overlay Rules)               144-LED Strip (saved to DB)
Audio         (Priority System)
```

---

## Layer 1: WLED Device Registry

**Purpose:** Persistent storage of physical LED hardware configuration (Supabase)

### Device Capabilities Model

```typescript
interface WLEDDevice {
  // Identity
  id: string;
  name: string;
  ip: string;

  // Physical Capabilities
  capabilities: {
    dimensions: '1D' | '2D';           // Strip vs Grid
    ledCount: number;                   // 1D: total LEDs, 2D: width * height
    gridConfig?: {                      // Only for 2D
      width: number;                    // e.g., 6 strings
      height: number;                   // e.g., 25 frets
      serpentine: boolean;
      orientation: 'horizontal' | 'vertical';
    };

    // Supported visualization types
    supportedVisualizations: VisualizationType[];
  };

  // User Configuration
  location?: string;                    // "Stage Left", "Behind Drums", etc.
  priority?: number;                    // For conflict resolution

  // Connection
  enabled: boolean;
  brightness: number;
  reverseDirection: boolean;
}
```

### Supported Visualization Types

```typescript
type VisualizationType =
  | 'piano-keys'           // 1D: Piano key mapping
  | 'step-sequencer-1d'    // 1D: Step pattern (16 steps across strip)
  | 'step-sequencer-grid'  // 2D: Multi-track sequencer
  | 'fretboard-grid'       // 2D: Guitar fretboard (6 rows, variable columns)
  | 'midi-trigger-ripple'  // 1D/2D: Audio reactive ripple
  | 'audio-spectrum'       // 1D: Frequency spectrum bars
  | 'note-trigger-flash'   // 1D/2D: Flash on MIDI note
  | 'generic-color-array'; // 1D/2D: Direct color array (fallback)
```

### Persistence

**Storage:** Supabase `wled_devices` table
**Accessibility:** Shared across jam session participants
**Benefits:**
- Configure once on desktop, accessible from iPad
- Device registry synced in real-time via Supabase Realtime
- No device re-configuration required per session

---

## Layer 2: Module Visualization Declarations

**Purpose:** Each module declares visualization capabilities it can produce

### Module Capability Interface

```typescript
interface ModuleVisualizationCapability {
  moduleId: 'drum-machine' | 'piano-roll' | 'guitar-fretboard' | 'audio-reactive';

  // What visualizations can this module produce?
  produces: {
    type: VisualizationType;
    dimensionPreference: '1D' | '2D' | 'either';
    overlayCompatible: boolean;  // Can this overlay other visualizations?
    priority: number;             // Higher = takes precedence
  }[];

  // Generate visualization data
  generateVisualization(
    type: VisualizationType,
    device: WLEDDevice,
    state: ModuleState
  ): LEDFrame;
}
```

### Example Module Declarations

#### DrumMachine
```typescript
const drumMachineViz: ModuleVisualizationCapability = {
  moduleId: 'drum-machine',
  produces: [
    {
      type: 'step-sequencer-1d',
      dimensionPreference: '1D',
      overlayCompatible: false,  // Exclusive
      priority: 10
    },
    {
      type: 'step-sequencer-grid',
      dimensionPreference: '2D',
      overlayCompatible: false,  // Exclusive - shows full grid
      priority: 10
    },
    {
      type: 'midi-trigger-ripple',
      dimensionPreference: 'either',
      overlayCompatible: true,   // Can overlay on anything
      priority: 5
    }
  ]
};
```

#### Guitar Fretboard
```typescript
const guitarFretboardViz: ModuleVisualizationCapability = {
  moduleId: 'guitar-fretboard',
  produces: [
    {
      type: 'fretboard-grid',
      dimensionPreference: '2D',
      overlayCompatible: false,
      priority: 10
    },
    {
      type: 'step-sequencer-1d',  // Fallback for 1D strips
      dimensionPreference: '1D',
      overlayCompatible: false,
      priority: 8  // Lower priority than drum machine
    }
  ]
};
```

#### Audio Reactive
```typescript
const audioReactiveViz: ModuleVisualizationCapability = {
  moduleId: 'audio-reactive',
  produces: [
    {
      type: 'midi-trigger-ripple',
      dimensionPreference: 'either',
      overlayCompatible: true,   // ALWAYS overlays
      priority: 3  // Low priority, background effect
    },
    {
      type: 'audio-spectrum',
      dimensionPreference: '1D',
      overlayCompatible: true,
      priority: 3
    }
  ]
};
```

---

## Layer 3: Visualization Routing Matrix

**Purpose:** Intelligent routing algorithm to match modules to devices

### Routing Algorithm

```typescript
class VisualizationRoutingMatrix {
  /**
   * Smart routing algorithm
   *
   * 1. Match device capabilities to module outputs
   * 2. Apply priority system (active module wins)
   * 3. Handle overlays (audio reactive can layer)
   * 4. Resolve conflicts (fallback to compatible viz)
   */
  routeVisualizations(): DeviceAssignment[] {
    const assignments: DeviceAssignment[] = [];

    for (const device of this.devices) {
      // Step 1: Find all compatible modules
      const compatibleModules = this.findCompatibleModules(device);

      // Step 2: Sort by priority
      const sorted = compatibleModules.sort((a, b) => b.priority - a.priority);

      // Step 3: Assign primary visualization
      const primary = sorted[0];

      // Step 4: Add overlays (if compatible)
      const overlays = sorted.slice(1).filter(m => m.overlayCompatible);

      assignments.push({
        device,
        primary,
        overlays
      });
    }

    return assignments;
  }
}
```

### Compatibility Scoring

```typescript
/**
 * Calculate compatibility score for conflict resolution
 */
private calculateCompatibility(
  viz: VisualizationType,
  device: WLEDDevice
): number {
  let score = 0;

  // Perfect dimension match
  if (viz.dimensionPreference === device.capabilities.dimensions) {
    score += 100;
  }
  // Can work with either
  else if (viz.dimensionPreference === 'either') {
    score += 50;
  }

  // Device explicitly supports this viz type (bonus)
  if (device.capabilities.supportedVisualizations.includes(viz.type)) {
    score += 50;
  }

  return score;
}
```

---

## Layer 4: Routing Rules Engine

**Purpose:** Context-aware routing behaviors

### Rule Structure

```typescript
interface RoutingRule {
  name: string;
  condition: (context: RoutingContext) => boolean;
  action: (context: RoutingContext) => DeviceAssignment;
}
```

### Example Rules

```typescript
const routingRules: RoutingRule[] = [
  {
    name: 'Active Module Priority',
    condition: (ctx) => ctx.activeModule !== null,
    action: (ctx) => {
      // Active module gets best-matching device
      return assignBestDevice(ctx.activeModule, ctx.availableDevices);
    }
  },

  {
    name: 'Guitar Grid Exclusive',
    condition: (ctx) => ctx.activeModule === 'guitar-fretboard' && hasGridDevice(ctx),
    action: (ctx) => {
      // Guitar fretboard gets the 6x25 grid exclusively
      const gridDevice = findDevice(ctx, { width: 6, height: 25 });
      return { device: gridDevice, primary: 'fretboard-grid', overlays: [] };
    }
  },

  {
    name: 'Drum Machine Grid Takeover',
    condition: (ctx) => ctx.activeModule === 'drum-machine' && hasGridDevice(ctx),
    action: (ctx) => {
      // Same grid now shows 6 tracks x 25 steps
      const gridDevice = findDevice(ctx, { width: 6, height: 25 });
      return { device: gridDevice, primary: 'step-sequencer-grid', overlays: [] };
    }
  },

  {
    name: 'Audio Reactive Overlay',
    condition: (ctx) => isAudioReactiveEnabled(ctx),
    action: (ctx) => {
      // Audio reactive overlays on ALL devices
      return ctx.assignments.map(a => ({
        ...a,
        overlays: [...a.overlays, 'midi-trigger-ripple']
      }));
    }
  },

  {
    name: 'Piano Roll 1D Fallback',
    condition: (ctx) => ctx.activeModule === 'piano-roll' && !hasGridDevice(ctx),
    action: (ctx) => {
      // Piano Roll uses 1D strip as piano keys
      const stripDevice = findDevice(ctx, { dimensions: '1D', ledCount: 88 });
      return { device: stripDevice, primary: 'piano-keys', overlays: [] };
    }
  },

  {
    name: 'Generic Fallback',
    condition: (ctx) => true, // Always matches (lowest priority)
    action: (ctx) => {
      // Any module can output generic color array to any device
      return { device: ctx.device, primary: 'generic-color-array', overlays: [] };
    }
  }
];
```

---

## LEDCompositor Integration

### Extended API

```typescript
class LEDCompositor {
  // ... existing code ...

  // NEW: Register module visualizers
  registerModule(capability: ModuleVisualizationCapability) {
    this.routingMatrix.addModule(capability);
  }

  // NEW: Auto-route on frame submission
  submitFrame(frame: LEDFrame) {
    // Get routing assignments
    const assignments = this.routingMatrix.routeVisualizations();

    // Generate and send frames to assigned devices
    for (const assignment of assignments) {
      const primaryFrame = assignment.primary.generateVisualization(
        assignment.visualization.type,
        assignment.device,
        this.moduleState
      );

      // Layer overlays
      for (const overlay of assignment.overlays) {
        const overlayFrame = overlay.generateVisualization(/* ... */);
        primaryFrame = this.blendFrames(primaryFrame, overlayFrame);
      }

      // Send to physical device
      this.sendToWLED(assignment.device, primaryFrame);
    }
  }
}
```

---

## User Experience Flow

### Initial Setup (Once)
1. User opens **WLED Manager**
2. Adds physical devices:
   - "Stage Left Strip" - 90 LEDs, 1D
   - "Fretboard Grid" - 6x25 LEDs, 2D, Horizontal
   - "Piano Strip" - 88 LEDs, 1D
3. Configuration **saved to Supabase** (accessible from all devices)
4. User never needs to configure again ✅

### Jam Session (Automatic Routing)

**Scenario 1: Drum Machine**
- Routing Matrix detects active module
- "Fretboard Grid" → Shows 6 tracks x 25 steps
- "Stage Left Strip" → Shows 16 steps spread across LEDs

**Scenario 2: Guitar Fretboard**
- Routing Matrix detects module change
- "Fretboard Grid" → Shows guitar frets (6 strings x 25 frets)
- "Stage Left Strip" → Shows active string notes (1D fallback)

**Scenario 3: Audio Reactive Enabled**
- Routing Matrix detects overlay capability
- All devices → MIDI trigger ripple **overlaid** on existing visualizations
- Guitar fretboard stays visible, ripples on note hits ✨

**Scenario 4: Piano Roll**
- "Piano Strip" → Shows 88 piano keys
- "Fretboard Grid" → Fallback to MIDI note triggers (2D grid of notes)
- "Stage Left Strip" → Fallback to audio spectrum

**Zero manual configuration. Everything just works.** ✅

---

## Database Schema

### Supabase Table: wled_devices

```sql
CREATE TABLE wled_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  capabilities JSONB NOT NULL,
  location TEXT,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  brightness INTEGER DEFAULT 204,  -- 0-255
  reverse_direction BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Users can only see their own devices
ALTER TABLE wled_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON wled_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON wled_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON wled_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON wled_devices FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Implementation Plan

### Phase 1: Core Infrastructure
**Files:**
- `src/services/VisualizationRoutingMatrix.ts` - Smart routing logic
- `src/services/WLEDDeviceRegistry.ts` - Persistent device storage
- `src/types/visualization.ts` - Type definitions

### Phase 2: Module Integration
**Pattern:**
```typescript
// Each module registers capabilities on mount
useEffect(() => {
  ledCompositor.registerModule(drumMachineVisualization);
}, []);
```

### Phase 3: Supabase Persistence
- Create `wled_devices` table
- Implement RLS policies
- Add Realtime subscriptions for device sync

### Phase 4: UI Component
```tsx
<WLEDManager>
  <DeviceList devices={devices} />
  <RoutingStatus assignments={currentAssignments} />
</WLEDManager>
```

---

## Benefits

### For Users
- ✅ **Configure hardware once, use everywhere**
- ✅ **Automatic routing** - no manual device selection
- ✅ **Intelligent fallbacks** - works even with mismatched hardware
- ✅ **Seamless switching** - change modules, visualizations adapt

### For Developers
- ✅ **Module isolation** - modules don't know about devices
- ✅ **Type-safe** - visualization capabilities declared explicitly
- ✅ **Testable** - routing logic independent of hardware
- ✅ **Extensible** - add new modules/devices without breaking existing

### For Jam Sessions
- ✅ **Shared device registry** - all participants see same LEDs
- ✅ **Automatic sync** - remote iPad controls local desktop LEDs
- ✅ **Bandwidth efficient** - devices stored in DB, not sent every frame

---

## Key Design Decisions

### ✅ Why Capability-Based Routing?
- **Flexible:** Modules declare what they can do, system figures out how
- **Extensible:** Add new modules without changing routing logic
- **Intelligent:** Automatic fallbacks when perfect match unavailable

### ✅ Why Persistent Device Registry?
- **Configure Once:** User sets up hardware, never touches again
- **Multi-Device:** Saved to Supabase, accessible from iPad/Desktop
- **Zero Friction:** New modules "just work" with existing hardware

### ✅ Why Overlay System?
- **Audio Reactive:** Can enhance any visualization
- **MIDI Triggers:** Flash on top of existing patterns
- **Composable:** Stack multiple effects naturally

### ✅ Why Rules Engine?
- **Smart Defaults:** "Guitar module → guitar grid" automatic
- **Context-Aware:** Routing changes based on active module
- **Maintainable:** Add new rules without refactoring

---

## Next Steps

See **Epic 18: Intelligent WLED Visualization Routing** for implementation stories.

**Estimated Effort:** 8-12 hours for complete system
