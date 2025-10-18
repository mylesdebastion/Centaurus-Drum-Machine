# Epic Index

This directory contains all project epics organized by epic number. Each epic represents a major feature area or system architecture component.

**Total Epics:** 15 (6 Complete, 4 In Progress, 5 Planning)

---

## Epic Status Overview

| Epic | Title | Status | Priority | Stories | Progress |
|------|-------|--------|----------|---------|----------|
| [Epic 1](./epic-1-apc40-hardware-controller-integration.md) | APC40 Hardware Controller Integration | 📝 PLANNING | High | TBD | Not started |
| [Epic 2](./epic-2-boomwhacker.md) | Boomwhacker Educational System | 📝 PLANNING | Medium | TBD | Not started |
| [Epic 3](./epic-3-multi-controller-pro-monetization.md) | Multi-Controller Pro Monetization | 📝 PLANNING | Low | TBD | Not started |
| [Epic 4](./epic-4-global-music-controls.md) | Global Music Controls & State Management | ✅ COMPLETE | High | 6 stories | 100% (6/6 complete) |
| [Epic 5](./epic-5-universal-responsive-architecture.md) | Universal Responsive Architecture | ✅ COMPLETE | High | 1 story | 100% (Story 5.1 complete) |
| [Epic 6](./epic-6-multi-client-sessions-wled.md) | Multi-Client Sessions & WLED Integration | 🚧 IN PROGRESS | High | 5 stories | 20% (Phase 0 complete, blocked) |
| [Epic 7](./epic-7-jam-session-backend.md) | Jam Session Backend Infrastructure | ✅ COMPLETE | High | 10 stories | 100% (Supabase Realtime complete) |
| [Epic 9](./epic-9-multi-instrument-midi-visualization.md) | Multi-Instrument MIDI Visualization | 🚧 IN PROGRESS | High | 4 stories | 50% (9.1-9.2 complete, 9.3-9.4 pending) |
| [Epic 11](./epic-11-roli-lumi-integration.md) | ROLI LUMI Integration | 🚧 IN PROGRESS | High | 1 story | 40% (Phase 2.1 complete) |
| [Epic 12](./epic-12-sound-engine-expansion.md) | Sound Engine Expansion | ✅ COMPLETE | Medium | 1 story | 100% (All engines implemented) |
| [Epic 13](./epic-13-documentation-infrastructure.md) | Documentation Infrastructure & Reconciliation | ✅ COMPLETE | High | 2 stories | 100% (both stories complete) |
| [Epic 14](./epic-14-module-adapter-system.md) | Module Adapter System & Global State Integration | 🚧 IN PROGRESS | High | 6 stories | 10% (14.1 in progress) |
| [Epic 15](./epic-15-chord-melody-arranger.md) | Chord Progression & Melody Arranger Module | 📝 PLANNING | High | 9 stories | Not started |
| [Epic 16](./epic-16-unified-module-ui-template.md) | Unified Studio Module UI Template | 📝 PLANNING | Medium | 3 stories | Not started |
| [Epic 17](./epic-17-remote-wled-state-sync.md) | Remote WLED Control via Jam Sessions | 📝 PLANNING | High | 3 stories | Not started |

---

## Epic Descriptions

### Epic 1: APC40 Hardware Controller Integration
**Status:** 📝 PLANNING
**Goal:** Integrate Akai APC40 MIDI controller for physical drum sequencing with grid buttons and faders.

**Key Features:**
- Web MIDI API integration for APC40
- Grid button mapping to drum sequencer
- Fader controls for tempo, volume, effects
- LED feedback on hardware

---

### Epic 2: Boomwhacker Educational System
**Status:** 📝 PLANNING
**Goal:** Create music education tools using boomwhacker color standards for visual learning.

**Key Features:**
- Chromatic color mapping (C=Red, D=Yellow, etc.)
- Interactive scale visualization
- Educational games and exercises
- Visual chord progression aids

---

### Epic 3: Multi-Controller Pro Monetization
**Status:** 📝 PLANNING
**Goal:** Professional tier with support for multiple simultaneous MIDI controllers.

**Key Features:**
- Multi-device MIDI coordination
- Controller presets and mappings
- Pro subscription model
- Advanced hardware features

---

### Epic 4: Global Music Controls & State Management
**Status:** ✅ COMPLETE
**Goal:** Persistent top header bar with global music controls (tempo, key, scale, hardware I/O, visualization colors) across all views.

