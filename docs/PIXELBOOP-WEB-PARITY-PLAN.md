# PixelBoop Web App Feature Parity Plan

**Date:** February 17, 2026  
**Goal:** Port iOS PixelBoop harmonic grid system to Centaurus web app for rapid prototyping  
**Why:** Ryan doesn't have iOS device; web prototyping is faster for concept testing

---

## 📊 Current State Analysis

### iOS PixelBoop (pixelboop-harmonic-grid repo)
**Location:** `~/Documents/GitHub/pixelboop-harmonic-grid`

**Key features implemented:**
- ✅ Harmonic grid system (interval-based note layout)
- ✅ Interval modes: 3rds, 4ths, 5ths, 7ths, 9ths, Chromatic
- ✅ 6-note visible limit per track (melody, chords) / 4-note (bass)
- ✅ Root note shifting (sounds "very musical")
- ✅ Section management system
- ✅ Scale support (major, minor, pentatonic)
- ✅ Chromatic color mapping
- ✅ MIDI output
- ✅ WLED LED sync

**Key files:**
```
pixelboop/Models/IntervalMode.swift          # Interval definitions
pixelboop/ViewModels/IntervalModeSelectionController.swift
shared/logic/MusicTheoryEngine.swift         # Theory calculations
shared/models/Scale.swift                    # Scale definitions
pixelboop/ViewModels/SequencerViewModel.swift
```

### Web App (Centaurus-Drum-Machine)
**Location:** `~/Documents/GitHub/Centaurus-Drum-Machine`

**Current state:**
- ✅ Basic drum machine grid
- ✅ Section system (8 sections, loop/follow mode)
- ✅ MIDI output
- ⚠️ PixelBoop experiment exists (`research/prototype_pixelboop_sequencer.jsx`) but outdated
- ❌ No harmonic grid system
- ❌ No interval modes
- ❌ No root note control
- ❌ No scale support

**Gap:** iOS is ~10+ commits ahead with harmonic features

---

## 🎯 Feature Parity Goals

### Phase 1: Core Harmonic Grid (Week 2)

**Must-have features to port:**

1. **Interval Mode System**
   - Enum: 3rds, 4ths, 5ths, Chromatic (skip 7ths/9ths for now per earlier discussion)
   - Scale degree calculation logic
   - Display names for tooltips

2. **Interval Pitch Mapper**
   - Diatonic interval calculation (uses scale degrees, not chromatic)
   - Spans multiple octaves naturally
   - Root note shifting
   - Scale support (major, minor, pentatonic)

3. **Track Configuration**
   - Melody track: 6 notes visible
   - Chord track: 6 notes visible
   - Bass track: 4 notes visible
   - Rhythm track: 4 notes (percussion, not harmonic)

4. **UI Components**
   - Interval mode selector (hold to cycle, tap to select?)
   - Root note control (C-B, 12 options)
   - Scale selector (major/minor/pentatonic)
   - Visual feedback for active mode

