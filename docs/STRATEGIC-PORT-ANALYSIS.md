# Strategic Port Analysis: iOS → Web PixelBoop

**Date:** 2026-02-17  
**Model:** Opus  
**Decision:** One-shot refactor vs. commit-by-commit port

---

## The Situation

### iOS App (Source of Truth)
- **Timeline:** Dec 17, 2025 → Feb 17, 2026 (62 days)
- **Commits:** 156+ commits across 9 active development days
- **Status:** Feature-complete, refined, production-ready
- **Key features TODAY (Feb 17):**
  - ✅ Note Set toggling (6→12 chromatic note access)
  - ✅ Key automation (row 22 toggle mode)
  - ✅ Interval modes with column 3 hold gesture
  - ✅ Walking bass gestures (diagonal, vertical ba-dum)
  - ✅ Multi-device sync (Multipeer + Ableton Link)
  - ✅ LiteJam LED guitar integration
  - ✅ AudioKit synths (Rhodes, bass presets, drums)
  - ✅ Teaching mode (auto-tooltips, white outlines)
  - ✅ 8-section song arrangements
  - ✅ Bluetooth MIDI I/O
  - ✅ WLED LED strip integration
  - ✅ Preset selection with climbing pixel UX

### Web App (Current State)
- **Timeline:** Started Feb 17, 2026 (TODAY)
- **Status:** 30% complete on interval modes only
- **Has:**
  - ✅ Basic grid rendering
  - ✅ Chromatic pitch mapping (v1 baseline)
  - ✅ Interval mode data model (ported today)
  - ✅ Column 3 visualization (dim note colors)
  - ✅ Version selector dropdown (v1/v2/v3/v4 planned)
- **Missing:**
  - ❌ Column 3 hold gesture (climbing pixel animation)
  - ❌ Note set toggling (column 4)
  - ❌ Walking bass gestures
  - ❌ Sections-as-chords automation
  - ❌ AudioKit-quality synths (Web Audio sounds terrible)
  - ❌ Preset selection
  - ❌ Teaching mode
  - ❌ MIDI I/O
  - ❌ Multi-device sync
  - ❌ 95% of iOS features

### Sound Quality Issue
**Critical:** Web Audio API synthesis is "terrible" compared to AudioKit
- iOS uses AudioKit 5.6 (professional-grade DSP)
- Web uses basic Web Audio oscillators
- Need to port AudioKit synthesis parameters (ADSR, filters, etc.)

---

## Option 1: Commit-by-Commit Port

### Process
1. Parse all 156 iOS commits
2. Group by feature/subsystem
3. Create JSON mapping: commit → description → ported (yes/no)
4. Systematically port each commit
5. Update dropdown: day-based versions with feature summaries

### Pros
- ✅ Understand every change incrementally
- ✅ Verify each piece works before moving on
- ✅ Learn architecture gradually
- ✅ Less risk of breaking things
- ✅ Better documentation of evolution
- ✅ Can see "how we got here"

### Cons
- ❌ **TIME:** 156 commits × 30min avg = **78 hours** (2 weeks full-time)
- ❌ **Manual prompting:** Still need to guide each commit port
- ❌ **Obsolete code:** Many commits are fixes/iterations (refactored later)
- ❌ **Missing context:** Early commits lack later architectural insights
- ❌ **Death by 1000 cuts:** Lose sight of big picture
- ❌ **Tuesday deadline:** Feb 18 session is TOMORROW (impossible timeline)

### Example: Interval Mode Journey
- Jan 30: "Add column 3 note indicators" (basic version)
- Jan 30: "Column 3 colors update in real-time" (fix)
- Jan 30: "Add IntervalModeSelectionController" (hold gesture)
- Jan 30: "Complete interval mode with scale support" (final version)
- Jan 30: "fix(ui): Column 3 indicators now dimmer" (tweak)
- Jan 30: "fix(ui): Column 3 indicators match grid brightness" (tweak)
- Jan 30: "fix(ui): Column 3 stays visible during sustained notes" (fix)