**Key Features:**
- GlobalMusicContext with React Context API
- Persistent audio engine lifecycle
- Hardware I/O integration points
- Visualization color mapping system
- Module loading system & dynamic canvas

**Stories:**
- ✅ [Story 4.1](../stories/4.1.story.md): Global Music State Context
- ✅ [Story 4.2](../stories/4.2.story.md): Global Music Header Bar Component
- ✅ [Story 4.3](../stories/4.3.story.md): Persistent Audio Engine Lifecycle
- ✅ [Story 4.4](../stories/4.4.story.md): Hardware I/O Integration Points
- ✅ [Story 4.5](../stories/4.5.story.md): Visualization Color Mapping System
- ✅ [Story 4.7](../stories/4.7.story.md): Module Loading System & Dynamic Canvas

**Commit:** dbe6539 (2025-10-09)

---

### Epic 5: Universal Responsive Architecture
**Status:** ✅ COMPLETE
**Goal:** Unified responsive architecture for mobile/tablet/desktop with critical stateful component continuity fix.

**Key Features:**
- useResponsive hook for breakpoint detection
- ResponsiveContainer with layout strategy
- MobileNavigation with configurable tabs
- CollapsiblePanel and ResponsiveToolbar patterns
- Single instance pattern for stateful components (prevents audio/LED interruption)

**Stories:**
- ✅ [Story 5.1](../stories/5.1.story.md): Universal Mobile-Responsive Architecture

**Commit:** b0d9791 (2025-10-09)

---

### Epic 6: Multi-Client Sessions & WLED Integration
**Status:** 🚧 IN PROGRESS (Phase 0 Complete, Blocked by HTTPS→HTTP Security)
**Goal:** Enable multiple users to join shared jam sessions with their own WLED LED devices.

**Key Features:**
- Unified WLED Device Manager (✅ Phase 0 complete)
- Session infrastructure with Socket.io (📝 Planned)
- Per-user WLED device ownership
- Real-time audio/MIDI data sharing
- Progressive disclosure UX

**Critical Blocker:** Modern browsers block HTTPS websites from making HTTP requests to local WLED devices. Phase 0 (WLED Device Manager) works perfectly in dev environment (`http://localhost:5173`) but requires Capacitor native app for production deployment.

**Stories:**
- ✅ [Story 6.1](../stories/6.1.story.md): Multi-Client Shared Sessions (Phase 0 only)

**Commit:** 8ecffbf (2025-10-09)

---

### Epic 9: Multi-Instrument MIDI Visualization Suite
**Status:** 🚧 IN PROGRESS (Stories 9.1-9.2 Complete)
**Goal:** Enable musicians to visualize and perform with MIDI instruments (piano, guitar) in standalone experiments and `/jam` sessions with WLED hardware output.

**Key Features:**
- Web MIDI Input Engine (✅ Complete)
- Piano Roll Visualizer with LED strip (✅ Complete)
- Guitar Fretboard Visualizer with LED matrix (📝 Planned)
- Modular instrument loader for `/jam` (📝 Planned)

**Stories:**
- ✅ [Story 9.1](../stories/9.1.story.md): Web MIDI Input Engine
- ✅ [Story 9.2](../stories/9.2.story.md): Piano Roll Visualizer with LED Strip Output
- 📝 Story 9.3: Guitar Fretboard Visualizer with LED Matrix (Planned)
- 📝 Story 9.4: Modular Instrument Loader for `/jam` (Planned)

**Commits:** ebeba83 (9.1), 58a0009 (9.2)

---

### Epic 11: ROLI LUMI Integration
**Status:** 🚧 IN PROGRESS (Phase 2.1 Complete)
**Goal:** Seamless integration with ROLI Piano M (LUMI Keys) for visual feedback showing scales, intervals, and chord tones through per-key LED control.

**Key Features:**
- Two-tier approach: SysEx (simple) + LittleFoot script (advanced)
- Automatic scale/key synchronization (✅ Phase 2.1 complete)
- Settings integration (📝 Planned)
- Advanced features with LittleFoot script (📝 Planned)

**Stories:**
- 🚧 [Story 11.1](../stories/11.1.roli-lumi-integration.story.md): ROLI Piano M / LUMI Keys Integration (Phase 2.1 complete)

**Commit:** d3a3d5f (2025-10-11)

---

### Epic 12: Sound Engine Expansion
**Status:** ✅ COMPLETE
**Goal:** Expand sound palette with high-quality instrument engines (Acoustic Guitar, Fender Rhodes, FM Bell, 808 Drums) for Isometric Sequencer and Piano Roll.

