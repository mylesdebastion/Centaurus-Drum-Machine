# EMERGENCY MANUAL COMMANDS - Workshop Day

**USE THIS IF:** Automated scripts fail, Claude Code unavailable, or you need step-by-step manual recovery.

**Philosophy:** Every automated step has a manual equivalent. This document is your insurance policy.

---

## 🚨 SCENARIO 1: Workshop Script Won't Run

**Symptom:** Double-clicking `education/workshop-start.bat` does nothing or shows errors.

### **Manual Startup (PowerShell)**

Open PowerShell (right-click Start → Windows PowerShell) and run these commands **in order**:

```powershell
# Step 1: Navigate to project directory
cd D:\Github\Centaurus-Drum-Machine

# Step 2: Verify you're in the right place
ls package.json  # Should show package.json exists

# Step 3: Start WLED WebSocket bridge (separate window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node scripts\wled-websocket-bridge.cjs"

# Step 4: Wait 5 seconds for bridge to start
Start-Sleep -Seconds 5

# Step 5: Start Vite dev server (current window)
npm run dev
```

**After server starts:**
- Open browser manually: Chrome or Edge
- Navigate to: `http://localhost:5173/isometric`
- Press **F11** for fullscreen

---

## 🚨 SCENARIO 2: WLED Tubes Won't Connect

**Symptom:** `/isometric` loads but WLED tubes stay dark or show "Disconnected" in LEDStripManager.

### **Manual WLED Connection Check**

```powershell
# Step 1: Verify laptop WiFi connection
ipconfig | Select-String "IPv4"
# Should show: 192.168.8.x or your mobile router's subnet

# Step 2: Test WLED device reachability (ping)
ping 192.168.8.151  # Replace with your tube's actual IP
ping 192.168.8.152
ping 192.168.8.153
# ... repeat for all 6 tubes

# Step 3: Test WLED HTTP API
curl http://192.168.8.151/json/info
# Should return JSON with device info

# Step 4: Test WebSocket connection
# Open browser DevTools (F12) → Console tab
# Run this JavaScript:
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('Bridge connected!');
ws.onerror = (e) => console.error('Bridge error:', e);
```

**If ping fails:**
- Power cycle the WLED tube (unplug, wait 5 seconds, replug)
- Wait 30 seconds for tube to reconnect to WiFi
- Check WLED WiFi indicator (should be solid, not blinking)

**If WebSocket fails:**
- Restart WLED bridge:
  ```powershell
  # Kill existing bridge process
  Get-Process -Name node | Where-Object {$_.MainWindowTitle -like "*wled*"} | Stop-Process

  # Restart bridge
  node scripts\wled-websocket-bridge.cjs
  ```

---

## 🚨 SCENARIO 3: Dev Server Won't Start (Port 5173 Already in Use)

**Symptom:** Error message: "Port 5173 is already in use"

### **Manual Port Check and Cleanup**

```powershell
# Step 1: Find what's using port 5173
netstat -ano | findstr :5173

# Step 2: Kill the process (replace PID with actual number from Step 1)
taskkill /PID <PID_NUMBER> /F

# Example:
# If netstat shows: TCP 0.0.0.0:5173 ... LISTENING 12345
# Run: taskkill /PID 12345 /F

# Step 3: Restart dev server
npm run dev
```

**Alternative: Use different port**

```powershell
# Edit vite.config.ts temporarily
# Change: server: { port: 5173 }
# To: server: { port: 5174 }

# Then navigate to: http://localhost:5174/isometric
```

---

## 🚨 SCENARIO 4: `/isometric` Shows Blank Screen or Errors

**Symptom:** Browser loads but shows white screen, black screen, or JavaScript errors.

### **Manual Troubleshooting Steps**

```powershell
# Step 1: Check browser console for errors
# Open DevTools: Press F12
# Go to Console tab
# Look for red error messages

# Step 2: Hard refresh to clear cache
# Press: Ctrl + Shift + R (Chrome/Edge)
# Or: Ctrl + F5

# Step 3: Clear all browser data
# Chrome: Ctrl + Shift + Delete
# Check: Cached images and files
# Time range: All time
# Click: Clear data

# Step 4: Verify server is actually running
curl http://localhost:5173
# Should return HTML content, not error

# Step 5: Check for build errors
npm run build
# Look for TypeScript errors or build failures
```

**If still broken:**
- Try different browser (Edge if using Chrome, vice versa)
- Check if `/` (home page) loads: `http://localhost:5173`
- If home loads but `/isometric` doesn't, there's a routing issue

