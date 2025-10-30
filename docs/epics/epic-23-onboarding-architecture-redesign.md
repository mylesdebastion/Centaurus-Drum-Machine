# Epic 23: Onboarding Architecture Redesign - Studio Presets + Gradual Interface Reveal

**Status**: 🎯 Proposed - High Priority
**Created**: 2025-10-25
**Timeline**: 1 work session (4-6 hours)
**Owner**: Solo Dev + AI Assist
**Replaces**: Epic 22 persona tutorial approach (Stories 22.5-22.8 archived)

---

## Epic Vision

**Problem**: Current Epic 22 onboarding approach has fundamental flaws:
- ❌ **Persona tutorials are sparse** - Fail to convey value proposition or how app works
- ❌ **Disconnected from actual product** - `/playground` shows full breadth, onboarding shows basics
- ❌ **Overselling features we don't have** - Producer/Enterprise personas market vaporware
- ❌ **Monetization gap** - "No one pays $199 for basic visualizer shown in onboarding"
- ❌ **Separate tutorial flows** - Creates maintenance burden, doesn't teach actual interface

**Solution**: Reconceptualize onboarding as **Studio presets + gradual interface reveal**:
1. Onboarding views ARE `/studio` with **preset configurations** for different use cases
2. Guided tour **gradually reveals interface elements** over 2-3 steps
3. User **interacts with ACTUAL interface**, learning by doing
4. **No separate tutorial code** - Just highlight + encourage interaction with real Studio
5. **Shows full feature breadth** by starting from actual production environment

**Philosophy**: "Learn by interacting with the real thing" not "watch a separate demo then figure out the real app"

---

## Reality Check: What Actually Works vs. What's Vaporware

### ✅ Ready for Onboarding TODAY (Existing Features)

**Musician Use Case** - `/studio?preset=musician`
- ✅ Drum Machine (16-step sequencer)
- ✅ Tempo/playback controls
- ✅ Multiple sounds (kick, snare, hi-hat, clap, tom, etc.)
- ✅ Pattern creation/editing
- ✅ Real-time audio playback
- **Gradual Reveal**: Step 1 → Highlight drum grid, Step 2 → Highlight playback, Step 3 → Done

**Visual Learner Use Case** - `/studio?preset=visual-learner`
- ✅ Piano Roll interface
- ✅ Color modes (Rainbow, Scale Degrees, Chord Tones)
- ✅ Visual pattern display
- ✅ Grid-based music creation
- **Gradual Reveal**: Step 1 → Show color modes, Step 2 → Click notes, Step 3 → Play

**Educator Use Case** - `/studio?preset=educator`
- ✅ Jam Session (collaboration)
- ✅ Share session codes
- ✅ Multi-user sync
- ✅ Simple interface for teaching
- **Gradual Reveal**: Step 1 → Create session, Step 2 → Share code, Step 3 → Explain modules

### ❌ NOT Ready (Vaporware - Don't Market Yet)

**Producer Use Case** - BLOCKED
- ❌ No MIDI/WAV export functionality
- ❌ No advanced modules (synths, effects, samplers)
- ❌ No automation
- ❌ Latency/audio quality specs not documented
- **Action**: Remove Producer persona from launch until features exist

