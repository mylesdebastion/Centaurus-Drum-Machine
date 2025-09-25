# Centaurus Drum Machine - APC40 Hardware Controller Integration PRD

**Version**: 1.0  
**Date**: 2025-09-25  
**Product Manager**: John (BMad PM Agent)  

## Intro Project Analysis and Context

### Existing Project Overview

**Analysis Source**: IDE-based fresh analysis combined with comprehensive research document

**Current Project State**: 
The Centaurus Drum Machine is a web-based drum sequencer built with React/TypeScript, utilizing Tone.js for audio synthesis and Web Audio API for real-time audio processing. The application features:
- React-based component architecture with TypeScript
- Real-time step sequencer with 16-step patterns
- Audio engine using Tone.js synthesizers (MembraneSynth, NoiseSynth, MetalSynth)
- Visual feedback system with customizable color modes
- Responsive design with mobile/desktop layouts
- Educational mode for teaching rhythm programming

### Available Documentation Analysis

✅ **Tech Stack Documentation** (React, TypeScript, Vite, Tailwind CSS, Tone.js)  
✅ **Source Tree/Architecture** (component-based architecture identified)  
❌ **Coding Standards** (inferred from existing code patterns)  
❌ **API Documentation** (internal API structure needs documentation)  
❌ **External API Documentation** (Web Audio API usage documented in code)  
✅ **UX/UI Guidelines** (Tailwind-based design system evident)  
❌ **Technical Debt Documentation** (minimal, recent clean codebase)  

### Enhancement Scope Definition

**Enhancement Type**: ✅ Integration with New Systems (APC40 hardware MIDI controller)

**Enhancement Description**: 
Integration of Akai APC40 MIDI hardware controller with the existing web-based drum sequencer to provide real-time LED feedback synchronized with the sequencer state, bidirectional communication for hardware button control, and professional hardware interaction for music production workflows.

**Impact Assessment**: ✅ Significant Impact (substantial existing code changes required)

### Goals and Background Context

**Goals**:
- Enable professional hardware control of the web-based drum sequencer
- Provide real-time LED visual feedback synchronized with sequencer playback
- Support bidirectional communication between hardware and web interface
- Maintain cross-browser compatibility while adding Web MIDI functionality
- Ensure seamless integration without disrupting existing functionality

**Background Context**:
The current web-based drum sequencer provides an excellent foundation for rhythm programming but lacks the tactile hardware interaction that professional producers expect. The APC40 integration addresses this gap by providing physical buttons with LED feedback, making the application suitable for live performance and professional studio use. The comprehensive research document provides detailed technical implementation strategies for Web MIDI API integration, LED synchronization, and hardware compatibility requirements.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|---------|
| Initial PRD Creation | 2025-09-25 | 1.0 | Created comprehensive PRD for APC40 hardware integration | John (BMad PM Agent) |

## Requirements

### Functional Requirements

**FR1**: A new APC40 module will be created as an independent hardware interface that connects to the existing drum sequencer core without modifying existing functionality  
**FR2**: The APC40 module will implement its own custom 8x5 grid mapping optimized for the APC40's physical layout and capabilities  
**FR3**: A hardware abstraction layer will enable multiple hardware modules to interface with the core sequencer simultaneously  
**FR4**: The APC40 module will subscribe to sequencer state changes and translate them to appropriate LED patterns using APC40-specific MIDI implementation  
**FR5**: Hardware modules will communicate with the drum sequencer through a standardized event system, allowing real-world hardware modules to interface with each other  
**FR6**: The APC40 module will handle its own connection management, MIDI mapping, and device-specific features (SysEx mode switching, LED animations)  
**FR7**: The core drum sequencer remains hardware-agnostic and will continue to function independently when no hardware modules are connected  
**FR8**: Future hardware modules (Launchpad, Push, custom controllers) can be added without modifying existing modules or core sequencer  
**FR9**: Hardware modules can be connected/disconnected during operation without affecting core sequencer or other hardware modules  
**FR10**: Multiple hardware modules can operate simultaneously, each with specialized functions while sharing core sequencer state  
**FR11**: Inter-hardware communication enables coordinated behaviors (pattern changes trigger scene updates across controllers)  
**FR12**: Hardware failure or disconnection provides graceful degradation without system crashes or state loss  

