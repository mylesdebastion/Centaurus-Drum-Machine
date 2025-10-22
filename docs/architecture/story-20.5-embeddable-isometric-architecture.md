# Architecture Document: Story 20.5 - Embeddable IsometricSequencer & Lesson 4

**Document Version:** 1.0
**Date:** 2025-10-20
**Author:** Winston (Architect)
**Story:** Story 20.5 - Collaborative Boomwhacker Performance Lesson
**Epic:** Epic 20 - Workshop-Ready Education Mode

---

## Executive Summary

### Overview
Story 20.5 implements a collaborative music lesson (Lesson 4) for K5-10 students to play "Twinkle Twinkle Little Star" using color-coded boomwhackers and WLED tube visualization. This architecture document specifies the **embeddable IsometricSequencer pattern** that enables the sequencer to work in constrained containers (Education Mode, /studio) while maintaining full standalone functionality at `/isometric`.

### Key Architectural Decisions

**✅ APPROVED: Embed IsometricSequencer, Don't Duplicate**
- Reuse 95% of existing IsometricSequencer logic
- Add `embedded` mode prop for container-aware rendering
- Fix /studio layout issues as bonus outcome
- Preserve standalone `/isometric` functionality (no breaking changes)

**Code Impact:**
- **New Code:** ~490 lines (components + utilities)
- **Modified Code:** ~150 lines (IsometricSequencer embedded mode)
- **Code Reuse:** 95% (sequencer logic, LED visualization, audio engine)
- **Estimated Effort:** 3-5 hours (vs. original 4-6 hours)

