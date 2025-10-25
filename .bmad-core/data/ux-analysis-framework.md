<!-- Powered by BMAD™ Core -->

# UX Analysis Framework

Comprehensive checklist and evaluation criteria for visual UX analysis. Use this framework to systematically assess each screenshot during persona review.

## Analysis Workflow

For each screenshot:
1. **First Impression** (5 seconds): What do you notice first/second/third?
2. **Checklist Evaluation**: Score each category (PASS/CONCERNS/FAIL)
3. **Issue Identification**: Mark specific problems with severity
4. **Persona Voice**: Capture emotional response in their words
5. **Actionable Recommendations**: Suggest concrete fixes

---

## Category 1: Visual Hierarchy

### Definition
Visual hierarchy guides the user's eye through content in order of importance. Effective hierarchy makes the primary action/information immediately obvious.

### Evaluation Checklist

#### Primary CTA (Call-to-Action)
- [ ] **Immediately obvious** - First thing you notice (<1 second)
- [ ] **Size dominance** - Largest interactive element on screen
- [ ] **Color contrast** - Stands out from background and other elements
- [ ] **Position strategic** - Above fold, centered, or right-aligned for scanning
- [ ] **Label clear** - Action verb, specific purpose ("Start Tutorial" not "Continue")
- [ ] **Touch target adequate** - Minimum 44px height (mobile accessibility)

#### Text Hierarchy
- [ ] **H1 prominence** - Page title is visually dominant
- [ ] **H2/H3 distinction** - Clear visual difference between heading levels
- [ ] **Body text readable** - 16px minimum, adequate line height (1.5-1.75)
- [ ] **Logical flow** - Eye flows naturally: H1 → H2 → body → CTA
- [ ] **Emphasis appropriate** - Bold/color used sparingly for key info

#### Attention Guidance
- [ ] **Whitespace effective** - Space directs attention, not just fills gaps
- [ ] **Focal point clear** - One primary element dominates (not competition)
- [ ] **Progressive disclosure** - Secondary info de-emphasized until needed
- [ ] **Visual weight balanced** - Important elements have visual mass

### Scoring Rubric

**PASS (No issues):**
- Primary CTA immediately obvious
- Text hierarchy clear and consistent
- Eye flow natural and intentional
- Attention guided effectively to goals

**CONCERNS (Minor issues):**
- Primary CTA present but requires effort to find (2-3 seconds)
- Text hierarchy somewhat unclear (H2 competes with H1)
- Attention divided between 2-3 elements
- Whitespace inconsistent

**FAIL (Critical issues):**
- Primary CTA buried or missing (>3 seconds to find)
- Text hierarchy confusing or flat (all elements same visual weight)
- No clear focal point (visual chaos)
- Important info hidden below fold without indication

### Common Issues & Fixes

| **Issue** | **Severity** | **Suggested Fix** |
|-----------|--------------|-------------------|
| CTA button too small | MAJOR | Increase to minimum 48px height, 140px width |
| H1 competes with other elements | MAJOR | Increase H1 size by 1.5x, add margin below |
| Text wall with no hierarchy | CRITICAL | Add H2 subheadings, bullet lists, paragraph breaks |
| Important info below fold | MAJOR | Move key message above fold or add scroll indicator |
| Whitespace cramped | MINOR | Increase padding to 24px minimum around sections |

---

## Category 2: Layout & Responsiveness

### Definition
Layout controls element arrangement, alignment, and spacing. Responsive design ensures usability across devices (mobile, tablet, desktop).

### Evaluation Checklist

#### Alignment & Grid
- [ ] **Elements aligned** - No floating/orphaned elements
- [ ] **Grid consistency** - Implicit grid structure (even without visible lines)
- [ ] **Columns balanced** - Multi-column layouts feel intentional
- [ ] **Margins consistent** - Same spacing pattern repeated

#### Spacing & Rhythm
- [ ] **Padding adequate** - Breathing room around content (16px+ minimum)
- [ ] **Vertical rhythm** - Consistent spacing between sections (24px, 48px, etc.)
- [ ] **Line length optimal** - 50-75 characters per line (not full screen width)
- [ ] **Grouping clear** - Related elements closer than unrelated

