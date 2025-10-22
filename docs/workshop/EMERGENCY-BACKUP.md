# EMERGENCY BACKUP PLANS - WORKSHOP

**Purpose:** If technology completely fails, these are your fallback activities.

**Philosophy:** The goal is rhythm + color learning. LEDs are the best method, but NOT the only method.

---

## 🚨 SCENARIO 1: All WLED Tubes Fail

### Backup Plan A: Laptop Screen Visual (Moderate Engagement)

**Setup (2 minutes):**
1. Position laptop screen where all students can see
2. Open `/isometric` sequencer
3. Full-screen mode (F11)
4. Zoom in (Ctrl/Cmd +) so colors are large and visible

**Activity Flow:**
1. **Intro:** "Each color square is a drum sound"
2. **Demo:** Play pattern, point to screen colors as they light up
3. **Practice:** Students watch screen, hit Boomwhacker when they see their color
4. **Challenge:** Speed up tempo as students improve

**Pros:**
- No hardware dependencies (just laptop)
- Students still see visual rhythm
- Color-to-sound mapping intact

**Cons:**
- Less immersive (everyone shares one screen)
- Harder to see from back of group
- Loses individual tube tracking

**Engagement Level:** 6/10 (functional but not exciting)

---

### Backup Plan B: Instructor-Led Call & Response (High Engagement)

**Setup (1 minute):**
1. Organize Boomwhackers by color
2. Students sit in semi-circle
3. Instructor stands at front

**Activity Flow:**
1. **Intro:** "I'll call out colors, you play when you hear your color"
2. **Practice Round:** Call slow, one at a time:
   - "Red!" → Student 1 plays
   - "Orange!" → Student 2 plays
   - "Yellow!" → Student 3 plays
3. **Pattern Round:** Call in rhythm:
   - "Red, Orange, Red, Orange" (steady beat)
   - "Red, Yellow, Red, Yellow" (syncopation)
4. **Speed Round:** Increase tempo as students improve
5. **Challenge:** Students call colors to each other

**Pros:**
- Zero technology required
- High student engagement (interactive)
- Builds listening/attention skills
- Easy to adapt to student skill level

**Cons:**
- Loses visual feedback component
- Relies on verbal cues (may challenge deaf students)
- Instructor must maintain energy/tempo

**Engagement Level:** 8/10 (interactive and fun)

**Deaf Student Adaptation:**
- Interpreter signs colors instead of verbal calls
- Use large color flash cards (hold up card = play that color)
- Rhythmic visual cues (nod head on beat, flash card on downbeat)

---

### Backup Plan C: Paper Rhythm Activity (Educational Fallback)

**Setup (5 minutes):**
1. Print rhythm notation sheets (see template below)
2. Color-code notes with markers:
   - Whole notes = Red
   - Half notes = Orange
   - Quarter notes = Yellow
   - Eighth notes = Green
3. One sheet per student

**Activity Flow:**
1. **Intro:** "Each colored note = play your Boomwhacker"
2. **Practice:** Students read left-to-right, play when they see their color
3. **Together:** All students play from same sheet (like reading music)
4. **Create:** Students design their own rhythm (draw colored notes)

**Rhythm Sheet Template:**
```
Line 1 (Simple):
🔴 _ _ _  🟠 _ _ _  🔴 _ _ _  🟠 _ _ _

Line 2 (Moderate):
🔴 🟡 🟠 🟡  🔴 🟡 🟠 🟡

Line 3 (Complex):
🔴 🟢 🟢 🟠  🟡 🟡 🔵 🟣
```

**Pros:**
- Zero technology required
- Teaches music notation basics
- Students create their own patterns (creativity)
- Tangible takeaway (students keep their sheet)

**Cons:**
- Less dynamic than LEDs or verbal calls
- Requires preparation (printing, markers)
- Younger students may struggle with notation

**Engagement Level:** 7/10 (educational and creative)

---

## 🚨 SCENARIO 2: WiFi Fails (Tubes Can't Connect)

### Quick Fix Attempts (5 min troubleshooting budget)

**Try These in Order:**
1. ✅ Restart laptop WiFi (toggle off/on)
2. ✅ Restart router (if accessible)
3. ✅ Use phone hotspot:
   - Enable hotspot on phone
   - Connect laptop to phone WiFi
   - WLED tubes should auto-switch to new network
4. ✅ Use Ethernet cable (if available)

**If Still Failing After 5 Min:**
→ Switch to **Backup Plan B** (Instructor-Led) or **Backup Plan A** (Laptop Screen)

---

## 🚨 SCENARIO 3: Laptop Crashes / Battery Dies

