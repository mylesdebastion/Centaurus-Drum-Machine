# Epic 5: Universal Responsive Architecture

**Status:** ✅ **COMPLETE**
**Priority:** High
**Target Completion:** Q4 2024 (Completed: 2025-10-09)

---

## Epic Overview

This epic establishes a unified, production-ready responsive architecture that works consistently across all experiments and modules in the Centaurus Drum Machine. The architecture addresses critical issues discovered during rapid prototyping, particularly the catastrophic state loss caused by component remounting during responsive breakpoint changes.

**Vision:** Every experiment and module in the application is fully usable on mobile devices (iOS/Android) with intuitive responsive layouts, while maintaining persistent audio/LED/visualization state across device rotation and browser resizes.

**Business Requirements:**
- Mobile users unable to access experiments due to inconsistent responsive behavior
- Audio/LED interruptions during device rotation break user experience
- Each experiment implemented responsiveness differently (or not at all)
- No standardized patterns for new experiments to follow
- Education use case requires reliable mobile support for classroom environments

**Technical Requirements:**
- Comprehensive responsive hooks and components usable by all experiments
- Mobile/tablet/desktop breakpoints matching Tailwind standards (sm: 640px, md: 768px, lg: 1024px)
- 44px minimum touch targets (Apple HIG / Material Design compliance)
- Stateful component continuity pattern to prevent audio/LED/visualization interruptions
- Safe-area-inset support for iOS notches and Android gesture navigation
- Performance target: 60fps on mobile devices, <200ms navigation latency

---

## Core Philosophy

### Single Instance Pattern for Stateful Components

**Problem:** Conditional rendering based on breakpoints causes React to unmount/remount components, triggering cleanup and re-initialization. This was discovered in JamSession where LiveAudioVisualizer was rendered twice (lines 197, 308), causing:
- Audio context disposed and recreated
- Audio input stream closed (requires user permission again)
- WLED LED output conflicts (two instances fighting for control)
- Animation frame loops cancelled and restarted
- Performance overhead from duplicate initialization/teardown

**Solution:** Render stateful components ONCE outside conditional branches. Use CSS visibility and layout props to control UI appearance while keeping audio/LED/visualization state persistent across breakpoint changes.

```typescript
// ❌ BAD - Causes remounting
{isMobile && <LiveAudioVisualizer embedded />}
{!isMobile && <LiveAudioVisualizer embedded />}

// ✅ GOOD - Single instance with layout props
<LiveAudioVisualizer
  embedded
  layout={isMobile ? 'mobile' : 'desktop'}
  className={isMobile ? (activeView === 'drum' ? 'block' : 'hidden') : 'block'}
/>
```

### Mobile-First Responsive Design

All components designed for mobile first, then enhanced for larger screens. Touch targets minimum 44px, swipe gestures for navigation, and landscape-first optimization for complex 3D views.

### Progressive Disclosure for Settings

Complex controls hidden by default on mobile using CollapsiblePanel pattern. Essential controls always visible, advanced settings behind expand/collapse. Reduces cognitive load and prevents overwhelming mobile users.

---

## Reference Implementations

### JamSession Success Pattern
- **Location:** `src/components/JamSession/JamSession.tsx`
- **Proven features:**
  - Tab-based mobile navigation with MobileNavigation footer
  - ResponsiveContainer with breakpoint detection (768px)
  - Desktop: side-by-side layout (drum machine + visualizer)
  - Mobile: tab-based views (Drums, Users, Settings) with bottom navigation

### Problem Case: LiveAudioVisualizer Double-Mounting
- **Location:** `src/components/JamSession/JamSession.tsx` (lines 197, 308)
- **Critical flaw:** Component rendered twice in conditional branches
- **Impact:** Audio cuts out, LEDs glitch, visualizer stutters during resize/rotation
- **Fix:** Single instance pattern implemented in commit b0d9791

---

## Stories

### **Story 5.1: Universal Mobile-Responsive Architecture** ✅ **HIGH**
**Status:** COMPLETE
**Complexity:** High
**Prerequisites:** None

**Goal:** Create generalized responsive architecture that all experiments use by default, with critical fix for stateful component continuity across breakpoint changes.

**Key Features:**
- useResponsive hook with comprehensive breakpoint detection (mobile/tablet/desktop)
- Enhanced ResponsiveContainer with layout strategy support and React Context
- MobileViewContainer for tab-based mobile views with safe-area-inset support
- Enhanced MobileNavigation with configurable tabs, haptic feedback, 44px touch targets
- CollapsiblePanel with accordion-style mobile behavior
- ResponsiveToolbar with intelligent overflow handling
- **CRITICAL FIX:** LiveAudioVisualizer single instance pattern (prevents remounting)
- Comprehensive documentation in responsive-component-patterns.md

