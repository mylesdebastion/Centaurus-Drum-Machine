# PRD Addendum — MVP Guitar Module & Modular Visualizer Routing

## 0) Rationale & Fit
Add a **Guitar Module** alongside the existing Drum Machine to enable chord/note entry, tab-style editing, and synced playback. The visualizer will be extended to support **per-instrument output routing** (e.g., WLED matrix at a dedicated IP for guitar vs. a different device for drums) and to **MIDI grid controllers** (e.g., APC40) so participants can see the instrument nearest to them. A reference fretboard → WLED prototype already exists in the project codebase and informs viable UDP packet paths and color mapping approaches. :contentReference[oaicite:0]{index=0}

---

## 1) Scope: Guitar Module (MVP)

### 1.1 User Stories
- **As a jammer**, I can pick **Guitar** as my instrument in a room and immediately strum prebuilt chord shapes in the current key.
- **As a beginner**, I can use a **basic tab editor** (Guitar-Pro-lite) to place notes/chords at specific steps without a cluttered DAW UI.
- **As a group**, we can set a **Master Jam Key** so suggested chords/notes are surfaced (roman numeral diatonic options + common borrowed chords).
- **As a performer**, I can send the guitar visualizer to its **own WLED grid** (separate IP) and keep drums on a different device.
- **As an arranger**, I can expand loop length from **8/16 bars up to 64 bars** to build a section (A/B/bridge), and it **stays in sync** with the drum machine.

### 1.2 Functional Requirements (Guitar)
- **GTR-FR1: Track Type**
  - Add **Guitar Track** type selectable in “Choose Instrument.” Defaults: 6 strings, 0–24 frets, E Standard; tunings switchable (Drop D, D Standard).
- **GTR-FR2: Tab Programming View**
  - Minimal tab grid aligned to the global step grid (16 steps default; supports 8–64 bars).
  - Per-string, per-step placement of **fret numbers** (0 = open, X = mute). Multi-string stacks = chords.
  - Quick-insert **Chord Picker** with fretboard preview; supports common voicings and power chords.
- **GTR-FR3: Playback & Quantization**
  - Scheduled note-on/note-off events aligned to the **global clock** (same engine as drums).
  - **Humanize** (± few ms) toggle and **strum direction/lag** per chord (up/down/alt) to simulate guitar feel.
- **GTR-FR4: Master Jam Key**
  - Room owner sets **Key + Scale/Mode** (e.g., C Major, A Dorian). System surfaces **Top Recommended Chords** (I, ii, iii, IV, V, vi, vii°; common extended/borrowed options) and **target tones**.
  - Chord selector highlights **diatonic** matches first; non-diatonic options shown under “Spice.”
- **GTR-FR5: Sections & Looping**
  - **Section Manager**: define loop length per section (8/16/32/64 bars), name sections (A, B, Bridge), and **chain** sections for song form (A–A–B–A…).
  - Room-level **Loop Length Agreement**: All tracks auto-extend/quantize to section length; visual timeline stretches accordingly.
- **GTR-FR6: Sound & MIDI**
  - WebAudio **basic pluck** (Karplus–Strong or short decay sample) per note; velocity from UI or MIDI input.
  - **WebMIDI IN** for external guitar-style controllers; **MIDI OUT** per note to external synths (per-string channels optional later).
- **GTR-FR7: Visualizer Mapping**
  - Note color per the global mode (Spectrum/Chromatic/Harmonic). **Velocity → brightness** preserved.
  - Optional **fretboard overlay** on screen for learning mode (show active notes; label pitch names).
- **GTR-FR8: WLED Routing**
  - Guitar visualizer can target a **dedicated WLED IP** (separate from drums). Supports **WARLS/UDP 21324** style streaming and per-frame RGB buffers (aligns with existing prototype). :contentReference[oaicite:1]{index=1}

### 1.3 Non-Functional (Guitar)
- **Timing**: same global scheduler as drums; downbeat alignment on section boundaries.
- **Latency Budget**: target sub-50 ms end-to-end visual + audio reaction; compensate via look-ahead scheduling on bar edges.
- **Accessibility**: larger tap targets in tab view; color-blind friendly overlays (symbols for intervals/roots).

---

## 2) Visualizer: Modular Output & Routing Matrix

### 2.1 Concept
Make the visualizer **device-agnostic** and **multi-sink**. Any track (Drums, Guitar, Keys…) can be routed to one or more **Outputs**:
- **Screen** (Canvas/WebGL)
- **WLED** (one or more IPs; per-instrument grids)
- **MIDI Grid Controllers** (e.g., APC40, Launchpad: light pads via Note/CC)
- **Other** future sinks (OSC, Art-Net)

### 2.2 Routing UX
- **Per-Track “Visual Output” Menu**:
  - Checkboxes for **Screen**, **WLED(IP:port)**, **MIDI Device (port/channel)**.
  - “**Nearest Device**” quick-pick: app remembers a participant’s physical device mapping (e.g., Guitar → the grid on my desk).
- **Room Routing Matrix** (Host View):
  - Rows = Instruments; Columns = Outputs; cells are toggles.
  - Save/Recall **Routing Presets** per room.

### 2.3 Protocol & Drivers
- **WLED Driver**
  - **UDP 21324** streaming (WARLS packet header + RGB payload), frame rates coarsened to beat-friendly cadence when needed to reduce bandwidth. :contentReference[oaicite:2]{index=2}
  - Device config: IP, pixel topology (strip vs. matrix W×H), scan order, color order.
- **MIDI Grid Driver**
  - Device profile per controller (APC40/Launchpad): pad note map, feedback channels.
  - Light logic: map **time cursor** to a column; illuminate active steps/notes; apply **color mapping mode**; **velocity → pad brightness** (if supported).
- **Screen Driver**
  - Existing canvas pipeline; add **Fretboard Layer** for guitar (toggleable).

---

## 3) Data Model Additions

### 3.1 Guitar Track
```ts
type TuningName = "E Standard" | "Drop D" | "D Standard";
type Fret = number;         // 0..24, -1 for mute (X)
type StringIndex = 0|1|2|3|4|5;

interface TabEvent {
  bar: number;              // 0..N
  step: number;             // 0..15 (per 16th), supports higher PPQ later
  notes: Array<{ string: StringIndex; fret: Fret; velocity: 1..127 }>;
  strum?: "up"|"down"|"alt";
  strumLagMs?: number;      // 0..40ms typical
  lengthSteps?: number;     // sustain length in steps
}

interface GuitarTrack {
  id: string;
  tuning: TuningName;
  capo?: number;            // 0..7
  tab: TabEvent[];          // sparse
  instrumentPreset: "pluck-basic" | "nylon" | "clean";
  midiOut?: MidiRouting;    // optional
}
