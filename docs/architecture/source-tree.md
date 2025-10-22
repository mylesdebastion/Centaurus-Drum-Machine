# Source Tree

## Existing Project Structure
```plaintext
src/
├── components/
│   ├── DrumMachine/              # Core sequencer components
│   ├── Education/                # Educational mode
│   ├── GlobalMusicHeader/        # Global music controls (Epic 4)
│   ├── GlobalMusicHeaderTest.tsx # Test component for global controls
│   ├── GuitarFretboard/          # Guitar fretboard visualizer (Epic 9)
│   ├── IsometricSequencer/       # 3D isometric sequencer
│   ├── JamSession/               # Multi-user session management
│   ├── JamSessionLegacy/         # Legacy session (deprecated)
│   ├── Layout/                   # App layout components (Story 5.1)
│   │   ├── CollapsiblePanel.tsx  # Collapsible settings panel
│   │   ├── MobileNavigation.tsx  # Mobile bottom tab navigation
│   │   ├── MobileViewContainer.tsx # Mobile view wrapper
│   │   ├── ResponsiveContainer.tsx # Responsive layout wrapper
│   │   └── ResponsiveToolbar.tsx # Auto-reflow toolbar
│   ├── LEDStripManager/          # LED strip device management (deprecated, see WLED/)
│   ├── LiveAudioVisualizer/      # DJ-style audio visualizer
│   ├── LumiTest/                 # ROLI LUMI testing component (Epic 11)
│   ├── MIDI/                     # MIDI device components (Epic 9)
│   │   └── MIDIDeviceSelector.tsx # MIDI device selection UI
│   ├── Music/                    # Music theory components
│   ├── PianoRoll/                # Piano roll visualizer (Epic 9)
│   ├── Studio/                   # Module loading system (Story 4.7)
│   │   ├── ModuleCanvas.tsx      # Dynamic module canvas
│   │   ├── ModuleSelector.tsx    # Module selection panel
│   │   ├── ModuleWrapper.tsx     # Module chrome wrapper
│   │   ├── Studio.tsx            # Main studio container
│   │   ├── moduleRegistry.ts     # Module registry and types
│   │   └── useModuleManager.ts   # Module state management hook
│   ├── Visualizer/               # Visual feedback system
│   ├── Welcome/                  # Welcome screen
│   ├── WLED/                     # WLED device management (Epic 6)
│   │   ├── WLEDDeviceCard.tsx    # Device card UI
│   │   ├── WLEDDeviceManager.tsx # Unified device manager
│   │   ├── WLEDVirtualPreview.tsx # LED visualization
│   │   └── types.ts              # WLED TypeScript interfaces
│   └── WLEDExperiment/           # WLED testing/experiments
├── contexts/
│   └── GlobalMusicContext.tsx    # Global music state (Story 4.1)
├── hooks/
│   ├── index.ts                  # Hook barrel exports
│   ├── useMusicalScale.ts        # Musical scale utilities
│   ├── useMIDIInput.ts           # MIDI input hook (Epic 9)
│   └── useResponsive.ts          # Responsive breakpoint hook (Story 5.1)
├── types/
│   └── index.ts                  # TypeScript interfaces
├── utils/
│   ├── audioEngine.ts            # Tone.js audio singleton (Story 4.3)
│   ├── colorMapping.ts           # Visual feedback utilities (Story 4.5)
│   ├── drumPatterns.ts           # Pattern generation
│   ├── lumiController.ts         # ROLI LUMI SysEx control (Epic 11)
│   ├── midiInputManager.ts       # Web MIDI API integration (Story 9.1)
│   └── soundEngines.ts           # Sound engine factory (Epic 12)
├── App.tsx                       # Root application component
├── main.tsx                      # Vite entry point
└── index.css                     # Global styles
```

## New File Organization
```plaintext
src/
├── components/            # Existing component structure unchanged
├── hardware/              # NEW: Hardware abstraction layer
│   ├── core/              # Hardware abstraction interfaces
│   │   ├── HardwareManager.tsx       # Central hardware orchestrator
│   │   ├── useHardware.ts           # React hook for hardware access
│   │   └── types.ts                 # Hardware TypeScript interfaces
│   ├── apc40/             # APC40-specific implementation
│   │   ├── APC40Controller.ts       # APC40 device controller
│   │   ├── midiMapping.ts          # APC40 MIDI note mappings
│   │   ├── ledPatterns.ts          # LED color and animation logic
│   │   └── constants.ts            # APC40-specific constants
│   ├── ui/                # Hardware UI components
│   │   ├── HardwareStatusIndicator.tsx  # Connection status display
│   │   ├── HardwareSettingsPanel.tsx   # Settings integration
│   │   └── DeviceManager.tsx           # Multi-device management
│   └── utils/             # Shared hardware utilities
│       ├── webMidiApi.ts            # Web MIDI API wrapper
│       ├── connectionManager.ts     # Device connection handling  
│       └── eventSystem.ts           # Hardware event coordination
├── types/
│   └── index.ts           # Extended with hardware interfaces
└── utils/                 # Existing utilities unchanged
```

## Integration Guidelines

- **File Naming**: Follow existing camelCase for utilities, PascalCase for components (HardwareManager.tsx, midiMapping.ts)
- **Folder Organization**: Hardware module completely self-contained in `src/hardware/` to prevent coupling with existing code
- **Import/Export Patterns**: Use existing barrel export pattern (`hardware/index.ts`), maintain relative import consistency