5. **Color Mapping**
   - Chromatic color system (C=red, C#=orange, D=yellow...)
   - Consistent across interval modes
   - LED-compatible palette

### Phase 2: Set Toggling (Week 3)

**New feature from earlier discussion:**

**Chord/Melody tracks (6 notes visible):**
- Tap 4th column = toggle between Set 1 and Set 2
- Set 1: Notes 1-3-5-7-9-11 (in current interval mode)
- Set 2: Notes 2-4-6-8-10-12
- Visual indicator: ⚫ (set 1) or ⚫⚫ (set 2)
- Notes persist across set views (no remapping)

**Bass track (4 notes visible):**
- Three-state toggle: Set 1 (1-3-5-7) → Set 2 (9-11-2-4) → Set 3 (6-8-10-12)
- Visual indicator: ⚫, ⚫⚫, or ⚫⚫⚫

**Critical behavior:**
- Treat as extending piano roll, not transposing
- Existing notes stay in place when switching sets
- Only changes available notes for NEW placement

### Phase 3: Root Note Automation (Week 3-4)

**CORRECTED: Automated progression within section timeline**

**Terminology clarification:**
- **"Sections"** = 8 columns on right (intro/verse/chorus) — NOT used for root automation
- **"Root automation"** = within single section, over time steps

**Implementation:**
- **2nd row from bottom** repurposed:
  - **Normal:** Track colors over timeline (current)
  - **Automation mode:** Root note colors per time step (new)
- **Activation:** Hold any musical key → enter automation mode
- **Each pixel** = one time step with specific root note
- **Colors:** Chromatic mapping (C=red, C#=orange, D=yellow...)

**Automation options:**
- **Off:** Static root (current behavior)
- **2-5-1:** Auto-configure timeline with Dm→G7→Cmaj over 16 steps
- **1-4-5:** Auto-configure timeline with I→IV→V over 16 steps
- **Custom:** User manually sets root per time step

**UX to implement:**
1. **Hold gesture** on key row → activate automation mode
2. **Display switch** for 2nd-from-bottom row (track colors → root colors)
3. **Edit interaction:**
   - Option A: Tap pixel → cycle through 12 roots
   - Option B: Select root from key row, tap pixel to set
   - Option C: Drag across pixels while holding to "paint" roots
4. **Exit mode:** Release hold, or tap outside automation row
5. **Visual feedback:** Show which mode active (normal vs. automation)

**Technical notes:**
- Maintain intervals (3rds, 4ths, 5ths remain consistent)
- Root shifts per time step → all tracks transpose accordingly
- Need to store: `rootNoteTimeline: number[]` (16 steps, each = 0-11 chromatic)
- When step advances, apply root transposition before rendering notes

---

## 📋 Implementation Checklist

### Week 1: Study & Gap Analysis
- [x] Locate iOS repo (pixelboop-harmonic-grid)
- [x] Identify key files (IntervalMode.swift, MusicTheoryEngine.swift)
- [x] Document gap analysis
- [x] Create this parity plan
- [ ] Review web experiment code
- [ ] Map iOS concepts → web architecture

### Week 2: Core Harmonic Grid Port
- [ ] Create `IntervalMode` enum (TS/JS)
- [ ] Port `IntervalPitchMapper` logic
- [ ] Implement scale support (major/minor/pentatonic)
- [ ] Create interval mode selector UI
- [ ] Create root note control UI
- [ ] Create scale selector UI
- [ ] Update grid rendering with interval pitches
- [ ] Test chromatic color mapping
- [ ] Verify notes sound correct across all modes

**Success criteria:**
- Ryan can load web app on phone
- Select interval mode (3rds, 4ths, 5ths, chromatic)
- Change root note (C-B)
- Switch scale (major/minor)
- Place notes and hear correct pitches
- See color-coded notes

### Week 3: Set Toggling Feature
- [ ] Add set toggle gesture to 4th column
- [ ] Implement set state tracking
- [ ] Create visual indicator (dots)
- [ ] Update note placement logic (no remapping)
- [ ] Test across interval modes
- [ ] Verify bass track 3-state toggle
- [ ] Add tooltip showing current set

**Success criteria:**
- Place note in Set 1, switch to Set 2, note persists
- Can access all 12 chromatic notes via two 6-note views
- Bass track cycles through 3 sets correctly
- Visual feedback clear

### Week 4: Sections = Chords
- [ ] Add root note property to section state
- [ ] Create automation mode selector
- [ ] Implement 2-5-1 progression logic
- [ ] Implement 1-4-5 progression logic
- [ ] Add custom mode (manual root per section)
- [ ] Update section switching to apply root changes
- [ ] Test progression feels musical

**Success criteria:**
- Set section 1 root=C, section 2 root=D, section 3 root=G
- Switch sections, hear root shift
- Enable "2-5-1" automation, sections auto-configure
- Sounds like Myles's manual root shifting (already musical)

---

## 🧪 Prototype Tabs Structure

**After parity achieved, add tabbed prototypes:**

### Tab Structure:
```typescript
enum PrototypeMode {
  STATIC = 'static',           // Baseline (sections = static root)
  AUTO_PROGRESS = 'auto',      // Sections = chords (automated)
  TEMP_FLOW = 'tempflow',      // Color temperature background
  GESTURES = 'gestures'        // Swipe = harmonic function
}
```

### Tab 1: Static (Baseline)
**Purpose:** Control group for comparison

**Features:**
- Core harmonic grid (from parity work)
- Manual root note control
- No automation
- Current section behavior

**UI note:** "Baseline mode - manual control"

### Tab 2: Auto-Progress (Sections = Chords)
**Purpose:** Test automated progression concept

**Features:**
- All parity features +
- Automation dropdown: Off | 2-5-1 | 1-4-5 | Custom
- Root note auto-shifts per section
- Visual indicator of current chord in progression

**UI note:** "Auto-progression mode - sections advance through chord changes"

**Test cases:**
- Set to "2-5-1", switch sections, verify Dm→G7→Cmaj pattern
- Set to "Custom", define roots manually per section
- Hear it sound like Myles's manual root shifting

### Tab 3: Temp Flow (Color Temperature)
**Purpose:** Test visual harmony feedback

**Features:**
- All parity features +
- Background color overlay:
  - 🔴 Hot red glow = dominant function (V, V7)
  - 🔵 Cool blue = tonic function (I)
  - 🟡 Warm amber = subdominant function (ii, IV)
- Background morphs as root shifts
- Notes still use chromatic color mapping

**UI note:** "Temperature Flow mode - background shows harmonic function"

**Test cases:**
- Play I chord, see blue background
- Shift to V, see red glow
- Progression feels like "painting" (mixing colors)

### Tab 4: Gestures (Progression Gestures)
**Purpose:** Test swipe-based harmonic motion

**Features:**
- All parity features +
- Gesture vocabulary:
  - Swipe right = move to V
  - Swipe down = resolve to I
  - Swipe left = move to IV
  - Swipe up = tension
  - Two-finger rotate = major↔minor
- Animated transitions between chords
- Visual voice leading (if time)

**UI note:** "Gesture mode - swipe to move through harmony"

**Implementation notes:**
- Must not conflict with existing gestures
- Needs gesture detection layer
- Most complex prototype
- Iterate based on Tab 2 & 3 learnings

---

## 🏗️ Technical Architecture

### File Structure (proposed):
```
src/
├── components/
│   ├── PixelBoopGrid/
│   │   ├── IntervalModeSelector.tsx
│   │   ├── RootNoteControl.tsx
│   │   ├── ScaleSelector.tsx
│   │   ├── SetToggleIndicator.tsx
│   │   └── HarmonicGrid.tsx
│   └── PrototypeTabs/
│       ├── StaticMode.tsx
│       ├── AutoProgressMode.tsx
│       ├── TempFlowMode.tsx
│       └── GesturesMode.tsx
├── hooks/
│   ├── useIntervalMode.ts
│   ├── useHarmonicGrid.ts
│   └── useProgressionAutomation.ts
├── lib/
│   ├── intervalMode.ts          # Ported from IntervalMode.swift
│   ├── intervalPitchMapper.ts   # Ported from iOS logic
│   ├── musicTheory.ts           # Scale definitions, calculations
│   └── progressionEngine.ts     # Progression automation (2-5-1, etc.)
└── types/
    ├── intervalMode.ts
    └── harmonicGrid.ts
```

### Key Interfaces:
```typescript
interface IntervalMode {
  type: '3rds' | '4ths' | '5ths' | 'chromatic';
  scaleDegreeSkip: number;
  displayName: string;
}

interface HarmonicGridState {
  intervalMode: IntervalMode;
  rootNote: number;          // 0-11 (C=0)
  scale: 'major' | 'minor' | 'pentatonic';
  currentSet: 1 | 2 | 3;     // For set toggling
  automationMode: 'off' | '2-5-1' | '1-4-5' | 'custom';
}

interface TrackConfig {
  height: number;            // 6 for melody/chord, 4 for bass
  intervalMode: IntervalMode;
  visibleNotes: number[];    // Current set of notes
}
```

---

## 🧮 iOS → Web Translation Guide

### Interval Calculation:
**iOS (Swift):**
```swift
static func pitchForRow(
    localRow: Int,
    trackHeight: Int,
    intervalMode: IntervalMode,
    rootNote: Int = 0,
    scale: Scale = .major
) -> Int {
    let rowsFromBottom = trackHeight - 1 - localRow
    
    if intervalMode == .chromatic {
        return rootNote + rowsFromBottom
    }
    
    // Diatonic calculation...
    let degreeSkip = intervalMode.scaleDegreeSkip
    // ... (complex octave spanning logic)
}
```

**Web (TypeScript):**
```typescript
function pitchForRow(
  localRow: number,
  trackHeight: number,
  intervalMode: IntervalMode,
  rootNote: number = 0,
  scale: Scale = 'major'
): number {
  const rowsFromBottom = trackHeight - 1 - localRow;
  
  if (intervalMode.type === 'chromatic') {
    return rootNote + rowsFromBottom;
  }
  
  // Port diatonic logic 1:1
  const degreeSkip = intervalMode.scaleDegreeSkip;
  // ... (same calculation, TypeScript syntax)
}
```

### Scale Intervals:
**iOS:**
```swift
private static let majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11]
private static let minorScaleIntervals = [0, 2, 3, 5, 7, 8, 10]
```

**Web:**
```typescript
const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9]
};
```

---

## ✅ Success Criteria

### Parity Achieved When:
- [ ] Ryan can open web app on phone browser
- [ ] All 4 interval modes work (3rds, 4ths, 5ths, chromatic)
- [ ] Root note shifting works (C through B)
- [ ] Scale switching works (major/minor/pentatonic)
- [ ] Notes sound identical to iOS version
- [ ] Colors match iOS chromatic mapping
- [ ] Set toggling works (6→12 note access)
- [ ] UI is touch-friendly (mobile gestures)

### Prototypes Ready When:
- [ ] 4 tabs implemented (static, auto, temp, gestures)
- [ ] Each tab has clear UI notes explaining differences
- [ ] Switching tabs doesn't break layout
- [ ] Can A/B test concepts with Ryan/Nat
- [ ] Feedback gathered on which feels most musical

### Ready for iOS Port When:
- [ ] Ryan/Nat validate winning approach
- [ ] Concept proven via web testing
- [ ] Edge cases identified and solved
- [ ] Gesture conflicts resolved (if Gestures mode)
- [ ] Visual design refined

---

## 🚧 Known Challenges

### 1. Gesture Conflicts
**Problem:** Web gestures may conflict with browser defaults (swipe = back button)  
**Solution:** 
- Use `preventDefault()` carefully
- Consider two-finger gestures for desktop
- Test on Ryan's phone early

### 2. LED Grid Constraints
**Problem:** Horizontal scrolling (River Mode) may not work on small grids  
**Solution:** 
- Deprioritize River Mode for now
- Focus on static grid solutions (Temp Flow, Gestures)

### 3. Animation Performance
**Problem:** Voice leading transitions need smooth animation  
**Solution:**
- Use CSS transitions for background colors (Temp Flow)
- Use requestAnimationFrame for note movements (Gestures)
- Test on mobile device early

### 4. MIDI Output on Mobile
**Problem:** Web MIDI API support varies by browser  
**Solution:**
- Fallback to Web Audio synthesis
- Document browser requirements
- Consider native MIDI bridge if needed

---

## 📝 Documentation Updates Needed

### In Centaurus Repo:
- [x] This parity plan (docs/PIXELBOOP-WEB-PARITY-PLAN.md)
- [ ] Interval mode API docs
- [ ] Set toggling feature spec
- [ ] Prototype tab comparison guide

### In iOS Repo:
- [ ] Feature freeze announcement (don't add to iOS until web validated)
- [ ] Web parity tracking (which features ported)

---

## 🔗 Related Documents

- **Brainstorming:** `docs/HARMONIC-PROGRESSION-BRAINSTORM.md`
- **Opus Analysis:** In Audiolux project (`~/clawd/projects/audiolux/`)
- **Session Summaries:** Jan 20, Feb 3, Feb 10 sessions with Ryan
- **iOS Repo:** `~/Documents/GitHub/pixelboop-harmonic-grid`
- **Web Repo:** `~/Documents/GitHub/Centaurus-Drum-Machine`

---

## 🎯 Next Actions

**Today (Feb 17):**
- [x] Document parity plan
- [ ] Create GitHub issue
- [ ] Review web experiment code
- [ ] Begin iOS→Web translation of `IntervalMode`

**This Week:**
- [ ] Port core harmonic grid (Week 2 checklist)
- [ ] Test on Ryan's phone
- [ ] Gather feedback

**Next Week:**
- [ ] Implement set toggling (Week 3 checklist)
- [ ] Begin prototype tabs
- [ ] Test musical feel

**Goal:** Ryan tinkers with concepts by end of Week 2, provides feedback for prototype iteration.
