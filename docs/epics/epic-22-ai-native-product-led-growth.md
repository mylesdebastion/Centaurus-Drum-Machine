# Epic 22: AI-Native Product-Led Growth Flywheel

**Status**: 🚀 Active - Highest Priority
**Created**: 2025-10-25
**Timeline**: 6-8 hours upfront build → Self-sustaining growth
**Owner**: Solo Dev + AI Assist

---

## Epic Vision

**Problem**: Traditional marketing (Epic 21) requires 60-70 hours upfront + 30 min/day ongoing grind, yielding maybe 100 users in 90 days.

**Solution**: Build marketing INTO the product. Interactive onboarding that demonstrates value in 30 seconds, personalized to 6 user personas with reusable components, with viral loops that create exponential growth (k=1.3-1.5 viral coefficient).

**Result**: 160+ users in 4 weeks, 6,700+ in 12 weeks, with ZERO daily marketing effort. Product does the marketing.

---

## ⚡ Architectural Reality: Phased Rollout Strategy

**CRITICAL UPDATE (2025-10-25)**: Architectural analysis reveals we can launch Epic 22 in **Week 1 with ZERO new development** using 4 existing personas.

### Phased Launch Plan

**Week 1: Fast Launch (6-8 hours, 4 personas)**
- ✅ **Launch-Ready NOW** (use existing Studio features):
  - Musician (m) - Drum Machine tutorial
  - Educator (e) - Chord Arranger + Jam Session tutorial
  - Visual Learner (v) - Piano Roll with color modes tutorial
  - Producer (p) - Module system tutorial
- Expected: 120-140 users, k=1.2, $180 MRR
- Development: Stories 22.1-22.4 only (onboarding infrastructure)

**Week 2: Accessibility (2-3 hours, 1 persona)**
- Build Story 22.8 - Keyboard Navigation & Accessibility
- Launch Deaf/HOH (d) persona
- Expected: 160+ users, k=1.3, $220 MRR

**Week 3-4: Enterprise (6-8 hours, 1 persona)**
- Build Story 22.9 - Admin Dashboard & Enterprise Features
- Launch Enterprise (i) persona
- Expected: 280+ users, k=1.35, $500 MRR

**Total Investment**: 14-19 hours over 4 weeks (vs. original 6-8h estimate which assumed all features existed)

**Why This Works**:
- ✅ Launch in Week 1 with production-ready features (Studio has 6 modules, modular design)
- ✅ Iterate based on real user data (which personas convert best?)
- ✅ Avoid over-building (Enterprise may not convert, save 6-8 hours)
- ✅ Primary entry point: `/studio` (onboarding), Viral loop: `/jam` (collaboration)

**Reference**: See `docs/assessments/epic-22-architectural-feasibility.md` for full analysis

---

## Routing Strategy: /playground for Developer Access

**DECISION (2025-10-25)**: Move current WelcomeScreen (experiment browser) from `/` to `/playground` to make room for Epic 22 onboarding.

### Current State
- `jam.audiolux.app` → WelcomeScreen with 16+ experiment buttons (Piano, Guitar, MIDI Test, WLED Manager, etc.)
- **Problem**: Overwhelming for new users (70-90% estimated bounce rate)
- **Problem**: No guided onboarding, users don't know where to start

### New Route Structure

| Route | Shows | User Type |
|-------|-------|-----------|
| `/` | OnboardingRouter → PersonaSelector or Tutorial | New users (95% of traffic) |
| `/playground` | WelcomeScreen (experiment browser) | Developers, power users |
| `/studio` | Music Studio (direct access) | Everyone |
| `/jam` | Jam Session (direct access) | Everyone |
| All other routes | Unchanged (direct access) | Everyone |

### User Flows

**New User** (`jam.audiolux.app`):
```
Landing → PersonaSelector (4 cards) → Tutorial (30-60s) → Studio/Jam
```

**New User with Persona URL** (`jam.audiolux.app?v=e`):
```
Landing → Tutorial starts immediately → Studio/Jam
```

**Returning User** (`jam.audiolux.app`):
```
Landing → Check localStorage → hasCompletedOnboarding? → Redirect to /studio
```

**Developer** (`jam.audiolux.app/playground`):
```
Landing → WelcomeScreen (same as current) → All experiments
```