#### Responsive Behavior
- [ ] **Mobile usable** - Not just "scaled down" desktop
- [ ] **Touch targets sized** - ≥44px for buttons/links (Apple guidelines)
- [ ] **Text readable** - No horizontal scrolling required
- [ ] **Image scaling** - Images fit viewport without overflow
- [ ] **Mobile nav accessible** - Menu/nav easy to access on small screens

#### Cross-Device Consistency
- [ ] **Desktop layout logical** - Takes advantage of wider screen
- [ ] **Tablet experience good** - Not awkward in-between (use desktop OR mobile)
- [ ] **Viewport transitions smooth** - No jarring jumps at breakpoints

### Scoring Rubric

**PASS:**
- Clean alignment, consistent spacing
- Usable on mobile without frustration
- Touch targets meet accessibility guidelines
- Responsive behavior feels intentional

**CONCERNS:**
- Minor alignment issues (1-2 elements off-grid)
- Some cramped spacing (12px instead of 16px)
- Touch targets slightly small (40-43px)
- Mobile layout awkward but functional

**FAIL:**
- Elements overlap or float incorrectly
- Unusable on mobile (horizontal scroll, tiny text)
- Touch targets <40px (accessibility violation)
- Broken layout at common breakpoints (375px, 768px, 1024px)

### Common Issues & Fixes

| **Issue** | **Severity** | **Suggested Fix** |
|-----------|--------------|-------------------|
| Elements overlap on mobile | CRITICAL | Add `@media` query with `flex-direction: column` |
| Touch target 38px | MAJOR | Increase padding to achieve 44px minimum |
| Text full-width on desktop | MINOR | Add `max-width: 65ch` to paragraph container |
| Cramped padding (8px) | MINOR | Increase to 16px mobile, 24px desktop |
| Alignment off by 2-3px | MINOR | Use CSS Grid or Flexbox for automatic alignment |

### Responsive Testing Points

**Must test at these viewports:**
- **375px** - iPhone SE (smallest common mobile)
- **768px** - iPad portrait (tablet)
- **1024px** - iPad landscape (tablet)
- **1920px** - Desktop (large screen)

---

## Category 3: Cognitive Load

### Definition
Cognitive load is the mental effort required to understand and use the interface. Lower cognitive load = easier to use, faster task completion, less frustration.

### Evaluation Checklist

#### Content Scannability
- [ ] **Headlines descriptive** - I know what section is about without reading body
- [ ] **Paragraphs short** - 2-3 sentences maximum
- [ ] **Bullet lists used** - Complex info broken into scannable points
- [ ] **Bold for emphasis** - Key terms highlighted (not entire sentences)
- [ ] **F-pattern friendly** - Important info on left/top (Western reading)

#### Choice Architecture
- [ ] **Options limited** - 3-5 choices max (not 10+ buttons)
- [ ] **Default suggested** - Recommended path obvious if multiple options
- [ ] **Progressive disclosure** - Advanced options hidden until requested
- [ ] **Undo available** - Can go back if wrong choice made

#### Label Clarity
- [ ] **Button labels specific** - "Start Musician Tutorial" not "Continue"
- [ ] **Icon meaning clear** - Icons have text labels or obvious meaning
- [ ] **Jargon-free** - No unexplained technical terms for target persona
- [ ] **Consistent terminology** - Same thing called same name throughout

#### Instructions & Help
- [ ] **Tooltips helpful** - Appear on hover, provide context
- [ ] **Inline hints present** - Placeholder text or helper text when needed
- [ ] **Error messages clear** - Tell me what's wrong AND how to fix it
- [ ] **Help not required** - Interface self-explanatory (help is optional)

### Scoring Rubric

**PASS:**
- Content easy to scan (headlines, bullets, short paragraphs)
- Clear choices with obvious defaults
- Labels specific and jargon-free
- Interface mostly self-explanatory

