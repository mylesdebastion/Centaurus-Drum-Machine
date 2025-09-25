# Source Tree

## Existing Project Structure
```plaintext
src/
├── components/
│   ├── DrumMachine/        # Core sequencer components
│   ├── Education/          # Educational mode
│   ├── JamSession/         # Session management  
│   ├── Layout/            # App layout components
│   ├── Visualizer/        # Visual feedback system
│   └── Welcome/           # Welcome screen
├── types/
│   └── index.ts           # TypeScript interfaces
├── utils/
│   ├── audioEngine.ts     # Tone.js audio singleton
│   ├── colorMapping.ts    # Visual feedback utilities
│   └── drumPatterns.ts    # Pattern generation
├── App.tsx                # Root application component
├── main.tsx              # Vite entry point
└── index.css             # Global styles
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