### Non-Functional Requirements

**NFR1**: LED update latency must not exceed 50ms to maintain tight synchronization with audio playback  
**NFR2**: Enhancement must maintain existing audio engine performance and not introduce audio dropouts or timing drift  
**NFR3**: Web MIDI integration must not impact existing mobile responsiveness or desktop performance  
**NFR4**: Hardware connection/disconnection must not crash the application or lose current sequencer state  
**NFR5**: HTTPS serving requirement for Web MIDI API must be documented with development workflow guidance  
**NFR6**: Memory usage increase from MIDI integration must not exceed 15% of current baseline  
**NFR7**: Hardware module hot-swap operations must complete within 2 seconds to avoid performance disruption  
**NFR8**: Multi-hardware synchronization must maintain <10ms latency between connected devices  

### Compatibility Requirements

**CR1**: Existing API compatibility - All current component interfaces and prop structures must remain unchanged  
**CR2**: Database schema compatibility - No database changes required (state remains client-side)  
**CR3**: UI/UX consistency - Hardware integration must not alter existing visual design or interaction patterns  
**CR4**: Integration compatibility - New MIDI layer must integrate cleanly with existing audio engine and React state management  

## User Interface Enhancement Goals

### Integration with Existing UI

The APC40 hardware module integration will maintain complete consistency with the existing Tailwind CSS-based design system and React component architecture. The enhancement will add:

**Hardware Status Components**:
- Connection indicator showing APC40 status (connected/disconnected/error)  
- Hardware module selector/manager for multi-device scenarios
- LED brightness and color mode controls specific to APC40 capabilities

**Visual Feedback Enhancements**:  
- Current hardware-controlled step highlighting in web UI
- Real-time synchronization indicators showing hardware ↔ software state alignment
- Hardware module activity indicators (which device last modified which elements)

All new UI elements will follow existing component patterns, use established color schemes, and maintain the current responsive behavior.

### Modified/New Screens and Views

**Enhanced Main Sequencer View**:
- Hardware connection status panel (minimal, non-intrusive)
- Hardware module tabs/selector (when multiple devices connected)
- Enhanced step indicator showing hardware/software input sources

**New Hardware Settings Panel**:
- APC40-specific configuration (LED brightness, color modes, button sensitivity)
- Multi-hardware coordination settings 
- Device pairing and management interface

**Enhanced Mobile/Responsive Views**:
- Hardware status remains visible in mobile navigation
- Hardware settings accessible through existing settings modal
- Graceful degradation messaging for unsupported browsers (Safari)

### UI Consistency Requirements

**Visual Consistency**: All hardware-related UI elements use existing Tailwind utility classes and component patterns  
**Interaction Consistency**: Hardware controls follow existing button, slider, and modal interaction patterns  
**Responsive Consistency**: Hardware UI elements maintain responsive behavior across all screen sizes  
**Accessibility Consistency**: Hardware status and controls meet existing accessibility standards and keyboard navigation patterns  
**State Management Consistency**: Hardware UI state integrates with existing React state management patterns without introducing new paradigms

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript, JavaScript  
**Frameworks**: React 18.2.0, Vite 5.0.8 (build tool)  
**Audio Engine**: Tone.js 15.1.22, Web Audio API  
**Styling**: Tailwind CSS 3.3.6, CSS custom properties  
**UI Components**: Lucide React (icons), custom component library  
**Build/Dev**: Vite with TypeScript, PostCSS, Autoprefixer  
**External Dependencies**: None currently (self-contained web application)  

### Integration Approach

**Hardware Abstraction Strategy**: Create new `src/hardware/` module structure with standardized interfaces for controller communication, independent of existing audio engine  

**MIDI Integration Strategy**: Web MIDI API wrapper with graceful fallback, connection pooling, and automatic reconnection logic that doesn't interfere with existing Tone.js scheduler  

**State Management Strategy**: Extend existing React state patterns with hardware event listeners, ensuring hardware modules subscribe to core sequencer state without tight coupling  