**CONCERNS:**
- Some text-heavy sections (4-5 sentence paragraphs)
- Choice overload (6-8 options)
- Some unclear labels ("Submit" - submit what?)
- Requires careful reading to understand

**FAIL:**
- Text walls (10+ sentence paragraphs)
- Overwhelming choices (10+ buttons/links)
- Unclear labels ("OK", "Cancel" - what will happen?)
- Technical jargon unexplained (persona bailout triggers)
- Requires reading instructions to use interface

### Common Issues & Fixes

| **Issue** | **Severity** | **Suggested Fix** |
|-----------|--------------|-------------------|
| Paragraph 8+ sentences | MAJOR | Break into 2-3 short paragraphs with subheadings |
| Button labeled "Continue" | MAJOR | Change to "Start Creating Your Beat" |
| 12 persona cards to choose from | CRITICAL | Reduce to 4 cards, add "See More" for others |
| Technical term undefined (MIDI) | CRITICAL | Replace with simple term OR add tooltip |
| Required reading before action | CRITICAL | Use visual demo or interactive walkthrough instead |

### Cognitive Load Indicators

**High cognitive load signals (BAD):**
- User pauses >3 seconds before acting
- User re-reads content multiple times
- User hovers over multiple options unsure which to pick
- User clicks wrong thing then backs out

**Low cognitive load signals (GOOD):**
- User acts within 1-2 seconds of seeing screen
- User scans quickly and clicks confidently
- User's first choice is correct
- User completes flow without help/instructions

---

## Category 4: Emotional Response

### Definition
Emotional response is the feeling evoked by the interface's tone, visuals, and messaging. Appropriate emotional resonance builds trust, engagement, and retention.

### Evaluation Checklist

#### Tone Matching
- [ ] **Persona-appropriate voice** - Casual for Musicians, professional for Educators
- [ ] **Excitement level correct** - Energetic for performers, calm for learners
- [ ] **Formality matched** - Informal for creatives, formal for educators/pros
- [ ] **Confidence inspiring** - Language is assured, not tentative

#### Visual Emotional Cues
- [ ] **Color palette appropriate** - Warm/vibrant for Musician, cool/calm for Educator
- [ ] **Typography personality** - Font style matches brand personality
- [ ] **Imagery relevant** - Photos/illustrations align with persona goals
- [ ] **Animation pacing** - Speed/style matches desired energy level

#### Trust Building
- [ ] **Professional appearance** - Polished design, no amateurish elements
- [ ] **Consistent quality** - No obvious bugs, broken layouts, or typos
- [ ] **Clear value proposition** - I understand what I'm getting into
- [ ] **No dark patterns** - Honest, transparent, no manipulation

#### Engagement Hooks
- [ ] **Curiosity triggered** - "I want to see what happens next"
- [ ] **Relevant to goals** - Messaging speaks to persona's specific needs
- [ ] **Friction removed** - No obstacles to getting started
- [ ] **Reward visible** - I can see/imagine the outcome I want

### Scoring Rubric

**PASS:**
- Tone perfectly matches persona expectations
- Visual style evokes appropriate emotion (excitement, trust, curiosity)
- Builds trust through professional execution
- Creates desire to continue/engage

**CONCERNS:**
- Tone somewhat generic (works but not optimized for persona)
- Visual style "fine" but not emotionally resonant
- Some trust issues (minor bugs, inconsistent quality)
- Engagement neutral (not boring, but not exciting)

**FAIL:**
- Tone mismatch (too casual for Educator, too technical for Musician)
- Visual style evokes wrong emotion (intimidating, boring, confusing)
- Trust destroyed (broken UI, sketchy appearance)
- Makes user want to leave (friction, confusion, frustration)

### Emotional Response Testing

**Ask these questions in persona voice:**

1. **First 3 seconds:** "What do I feel right now?"
   - Excited, curious, confident → PASS
   - Neutral, unsure → CONCERNS
   - Confused, overwhelmed, suspicious → FAIL

