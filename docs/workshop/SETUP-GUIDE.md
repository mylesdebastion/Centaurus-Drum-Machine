# WORKSHOP SETUP - QUICK START GUIDE

**Workshop Date:** Wednesday (2 days)
**Duration:** 1 min intro + 15 min activity
**Students:** 6 deaf K5-10 students
**Setup:** 6 WLED tubes + Boomwhackers + Laptop

---

## ⏰ BEFORE STUDENTS ARRIVE (15 min setup)

### Step 1: Power Setup
1. ✅ Plug in 6 WLED tubes (check colored tape labels)
   - Tube 1: Red (Kick)
   - Tube 2: Orange (Snare)
   - Tube 3: Yellow (Clap)
   - Tube 4: Green (Tom)
   - Tube 5: Blue (Hat)
   - Tube 6: Purple (Ride)
2. ✅ Plug in laptop charger
3. ✅ Verify each tube powers on (LED indicator light)

### Step 2: WiFi Setup
1. ✅ Connect laptop to WiFi network: **[YOUR_WIFI_NAME]**
2. ✅ Wait 30 seconds for WLED tubes to auto-connect
3. ✅ Check tube WiFi indicators:
   - **Green light = Connected**
   - Red/flashing = Not connected (check WiFi settings)

### Step 3: Start Software
1. ✅ Open Terminal (Mac) or Command Prompt (Windows)
2. ✅ Navigate to project:
   ```bash
   cd /path/to/Centaurus-Drum-Machine
   ```
3. ✅ Run workshop startup script:
   ```bash
   # Mac/Linux
   ./education/workshop-start.sh

   # Windows
   education\workshop-start.bat
   ```
4. ✅ Wait for message: **"✅ WORKSHOP MODE READY"**
5. ✅ Browser should auto-open to: `http://localhost:5173/isometric`
   - If not, manually open browser and navigate to that URL

### Step 4: Verify LED Connection
1. ✅ Look at bottom of screen: **LEDStripManager** section
2. ✅ Verify 6 tubes show as **"Connected"** (green status)
3. ✅ Click **"Play"** button in sequencer
4. ✅ Watch each WLED tube light up with pattern
5. ✅ If tube not lighting:
   - Check power cable connected
   - Check WiFi indicator (should be green)
   - Restart tube (unplug/replug)
   - **If still failing:** Disable that tube, continue with 5 tubes

---

## 👥 STUDENT SETUP (5 min)

### Positioning
1. ✅ Line up 6 WLED tubes in a row (spaced 2-3 feet apart)
2. ✅ Place colored floor tape at each position
3. ✅ Assign 1 student per tube position
4. ✅ Give each student matching Boomwhacker:
   - Position 1 → Red Boomwhacker
   - Position 2 → Orange Boomwhacker
   - Position 3 → Yellow Boomwhacker
   - Position 4 → Green Boomwhacker
   - Position 5 → Blue Boomwhacker
   - Position 6 → Purple Boomwhacker

### Instructions (via interpreter)
1. ✅ **"Watch your tube. When it lights up, hit your Boomwhacker"**
2. ✅ Demonstrate first: Stand at Position 1, watch tube, hit on beat
3. ✅ Let students practice individually (turn on only 1 lane at a time)
4. ✅ Start pattern, all students play together

---

## 🎵 PATTERN SELECTION

### Pattern 1: Simple (Beginner)
- **Tempo:** 60 BPM (slow)
- **Active Lanes:** Lane 0 (Kick/Red) only
- **Pattern:** Quarter notes (steady beat)
- **Use for:** First-time students, confidence building

### Pattern 2: Call & Response (Intermediate)
- **Tempo:** 80 BPM
- **Active Lanes:** Lane 0 (Kick/Red) + Lane 1 (Snare/Orange)
- **Pattern:** Kick on 1,3 | Snare on 2,4
- **Use for:** Students who mastered Pattern 1

### Pattern 3: Full Beat (Advanced)
- **Tempo:** 100 BPM
- **Active Lanes:** All 6 lanes
- **Pattern:** Simple rock beat (all students play together)
- **Use for:** Final performance, group cohesion

### How to Load Patterns
1. Patterns are pre-loaded in `/isometric`
2. Use dropdown menu: "Workshop Pattern 1/2/3"
3. Click "Load Pattern"
4. Adjust tempo slider if needed
5. Click "Play"

---

## 🔧 TROUBLESHOOTING

### Problem: Tube Not Lighting
**Symptoms:** Tube powered on but not responding to pattern

**Solutions (try in order):**
1. ✅ Check tube WiFi indicator (green = connected)
2. ✅ Check LEDStripManager UI (tube should show "Connected")
3. ✅ Restart tube (unplug power, wait 5 seconds, replug)
4. ✅ Check IP address matches config (see tube label)
5. ✅ **If still failing:** Click "Disable" in LEDStripManager, continue with 5 tubes

### Problem: Sound Not Playing
**Symptoms:** Pattern running but no audio

**Solutions:**
1. ✅ Check laptop volume (set to 70%+)
2. ✅ Click Play/Pause button to restart audio engine
3. ✅ Refresh browser page (F5 or Cmd+R)
4. ✅ Check browser console for errors (F12 → Console tab)

### Problem: WebSocket Bridge Crashed
**Symptoms:** Message "WebSocket disconnected" or tubes stop responding

