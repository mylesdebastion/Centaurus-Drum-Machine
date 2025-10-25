# Epic 18 - WLED Routing System Test Scenarios

**Epic:** Epic 18 - Intelligent WLED Visualization Routing
**Testing Philosophy:** Manual browser-based verification (human-in-the-loop)
**Last Updated:** 2025-10-19

---

## Overview

This document outlines 6 comprehensive test scenarios for validating the WLED routing system end-to-end. All tests are **manual** and designed for browser-based verification using Chrome DevTools.

---

## Test Environment Setup

### Prerequisites
- Development server running at `localhost:5173`
- Chrome DevTools open (F12)
- Network tab enabled (for monitoring WLED HTTP requests)
- Console visible (for debug logging)

### Optional Hardware
- 1x WLED device (2D grid, e.g., 6x25 LEDs)
- 1x WLED device (1D strip, e.g., 90 LEDs)

**Note:** Tests can be executed without physical hardware using Console logging and Network tab monitoring.

---

## Scenario 1: Drum Machine + Audio Reactive (Overlay)

### Objective
Verify that Audio Reactive module overlays on top of Drum Machine visualization with correct additive blending.

### Setup Steps
1. Navigate to `/wled-manager`
2. Add a test device:
   ```
   Name: Test Grid
   IP: 192.168.1.100
   Type: 2D Grid
   Width: 6, Height: 25
   Serpentine: true
   Supported Visualizations: step-sequencer-grid, midi-trigger-ripple
   ```
3. Navigate to Drum Machine module
4. Start playback
5. Open Audio Reactive module (if available)

### Expected Behavior
- **Routing Matrix:**
  - Primary: drum-machine → step-sequencer-grid
  - Overlay: audio-reactive → midi-trigger-ripple
- **Visual Output:**
  - Grid shows blue step sequencer pattern
  - White audio ripples overlay on note triggers
  - Blended colors visible (blue + white = cyan highlights)
- **Console Logs:**
  ```
  [LEDCompositor] Frame received from drum-machine
  [LEDCompositor] Blending 1 overlay onto primary frame
  [LEDCompositor] Frame sent to Test Grid (150 LEDs)
  ```
- **Network Tab:**
  - POST requests to `http://192.168.1.100/json/state`
  - Payload contains hex color array

### Verification Checklist
- [ ] Drum Machine shows step sequencer pattern
- [ ] Audio Reactive ripple overlays correctly
- [ ] Blended colors visible (additive composition)
- [ ] No performance degradation (60 FPS maintained)
- [ ] Console shows routing logs
- [ ] Network tab shows WLED HTTP requests

### Pass/Fail Criteria
- **Pass:** All checklist items verified
- **Fail:** Missing overlay, incorrect colors, or console errors

---

## Scenario 2: Guitar + Drum Machine (Device Switching)

### Objective
Verify that switching active module changes device assignment dynamically.

### Setup Steps
1. Ensure Test Grid from Scenario 1 is configured
2. Navigate to Drum Machine module
3. Start playback
4. In Console, run:
   ```javascript
   ledCompositor.debugPrintFrameRouting();
   ```
5. Switch to Guitar module
6. Run debug command again

### Expected Behavior (Drum Machine Active)
- **Routing Matrix:**
  - Primary: drum-machine → step-sequencer-grid
- **Console Output:**
  ```
  Device 1: Test Grid
  └─ Primary: drum-machine
     └─ Visualization: step-sequencer-grid
  ```

### Expected Behavior (Guitar Active)
- **Routing Matrix:**
  - Primary: guitar-fretboard → fretboard-grid
- **Console Output:**
  ```
  Device 1: Test Grid
  └─ Primary: guitar-fretboard
     └─ Visualization: fretboard-grid
  ```

### Verification Checklist
- [ ] Grid shows step sequencer when Drum Machine active
- [ ] Grid shows fretboard when Guitar active
- [ ] Transition happens within 200ms (smooth)
- [ ] No residual visualization from previous module
- [ ] GuitarGridExclusive rule removes overlays (if applicable)

### Pass/Fail Criteria
- **Pass:** Device assignment switches correctly
- **Fail:** Grid doesn't update, or shows mixed visualizations

