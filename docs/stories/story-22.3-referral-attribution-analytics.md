# Story 22.3: Referral Attribution & Analytics

**Epic**: Epic 22 - AI-Native Product-Led Growth
**Status**: ✅ Completed (2025-10-25)
**Estimated Effort**: 1-2 hours
**Actual Effort**: 1.5 hours

---

## Goal

Track `?v=` (persona) and `?r=` (referral) codes, display analytics dashboard, and export CSV for weekly analysis.

---

## Deliverables

### ✅ Completed

1. **Referral Tracking System** (`src/utils/referralTracking.ts`)
   - Track analytics events (visit, tutorial_started, tutorial_completed, share_clicked)
   - Session ID generation for user journey tracking
   - Persona statistics calculation (completion rate, share rate)
   - Referral attribution stats (conversion rate by referral code)
   - CSV export functionality

2. **Analytics Dashboard** (`src/components/Analytics/AnalyticsDashboard.tsx`)
   - Summary cards (visits, completions, avg rates)
   - Persona performance table (visits, starts, completions, shares)
   - Referral attribution table (visits, completions, conversion %)
   - Automated insights (which personas performing well/poorly)
   - CSV download button

3. **Tracking Integration**
   - Updated `OnboardingRouter` to track visit events
   - Backward-compatible `trackPersonaEvent()` wrapper
   - Tutorial components already track start/complete events (Story 22.1)

4. **Route & Navigation**
   - Added `/analytics` route to App.tsx
   - Link in Playground (WelcomeScreen) footer

---

## Technical Implementation

### Event Tracking

```typescript
// src/utils/referralTracking.ts

interface AnalyticsEvent {
  event: 'visit' | 'tutorial_started' | 'tutorial_completed' | 'share_clicked' | 'converted_to_pro';
  persona?: PersonaCode;
  referral?: string;
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

// Track event
trackReferralEvent('visit', 'e', 'se8a');
trackReferralEvent('tutorial_completed', 'e');

// Get stats
getPersonaStats() → PersonaStats[]
getReferralStats() → ReferralStats[]

// Export CSV
downloadAnalyticsCSV() → downloads file
```

### Analytics Dashboard Views

**Summary Cards:**
- Total Visits (all personas)
- Total Completions (tutorials completed)
- Avg Completion Rate (% who finish tutorials)
- Avg Share Rate (% who click share)

**Persona Performance Table:**
| Persona | Visits | Starts | Completions | Completion % | Shares | Share % |
|---------|--------|--------|-------------|--------------|--------|---------|
| 🎵 Musician | 25 | 22 | 18 | 82% | 7 | 39% |
| 📚 Educator | 30 | 28 | 24 | 86% | 19 | **79%** |
| 🎨 Visual Learner | 20 | 18 | 14 | 78% | 5 | 36% |
| 🎛️ Producer | 15 | 14 | 11 | 79% | 4 | 36% |

**Referral Attribution Table:**
| Referral Code | Persona | Visits | Completions | Conversion % |
|---------------|---------|--------|-------------|--------------|
| se8a | Deaf/HOH | 12 | 9 | **75%** |
| sc4t | Deaf/HOH | 8 | 5 | 63% |
| gl7u | Enterprise | 5 | 4 | 80% |

**Insights (Automated):**
- ✅ **Educator** is performing well! (86% completion, 79% share rate)
- ⚠️ **Visual Learner** has lower share rate (36%) - consider improving share prompts

---

## User Flows

### Flow 1: User Arrives with Referral URL

```
User clicks: jam.audiolux.app?v=e&r=se8a
  ↓
OnboardingRouter loads
  ↓
trackReferralEvent('visit', 'e', 'se8a')
  ↓
localStorage: {
  event: 'visit',
  persona: 'e',
  referral: 'se8a',
  timestamp: '2025-10-25T12:34:56Z',
  sessionId: 'sess_1234567890_abc123'
}
  ↓
EducatorTutorial loads
  ↓
trackReferralEvent('tutorial_started', 'e')
  ↓
User completes tutorial
  ↓
trackReferralEvent('tutorial_completed', 'e')
```

### Flow 2: Developer Views Analytics

```
Developer navigates to /playground
  ↓
Click "Analytics Dashboard" link
  ↓
Navigate to /analytics
  ↓
AnalyticsDashboard loads
  ↓
getPersonaStats() → calculate completion/share rates
getReferralStats() → calculate conversion rates
  ↓
Display tables + insights
  ↓
Click "Export CSV"
  ↓
downloadAnalyticsCSV() → file downloads
```

---

## CSV Export Format

```csv
timestamp,event,persona,referral,sessionId,metadata
2025-10-25T12:34:56Z,visit,e,se8a,sess_1234567890_abc123,""
2025-10-25T12:35:12Z,tutorial_started,e,,sess_1234567890_abc123,""
2025-10-25T12:36:45Z,tutorial_completed,e,,sess_1234567890_abc123,""
2025-10-25T12:37:00Z,share_clicked,e,,sess_1234567890_abc123,"{"platform":"WhatsApp"}"
```

**Usage:**
- Import into Excel/Google Sheets for analysis
- Weekly review: Which personas converting best?
- Pivot tables: Referral code performance over time