### Implementation

**Step 1**: Move WelcomeScreen route (App.tsx):
```typescript
// BEFORE:
<Route path="/" element={<WelcomeScreen ... />} />

// AFTER:
<Route path="/" element={<OnboardingRouter />} />
<Route path="/playground" element={<WelcomeScreen ... />} />
```

**Step 2**: Add footer link for discoverability:
```typescript
<Footer>
  <Link to="/playground">🧪 Developer Playground</Link>
</Footer>
```

**Step 3**: Announce in Discord:
- "Experiment browser moved to /playground"
- "Bookmark jam.audiolux.app/playground for quick access"
- "All existing routes still work (/studio, /piano, /midi-test, etc.)"

### Benefits

**For New Users**:
- ✅ Guided onboarding (40%+ conversion vs. 10-30% with experiment grid)
- ✅ Persona-specific experience (Educator sees teaching tools, Musician sees instruments)
- ✅ Clear path to value (<60 seconds to first "aha moment")

**For Developers**:
- ✅ Zero disruption (just bookmark /playground)
- ✅ All experiments still accessible
- ✅ All direct routes still work (/studio, /piano, etc.)

**For Power Users**:
- ✅ Discoverable via footer link
- ✅ Can still explore all features
- ✅ No account/onboarding required (skip to /playground)

### Risks & Mitigation

**Risk**: Developers/power users can't find experiments
- **Mitigation**: Footer link "🧪 Developer Playground"
- **Mitigation**: Discord announcement
- **Mitigation**: All direct routes still work

**Risk**: Existing bookmarks break
- **Impact**: Low (anyone who bookmarked specific routes like /studio will still work)
- **Impact**: Medium (anyone who bookmarked / will see onboarding instead of WelcomeScreen)
- **Mitigation**: Temporary redirect banner: "Looking for experiments? Visit /playground"

---

## Success Criteria

**UPDATED**: Targets adjusted for phased rollout

### Primary KPIs (Week 4)
- ✅ **160+ total users** (from 10 seed users, k=1.3 viral coefficient)
- ✅ **30%+ tutorial completion rate** (users finish guided onboarding)
- ✅ **40%+ share rate** (users invite at least 1 person)
- ✅ **k ≥ 1.3** (each user brings 1.3 new users on average)

### Secondary KPIs (Week 12)
- ✅ **6,700+ total users** (exponential growth sustained)
- ✅ **20+ paying Pro users** ($200+ MRR from product-led conversion)
- ✅ **50%+ activation rate** (users create first project within 7 days)
- ✅ **3+ high-value advocates** (educators/influencers actively promoting)

### Engagement Metrics
- **Tutorial completion time**: <60 seconds average
- **Time to first "aha moment"**: <30 seconds (first playback)
- **Session share rate**: 40%+ create jam sessions and invite others
- **Referral attribution**: Track which personas and referrers convert best

---

## Business Impact

### Traditional Marketing ROI (Epic 21 Approach)
- **Time investment**: 60-70 hours upfront + 30 min/day × 90 days = **115 hours**
- **Users acquired**: 20-100 (optimistic)
- **Cost per user**: 1.15-5.75 hours per user
- **Sustainability**: Stops when you stop

### Product-Led Growth ROI (Epic 22 Approach)
- **Time investment**: 6-8 hours upfront + 0 min/day = **8 hours total**
- **Users acquired**: 160 (Week 4), 6,700 (Week 12)
- **Cost per user**: 0.001 hours per user (8 / 6,700)
- **Sustainability**: Self-sustaining, compounds over time

**ROI**: **2,300x more efficient** (5.75 / 0.001)

---

## Target Personas & URL Codes (v2.0 - Redesigned)

**Key Change**: Separated "Deaf Musician" into two personas (Musician + Deaf/HOH Person) for broader inclusivity, added Enterprise/Institution persona for $$$ opportunities. See `docs/marketing/10-persona-research-redesign.md` for full details.

Instead of obvious `?path=influencer`, we use discrete codes that look like version/revision parameters:

