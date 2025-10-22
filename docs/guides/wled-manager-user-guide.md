# WLED Manager User Guide

**Feature:** WLED Device Management & Automatic Routing
**Target Audience:** End users, musicians, performers
**Last Updated:** 2025-10-19

---

## Overview

The WLED Manager allows you to configure LED hardware once and have visualizations automatically route to the best devices based on what module you're using. No manual device selection needed!

**Key Benefits:**
- **Configure Once:** Add your WLED devices once, use across all modules
- **Automatic Routing:** System intelligently routes visualizations to appropriate devices
- **Multi-Device Support:** Use multiple LED devices simultaneously
- **Real-Time Sync:** Devices sync across jam session participants
- **Overlay Effects:** Audio reactive and other effects automatically layer on top

---

## Getting Started

### Step 1: Access WLED Manager

1. Navigate to `/wled-manager` in your browser
2. You'll see the WLED Device Manager interface

### Step 2: Add Your First Device

1. Click **"Add Device"** button
2. Fill out the device form:

**Basic Settings:**
- **Name:** Friendly name (e.g., "Stage Strip", "Fretboard Grid")
- **IP Address:** Device IP on your local network (e.g., `192.168.1.100`)
- **Location:** Optional physical location (e.g., "Stage Left", "Behind Drums")

**Hardware Configuration:**
- **Device Type:**
  - **1D Strip:** Linear LED strip
  - **2D Grid:** LED matrix/grid

**For 1D Strips:**
- **LED Count:** Total number of LEDs (e.g., 90)

**For 2D Grids:**
- **Width:** Number of columns (e.g., 6)
- **Height:** Number of rows (e.g., 25)
- **Serpentine Wiring:** Check if rows alternate direction (zig-zag wiring)
- **Orientation:** Horizontal (rows) or Vertical (columns)

**Supported Visualizations:**
Select which visualization types this device can display:
- `step-sequencer-grid` - Drum machine step sequencer (2D)
- `step-sequencer-1d` - Drum machine step sequencer (1D strip)
- `piano-keys` - Piano keyboard visualization (1D)
- `fretboard-grid` - Guitar fretboard (2D)
- `midi-trigger-ripple` - Audio reactive ripple effects (1D or 2D)
- `generic-color-array` - Generic fallback (any device)

**Display Settings:**
- **Priority:** Device preference (0-100, higher = preferred)
- **Brightness:** Global brightness (0-255)
- **Reverse Direction:** Flip LED order
- **Enabled:** Turn device on/off without deleting

3. Click **"Test Connection"** to verify device is reachable
4. Click **"Save Device"**

### Step 3: Start Using Modules

1. Navigate to any module (Drum Machine, Guitar, Piano, etc.)
2. Start playing
3. Your LED devices will automatically display the appropriate visualization!

---

## Understanding Automatic Routing

### How It Works

The system automatically routes visualizations to devices based on:

1. **Device Capabilities:** What visualizations the device supports
2. **Module Capabilities:** What visualizations the module produces
3. **Active Module:** Which module you're currently using gets priority
4. **Compatibility Scores:** System calculates best device for each module

### Example Scenarios

**Scenario 1: Drum Machine with 2D Grid**
- You have: 6×25 LED grid
- You're using: Drum Machine module
- System routes: `step-sequencer-grid` visualization to grid
- Result: Step sequencer pattern displayed on grid

**Scenario 2: Multiple Devices**
- You have: 6×25 grid + 90 LED strip
- You're using: Drum Machine + Audio Reactive
- System routes:
  - Grid: Drum Machine step sequencer (primary)
  - Strip: Drum Machine 1D version (primary)
  - Both: Audio Reactive ripple (overlay)
- Result: Both devices show drum pattern with audio overlays

**Scenario 3: Module Switching**
- You have: 6×25 grid
- You switch from Drum Machine to Guitar
- System automatically routes: Fretboard visualization to grid
- Result: Grid instantly switches to show guitar fretboard