**Solutions:**
1. ✅ Close terminal window running bridge
2. ✅ Re-run startup script: `./education/workshop-start.sh`
3. ✅ Refresh browser page
4. ✅ Wait 10 seconds for tubes to reconnect

### Problem: Laptop WiFi Disconnected
**Symptoms:** All tubes show "Disconnected" status

**Solutions:**
1. ✅ Check laptop WiFi icon (ensure connected to correct network)
2. ✅ Reconnect to WiFi
3. ✅ Wait 30 seconds for tubes to auto-reconnect
4. ✅ **Backup:** Use phone hotspot, reconnect laptop + tubes to hotspot

### Problem: Sequencer Not Responding
**Symptoms:** Can't click buttons, pattern won't start

**Solutions:**
1. ✅ Refresh browser page (F5 or Cmd+R)
2. ✅ Check browser console for JavaScript errors (F12)
3. ✅ Restart entire setup (close terminal, re-run startup script)

---

## 🚨 EMERGENCY BACKUP PLAN

### If ALL Tech Fails (Worst Case Scenario)

**Option 1: Visual-Only Mode (No LEDs)**
1. Show students laptop screen with color-coded sequencer
2. Point to screen colors as pattern plays
3. Students watch screen, hit Boomwhackers when they see their color
4. Less engaging, but functional

**Option 2: Instructor-Led Call & Response**
1. Instructor calls out colors: **"Red! Orange! Yellow!"**
2. Students hit corresponding Boomwhacker on cue
3. Gradually speed up tempo
4. Students learn rhythm through verbal cues

**Option 3: Paper Activity (No Technology)**
1. Use pre-printed rhythm notation sheets
2. Color-code notes with markers (match Boomwhacker colors)
3. Students read paper, play rhythm together
4. Instructor taps tempo on desk

**Option 4: Pre-Recorded Video**
1. Show pre-recorded video of working WLED setup
2. Explain concept visually
3. Let students try Boomwhackers without LED feedback
4. Focus on feel/timing instead of visual cues

---

## 📦 EQUIPMENT CHECKLIST

### Required Items
- [ ] 6 WLED tubes (labeled with colors + IP addresses)
- [ ] 6 power cables for WLED tubes
- [ ] 1 power strip / extension cord
- [ ] Laptop (fully charged)
- [ ] Laptop charger
- [ ] 6 Boomwhackers (color-matched to tubes)
- [ ] Colored floor tape (mark student positions)
- [ ] Laminated setup guide (this document)
- [ ] Backup: Phone with hotspot capability
- [ ] Backup: Printed rhythm sheets (paper activity)
- [ ] Backup: Pre-recorded video of working setup

### Pre-Workshop Prep (Do at Home)
- [ ] Configure all 6 WLED tubes with static IPs (see TUBE-CONFIG.md)
- [ ] Test all tubes connect to laptop WiFi
- [ ] Load 3 workshop patterns in /isometric
- [ ] Print and laminate this guide
- [ ] Charge laptop to 100%
- [ ] Download offline copies of any web dependencies

---

## 🎯 SUCCESS CRITERIA

### Minimum Success (Acceptable)
- ✅ At least 4 WLED tubes working
- ✅ Students can see visual rhythm
- ✅ Students can follow and play basic pattern
- ✅ No catastrophic technical failures

### Target Success (Goal)
- ✅ All 6 WLED tubes working perfectly
- ✅ Students progress through all 3 patterns
- ✅ Students show visible engagement (smiling, asking to play again)
- ✅ Smooth transitions between students/patterns

### Stretch Success (Bonus)
- ✅ Students create their own simple patterns
- ✅ Students teach each other
- ✅ Positive feedback from teacher/interpreter
- ✅ Request for follow-up workshop

---

## 📸 DOCUMENTATION

### During Workshop
- [ ] Take photos of setup (for next time)
- [ ] Take photos of students engaged (with permission)
- [ ] Note which patterns worked best
- [ ] Note any technical issues encountered
- [ ] Note student feedback (via interpreter)

### After Workshop
- [ ] Document what worked / didn't work
- [ ] Update this guide with improvements
- [ ] Share photos/feedback with stakeholders
- [ ] Plan improvements for next workshop

---

## ⏱️ TIMELINE

### 2 Hours Before Workshop
- Arrive on-site with all equipment
- Set up WLED tubes in line
- Connect laptop to WiFi
- Run startup script
- Verify all tubes connect
- **Buffer time for troubleshooting**

### 15 Minutes Before Workshop
- Final verification (play test pattern)
- Position colored floor tape
- Organize Boomwhackers by color
- Keep laptop awake (disable sleep mode)
- Have pattern looping (students see it immediately)

### During Workshop (20 min total)
- **Min 0-1:** Introduction + demonstration
- **Min 1-5:** Student positioning + practice
- **Min 5-10:** Pattern 1 (simple)
- **Min 10-15:** Pattern 2 (call & response)
- **Min 15-20:** Pattern 3 (full beat) + celebration

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Your Name: [YOUR PHONE]
- Backup Tech: [BACKUP PERSON]

**Venue Contact:**
- School: [SCHOOL NAME]
- Contact: [CONTACT NAME]
- Phone: [SCHOOL PHONE]

**Emergency Restart:**
- If all else fails, restart laptop + re-run startup script (5 min)
- Have backup paper activity ready while restarting

---

**Good luck! You've got this! 🎉**

The tech is tested, the backup plans are solid, and the activity is simple enough to work even if things go wrong. Focus on the students' experience, not perfect technology.