2. **After 30 seconds:** "Do I want to continue?"
   - Yes, eager to see more → PASS
   - Maybe, I guess → CONCERNS
   - No, I'm out → FAIL

3. **If I shared this:** "Would it reflect well on me?"
   - Yes, I'd be proud to share → PASS
   - Meh, it's fine → CONCERNS
   - No, looks unprofessional/boring → FAIL

### Common Issues & Fixes

| **Issue** | **Severity** | **Suggested Fix** |
|-----------|--------------|-------------------|
| Generic "Hello!" greeting | MAJOR | Change to persona-specific: "Let's jam!" (Musician) |
| Cold gray interface for Musician | CRITICAL | Add warm colors (orange, red), energetic vibe |
| Overly casual tone for Educator | CRITICAL | Use professional language, educational framing |
| No visual preview of outcome | MAJOR | Add screenshot/video of what user will create |
| Walls of text feel intimidating | CRITICAL | Replace with interactive demo or visual walkthrough |

---

## Category 5: Persona-Specific Friction

### Definition
Friction unique to the persona's goals, context, and expectations. Generic UX might score well but still fail for a specific persona if it doesn't align with their needs.

### Evaluation Checklist

#### Goals Alignment
- [ ] **Primary goal supported** - Clear path to what persona wants
- [ ] **Time-to-goal appropriate** - Matches persona's patience level
- [ ] **Features prioritized correctly** - Relevant features visible, irrelevant hidden
- [ ] **Success metrics match** - UI measures what persona cares about

#### Language & Terminology
- [ ] **Vocabulary correct** - Uses terms from persona's domain
- [ ] **Jargon avoided** - No unexplained technical terms
- [ ] **Assumptions validated** - Doesn't assume knowledge persona lacks
- [ ] **Tone culturally appropriate** - Matches persona's communication style

#### Device & Context
- [ ] **Device expectation met** - Works on devices persona uses (mobile for Musicians, desktop for Producers)
- [ ] **Environment considered** - Noisy (visual cues for Musicians), quiet (audio ok for Educators)
- [ ] **Usage context appropriate** - Quick session (Musician) vs structured lesson (Educator)

#### Persona Bailout Triggers
- [ ] **No setup hell** - Quick start (critical for Musician)
- [ ] **No student distractions** - Clean, focused (critical for Educator)
- [ ] **Visual feedback present** - See actions (critical for Visual Learner)
- [ ] **Export options available** - Integration path (critical for Producer)

### Scoring Rubric

**PASS:**
- Primary goal achievable within persona's patience level
- Language matches persona's domain
- No persona bailout triggers hit
- Features align with persona's priorities

**CONCERNS:**
- Goal achievable but takes longer than persona prefers
- Some language mismatches (minor jargon)
- 1 minor bailout trigger present (can be overlooked)
- Some irrelevant features visible