| Code | Persona | Messaging Focus | Primary Need | Budget | Example Targets |
|------|---------|-----------------|--------------|--------|-----------------|
| `?v=m` | Musician | "Browser-based music creation" | Make music easily | Free/$10/mo | Reddit music subs, Discord producers |
| `?v=d` | Deaf/HOH Person | "Music for everyone. No hearing required." | Accessible music experience | Free | Sean Forbes, Scarlet Watters, AAMHL |
| `?v=e` | Educator | "Teach music visually" | Inclusive classroom tools | $199/yr | Music teachers, Gallaudet |
| `?v=v` | Visual Learner | "Music for visual thinkers" | Learn by patterns | Free/$10/mo | r/musictheory, visual learners |
| `?v=p` | Producer/Beatmaker | "Professional DAW in browser" | Portable production | $10/mo | Ableton Discord, r/edmproduction |
| `?v=i` | 🆕 Enterprise/Institution | "Scalable accessible music education" | Institutional solution | **$199-$999/yr** | Schools, therapy centers, nonprofits |

**Persona Overlaps** (reusable components):
- Deaf Educator = `d` + `e` components
- Visual Learning Musician = `v` + `m` components
- Enterprise Educator = `i` + `e` components

**Referral codes** are also discrete:
- `&r=sc4t` (scarlet-watters hashed)
- `&r=se8a` (sean-forbes hashed)
- `&r=gl7u` (gallaudet-university hashed)

**Example URLs**:
- `jam.audiolux.app?v=d&r=sc4t` → Deaf/HOH persona, Scarlet referral
- `jam.audiolux.app?v=i&r=gl7u` → Enterprise persona, Gallaudet referral

User sees: "Clean URL with version param"
We track: Persona path + referral source

---

## Viral Coefficient Math (Why k > 1 Changes Everything)

**Viral coefficient (k)** = average number of new users each user brings

### If k = 1.3 (40% share rate × 3.25 invites average):

Starting with **10 seed users**:

| Week | Users Start | New Invites | Users End | Growth |
|------|-------------|-------------|-----------|--------|
| 1 | 10 | 13 | **23** | +130% |
| 2 | 23 | 30 | **53** | +130% |
| 3 | 53 | 69 | **122** | +130% |
| 4 | 122 | 159 | **281** | +130% |
| 8 | - | - | **1,800** | - |
| 12 | - | - | **11,500** | - |

**Key insight**: Once k > 1, growth is exponential and self-sustaining.

**How to achieve k = 1.3:**
- 40% of users share → 0.4
- Those who share invite 3.25 people on average → × 3.25
- 0.4 × 3.25 = **k = 1.3** ✅

**Levers to increase k:**
- Better post-tutorial share prompts
- Educator-specific "invite students" flow (1 teacher = 15+ students)
- Influencer perks (analytics, custom URLs)

---

## Epic Stories Breakdown

### Story 22.1: Multi-Path Onboarding System (3-4 hours)

**Goal**: Build 5 personalized onboarding tutorials that demonstrate value in 30 seconds, routed via discrete URL codes (`?v=d/e/v/p/c`).

**Deliverables**:
- `<PersonaSelector>` component (shown when no `?v=` code)
- 5 persona-specific tutorial paths:
  - **Deaf Musician** (`?v=d`): "Make music. No hearing required."
  - **Educator** (`?v=e`): "Teach music visually"
  - **Visual Learner** (`?v=v`): "Music for visual thinkers"
  - **Producer** (`?v=p`): "Modular browser DAW"
  - **Creator** (`?v=c`): "Visual music for content"
- URL routing system (`src/utils/personaCodes.ts`)
- Activation milestone tracking (tutorial completion, first playback, first share)

**Acceptance Criteria**:
- User lands on `jam.audiolux.app?v=e` → sees Educator tutorial (no selector)
- User lands on `jam.audiolux.app` (no code) → sees PersonaSelector
- Tutorial completion triggers celebration + share prompt
- All 5 paths complete in <60 seconds

**Estimated Effort**: 3-4 hours

---

### Story 22.2: AI Outreach Message Generator (1-2 hours)

**Goal**: Build CLI tool using Claude API to generate personalized outreach messages with custom onboarding URLs.

**Deliverables**:
- Python script: `tools/outreach_generator.py`
- Input: Target info (name, platform, bio, recent content, persona)
- Output: 3 message variations (friendly, professional, brief) + custom URL
- Example usage for Top 10 relationships (Sean Forbes, Scarlet Watters, etc.)