**Key Features:**
- Unified sound engine architecture
- Acoustic Guitar with reverb (Tone.Sampler)
- Fender Rhodes with chorus (Tone.Sampler)
- FM Bell (Tone.FMSynth)
- 808 Drums with velocity dynamics (Tone.MembraneSynth/NoiseSynth/MetalSynth)

**Stories:**
- ✅ Story 12.1: Sound Engine Expansion (Acoustic Guitar, Rhodes, FM Bell, 808 Drums)

**Commits:** 09c7088 (Guitar), ff1451e (Rhodes), 778c00f (FM Bell), be064e8/06e6da9 (808 Drums)

---

### Epic 13: Documentation Infrastructure & Reconciliation
**Status:** ✅ COMPLETE
**Goal:** Transform brownfield documentation into greenfield structure with comprehensive templates, standards, and systematic backfill of outdated content.

**Key Features:**
- Documentation standards and templates (✅ Story 13.1)
- Epic and story templates with Dev Agent Record format
- Brownfield documentation reconciliation (✅ Story 13.2)
- PRD consolidation to docs/epics/
- Maintenance workflows for sustainable documentation
- Comprehensive documentation cleanup (11 files moved/renamed)

**Stories:**
- ✅ Story 13.1: Documentation Standards & Templates (5 templates created, 2,300+ lines)
- ✅ Story 13.2: Brownfield Documentation Reconciliation (10 stories updated, 5 epics created, 7,510 lines)

**Deliverables (Completed 2025-10-13):**
- 5 templates in docs/templates/ (standards, epic/story templates, maintenance guidelines)
- 5 new epics created (Epic 5, 6, 11, 12, 13)
- 10 story statuses updated with 6 Dev Agent Records backfilled
- docs/epics/index.md with all 11 epics consolidated
- Architecture docs updated (12 missing components added)
- Documentation cleanup (11 files organized, 4 checkpoint documents archived)

**Archived Checkpoints:** [docs/epics/archives/epic-13-checkpoints/](./archives/epic-13-checkpoints/)

---

### Epic 14: Module Adapter System & Global State Integration
**Status:** 🚧 IN PROGRESS (Story 14.1 In Progress)
**Goal:** Transform brownfield module system from duplicate local state to unified greenfield architecture where modules intelligently adapt to their context and consume global musical parameters.

**Key Features:**
- Module adapter pattern for context detection (standalone vs. embedded)
- Eliminate duplicate controls across 5 modules (PianoRoll, GuitarFretboard, IsometricSequencer)
- Extend GlobalMusicContext with transport state (play/pause)
- Maintain always-mount pattern for audio persistence
- Full backward compatibility for standalone views

**Stories:**
- 🚧 Story 14.1: Brownfield Module System Architecture Design (In Progress - Sections 1-2 complete)
- ⏳ Story 14.2: Module Adapter Pattern Implementation (Blocked by 14.1)
- ⏳ Stories 14.3-14.5: Module Refactoring (PianoRoll, GuitarFretboard, IsometricSequencer)
- ⏳ Story 14.6: Global Transport State Implementation (Blocked by 14.3-14.5)

**Created:** 2025-01-13 (Winston - Architect)

---

### Epic 7: Jam Session Backend Infrastructure
**Status:** ✅ COMPLETE
**Goal:** Build real-time collaborative backend infrastructure using Supabase Realtime for session management and state synchronization.

**Key Features:**
- Supabase Realtime Channels with Broadcast + Presence
- Session management (room codes, participants)
- Real-time state sync (tempo, playback, key/scale)
- Broadcast/subscribe patterns via `supabaseSessionService`
- Cost-effective MVP (free tier: 200 connections, 2M messages/month)

**Stories:**
- ✅ [Story 7.1](../stories/7.1-supabase-setup.md): Supabase Project Setup
- ✅ [Story 7.2](../stories/7.2-supabase-realtime-service.md): Supabase Realtime Service Layer
- ✅ [Story 7.3](../stories/7.3-jam-session-ui-integration.md): Jam Session UI Integration
- ✅ Stories 7.4-7.10: Additional features (shareable URLs, state sync, error handling)

**Technical Foundation for:**
- Epic 17: Remote WLED Control (state sync extension)
- Epic 6: Multi-Client Sessions (future WebRTC integration)

---

### Epic 15: Chord Progression & Melody Arranger Module
**Status:** 📝 PLANNING
**Goal:** Transform guitar fretboard chord progression feature into standalone Studio module with melody arranger capabilities and intelligent module routing.