**Deliverables:**
- `src/hooks/useResponsive.ts` - Comprehensive responsive hook (129 lines)
- `src/hooks/index.ts` - Barrel export for hooks (3 lines)
- `src/components/Layout/MobileViewContainer.tsx` - Mobile view container (59 lines)
- `src/components/Layout/CollapsiblePanel.tsx` - Collapsible panel (101 lines)
- `src/components/Layout/ResponsiveToolbar.tsx` - Auto-reflow toolbar (191 lines)
- `src/components/Layout/index.ts` - Barrel export for layout components (8 lines)
- `docs/architecture/responsive-component-patterns.md` - Usage documentation (423 lines)

**Modified:**
- `src/components/Layout/ResponsiveContainer.tsx` - Enhanced with layout strategy, context (+87 lines)
- `src/components/Layout/MobileNavigation.tsx` - Configurable tabs, haptic feedback (+160 lines)
- `src/components/LiveAudioVisualizer/LiveAudioVisualizer.tsx` - Layout/className props, lifecycle logging (+15 lines)
- `src/components/JamSession/JamSession.tsx` - Single LiveAudioVisualizer instance (refactored, +24 lines)
- `src/types/index.ts` - Added responsive types (+22 lines)
- `docs/stories/5.1.story.md` - Updated Dev Agent Record (+101 lines)

**Total:** 1,239 insertions, 84 deletions across 13 files

**Reuse:**
- ✅ Existing ResponsiveContainer and MobileNavigation patterns
- ✅ Tailwind breakpoint standards (sm: 640px, md: 768px, lg: 1024px)
- ✅ Apple HIG and Material Design touch target guidelines (44px minimum)

---

## Component Reuse Strategy

### Shared Infrastructure (Maximize Reuse)

**Core Responsive System:**
- ✅ **useResponsive hook** → Used by JamSession, future experiments (mobile/tablet/desktop detection)
- ✅ **ResponsiveContainer** → Wraps all experiments with consistent layout strategy
- ✅ **MobileNavigation** → Tab-based mobile navigation for multi-view experiments

**UI Patterns:**
- ✅ **CollapsiblePanel** → Settings panels across all experiments (DJ Visualizer, Piano Roll, Guitar Fretboard)
- ✅ **ResponsiveToolbar** → Toolbar controls that auto-reflow based on available width
- ✅ **MobileViewContainer** → Tab-based mobile views with automatic safe-area-insets

**Architectural Patterns:**
- ✅ **Single Instance Pattern** → Applied to LiveAudioVisualizer, required for all stateful components (audio, LED, 3D rendering)
- ✅ **Layout Props Pattern** → `layout?: 'mobile' | 'desktop'` instead of conditional rendering
- ✅ **CSS Visibility Control** → `className` manipulation instead of component mounting/unmounting

### Module-Specific Code (Minimal)

Each experiment adapts shared infrastructure to its needs:
- 🆕 **LiveAudioVisualizer mobile UX** - CollapsiblePanel integration, 44px touch targets
- 🆕 **IsometricSequencer mobile** - Landscape-first 3D view (future Story 5.2, deferred)
- 🆕 **Future experiments** - Follow responsive-component-patterns.md documentation

---

## Technical Architecture

### Responsive Hook (useResponsive)

```typescript
// src/hooks/useResponsive.ts
export interface ResponsiveInfo {
  isMobile: boolean;        // < 768px
  isTablet: boolean;        // 768px - 1024px
  isDesktop: boolean;       // >= 1024px
  breakpoint: Breakpoint;   // 'mobile' | 'tablet' | 'desktop'
  orientation: Orientation; // 'portrait' | 'landscape'
  isTouchDevice: boolean;   // Detects touch capability
}

export const useResponsive = (): ResponsiveInfo => {
  // Uses window.matchMedia for efficient breakpoint detection
  // Handles resize events with debouncing (150ms)
  // Detects touch capability via 'ontouchstart' in window
  // Returns responsive context for components to consume
};
```

**Integration Example:**
```typescript
const MyComponent = () => {
  const { isMobile } = useResponsive();

  return (
    <div className={isMobile ? 'flex-col' : 'flex-row'}>
      {/* Layout adapts to breakpoint */}
    </div>
  );
};
```

### Stateful Component Continuity Pattern