**Acceptance Criteria**:
- Generate outreach for Scarlet Watters (TikTok influencer)
  - Input: `{'name': 'Scarlet Watters', 'persona': 'creator', 'platform': 'TikTok'}`
  - Output: 3 message variations + `jam.audiolux.app?v=c&r=sc4t`
- Messages reference target's specific work (not generic)
- Takes <2 minutes per target (AI-generated)

**Estimated Effort**: 1-2 hours

---

### Story 22.3: Referral Attribution & Analytics (1-2 hours)

**Goal**: Track `?v=` (persona) and `?r=` (referral) codes, display analytics dashboard, notify referrers when someone uses their link.

**Deliverables**:
- `src/utils/referralTracking.ts` (capture and store codes)
- Analytics dashboard: Which personas convert best?
- Referral notifications: "Sarah joined your session! You've referred 3 people this week."
- CSV export for weekly analysis

**Acceptance Criteria**:
- User visits `jam.audiolux.app?v=e&r=se8a` → codes captured
- Dashboard shows: "Educator path: 45 visits, 30% completion, 12 sign-ups"
- Sean Forbes (`se8a`) receives notification when someone uses his link
- Export CSV: persona, referrer, completion rate, sign-up rate

**Estimated Effort**: 1-2 hours

---

### Story 22.4: Viral Loop Triggers (1 hour)

**Goal**: Add share prompts after key activation moments (tutorial completion, first session created) with persona-specific messaging.

**Deliverables**:
- `<ShareSessionModal>` component (triggered post-tutorial)
- Persona-specific share copy:
  - **Educator**: "Invite students to jam live"
  - **Creator**: "Share with your followers"
  - **Producer**: "Invite a collaborator"
- Quick share buttons (WhatsApp, Email, Discord, Copy)
- Gamification: "You've introduced 3 people this week 🌟"

**Acceptance Criteria**:
- User completes tutorial → sees share modal (40%+ click "Share")
- Educator sees "Invite students" CTA (not generic "Share")
- WhatsApp share pre-fills message: "Check out this visual music tool I'm using: [URL]"
- Users who share 3+ people get "Community Builder" badge

**Estimated Effort**: 1 hour

---

## Epic Timeline

### Week 1: Build Phase (6-8 hours)
- **Day 1-2**: Story 22.1 (Multi-Path Onboarding) - 3-4 hours
- **Day 3**: Story 22.2 (AI Outreach Generator) - 1-2 hours
- **Day 4**: Story 22.3 (Referral Attribution) - 1-2 hours
- **Day 5**: Story 22.4 (Viral Loop Triggers) - 1 hour

**End of Week 1**: All stories deployed, system live

### Week 2-4: Seed & Measure (30 min/day)
- **Monday**: AI-generate outreach to 2 targets from Top 10 list
- **Tuesday**: Send personalized messages with custom URLs
- **Wednesday**: Monitor analytics, reply to inbound interest
- **Thursday**: Adjust messaging based on conversion data
- **Friday**: Weekly retrospective - which personas converting best?

**Daily time**: 30 minutes (AI generates messages, you review & send)

### Week 4 Checkpoint
- ✅ 160+ users achieved via viral growth
- ✅ Identify best-performing persona paths
- ✅ 3+ advocates actively sharing (educators, influencers)

### Week 5-12: Optimize & Scale (10 min/day)
- **Optimize**: Double down on best personas (e.g., if Educators convert 3x better, focus there)
- **Iterate**: Improve tutorial paths based on completion analytics
- **Partnerships**: Convert top referrers into formal advocates (free Pro, testimonials)

---

## Key Metrics Dashboard

| Metric | Week 1 Target | Week 4 Target | Week 12 Target |
|--------|---------------|---------------|----------------|
| Total Users | 10 (seed) | 160+ | 6,700+ |
| Tutorial Completion | 50%+ | 60%+ | 70%+ |
| Share Rate | 30% | 40% | 50% |
| Viral Coefficient (k) | 1.0 | 1.3 | 1.5 |
| Pro Conversions | 0 | 5 ($50 MRR) | 20+ ($200 MRR) |
| Active Advocates | 0 | 3 | 10+ |

