# Harmonic Progression System - Brainstorming & Design

**Date:** February 17, 2026  
**Context:** Audiolux/PixelBoop progressive harmony feature exploration  
**Participants:** Myles, Ryan (PJCE), Opus design analysis

---

## 🎯 The Problem

**Current state:** "Chords don't actually progress, they are very static right now"

**Why this matters:**
- 2-5-1 progression needs 12 unique notes (Dm7: D-F-A-C, G7: G-B-D-F, Cmaj7: C-E-G-B)
- Current 6-note limit forces "snapshots" not "motion"
- Voice leading (F→E resolution in 2-5-1) is invisible
- Ryan's insight: "Voice leading is why chords move the way they do"

**Root cause:** System shows **spatial** (what notes) but not **spatiotemporal** (how notes move through time).

---

## 🎨 Design Constraints (Must Preserve)

1. **Accessibility:** Deaf-first, blind-navigable, minimal gestures
2. **No meta-menus:** "If there's a second menu, you get lost"
3. **Visual clarity:** LED grid limitations
4. **10 years invested:** Note=color chromatic mapping
5. **Classroom-ready:** Simple enough for grades 3-5
6. **Grants pending:** Creative Heights, NEA (can't completely redesign)

---

## 💡 Key Insight from Myles

**Root note shifting is already musical:**

> "I really enjoy changing the root note in my key change controls and hearing the chords/notes update on the fly. It sounds very musical since the intervals all remain in place but the root note selection shifts all chords, melodies and bass lines in a single press of a button."

**This IS chord progression** - just manually triggered. The goal: automate or gesture-enable this.

---

## 🔬 Opus Analysis: Five Solutions

### Solution 1: "River Mode" — Horizontal Progression Lanes

**Concept:** 3 horizontal lanes (bass, mid, treble) scroll LEFT over time. Voice leading appears as diagonal lines connecting notes across chords.

**Visual:**
```
[past]  ←←←  [now]
  E ════════ E     (holds)
  B ──────── C     (moves up)
  G ════════ G     (holds)
------time→------
```

| Criteria | Rating | Notes |
|----------|--------|-------|
| Musicality | ★★★★★ | Shows motion, not just position |
| Simplicity | ★★★☆☆ | New paradigm, learning curve |
| Implementation | 6-8 weeks | Scrolling renderer, connection lines |
| Compatibility | ★★★★☆ | Notes=colors preserved, adds time axis |
| Scalability | ★★★★★ | Works for 3-chord pop AND 12-bar jazz |

**Pros:**
- Finally shows WHY progressions work
- Visual voice leading
- Educational value highest

**Cons:**
- Horizontal scrolling hard on small LED grids
- Most complex to implement
- Learning curve

---

### Solution 2: "Chord Wheel" — Rotational Progression

**Concept:** 6 notes arranged in circle. Position = chord function (I at top, V at right). Rotate wheel = progress through harmony.

**Visual:**
```
       C (I)
    F     G
  Bb (IV)  D (V)
    Eb   A
       Ab
```

| Criteria | Rating | Notes |
|----------|--------|-------|
| Musicality | ★★★★☆ | Progression as rotation intuitive |
| Simplicity | ★★★★★ | Single gesture, blind-navigable via haptics |
| Implementation | 4-6 weeks | Circular layout + rotation animation |
| Compatibility | ★★★★★ | Chromatic colors map perfectly to wheel |
| Scalability | ★★★☆☆ | Best for diatonic; jazz extensions crowded |

**Pros:**
- Extremely tactile
- One gesture = progression
- Circle of 5ths already is a wheel!

**Cons:**
- May struggle with complex voicings
- 6-note limit per frame

---

### Solution 3: "Smart 6" — Context-Aware Note Selection

**Concept:** System chooses which 6 notes based on progression context. Only shows notes needed for smooth voice leading from previous chord.

| Criteria | Rating | Notes |
|----------|--------|-------|
| Musicality | ★★★★☆ | Voice leading becomes visible as animation |
| Simplicity | ★★★★★ | User picks chords, system handles complexity |
| Implementation | 8-12 weeks | Voice leading algorithm, animation system |
| Compatibility | ★★★★★ | 6-note limit preserved exactly |
| Scalability | ★★★☆☆ | Needs curated chord library |

**Pros:**
- Minimal UI change
- Educational—shows WHY notes move
- Keeps 6-note simplicity

**Cons:**
- "Magic" might feel opaque
- Jazz musicians may want override control
- **Myles's note:** "Earlier prototypes did this but created notes you couldn't see (due to 6-note constraint)"

---

### Solution 4: "Progression Gestures" — Swipe = Voice Lead

**Concept:** Swipe in direction = apply standard voice leading transformation. No menus, no note selection—gestures MEAN something musically.

**Gesture vocabulary:**
- **Swipe RIGHT** = move to V (dominant)
- **Swipe DOWN** = resolve to I (tonic)
- **Swipe LEFT** = move to IV (subdominant)
- **Swipe UP** = secondary dominant / tension
- **Two-finger rotate** = parallel mode shift (major↔minor)

| Criteria | Rating | Notes |
|----------|--------|-------|
| Musicality | ★★★★★ | Gestures = harmonic motion, intuitive |
| Simplicity | ★★★★★ | 4 directions = 4 functions, classroom-ready |
| Implementation | 6-8 weeks | Gesture mapping + transition animations |
| Compatibility | ★★★★☆ | Works with note=color; adds gesture layer |
| Scalability | ★★★☆☆ | Basic progressions great; complex jazz needs modifiers |

**Pros:**
- **The "minimal touch for pleasing patterns" goal realized**
- Blind-navigable
- Classroom perfect

**Cons:**
- Limited to pre-defined transformations
- Advanced users may feel constrained
- **Needs gesture mapping that doesn't conflict with existing gestures**

---

### Solution 5: "Color Temperature Flow" — Hot↔Cool Visualization

**Concept:** Background color shows harmonic function. Hot colors = tension (V7), cool = resolution (I), warm = motion (ii).

**How it works:**
- Chord displayed normally (note=color)
- BACKGROUND color shows harmonic function:
  - 🔴 Hot red glow = dominant, needs to resolve
  - 🔵 Cool blue = tonic, stable home
  - 🟡 Warm amber = subdominant, passing
- Background morphs: blue→yellow→red→blue as progression moves

**Visual:**
```
Dm7        G7         Cmaj7
[amber]   [HOT RED]   [cool blue]
  ↘         ↓           ↙
    "hear" the resolution visually
```

| Criteria | Rating | Notes |
|----------|--------|-------|
| Musicality | ★★★★☆ | Captures emotional arc of progressions |
| Simplicity | ★★★★★ | No new gestures—ambient visual feedback |
| Implementation | 3-4 weeks | Background color logic only, minimal UI |
| Compatibility | ★★★★★ | Adds TO note=color, doesn't replace |
| Scalability | ★★★★☆ | Works pop through bebop |

**Pros:**
- **Easiest to implement**
- Non-invasive
- Honors "painting" analogy from Jan 20 session

**Cons:**
- Doesn't solve 6-note limit
- More "feedback" than "control"

---

## 🏆 Opus Recommendation

**Phase 1 (Week 1-2):** Solution 5 — Color Temperature Flow
- Lowest cost, non-invasive
- Validates core insight: progressions = temperature shifts
- If it feels right, confirms direction

**Phase 2 (Week 3-6):** Solution 4 — Progression Gestures
- "Minimal touch for pleasing patterns" dream
- Swipe = voice lead = accessibility breakthrough
- Test with deaf students early

**Phase 3 (If needed):** Solution 1 — River Mode
- If gestures feel abstract, timeline makes "why" visible
- Most complex but highest educational value

---

## 🎯 Myles's Strategic Pivot

**Immediate plan:**

### 1. Root Note Automation (Time-Based, Within Section)

**CORRECTED UX CONCEPT (per Myles Feb 17):**

**Terminology clarification:**
- **"Sections"** in PixelBoop = 8 columns on right side (intro/verse/chorus style)
- **"Root note automation"** = happens WITHIN a single section over time

**Visual layout:**
- **iOS:** Musical keys = bottom row controls
- **Web:** Musical keys = top row controls
- **2nd row from bottom** (currently shows track colors over timeline) = **where root automation displays**

**Interaction design:**
- **Hold down on any musical key** → activate root note automation mode
- 2nd row from bottom switches display:
  - **Normal mode:** Track colors over timeline
  - **Automation mode:** Root note colors over time (one pixel per time step)
- Each pixel in that row = a specific root note for that time slice
- Colors follow chromatic mapping (C=red, D=orange, etc.)

**UX challenges to solve:**
1. How to change active root note per time step in automation row?
   - Tap pixel → cycle through 12 chromatic roots?
   - Drag across pixels while holding key?
   - Select root from key row, then tap pixel in automation row?
2. How to update pixel color based on selected key?
   - Real-time color update as you change root
   - Preview mode before committing?
3. Hold vs. Tap gesture conflicts
   - Hold key = activate automation mode
   - Tap key = normal key function
   - How to exit automation mode? (Release hold? Tap elsewhere?)

**Why this first:**
- Leverages root-note-shifting that already "sounds very musical"
- Repurposes underutilized 2nd-from-bottom row
- No new UI elements needed (uses existing rows)
- Easiest to implement (just change what row displays + add hold gesture)

**Automation presets:**
```
Off:    No automation, static root note
2-5-1:  Auto-configure timeline with Dm→G7→Cmaj pattern
1-4-5:  Auto-configure timeline with I→IV→V pattern
Custom: User manually sets root per time step
```

### 2. Web Prototype Strategy

**Problem:** iOS iteration is slow, Ryan doesn't have iOS device yet.

**Solution:**
1. Port harmonic grid system to web app (feature parity)
2. Create tabbed prototypes in web version:
   - **Tab 1:** Static (baseline)
   - **Tab 2:** Auto-Progress (sections = chords)
   - **Tab 3:** Temp Flow (background colors)
   - **Tab 4:** Gestures (swipe = harmonic function)
3. Ryan tests on phone browser
4. Once validated, port back to iOS

**Constraint:** Tabs change behavior, not layout. Notes on each tab explaining what's different.

---

## ❓ Open Questions

1. **LED grid size?** River Mode needs horizontal space. If 8×8 or smaller, Wheel or Gesture modes better.

2. **Primary use case: performance or education?**
   - Performance → Gesture modes (fast, intuitive)
   - Education → River Mode (shows the "why")

3. **Override for advanced users?** Smart 6 and Gesture modes constrain choices. Jazz musicians need escape hatches?

4. **Animation capability?** Voice leading requires note-to-note transitions. Can LEDs morph states?

5. **Ryan's preference: chord=color vs. note=color?** Sessions mentioned tension. Which serves musicality better?

6. **Haptic feedback?** For blind navigation, rotation/swipe gestures need physical confirmation.

7. **Key changes in pop/electronic?** Myles noted pop doesn't shift keys often. Should automation be optional/subtle?

8. **Existing gesture conflicts?** Progression Gestures need mapping that doesn't interfere with current gestures.

---

## 📊 Comparison Summary

| Solution | Musicality | Simplicity | Dev Time | Compatibility | Scalability | Myles Priority |
|----------|------------|------------|----------|---------------|-------------|----------------|
| River Mode | ★★★★★ | ★★★☆☆ | 6-8 wks | ★★★★☆ | ★★★★★ | Later (web proto) |
| Chord Wheel | ★★★★☆ | ★★★★★ | 4-6 wks | ★★★★★ | ★★★☆☆ | Consider |
| Smart 6 | ★★★★☆ | ★★★★★ | 8-12 wks | ★★★★★ | ★★★☆☆ | Had issues before |
| Progression Gestures | ★★★★★ | ★★★★★ | 6-8 wks | ★★★★☆ | ★★★☆☆ | Web proto (Tab 4) |
| Color Temperature | ★★★★☆ | ★★★★★ | 3-4 wks | ★★★★★ | ★★★★☆ | Web proto (Tab 3) |
| **Sections = Chords** | ★★★★☆ | ★★★★★ | **2-3 wks** | ★★★★★ | ★★★★☆ | **iOS first (Tab 2)** |

---

## 🚀 Implementation Roadmap

### Milestone 1: Documentation (This Week)
- [x] Brainstorming doc (this file)
- [ ] Web parity plan
- [ ] GitHub issue with milestones

### Milestone 2: iOS Sections = Chords (Week 1-2)
- [ ] Section automation UI
- [ ] Root note auto-shift per section
- [ ] Progression presets (2-5-1, 1-4-5)
- [ ] Test with Myles

### Milestone 3: Web Feature Parity (Week 2-3)
- [ ] Port harmonic grid system
- [ ] Interval modes (3rds, 4ths, 5ths)
- [ ] Set toggling
- [ ] Ryan can test on phone

### Milestone 4: Web Prototypes (Week 3-5)
- [ ] Tab 1: Static baseline
- [ ] Tab 2: Auto-Progress (sections = chords)
- [ ] Tab 3: Color Temperature Flow
- [ ] Tab 4: Progression Gestures

### Milestone 5: Evaluation & iOS Porting (Week 6+)
- [ ] Ryan/Nat feedback session
- [ ] Pick winning approach
- [ ] Port validated concept to iOS
- [ ] Iterate

---

## 📚 Related Sessions

**Jan 20, 2026:** Chord-color breakthrough, painting analogy  
**Feb 3, 2026:** Shapes for harmony, grant funding discussion  
**Feb 10, 2026:** 251 progression, voice leading (F→E), hot/cool pattern

See: `~/clawd/projects/audiolux/sessions/` for full transcripts and summaries.

---

## 🎵 Music Theory Foundation

**Voice Leading in 2-5-1:**
- **Dm7:** D (root), F (3rd), A (5th), C (7th)
- **G7:** G (root), B (3rd), D (5th), F (7th)
- **Cmaj7:** C (root), E (3rd), G (5th), B (7th)

**Key movements:**
- F (7th of Dm7) → F (7th of G7) → E (3rd of Cmaj7) — resolution
- A (5th of Dm7) → B (3rd of G7) → C (root of Cmaj7) — motion

**Color temperature pattern (from Ryan):**
- Dm7 = warm (amber) — ii chord, subdominant family
- G7 = hot (red) — V chord, dominant, needs to resolve
- Cmaj7 = cool (blue) — I chord, tonic, home

**This pattern = "Hot → Cool → Hot → Cool"**

---

## 💭 Design Philosophy

**From Myles (Feb 13):**
> "The ultimate goal here is to create pleasing and harmonious chord patterns and complimentary bass and melody lines using minimal touch gestures. It also ideally makes sense visually."

**The challenge:**
> "I've honestly been struggling with how to do this in a purposely limited interface. I knew I didn't want to show all 12 notes for all tracks at a time but realize my creative constraints started working against my goal of making chord progressions intuitive."

**The insight:**
> "I don't think we should completely redesign everything but looking for solutions that will shift us back into 'easy musicality' territory."

**Opus identified this as:** "Creative constraints blocking the core goal"

---

**Next Steps:** See `PIXELBOOP-WEB-PARITY-PLAN.md` for implementation details.