---

## Scenario 3: Piano Roll + Audio Reactive (1D Strip Fallback)

### Objective
Verify that Piano Roll falls back to 1D strip when no 2D grid is available.

### Setup Steps
1. Remove any existing 2D grid devices
2. Add 1D strip device:
   ```
   Name: Piano Strip
   IP: 192.168.1.101
   Type: 1D Strip
   LED Count: 88
   Supported Visualizations: piano-keys, midi-trigger-ripple
   ```
3. Navigate to Piano Roll module
4. Play notes on virtual piano keyboard

### Expected Behavior
- **Routing Matrix:**
  - Primary: piano-roll → piano-keys (1D fallback)
  - Overlay: audio-reactive → midi-trigger-ripple
- **Console Logs:**
  ```
  [VisualizationRoutingMatrix] Piano Roll using 1D fallback (piano-keys)
  [LEDCompositor] Converting piano-keys to 1D strip (88 LEDs)
  ```

### Verification Checklist
- [ ] Piano Roll uses piano-keys visualization (1D)
- [ ] PianoRoll1DFallback rule applied
- [ ] Audio Reactive overlays on strip
- [ ] 88 LEDs map correctly to piano keys
- [ ] Note triggers produce visual feedback

### Pass/Fail Criteria
- **Pass:** Piano Roll works on 1D strip with fallback
- **Fail:** No visualization or console errors about missing 2D device

---

## Scenario 4: All Modules Active (Complex Routing)

### Objective
Verify routing algorithm assigns devices correctly when multiple modules compete.

### Setup Steps
1. Add 2 devices:
   - Grid: 6x25 2D grid
   - Strip: 90 LED 1D strip
2. Register all modules (simulate by loading each module page):
   - Drum Machine
   - Guitar Fretboard
   - Piano Roll
   - Audio Reactive
3. In Console, run:
   ```javascript
   routingMatrix.setActiveModule('guitar-fretboard');
   routingMatrix.debugPrintRouting();
   ```

### Expected Behavior
- **Routing Matrix:**
  - Device 1 (Grid): guitar-fretboard (active) → fretboard-grid
  - Device 2 (Strip): piano-roll → piano-keys (1D fallback)
  - Overlay on both: audio-reactive → midi-trigger-ripple
- **Console Output:**
  ```
  Device 1: Test Grid (6x25)
  └─ Primary: guitar-fretboard (active module bonus)
     └─ Visualization: fretboard-grid
     └─ Overlays: audio-reactive

  Device 2: Piano Strip (90 LEDs)
  └─ Primary: piano-roll
     └─ Visualization: piano-keys
     └─ Overlays: audio-reactive
  ```

### Verification Checklist
- [ ] Active module (Guitar) gets best device (Grid)
- [ ] Non-active modules assigned to remaining devices
- [ ] Audio Reactive overlays on all devices
- [ ] No device has conflicting visualizations
- [ ] Routing updates when active module changes

### Pass/Fail Criteria
- **Pass:** Devices assigned optimally, no conflicts
- **Fail:** Incorrect assignments or missing overlays

---

## Scenario 5: Device Hot-Swap (Connection Loss & Recovery)

### Objective
Verify system handles device disconnection/reconnection gracefully.

### Setup Steps
1. Configure Test Grid device
2. Start Drum Machine playback
3. Manually turn off WLED device (or disconnect power)
4. Wait 5 seconds
5. Turn device back on
6. Observe console and network tab

### Expected Behavior (Device Offline)
- **Console Logs:**
  ```
  [LEDCompositor] Failed to send frame to Test Grid: Network request failed
  [LEDCompositor] Device Test Grid marked as offline (3 failed attempts)
  ```
- **Network Tab:**
  - POST requests to device show "Failed to fetch" error
  - System continues running (no crash)

### Expected Behavior (Device Back Online)
- **Console Logs:**
  ```
  [LEDCompositor] Frame sent to Test Grid (150 LEDs)
  [WLEDDeviceRegistry] Device Test Grid reconnected
  ```
- **Network Tab:**
  - POST requests succeed again