---

## Persona-Specific Success Metrics

### Breakdown by Persona (Week 4 Targets)

Different personas have different behaviors and value. Track metrics separately to optimize marketing focus:

| Persona | Expected Users | Tutorial Completion | Share Rate | Avg Revenue/User | Total MRR |
|---------|---------------|---------------------|------------|------------------|-----------|
| **Musician (m)** | 40 (25%) | 55% | 35% | $0.50 | $20 |
| **Deaf/HOH (d)** | 30 (19%) | 65% | 45% | $0.30 | $9 |
| **Educator (e)** | 25 (16%) | 70% | **80%** | $1.20 | $30 |
| **Visual Learner (v)** | 35 (22%) | 60% | 40% | $0.40 | $14 |
| **Producer (p)** | 20 (13%) | 50% | 30% | $1.50 | $30 |
| **Enterprise (i)** | 10 (6%) | 75% | 60% | **$16.50** | **$165** |
| **TOTAL** | **160** | **60% avg** | **48% avg** | **$1.67 avg** | **$268 MRR** |

### Key Insights

**High-Volume Personas**:
- **Musician (m)**: Largest group (25%), but low monetization ($0.50/user)
- **Visual Learner (v)**: Second largest (22%), moderate engagement

**High-Engagement Personas**:
- **Educator (e)**: **2.3x share rate** (80% vs. 35% avg) - brings students in bulk
- **Enterprise (i)**: **75% completion rate** - motivated buyers, longer tutorial OK
- **Deaf/HOH (d)**: 65% completion - accessibility features resonate

**High-Value Personas**:
- **Enterprise (i)**: **$16.50/user** ($199/yr ÷ 12 months ÷ ~30 seats × 10 customers)
- **Producer (p)**: $1.50/user - most likely to pay for Pro ($10/mo)
- **Educator (e)**: $1.20/user - classroom licenses ($199/yr)

### Strategic Focus

**Week 1-4**: Broad seeding across all personas (test hypotheses)

**Week 5-8**: Double down on high performers
- If Educator converts 2x better → shift 40% of outreach to educators
- If Enterprise brings $165 MRR → prioritize school/institution outreach

**Week 9-12**: Optimize for revenue
- Enterprise = highest $ → create dedicated sales process (Story 22.6)
- Educator = highest k (viral coefficient) → improve bulk invite flow
- Musician/Visual = volume plays → optimize free tier for referrals

### Persona-Specific KPIs (Week 12 Targets)

| Persona | Users | Completion | Share Rate | MRR | Notes |
|---------|-------|------------|------------|-----|-------|
| Musician (m) | 1,675 | 60% | 40% | $837 | Volume play, free tier |
| Deaf/HOH (d) | 1,273 | 70% | 50% | $382 | High engagement, accessibility advocates |
| Educator (e) | 1,005 | 75% | **85%** | $1,206 | **Highest k** - brings students |
| Visual Learner (v) | 1,474 | 65% | 45% | $663 | Growing segment |
| Producer (p) | 871 | 55% | 35% | $1,306 | **Highest individual conversion** |
| Enterprise (i) | 402 | 80% | 70% | **$6,633** | **Highest revenue** - 20 paid customers @ $331/mo avg |
| **TOTAL** | **6,700** | **67% avg** | **54% avg** | **$11,027 MRR** | Self-sustaining growth |

### Measurement & Optimization

**Track in Analytics Dashboard**:
- `persona_tutorial_started` → `persona_tutorial_completed` (by persona code)
- `persona_share_clicked` (breakdown by m/d/e/v/p/i)
- `persona_converted_to_pro` (revenue attribution)

**Weekly Review Questions**:
1. Which persona has highest tutorial completion? (optimize others to match)
2. Which persona has highest share rate? (replicate tactics)
3. Which persona drives most revenue? (focus enterprise sales efforts)
4. Are we over-indexing on low-value personas? (shift strategy)

**Example Insight** (Week 4):
> "Educator persona has 80% share rate (2.3x higher than avg). Each educator brings avg 4.2 students. Shifting 30% of outreach budget to teacher communities (r/MusicEd, Facebook teacher groups). Expected impact: +50 users/week via educator referrals."