---

## Device Management

### Editing Devices

1. Click **"Edit"** button on device card
2. Modify settings
3. Click **"Save Changes"**

### Testing Devices

1. Click **"Test Connection"** button
2. System sends test pattern to device
3. LEDs should light up (solid color or rainbow)
4. If test fails, check:
   - Device IP is correct
   - Device is powered on
   - Device is on same network as your computer

### Deleting Devices

1. Click **"Delete"** button on device card
2. Confirm deletion
3. Device removed from registry

**Warning:** Deleting a device also removes it for all jam session participants.

### Enabling/Disabling Devices

Use the **"Enabled"** toggle to temporarily disable a device without deleting it.

**Use Cases:**
- Debugging (isolate one device)
- Power saving (disable unused devices)
- Testing (compare with/without specific device)

---

## Multi-User Jam Sessions

### How Device Sharing Works

When you add a device in a jam session:
1. Device is stored in Supabase database
2. All session participants see the device within ~200ms
3. Each user's modules can use shared devices
4. Routing is independent per user (no conflicts)

### Example Workflow

**User A (Desktop):**
1. Adds "Stage Grid" device
2. Opens Drum Machine module
3. Stage Grid shows drum pattern

**User B (iPad):**
1. Sees "Stage Grid" appear in device list automatically
2. Opens Guitar module
3. Stage Grid shows guitar fretboard (independent routing)

**Result:** Both users can use same devices without conflicts.

---

## Troubleshooting

### Device Not Appearing in List

**Possible Causes:**
- Device not added yet
- Real-time sync issue

**Solutions:**
1. Refresh page
2. Check WLED Manager for device
3. Verify Supabase connection (Console: `wledDeviceRegistry.getDevices()`)

### Device Not Responding

**Possible Causes:**
- Device offline
- Incorrect IP address
- Network issue

**Solutions:**
1. Verify device IP via browser (`http://192.168.1.100`)
2. Check device is powered on
3. Ensure device is on same network
4. Run "Test Connection" to diagnose

### Visualization Not Showing

**Possible Causes:**
- Module not registered
- Device doesn't support visualization type
- Routing issue

**Solutions:**
1. Check device's "Supported Visualizations" includes module's type
2. Open Console (F12) and run: `ledCompositor.debugPrintFrameRouting()`
3. Verify module is registered: `ledCompositor.debugPrintCapabilities()`

### Wrong Colors/Pattern

**Possible Causes:**
- Brightness too low
- Serpentine wiring incorrect
- Reverse direction needed

**Solutions:**
1. Increase brightness slider
2. Toggle "Serpentine Wiring" checkbox
3. Toggle "Reverse Direction" checkbox

### Performance Issues (Lag/Stuttering)

**Possible Causes:**
- Too many devices
- Network latency
- Frame rate too high

**Solutions:**
1. Disable unused devices
2. Check network ping to device (should be <10ms)
3. Reduce visualization complexity (if possible)

---

## FAQ

### Q: How many devices can I add?

**A:** Unlimited. However, performance may degrade with >10 active devices sending frames simultaneously.

### Q: Can I use WLED devices from different manufacturers?

**A:** Yes! Any device running WLED firmware (v0.14.0+) is supported.

### Q: Do devices need to be on the same WiFi network?

**A:** Yes. Your browser must be able to reach the device's IP address via HTTP.

### Q: Can I use devices in different rooms/locations?

**A:** Yes, as long as they're on the same network. Use the "Location" field to organize them.

### Q: What happens if a device loses power during a session?

**A:** System gracefully handles connection loss. Frame submission will fail silently, and device will automatically reconnect when power is restored.

### Q: Can I prioritize certain devices?

**A:** Yes! Use the "Priority" slider (0-100). Higher priority devices are preferred for routing.

### Q: How do I clear all devices?

**A:** Delete devices individually. There's no "Clear All" button (safety feature).