---

## 🚨 SCENARIO 5: WLED Manager Not Showing Devices

**Symptom:** LEDStripManager component shows "No devices configured" or empty list.

### **Manual WLED Configuration (In-Browser)**

**Option A: Use existing WLED Manager UI**

1. Navigate to: `http://localhost:5173`
2. Look for "WLED Manager" or "Settings" button
3. Click "Add Device"
4. Enter IP manually: `192.168.8.151`
5. Repeat for all 6 tubes

**Option B: Edit localStorage directly**

Open browser DevTools (F12) → Console tab:

```javascript
// Create workshop WLED config
const wledConfig = {
  devices: [
    { id: 'tube1', ipAddress: '192.168.8.151', name: 'Kick (Red)', enabled: true, ledCount: 90 },
    { id: 'tube2', ipAddress: '192.168.8.152', name: 'Snare (Orange)', enabled: true, ledCount: 90 },
    { id: 'tube3', ipAddress: '192.168.8.153', name: 'Clap (Yellow)', enabled: true, ledCount: 90 },
    { id: 'tube4', ipAddress: '192.168.8.154', name: 'Tom (Green)', enabled: true, ledCount: 90 },
    { id: 'tube5', ipAddress: '192.168.8.155', name: 'Hat (Blue)', enabled: true, ledCount: 90 },
    { id: 'tube6', ipAddress: '192.168.8.156', name: 'Ride (Purple)', enabled: true, ledCount: 90 }
  ]
};

// Save to localStorage
localStorage.setItem('wled-devices', JSON.stringify(wledConfig));

// Reload page
location.reload();
```

---

## 🚨 SCENARIO 6: Workshop Config File Not Loading

**Symptom:** App starts but doesn't auto-load workshop settings from `education/workshop-config.json`.

### **Manual Config Check**

```powershell
# Step 1: Verify config file exists
ls education\workshop-config.json
# Should show file exists

# Step 2: Verify JSON is valid
Get-Content education\workshop-config.json | ConvertFrom-Json
# Should parse without errors

# Step 3: Check workshopMode flag
Get-Content education\workshop-config.json | Select-String "workshopMode"
# Should show: "workshopMode": true

# Step 4: Manually copy config to app
# Open: http://localhost:5173
# Open DevTools (F12) → Console
# Run this JavaScript:

fetch('/education/workshop-config.json')
  .then(r => r.json())
  .then(config => {
    console.log('Workshop config:', config);
    localStorage.setItem('wled-devices', JSON.stringify(config.tubes));
    localStorage.setItem('global-tempo', config.patterns.simple.tempo);
    location.reload();
  });
```

---

## 🚨 SCENARIO 7: APC40 Controller Not Detected

**Symptom:** APC40 connected via USB but not showing in app or buttons don't work.

### **Manual MIDI Check**

```powershell
# Step 1: Verify APC40 is recognized by Windows
# Open: Device Manager (devmgmt.msc)
# Expand: Sound, video and game controllers
# Look for: Akai APC40 or USB Audio Device

# Step 2: Check browser MIDI access
# Open DevTools (F12) → Console
# Run this JavaScript:

navigator.requestMIDIAccess().then(access => {
  console.log('MIDI Access granted!');
  console.log('Inputs:', Array.from(access.inputs.values()));
  console.log('Outputs:', Array.from(access.outputs.values()));
});

// Should show APC40 in inputs and outputs
```

**If APC40 not detected:**
- Unplug USB cable, wait 5 seconds, replug
- Try different USB port (USB 2.0 ports sometimes work better than 3.0)
- Restart browser after reconnecting
- Check if other MIDI software is using the APC40 (close Ableton, FL Studio, etc.)

**If detected but buttons don't work:**
- APC40 hardware mapping may be incomplete (Story 1.6 not finished)
- Use mouse/keyboard to program patterns instead
- APC40 is **nice-to-have**, not required for workshop

---

## 🚨 SCENARIO 8: Mobile Router IP Address Unknown

**Symptom:** You don't know the router's IP or subnet to configure WLED devices.

### **Find Router IP**

```powershell
# Step 1: Connect laptop to mobile router WiFi
# Step 2: Get laptop's network info
ipconfig

# Look for "Default Gateway" - this is the router IP
# Example output:
#   IPv4 Address: 192.168.8.100
#   Subnet Mask: 255.255.255.0
#   Default Gateway: 192.168.8.1  ← This is the router IP

# Step 3: Open router admin page
start http://192.168.8.1
# Common logins: admin/admin, admin/password, or printed on router
```