---

## Risks & Mitigation

### Risk 1: Viral Coefficient Falls Below 1.0
**Impact**: Growth stalls, not self-sustaining
**Likelihood**: Medium
**Mitigation**:
- A/B test share prompts (test 3 variations)
- Add educator-specific "bulk invite" flow
- Offer incentives (free Pro for 3+ referrals)

### Risk 2: Tutorial Completion Rate Too Low
**Impact**: Users don't reach "aha moment," don't share
**Likelihood**: Low (tutorial is <60 seconds)
**Mitigation**:
- Track drop-off points in tutorial
- Simplify steps if >20% drop off
- Add progress bar ("30 seconds to music")

### Risk 3: Seed Users Hard to Acquire
**Impact**: Can't start flywheel with 10 seed users
**Likelihood**: Low (we have Top 10 relationship targets)
**Mitigation**:
- Use AI Outreach Generator for personalized messages
- Leverage existing Discord/Reddit presence
- Partner with 1-2 educators for classroom pilots (instant 20-30 users)

---

## Dependencies

### Technical
- ✅ Jam sessions already built (viral mechanism exists)
- ✅ No account required (zero friction)
- ✅ React/Vite stack (fast onboarding iteration)
- ⏳ Need: URL routing for persona codes
- ⏳ Need: Tutorial component system

### Marketing
- ✅ Top 10 relationships identified (Sean Forbes, Scarlet Watters, etc.)
- ✅ Community research complete (D-PAN, Drake Music, AAMHL, etc.)
- ⏳ Need: AI outreach tool
- ⏳ Need: Referral tracking

### Content
- ⏳ Need: 6 persona tutorial scripts (AI can draft)
- ⏳ Need: 30-second testimonial video (optional, Week 2)
- ✅ Have: Product demo video plan (Story 21.1)

---

## Epic History

| Date | Milestone | Notes |
|------|-----------|-------|
| 2025-10-25 | Epic created | Pivoted from Epic 21 (traditional marketing) to product-led growth approach |
| 2025-10-25 | Story 22.1 deployed | Multi-path onboarding live (PersonaSelector + 4 tutorials + routing) |
| 2025-10-25 | Story 22.2 deployed | AI outreach generator ready (Python CLI + Claude API integration) |
| 2025-10-25 | Story 22.3 deployed | Analytics tracking live (referral attribution + dashboard + CSV export) |
| 2025-10-25 | Story 22.4 component ready | Share modal created, integration pending (Week 1-2) |
| TBD | Week 4 checkpoint | 160+ users milestone |
| TBD | Week 12 checkpoint | 6,700+ users milestone |

---

## Related Epics

- **Epic 21**: User Acquisition & Revenue Generation (traditional marketing approach - deprioritized)
- **Epic 20**: Studio Enhancements (product improvements to support growth)

---

## Comparison: Epic 21 vs Epic 22

| Dimension | Epic 21 (Traditional) | Epic 22 (Product-Led) |
|-----------|----------------------|----------------------|
| **Upfront time** | 60-70 hours | 6-8 hours |
| **Daily effort** | 30 min/day × 90 days | 0 min/day (after Week 2) |
| **Total time** | 115 hours | 8-15 hours |
| **Users @ Week 4** | ~20 | 160+ |
| **Users @ Week 12** | ~100 | 6,700+ |
| **Sustainability** | Stops when you stop | Self-sustaining (k > 1) |
| **Burnout risk** | High | Low |
| **Leverage** | Linear (you do work) | Exponential (product does work) |

---

## Next Steps

1. ✅ **Epic 22 approved** - proceed with story creation
2. ⏭️ **Create Story 22.1** - Multi-Path Onboarding System
3. ⏭️ **Create Story 22.2** - AI Outreach Message Generator
4. ⏭️ **Create Story 22.3** - Referral Attribution & Analytics
5. ⏭️ **Create Story 22.4** - Viral Loop Triggers

**Estimated Total Build Time**: 6-8 hours
**Expected Outcome**: Self-sustaining growth flywheel, 160+ users in 4 weeks

---

**Version**: 1.0
**Status**: 🚀 **Active - Highest Priority**
**Philosophy**: Marketing IS the product. Build it once, runs forever.