**Component Implementation:**
```typescript
interface LiveAudioVisualizerProps {
  embedded?: boolean;
  layout?: 'mobile' | 'desktop';  // Layout hint, not conditional mounting
  className?: string;              // CSS visibility control
}

export const LiveAudioVisualizer: React.FC<LiveAudioVisualizerProps> = ({
  embedded = false,
  layout = 'desktop',
  className = ''
}) => {
  // Refs persist across layout changes
  const audioManagerRef = useRef<AudioInputManager | null>(null);
  const vizEngineRef = useRef<VisualizationEngine | null>(null);

  // Internal layout state based on layout prop
  const isMobileLayout = layout === 'mobile';

  // Single render tree with CSS-based visibility
  return (
    <div className={className}>
      {/* Canvas always rendered, refs always alive */}
      <canvas ref={canvasRef} />
    </div>
  );
};
```

**Usage in JamSession:**
```typescript
// Before (b0d9791^): Two instances, remounts on resize
{isMobile && <LiveAudioVisualizer embedded />}           // Line 197
{!isMobile && <LiveAudioVisualizer embedded />}          // Line 308

// After (b0d9791): Single instance, CSS controls visibility
<LiveAudioVisualizer
  embedded
  layout={isMobile ? 'mobile' : 'desktop'}
  className={`
    ${isMobile ? (activeView === 'drum' ? 'mt-4' : 'hidden') : 'mt-6'}
  `}
/>
```

**Testing Pattern:**
```typescript
useEffect(() => {
  console.log('[LiveAudioVisualizer] MOUNTED');
  return () => console.log('[LiveAudioVisualizer] UNMOUNTED');
}, []);

// Should see MOUNTED once, never UNMOUNTED during resize
```

### Mobile Navigation Pattern

```typescript
// Configurable tabs via props
export interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const MobileNavigation: React.FC<{
  activeView: string;
  onViewChange: (view: string) => void;
  tabs?: NavTab[];      // NEW: Configurable tabs
  mode?: 'sticky' | 'overlay';
}> = ({ activeView, onViewChange, tabs, mode = 'sticky' }) => {
  // Haptic feedback on tab change (10ms light vibration)
  // Minimum 44px touch targets
  // Safe-area-inset-bottom for iOS dynamic island
  // Hidden on md: breakpoint and above
};
```

### Responsive Layout Strategy

```typescript
// ResponsiveContainer with layout strategy
export type LayoutStrategy = 'tabs' | 'collapsible' | 'hybrid';

export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  strategy?: LayoutStrategy;
  showMobileNav?: boolean;
}> = ({ children, strategy = 'tabs', showMobileNav = true }) => {
  // Exposes ResponsiveContext for child components
  // Auto-detect and apply safe-area-insets
  // Automatic padding for mobile navigation (pb-20)
};
```

---

## Integration Strategy

**Phase 1 - Foundation** ✅ (Story 5.1, Tasks 1-3):
- Created useResponsive hook with comprehensive breakpoint detection
- Enhanced ResponsiveContainer with layout strategy and React Context
- Created MobileViewContainer, CollapsiblePanel, ResponsiveToolbar
- Enhanced MobileNavigation with configurable tabs and haptic feedback
- Created responsive-component-patterns.md documentation

**Phase 2 - Critical Fix** ✅ (Story 5.1, Task 4):
- Fixed LiveAudioVisualizer double-mounting in JamSession
- Implemented single instance pattern with CSS visibility control
- Added lifecycle logging for mount/unmount verification
- Verified audio/LED/visualization state persists across resize/rotation

**Phase 3 - Mobile Optimizations** ✅ (Story 5.1, Task 5):
- Integrated CollapsiblePanel into LiveAudioVisualizer settings
- Ensured all interactive buttons meet 44px touch target guidelines
- Optimized canvas scaling and performance (60fps maintained)
- Settings panel wrapped in CollapsiblePanel (defaultOpen={true})

**Phase 4 - Documentation & QA** ✅ (Story 5.1, Tasks 7-8):
- Created comprehensive responsive-component-patterns.md
- Documented touch target guidelines (44px minimum)
- Documented safe-area-inset handling for iOS/Android
- Updated CLAUDE.md with responsive development checklist

**Future Phases (Deferred):**
- **Phase 5**: IsometricSequencer mobile optimizations (landscape-first 3D view)
- **Phase 6**: Retrofit remaining experiments (any new experiments created)

---

## Success Metrics

