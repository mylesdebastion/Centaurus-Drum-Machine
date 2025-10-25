# Story 22.4: Viral Loop Triggers

**Epic**: Epic 22 - AI-Native Product-Led Growth
**Status**: ✅ Component Ready (2025-10-25) - Integration Pending
**Estimated Effort**: 1 hour
**Actual Effort**: 1 hour (component creation)

---

## Goal

Add share prompts after key activation moments (tutorial completion, first session created) with persona-specific messaging to drive viral coefficient k > 1.3.

---

## Deliverables

### ✅ Completed

1. **ShareSessionModal Component** (`src/components/Onboarding/ShareSessionModal.tsx`)
   - Persona-specific share copy (6 personas)
   - Quick share buttons (WhatsApp, Email, Discord, Copy Link)
   - Referral URL generation with user hash
   - Gamification (share count badge, "Community Builder" award at 3+ shares)
   - Analytics tracking integration (Story 22.3)

### ⏳ Pending Integration

- Tutorial components integration (show modal after completion)
- Jam Session integration (show modal after creating first session)
- Studio integration (show modal after milestone achievements)

---

## Technical Implementation

### ShareSessionModal Component

```typescript
interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaOverride?: PersonaCode; // Optional: specify persona
}

// Features:
- Persona-specific share messages
- User's referral URL (jam.audiolux.app?v=m&r=hash)
- Quick share buttons (WhatsApp, Email, Discord, Copy)
- Share count tracking (gamification)
- Analytics event tracking (share_clicked)
```

### Persona-Specific Share Messages

| Persona | Heading | Message Template |
|---------|---------|------------------|
| Musician (m) | "Share with fellow musicians" | "Check out this browser-based music creation tool..." |
| Deaf/HOH (d) | "Share this accessible music tool" | "Found an amazing visual music tool - no hearing required!..." |
| Educator (e) | "Invite your students" | "I'm using this visual music teaching tool in my classroom!..." |
| Visual Learner (v) | "Share with visual learners" | "This visual music tool makes learning so much easier!..." |
| Producer (p) | "Share with producers" | "Portable browser DAW with MIDI support - pretty powerful!..." |
| Enterprise (i) | "Share with institutions" | "Scalable accessible music education platform for schools..." |

### Share Buttons

**WhatsApp:**
- Opens `https://wa.me/?text=[encoded message]`
- Pre-fills share message with URL
- Tracks `share_clicked` event with platform metadata

**Email:**
- Opens `mailto:?subject=Check out Audiolux!&body=[encoded message]`
- Pre-fills subject and body
- Tracks analytics event

**Discord:**
- Copies message to clipboard
- Shows "Paste into Discord" alert
- Tracks analytics event

**Copy Link:**
- Copies URL to clipboard
- Shows "Copied!" confirmation (2s)
- Tracks analytics event

### Gamification System

**Share Count:**
- Counts `share_clicked` events from localStorage
- Shows: "🌟 You've shared 3 times!"

**Community Builder Badge:**
- Unlocked at 3+ shares
- Display: "🏆 Community Builder - You've shared with 3 people! Keep spreading the music love."

---

## Integration Points

### Tutorial Completion (Recommended)

```typescript
// In MusicianTutorial.tsx (and others)
import { ShareSessionModal } from '../ShareSessionModal';

const [showShareModal, setShowShareModal] = useState(false);

const handleComplete = () => {
  trackPersonaEvent('tutorial_completed', 'm');
  setOnboardingCompleted('m');
  setShowShareModal(true); // Show modal BEFORE navigating
};

const handleShareClose = () => {
  setShowShareModal(false);
  navigate('/studio'); // Navigate after modal closes
};

return (
  <>
    {tutorialContent}
    <ShareSessionModal
      isOpen={showShareModal}
      onClose={handleShareClose}
      personaOverride="m"
    />
  </>
);
```

### Jam Session Creation (Future)

```typescript
// In JamSession.tsx
const handleCreateSession = async () => {
  const roomCode = await createSession();
  setShowShareModal(true); // Invite friends to join!
};
```

