# Analytics Dashboard & Tracking Setup
## Data-Driven Decision Making for Audiolux

**Owner**: Solo Dev + AI Assist
**Goal**: Track all key metrics for user acquisition, engagement, retention, and revenue
**Primary Tools**: Vercel Analytics (installed ✅), Google Analytics 4, Custom Events

---

## Analytics Philosophy

### Core Principles
- **Measure what matters**: Focus on actionable metrics, not vanity metrics
- **Privacy-first**: Respect user privacy, comply with GDPR/CCPA
- **Real-time insights**: Track trends weekly, not just monthly
- **Attribution tracking**: Know which channels drive best users
- **Hypothesis-driven**: Use data to validate assumptions, not confirm biases

### What We Track (And Why)

**Acquisition**: Where do users come from?
**Activation**: Do users experience the "aha moment"?
**Engagement**: Are users creating value?
**Retention**: Do users come back?
**Revenue**: Are users willing to pay?
**Referral**: Do users bring their friends?

---

## Current Analytics Stack (As of Jan 2025)

### Installed ✅
- **Vercel Analytics**: Real User Monitoring (RUM), Web Vitals, basic pageviews
- **SEO Meta Tags**: Title, description, OG tags, Twitter Cards
- **Sitemap.xml & Robots.txt**: Search engine indexing

### To Install (Priority Order)
1. **Google Analytics 4** (Week 1) - Advanced funnels, audience segmentation
2. **Custom Event Tracking** (Week 1) - User actions (module loaded, project created, etc.)
3. **Hotjar** (Week 2) - Heatmaps, session recordings, user feedback
4. **Google Search Console** (Week 1) - SEO performance, keyword rankings
5. **Mixpanel or Amplitude** (Optional, Month 2+) - Advanced product analytics

---

## Implementation Guide

### 1. Google Analytics 4 Setup (Week 1 Priority)

**Step 1: Create GA4 Property**
1. Go to https://analytics.google.com
2. Create account → "Audiolux"
3. Create property → "Audiolux Production"
4. Set timezone, currency
5. Copy Measurement ID (format: G-XXXXXXXXXX)

**Step 2: Install GA4 in Audiolux**

```typescript
// src/utils/analytics.ts
import ReactGA from 'react-ga4';

// Initialize GA4 (add your Measurement ID)
export const initializeAnalytics = () => {
  const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  if (MEASUREMENT_ID && import.meta.env.PROD) {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

// Page view tracking
export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

// Custom event tracking
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};
```

**Step 3: Initialize in App**

```typescript
// src/main.tsx
import { initializeAnalytics } from './utils/analytics';

// After React render
initializeAnalytics();
```

**Step 4: Add to Environment Variables**

```.env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 2. Custom Event Tracking (Week 1 Priority)

**Events to Track**:

**Acquisition Events**:
- `sign_up` - User creates account
- `utm_capture` - Capture UTM parameters for attribution

**Activation Events**:
- `module_loaded` - User loads first module
- `first_project_created` - User creates first project
- `onboarding_completed` - User completes tutorial

**Engagement Events**:
- `project_created` - User creates new project
- `project_saved` - User saves existing project
- `module_used` - User interacts with specific module
- `jam_session_started` - User creates jam session
- `jam_session_joined` - User joins jam session

**Retention Events**:
- `returned_day_7` - User returns 7 days after sign-up
- `returned_day_30` - User returns 30 days after sign-up

**Revenue Events**:
- `pro_trial_started` - User starts Pro trial
- `pro_subscribed` - User subscribes to Pro
- `pro_cancelled` - User cancels Pro subscription

**Example Implementation**:

```typescript
// src/components/Studio/ModuleLoader.tsx
import { trackEvent } from '@/utils/analytics';

const loadModule = (moduleName: string) => {
  // ... existing logic

  // Track event
  trackEvent('Engagement', 'module_loaded', moduleName);
};

// src/hooks/useProject.ts
import { trackEvent } from '@/utils/analytics';

const createProject = () => {
  // ... existing logic

  // Track event
  trackEvent('Engagement', 'project_created', projectType);

  // Check if first project
  if (user.projectCount === 1) {
    trackEvent('Activation', 'first_project_created');
  }
};

// src/components/Auth/SignUp.tsx
import { trackEvent } from '@/utils/analytics';

