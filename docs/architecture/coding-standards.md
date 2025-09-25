# Coding Standards

## Existing Standards Compliance
**Code Style**: TypeScript strict mode, ESLint configuration maintained, functional components with hooks pattern  
**Linting Rules**: Existing ESLint rules apply to hardware modules, TypeScript strict type checking enforced  
**Testing Patterns**: Component testing patterns (if existing) extended to hardware components with MIDI mocking  
**Documentation Style**: JSDoc comments for hardware APIs, inline comments for complex MIDI logic, README updates

## Enhancement-Specific Standards
- **Hardware Interface Consistency**: All controllers implement standardized HardwareController interface
- **Error Boundary Pattern**: Hardware components wrapped in error boundaries to prevent app crashes
- **Performance Monitoring**: LED update timing logged in development mode for optimization
- **MIDI Message Validation**: All MIDI input/output validated and sanitized for security

## Critical Integration Rules
- **Existing API Compatibility**: Zero modifications to existing component interfaces or props
- **Database Integration**: All hardware state follows existing localStorage patterns for persistence
- **Error Handling**: Hardware errors isolated using React error boundaries, don't propagate to audio engine
- **Logging Consistency**: Hardware events use existing console logging patterns with consistent formatting