**Enterprise Use Case** - BLOCKED
- ❌ No admin dashboard
- ❌ No multi-seat licensing
- ❌ No usage analytics
- ❌ No pricing tiers ($199-$999 don't exist)
- **Action**: Remove Enterprise persona from launch until B2B infrastructure built

**Deaf/HOH Use Case** - PARTIALLY READY
- ✅ Visual feedback exists (grid lights up, colors)
- ⚠️ Some audio-only cues (play button sound)
- ❌ No WCAG compliance testing
- **Action**: Test with Deaf users before marketing as accessible

---

## Revised Onboarding Architecture

### Current Epic 22 Approach (REJECTED)

```
PersonaSelector → Separate Tutorial Flow (sparse, disconnected) → Studio
```

**Problems:**
- Tutorial doesn't teach actual interface
- Maintenance burden (6 separate tutorial flows)
- Disconnected from real product experience
- Oversells features we don't have

### New Epic 23 Approach (PROPOSED)

```
PersonaSelector → Studio (preset configuration) + Gradual Reveal (2-3 steps)
```

**How It Works:**

1. **User selects persona** (or lands with `?v=m` URL code)
2. **Studio loads with preset** - `/studio?preset=musician&tour=true`
   - Musician: Drum Machine visible, other modules minimized
   - Visual Learner: Piano Roll visible, color mode selector open
   - Educator: Jam Session visible, share button highlighted
3. **Gradual reveal overlays** (2-3 steps max):
   - Step 1: Highlight primary interaction ("Click here to add beats")
   - Step 2: Encourage action ("Try it! Click 4 boxes to create a pattern")
   - Step 3: Celebrate + reveal next feature ("Great! Now press Play ▶")
4. **User completes tour in actual Studio** - No transition to separate environment
5. **Tour overlay fades** - User is already in Studio, ready to create

### Implementation Strategy

**No New Components Needed** (Reuse existing Studio):
- ✅ Studio component already exists (`/src/components/Studio`)
- ✅ Modules already exist (Drum Machine, Piano Roll, etc.)
- ✅ Routing already works (`/studio`)

**What's New** (Minimal dev work):
1. **Preset configurations** (`/src/config/studioPresets.ts`):
   ```typescript
   export const presets = {
     musician: {
       activeModules: ['drum-machine'],
       highlightElements: ['sequencer-grid', 'playback-controls'],
       tourSteps: [...]
     },
     visualLearner: {
       activeModules: ['piano-roll'],
       highlightElements: ['color-mode-selector', 'piano-grid'],
       tourSteps: [...]
     },
     educator: {
       activeModules: ['jam-session'],
       highlightElements: ['create-session-button', 'share-code'],
       tourSteps: [...]
     }
   };
   ```

2. **Tour overlay component** (`<StudioTourOverlay>`):
   - Highlights specific DOM elements (via CSS selectors or refs)
   - Shows tooltip with instruction ("Click here to...")
   - Advances on user action OR manual "Next" button
   - Dismissible (X button or "Skip tour")
   - Saves `hasCompletedTour=true` to localStorage

3. **URL parameter handling**:
   - `?preset=musician` → Load preset configuration
   - `?tour=true` → Show tour overlay
   - Combined: `?preset=musician&tour=true`

**Total Dev Effort**: 4-6 hours (vs. 14-19 hours for Epic 22 full build)

---

## Benefits of New Approach

### For Users

✅ **Learn actual interface** - Not a separate demo, the real thing
✅ **No transition confusion** - Already in Studio when tour ends
✅ **Faster to value** - Interact with real tool in <30 seconds
✅ **See full product** - Studio shows all modules, not just tutorial subset
✅ **Persistent progress** - Work created during tour is real, can continue

### For Developers

✅ **No duplicate code** - Reuse existing Studio components
✅ **Easy maintenance** - One interface, multiple presets
✅ **Faster iteration** - Change preset config, not rebuild tutorial
✅ **Scalable** - Add new personas by adding preset configs
✅ **Testable** - Test Studio once, presets are just configurations

### For Business

✅ **Shows full value** - Modules visible in sidebar, user can explore
✅ **Honest marketing** - Only show personas for features that exist
✅ **Higher conversion** - User already creating in real tool
✅ **Reduced bounce** - No "Where do I go after tutorial?" confusion

---

## Persona Readiness Matrix (Realistic Assessment)

| Persona | Status | Reasoning | Launch Timeline |
|---------|--------|-----------|-----------------|
| **Musician (m)** | ✅ READY | Drum Machine works, fun, complete | Week 1 |
| **Visual Learner (v)** | ✅ READY | Piano Roll + color modes work | Week 1 |
| **Educator (e)** | ✅ READY | Jam Session works, collaboration proven | Week 1 |
| **Deaf/HOH (d)** | ⚠️ TEST FIRST | Visual feedback exists but not validated | Week 2 (after testing) |
| **Producer (p)** | ❌ BLOCKED | No export, no advanced modules | Post-Epic 24 (export feature) |
| **Enterprise (i)** | ❌ BLOCKED | No B2B infrastructure | Post-Epic 25 (admin dashboard) |

**Revised Launch**: **3 personas Week 1** (Musician, Visual Learner, Educator) → Proven features only

---

## Monetization Strategy (Honest Assessment)

### Current Reality

**What users see in onboarding:**
- Basic drum sequencer (16 steps)
- Simple color modes
- Minimal collaboration

**What users get in actual product (/studio or /playground):**
- 6+ production modules (Drum Machine, Piano Roll, Chord Arranger, Melody Sequencer, Sample Pad, Music Header)
- MIDI controller integration
- Real-time collaboration
- Hardware integration (WLED)
- Multiple instruments/sounds
- Modular architecture

### Pricing Reality Check

**User is RIGHT**: "No one pays $199 for basic visualizer"

**BUT**: People WILL pay for:
- ✅ **Accessible music creation** (schools need this, budgets exist)
- ✅ **Collaborative tools** (music teachers pay for classroom tech)
- ✅ **Browser-based DAW** (producers pay for portability IF export works)
- ✅ **MIDI integration** (musicians pay for no-install solutions)

**Revised Pricing (Post-Epic 23)**:
- **Free Tier**: Full Studio access, 3 saved projects, collaboration limited to 2 users
- **Pro Tier ($10/mo)**: Unlimited projects, 10-user collaboration, MIDI export (when ready)
- **Educator Tier ($5/mo)**: Same as Pro but edu discount
- **Enterprise Tier**: Post-Epic 25 (admin dashboard required)

---

## Epic 23 Stories (Minimal, Focused)

### Story 23.1: Studio Preset System (2-3 hours)

**Acceptance Criteria:**
- [ ] Create `/src/config/studioPresets.ts` with 3 preset configs (musician, visual-learner, educator)
- [ ] Studio component accepts `?preset={name}` URL parameter
- [ ] Preset loads appropriate modules and initial state
- [ ] Preset configs define `activeModules`, `highlightElements`, `initialState`
- [ ] Default preset (no param) loads full Studio (existing behavior)

**Technical Notes:**
- Reuse existing Studio component
- Presets are configuration objects, not new components
- URL parsing in `<Studio>` component `useEffect`

---

### Story 23.2: Gradual Interface Reveal Tour (2-3 hours)

**Acceptance Criteria:**
- [ ] Create `<StudioTourOverlay>` component
- [ ] Tour accepts `steps` array from preset config
- [ ] Each step highlights DOM element (via selector or ref) with spotlight effect
- [ ] Tooltip shows instruction ("Click here to add beats")
- [ ] User action (or Next button) advances to next step
- [ ] Tour is dismissible (X button, Skip link)
- [ ] Completion saves `hasCompletedTour_{preset}=true` to localStorage
- [ ] Tour only shows once per preset (unless cleared)

**Technical Notes:**
- Use `react-joyride` or build lightweight spotlight component
- Highlight elements via CSS `::before` pseudo-element with border
- Detect user action via event listeners (click, keydown)

---

### Story 23.3: Persona Selector → Preset Routing (1 hour)

**Acceptance Criteria:**
- [ ] PersonaSelector component routes to Studio with preset
- [ ] Musician card → `/studio?preset=musician&tour=true`
- [ ] Visual Learner card → `/studio?preset=visual-learner&tour=true`
- [ ] Educator card → `/studio?preset=educator&tour=true`
- [ ] URL codes work: `?v=m` → `/studio?preset=musician&tour=true`
- [ ] "Just exploring" skips tour → `/studio` (no preset)

**Technical Notes:**
- Modify PersonaSelector onClick handlers
- Map persona codes to preset names

---

### Story 23.4: Archive Producer/Enterprise Personas (15 min)

**Acceptance Criteria:**
- [ ] Remove Producer card from PersonaSelector
- [ ] Remove Enterprise card from PersonaSelector
- [ ] Document why in `docs/personas/READINESS.md`
- [ ] Create backlog items for when features exist:
  - Epic 24: Producer Export Feature (enables Producer persona)
  - Epic 25: Admin Dashboard (enables Enterprise persona)

**Technical Notes:**
- Just hide UI, keep persona docs for future reference

---

## Success Criteria

### Week 1 (Post-Epic 23 Launch)

**Onboarding Metrics:**
- ✅ **50%+ tour completion rate** (users finish 2-3 step tour)
- ✅ **30%+ create during tour** (user adds beats/notes in Studio while tour running)
- ✅ **70%+ continue after tour** (user keeps creating after tour ends)
- ✅ **<10% "Where do I go?" confusion** (user already in Studio, no transition)

**Engagement Metrics:**
- ✅ **40%+ session share rate** (Educator/Musician personas use jam sessions)
- ✅ **60%+ return next day** (user bookmarks `/studio`, comes back)
- ✅ **3+ modules explored per session** (sidebar visibility drives discovery)

### Month 1 (Post-Epic 23 Iteration)

**User Growth:**
- ✅ **100+ users** (from 3 ready personas only, realistic)
- ✅ **k ≥ 1.2 viral coefficient** (each user brings 1.2 more)
- ✅ **20%+ Pro conversion** (from users who hit 3-project limit)

**Product Validation:**
- ✅ **70%+ positive feedback** ("This is way easier than Ableton!")
- ✅ **Educator adoption** (3+ teachers using in classroom)
- ✅ **User-generated content** (projects shared on social media)

---

## Migration from Epic 22

### What to Keep from Epic 22

✅ **Story 22.1** - Multi-Path Onboarding System (PersonaSelector)
✅ **Story 22.2** - Routing strategy (`/` → onboarding, `/playground` → experiments)
✅ **Story 22.3** - Viral loops (jam session sharing)
✅ **Story 22.4** - Analytics/tracking

### What to Archive from Epic 22

❌ **Story 22.5-22.7** (Old versions) - Reusable components, Enterprise sales, Accessibility audit
  - **Reason**: Over-engineered for features that don't exist yet
  - **Action**: Moved to `docs/stories/archived-2025-10-25/`

❌ **Story 22.5-22.7** (New QA-driven versions) - Visual demos, Producer fixes
  - **Reason**: Assume features exist (export, tech specs) when they don't
  - **Action**: Mark as BLOCKED until Epic 24 (Producer Export) is built

❌ **Story 22.8** - Educator Tutorial UX Improvements
  - **Reason**: Replaced by preset + tour approach
  - **Action**: Archived

### What to Build Next (Epic 24-25)

**Epic 24: Producer Export Feature** (enables Producer persona)
- MIDI export
- WAV export (stems)
- Project download
- Desktop DAW integration docs

**Epic 25: Admin Dashboard** (enables Enterprise persona)
- Multi-seat licensing
- Team management
- Usage analytics
- B2B pricing tiers

---

## Implementation Timeline

### Week 1 (Epic 23 Core)
- **Day 1**: Story 23.1 - Preset system (2-3h)
- **Day 2**: Story 23.2 - Tour overlay (2-3h)
- **Day 3**: Story 23.3 - Routing + Story 23.4 - Archive personas (1.5h)
- **Day 4**: Testing, polish, launch

**Total**: 4-6 hours dev + 1 day testing = 1 week

### Week 2 (Validation + Iteration)
- Monitor metrics (completion rate, engagement)
- Iterate tour steps based on drop-off points
- A/B test preset configurations
- Gather user feedback

### Month 2+ (Unlock Blocked Personas)
- Epic 24 (Producer export) → Re-enable Producer persona
- Epic 25 (Admin dashboard) → Re-enable Enterprise persona
- Test Deaf/HOH persona with real users

---

## Risk Assessment

### High Risk (Mitigated)

**Risk**: Users don't complete tour
- **Likelihood**: Medium
- **Mitigation**: Make tour 2-3 steps max, highly interactive
- **Mitigation**: Tour is optional (Skip button)
- **Mitigation**: Track drop-off, iterate on messaging

**Risk**: Presets feel limiting
- **Likelihood**: Low
- **Mitigation**: Sidebar shows all modules, user can explore
- **Mitigation**: Tour ends with "Explore other modules!" CTA
- **Mitigation**: "Just exploring" option skips preset entirely

### Medium Risk

**Risk**: Studio complexity overwhelms new users
- **Likelihood**: Medium
- **Mitigation**: Preset hides non-essential modules initially
- **Mitigation**: Tour highlights only 1-2 elements per step
- **Mitigation**: Progressive disclosure (modules revealed gradually)

**Risk**: Monetization doesn't work with only 3 personas
- **Likelihood**: Low
- **Mitigation**: Educator persona is high-conversion target (teachers pay for tools)
- **Mitigation**: Free tier drives growth, Pro tier converts 20%+
- **Mitigation**: Producer/Enterprise unlock later when features ready

### Low Risk

**Risk**: Tour overlay has bugs
- **Likelihood**: Low
- **Mitigation**: Use battle-tested library (`react-joyride`) or simple CSS
- **Mitigation**: Extensive testing before launch
- **Mitigation**: Dismissible if broken (Skip button)

---

## Why This Beats Epic 22

| Aspect | Epic 22 (Rejected) | Epic 23 (Proposed) |
|--------|-------------------|-------------------|
| **Dev Effort** | 14-19 hours | 4-6 hours |
| **Code Maintenance** | 6 separate tutorial flows | 1 Studio + preset configs |
| **User Experience** | Sparse tutorial → Separate Studio | Interactive tour IN Studio |
| **Feature Honesty** | Markets Producer/Enterprise vaporware | Only shows ready personas |
| **Monetization** | Oversells basic features | Shows full Studio breadth |
| **Time to Value** | Tutorial → Studio transition | Immediate Studio interaction |
| **Scalability** | Add persona = rebuild tutorial | Add persona = add preset config |

---

## Next Actions (YOLO Mode)

1. ✅ **Archive unrealistic stories** - Done (22.5-22.8 old versions moved)
2. ✅ **Document persona readiness** - Done (this epic)
3. ⏳ **Create Story 23.1-23.4** - Ready to implement
4. ⏳ **Update Epic 22** - Mark Producer/Enterprise as BLOCKED
5. ⏳ **Communicate to stakeholders** - "We're pivoting to realistic approach"

---

**Epic 23 Status**: READY TO IMPLEMENT 🚀

**Estimated Launch**: Week 1 (4-6 hours dev)

**Expected Outcome**: Honest, scalable onboarding that teaches real interface and doesn't oversell vaporware.