### Verification Checklist
- [ ] System continues running when device offline
- [ ] Error logged with clear message ("Connection failed")
- [ ] Device re-enabled when connection restored
- [ ] No memory leaks from failed requests (check Performance tab)
- [ ] User sees device status in UI (if implemented)

### Pass/Fail Criteria
- **Pass:** System resilient to device loss/recovery
- **Fail:** App crashes or stops routing frames

---

## Scenario 6: Multi-User Jam Session (Shared Device Registry)

### Objective
Verify devices are shared across jam session participants via Supabase Realtime.

### Setup Steps
1. Open browser window #1 (Desktop)
2. Open browser window #2 (Incognito mode, simulate iPad)
3. In Window #1:
   - Navigate to `/wled-manager`
   - Add Test Grid device
4. In Window #2:
   - Navigate to `/wled-manager`
   - Observe device list

### Expected Behavior
- **Window #1 (Desktop):**
  - Device added successfully
  - Console: `[WLEDDeviceRegistry] Device created: Test Grid`
- **Window #2 (iPad):**
  - Device appears in list within 200ms
  - Console: `[WLEDDeviceRegistry] Realtime update: device_created`

### Verification Checklist
- [ ] Device added by User A appears on User B's screen within 200ms
- [ ] Each user's active module controls their local routing
- [ ] Devices shared (same registry), routing independent
- [ ] No conflicts (User A uses Drum Machine, User B uses Guitar)
- [ ] Real-time updates working for both users

### Pass/Fail Criteria
- **Pass:** Devices sync across sessions in <200ms
- **Fail:** Device doesn't appear, or sync takes >1 second

---

## Debug Commands

Use these Console commands for debugging during tests:

```javascript
// Print registered modules
ledCompositor.debugPrintCapabilities();

// Print routing table
routingMatrix.debugPrintRouting();

// Print routing rules
routingMatrix.debugPrintRules();

// Print frame routing table
ledCompositor.debugPrintFrameRouting();

// Get all devices
wledDeviceRegistry.getDevices();

// Set active module
routingMatrix.setActiveModule('drum-machine');
```

---

## Performance Benchmarks

Expected performance metrics (measured via Chrome Performance tab):

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Routing decision time | <10ms | `performance.now()` around `routingMatrix.calculateAssignments()` |
| Frame submission latency | <2ms | Console log in `LEDCompositor.routeFrame()` |
| Realtime sync latency | <200ms | Timestamp diff between Window #1 and Window #2 |
| Memory usage overhead | <100MB | Chrome Performance Monitor |

---

## Common Issues & Troubleshooting

### Issue: "No routing assignments"
- **Cause:** No devices configured or modules not registered
- **Solution:** Check `wledDeviceRegistry.getDevices()` and `ledCompositor.debugPrintCapabilities()`

### Issue: "Device not responding"
- **Cause:** WLED device offline or IP incorrect
- **Solution:** Verify device IP via browser (`http://192.168.1.100`)

### Issue: "Overlays not blending"
- **Cause:** Overlay module not submitting frames
- **Solution:** Check Console for frame submission logs from overlay module

### Issue: "Performance issues (dropped frames)"
- **Cause:** Frame routing taking >2ms
- **Solution:** Check Console warnings for slow frame conversion

---

## Test Execution Tracking

| Scenario | Tester | Date | Result | Notes |
|----------|--------|------|--------|-------|
| 1. Drum Machine + Audio Reactive | - | - | - | - |
| 2. Guitar + Drum Machine Switch | - | - | - | - |
| 3. Piano Roll 1D Fallback | - | - | - | - |
| 4. All Modules Active | - | - | - | - |
| 5. Device Hot-Swap | - | - | - | - |
| 6. Multi-User Jam Session | - | - | - | - |

---

## Conclusion

All 6 scenarios validate critical paths of the WLED routing system:
- Overlay blending (Scenario 1)
- Dynamic routing updates (Scenario 2)
- Fallback mechanisms (Scenario 3)
- Complex multi-module routing (Scenario 4)
- Connection resilience (Scenario 5)
- Real-time synchronization (Scenario 6)

**Next Steps:** Execute tests manually, document results, file bugs for any failures.