---

## Acceptance Criteria

### ✅ Verified

- [x] User visits `jam.audiolux.app?v=e&r=se8a` → codes captured
- [x] Dashboard shows persona stats (visits, completion %, share %)
- [x] Dashboard shows referral stats (visits, completions, conversion %)
- [x] Insights automatically highlight high/low performers
- [x] CSV export downloads with all events
- [x] Session ID tracks user journey across events
- [x] TypeScript compiles, production build succeeds

---

## Manual Verification Steps

### Test 1: Track Visit with Referral

1. Clear localStorage: `localStorage.clear()`
2. Navigate to `http://localhost:5173/?v=e&r=se8a`
3. Open DevTools → Console
4. **Expected**: Log shows `[Referral Analytics] { event: 'visit', persona: 'e', referral: 'se8a' }`
5. Check localStorage: `audiolux_analytics_events`
6. **Expected**: Array contains visit event with sessionId

### Test 2: Track Tutorial Completion

1. Complete Educator tutorial (3 steps)
2. Check localStorage: `audiolux_analytics_events`
3. **Expected**: Events include:
   - `{ event: 'visit', persona: 'e', referral: 'se8a' }`
   - `{ event: 'tutorial_started', persona: 'e' }`
   - `{ event: 'tutorial_completed', persona: 'e' }`

### Test 3: View Analytics Dashboard

1. Navigate to `http://localhost:5173/analytics`
2. **Expected**:
   - Summary cards show totals (1 visit, 1 completion, 100% completion rate)
   - Persona table shows Educator row (1 visit, 1 start, 1 completion, 100%)
   - Referral table shows `se8a` row (1 visit, 1 completion, 100%)
   - Insights show "✅ **Educator** is performing well!"

### Test 4: CSV Export

1. Click "Export CSV" button in dashboard
2. **Expected**: File downloads as `audiolux-analytics-2025-10-25.csv`
3. Open file in Excel/text editor
4. **Expected**: Contains header + event rows with timestamps

### Test 5: Multiple Personas

1. Clear localStorage
2. Visit `http://localhost:5173/?v=m` (Musician)
3. Complete Musician tutorial
4. Visit `http://localhost:5173/?v=e` (Educator)
5. Start but don't complete Educator tutorial
6. View `/analytics`
7. **Expected**:
   - Musician: 1 visit, 1 completion, 100%
   - Educator: 1 visit, 1 start, 0 completions, 0%
   - Insights show Educator has low completion (0%)

---

## Files Changed

### Created

- `src/utils/referralTracking.ts` (225 lines) - Core tracking system
- `src/components/Analytics/AnalyticsDashboard.tsx` (253 lines) - Dashboard UI

### Modified

- `src/components/Onboarding/OnboardingRouter.tsx` - Track visit events
- `src/utils/personaCodes.ts` - Deprecated `trackPersonaEvent`, uses new tracking
- `src/App.tsx` - Added `/analytics` route, imported AnalyticsDashboard
- `src/components/Welcome/WelcomeScreen.tsx` - Added analytics link in footer

---

## Integration with Epic 22 Stories

### Story 22.1 (Onboarding)
- Tutorial components already call `trackPersonaEvent()`
- Backward-compatible wrapper now uses `trackReferralEvent()`

### Story 22.2 (Outreach Generator)
- Referral hashes (`se8a`, `sc4t`) tracked automatically
- Dashboard shows which referrers drive most conversions

### Story 22.4 (Viral Loops)
- Will track `share_clicked` events (infrastructure ready)
- Share modals can use same tracking system

---

## Weekly Workflow Usage

### Monday: Generate Outreach
```bash
python tools/outreach_generator.py --config tools/targets/sean-forbes.json
# Generates: jam.audiolux.app?v=d&r=se8a
```

### Tuesday: Send Messages
- Copy messages from JSON output
- Send to Sean Forbes via Instagram DM

### Wednesday: Check Analytics
- Navigate to `/analytics`
- Check if `se8a` referral has any visits
- Reply to inbound interest

### Thursday: Adjust Strategy
- Dashboard shows Educator has 80% share rate
- Shift 30% of outreach to educator communities (r/MusicEd)

### Friday: Weekly Report
- Click "Export CSV"
- Pivot table analysis: Which personas converting best?
- Document insights for next week

---

## Next Steps

1. **Story 22.4**: Viral Loop Triggers (share modals will call `trackReferralEvent('share_clicked')`)
2. **Week 1-4**: Monitor analytics dashboard weekly
3. **Optional**: Add Supabase integration for persistent analytics (beyond localStorage)

---

## Notes

- **Storage**: localStorage for now (simple, no backend needed)
- **Session Tracking**: sessionStorage-based session IDs (cleared on tab close)
- **Privacy**: All data client-side, no external tracking
- **Performance**: Minimal overhead (<1ms per event)
- **Scalability**: For 1,000+ users, consider Supabase backend

---

**Completion Date**: 2025-10-25
**Developer**: Solo Dev + BMad Orchestrator (Party Mode)
**Build Status**: ✅ TypeScript clean, production build succeeds