**Testing Integration Strategy**: Hardware module unit tests with MIDI mocking, integration tests with virtual MIDI devices, cross-browser compatibility testing with Web MIDI API detection

### Code Organization and Standards

**File Structure Approach**: 
```
src/hardware/
  ├── core/           # Hardware abstraction layer
  ├── apc40/          # APC40-specific implementation  
  ├── types/          # Hardware module TypeScript interfaces
  └── utils/          # Shared MIDI utilities
```

**Naming Conventions**: Follow existing camelCase for functions/variables, PascalCase for components, maintain existing import/export patterns  
**Coding Standards**: Continue existing TypeScript strict mode, ESLint configuration, component composition over inheritance patterns  
**Documentation Standards**: JSDoc for hardware module APIs, README updates for hardware setup requirements, maintain existing inline comment patterns  

### Deployment and Operations

**Build Process Integration**: Hardware modules included in existing Vite build pipeline, no additional build steps required  
**Deployment Strategy**: Static deployment remains unchanged, add HTTPS requirement documentation for Web MIDI API functionality  
**Monitoring and Logging**: Extend existing console error handling to include hardware connection events and MIDI communication errors  
**Configuration Management**: Hardware settings stored in localStorage following existing settings patterns, no server-side configuration required

### Risk Assessment and Mitigation

**Technical Risks**:  
- Web MIDI API browser compatibility (Safari completely unsupported)
- MIDI timing precision may not match audio engine timing accuracy
- Hardware disconnection during performance could disrupt user workflow

**Integration Risks**:  
- Hardware event loops could interfere with existing React rendering cycles  
- MIDI message flooding could impact application performance
- Multiple hardware modules could create state synchronization conflicts

**Deployment Risks**:  
- HTTPS requirement for Web MIDI may complicate local development  
- Different operating systems handle MIDI devices differently
- USB driver issues on user systems outside application control

**Mitigation Strategies**:  
- Browser compatibility detection with clear user messaging and graceful degradation
- Hardware module isolation ensures failures don't crash core application  
- Comprehensive error handling and automatic reconnection for device management
- Local development HTTPS setup documentation and tooling recommendations

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single Epic with 5-6 coordinated stories  

**Rationale**: The APC40 integration represents a cohesive feature set that introduces hardware abstraction as a new capability to your drum sequencer. While technically complex, it's a unified enhancement with clear dependencies between the hardware abstraction layer, APC40-specific implementation, and UI integration. Breaking this into multiple epics would create artificial boundaries and complicate the integration testing and rollout strategy.

The stories are logically sequential with each building on the previous foundation, making this ideal for a single epic approach that can be developed and deployed as a unified capability.

## Epic 1: APC40 Hardware Controller Integration

**Epic Goal**: Enable professional hardware control of the Centaurus Drum Machine through APC40 MIDI controller integration with real-time LED feedback, while establishing a modular hardware abstraction layer for future controller expansion.

**Integration Requirements**: 
- Maintain complete compatibility with existing web-based functionality
- Implement hardware abstraction layer suitable for multiple controller types
- Ensure graceful degradation when hardware is unavailable or unsupported  
- Provide seamless user experience bridging physical hardware and web interface

### Story 1.1: Hardware Abstraction Layer Foundation

As a **system architect**,  
I want **a modular hardware abstraction layer**,  
so that **multiple MIDI controllers can interface with the core sequencer without tight coupling**.

**Acceptance Criteria**:
1. Create `src/hardware/core/` module with standardized controller interfaces  
2. Implement event-driven communication system for hardware ↔ sequencer interaction
3. Design controller lifecycle management (connect/disconnect/error handling)  
4. Establish plugin architecture for future hardware module additions
5. Create TypeScript interfaces defining hardware module contracts

**Integration Verification**:
- **IV1**: Existing sequencer functionality remains completely unchanged and operational
- **IV2**: Core sequencer operates normally when no hardware modules are connected  
- **IV3**: Performance benchmarks show <5% overhead from abstraction layer

### Story 1.2: Web MIDI API Integration and Browser Compatibility

