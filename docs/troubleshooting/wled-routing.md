# WLED Routing System Troubleshooting Guide

**Epic:** Epic 18 - Intelligent WLED Visualization Routing
**Last Updated:** 2025-10-19

---

## Common Issues

### Issue 1: "Device not responding"

**Symptoms:**
- Console error: `[LEDCompositor] Failed to send frame to [Device Name]: Network request failed`
- LEDs not lighting up
- Network tab shows failed POST requests

**Possible Causes:**
1. Device offline/powered off
2. Incorrect IP address
3. Network connectivity issue
4. WLED firmware not responding

**Diagnosis Steps:**
1. Open browser and navigate to device IP: `http://192.168.1.100`
2. If WLED web interface loads → IP is correct, device is online
3. If browser shows "Connection refused" → Device offline or IP wrong
4. Check Console Network tab for specific error:
   - `net::ERR_CONNECTION_REFUSED` → Device offline
   - `net::ERR_CONNECTION_TIMED_OUT` → Network issue or wrong IP
   - `net::ERR_NAME_NOT_RESOLVED` → Invalid IP format

**Solutions:**

**Solution 1: Verify Device IP**
```
1. Power cycle WLED device
2. Check router's DHCP leases for device IP
3. Update device IP in WLED Manager
4. Click "Test Connection"
```

**Solution 2: Check Network Configuration**
```
1. Ensure browser device and WLED device on same network
2. Ping device: Open terminal, run `ping 192.168.1.100`
3. If ping fails, check firewall/network settings
```

**Solution 3: Reset WLED Device**
```
1. Access WLED web interface
2. Settings → WiFi → Re-enter WiFi credentials
3. Settings → LED Preferences → Verify LED count
4. Reboot device
```

---

### Issue 2: "Routing not updating"

**Symptoms:**
- Switching modules doesn't change visualization
- Device shows stale/old visualization
- Console shows correct routing but LEDs don't update

**Possible Causes:**
1. Frame submission not happening
2. Module not registered
3. Caching issue in LEDCompositor
4. Routing matrix not recalculating

**Diagnosis Steps:**
1. Open Console (F12)
2. Run debug commands:
   ```javascript
   // Check registered modules
   ledCompositor.debugPrintCapabilities();

   // Check current routing
   routingMatrix.debugPrintRouting();

   // Check frame routing
   ledCompositor.debugPrintFrameRouting();
   ```
3. Look for module in capabilities list
4. Verify module is assigned to device in routing table

**Solutions:**

**Solution 1: Verify Module Registration**
```javascript
// Check if module is registered
ledCompositor.isModuleRegistered('drum-machine'); // Should return true

// If false, module didn't call registerModule()
// Check component's useEffect hook
```

**Solution 2: Force Routing Recalculation**
```javascript
// Manually trigger routing recalculation
routingMatrix.setActiveModule('drum-machine');
routingMatrix.debugPrintRouting();
```

**Solution 3: Clear Frame Cache**
```javascript
// Reload page to clear frame cache
location.reload();
```

---

### Issue 3: "Overlays not blending"

**Symptoms:**
- Overlay module (e.g., Audio Reactive) not visible
- Only primary visualization shows
- Console shows overlay assigned but not rendered

**Possible Causes:**
1. Overlay module not submitting frames
2. Overlay frame generation issue
3. Blending algorithm bug
4. Overlay frame cache miss

**Diagnosis Steps:**
1. Check Console for overlay frame submissions:
   ```
   [LEDCompositor] Frame received from audio-reactive
   ```
2. Run frame routing debug:
   ```javascript
   ledCompositor.debugPrintFrameRouting();
   ```
3. Look for overlay in "Overlays" section of routing table
4. Monitor Network tab for overlay frames (should see blended colors in hex payload)

**Solutions:**

**Solution 1: Verify Overlay Module Active**
```javascript
// Check if overlay module is registered and submitting frames
ledCompositor.isModuleRegistered('audio-reactive'); // Should return true

// If true but no frames, check module's frame generation logic
```

**Solution 2: Check Overlay Compatibility**
```javascript
// Verify overlay module has overlayCompatible: true
ledCompositor.debugPrintCapabilities();

// Look for:
// Module: audio-reactive
//   Produces:
//     1. midi-trigger-ripple
//        - Overlay: Yes
```

**Solution 3: Test Blending Manually**
```javascript
// In overlay module, add debug log
console.log('[AudioReactive] Submitting overlay frame', frame);

// Check if frame is being generated and submitted
```

---

### Issue 4: "Performance issues (dropped frames)"

**Symptoms:**
- Console warnings: `[LEDCompositor] Frame routing took 5.23ms (target: <2ms)`
- Stuttering/lag in LED visualization
- Browser performance tab shows high CPU usage