### Critical Requirements Met
1. ✅ Instructor-friendly UX (clear guidance, keyboard shortcuts, reset capability)
2. ✅ Embeddable in constrained containers (Education Mode, /studio)
3. ✅ Offline workshop-ready (no internet dependency)
4. ✅ Zero breaking changes to standalone `/isometric`
5. ✅ Workshop config integration with graceful degradation

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Specifications](#2-component-specifications)
3. [IsometricSequencer Embedded Mode](#3-isometricsequencer-embedded-mode)
4. [Lesson 4 Implementation](#4-lesson-4-implementation)
5. [Instructor-Friendly UX Components](#5-instructor-friendly-ux-components)
6. [Keyboard Shortcuts & Accessibility](#6-keyboard-shortcuts--accessibility)
7. [Workshop Integration](#7-workshop-integration)
8. [Code Extraction & Utilities](#8-code-extraction--utilities)
9. [Testing Strategy](#9-testing-strategy)
10. [Risk Mitigation](#10-risk-mitigation)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Architecture Overview

### 1.1 Current State Analysis

**Problem:**
- IsometricSequencer assumes full-viewport rendering (`min-h-screen`)
- Breaks in `/studio` grid containers (layout overflow)
- No embedded mode → forces duplication for Education Mode
- Lesson 4 would require ~330 lines of duplicated logic

**Root Cause:**
```tsx
// IsometricSequencer.tsx:1856
return (
  <div className="min-h-screen bg-black flex flex-col">
    {/* Header assumes standalone usage */}
    {/* Canvas assumes full viewport */}
  </div>
);
```

### 1.2 Solution Architecture

**Pattern:** Follow `LiveAudioVisualizer` embedded mode pattern

```tsx
interface IsometricSequencerProps {
  onBack?: () => void;
  embedded?: boolean;           // NEW: Enable container-aware rendering
  hideControls?: boolean;        // NEW: Collapsible controls
  autoLoad?: {                   // NEW: Auto-configuration for lessons
    pattern?: 'twinkle' | 'melody' | 'random' | 'chords' | 'beats';
    workshopMode?: boolean;
    tempo?: number;
    soundEngine?: SoundEngineType;
  };
  className?: string;            // NEW: Additional styling
}
```

**Benefits:**
- Single source of truth (no duplication)
- Works in any container size
- Fixes /studio layout issues (bonus)
- Preserves standalone functionality

### 1.3 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Centaurus Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Standalone Mode               Embedded Mode                    │
│  ┌──────────────────┐         ┌───────────────────────────┐   │
│  │   /isometric     │         │   /education (Lesson 4)   │   │
│  │                  │         │  ┌─────────────────────┐  │   │
│  │  ┌────────────┐  │         │  │ IsometricSequencer  │  │   │
│  │  │ Full Header│  │         │  │  (embedded=true)    │  │   │
│  │  ├────────────┤  │         │  │  - Compact header   │  │   │
│  │  │            │  │         │  │  - Container-aware  │  │   │
│  │  │   Canvas   │  │         │  │  - Auto-load        │  │   │
│  │  │            │  │         │  └─────────────────────┘  │   │
│  │  ├────────────┤  │         └───────────────────────────┘   │
│  │  │  Controls  │  │                                          │
│  │  └────────────┘  │         ┌───────────────────────────┐   │
│  └──────────────────┘         │      /studio              │   │
│                                │  ┌─────────────────────┐  │   │
│                                │  │ IsometricSequencer  │  │   │
│                                │  │  (embedded=true)    │  │   │
│                                │  └─────────────────────┘  │   │
│                                └───────────────────────────┘   │
│                                                                  │
│  Shared Components:                                             │
│  - musicConstants.ts (boomwhacker colors, note frequencies)     │
│  - melodyPatterns.ts (Twinkle pattern utilities)               │
│  - soundEngines.ts (audio playback)                            │
│  - SingleLaneVisualizer (WLED control)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 File Structure

```
src/
├── components/
│   ├── Education/
│   │   ├── EducationMode.tsx                    # MODIFIED: +200 lines (Lesson 4)
│   │   └── Lesson4Components/
│   │       ├── InstructorGuidance.tsx           # NEW: 40 lines
│   │       ├── BoomwhackerColorChart.tsx        # NEW: 30 lines
│   │       ├── SimplePracticePlayer.tsx         # NEW: 80 lines
│   │       └── KeyboardHint.tsx                 # NEW: 15 lines
│   │
│   └── IsometricSequencer/
│       └── IsometricSequencer.tsx               # MODIFIED: +100 lines (embedded mode)
│
├── utils/
│   ├── musicConstants.ts                        # NEW: 60 lines (extracted)
│   ├── melodyPatterns.ts                        # NEW: 40 lines (Twinkle utilities)
│   └── SingleLaneVisualizer.ts                  # EXISTS: no changes
│
└── services/
    └── WorkshopConfigService.ts                 # FUTURE: Story 20.1 dependency
```

### 2.2 Component Hierarchy (Lesson 4)

```
EducationMode
└── Lesson4Component
    ├── StepProgress (step indicator)
    │
    ├── View: Intro
    │   ├── InstructorGuidance
    │   ├── BoomwhackerColorChart
    │   └── KeyboardHint
    │
    ├── View: Practice
    │   ├── InstructorGuidance
    │   └── SimplePracticePlayer
    │
    ├── View: Sequencer (main activity)
    │   ├── InstructorGuidance (collapsed)
    │   └── IsometricSequencer (embedded)
    │
    └── View: Complete
        └── Completion actions (reset, exit)
```

---

## 3. IsometricSequencer Embedded Mode

### 3.1 Props Interface

```typescript
interface IsometricSequencerProps {
  // Existing
  onBack?: () => void;

  // NEW: Embedded mode controls
  embedded?: boolean;           // Enable container-aware rendering
  hideControls?: boolean;        // Hide controls until toggled
  autoLoad?: {                   // Auto-configuration
    pattern?: 'twinkle' | 'melody' | 'random' | 'chords' | 'beats';
    workshopMode?: boolean;      // Enable workshop config loading
    tempo?: number;              // Override default BPM
    soundEngine?: SoundEngineType; // Override sound engine
  };
  className?: string;            // Additional CSS classes
}
```

### 3.2 Layout Adaptation

#### Standalone Mode (Existing)
```tsx
{!embedded && (
  <div className="min-h-screen bg-black flex flex-col">
    {/* Full header with back button, title, all controls */}
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800">
      <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        Isometric 3D Sequencer
      </h1>

      <div className="flex items-center gap-4">
        {/* BPM, Key, Scale, Sound Engine, Melody Mode selectors */}
      </div>
    </div>

    {/* Full-size canvas */}
    <canvas ref={canvasRef} className="flex-1" />

    {/* Full control panel (always visible) */}
    <div className="p-4 bg-gray-900">
      {/* All controls, checkboxes, buttons */}
    </div>
  </div>
)}
```

#### Embedded Mode (NEW)
```tsx
{embedded && (
  <div className={`h-full bg-black flex flex-col rounded-lg overflow-hidden ${className}`}>
    {/* Compact header (optional) */}
    {!hideControls && (
      <div className="flex items-center justify-between p-2 bg-gray-900/50 border-b border-gray-700">
        <span className="text-xs text-gray-400">Isometric Sequencer</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    )}

    {/* Container-aware canvas */}
    <canvas
      ref={canvasRef}
      className="flex-1 min-h-0"
      style={{ minHeight: '300px' }}
    />

    {/* Collapsible controls */}
    {(!hideControls || showSettings) && (
      <div className="p-2 bg-gray-900/80 border-t border-gray-700 max-h-48 overflow-y-auto">
        {/* Essential controls only (same components, compact layout) */}
      </div>
    )}
  </div>
)}
```

### 3.3 Key Differences Table

| Property | Standalone | Embedded |
|----------|------------|----------|
| **Container** | `min-h-screen` (full viewport) | `h-full` (parent-aware) |
| **Header** | Full with title, back, all controls | Compact with settings toggle |
| **Canvas** | `flex-1` (unrestricted) | `flex-1 min-h-0` (prevents overflow) |
| **Controls** | Always visible, full panel | Collapsible, compact layout |
| **Background** | `bg-black` (full screen) | `bg-black rounded-lg` (container) |
| **Border** | None | `border border-gray-700` |

### 3.4 Auto-Load Implementation

```typescript
// Auto-load configuration on mount
useEffect(() => {
  if (!autoLoad) return;

  // Load pattern
  if (autoLoad.pattern) {
    switch(autoLoad.pattern) {
      case 'twinkle':
        generateTwinkle();
        break;
      case 'melody':
        generateMelody();
        break;
      case 'random':
        generateRandomMelody();
        break;
      case 'chords':
        generateChords();
        break;
      case 'beats':
        generateBeats();
        break;
    }
  }

  // Set tempo
  if (autoLoad.tempo) {
    setBpm(autoLoad.tempo);
  }

  // Set sound engine
  if (autoLoad.soundEngine) {
    setSelectedSoundEngine(autoLoad.soundEngine);
  }

  // Enable workshop mode
  if (autoLoad.workshopMode) {
    loadWorkshopConfig(); // Existing function from Story 20.1
  }
}, [autoLoad]);
```

### 3.5 Container-Aware Canvas Sizing

```typescript
// Responsive canvas sizing for embedded mode
useEffect(() => {
  if (!canvasRef.current) return;

  const resizeCanvas = () => {
    const canvas = canvasRef.current!;
    const container = canvas.parentElement!;

    if (embedded) {
      // Container-aware sizing (fit parent)
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    } else {
      // Full viewport sizing (existing logic)
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Redraw scene with new dimensions
    if (camera) {
      // Update camera aspect ratio and projection
      renderScene();
    }
  };

  resizeCanvas();

  // Use ResizeObserver for embedded mode (detects container changes)
  if (embedded) {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvasRef.current.parentElement!);
    return () => resizeObserver.disconnect();
  } else {
    // Use window resize for standalone mode
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }
}, [embedded]);
```

---

## 4. Lesson 4 Implementation

### 4.1 Lesson Flow State Machine

```typescript
type Lesson4View = 'intro' | 'practice' | 'sequencer' | 'complete';

const Lesson4Component: React.FC<{ onBackToLessons: () => void }> = ({ onBackToLessons }) => {
  const [currentView, setCurrentView] = useState<Lesson4View>('intro');
  const [hasCompletedPractice, setHasCompletedPractice] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Step Progress Indicator */}
      <div className="max-w-5xl mx-auto mb-6">
        <StepProgress
          steps={['Intro', 'Practice', 'Play Together', 'Complete']}
          current={currentView}
        />
      </div>

      {currentView === 'intro' && (
        <IntroView onNext={() => setCurrentView('practice')} />
      )}

      {currentView === 'practice' && (
        <PracticeView
          onComplete={() => {
            setHasCompletedPractice(true);
            setCurrentView('sequencer');
          }}
        />
      )}

      {currentView === 'sequencer' && (
        <SequencerView
          onComplete={() => setCurrentView('complete')}
          onBack={() => setCurrentView('practice')}
        />
      )}

      {currentView === 'complete' && (
        <CompleteView
          onReset={() => {
            setCurrentView('intro');
            setHasCompletedPractice(false);
          }}
          onBackToLessons={onBackToLessons}
        />
      )}
    </div>
  );
};
```

### 4.2 View: Intro (Step 1)

```tsx
const IntroView: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNext]);

  return (
    <ViewCard title="Welcome to Collaborative Music!" maxWidth="4xl">
      <InstructorGuidance>
        <p className="text-white mb-4">
          <strong>📚 For Instructors:</strong> This lesson teaches students to play
          "Twinkle Twinkle Little Star" together using color-coded boomwhackers.
        </p>
        <ul className="list-disc list-inside text-white/90 space-y-2">
          <li>Each student gets a boomwhacker and WLED tube of the same color</li>
          <li>When their LED lights up, they hit their boomwhacker</li>
          <li>The sequencer shows when each note plays</li>
          <li>All students play together to create the melody!</li>
        </ul>
        <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
          <p className="text-yellow-200 text-sm">
            <strong>Workshop Setup:</strong> Make sure all 6 WLED tubes are connected
            and the workshop config is loaded. Check the LED Manager if tubes aren't lighting up.
          </p>
        </div>
      </InstructorGuidance>

      <div className="my-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Color-Coded Boomwhacker Reference
        </h3>
        <BoomwhackerColorChart />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button onClick={onNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Next: Practice Notes <ArrowRight className="w-5 h-5" />
        </button>
        <KeyboardHint>Spacebar</KeyboardHint>
      </div>
    </ViewCard>
  );
};
```

### 4.3 View: Practice (Step 2)

```tsx
const PracticeView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <ViewCard title="Practice Your Notes" maxWidth="5xl">
      <InstructorGuidance>
        <p className="text-white mb-4">
          <strong>👨‍🏫 Instructor:</strong> Click each note button to play its sound.
          Students should practice hitting their boomwhacker when they hear their color's note.
        </p>
        <p className="text-white/80 text-sm">
          After all 5 notes have been played, you can proceed to the sequencer.
        </p>
      </InstructorGuidance>

      <SimplePracticePlayer
        notes={['C', 'D', 'E', 'F', 'G']}
        onComplete={onComplete}
      />

      <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
        <p className="text-blue-200 text-sm">
          <strong>💡 Tip:</strong> Students don't need to play perfectly yet -
          this is just to familiarize them with their note's sound and color.
        </p>
      </div>
    </ViewCard>
  );
};
```

### 4.4 View: Sequencer (Step 3 - Main Activity)

```tsx
const SequencerView: React.FC<{
  onComplete: () => void;
  onBack: () => void;
}> = ({ onComplete, onBack }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <InstructorGuidance collapsed={true}>
        <div className="space-y-3">
          <p className="text-white">
            <strong>🎵 Now Playing:</strong> Students watch their LED tubes and hit their
            boomwhackers when lit. Press the Play button in the sequencer to start!
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-white/5 rounded">
              <strong className="text-cyan-400">Pattern:</strong> Twinkle Twinkle Little Star (auto-loaded)
            </div>
            <div className="p-2 bg-white/5 rounded">
              <strong className="text-cyan-400">Tempo:</strong> 90 BPM (beginner-friendly)
            </div>
            <div className="p-2 bg-white/5 rounded">
              <strong className="text-cyan-400">Sound:</strong> Pluck (boomwhacker-like)
            </div>
            <div className="p-2 bg-white/5 rounded">
              <strong className="text-cyan-400">WLED:</strong> Workshop config enabled
            </div>
          </div>
          <button
            onClick={onComplete}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Skip to completion →
          </button>
        </div>
      </InstructorGuidance>

      {/* EMBEDDED ISOMETRIC SEQUENCER */}
      <div
        className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-2xl"
        style={{ height: '600px' }}
      >
        <IsometricSequencer
          embedded={true}
          hideControls={false}
          autoLoad={{
            pattern: 'twinkle',
            workshopMode: true,
            tempo: 90,
            soundEngine: 'pluck'
          }}
          onBack={onComplete} // "Done" button acts as completion
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Practice
        </button>
        <button
          onClick={onComplete}
          className="btn-accent flex items-center justify-center gap-2"
        >
          Complete Lesson <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
```

### 4.5 View: Complete (Step 4)

```tsx
const CompleteView: React.FC<{
  onReset: () => void;
  onBackToLessons: () => void;
}> = ({ onReset, onBackToLessons }) => {
  return (
    <ViewCard title="🎉 Congratulations!" maxWidth="4xl">
      <div className="text-center">
        <p className="text-white text-xl mb-4">
          You've completed "Play Together"!
        </p>
        <p className="text-white/80 text-lg mb-8">
          Your class just played <strong className="text-cyan-400">Twinkle Twinkle Little Star</strong> as a team!
        </p>
      </div>

      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 mb-8">
        <h3 className="text-green-300 font-semibold mb-3">What Students Learned:</h3>
        <ul className="list-disc list-inside text-white/90 space-y-2">
          <li>Each musical note has a color and pitch</li>
          <li>Working together creates complex melodies</li>
          <li>Following visual cues (LED lights) keeps everyone in sync</li>
          <li>The sequencer shows when each instrument plays</li>
        </ul>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={onReset}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <RotateCw className="w-5 h-5" /> Restart Lesson
        </button>
        <button
          onClick={onBackToLessons}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Lessons
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
        <p className="text-blue-200 text-sm">
          <strong>💡 For Instructors:</strong> You can use the "Restart Lesson" button
          to run this activity multiple times with different student groups during the workshop.
        </p>
      </div>
    </ViewCard>
  );
};
```

---

## 5. Instructor-Friendly UX Components

### 5.1 InstructorGuidance Component

```tsx
interface InstructorGuidanceProps {
  children: React.ReactNode;
  collapsed?: boolean; // Start collapsed (for sequencer view)
}

const InstructorGuidance: React.FC<InstructorGuidanceProps> = ({
  children,
  collapsed = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  return (
    <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
      <div
        className={`flex items-center justify-between ${collapsed ? 'cursor-pointer' : ''}`}
        onClick={() => collapsed && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-300 font-semibold">Instructor Guide</span>
        </div>
        {collapsed && (
          <button
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            aria-label={isExpanded ? 'Collapse guide' : 'Expand guide'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>
      {isExpanded && (
        <div className="mt-3 text-sm space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};
```

### 5.2 BoomwhackerColorChart Component

```tsx
const BoomwhackerColorChart: React.FC = () => {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const colorNames = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Violet'];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
      {notes.map((note, i) => {
        const chromaticIndex = BOOMWHACKER_NOTE_INDEX[note];
        const color = BOOMWHACKER_COLORS[chromaticIndex];

        return (
          <div key={note} className="text-center">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg mx-auto mb-2 flex items-center justify-center border-2 border-white/20 shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            >
              <span className="text-white text-2xl font-bold drop-shadow-lg">
                {note}
              </span>
            </div>
            <span className="text-white/80 text-sm font-medium">
              {colorNames[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
};
```

### 5.3 SimplePracticePlayer Component

```tsx
interface SimplePracticePlayerProps {
  notes: string[];
  onComplete: () => void;
}

const SimplePracticePlayer: React.FC<SimplePracticePlayerProps> = ({
  notes,
  onComplete
}) => {
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [playedNotes, setPlayedNotes] = useState<Set<string>>(new Set());
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio engine
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    const masterGain = audioContextRef.current.createGain();
    masterGain.connect(audioContextRef.current.destination);

    soundEngineRef.current = createSoundEngine(
      'pluck',
      audioContextRef.current,
      masterGain
    );

    return () => {
      soundEngineRef.current?.dispose();
      audioContextRef.current?.close();
    };
  }, []);

  const playNote = (note: string) => {
    const chromaticIndex = BOOMWHACKER_NOTE_INDEX[note];
    const frequency = NOTE_FREQUENCIES[chromaticIndex];

    // Play note sound
    soundEngineRef.current?.playNote(frequency, 0.8, 0.5);

    // Visual feedback
    setCurrentNote(note);
    setTimeout(() => setCurrentNote(null), 500);

    // Track played notes
    const newPlayed = new Set(playedNotes).add(note);
    setPlayedNotes(newPlayed);

    // Check completion
    if (newPlayed.size === notes.length) {
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 my-6">
      {notes.map(note => {
        const chromaticIndex = BOOMWHACKER_NOTE_INDEX[note];
        const color = BOOMWHACKER_COLORS[chromaticIndex];
        const isPlayed = playedNotes.has(note);
        const isCurrent = currentNote === note;

        return (
          <button
            key={note}
            onClick={() => playNote(note)}
            className={`p-6 rounded-lg border-4 transition-all touch-target ${
              isCurrent
                ? 'scale-110 shadow-lg shadow-white/30'
                : isPlayed
                ? 'border-green-500 bg-green-900/30'
                : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
            }`}
            style={{
              borderColor: isCurrent ? color : undefined
            }}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: color }}
              >
                <span className="text-white text-xl font-bold drop-shadow">
                  {note}
                </span>
              </div>
              {isPlayed && (
                <Check className="w-5 h-5 text-green-400 mx-auto animate-bounce" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
```

### 5.4 KeyboardHint Component

```tsx
const KeyboardHint: React.FC<{ children: string }> = ({ children }) => (
  <div className="flex items-center gap-2 text-gray-400 text-sm">
    <kbd className="px-3 py-1.5 bg-gray-700 rounded border border-gray-600 font-mono text-white shadow">
      {children}
    </kbd>
    <span>to continue</span>
  </div>
);
```

### 5.5 StepProgress Component

```tsx
interface StepProgressProps {
  steps: string[];
  current: string;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, current }) => {
  const viewMap: Record<string, number> = {
    'intro': 0,
    'practice': 1,
    'sequencer': 2,
    'complete': 3
  };

  const currentIndex = viewMap[current] ?? 0;

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                i === currentIndex
                  ? 'bg-cyan-500 border-cyan-400 text-white scale-110'
                  : i < currentIndex
                  ? 'bg-green-500 border-green-400 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400'
              }`}
            >
              {i < currentIndex ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`text-xs mt-2 ${
              i === currentIndex ? 'text-white font-semibold' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 bg-gray-700">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: i < currentIndex ? '100%' : '0%' }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

---

## 6. Keyboard Shortcuts & Accessibility

### 6.1 Keyboard Event Handling

```typescript
// In EducationMode.tsx - Lesson 4 component
useEffect(() => {
  if (selectedLesson?.id !== '4') return;

  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch(e.key) {
      case ' ': // Spacebar - advance step
        e.preventDefault();
        if (currentView === 'intro') {
          setCurrentView('practice');
        } else if (currentView === 'practice' && hasCompletedPractice) {
          setCurrentView('sequencer');
        } else if (currentView === 'sequencer') {
          setCurrentView('complete');
        }
        break;

      case 'Escape': // Exit lesson
        if (confirm('Exit this lesson and return to lesson selection?')) {
          setSelectedLesson(null);
        }
        break;

      case 'r':
      case 'R': // Reset lesson
        if (confirm('Reset lesson to beginning? All progress will be lost.')) {
          setCurrentView('intro');
          setHasCompletedPractice(false);
        }
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        // Play corresponding note in practice view
        if (currentView === 'practice') {
          const notes = ['C', 'D', 'E', 'F', 'G'];
          const note = notes[parseInt(e.key) - 1];
          if (note) {
            // Trigger note playback (delegated to SimplePracticePlayer)
            document.dispatchEvent(new CustomEvent('playNote', { detail: { note } }));
          }
        }
        break;
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [selectedLesson, currentView, hasCompletedPractice]);
```

### 6.2 Keyboard Shortcuts Reference

| Key | Action | Available In |
|-----|--------|--------------|
| `Spacebar` | Advance to next step | All views (when ready) |
| `Escape` | Exit lesson (with confirmation) | All views |
| `R` | Reset lesson (with confirmation) | All views |
| `1-5` | Play note C, D, E, F, G | Practice view only |
| `?` | Show keyboard shortcuts help | All views |

### 6.3 Accessibility Features

**Screen Reader Support:**
```tsx
// Example: Practice buttons
<button
  onClick={() => playNote('C')}
  aria-label={`Play note C (Red boomwhacker)`}
  aria-pressed={playedNotes.has('C')}
>
  {/* Visual content */}
</button>

// Example: Step progress
<div role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={steps.length}>
  {/* Progress indicators */}
</div>
```

**Touch Targets:**
- All interactive elements ≥44px (`.touch-target` class)
- Large click areas for practice buttons (96px × 96px on mobile)
- Adequate spacing between buttons (16px gap minimum)

**Color Contrast:**
- Instructor guidance: Yellow-on-dark (WCAG AA compliant)
- Practice buttons: High-contrast borders
- All text ≥14px with sufficient contrast

---

## 7. Workshop Integration

### 7.1 Workshop Config Loading

```typescript
// In IsometricSequencer.tsx
const loadWorkshopConfig = async () => {
  try {
    // Option 1: Vite dynamic import (build-time bundling)
    const configModule = await import('../../../education/workshop-config.json');
    const config = configModule.default;

    // Validate config schema
    if (!config.workshopMode || !config.tubes) {
      console.warn('[Workshop] Invalid config structure, falling back to demo mode');
      return null;
    }

    // Apply workshop config
    const activeTubes = config.tubes.filter(tube => tube.enabled);

    // Create LED visualizers for each tube
    activeTubes.forEach(tube => {
      const visualizer = new SingleLaneVisualizer(
        {
          id: tube.id,
          name: tube.name,
          ipAddress: tube.ipAddress,
          ledCount: tube.ledCount,
          laneIndex: tube.laneIndex,
          color: tube.color,
          reverseDirection: tube.reverseDirection,
          // ... other config
        },
        16, // 16 steps
        {
          updateRate: 30,
          brightness: 0.8,
          visualizationMode: 'static',
          protocol: 'udp'
        }
      );

      ledVisualizers.push(visualizer);
    });

    setLEDEnabled(true);
    console.log(`[Workshop] Loaded ${activeTubes.length} WLED tubes`);

  } catch (error) {
    console.warn('[Workshop] Failed to load config, falling back to demo mode:', error);
    return null;
  }
};
```

### 7.2 Note-to-Tube Mapping

```typescript
// Map boomwhacker notes to WLED tubes
const updateWorkshopLEDs = (pattern: boolean[][], currentStep: number, isPlaying: boolean) => {
  ledVisualizers.forEach(visualizer => {
    // Get tube config
    const tubeNote = visualizer.config.boomwhackerNote; // e.g., 'C', 'D', 'E'
    const chromaticIndex = BOOMWHACKER_NOTE_INDEX[tubeNote]; // e.g., 0 for C, 2 for D

    // Get pattern for this note
    const notePattern = pattern[chromaticIndex];

    // Update this tube's LED strip
    visualizer.updateStrip(
      notePattern,
      currentStep,
      isPlaying,
      visualizer.config.color,
      false, // solo
      false, // muted
      0, // beatProgress
      false, // smoothScrolling
      Date.now()
    ).catch(error => {
      console.warn(`[Workshop] LED update error for tube ${tubeNote}:`, error);
    });
  });
};
```

### 7.3 Graceful Degradation (No Workshop Config)

```typescript
// Fallback to demo mode if workshop config not available
const initializeLesson4 = async () => {
  if (autoLoad?.workshopMode) {
    const config = await loadWorkshopConfig();

    if (!config) {
      // Show demo mode indicator
      setDemoMode(true);

      // Create single visualizer for all notes
      const demoVisualizer = new SingleLaneVisualizer(
        {
          id: 'demo-lesson4',
          name: 'Demo Mode',
          ipAddress: '192.168.1.100', // Fallback IP
          ledCount: 90,
          laneIndex: 0,
          multiNotesMode: true, // Show all notes on one strip
          assignedLanes: [0, 2, 4, 5, 7, 9], // C, D, E, F, G, A
          // ...
        },
        16,
        { updateRate: 30, brightness: 0.8, visualizationMode: 'static', protocol: 'udp' }
      );

      ledVisualizers.push(demoVisualizer);
    }
  }
};
```

---

## 8. Code Extraction & Utilities

### 8.1 musicConstants.ts

```typescript
/**
 * Centralized music theory constants
 * Extracted from IsometricSequencer to enable reuse across Education Mode
 */

// Official Boomwhacker colors for complete chromatic scale
export const BOOMWHACKER_COLORS = [
  '#ff4444', // C - Red
  '#ff8844', // C# - Orange-Red
  '#ffaa44', // D - Orange
  '#ffcc44', // D# - Yellow-Orange
  '#ffff44', // E - Yellow
  '#aaff44', // F - Yellow-Green
  '#66ff44', // F# - Green-Yellow
  '#44ff44', // G - Green
  '#44ffaa', // G# - Blue-Green
  '#44aaff', // A - Blue
  '#4466ff', // A# - Blue-Purple
  '#6644ff'  // B - Purple
];

// Complete chromatic scale frequencies (C4 to B4)
export const NOTE_FREQUENCIES = [
  261.63, // C4
  277.18, // C#4
  293.66, // D4
  311.13, // D#4
  329.63, // E4
  349.23, // F4
  369.99, // F#4
  392.00, // G4
  415.30, // G#4
  440.00, // A4
  466.16, // A#4
  493.88  // B4
];

// Note names (chromatic scale)
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Boomwhacker note-to-chromatic-index mapping
export const BOOMWHACKER_NOTE_INDEX: Record<string, number> = {
  'C': 0,
  'C#': 1,
  'D': 2,
  'D#': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'G': 7,
  'G#': 8,
  'A': 9,
  'A#': 10,
  'B': 11
};

// Reverse mapping (index to note name)
export const getNoteName = (index: number): string => NOTE_NAMES[index % 12];
export const getNoteFrequency = (index: number): number => NOTE_FREQUENCIES[index % 12];
export const getNoteColor = (index: number): string => BOOMWHACKER_COLORS[index % 12];
```

### 8.2 melodyPatterns.ts

```typescript
import { NOTE_NAMES, BOOMWHACKER_NOTE_INDEX } from './musicConstants';

/**
 * Pre-defined melody patterns for education mode
 */

export interface MelodyPattern {
  name: string;
  description: string;
  scaleDegrees: number[]; // 1-indexed scale degrees, 0 = rest
  noteSequence: string[]; // Note names for C major
  tempo: number; // Recommended BPM
}

export const TWINKLE_PATTERN: MelodyPattern = {
  name: 'Twinkle Twinkle Little Star',
  description: 'Classic nursery rhyme in C major',
  scaleDegrees: [
    1, 1, 5, 5, 6, 6, 5, 0, // Twinkle twinkle little star
    4, 4, 3, 3, 2, 2, 1, 0  // How I wonder what you are
  ],
  noteSequence: ['C', 'C', 'G', 'G', 'A', 'A', 'G', '', 'F', 'F', 'E', 'E', 'D', 'D', 'C', ''],
  tempo: 90
};

/**
 * Convert melody pattern to 2D boolean grid for sequencer
 * @param pattern - The melody pattern to convert
 * @returns 12-lane × 16-step boolean grid
 */
export function patternToGrid(pattern: MelodyPattern): boolean[][] {
  const grid: boolean[][] = Array(12).fill(null).map(() => Array(16).fill(false));

  pattern.noteSequence.forEach((note, stepIndex) => {
    if (note) {
      const chromaticIndex = BOOMWHACKER_NOTE_INDEX[note];
      grid[chromaticIndex][stepIndex] = true;
    }
  });

  return grid;
}

/**
 * Extract unique notes from pattern
 * @param pattern - The melody pattern
 * @returns Array of unique note names
 */
export function getPatternNotes(pattern: MelodyPattern): string[] {
  return [...new Set(pattern.noteSequence.filter(note => note !== ''))];
}
```

---

## 9. Testing Strategy

### 9.1 Manual Testing Checklist

#### Embedded Mode Testing
- [ ] **Small Container (400px × 300px)**
  - [ ] Canvas renders without overflow
  - [ ] Controls are accessible (not cut off)
  - [ ] Compact header displays correctly
  - [ ] Settings panel is scrollable

- [ ] **Large Container (1200px × 800px)**
  - [ ] Canvas scales appropriately
  - [ ] 3D perspective is correct
  - [ ] Control panel layout is optimal

- [ ] **Responsive Resizing**
  - [ ] Canvas resizes on window resize (standalone)
  - [ ] Canvas resizes on container resize (embedded)
  - [ ] No visual glitches during resize
  - [ ] Camera perspective updates correctly

- [ ] **/studio Integration**
  - [ ] IsometricSequencer fits in grid cell
  - [ ] No layout breakage or overflow
  - [ ] Works alongside LiveAudioVisualizer

#### Lesson 4 Functional Testing
- [ ] **Step 1: Intro**
  - [ ] Instructor guidance displays correctly
  - [ ] Color chart shows all 7 notes
  - [ ] Spacebar advances to next step
  - [ ] "Next" button works

- [ ] **Step 2: Practice**
  - [ ] All 5 note buttons play correct sounds
  - [ ] Visual feedback on button click
  - [ ] Check mark appears after note played
  - [ ] "Next" button appears after all notes played
  - [ ] Keyboard shortcuts 1-5 play notes

- [ ] **Step 3: Sequencer**
  - [ ] Embedded sequencer loads correctly
  - [ ] Twinkle pattern is auto-loaded
  - [ ] Tempo is 90 BPM
  - [ ] Sound engine is "pluck"
  - [ ] Workshop config loads (if available)
  - [ ] WLED tubes connect (if config exists)
  - [ ] "Done" button returns to completion
  - [ ] "Back to Practice" button works
  - [ ] "Complete Lesson" button works

- [ ] **Step 4: Complete**
  - [ ] Completion message displays
  - [ ] "Restart Lesson" resets to step 1
  - [ ] "Back to Lessons" returns to lesson selection
  - [ ] All state is properly reset on restart

#### Keyboard Shortcuts Testing
- [ ] Spacebar advances steps (when ready)
- [ ] Escape exits lesson (with confirmation)
- [ ] R resets lesson (with confirmation)
- [ ] 1-5 play notes in practice view
- [ ] Shortcuts don't trigger when typing in inputs

#### Workshop Integration Testing
- [ ] **With Workshop Config**
  - [ ] Config loads from `/education/workshop-config.json`
  - [ ] 6 WLED tubes initialize
  - [ ] Each tube lights for assigned note only
  - [ ] Multi-lane visualization works
  - [ ] Tempo is 90 BPM (beginner-friendly)

- [ ] **Without Workshop Config**
  - [ ] Graceful degradation to demo mode
  - [ ] Single visualizer with multi-notes mode
  - [ ] Demo mode indicator shown
  - [ ] Lesson still functional

- [ ] **Offline Mode**
  - [ ] Lesson works without internet
  - [ ] Workshop config loads locally
  - [ ] WLED tubes connect via local network
  - [ ] No network errors in console

### 9.2 Performance Testing

- [ ] **WLED Update Rate**
  - [ ] 6 tubes @ 30Hz = 180 updates/sec (baseline)
  - [ ] 12 tubes @ 30Hz = 360 updates/sec (max)
  - [ ] No dropped frames or stuttering
  - [ ] LED latency <50ms

- [ ] **Canvas Rendering**
  - [ ] 60fps in standalone mode
  - [ ] 60fps in embedded mode (600px × 400px)
  - [ ] 60fps with pattern playback active
  - [ ] No memory leaks on lesson reset

- [ ] **Audio Playback**
  - [ ] No glitches or clicks
  - [ ] Consistent timing (90 BPM ±1 BPM)
  - [ ] Multiple notes play simultaneously (polyphonic)
  - [ ] No audio drift over 10+ loops

### 9.3 Accessibility Testing

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements reachable via Tab
  - [ ] Focus indicators visible
  - [ ] Logical tab order

- [ ] **Screen Reader**
  - [ ] All buttons have aria-labels
  - [ ] Progress indicator has aria-valuenow
  - [ ] Instructor guidance is readable

- [ ] **Touch Targets**
  - [ ] All buttons ≥44px × 44px
  - [ ] Adequate spacing (≥8px gap)
  - [ ] No accidental taps on mobile

- [ ] **Color Contrast**
  - [ ] Text contrast ≥4.5:1 (WCAG AA)
  - [ ] Interactive elements distinguishable
  - [ ] Focus states visible

### 9.4 Regression Testing

- [ ] **Standalone /isometric**
  - [ ] All existing functionality unchanged
  - [ ] Full-screen rendering works
  - [ ] All controls visible and functional
  - [ ] LED Manager modal works
  - [ ] APC40 integration works
  - [ ] All melody modes work (melody, random, chords, beats, twinkle)

- [ ] **Existing Education Lessons**
  - [ ] Lesson 1 (Basic Beat) unchanged
  - [ ] Lesson 2 (Color and Pitch) unchanged
  - [ ] Lesson 3 (Rhythm Patterns) unchanged
  - [ ] Lesson selection grid functional

---

## 10. Risk Mitigation

### 10.1 Risk Assessment Matrix

| Risk | Likelihood | Impact | Severity | Mitigation | Status |
|------|------------|--------|----------|------------|--------|
| **Embedded mode breaks standalone** | Medium | High | 🔴 HIGH | Feature flag, conditional rendering, extensive testing | ✅ ADDRESSED |
| **Canvas sizing issues in containers** | Low | Medium | 🟡 MEDIUM | Container queries, ResizeObserver, fallback min-height | ✅ ADDRESSED |
| **Workshop config not ready (Story 20.1)** | Medium | Medium | 🟡 MEDIUM | Graceful degradation to demo mode, standalone lesson still works | ✅ ADDRESSED |
| **WLED performance degradation (12 tubes)** | Low | Medium | 🟡 MEDIUM | Monitor at 30Hz, reduce update rate if needed, tested in Lesson 3 | ✅ LOW RISK |
| **Keyboard shortcuts conflict** | Low | Low | 🟢 LOW | Only active when Lesson 4 selected, ignore when typing in inputs | ✅ ADDRESSED |
| **Audio glitches on pattern loop** | Low | Low | 🟢 LOW | Use existing Tone.Transport logic (proven in Lessons 1-3) | ✅ LOW RISK |
| **State management complexity** | Medium | Low | 🟢 LOW | Extract to custom hook, clear state machine | ✅ ADDRESSED |

### 10.2 Rollback Plan

**If embedded mode causes issues:**
1. Add feature flag: `ENABLE_EMBEDDED_MODE = false`
2. Conditional rendering in IsometricSequencer:
   ```tsx
   if (!ENABLE_EMBEDDED_MODE && embedded) {
     // Fallback to standalone rendering
     embedded = false;
   }
   ```
3. Lesson 4 can still navigate to full /isometric view
4. Rollback time: <5 minutes

**If Lesson 4 is non-functional:**
1. Remove Lesson 4 from `lessons` array in EducationMode
2. Revert EducationMode.tsx to previous commit
3. No database or config changes required
4. Rollback time: <2 minutes

---

## 11. Implementation Roadmap

### 11.1 Phase 1: Extract Utilities (30 min)

**Deliverables:**
- `src/utils/musicConstants.ts` (60 lines)
- `src/utils/melodyPatterns.ts` (40 lines)

**Steps:**
1. Create `musicConstants.ts` with BOOMWHACKER_COLORS, NOTE_FREQUENCIES, etc.
2. Create `melodyPatterns.ts` with TWINKLE_PATTERN and utilities
3. Update `IsometricSequencer.tsx` to import from `musicConstants.ts`
4. Test IsometricSequencer still works (no regression)

**Testing:**
- [ ] /isometric loads without errors
- [ ] Twinkle pattern still generates correctly
- [ ] Colors match previous implementation

---

### 11.2 Phase 2: Embedded Mode (1.5 hours)

**Deliverables:**
- Modified `IsometricSequencer.tsx` (+100 lines)

**Steps:**
1. Add props interface (embedded, hideControls, autoLoad, className)
2. Implement conditional rendering (standalone vs. embedded)
3. Add container-aware canvas sizing (ResizeObserver)
4. Implement auto-load logic (pattern, tempo, soundEngine, workshopMode)
5. Add compact header with settings toggle
6. Make controls collapsible
7. Test in various container sizes

**Testing:**
- [ ] Standalone mode unchanged (regression test)
- [ ] Embedded mode renders in 400px × 300px container
- [ ] Embedded mode renders in 1200px × 800px container
- [ ] Canvas resizes correctly
- [ ] Auto-load works (Twinkle pattern, 90 BPM, pluck sound)

---

### 11.3 Phase 3: Lesson 4 Components (1.5 hours)

**Deliverables:**
- `InstructorGuidance.tsx` (40 lines)
- `BoomwhackerColorChart.tsx` (30 lines)
- `SimplePracticePlayer.tsx` (80 lines)
- `KeyboardHint.tsx` (15 lines)
- `StepProgress.tsx` (50 lines)

**Steps:**
1. Create InstructorGuidance component with collapse functionality
2. Create BoomwhackerColorChart using musicConstants
3. Create SimplePracticePlayer with audio playback
4. Create KeyboardHint component
5. Create StepProgress component
6. Test each component in isolation

**Testing:**
- [ ] InstructorGuidance expands/collapses correctly
- [ ] Color chart displays all 7 notes with correct colors
- [ ] Practice player plays correct notes
- [ ] Practice player tracks completion
- [ ] Keyboard hints display correctly
- [ ] Step progress updates correctly

---

### 11.4 Phase 4: Integration (1 hour)

**Deliverables:**
- Modified `EducationMode.tsx` (+200 lines for Lesson 4)

**Steps:**
1. Add Lesson 4 to lessons array
2. Implement Lesson4Component with state machine
3. Create IntroView, PracticeView, SequencerView, CompleteView
4. Wire up navigation flow
5. Implement keyboard shortcuts
6. Test full lesson flow

**Testing:**
- [ ] Lesson 4 appears in lesson selection
- [ ] All 4 views render correctly
- [ ] Navigation works (Next, Back, Complete)
- [ ] Keyboard shortcuts work (Spacebar, Escape, R, 1-5)
- [ ] Embedded sequencer loads in SequencerView
- [ ] Lesson completion and reset work

---

### 11.5 Phase 5: Workshop Testing (30 min)

**Deliverables:**
- Workshop integration verification
- Final polish and bug fixes

**Steps:**
1. Test with workshop config (if available)
2. Test WLED tube connections
3. Verify offline mode
4. Test graceful degradation (no config)
5. Performance testing (12 tubes @ 30Hz)
6. Final polish (spacing, animations, copy)

**Testing:**
- [ ] Workshop config loads correctly
- [ ] WLED tubes connect and light up
- [ ] Each tube shows only its assigned note
- [ ] Works offline (no internet)
- [ ] Demo mode works (no config)
- [ ] Performance is acceptable (no lag)

---

## 12. Success Criteria

### 12.1 Functional Requirements

- ✅ IsometricSequencer supports embedded mode (container-aware)
- ✅ Lesson 4 appears in Education Mode lesson selection
- ✅ All 4 lesson views are functional (Intro, Practice, Sequencer, Complete)
- ✅ Instructor guidance is clear and helpful
- ✅ Boomwhacker color chart displays correctly
- ✅ Practice player allows note testing
- ✅ Embedded sequencer auto-loads Twinkle pattern
- ✅ Workshop config integration works (with graceful degradation)
- ✅ WLED tubes light up for assigned notes
- ✅ Keyboard shortcuts work (Spacebar, Escape, R, 1-5)
- ✅ Lesson reset functionality works

### 12.2 Non-Functional Requirements

- ✅ /isometric standalone mode unchanged (zero regression)
- ✅ /studio layout issues fixed (bonus outcome)
- ✅ Code reuse ≥90% (no significant duplication)
- ✅ Performance acceptable (60fps, <50ms LED latency)
- ✅ Accessible (keyboard navigation, touch targets, screen readers)
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Works offline (no internet dependency)
- ✅ Implementation time ≤5 hours

### 12.3 Workshop Readiness

- ✅ Instructor-friendly (clear guidance, easy to follow)
- ✅ Student-friendly (progressive learning, visual cues)
- ✅ Workshop config support (6-12 tubes)
- ✅ Offline-first (no network required)
- ✅ Quick reset (for multiple workshop runs)
- ✅ Emergency fallback (demo mode if config fails)

---

## Appendices

### Appendix A: Code Examples

See inline code examples throughout sections 3-8.

### Appendix B: Workshop Config Schema

```json
{
  "workshopMode": true,
  "tubes": [
    {
      "id": "tube1_C",
      "name": "C (Red)",
      "ipAddress": "192.168.8.151",
      "laneIndex": 0,
      "color": "#ff4444",
      "boomwhackerNote": "C",
      "ledCount": 90,
      "enabled": true,
      "reverseDirection": true,
      "studentPosition": 1
    }
    // ... 5 more tubes (D, E, F, G, A)
  ]
}
```

### Appendix C: File Size Estimates

| File | Lines | Description |
|------|-------|-------------|
| `musicConstants.ts` | 60 | Extracted constants |
| `melodyPatterns.ts` | 40 | Twinkle pattern utilities |
| `IsometricSequencer.tsx` | +100 | Embedded mode logic |
| `InstructorGuidance.tsx` | 40 | Instructor guidance component |
| `BoomwhackerColorChart.tsx` | 30 | Color reference chart |
| `SimplePracticePlayer.tsx` | 80 | Note practice component |
| `KeyboardHint.tsx` | 15 | Keyboard hint display |
| `StepProgress.tsx` | 50 | Step progress indicator |
| `EducationMode.tsx` | +200 | Lesson 4 implementation |
| **Total** | **~615 lines** | Total new/modified code |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-20 | Winston (Architect) | Initial architecture document |

---

**End of Document**