As a **web application user**,  
I want **reliable MIDI device connection with proper browser compatibility detection**,  
so that **I can use hardware controllers when supported and receive clear guidance when not**.

**Acceptance Criteria**:
1. Implement Web MIDI API wrapper with automatic device detection
2. Create browser compatibility detection for Web MIDI API support
3. Implement graceful degradation messaging for Safari and unsupported browsers  
4. Build connection status indicators and error handling UI
5. Add HTTPS development setup documentation for Web MIDI requirements

**Integration Verification**:
- **IV1**: Application loads and functions normally on all browsers including Safari
- **IV2**: MIDI connection errors do not crash the application or lose sequencer state  
- **IV3**: Clear user messaging explains hardware requirements and limitations

### Story 1.3: APC40 Device Integration and MIDI Implementation

As a **music producer**,  
I want **my APC40 controller to connect and communicate with the drum sequencer**,  
so that **I can control patterns using physical hardware buttons**.

**Acceptance Criteria**:
1. Implement APC40-specific MIDI mapping for 8x5 grid to 16-step sequencer  
2. Create APC40 device initialization with SysEx mode switching  
3. Build bidirectional communication (hardware buttons ↔ sequencer state)
4. Implement APC40 reconnection logic and error recovery
5. Create APC40 module following hardware abstraction layer interfaces

**Integration Verification**:
- **IV1**: Web interface continues to function identically whether APC40 is connected or not
- **IV2**: APC40 connection/disconnection does not affect existing sequencer timing or audio
- **IV3**: Hardware button presses and web UI interactions both update the same core sequencer state

### Story 1.4: Real-time LED Feedback and Visual Synchronization

As a **music producer using APC40**,  
I want **LED feedback that shows my pattern state and playback position**,  
so that **I can see my rhythm patterns and current playback position on the hardware**.

**Acceptance Criteria**:
1. Implement LED color mapping for step states (off/velocity-based/current position)
2. Synchronize LED updates with existing Tone.js playback timing  
3. Create LED animation system for playback position indication
4. Optimize LED update performance to maintain <50ms latency
5. Handle LED state synchronization when sequencer state changes from any source

**Integration Verification**:
- **IV1**: Existing audio playback timing and performance remain unchanged
- **IV2**: LED updates do not cause audio dropouts or timing drift  
- **IV3**: Visual feedback stays synchronized between hardware LEDs and web interface

### Story 1.5: Multi-Hardware Coordination and State Management

As a **advanced producer**,  
I want **multiple hardware controllers to work together seamlessly**,  
so that **I can use different controllers for specialized functions in complex setups**.

**Acceptance Criteria**:
1. Enable multiple hardware modules to connect simultaneously
2. Implement inter-module event communication for coordinated behaviors  
3. Create hardware module priority and conflict resolution system
4. Build hot-swap capability for connecting/disconnecting devices during operation
5. Implement state synchronization across all connected hardware and web interface

**Integration Verification**:
- **IV1**: Core sequencer performance remains stable with multiple hardware modules
- **IV2**: Disconnecting one hardware module does not affect others or core functionality
- **IV3**: State changes from any source (hardware A, hardware B, web UI) sync to all interfaces

### Story 1.6: Hardware Management UI and Settings Integration

As a **user with APC40 hardware**,  
I want **intuitive settings and status information for my hardware**,  
so that **I can configure my hardware and understand its connection status**.

**Acceptance Criteria**:
1. Add hardware status indicators to main interface following existing design patterns
2. Create APC40 settings panel integrated with existing settings modal  
3. Implement LED brightness and color mode controls specific to APC40
4. Build hardware module manager for multi-device scenarios
5. Maintain responsive behavior and accessibility standards for all hardware UI

**Integration Verification**:
- **IV1**: Existing settings and UI layouts remain unchanged and functional  
- **IV2**: Hardware UI elements follow existing Tailwind CSS patterns and component architecture
- **IV3**: Mobile responsiveness maintained with hardware features gracefully adapted

---

**This story sequence is designed to minimize risk to your existing system. Each story builds on the previous foundation while maintaining system integrity throughout development.**