**Router Admin Panel:**
- Look for "DHCP Client List" or "Connected Devices"
- Find devices named "WLED" or "ESP" (WLED tubes)
- Note their IP addresses
- Optionally: Set static IP reservations (recommended)

---

## 🚨 SCENARIO 9: Nothing Works - Full Manual Recovery

**Symptom:** Complete failure, need to start from scratch.

### **Nuclear Option: Step-by-Step Manual Setup**

**Part 1: Get Server Running**

```powershell
# 1. Open PowerShell
# 2. Navigate to project
cd D:\Github\Centaurus-Drum-Machine

# 3. Start bridge manually (new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node scripts\wled-websocket-bridge.cjs"

# 4. Start dev server (wait 10 seconds between steps)
Start-Sleep -Seconds 10
npm run dev

# Wait for "Local: http://localhost:5173" message
```

**Part 2: Open Browser**

```powershell
# 5. Open Chrome in fullscreen
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --start-fullscreen http://localhost:5173/isometric

# If Chrome not found, try Edge:
# msedge --start-fullscreen http://localhost:5173/isometric
```

**Part 3: Configure WLED Manually (In Browser)**

1. Browser DevTools (F12) → Console
2. Paste and run:

```javascript
// Replace these IPs with your actual WLED tube IPs
const tubes = [
  '192.168.8.151',
  '192.168.8.152',
  '192.168.8.153',
  '192.168.8.154',
  '192.168.8.155',
  '192.168.8.156'
];

const config = {
  devices: tubes.map((ip, i) => ({
    id: `tube${i+1}`,
    ipAddress: ip,
    name: `Tube ${i+1}`,
    enabled: true,
    ledCount: 90,
    laneIndex: i
  }))
};

localStorage.setItem('wled-devices', JSON.stringify(config));
location.reload();
```

**Part 4: Test**

- After reload, `/isometric` should show 6-lane sequencer
- Click "Play" button
- WLED tubes should light up synchronized with sequencer
- If tubes don't light up, check [SCENARIO 2](#scenario-2-wled-tubes-wont-connect)

---

## 📋 Quick Reference Commands

**Common PowerShell Commands:**

```powershell
# Navigate to project
cd D:\Github\Centaurus-Drum-Machine

# Check current directory
pwd

# List files
ls

# Start dev server
npm run dev

# Start WLED bridge
node scripts\wled-websocket-bridge.cjs

# Kill process by port
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Get laptop IP
ipconfig | Select-String "IPv4"

# Ping WLED device
ping 192.168.8.151

# Test WLED API
curl http://192.168.8.151/json/info

# Open Chrome fullscreen
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --start-fullscreen http://localhost:5173/isometric
```

**Common Browser DevTools Commands (F12 → Console):**

```javascript
// Check MIDI access
navigator.requestMIDIAccess().then(a => console.log(Array.from(a.inputs.values())));

// Check localStorage
console.log(localStorage);
localStorage.clear(); // Clear all saved data

// Reload page
location.reload();

// Test WebSocket bridge
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

---

## 🎯 Workshop Day Emergency Checklist

**If things break during workshop:**

1. ☑ **Stay calm** - students will match your energy
2. ☑ **Check WLED tubes first** - power cycle if needed
3. ☑ **Refresh browser** - Ctrl + Shift + R (hard refresh)
4. ☑ **Restart WLED bridge** - close and reopen bridge window
5. ☑ **Activate backup plan** - see `EMERGENCY-BACKUP.md` Plan B (instructor-led, no tech)

**Phone-a-friend:**
- If Claude Code available: Ask for specific error troubleshooting
- If Claude Code unavailable: Use this document

---

## 💡 Pro Tips

**Before Workshop Day:**
- ✅ Print this document and laminate it
- ✅ Test every command in this document at least once
- ✅ Label WLED tubes with IP addresses (colored tape)
- ✅ Take photos of working setup (proof it works)
- ✅ Video record successful startup (visual reference)

**Workshop Day:**
- ✅ Arrive 30 minutes early to test setup
- ✅ Keep this document and `EMERGENCY-BACKUP.md` within reach
- ✅ Have backup activity ready (Plan B, no tech)
- ✅ Remember: Your energy matters more than perfect tech

---

**You've got this! 🎉**

Every possible failure scenario has a manual recovery path. Technology fails, but you have options.