const handleSignUp = async () => {
  // ... existing logic

  // Track sign-up with attribution
  trackEvent('Acquisition', 'sign_up', referralSource);

  // Capture UTM parameters
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');

  if (utmSource) {
    trackEvent('Acquisition', 'utm_capture', `${utmSource}|${utmMedium}|${utmCampaign}`);
  }
};
```

---

### 3. Hotjar Setup (Week 2)

**Purpose**: Heatmaps, session recordings, user surveys

**Step 1: Create Hotjar Account**
1. Go to https://www.hotjar.com
2. Sign up (free tier: 35 sessions/day)
3. Add site: www.audiolux.app + jam.audiolux.app
4. Copy tracking code (Hotjar ID)

**Step 2: Install Hotjar**

```typescript
// src/utils/hotjar.ts
export const initializeHotjar = () => {
  const HOTJAR_ID = import.meta.env.VITE_HOTJAR_ID;
  const HOTJAR_SNIPPET_VERSION = 6;

  if (HOTJAR_ID && import.meta.env.PROD) {
    (function (h, o, t, j, a, r) {
      h.hj =
        h.hj ||
        function () {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
      h._hjSettings = { hjid: HOTJAR_ID, hjsv: HOTJAR_SNIPPET_VERSION };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }
};
```

**Step 3: Add to main.tsx**

```typescript
import { initializeHotjar } from './utils/hotjar';
initializeHotjar();
```

**What to Track with Hotjar**:
- Heatmaps on homepage (www.audiolux.app)
- Session recordings on Studio (jam.audiolux.app)
- Feedback polls: "What's most confusing?" (onboarding)
- Surveys: "Why did you sign up?" (after first project)

---

### 4. Google Search Console (Week 1)

**Purpose**: SEO performance, keyword rankings, indexing status

**Setup**:
1. Go to https://search.google.com/search-console
2. Add property: www.audiolux.app
3. Verify ownership:
   - Upload HTML file to /public
   - Or add meta tag to index.html
4. Submit sitemap: www.audiolux.app/sitemap.xml

**Weekly Checks**:
- Total clicks (organic traffic)
- Top performing queries
- Average position for target keywords
- Index coverage (pages indexed vs. excluded)

---

## Key Metrics & Definitions

### Acquisition Metrics

**1. Traffic Sources**
- **Organic**: Search engines (Google, Bing)
- **Direct**: Typed URL or bookmark
- **Referral**: Other websites linking to Audiolux
- **Social**: Twitter, LinkedIn, Instagram, etc.
- **Paid**: Reddit Ads, YouTube Pre-Roll, Meta Ads
- **Email**: Clicks from email campaigns

**2. Attribution Metrics**
- **UTM Parameters**: Track campaign performance
  - Example: jam.audiolux.app?utm_source=reddit&utm_medium=cpc&utm_campaign=test-week4
- **First Touch**: What brought user initially?
- **Last Touch**: What converted user before sign-up?

**3. Acquisition KPIs**
- **Unique Visitors**: Total people visiting site
- **Sign-up Rate**: % visitors who create account
- **Cost Per Acquisition (CPA)**: $ spent / sign-ups (paid channels)
- **Viral Coefficient**: Invites sent / new users (referral growth)

---

### Activation Metrics

**Definition**: User experiences "aha moment" and gets value

**Activation Events** (in order):
1. Sign-up completed
2. First module loaded
3. First project created
4. First project saved
5. Onboarding completed

**Activation KPIs**:
- **Activation Rate**: % sign-ups who create first project
- **Time to First Value (TTFV)**: Time from sign-up to first project
- **Onboarding Completion Rate**: % who finish tutorial

**Target**: 70%+ activation rate (sign-up → first project) within 24 hours

---

### Engagement Metrics

**Definition**: User actively creates value in Audiolux

**Engagement Events**:
- Projects created
- Modules used
- Jam sessions joined
- Time in Studio

**Engagement KPIs**:
- **Daily Active Users (DAU)**: Unique users per day
- **Weekly Active Users (WAU)**: Unique users per week
- **Monthly Active Users (MAU)**: Unique users per month
- **DAU/MAU Ratio**: Stickiness (target: 20%+)
- **Average Session Duration**: Time per visit (target: 10+ min)
- **Sessions per User**: Frequency (target: 3+ sessions/week for actives)

**Power User Definition**: User with 10+ projects created AND 5+ weekly sessions

---

### Retention Metrics

**Definition**: Users return after first visit

**Retention Cohorts**:
- **D1 Retention**: % users who return Day 1 after sign-up
- **D7 Retention**: % users who return Day 7 after sign-up
- **D30 Retention**: % users who return Day 30 after sign-up

**Retention KPIs**:
- **D1 Retention**: Target 40%+
- **D7 Retention**: Target 30%+
- **D30 Retention**: Target 20%+
- **Churn Rate**: % users who don't return in 30 days

**Retention Cohort Table Example**:

| Sign-up Week | Users | D1 | D7 | D30 | D60 | D90 |
|--------------|-------|-----|-----|-----|-----|-----|
| Jan 1-7 | 50 | 45% | 32% | 22% | 18% | 15% |
| Jan 8-14 | 75 | 48% | 35% | 25% | TBD | TBD |
| Jan 15-21 | 100 | 50% | 38% | TBD | TBD | TBD |

**Analysis**: Improving retention over time ✅

---

### Revenue Metrics

**Definition**: Users convert to paying customers

**Revenue Events**:
- Pro trial started
- Pro subscription purchased
- Pro subscription renewed
- Pro subscription cancelled

**Revenue KPIs**:
- **Free → Pro Conversion Rate**: % free users who upgrade
- **Monthly Recurring Revenue (MRR)**: Total monthly revenue
- **Average Revenue Per User (ARPU)**: MRR / total users
- **Customer Lifetime Value (LTV)**: Average revenue per user over lifetime
- **Churn Rate**: % Pro users who cancel per month
- **LTV/CAC Ratio**: Lifetime value / customer acquisition cost (target: 3:1+)

**Revenue Targets**:
- Month 3: $500 MRR (50 Pro users @ $9.99/mo)
- Month 6: $1,500 MRR (150 Pro users)
- Month 12: $5,000 MRR (500 Pro users)

---

### Referral Metrics

**Definition**: Users invite others

**Referral Events**:
- Invite sent (jam session link shared)
- Invite accepted (friend signs up via referral)
- Social share (user shares creation on social media)

**Referral KPIs**:
- **Viral Coefficient (K-factor)**: Invites sent / new users
  - K < 1: Non-viral growth (rely on acquisition)
  - K = 1: Viral growth (sustains itself)
  - K > 1: Exponential growth
- **Referral Rate**: % users who invite others
- **Referral Conversion Rate**: % invited who sign up

**Target**: K-factor > 0.5 (every 2 users bring 1 new user)

---

## Analytics Dashboard (Google Sheets Template)

### Weekly Dashboard (Update Every Monday)

**Acquisition** (Week of [Date]):

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Total Visitors | | | |
| Sign-ups | | | |
| Sign-up Rate | | | |
| Top Source | | | |
| CPA (Paid) | | | |

**Activation**:

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Activation Rate | | | |
| Time to First Project (avg) | | | |
| Onboarding Completion | | | |

**Engagement**:

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| DAU | | | |
| WAU | | | |
| MAU | | | |
| DAU/MAU Ratio | | | |
| Avg Session Duration | | | |
| Projects Created | | | |

**Retention**:

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| D7 Retention | | | |
| D30 Retention | | | |

**Revenue**:

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| MRR | | | |
| Free Users | | | |
| Pro Users | | | |
| Free → Pro Conv. Rate | | | |
| Pro Churn Rate | | | |

---

## UTM Parameter Strategy

### Campaign Naming Convention

**Format**: ?utm_source=[source]&utm_medium=[medium]&utm_campaign=[campaign]&utm_content=[content]

**Sources** (where traffic comes from):
- `reddit` - Reddit posts/comments
- `twitter` - Twitter/X posts
- `show_hn` - Hacker News
- `linkedin` - LinkedIn posts
- `email` - Email campaigns
- `discord` - Discord server links

**Mediums** (how traffic arrives):
- `organic` - Unpaid posts
- `cpc` - Paid ads (cost per click)
- `email` - Email campaigns
- `referral` - Links from other sites
- `social` - Social media (organic)

**Campaigns** (specific initiative):
- `launch-week` - Initial launch
- `product-hunt` - Product Hunt launch
- `reddit-blitz-jan` - Reddit outreach January
- `welcome-series` - Onboarding email sequence
- `free-to-pro-nurture` - Upgrade email campaign

**Content** (A/B test variants):
- `gif-demo` - GIF showing feature
- `video-demo` - Video showing feature
- `text-post` - Text-only post

**Example URLs**:
```
Reddit post (organic):
jam.audiolux.app?utm_source=reddit&utm_medium=organic&utm_campaign=reddit-blitz-jan&utm_content=gif-demo

Reddit ad (paid):
jam.audiolux.app?utm_source=reddit&utm_medium=cpc&utm_campaign=test-week4&utm_content=text-ad

Show HN post:
jam.audiolux.app?utm_source=show_hn&utm_medium=organic&utm_campaign=launch-week

Email link:
jam.audiolux.app?utm_source=email&utm_medium=email&utm_campaign=welcome-series&utm_content=email-2
```

**Tool**: Use https://ga-dev-tools.google/campaign-url-builder/ to generate URLs

---

## A/B Testing Strategy

### Tools
- **Google Optimize** (free, native with GA4) - DEPRECATED, use alternatives
- **VWO** (Visual Website Optimizer) - $199/mo
- **Optimizely** - Enterprise pricing
- **Statsig** (free tier) - Developer-friendly

**Recommended**: Start with manual A/B testing (50% traffic split via feature flag)

### Tests to Run (Priority Order)

**Test 1: Homepage Headline** (Week 2)
- **Variant A**: "Make Music Visually. Together. No theory or hearing needed."
- **Variant B**: "The Only Music Studio Designed for Visual Learners"
- **Metric**: Sign-up rate
- **Duration**: 1 week, 200+ visitors per variant

**Test 2: Pricing Page CTA** (Week 4)
- **Variant A**: "Start Free Trial" (7-day trial emphasized)
- **Variant B**: "Upgrade to Pro" (immediate upgrade)
- **Metric**: Pro conversion rate
- **Duration**: 2 weeks, 50+ free users per variant

**Test 3: Onboarding Flow** (Week 6)
- **Variant A**: Interactive tutorial (guided walkthrough)
- **Variant B**: Template projects (start from example)
- **Metric**: Activation rate (first project created)
- **Duration**: 2 weeks, 50+ new sign-ups per variant

---

## Privacy & Compliance

### GDPR Compliance (Europe)
- [ ] Cookie consent banner (required for GA4, Hotjar)
- [ ] Privacy policy page (link in footer)
- [ ] User data export capability (GDPR right to access)
- [ ] User data deletion capability (GDPR right to be forgotten)
- [ ] Anonymize IP addresses in GA4

### CCPA Compliance (California)
- [ ] "Do Not Sell My Personal Information" link (footer)
- [ ] Opt-out mechanism for data sharing

### Best Practices
- **No PII in analytics**: Don't track names, emails, passwords
- **Anonymize users**: Use user_id (hashed), not identifiable info
- **Respect Do Not Track**: Honor browser DNT settings
- **Data retention**: Delete old analytics data after 14 months (GA4 default)

**Privacy Policy Template**: Use https://www.freeprivacypolicy.com/ to generate

---

## Weekly Analytics Review Checklist

**Every Monday, Review**:
- [ ] Top traffic sources (what's working?)
- [ ] Sign-up rate (improving or declining?)
- [ ] Activation rate (are new users getting value?)
- [ ] D7 retention (are users returning?)
- [ ] Top modules used (what features resonate?)
- [ ] Pro conversion rate (is pricing working?)
- [ ] MRR growth (revenue trending up?)

**Identify**:
- [ ] 1 win to celebrate (what worked?)
- [ ] 1 problem to fix (what's broken?)
- [ ] 1 experiment to run (what to test?)

---

## Tools & Resources

### Free Tools
- **Google Analytics 4** (free) - Core analytics
- **Google Search Console** (free) - SEO tracking
- **Vercel Analytics** (free tier) - Performance monitoring
- **Hotjar** (free tier: 35 sessions/day) - Heatmaps
- **Plausible** (open source, self-hosted) - Privacy-friendly alternative

### Paid Tools (Optional)
- **Mixpanel** ($25/mo) - Advanced product analytics
- **Amplitude** ($50/mo) - User behavior analysis
- **Heap** ($3,600/year) - Auto-capture all events
- **Segment** ($120/mo) - Analytics aggregator (send to multiple tools)

### Dashboard Tools
- **Google Data Studio** (free) - Visual dashboards from GA4
- **Metabase** (open source) - SQL-based analytics
- **Google Sheets** (free) - Manual tracking, lightweight

---

## Success Metrics

### 30-Day Goals
- ✅ GA4 installed and tracking sign-ups
- ✅ 10+ custom events implemented
- ✅ Google Search Console connected
- ✅ Weekly dashboard template created
- ✅ First insights documented (top traffic source identified)

### 60-Day Goals
- ✅ Hotjar installed, 20+ session recordings analyzed
- ✅ Attribution tracking working (UTM parameters)
- ✅ Retention cohorts visible (D7, D30 tracked)
- ✅ A/B test #1 completed (homepage headline)
- ✅ Clear correlation: Channel X → Activation Rate Y

### 90-Day Goals
- ✅ All key metrics in weekly dashboard
- ✅ 3+ A/B tests run, 1+ winning variant implemented
- ✅ LTV/CAC ratio calculated (target: 3:1)
- ✅ Data-driven roadmap priorities (top 3 features based on engagement)
- ✅ Automated weekly report (email with key metrics)

---

## Document Version

**Version**: 1.0
**Created**: 2025-01-25
**Last Updated**: 2025-01-25
**Next Review**: End of Week 1 (after GA4 setup)

**Owner**: Solo Dev + AI Assist
**Updated**: Weekly based on new insights and tool additions