**Possible Causes:**
1. Frame conversion taking too long
2. Too many devices active
3. Network latency to WLED devices
4. Complex frame generation logic

**Diagnosis Steps:**
1. Open Chrome Performance tab (F12 → Performance)
2. Record 10 seconds of playback
3. Look for slow function calls in flame graph
4. Check Console for specific slow operations:
   ```
   [LEDCompositor] Frame routing took 8.41ms (target: <2ms)
   ```

**Solutions:**

**Solution 1: Optimize Frame Generation**
```javascript
// Cache frame buffer (reuse instead of allocate)
const frameBuffer = new Uint8ClampedArray(6 * 16 * 3);

function generateFrame(state) {
  // Modify in-place instead of creating new Uint8ClampedArray
  for (let i = 0; i < frameBuffer.length; i++) {
    frameBuffer[i] = /* calculate */;
  }
  return frameBuffer;
}
```

**Solution 2: Reduce Frame Rate**
```javascript
// Submit frames at 30 FPS instead of 60 FPS
useEffect(() => {
  if (!isPlaying) return;

  const interval = setInterval(() => {
    const frame = generateFrame(state);
    ledCompositor.submitFrameWithRouting(frame);
  }, 33); // 30 FPS (33ms per frame)

  return () => clearInterval(interval);
}, [isPlaying, state]);
```

**Solution 3: Disable Unused Devices**
```javascript
// In WLED Manager, disable devices not currently in use
// Or programmatically:
wledDeviceRegistry.updateDevice(deviceId, { enabled: false });
```

**Solution 4: Simplify Conversion Logic**
```javascript
// In LEDCompositor, optimize convertFrameToDevice()
// Use pre-calculated lookup tables for serpentine wiring
```

---

### Issue 5: "Module not routing to any device"

**Symptoms:**
- Module registered but no routing assignments
- Console: `[LEDCompositor] No routing assignments for [module-id]`
- LEDs stay off when module is active

**Possible Causes:**
1. No devices configured
2. Device doesn't support module's visualization type
3. Compatibility score too low
4. Device disabled

**Diagnosis Steps:**
1. Check devices:
   ```javascript
   wledDeviceRegistry.getDevices().then(console.log);
   ```
2. Check module capabilities:
   ```javascript
   ledCompositor.debugPrintCapabilities();
   ```
3. Check routing:
   ```javascript
   routingMatrix.debugPrintRouting();
   ```
4. Look for compatibility mismatch:
   ```
   Module produces: step-sequencer-grid (2D)
   Device supports: piano-keys (1D)
   → No match!
   ```

**Solutions:**

**Solution 1: Add Compatible Device**
```
1. Navigate to /wled-manager
2. Add device with matching visualization type
3. Example: Module produces "step-sequencer-grid" → Add 2D grid device
```

**Solution 2: Update Device Capabilities**
```
1. Edit existing device
2. Add module's visualization type to "Supported Visualizations"
3. Save device
```

**Solution 3: Add Fallback Visualization**
```typescript
// In module capability file, add fallback
export const myModuleCapability: ModuleVisualizationCapability = {
  moduleId: 'my-module',
  produces: [
    {
      type: 'my-primary-viz',
      dimensionPreference: '2D',
      overlayCompatible: false,
      priority: 10,
    },
    {
      type: 'generic-color-array', // Fallback
      dimensionPreference: 'either',
      overlayCompatible: true,
      priority: 5,
    },
  ],
};
```

---

### Issue 6: "Wrong visualization type displayed"

**Symptoms:**
- Device shows unexpected visualization
- Example: Grid shows 1D strip pattern instead of 2D grid
- Colors/pattern don't match expected output

**Possible Causes:**
1. Multiple modules competing for same device
2. Routing rules overriding expected behavior
3. Module priority incorrect
4. Active module not set

**Diagnosis Steps:**
1. Check routing table:
   ```javascript
   routingMatrix.debugPrintRouting();
   ```
2. Look for primary module assignment:
   ```
   Device 1: Test Grid
   └─ Primary: guitar-fretboard  // Expected: drum-machine?
   ```
3. Check routing rules:
   ```javascript
   routingMatrix.debugPrintRules();
   ```

**Solutions:**

**Solution 1: Set Active Module**
```javascript
// Set your module as active (gets priority boost)
routingMatrix.setActiveModule('drum-machine');
```

**Solution 2: Adjust Module Priority**
```typescript
// In module capability, increase priority
{
  type: 'step-sequencer-grid',
  dimensionPreference: '2D',
  overlayCompatible: false,
  priority: 50, // Increase from 10 to 50
}
```

**Solution 3: Check for Conflicting Rules**
```javascript
// Debug routing rules
routingMatrix.debugPrintRules();

// Look for rules that might override your module
// Example: GuitarGridExclusiveRule might be blocking overlays
```

---

## Debug Commands Reference