### Milestone Achievements (Future)

```typescript
// Trigger share modal on:
- First project saved
- 10 beats created
- 100 notes played
- Pro subscription purchased
```

---

## Acceptance Criteria

### ✅ Component Completed

- [x] ShareSessionModal component created
- [x] Persona-specific share messages (6 personas)
- [x] Quick share buttons (WhatsApp, Email, Discord, Copy)
- [x] Referral URL generation (jam.audiolux.app?v=m&r=hash)
- [x] Analytics tracking (`share_clicked` event)
- [x] Gamification (share count, Community Builder badge)
- [x] TypeScript types defined
- [x] Responsive design (mobile-first)

### ⏳ Integration Pending

- [ ] Tutorial components show modal after completion
- [ ] Jam Session shows modal after creation
- [ ] Studio shows modal on milestones

---

## Manual Verification Steps

### Test 1: Modal Display

1. Import and use `<ShareSessionModal isOpen={true} onClose={...} personaOverride="m" />`
2. **Expected**: Modal appears with Musician-specific copy
3. Click "Copy Link" button
4. **Expected**: URL copied, shows "Copied!" confirmation

### Test 2: Share Buttons

1. Click "WhatsApp" button
2. **Expected**: Opens WhatsApp with pre-filled message
3. Check DevTools Console
4. **Expected**: `[Referral Analytics] { event: 'share_clicked', platform: 'WhatsApp' }`

### Test 3: Gamification

1. Click share buttons 3 times
2. Re-open modal
3. **Expected**: Shows "🌟 You've shared 3 times!"
4. **Expected**: Shows "🏆 Community Builder" badge

### Test 4: Persona Switching

1. Open modal with `personaOverride="e"` (Educator)
2. **Expected**: Shows "Invite your students" heading
3. **Expected**: Share message mentions classroom use

---

## Files Changed

### Created

- `src/components/Onboarding/ShareSessionModal.tsx` (224 lines) - Main component

### Modified

- None (component ready for integration)

---

## Integration Roadmap

### Phase 1: Tutorial Completion (Week 1)
- Update 4 tutorial components (Musician, Educator, Visual Learner, Producer)
- Show modal after "Launch Studio" button clicked
- Expected: 40%+ share rate (users invited immediately after tutorial)

### Phase 2: Jam Session Creation (Week 2)
- Show modal after creating room code
- Message: "Invite friends to join [room code]"
- Expected: 60%+ share rate (need collaborators to jam)

### Phase 3: Milestones (Week 3-4)
- First project saved
- 10 beats created
- 100 notes played
- Expected: 20%+ share rate (organic sharing after value delivered)

---

## Expected Impact

### Viral Coefficient Boost

**Without Share Modals (Baseline):**
- 30% share rate (users manually copy URLs)
- 3.0 invites average per sharer
- k = 0.3 × 3.0 = **0.9** (sub-viral)

**With Share Modals (Target):**
- 40% share rate (+10% from prompts)
- 3.25 invites average (+0.25 from quick sharing)
- k = 0.4 × 3.25 = **1.3** (viral!)

**Result:** 130% growth per generation vs. 90% (self-sustaining vs. decay)

---

## Next Steps

1. **Week 1**: Integrate into 4 tutorial components
2. **Week 2**: Integrate into Jam Session creation flow
3. **Week 3**: Add milestone triggers
4. **Week 4**: Measure k coefficient, adjust messaging

---

## Notes

- **Component is production-ready** - fully functional, just needs integration
- **Zero backend required** - localStorage + clipboard API
- **Mobile-optimized** - Quick share buttons perfect for mobile users
- **Privacy-friendly** - All tracking client-side
- **A/B testable** - Can test different share messages easily

---

**Completion Date**: 2025-10-25 (Component)
**Integration Target**: Week 1-2 (Tutorial completion flows)
**Developer**: Solo Dev + BMad Orchestrator (Party Mode)
**Build Status**: ✅ Component ready, integration pending
