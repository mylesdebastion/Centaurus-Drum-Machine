# Story 22.1: Multi-Path Onboarding System

**Epic**: Epic 22 - AI-Native Product-Led Growth
**Status**: ✅ Completed (2025-10-25)
**Estimated Effort**: 3-4 hours
**Actual Effort**: 3 hours

---

## Goal

Build personalized onboarding tutorials that demonstrate value in 30-60 seconds, routed via discrete URL codes (`?v=m/e/v/p`).

---

## Deliverables

### ✅ Completed

1. **Persona Code System** (`src/utils/personaCodes.ts`)
   - Type-safe persona codes: `m`, `d`, `e`, `v`, `p`, `i`
   - URL parameter parsing (`?v=e` → Educator persona)
   - Referral code tracking (`?r=hash`)
   - Onboarding completion tracking (localStorage)
   - Analytics event tracking (Story 22.3 will consume)

2. **OnboardingRouter** (`src/components/Onboarding/OnboardingRouter.tsx`)
   - Routes based on `?v=` parameter
   - Redirects returning users to `/studio`
   - Falls back to `PersonaSelector` if no param

3. **PersonaSelector** (`src/components/Onboarding/PersonaSelector.tsx`)
   - 4 persona cards (Week 1 launch)
   - Musician (m), Educator (e), Visual Learner (v), Producer (p)
   - Gradient-styled cards with icons
   - Link to `/playground` for power users

4. **Tutorial Components**
   - `MusicianTutorial.tsx` - Drum Machine focus (30s tutorial)
   - `EducatorTutorial.tsx` - Chord Arranger + Jam Sessions (45s tutorial)
   - `VisualLearnerTutorial.tsx` - Piano Roll with color modes (30s tutorial)
   - `ProducerTutorial.tsx` - Studio modular system + MIDI (45s tutorial)

5. **Routing Changes** (`src/App.tsx`)
   - `/` → `OnboardingRouter` (new users see persona selector)
   - `/playground` → `WelcomeScreen` (experiment browser moved)
   - All direct routes unchanged (`/studio`, `/piano`, `/jam`, etc.)

---

## User Flows

### New User (No URL Param)

```
jam.audiolux.app
  ↓
OnboardingRouter
  ↓
PersonaSelector (4 cards)
  ↓ (user selects "Educator")
Navigate to /?v=e
  ↓
OnboardingRouter
  ↓
EducatorTutorial (3 steps, 45s)
  ↓ (user completes)
Navigate to /studio
```

### New User with Persona URL

```
jam.audiolux.app?v=e&r=se8a
  ↓
OnboardingRouter
  ↓
Track referral (se8a) + persona (e)
  ↓
EducatorTutorial (starts immediately)
  ↓ (user completes)
Navigate to /studio
```

### Returning User

```
jam.audiolux.app
  ↓
OnboardingRouter
  ↓
Check localStorage: hasCompletedOnboarding = true
  ↓
Navigate to /studio (skip onboarding)
```

### Power User / Developer

```
jam.audiolux.app/playground
  ↓
WelcomeScreen (experiment browser)
  ↓
All 16+ experiments available
```

---

## Technical Implementation

### Persona Code System

```typescript
// src/utils/personaCodes.ts

export type PersonaCode = 'm' | 'd' | 'e' | 'v' | 'p' | 'i';

export const PERSONAS: Record<PersonaCode, PersonaConfig> = {
  m: { title: 'Musician', tutorialModule: 'drum-machine', ... },
  e: { title: 'Educator', tutorialModule: 'chord-arranger', ... },
  v: { title: 'Visual Learner', tutorialModule: 'piano-roll', ... },
  p: { title: 'Producer', tutorialModule: 'studio-modules', ... },
  // d (Deaf/HOH) and i (Enterprise) - Week 2/3
};

// Parse URL params
getPersonaFromURL(searchParams) → PersonaCode | null
getReferralFromURL(searchParams) → string | null

// Track analytics (Story 22.3 will consume)
trackPersonaEvent('tutorial_started', 'e', { referral: 'se8a' })
trackPersonaEvent('tutorial_completed', 'e')

// Onboarding completion
setOnboardingCompleted('e') → localStorage
hasCompletedOnboarding() → boolean
```

### Tutorial Structure

Each tutorial follows 4-step pattern:

**Step 0: Welcome**
- Persona-specific greeting
- Value proposition (30-60s estimate)
- "Start Tutorial" CTA

**Step 1: Feature Overview**
- What the tool does
- Why it's useful for this persona
- Key capabilities

**Step 2: How It Works**
- Step-by-step instructions
- Visual examples
- Pro tips