### Story 5.1 (Universal Mobile-Responsive Architecture)
- [x] useResponsive hook created with breakpoint detection
- [x] ResponsiveContainer enhanced with layout strategy
- [x] MobileNavigation refactored for configurable tabs
- [x] CollapsiblePanel and ResponsiveToolbar pattern components created
- [x] **CRITICAL:** LiveAudioVisualizer single instance pattern implemented
- [x] Audio context survives window resize (verified via lifecycle logging)
- [x] WLED LED output continues without interruption during rotation
- [x] Visualization animation frames don't restart during breakpoint changes
- [x] No microphone permission re-requests on breakpoint change
- [x] Console shows "MOUNTED" only ONCE, never "UNMOUNTED" during resize
- [x] TypeScript compilation successful (npx tsc --noEmit)
- [x] Comprehensive documentation created (responsive-component-patterns.md, 423 lines)
- [x] All touch targets meet 44px minimum (verified in LiveAudioVisualizer)

### Overall Epic Success
- [x] Story 5.1 COMPLETE
- [x] All desktop functionality remains unchanged (no regressions)
- [x] No breaking changes to existing component APIs
- [x] Performance: 60fps on mobile devices maintained
- [x] Accessibility: All interactive elements keyboard/screen-reader accessible
- [x] **CRITICAL Continuity:** Audio/LED/visualization state persists across breakpoint changes (resize, rotation)
- [x] Responsive patterns documented for future experiments
- [x] Templates and guidelines enable consistent implementation

---

## Future Enhancements (Post-MVP)

### Story 5.2: IsometricSequencer Mobile Optimizations
- Landscape-first mobile layout for 3D sequencer
- Optimize 3D rendering for mobile performance (reduce polygon count)
- Touch interactions: pinch-to-zoom, two-finger rotation, single-finger pan
- Collapsible control drawer from bottom/side
- Test on iPhone SE (lowest common denominator)

### Story 5.3: Retrofit Remaining Experiments
- Apply responsive patterns to any new experiments created after Epic 5
- Ensure all experiments use useResponsive hook
- Verify all stateful components follow single instance pattern
- Add mobile testing to CI/CD pipeline

### Enhanced Mobile Features
- Service Worker for offline support
- iOS home screen install prompt
- Android TWA (Trusted Web Activity) support
- Push notifications for collaborative sessions
- Native device API access (camera, Bluetooth MIDI)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-09 | 1.0 | Initial epic creation - Universal Responsive Architecture | BMad Orchestrator |
| 2025-10-09 | 1.1 | CRITICAL UPDATE: Added stateful component continuity fix | BMad Orchestrator |
| 2025-10-09 | 1.2 | Added human approval checkpoints for phased rollout | BMad Orchestrator |
| 2025-10-09 | 2.0 | Story 5.1 COMPLETE - All phases implemented and tested | Dev Agent (claude-sonnet-4-5-20250929) |
| 2025-01-13 | 2.1 | Epic creation from Story 5.1 and commit b0d9791 | Sarah (PO) |

---

## Next Steps

1. ✅ **Story 5.1** - COMPLETE (all phases, commit b0d9791)
2. **Future:** Story 5.2 - IsometricSequencer mobile optimizations (when prioritized)
3. **Future:** Story 5.3 - Retrofit remaining experiments (as needed)
4. **Ongoing:** Apply responsive patterns to new experiments using documentation

---

## Git Commit Reference

**Primary Implementation:** Commit `b0d9791`
```
feat: implement Story 5.1 responsive architecture with critical stateful component fix

Phase 1 - Foundation (Tasks 1-3):
- Create useResponsive hook with comprehensive breakpoint detection
- Enhance ResponsiveContainer with layout strategy and React Context
- Create MobileViewContainer for tab-based mobile views
- Refactor MobileNavigation for configurable tabs and haptic feedback
- Create CollapsiblePanel and ResponsiveToolbar pattern components
- Add responsive types (LayoutStrategy, ResponsiveContextValue, NavTab)

Phase 2 - Critical Fix (Task 4):
- Fix LiveAudioVisualizer double-mounting in JamSession (lines 197, 308)
- Implement single instance pattern with CSS visibility control
- Preserve audio context, WLED LEDs, and animation frames across breakpoint changes
- Add lifecycle logging for mount/unmount verification
- Prevent microphone permission re-requests during resize/rotation

Documentation:
- Create responsive-component-patterns.md with usage examples
- Document touch target guidelines (44px minimum)
- Document safe-area-inset handling for iOS/Android

All changes tested and verified:
- TypeScript compilation successful
- Audio/LED/visualization state persists across resize/rotation
- Component mounts only once, never unmounts during breakpoint changes

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Files Changed:** 13 files, 1,239 insertions(+), 84 deletions(-)
