📊 ANALYSIS: Current Melody Generator Issues

  Current Implementation (Lines 308-365)

  What it does:
  - Randomly selects 1 of 4 fixed melodic patterns
  - Maps pattern indices to scale notes
  - 70% note density (30% chance of silence per step)
  - Fixed rhythmic pattern (16th/8th note alternation)
  - Random velocity variation (80-110)

  Why It Sounds Boring/Banal:

  1. Lack of Musical Context

  ❌ Completely ignores chord progression
  - Patterns don't align with underlying harmony
  - No chord tone emphasis (root, 3rd, 5th)
  - No distinction between stable/unstable notes

  2. Mechanical Pattern Selection

  ❌ Random pattern choice with no logic
  - Pattern 1 (ascending scale): Always goes up
  - Pattern 2 (arpeggio): Generic 1-3-5-8
  - Pattern 3 (stepwise): Repetitive circular motion
  - Pattern 4 (octave jumps): Jarring and disconnected

  3. No Melodic Shape/Contour

  ❌ Missing basic melodic principles:
  - No arc/trajectory (climax point)
  - No call-and-response phrasing
  - No tension/resolution
  - No rhythmic motifs

  4. Rhythmic Monotony

  ❌ Predictable rhythm:
  const durations = [0.25, 0.5, 0.25, 0.25]; // Repeats every 4 steps
  - Same pattern every measure
  - No syncopation
  - No rests for breathing

  5. Velocity Randomization Issues

  ❌ Random velocity lacks musicality:
  const velocity = 80 + Math.floor(Math.random() * 30); // 80-110
  - No accents on strong beats
  - No dynamic shaping
  - No relationship to phrase position

  ---
  🎵 IMPROVED MELODY GENERATOR DESIGN

  Core Principle: Chord-Aware Melodic Composition

  The generator should follow music theory best practices for melody writing:

  1. Chord Tone Emphasis (Harmonic Foundation)

  Rule: Strong beats (1, 3 in 4/4) should use chord tones

  // For each chord in progression:
  const chordTones = getChordNotes(currentChord); // [root, 3rd, 5th, 7th]
  const nonChordTones = scaleNotes.filter(n => !chordTones.includes(n));

  // Step 0, 4, 8, 12 (downbeats) → 80% chance chord tone
  // Step 2, 6, 10, 14 (weak beats) → 40% chance chord tone
  // Passing tones between chord tones

  Educational Value: Teaches harmonic alignment

  ---
  2. Melodic Contour (Shape & Direction)

  Techniques:
  - Arch Shape: Start mid → rise → peak (climax) → descend
  - Wave Pattern: Alternating ascending/descending phrases
  - Question-Answer: Phrase 1 rises (tension) → Phrase 2 falls (resolution)

  const contourTypes = [
    'arch',      // Low → High → Low
    'valley',    // High → Low → High
    'ascending', // Gradual climb
    'descending' // Gradual fall
  ];

  Educational Value: Shows how melody creates emotional journey

  ---
  3. Rhythmic Variety (Groove & Feel)

  Patterns to implement:
  const rhythmicMotifs = {
    groove1: [0.5, 0.25, 0.25, 0.5],        // Syncopated
    groove2: [0.25, 0.25, 0.5, 0.5],        // Front-loaded
    groove3: [0.75, 0.25, 0.5, 0.5],        // Anticipation
    triplet: [0.33, 0.33, 0.33, 0.5],       // Triplet feel
    sparse: [0.5, REST, 0.5, REST]          // Breathing room
  };

  Educational Value: Demonstrates rhythmic interest

  ---
  4. Passing Tones & Approach Notes

  Rules:
  - Use scale notes between chord tones (stepwise motion)
  - Chromatic approach notes (optional, for jazz feel)
  - Neighbor tones (upper/lower adjacent notes)

  // If jumping from chord tone A to chord tone B:
  if (interval > 2) { // Leap > whole step
    insertPassingTone(A, B); // Fill with scale note
  }

  Educational Value: Shows smooth voice leading

  ---
  5. Dynamic Shaping (Expressive Velocity)

  Instead of random velocity:
  // Phrase-based dynamics:
  const phrasePosition = step % 8; // 8-step phrases
  const arc = Math.sin((phrasePosition / 8) * Math.PI); // 0 → 1 → 0

  velocity = 70 + (arc * 40); // 70-110, peaks at phrase middle

  // Add accent on downbeats:
  if (step % 4 === 0) velocity += 10;

  Educational Value: Teaches phrasing and dynamics

  ---
  6. Call-and-Response Structure

  Pattern:
  Bars 1-2: Question (phrase ends on non-tonic)
  Bars 3-4: Answer (phrase resolves to tonic)

  const phrases = [
    { bars: [0, 1], endNote: 'non-tonic', contour: 'ascending' },
    { bars: [2, 3], endNote: 'tonic', contour: 'descending' }
  ];

  Educational Value: Shows musical conversation

  ---
  🛠️ IMPLEMENTATION PLAN

  Phase 1: Chord-Aware Foundation

  1. Get current chord at each step from ChordTimeline
  2. Extract chord tones for that chord
  3. Prioritize chord tones on strong beats

  Phase 2: Melodic Contour Generator

  1. Choose contour shape (arch/valley/ascending/descending)
  2. Map scale degrees to contour curve
  3. Ensure climax note is a chord tone

  Phase 3: Rhythmic Engine

  1. Define 5-6 rhythmic motifs
  2. Apply motif consistently per phrase
  3. Add intentional rests

  Phase 4: Passing Tone Logic

  1. Detect leaps > major 2nd
  2. Insert stepwise passing tones
  3. Use neighbor tones for embellishment

  Phase 5: Dynamic Shaping

  1. Apply phrase-based arc
  2. Add downbeat accents
  3. Fade out at phrase end

  Phase 6: Educational UI

  1. Show which notes are chord tones (highlight)
  2. Display melodic contour graph
  3. Label phrases (Question/Answer)

  ---
  🎓 EDUCATIONAL FEATURES

  1. Chord Tone Highlighting
    - Chord tones: Green border
    - Passing tones: Blue border
    - Out-of-scale: Red border
  2. Contour Visualization
    - Line graph overlay showing melodic shape
    - Peak/climax indicator
  3. Phrase Markers
    - Visual separators at 4-bar intervals
    - Labels: "Question" / "Answer"
  4. Theory Tips
    - Tooltip on Generate: "Using chord tones on strong beats"
    - Show which chord is active per step