**Step 3: Completion + CTA**
- Celebration (checkmark icon)
- Next steps
- Primary CTA (navigate to feature)

### Analytics Events (Story 22.3)

```typescript
// Tracked events (stored in localStorage for now)
trackPersonaEvent('tutorial_started', 'm')
trackPersonaEvent('tutorial_completed', 'm')
trackPersonaEvent('share_clicked', 'm')
trackPersonaEvent('converted_to_pro', 'm')

// Storage format
{
  event: 'tutorial_completed',
  persona: 'm',
  timestamp: '2025-10-25T12:34:56Z',
  referral: 'se8a' // optional
}
```

---

## Acceptance Criteria

### ✅ Verified

- [x] User lands on `jam.audiolux.app?v=e` → sees Educator tutorial (no selector)
- [x] User lands on `jam.audiolux.app` (no code) → sees PersonaSelector
- [x] Tutorial completion triggers localStorage flag
- [x] All 4 tutorials complete in <60 seconds
- [x] Returning users redirect to `/studio`
- [x] `/playground` shows WelcomeScreen (experiment browser)
- [x] All direct routes still work (`/studio`, `/piano`, `/jam`, etc.)
- [x] TypeScript compiles with no errors
- [x] Production build succeeds

---

## Manual Verification Steps

### Test 1: Persona Selector (New User)

1. Clear localStorage: `localStorage.clear()`
2. Navigate to `http://localhost:5173/`
3. **Expected**: PersonaSelector shows 4 cards
4. Click "Musician" card
5. **Expected**: URL changes to `/?v=m`, MusicianTutorial loads
6. Click through tutorial steps (3 steps)
7. **Expected**: "Launch Studio" button appears
8. Click "Launch Studio"
9. **Expected**: Navigate to `/studio`, localStorage has `audiolux_onboarding_completed=true`

### Test 2: Direct Persona URL

1. Clear localStorage
2. Navigate to `http://localhost:5173/?v=e`
3. **Expected**: EducatorTutorial loads immediately (no PersonaSelector)
4. Complete tutorial
5. **Expected**: Navigate to `/studio`

### Test 3: Returning User

1. Complete any tutorial (localStorage flag set)
2. Navigate to `http://localhost:5173/`
3. **Expected**: Immediate redirect to `/studio` (skip onboarding)

### Test 4: Playground Route

1. Navigate to `http://localhost:5173/playground`
2. **Expected**: WelcomeScreen loads (experiment browser)
3. All 16+ experiment buttons visible
4. Click "Music Studio"
5. **Expected**: Navigate to `/studio`

### Test 5: Referral Tracking

1. Clear localStorage
2. Navigate to `http://localhost:5173/?v=e&r=se8a`
3. Open DevTools Console
4. **Expected**: Log shows `[Persona Analytics] { event: 'tutorial_started', persona: 'e', referral: 'se8a' }`
5. Check localStorage: `audiolux_persona_analytics`
6. **Expected**: Array contains event object

---

## Files Changed

### Created

- `src/utils/personaCodes.ts` (164 lines)
- `src/components/Onboarding/OnboardingRouter.tsx` (45 lines)
- `src/components/Onboarding/PersonaSelector.tsx` (113 lines)
- `src/components/Onboarding/tutorials/MusicianTutorial.tsx` (204 lines)
- `src/components/Onboarding/tutorials/EducatorTutorial.tsx` (272 lines)
- `src/components/Onboarding/tutorials/VisualLearnerTutorial.tsx` (257 lines)
- `src/components/Onboarding/tutorials/ProducerTutorial.tsx` (282 lines)

### Modified

- `src/App.tsx` (routing changes)
  - Import `OnboardingRouter`
  - Route `/` → `OnboardingRouter`
  - Route `/playground` → `WelcomeScreen`

---

## Next Steps

1. **Story 22.2**: AI Outreach Message Generator (Python CLI tool)
2. **Story 22.3**: Referral Attribution & Analytics (consume tracked events)
3. **Story 22.4**: Viral Loop Triggers (share modals post-tutorial)

---

## Notes

- **Week 1 Launch**: 4 personas (m, e, v, p) are production-ready
- **Week 2/3**: Deaf/HOH (d) and Enterprise (i) personas will be added after building accessibility features
- **Analytics**: Events tracked to localStorage for now, Story 22.3 will build dashboard
- **Share URLs**: `buildShareURL()` function ready for Story 22.4 (viral loops)

---

**Completion Date**: 2025-10-25
**Developer**: Solo Dev + BMad Orchestrator (Party Mode)
**Build Status**: ✅ TypeScript clean, production build succeeds