**Key Features:**
- ChordMelodyArranger module for Studio
- Chord progression builder with genre-based presets
- Melody arranger step sequencer
- Module routing system (send to Piano, Guitar, Drum, etc.)
- GlobalMusicContext integration (key/scale/tempo sync)
- Roman numeral progressions (adaptable to any key)

**Stories:**
- 📝 Story 15.1-15.9: Chord service extraction, UI, melody arranger, routing, integration

**Dependencies:**
- Epic 4 (GlobalMusicContext)
- Epic 14 (Module adapter patterns)

---

### Epic 16: Unified Studio Module UI Template
**Status:** 📝 PLANNING
**Goal:** Establish consistent UI template for all Studio modules by extracting ChordMelodyArranger header/settings pattern.

**Key Features:**
- ModuleHeader component (icon, title, subtitle, settings gear)
- ModuleTransportControls component (play/pause/stop)
- ModuleSettingsPanel component (collapsible slide-up panel)
- Responsive design patterns
- Apply to all 6 modules (DrumMachine, PianoRoll, GuitarFretboard, etc.)

**Stories:**
- 📝 [Story 16.1-16.6](../stories/): Extract template, migrate ChordMelody, apply to all modules

**Dependencies:**
- Epic 4 (GlobalMusicContext transport state)
- Epic 5 (Responsive patterns)
- Epic 15 (ChordMelodyArranger reference implementation)

---

### Epic 17: Remote WLED Control via Jam Sessions
**Status:** 📝 PLANNING
**Goal:** Enable remote devices to control local WLED hardware via jam sessions by syncing musical state through Supabase Realtime.

**Key Features:**
- Musical state synchronization (drum patterns, notes, chords)
- Delta-based updates (99% bandwidth savings)
- Client-side color derivation (50% bandwidth savings)
- Local LED frame generation (<1ms latency)
- Natural "bridge" behavior (no special mode needed)
- 79x bandwidth reduction vs naive approach (330 KB vs 26 MB per jam)

**Stories:**
- 📝 [Story 17.1](../stories/17.1-delta-drum-state-sync.md): Delta-Based Drum State Sync
- 📝 [Story 17.2](../stories/17.2-client-side-color-derivation.md): Client-Side Color Derivation
- 📝 [Story 17.3](../stories/17.3-full-pattern-sync-led-integration.md): Full Pattern Sync & LED Integration

**Dependencies:**
- Epic 7 (Supabase Realtime infrastructure) ✅
- Epic 14 (LED Compositor integration) ✅

**Architecture:** [remote-wled-state-sync.md](../architecture/remote-wled-state-sync.md)

**Future Enhancements (Epic 18+):**
- Multi-module state sync (Piano Roll, IsometricSequencer)
- Binary message format (Uint8Array optimization)
- DJ visualizer audio input integration

---

## Epic Status Legend

- ✅ **COMPLETE**: All stories implemented and verified
- 🚧 **IN PROGRESS**: 1+ stories in progress or complete, more work remains
- 📝 **PLANNING**: No stories started, design/planning phase

---

## Epic Lifecycle

### PLANNING → IN PROGRESS
- First story moves to implementation
- Epic document created with all stories defined
- Technical architecture designed
- Success metrics established

### IN PROGRESS → COMPLETE
- All stories marked COMPLETE
- Integration tests passing
- No regressions in existing features
- Documentation complete
- Success metrics met

---

## Related Documentation

- **PRD**: [docs/prd/index.md](../prd/index.md) - Product requirements (references epics)
- **Stories**: [docs/stories/](../stories/) - Individual story files
- **Templates**: [docs/templates/](../templates/) - Epic and story templates
- **Architecture**: [docs/architecture/](../architecture/) - System architecture documentation
- **Standards**: [docs/templates/documentation-standards.md](../templates/documentation-standards.md) - Documentation conventions

---

## Epic Creation Workflow

1. **Copy template**: `cp docs/templates/epic-template.md docs/epics/epic-N-name.md`
2. **Populate metadata**: Epic number, name, status, priority, target completion
3. **Define stories**: Use story template for each story (X.1, X.2, etc.)
4. **Technical architecture**: Code examples, diagrams, data flow
5. **Success metrics**: Measurable criteria for epic completion
6. **Update this index**: Add epic to status table and descriptions

---

**Last Updated:** 2025-10-18
**Maintained By:** BMad Framework (Product Owner, PM, Dev Agents)
