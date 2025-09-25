# Data Models and Schema Changes

## New Data Models

### HardwareController
**Purpose**: Abstract base interface for all hardware controllers  
**Integration**: Defines contract that APC40 and future controllers implement

**Key Attributes**:
- `id: string` - Unique identifier for controller instance
- `name: string` - Human-readable controller name  
- `connectionStatus: 'connected' | 'disconnected' | 'error'` - Real-time connection state
- `capabilities: ControllerCapabilities` - Features supported by this controller

**Relationships**:
- **With Existing**: Subscribes to existing sequencer state via React context
- **With New**: Base interface implemented by APC40Controller and future controllers

### APC40Controller
**Purpose**: APC40-specific implementation with LED control and MIDI mapping  
**Integration**: Implements HardwareController interface with APC40-specific features

**Key Attributes**:
- `midiInput: WebMIDI.MIDIInput | null` - Web MIDI API input connection
- `midiOutput: WebMIDI.MIDIOutput | null` - Web MIDI API output connection  
- `ledStates: Map<number, number>` - Current LED state cache for optimization
- `gridMapping: GridMapping` - APC40 8x5 grid to 16-step sequencer mapping

**Relationships**:
- **With Existing**: Listens to DrumTrack state changes, integrates with existing audio timing
- **With New**: Managed by HardwareManager, communicates with other controllers through events

### HardwareEvent
**Purpose**: Standardized event system for hardware ↔ sequencer communication  
**Integration**: Uses React's existing event patterns and context system

**Key Attributes**:
- `type: 'step_toggle' | 'connection_change' | 'hardware_input'` - Event classification
- `controllerId: string` - Source controller identifier
- `data: Record<string, unknown>` - Type-safe event payload
- `timestamp: number` - High-precision event timing

**Relationships**:
- **With Existing**: Integrates with existing React event handling and state management
- **With New**: Core communication mechanism between all hardware modules

## Schema Integration Strategy

**Database Changes Required**: None - all hardware state managed in React component state and localStorage

**Storage Strategy**:
- **Runtime State**: React useState/useContext for active hardware connections and real-time state
- **Persistent Settings**: localStorage for hardware preferences (LED brightness, color modes, device pairing)
- **Session State**: All hardware state cleared on app reload, following existing pattern

**Backward Compatibility**: Complete - no database schema exists, all new state management follows existing client-side patterns