**7 commits** to get interval mode right. Why port all 7 when we can port the final refined version?

---

## Option 2: One-Shot Refactor (Current iOS → Web)

### Process
1. **Opus strategic analysis** (2-3 hours):
   - Map iOS architecture → React/Web Audio equivalents
   - Identify subsystems and boundaries
   - Create integration test plan
   - Define Sonnet subagent scopes

2. **Chunked parallel porting** (via Sonnet subagents):
   - **Chunk 1:** Audio engine (AudioKit → Web Audio)
     - Synth parameter mapping
     - ADSR envelopes
     - Preset system
   - **Chunk 2:** Gesture system
     - Column 3 hold (interval mode cycling)
     - Column 4 tap (set toggling)
     - Walking bass diagonals
     - Sustain gestures
   - **Chunk 3:** Data model
     - Slot-based pattern storage
     - Set toggling logic
     - Interval mode pitch calculation
   - **Chunk 4:** Visual feedback
     - Climbing pixel animations
     - Tooltips
     - Column 3/4 indicators
   - **Chunk 5:** Advanced features
     - Sections-as-chords
     - Teaching mode
     - Preset selection

3. **Integration & testing** (1-2 hours):
   - Verify chunks work together
   - Deploy to jam.audiolux.app
   - Test on Ryan's phone

### Pros
- ✅ **SPEED:** Feature parity in 1-2 days (not weeks)
- ✅ **Latest code:** Port refined version, skip iterations
- ✅ **Big picture:** Understand full architecture upfront
- ✅ **Parallel work:** Multiple subagents simultaneously
- ✅ **Tuesday deadline:** Can demo to Ryan/Nat tomorrow
- ✅ **Better sound:** Port AudioKit params correctly first time
- ✅ **Automation:** Subagents run autonomously with clear specs

### Cons
- ⚠️ **Risk:** Harder to debug if something breaks
- ⚠️ **Dependencies:** Need to identify integration points carefully
- ⚠️ **Testing:** Requires comprehensive test plan
- ⚠️ **Token cost:** Larger upfront spend (but saves total cost)

### Mitigation Strategies
1. **Clear boundaries:** Each chunk has explicit inputs/outputs
2. **Stub interfaces:** Define contracts before parallel work
3. **Incremental integration:** Test chunk A + B, then + C, etc.
4. **Rollback plan:** Keep v1 baseline working, add v2+ features
5. **Version selector:** Already built! Can toggle between implementations

---

## Dropdown Restructuring

### Current (Feature-based)
- v1: Baseline (chromatic grid)
- v2: Interval Modes
- v3: Set Toggling (planned)
- v4: Sections as Chords (planned)

### Proposed (Day-based snapshots)
Parse git log, group by date, show only days with commits:

```typescript
interface VersionSnapshot {
  date: string;              // "2026-02-17"
  label: string;             // "Feb 17: Note Sets + Key Automation"
  branch: string;            // "harmonic-grid"
  commits: string[];         // ["57374d0", "86e8b12", "4996a2f"]
  features: string[];        // ["Note Set toggling", "Key automation", ...]
  description: string;       // Combined commit messages
}
```

**Example versions:**
- **Jan 30, 2026:** Interval Modes Complete
  - Features: Column 3 hold gesture, interval mode cycling, real-time color updates
  - Branch: main
  - Commits: 8 commits
  
- **Jan 31, 2026:** Walking Bass Gestures
  - Features: Diagonal walking bass, vertical ba-dum hits, dynamic tooltips
  - Branch: main
  - Commits: 10 commits
  
- **Feb 5, 2026:** Multi-Device Sync
  - Features: WiFi sync, Ableton Link, section copy/merge
  - Branch: feature/multi-device-sync
  - Commits: 9 commits