### Immediate Actions:
1. ✅ Restart laptop (if crash)
2. ✅ Plug in charger (if battery)
3. ✅ Estimate restart time: 3-5 minutes

### During Laptop Restart (Keep Students Engaged):
- **Activity:** Practice Boomwhacker technique
  - "Let's practice hitting softly vs. loudly"
  - "Can you hit just the tip? Just the middle?"
  - "What sound does it make when you hit your leg? The floor?"
- **Game:** Boomwhacker telephone (pass rhythm around circle)
  - Student 1 plays pattern → Student 2 repeats → Student 3 repeats
  - See how many students before pattern changes

### If Laptop Won't Restart:
→ Switch to **Backup Plan B** (Instructor-Led)

---

## 🚨 SCENARIO 4: Sound Engine Fails (No Audio)

### Impact Assessment:
- **Students:** Deaf students won't notice (no audio needed)
- **Instructor:** Can still run activity (LEDs work independently)
- **Boomwhackers:** Students hear their own playing

### Action Plan:
→ **Continue as planned!** Audio not critical for deaf student workshop.

**Optional Fix (if time permits):**
1. Refresh browser page
2. Click play/pause to restart audio engine
3. Check browser console for errors

---

## 🚨 SCENARIO 5: Only 1-2 Tubes Working

### Adapted Activity (Modified Success)

**Setup:**
1. Position working tubes at front
2. Assign multiple students per working tube
3. Adjust activity to focus on working tubes

**Modified Flow:**

**Option A: Relay Race**
- 2 students per tube
- Student 1 plays first 4 beats → Student 2 plays next 4 beats
- Switch every pattern cycle

**Option B: Conductor System**
- 1 student per tube (fewer students actively playing)
- Other students are "conductors" (point when to play)
- Rotate roles every 2 minutes

**Option C: Simplified Pattern**
- Use only working tubes (2 lanes instead of 6)
- Create call & response pattern
- Red tube = "Question" / Orange tube = "Answer"

**Engagement Level:** 7/10 (less students active, but still functional)

---

## 🚨 SCENARIO 6: WebSocket Bridge Keeps Crashing

### Symptoms:
- Tubes connect, then disconnect repeatedly
- Message: "WebSocket disconnected"
- LEDs flicker/stop responding

### Root Cause:
- Bridge script issue
- Port conflict
- Laptop resources

### Quick Fix:
1. ✅ Close all other applications (free up resources)
2. ✅ Restart bridge manually:
   ```bash
   # Kill existing bridge
   pkill -f wled-websocket-bridge

   # Restart bridge
   node scripts/wled-websocket-bridge.cjs
   ```
3. ✅ Refresh browser page

### If Still Crashing:
→ Switch to **Backup Plan A** (Laptop Screen) - no bridge required

---

## 📋 MASTER EMERGENCY DECISION TREE

```
Tech fails?
│
├─ All tubes offline?
│  ├─ WiFi issue? → Try hotspot (2 min)
│  ├─ Still offline? → Laptop screen (Plan A) or Instructor-led (Plan B)
│  └─ Can't fix in 5 min? → Switch to Backup Plan B (no tech)
│
├─ Laptop crash/battery?
│  ├─ Restart time < 5 min? → Play games while waiting
│  └─ Can't restart? → Backup Plan B (Instructor-led)
│
├─ Only 1-2 tubes work?
│  └─ Modified activity (relay race or conductor system)
│
├─ Bridge crashing?
│  ├─ Restart bridge (1 min)
│  └─ Still crashing? → Laptop screen (Plan A)
│
└─ Sound fails?
   └─ Continue anyway (deaf students don't need audio)
```

---

## 🎯 FALLBACK SUCCESS CRITERIA

Even with tech failures, workshop can still succeed if:
- ✅ Students understand color → sound mapping
- ✅ Students practice rhythm following (visual or verbal cues)
- ✅ Students have fun playing Boomwhackers
- ✅ Instructor stays calm and positive (students follow your energy)

**Remember:** The goal is music learning, not perfect technology. Deaf students are used to technology adaptations. Your energy and creativity matter more than flawless tech.

---

## 💡 PRO TIPS

### Stay Calm
- Students will match your energy
- If you panic, they disengage
- If you smile and adapt, they stay engaged

### Acknowledge Issues
- "The computer isn't working, but we can still play!"
- "Let's try a different way"
- Transparency builds trust

### Have Fun
- Technology fails are part of live performance
- Improv is a valuable skill
- Students will remember your problem-solving, not the failure

### Document for Next Time
- Note what failed and why
- Update backup plans based on real experience
- Test fixes before next workshop

---

**You've got multiple backup plans. You're prepared. You've got this! 🎉**
