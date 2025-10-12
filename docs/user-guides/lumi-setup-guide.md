# ROLI Piano M / LUMI Keys Setup Guide

**Welcome!** This guide will help you connect your ROLI Piano M (LUMI Keys) to Centaurus Drum Machine for visual music learning.

---

## What You'll Need

- ✅ **ROLI Piano M** or **LUMI Keys** (any version)
- ✅ **USB cable** or **Bluetooth connection**
- ✅ **ROLI Dashboard** app (free download from [roli.com](https://roli.com))
- ✅ **Chrome or Edge browser** (WebMIDI support required)

---

## Quick Start (5 Minutes)

### Step 1: Connect Your LUMI

**Via USB (Recommended):**
1. Plug LUMI into your computer with USB cable
2. Turn on LUMI (power button on side)
3. LUMI LEDs will light up when connected

**Via Bluetooth:**
1. Turn on LUMI
2. Press and hold the Bluetooth button (until flashing)
3. Open computer Bluetooth settings
4. Connect to "LUMI Keys" or "Piano M"

---

### Step 2: Enable LUMI in Centaurus

1. Open **Centaurus Drum Machine** in Chrome or Edge
2. Go to **Settings** → **Hardware** → **LUMI Integration**
3. Click **"Auto-Detect LUMI"**
4. You should see: **"🟢 LUMI Connected!"**

---

### Step 3: Test the Connection

1. Click **"Test Connection"** button
2. All LUMI keys should light up in a rainbow pattern
3. If successful, you're ready to use basic features!

---

## Basic Features (No Script Required)

These features work right away using SysEx commands:

### ✅ Scale Highlighting
- LUMI lights up only notes in your current scale
- Root note shows in a different color (white by default)
- Change scales in Piano Roll and LUMI updates automatically

### ✅ Color Modes
Choose from 4 built-in color modes:
- **Mode 1**: Rainbow colors
- **Mode 2**: Single color (customizable)
- **Mode 3**: Piano (white/black key coloring)
- **Mode 4**: Night mode (dim)

### ✅ Scale & Key Sync
- When you change scale/key in Centaurus, LUMI updates
- Major, Minor, Chromatic, Pentatonic, and more!

---

## Advanced Features (Requires Script)

For **full per-key color control** and **custom color schemes**, install our LittleFoot script:

### Why Install the Script?

**Without script:**
- ⚪ All scale notes show the same color
- ⚪ Physical key presses show white
- ⚪ Limited to 2 color slots (primary + root)

**With script:**
- 🟢 Each key can have its own unique color
- 🟢 Chromatic color mode (12 colors for 12 semitones)
- 🟢 Harmonic color mode (colors based on musical intervals)
- 🟢 All keys start black, light up when played
- 🟢 MIDI input lights up keys in colors

---

### Installing the LittleFoot Script

#### Step 1: Download the Script

1. In **Centaurus Settings** → **LUMI Integration**
2. Click **"Download Advanced Script"**
3. Save `centaurus-lumi-colors.littlefoot` to your Downloads folder

---

#### Step 2: Open ROLI Dashboard

1. Launch **ROLI Dashboard** app
2. Connect your LUMI (should appear in Dashboard)
3. You'll see a visual representation of your LUMI keyboard

![ROLI Dashboard](https://via.placeholder.com/800x400?text=ROLI+Dashboard+Screenshot)

---

#### Step 3: Upload the Script

1. **Find the .littlefoot file** in your Downloads folder
2. **Drag and drop** the file onto the LUMI keyboard image in Dashboard
3. You'll see a progress bar as the script uploads
4. Wait for **"Upload Complete"** message (usually 5-10 seconds)

![Drag and Drop](https://via.placeholder.com/600x300?text=Drag+and+Drop+Animation)

---

#### Step 4: Verify Installation

1. Go back to **Centaurus Drum Machine**
2. In **LUMI Settings**, click **"Test Advanced Features"**
3. You should see:
   - All keys turn black
   - Middle C lights up white when you click "Test C"
   - D lights up cyan when you click "Test D"

✅ **Success!** You now have full color control.

---

## Using Color Schemes

### Chromatic Color Scheme

**Best for:** Visualizing all 12 notes equally

Each semitone gets its own color:
- C = Red
- C# = Orange
- D = Yellow
- D# = Green
- E = Cyan
- F = Blue
- F# = Purple
- G = Magenta
- G# = Pink
- A = Light Blue
- A# = Lime
- B = White

**How to enable:**
1. Settings → LUMI → Color Scheme
2. Select **"Chromatic"**
3. Play any note to see the color

---

### Harmonic Color Scheme

**Best for:** Learning intervals and harmony

Colors based on interval from root note:
- **Root (1)** = White ⚪
- **Minor 2nd (♭2)** = Red 🔴
- **Major 2nd (2)** = Yellow 🟡
- **Minor 3rd (♭3)** = Orange 🟠
- **Major 3rd (3)** = Green 🟢
- **Perfect 4th (4)** = Cyan 🔵
- **Tritone (♭5)** = Dark Red 🔴
- **Perfect 5th (5)** = Blue 🔵
- **Minor 6th (♭6)** = Purple 🟣
- **Major 6th (6)** = Light Purple 💜
- **Minor 7th (♭7)** = Magenta 🟣
- **Major 7th (7)** = Pink 💗

**How to enable:**
1. Settings → LUMI → Color Scheme
2. Select **"Harmonic (Intervals)"**
3. Set your root note (e.g., C)
4. All colors are relative to root

**Example:** If root is C:
- C = White (root)
- E = Green (major 3rd)
- G = Blue (perfect 5th)

---

## Troubleshooting

### LUMI Not Detected

**Problem:** "LUMI not found" message

**Solutions:**
1. ✅ Check USB cable is connected
2. ✅ Turn LUMI on (power button)
3. ✅ Try a different USB port
4. ✅ Close other apps using MIDI (DAWs, ROLI Dashboard)
5. ✅ Refresh the browser tab
6. ✅ Try Bluetooth instead of USB (or vice versa)

---

### Colors Don't Match

**Problem:** LUMI shows different colors than expected

**Solutions:**
1. ✅ Make sure you installed the LittleFoot script
2. ✅ Check color scheme setting (Chromatic vs. Harmonic)
3. ✅ Verify root note is set correctly
4. ✅ Click "Test Connection" to verify script is loaded

---

### Keys Stay Lit / Won't Turn Off

**Problem:** Keys stay on when they should be off

**Solutions:**
1. ✅ Click "Clear All Notes" in LUMI settings
2. ✅ Send MIDI All Notes Off (in settings)
3. ✅ Restart ROLI Dashboard
4. ✅ Re-upload the LittleFoot script

---

### Physical Keys Show Wrong Color

**Problem:** Playing LUMI physically shows different colors than MIDI input

**Solutions:**
1. ✅ This is expected with the **default LUMI program**
2. ✅ Install the **Centaurus LittleFoot script** for consistent colors
3. ✅ Physical presses will then match your color scheme

---

### Script Upload Failed

**Problem:** Error uploading LittleFoot script in ROLI Dashboard

**Solutions:**
1. ✅ Update ROLI Dashboard to latest version
2. ✅ Update LUMI firmware (in Dashboard settings)
3. ✅ Try re-downloading the script file
4. ✅ Make sure file extension is `.littlefoot` (not `.txt`)

---

## Restoring Default LUMI Behavior

Want to go back to the default ROLI colors?

### Option 1: Via ROLI Dashboard
1. Open **ROLI Dashboard**
2. Click your LUMI device
3. Click **"Reset to Factory Default"**
4. Script will be removed, default program restored

### Option 2: Via Centaurus
1. Settings → LUMI Integration
2. Click **"Restore LUMI Defaults"**
3. Confirms action and resets LUMI

---

## FAQ

### Does this work with multiple LUMI blocks?

**Current version:** Single 24-key block
**Future:** We're planning support for 2-3 daisy-chained blocks!

### Can I use LUMI with other apps at the same time?

**No** - Only one app can control LUMI LEDs at a time. Close ROLI Dashboard and other MIDI apps before using Centaurus.

### Does this drain LUMI battery faster?

**Minimal impact** - LED updates use very little power. You may notice 5-10% faster drain during heavy use.

### Can I create custom color schemes?

**Future feature** - Coming in v2.2! For now, choose between Chromatic and Harmonic.

### What browsers are supported?

**Supported:**
- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Brave
- ✅ Opera

**Not Supported:**
- ❌ Firefox (no WebMIDI API)
- ❌ Safari (limited WebMIDI support)

### Do I need ROLI Dashboard installed?

**For basic features:** No
**For advanced features (script):** Yes, to upload the LittleFoot script

---

## Video Tutorials

### Quick Start (3 minutes)
> 📺 *Coming soon!*

### Advanced Script Installation (5 minutes)
> 📺 *Coming soon!*

### Color Schemes Explained (7 minutes)
> 📺 *Coming soon!*

---

## Getting Help

**Need more assistance?**

- 📖 [LUMI Features Guide](./lumi-features.md)
- 💬 [Community Discord](https://discord.gg/centaurus)
- 📧 [Email Support](mailto:support@centaurus-drum-machine.com)
- 🐛 [Report a Bug](https://github.com/centaurus/issues)

---

## What's Next?

Now that LUMI is set up:

1. Try the **Piano Roll** with LUMI sync enabled
2. Change scales and watch LUMI update
3. Experiment with **Chromatic vs. Harmonic** color schemes
4. Use LUMI to learn **intervals** and **chord tones**

**Happy music making!** 🎵

---

*Last updated: January 2025*
*Centaurus Drum Machine v2.0*