- **Feb 17, 2026:** Note Sets + Automation (LATEST)
  - Features: 12-note access via set toggling, key automation, home indicator deferral
  - Branch: harmonic-grid
  - Commits: 9 commits

**Benefits:**
- Can A/B test different days' feature sets
- See evolution of app over time
- Easier to identify regressions ("it worked on Feb 5 but broke by Feb 17")

---

## Sound Quality Deep Dive

### iOS (AudioKit 5.6)
```swift
// From iOS codebase
let synth = AKSynth()
synth.attackDuration = 0.01
synth.decayDuration = 0.1
synth.sustainLevel = 0.7
synth.releaseDuration = 0.3
synth.filterCutoff = 2400
synth.filterResonance = 0.4
```

### Web (Current - BAD)
```typescript
// Current terrible implementation
const osc = audioContext.createOscillator();
osc.type = 'sine';  // NO ADSR, NO FILTERING
osc.connect(audioContext.destination);
osc.start();
```

### Web (Needs - GOOD)
```typescript
// Port AudioKit params to Web Audio
const osc = audioContext.createOscillator();
const filter = audioContext.createBiquadFilter();
const gainEnv = audioContext.createGain();

// ADSR envelope
gainEnv.gain.setValueAtTime(0, now);
gainEnv.gain.linearRampToValueAtTime(1, now + attack);
gainEnv.gain.linearRampToValueAtTime(sustain, now + attack + decay);
// Release on note-off

// Filter
filter.type = 'lowpass';
filter.frequency.value = 2400;
filter.Q.value = 0.4;

osc.connect(filter).connect(gainEnv).connect(destination);
```

**Critical:** Sound quality is a SEPARATE concern from feature parity. Need dedicated audio chunk.

---

## Hybrid Approach (RECOMMENDED)

### Phase 1: Opus Strategic Planning (NOW - 3 hours)
1. ✅ Parse iOS git log (DONE above)
2. Read key iOS source files:
   - `IntervalMode.swift` (pitch calculation)
   - `IntervalModeSelectionController.swift` (hold gesture)
   - `GestureInterpreter.swift` (gesture detection)
   - `SequencerViewModel.swift` (data model)
   - `AudioKitService.swift` (synth params)
   - `PixelGridUIView.swift` (rendering)
3. Create architectural mapping document:
   - iOS class → React hook/component
   - Swift types → TypeScript interfaces
   - AudioKit → Web Audio equivalents
4. Define Sonnet subagent scopes with:
   - Input: iOS source files + web stub
   - Output: Working React component + tests
   - Dependencies: What other chunks need
   - Acceptance criteria: How to verify it works

### Phase 2: Spawn Sonnet Subagents (3-6 hours)
Use `sessions_spawn` to run 5 parallel builds:

**Subagent 1: Audio Engine**
- Task: Port AudioKit synth params to Web Audio
- Files: `AudioKitService.swift` → `src/lib/audioEngine.ts`
- Deliverable: Synths that sound as good as iOS
- Test: Record both, compare waveforms

**Subagent 2: Gesture System**
- Task: Port gesture detection and animations
- Files: `GestureInterpreter.swift` → `src/hooks/useGestures.ts`
- Deliverable: Column 3 hold, column 4 tap, walking bass
- Test: Touch sequences produce expected state changes

**Subagent 3: Data Model**
- Task: Slot-based pattern storage + set toggling
- Files: `SequencerViewModel.swift` → `src/hooks/useSequencer.ts`
- Deliverable: 12-slot system, set views, key changes
- Test: Pattern persists across set switches

**Subagent 4: Visual Feedback**
- Task: Climbing pixels, tooltips, indicators
- Files: `PixelGridUIView.swift` → `src/components/PixelBoop/`
- Deliverable: All iOS visual feedback ported
- Test: Visual parity with iOS screenshots

**Subagent 5: Advanced Features**
- Task: Sections-as-chords, teaching mode, presets
- Files: Various iOS controllers
- Deliverable: Row 22 automation, preset selection
- Test: Can paint root notes, cycle presets

