# Tech Stack

## Existing Technology Stack

| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|---------------------|--------|
| **Frontend Framework** | React | 18.2.0 | Core UI framework for hardware components | Maintained, no changes |
| **Language** | TypeScript | 5.2.2 | All new hardware modules | Strict mode compliance |
| **Build Tool** | Vite | 5.0.8 | Build pipeline for hardware modules | No additional config needed |
| **Styling** | Tailwind CSS | 3.3.6 | Hardware UI component styling | Existing design tokens |
| **Audio Engine** | Tone.js | 15.1.22 | Timing synchronization for LED updates | Extends existing scheduler |
| **Icons** | Lucide React | 0.294.0 | Hardware status icons | Consistent icon system |
| **State Management** | React useState/Context | 18.2.0 | Hardware module state | Follows existing patterns |

## New Technology Additions

| Technology | Version | Purpose | Rationale | Integration Method |
|------------|---------|---------|-----------|-------------------|
| **Web MIDI API** | Native Browser API | MIDI device communication | Only browser-native API for MIDI hardware | Direct browser API calls |
| **Performance.now()** | Native Browser API | High-precision timing | Required for LED synchronization accuracy | Extends existing Tone.js timing |

**Technology Selection Rationale**: No external dependencies added. Enhancement uses only browser-native APIs (Web MIDI, Performance) that integrate cleanly with existing Tone.js timing system. This maintains the project's philosophy of minimal external dependencies while enabling professional hardware integration.