---

## Advanced Features

### Device Identification Colors

Assign a color to each device for easy visual identification:

1. Edit device
2. Set "Assigned Color" (e.g., `#FF0000` for red)
3. Device card will show colored indicator

**Use Case:** Quickly identify devices in multi-device setups.

### Custom Visualizations

Add custom visualization types to "Supported Visualizations":

1. Edit device
2. Add new visualization type (must match module capability)
3. Save device

**Example:** `my-custom-pattern`

---

## Best Practices

### 1. Test Devices After Adding

Always click "Test Connection" after adding a device to verify it works.

### 2. Use Descriptive Names

Good names: `Stage Strip Left`, `Drum Riser Grid`, `Guitar Fretboard Matrix`

Bad names: `Device 1`, `LED`, `Test`

### 3. Set Correct Priorities

- Main display: Priority 80-100
- Secondary displays: Priority 50-79
- Background/ambient: Priority 0-49

### 4. Document Grid Configurations

For 2D grids, note physical wiring in "Location" field:

Example: `Stage Center - Serpentine, rows start bottom-left`

### 5. Disable Unused Devices

If a device is temporarily offline, disable it instead of deleting it.

---

## Example Setups

### Setup 1: Solo Performer (Minimal)

**Devices:**
- 1x 90 LED strip (`192.168.1.100`)

**Configuration:**
- Name: "Stage Strip"
- Type: 1D Strip
- LED Count: 90
- Supported: `step-sequencer-1d`, `piano-keys`, `midi-trigger-ripple`
- Priority: 100

**Usage:** Single strip displays all module visualizations in 1D format.

### Setup 2: Band Setup (Multi-Device)

**Devices:**
- 1x 6×25 grid (`192.168.1.100`) - Behind drum kit
- 1x 90 LED strip (`192.168.1.101`) - Stage edge
- 1x 300 LED strip (`192.168.1.102`) - Ceiling ambient

**Configuration:**
- Grid: Priority 100, supports `step-sequencer-grid`, `fretboard-grid`
- Stage Strip: Priority 80, supports `step-sequencer-1d`, `piano-keys`
- Ceiling Strip: Priority 50, supports `audio-spectrum`, `midi-trigger-ripple`

**Usage:** Grid shows main visualization, stage strip shows 1D fallback, ceiling strip shows ambient effects.

### Setup 3: Jam Session (Shared Devices)

**Devices (added by host):**
- 2x 6×25 grids (`192.168.1.100`, `192.168.1.101`)

**Users:**
- User A (Desktop): Uses Grid #1 for Drum Machine
- User B (iPad): Uses Grid #2 for Guitar
- User C (Laptop): Audio Reactive overlays on both grids

**Result:** All users share devices, independent routing.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Add new device (if implemented) |
| `Esc` | Close device form |
| `Ctrl+S` | Save device edits |

---

## Support

**Issues?** See [Troubleshooting Guide](../troubleshooting/wled-routing.md)

**Developer Questions?** See [WLED Routing System Developer Guide](./wled-routing-system.md)

**Bug Reports:** File an issue on GitHub

---

## Appendix: WLED Device Setup

### Flashing WLED Firmware

1. Download WLED firmware: https://kno.wled.ge/
2. Flash to ESP8266/ESP32 device via USB
3. Connect device to WiFi via WLED AP mode
4. Note device IP address

### Recommended WLED Settings

Access WLED web interface (`http://192.168.1.100`):

**Settings → WiFi:**
- Set static IP (recommended)
- Disable AP mode after setup

**Settings → LED Preferences:**
- Set correct LED count
- Select LED type (WS2812B, SK6812, etc.)
- Configure color order (GRB, RGB, etc.)

**Settings → Sync:**
- Disable E1.31/DDP/UDP sync (conflicts with HTTP API)

**Settings → Time:**
- Disable time-based effects

---

**Last Updated:** 2025-10-19