**FAIL:**
- Goal unclear or takes too long (exceeds persona's patience)
- Heavy use of unfamiliar jargon
- 1+ critical bailout trigger present
- Features misaligned (showing Producer features to Musician)

### Persona-Specific Checklists

#### Musician (m)
- [ ] Can start jamming within 30 seconds
- [ ] No mention of "configuration" or "setup"
- [ ] Works without MIDI controller/gear
- [ ] Mobile-friendly (big buttons, touch)
- [ ] Visual preview of what they'll create
- [ ] No walls of text to read

#### Educator (e)
- [ ] Clear educational value stated
- [ ] Student-safe (no chat, appropriate content)
- [ ] Works on school devices (Chromebooks, iPads)
- [ ] No account required for students
- [ ] Professional appearance (projector-friendly)
- [ ] Curriculum-aligned language

#### Visual Learner (v)
- [ ] Visual preview/demo immediately visible
- [ ] Colors/shapes organize information
- [ ] Instant visual feedback on actions
- [ ] Grid/pattern-based interface
- [ ] Minimal text (show, don't tell)
- [ ] Interactive elements obvious

#### Producer (p)
- [ ] Export/integration options visible early
- [ ] MIDI controller support mentioned
- [ ] Keyboard shortcuts available
- [ ] Technical specs provided (latency, sample rate)
- [ ] Advanced features not hidden
- [ ] Desktop-optimized interface

### Common Friction Points by Persona

| **Friction Type** | **Musician** | **Educator** | **Visual Learner** | **Producer** |
|-------------------|--------------|--------------|-------------------|--------------|
| Too many steps | CRITICAL | MAJOR | CRITICAL | MINOR |
| Technical jargon | CRITICAL | MINOR | MAJOR | PASS (expected) |
| Account required | MAJOR | CRITICAL | MAJOR | MINOR |
| No visual feedback | MAJOR | MINOR | CRITICAL | MINOR |
| Can't export | MINOR | MINOR | MINOR | CRITICAL |
| Slow setup | CRITICAL | MAJOR | MAJOR | MINOR |

---

## Issue Severity Classification

### CRITICAL
- Blocks persona from achieving primary goal
- Triggers persona bailout condition
- Causes immediate abandonment
- **Example**: Musician sees "Configure MIDI settings" before jamming

### MAJOR
- Significantly degrades experience
- Causes frustration but not immediate bailout
- High effort required to overcome
- **Example**: CTA button too small (38px) on mobile

### MINOR
- Noticeable but doesn't block progress
- Slight inconvenience
- Polish issue more than functionality
- **Example**: Paragraph spacing inconsistent (20px vs 24px)

---

## Screenshot Annotation Guide

### Visual Markup Elements

1. **Red Box**: CRITICAL issue
2. **Orange Box**: MAJOR issue
3. **Yellow Box**: MINOR issue
4. **Green Arrow**: Good example (PASS)
5. **Numbers**: Sequential attention flow (1 → 2 → 3)
6. **Text Callouts**: Specific issue description

### Annotation Template

```
[RED BOX around element]
❌ CRITICAL: [Category] - [Issue Description]
Persona Voice: "[Quote in their words]"
Fix: [Specific action to take]
```

**Example:**
```
[RED BOX around "Configure MIDI Input" heading]
❌ CRITICAL: Cognitive Load + Persona Friction
Persona Voice (Musician): "MIDI? I just want to play! This is too technical."
Fix: Change to "Connect Your Keyboard (Optional)" with visual preview
```

---

## Scoring Summary Formula

### Per-Screenshot Score

```
Base = 100 points
For each issue found:
  - CRITICAL: -20 points
  - MAJOR: -10 points
  - MINOR: -2 points

Category-specific multipliers:
  - Emotional Response FAIL: ×1.5 (engagement is critical)
  - Persona Friction FAIL: ×1.25 (persona-specific failure)

Min score = 0
Max score = 100
```

### Overall Flow Score

```
Average all screenshot scores
Apply persona completion multiplier:
  - Can complete primary goal: ×1.0
  - Can complete with effort: ×0.75
  - Cannot complete goal: ×0.5

Final Score = (Average Screenshot Score) × (Completion Multiplier)
```

### Gate Decision Mapping

```
Score ≥ 80: PASS
Score 60-79: CONCERNS
Score < 60: FAIL

Override rules:
  - Any Emotional Response FAIL → FAIL (regardless of score)
  - Cannot complete primary goal → FAIL (regardless of score)
  - ≥3 CRITICAL issues → FAIL
```

---

## Quick Reference Checklist

Print this for each screenshot review:

```
Screenshot: _______________  Persona: _______________

[ ] 1. HIERARCHY: Primary CTA obvious? Text flow clear?
[ ] 2. LAYOUT: Aligned? Spaced well? Mobile works?
[ ] 3. COGNITIVE: Scannable? Clear choices? No jargon?
[ ] 4. EMOTIONAL: Right tone? Builds trust? Engaging?
[ ] 5. FRICTION: Supports goal? Matches expectations? No bailouts?

Issues Found:
[ ] CRITICAL: _______________________________
[ ] MAJOR: _______________________________
[ ] MINOR: _______________________________

Persona Voice: "_______________________________"

Score: ___/100
```