### LEDCompositor Commands

```javascript
// Print registered modules and their capabilities
ledCompositor.debugPrintCapabilities();

// Check if specific module is registered
ledCompositor.isModuleRegistered('drum-machine'); // Returns boolean

// Get specific module capability
ledCompositor.getModuleCapability('drum-machine');

// Get all module capabilities
ledCompositor.getAllModuleCapabilities();

// Print frame routing table (shows which frames are being sent where)
ledCompositor.debugPrintFrameRouting();
```

### Routing Matrix Commands

```javascript
// Print current routing assignments
routingMatrix.debugPrintRouting();

// Print registered routing rules
routingMatrix.debugPrintRules();

// Get current assignments programmatically
const assignments = routingMatrix.getCurrentAssignments();
console.log(assignments);

// Set active module
routingMatrix.setActiveModule('drum-machine');

// Get active module
const activeModule = routingMatrix.getActiveModule();
console.log('Active module:', activeModule);
```

### WLED Device Registry Commands

```javascript
// Get all devices
wledDeviceRegistry.getDevices().then(devices => {
  console.log('Devices:', devices);
});

// Get specific device by ID
wledDeviceRegistry.getDevice(deviceId).then(device => {
  console.log('Device:', device);
});

// Test device connection (programmatic)
fetch(`http://192.168.1.100/json/state`)
  .then(res => res.json())
  .then(data => console.log('Device online:', data))
  .catch(err => console.error('Device offline:', err));
```

---

## Error Messages

### `[LEDCompositor] Empty frame from [module-id]`

**Meaning:** Module submitted frame with no pixel data

**Fix:** Check frame generation function returns non-empty Uint8ClampedArray

---

### `[LEDCompositor] No routing assignments for [module-id]`

**Meaning:** Module not assigned to any device (no compatible devices)

**Fix:** Add compatible device or adjust module capabilities

---

### `[LEDCompositor] Frame routing took X.XXms (target: <2ms)`

**Meaning:** Frame conversion/routing is slow

**Fix:** Optimize frame generation or reduce frame rate

---

### `[VisualizationRoutingMatrix] No compatible devices for [module-id]`

**Meaning:** No devices support module's visualization types

**Fix:** Add device with matching supported_visualizations

---

### `[WLEDDeviceRegistry] Failed to send frame to [device-name]`

**Meaning:** HTTP request to WLED device failed

**Fix:** Check device IP, power, and network connectivity

---

## Performance Optimization Tips

### 1. Cache Frame Buffers

```javascript
// Reuse frame buffer instead of allocating new
const frameBuffer = new Uint8ClampedArray(6 * 16 * 3);
```

### 2. Reduce Frame Rate

```javascript
// 30 FPS instead of 60 FPS
setInterval(() => submitFrame(), 33); // 33ms = 30 FPS
```

### 3. Disable Unused Devices

```javascript
// Disable devices not currently needed
wledDeviceRegistry.updateDevice(deviceId, { enabled: false });
```

### 4. Use Lower Resolution Grids

```javascript
// 6x16 grid instead of 6x25
// Reduces pixel count → faster conversion
```

### 5. Simplify Frame Generation

```javascript
// Avoid complex calculations per pixel
// Pre-calculate color palettes
const colorPalette = [
  [255, 0, 0],   // Red
  [0, 255, 0],   // Green
  [0, 0, 255],   // Blue
];

// Use lookup instead of calculate
frame[i] = colorPalette[colorIndex][0]; // R
```

---

## How to Report Bugs

### 1. Gather Debug Info

```javascript
// Run these commands and save output
ledCompositor.debugPrintCapabilities();
routingMatrix.debugPrintRouting();
ledCompositor.debugPrintFrameRouting();
wledDeviceRegistry.getDevices().then(console.log);
```

### 2. Capture Console Errors

1. Open Console (F12)
2. Reproduce issue
3. Screenshot console errors (red text)

### 3. Record Network Tab

1. Open Network tab (F12 → Network)
2. Filter by "Fetch/XHR"
3. Reproduce issue
4. Screenshot failed requests (red text)

### 4. Create GitHub Issue

Include:
- **Title:** Short description (e.g., "WLED device not responding")
- **Steps to Reproduce:** Numbered steps to trigger issue
- **Expected Behavior:** What should happen
- **Actual Behavior:** What actually happens
- **Debug Output:** Console logs, network screenshots
- **Environment:** Browser version, OS, WLED firmware version

---

## Further Reading

- **Developer Guide:** [WLED Routing System](../guides/wled-routing-system.md)
- **User Guide:** [WLED Manager User Guide](../guides/wled-manager-user-guide.md)
- **Test Scenarios:** [Epic 18 Test Scenarios](../testing/epic-18-test-scenarios.md)

---

**Still Stuck?** File an issue on GitHub or ask in Discord.