### Phase 3: Integration & Deploy (2 hours)
1. Merge all subagent branches
2. Integration testing (chunks A+B, then +C, etc.)
3. Deploy to jam.audiolux.app
4. Test on Ryan's phone
5. Tuesday demo ready! 🎉

---

## Risk Analysis

### One-Shot Refactor Risks

**Risk 1: Architectural mismatch**
- SwiftUI concepts don't map to React
- **Mitigation:** Opus planning phase identifies adaptations needed
- **Example:** SwiftUI `@Published` → React `useState`

**Risk 2: Missing dependencies**
- Chunk A needs output from Chunk B
- **Mitigation:** Define interfaces first, implement in parallel
- **Example:** Audio engine needs gesture events → define event schema upfront

**Risk 3: Integration bugs**
- Components work alone but not together
- **Mitigation:** Incremental integration (A+B → A+B+C → ...)
- **Example:** Test column 3 + column 4 together before adding gestures

**Risk 4: Sound quality still bad**
- Web Audio limitations vs. AudioKit
- **Mitigation:** Port exact AudioKit params, A/B test with recordings
- **Fallback:** Use AudioKit.js if Web Audio insufficient

**Risk 5: Tuesday deadline miss**
- Subagents take longer than estimated
- **Mitigation:** Prioritize core features (interval modes, set toggling, audio)
- **Fallback:** Ship partial feature set, iterate post-demo

### Commit-by-Commit Risks

**Risk 1: Time overrun**
- 156 commits = weeks of work
- **No mitigation:** Fundamentally too slow

**Risk 2: Tuesday deadline miss**
- Guaranteed to miss (impossible timeline)
- **No mitigation:** Can't compress 78 hours into 1 day

**Risk 3: Feature creep**
- Porting obsolete intermediate versions
- **No mitigation:** Still need to port every commit

---

## Recommendation: ONE-SHOT REFACTOR

### Why
1. **Tuesday deadline:** Only viable path to demo tomorrow
2. **Speed:** 1-2 days vs. 2 weeks
3. **Quality:** Port refined code, skip iterations
4. **Sound:** Fix audio on first pass
5. **Automation:** Sonnet subagents handle grunt work
6. **Version selector:** Already built, can toggle implementations
7. **Big picture:** Understand full architecture upfront

### Trade-offs Accepted
- Higher upfront complexity (managed via Opus planning)
- Need comprehensive test plan (worth the time savings)
- Parallel work coordination (clear interfaces solve this)

### Execution Plan
1. **NOW (Opus, 3 hours):** Read iOS source, create architectural map, define subagent scopes
2. **Next (Sonnet × 5, 3-6 hours):** Parallel porting via `sessions_spawn`
3. **Tonight (Integration, 2 hours):** Merge, test, deploy to jam.audiolux.app
4. **Tomorrow morning:** Test on Ryan's phone, iterate if needed
5. **Tomorrow afternoon:** Demo to Ryan/Nat with working feature parity! 🎉

### Success Criteria
- ✅ Interval modes working (column 3 hold gesture)
- ✅ Set toggling working (column 4 tap)
- ✅ Audio sounds as good as iOS
- ✅ Version selector shows day-based snapshots
- ✅ Deployed to jam.audiolux.app
- ✅ Works on Ryan's phone
- ✅ Ready for Tuesday session

---

## Next Steps

**Approve this plan?**
1. I (Opus) will read key iOS source files
2. Create architectural mapping: iOS → React/Web Audio
3. Write detailed Sonnet subagent specs
4. Spawn 5 parallel builds
5. Coordinate integration
6. Ship to jam.audiolux.app by tonight
7. Demo ready for Tuesday! 🚀

**Or commit-by-commit?**
- I'll create JSON mapping of all 156 commits
- Estimate 2 weeks to completion
- Miss Tuesday deadline
- But... more incremental understanding?

**What's your call?**
