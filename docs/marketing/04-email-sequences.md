# Email Marketing Sequences
## Nurture Campaigns for Audiolux User Acquisition & Retention

**Owner**: Solo Dev + AI Assist
**Tool**: Mailchimp (free tier: 500 contacts) or Loops.so (dev-friendly)
**Goal**: Convert sign-ups → active users → Pro subscribers

---

## Email Marketing Strategy

### Core Principles
- **Value-first**: Every email teaches something useful
- **Progressive disclosure**: Introduce features gradually
- **Personal tone**: Solo founder voice, not corporate
- **Clear CTAs**: One primary action per email
- **Accessible**: Plain text + images with alt tags
- **Mobile-optimized**: 60%+ of opens on mobile

### Sequence Overview

| Sequence | Trigger | Length | Goal | Conversion Target |
|----------|---------|--------|------|-------------------|
| Welcome Series | Sign-up | 7 days, 5 emails | Activation | First project created |
| Free to Pro | 30 days on free | 7 days, 4 emails | Conversion | Pro subscription |
| Onboarding Nurture | No activity 7 days | Ongoing | Re-engagement | Return to app |
| Pro Churn Prevention | Low activity Pro user | 7 days, 3 emails | Retention | Re-engage Pro user |
| Win-Back | Inactive 60 days | 14 days, 3 emails | Reactivation | Return visit |

---

## Sequence 1: Welcome Series (New User Onboarding)

**Trigger**: User creates account
**Goal**: Get user to create first project and experience "aha moment"
**Emails**: 5 over 7 days

### Email 1: Welcome + Quick Start (Day 0 - immediately after sign-up)

**Subject**: "Welcome to Audiolux! Let's make your first beat 🎵"

**Preview Text**: "Get started in 60 seconds with our interactive tour"

**Body**:
```
Hi [First Name],

Welcome to Audiolux! 🎉

I'm [Your Name], the creator of Audiolux. I built this tool because I believe music creation should be visual, collaborative, and accessible to everyone—especially the Deaf community.

**Let's get you creating in 60 seconds:**

👉 [Load Your Studio] → jam.audiolux.app

**New here? Try this:**
1. Click "Drum Sequencer" to load a module
2. Click squares to create a beat pattern
3. Hit the play button
4. You just made music visually! 🎶

**What makes Audiolux different?**
- ✅ Visual music creation (no hearing required)
- ✅ Color-coded music theory
- ✅ Real-time collaboration
- ✅ Modular workspace (load only what you need)

**Your first challenge:**
Create a 4-bar drum pattern and save your first project.

I'll check in tomorrow with a tutorial on chord progressions.

Questions? Just hit reply—I read every email.

Let's make some music!

[Your Name]
Creator, Audiolux

P.S. Follow our journey on Twitter: @audiolux_app
```

**CTA**: [Load Your Studio] button (primary, large, centered)

**Technical**:
- Plain text version included (accessibility)
- Alt tags on all images/buttons
- UTM tracking: ?utm_source=email&utm_medium=welcome-1&utm_campaign=onboarding

---

### Email 2: First Tutorial - Chord Builder (Day 1)

**Subject**: "Day 2: Build your first chord progression (no theory needed)"

**Preview Text**: "Visual music theory in 3 minutes"

**Body**:
```
Hey [First Name],

Hope you had fun with the Drum Sequencer yesterday!

Today, let's tackle something music producers spend years learning: **chord progressions**.

**But here's the secret:**
You don't need to know music theory. Just pick colors.

**3-minute tutorial: Building Chords Visually**

[Embedded GIF showing Chord Builder in action]

**Try this right now:**
1. Load "Chord Builder" module
2. See the color wheel? Each color is a note
3. Click 3 colors to create a chord
4. Click "Play" to hear it
5. Add 3 more chords to create a progression

**Pro tip:**
Colors close together = harmonious sound
Colors far apart = tension/excitement

👉 [Try Chord Builder Now] → jam.audiolux.app?module=chord-builder

**Real user story:**
"I'm Deaf and never thought I could 'create' music. Audiolux changed that. Seeing the patterns visually made it click." - Sarah M., Bassist

Tomorrow: Adding melody to your progression

Creating with you,
[Your Name]

P.S. Stuck? Our Discord community is here to help: [Discord link]
```

**CTA**: [Try Chord Builder Now] button

**Technical**:
- GIF optimized < 2MB
- Fallback static image for email clients blocking GIFs
- UTM: ?utm_source=email&utm_medium=welcome-2&utm_campaign=onboarding&utm_content=chord-builder

---

### Email 3: Adding Melody (Day 3)

**Subject**: "Day 3: Turn chords into a full track 🎹"

**Preview Text**: "Add melody with the Melody Sequencer"

**Body**:
```
[First Name], you're on day 3!

You've got rhythm (drums) and harmony (chords).

Now let's add the final piece: **melody**.

**Today's tool: Melody Sequencer**

This is where Audiolux really shines—you can *see* how melody fits with chords.

[Embedded video thumbnail: 60-second tutorial]
👉 [Watch: Adding Melody in 60 Seconds]

**Quick steps:**
1. Load your chord progression from yesterday
2. Add "Melody Sequencer" module
3. Click steps to create a melody
4. Watch it sync with your chords visually
5. Adjust until it sounds (and looks!) right

**Visual tip:**
Melody notes that match chord colors = "safe" sound
Melody notes in-between colors = "spicy" sound

**Your challenge:**
Create a 8-bar loop with drums + chords + melody.

[Try Melody Sequencer] → jam.audiolux.app?module=melody-sequencer

**Feature you might not know:**
You can drag modules around to organize your workspace. Try it!

Tomorrow: Collaborating with friends in real-time

Keep creating,
[Your Name]

P.S. What module should we build next? Reply and tell me!
```

**CTA**: [Watch Tutorial] (secondary), [Try Melody Sequencer] (primary)

---

### Email 4: Collaboration (Day 5 - skip Day 4 to avoid fatigue)

**Subject**: "Jam with friends anywhere in the world 🌎"

**Preview Text**: "Real-time music collaboration is wild"

**Body**:
```
Hey [First Name],

You've been creating solo. But music is better together.

Today: **Real-time jam sessions**.

This feature blew my mind when we first got it working. You can literally see and hear what your friend is creating as they create it.

**How it works:**
1. Click "Join/Create Jam Session" in Studio
2. Share your session code (e.g., "JAZZ-MOON-42")
3. Friends join from anywhere in the world
4. You're all editing the same project, live

[Embedded GIF: Two users jamming together]

**Use cases we've seen:**
- Long-distance band practice
- Music teacher + student lessons
- Deaf + hearing musicians collaborating
- "Beat battles" with friends

**Your challenge:**
Invite one friend to jam with you this week.

[Start a Jam Session] → jam.audiolux.app?action=create-session

**Pro tip:**
Use voice/video chat (Zoom, Discord) alongside Audiolux for the full experience.

Tomorrow: Leveling up with keyboard shortcuts

Music is connection,
[Your Name]

P.S. Share your collaboration on Twitter and tag @audiolux_app—we'll retweet you!
```

**CTA**: [Start a Jam Session] button

---

### Email 5: Power User Tips + Upgrade Path (Day 7)

**Subject**: "You're crushing it! Here are 5 power user tips ⚡"

**Preview Text**: "Plus: How to unlock unlimited projects"

**Body**:
```
[First Name], it's been a week!

You've learned:
✅ Drum patterns
✅ Chord progressions
✅ Melody creation
✅ Real-time collaboration

**You're officially an Audiolux power user.** 🎉

**5 shortcuts to level up:**

1. **Cmd/Ctrl + M**: Quickly open module menu
2. **Drag module title bars**: Reorder your workspace
3. **Click module titles**: Minimize/expand modules
4. **Shift + Click**: Multi-select steps in sequencers
5. **Cmd/Ctrl + S**: Save project (auto-saves too!)

[Watch: Power User Workflow (2 min)]

**You've created [X] projects so far.**

On the free tier, you can save up to 3 projects. Here's what Pro unlocks:

**Audiolux Pro ($9.99/month)**
- ✅ Unlimited projects
- ✅ Private jam sessions (up to 10 people)
- ✅ Export to WAV/MP3
- ✅ Advanced MIDI mapping
- ✅ Early access to new modules
- ✅ Remove Audiolux branding

[Upgrade to Pro - 7-Day Free Trial] → audiolux.app/pro

**Or keep creating for free!**

The free tier isn't going anywhere. We built Audiolux to be accessible first, profitable second.

**What's next?**

I'll send occasional emails with:
- New feature announcements
- Community highlights (maybe you!)
- Music production tips
- Behind-the-scenes updates

You can adjust email preferences here: [Preferences Link]

Thanks for being an early Audiolux user. Your feedback shapes where we go next.

Keep making music,
[Your Name]

P.S. What would make Audiolux better for YOU? Hit reply and tell me. I read every response.
```

**CTAs**:
- [Upgrade to Pro] (primary)
- [Watch Power User Tips] (secondary)
- [Email Preferences] (footer link)

---

## Sequence 2: Free to Pro Conversion (30-Day Upgrade Nurture)

**Trigger**: User has been on free tier for 30 days + created 3+ projects
**Goal**: Convert to Pro subscription
**Emails**: 4 over 7 days

### Email 1: Unlock More (Day 30)

**Subject**: "You're awesome! Here's what you've created 🎵"

**Body**:
```
[First Name],

You've been creating on Audiolux for a month!

**Your stats:**
- 🎶 [X] projects created
- ⏱️ [X] hours in Studio
- 👥 [X] jam sessions joined
- 🔥 Favorite module: [Most-used module]

**You're hitting the free tier limit...**

You've used [X] of 3 project slots. Once you hit 3, you'll need to delete old projects to make room for new ones.

**Here's what Pro unlocks:**

✅ Unlimited projects (never delete again)
✅ Export your music (WAV, MP3, MIDI files)
✅ Private jam sessions (up to 10 collaborators)
✅ Advanced features (MIDI mapping, custom presets)
✅ Early access to new modules
✅ Priority support

**Just $9.99/month. Try it free for 7 days.**

[Start Free Trial] → audiolux.app/pro

**Not ready? No problem!**

You can keep creating on the free tier. We're not going anywhere.

Questions about Pro? Just reply to this email.

Keep creating,
[Your Name]
```

**CTA**: [Start Free Trial] (primary, 7-day trial emphasized)

---

### Email 2: Export Your Music (Day 32)

**Subject**: "Unlock export: Share your music with the world"

**Body**:
```
Hey [First Name],

Quick question: Have you wanted to share your Audiolux creations outside the app?

**With Pro, you can export your projects as:**
- WAV files (lossless, studio quality)
- MP3 files (share on Spotify, SoundCloud, anywhere)
- MIDI files (continue editing in other DAWs)

**Real user story:**

"I created a track in Audiolux, exported as MIDI, and finished it in Ableton. The visual creation got me 80% there, way faster than starting from scratch." - Mike R., Producer

**Other Pro perks you unlock:**
- Unlimited project storage
- Private jam sessions
- Advanced MIDI features
- Remove Audiolux branding

**$9.99/month. First 7 days free.**

[Try Pro Free for 7 Days] → audiolux.app/pro?utm_source=email&utm_campaign=free-to-pro-export

**Alternatively:**

If you're a student, educator, or working on an open-source project, reply to this email. We have special pricing.

Making music together,
[Your Name]
```

**CTA**: [Try Pro Free] (primary)

---

### Email 3: What's Holding You Back? (Day 35 - Survey)

**Subject**: "Quick question: What's holding you back from Pro?"

**Body**:
```
[First Name],

I noticed you haven't upgraded to Pro yet, and that's totally cool!

But I'm curious: **What's holding you back?**

[Take 30-Second Survey] → Quick 3-question survey

**Your answer helps us:**
- Improve Audiolux for everyone
- Offer better pricing/plans
- Build features you actually want

**As a thank-you:**
Everyone who completes the survey gets entered to win a **free year of Pro** (10 winners, selected Feb 1st).

**The 3 questions:**
1. What would make you upgrade to Pro?
2. Is pricing a factor? (If so, what feels fair?)
3. What feature would you pay for?

Takes 30 seconds: [Take Survey]

Appreciate your honesty,
[Your Name]

P.S. Your feedback directly shapes our roadmap. We're building for users, not investors.
```

**CTA**: [Take Survey] (primary - links to Typeform/Google Forms)

**Survey questions**:
1. What would make you upgrade to Pro? (Multiple choice + "Other")
   - [ ] Unlimited projects
   - [ ] Export capability
   - [ ] Private jam sessions
   - [ ] Advanced MIDI features
   - [ ] Other: _____

2. Is $9.99/month too expensive? (Scale 1-5)
   - 1 (Way too expensive) → 5 (Seems fair)

3. What's the maximum you'd pay per month? (Open text)

4. What feature would you pay for that we don't offer yet? (Open text)

---

### Email 4: Last Chance Offer (Day 37)

**Subject**: "Last chance: 20% off Pro (this week only)"

**Body**:
```
[First Name],

I don't usually do discounts, but you've been creating on Audiolux for over a month and I want to reward that.

**20% off Pro for your first 3 months.**

That's $7.99/month instead of $9.99/month.

**Here's what you get:**
✅ Unlimited projects
✅ Export to WAV/MP3/MIDI
✅ Private jam sessions
✅ Advanced MIDI mapping
✅ Early access to all new modules

**This offer expires in 7 days** (Feb 4th, 11:59pm).

[Claim 20% Off Pro] → audiolux.app/pro?discount=EARLY20

**Why upgrade now?**
- You're hitting the free tier project limit
- You'll get all future Pro features at this discounted rate
- You'll help fund development (we're bootstrapped!)

**Not interested? No worries.**

I won't send another Pro pitch for 60 days. You'll still get:
- Feature announcements
- Community highlights
- Tips & tricks

Keep making music,
[Your Name]

P.S. This discount is just for early users like you. Thanks for being here from the start.
```

**CTA**: [Claim 20% Off] (primary, urgency emphasized)

**Technical**:
- Discount code: EARLY20 (20% off for 3 months, one-time use)
- Expires: 7 days from send date

---

## Sequence 3: Onboarding Nudge (No Activity After 7 Days)

**Trigger**: User signed up but hasn't created a project in 7 days
**Goal**: Re-engage and get them to first "aha moment"
**Emails**: 3 over 14 days

### Email 1: We Miss You! (Day 7 after sign-up, 0 projects)

**Subject**: "We miss you! Need help getting started?"

**Body**:
```
Hey [First Name],

I noticed you signed up for Audiolux but haven't created anything yet.

**What's stopping you?**

👉 [Take 1-Min Survey] - Tell me what's confusing/blocking you

**Or, let me help:**

**New to music production?**
[Watch: Complete Beginner Tutorial (5 min)] - Start here

**Not sure where to start?**
[Load a Template Project] - Remix an existing track

**Want a personal tour?**
[Schedule 15-Min Demo Call] - I'll walk you through it live

Audiolux is most valuable when you're actually creating. Let me help you get there.

[Your Name]
Creator, Audiolux

P.S. If Audiolux isn't for you, that's okay! Unsubscribe below.
```

**CTAs**: Multiple options based on different blockers

---

### Email 2: Social Proof (Day 10)

**Subject**: "See what others are creating on Audiolux"

**Body**:
```
[First Name],

Sometimes the best way to learn is seeing what others create.

**3 projects made by Audiolux users this week:**

[Project 1: Screenshot + audio player]
"Chill Lo-Fi Beat" by Sarah M.
Created with: Drum Sequencer + Chord Builder + Melody Sequencer

[Project 2: Screenshot + audio player]
"Uplifting House Track" by Alex P.
Created with: Piano Roll + DJ Visualizer

[Project 3: Screenshot + audio player]
"Ambient Soundscape" by Jordan L.
Created with: Chord Builder + custom MIDI controller

**Your turn:**

Pick one of these projects and try to recreate it. You'll learn way faster by doing.

[Load Studio and Try] → jam.audiolux.app

Still stuck? Reply to this email with what's confusing you.

[Your Name]
```

---

### Email 3: Last Nudge (Day 14)

**Subject**: "Should I remove you from the list?"

**Body**:
```
[First Name],

You signed up 2 weeks ago but haven't created anything yet.

I don't want to spam you if Audiolux isn't useful.

**Two options:**

**Option 1: Give Audiolux one more shot**
[Try 60-Second Tutorial] - I promise you'll create something

**Option 2: Let me know why it didn't work**
[1-Min Feedback Form] - Help me improve for others

**Option 3: Unsubscribe**
[Unsubscribe] - No hard feelings

If I don't hear from you, I'll stop sending onboarding emails (but you'll still get occasional feature announcements).

Thanks for giving Audiolux a try,
[Your Name]
```

---

## Sequence 4: Pro Churn Prevention (Low Activity Pro User)

**Trigger**: Pro subscriber hasn't logged in for 14 days
**Goal**: Re-engage before they cancel
**Emails**: 3 over 7 days

### Email 1: We Miss You (Day 14 of inactivity)

**Subject**: "We miss you! What can we improve?"

**Body**:
```
Hi [First Name],

I noticed you haven't logged into Audiolux in a couple weeks.

As a Pro subscriber, I want to make sure you're getting value.

**Quick question:**

What would make Audiolux more valuable for you?
[Take 2-Min Survey]

**As a thank-you:**
We'll add 1 month free to your Pro subscription just for providing feedback.

Alternatively, if you want to chat about how to get more out of Audiolux, reply to this email or [Schedule a Call].

We're here to help,
[Your Name]

P.S. If you're thinking of canceling, please tell me why first. I want to make it right.
```

---

### Email 2: New Features (Day 16)

**Subject**: "Here's what's new since you last visited"

**Body**:
```
[First Name],

In case you've been busy, here's what's new in Audiolux:

**New This Month:**
- ✨ Ultra-wide monitor support (3440px+)
- ✨ Drag-and-drop module reordering
- ✨ Click-to-minimize/expand modules
- ✨ Improved MIDI latency (30% faster response)

[See What's New] → jam.audiolux.app?utm_source=email&utm_campaign=churn-prevention

**Pro members also got:**
- Private jam session improvements
- Export quality upgrades (32-bit float WAV)
- Priority customer support via Discord

**Your projects are waiting for you:**
- [Project 1 Name] - Last edited [Date]
- [Project 2 Name] - Last edited [Date]
- [Project 3 Name] - Last edited [Date]

Hope to see you back in Studio soon!

[Your Name]
```

---

### Email 3: Special Offer (Day 21)

**Subject**: "Stay Pro, get 2 months free"

**Body**:
```
[First Name],

I really don't want you to cancel your Pro subscription.

**Here's my offer:**

Stay subscribed for 3 more months, and I'll give you **2 months free** (so you're only paying for 1).

**Why this offer?**

Honestly? I want you to experience the new features we're launching soon:
- Collaborative project editing (real-time Google Docs for music)
- AI-assisted chord suggestions
- Mobile app (beta)

[Claim 2 Months Free] → audiolux.app/pro/retention-offer

**Alternatively:**

If Pro isn't meeting your needs, let's talk. Reply to this email or [Schedule a Call] and I'll personally help you get more value.

Last option: Want to downgrade to Free? [Manage Subscription]

Thanks for being a Pro member,
[Your Name]

P.S. This offer expires in 5 days. After that, your subscription will auto-renew at the regular rate or you can cancel.
```

---

## Sequence 5: Win-Back (Inactive 60+ Days)

**Trigger**: User hasn't logged in for 60 days
**Goal**: Bring them back with new features or use cases
**Emails**: 3 over 14 days

### Email 1: We've Changed (Day 60)

**Subject**: "Audiolux is way better than when you left"

**Body**:
```
[First Name],

It's been 2 months since you last used Audiolux.

A lot has changed. Here's what you missed:

**Big Updates:**
- ✨ [Major Feature 1]
- ✨ [Major Feature 2]
- ✨ [Major Feature 3]
- ✨ [User-requested feature]

[See What's New] → jam.audiolux.app/changelog

**Your account is still active:**
- Your projects are saved and waiting
- Your settings are preserved
- Free tier is still free (always will be)

Give us another shot?

[Come Back to Studio] → jam.audiolux.app

[Your Name]
```

---

### Email 2: Community Showcase (Day 67)

**Subject**: "You won't believe what the community is creating"

**Body**:
```
Hey [First Name],

While you've been away, the Audiolux community has been *creating*.

**This week's highlights:**

[User Creation 1: Audio + visual]
[User Creation 2: Audio + visual]
[User Creation 3: Audio + visual]

**Plus:**
- 500+ active users creating daily
- 2,000+ projects created
- 100+ jam sessions happening weekly

The community would love to have you back.

[Rejoin the Community] → jam.audiolux.app

[Your Name]
```

---

### Email 3: Final Goodbye (Day 74)

**Subject**: "This is goodbye (unless you want to stay)"

**Body**:
```
[First Name],

This is my last email.

You haven't been active in 2+ months, and I respect your time.

**Before you go:**

1. Want to stay on the list for major announcements only?
   [Switch to Announcements Only]

2. Want to delete your account and all data?
   [Delete My Account]

3. Want to give Audiolux one more try?
   [Come Back to Studio]

4. Want to tell me why you left?
   [1-Min Feedback Survey]

If I don't hear from you, I'll automatically move you to "announcements only" (1 email per quarter).

Thanks for trying Audiolux,
[Your Name]

P.S. Your projects will remain saved for 1 year in case you come back.
```

---

## Email Design Guidelines

### Template Structure
```
Header
- Logo (left-aligned, 150px wide)
- Navigation links (optional: Discord, Twitter, Blog)

Body
- Plain text style (personal feel, not corporate)
- Max width: 600px (mobile-friendly)
- Font: System sans-serif (Arial, Helvetica) for accessibility
- Line height: 1.6 (readability)
- Paragraph spacing: 1.5em

Primary CTA
- Button style: 48px height, 200-300px width, centered
- Color: Primary brand color (high contrast)
- Font size: 16px, bold
- Margin: 30px top/bottom

Images/GIFs
- Max width: 600px (fit email width)
- Alt text on all images
- Fallback static image for GIF-blocking clients

Footer
- Unsubscribe link (required by law)
- Email preferences link
- Physical address (required by CAN-SPAM)
- Social media icons
- Copyright notice
```

### Accessibility Checklist
- [ ] Plain text version for all HTML emails
- [ ] Alt text on all images
- [ ] High contrast text (min 4.5:1 ratio)
- [ ] No reliance on color alone to convey info
- [ ] Descriptive link text (not "click here")
- [ ] Semantic HTML (headings, lists, etc.)

---

## Email Metrics to Track

### Key Performance Indicators (KPIs)

**Email-Level Metrics**:
- Open rate (target: 25-35%)
- Click-through rate (target: 5-15%)
- Conversion rate (target: 2-5% for upgrade emails)
- Unsubscribe rate (target: <0.5%)
- Bounce rate (target: <2%)

**Sequence-Level Metrics**:
- Sequence completion rate (% who receive all emails)
- Time to conversion (from first email to action)
- Revenue per email (for Pro upgrade sequences)

**Business Impact**:
- Email → sign-up conversion (welcome series)
- Email → activation (first project created)
- Email → Pro upgrade (free-to-pro sequence)
- Email → retention (churn prevention success rate)

### Monthly Email Report Template

| Sequence | Emails Sent | Open Rate | CTR | Conversions | Revenue |
|----------|-------------|-----------|-----|-------------|---------|
| Welcome Series | 150 | 35% | 12% | 15 (10%) | $0 |
| Free to Pro | 40 | 28% | 8% | 4 (10%) | $320 |
| Onboarding Nudge | 60 | 22% | 6% | 8 (13%) | $0 |
| Churn Prevention | 10 | 40% | 15% | 3 (30%) | $240 |
| Win-Back | 80 | 18% | 4% | 2 (2.5%) | $0 |

**Total**: 340 emails sent, $560 revenue generated

---

## Tools & Setup

### Recommended Email Service Providers (ESPs)

**Option 1: Mailchimp** (Best for beginners)
- **Free tier**: 500 contacts, 1,000 emails/month
- **Pros**: Easy automation, good templates, beginner-friendly
- **Cons**: Expensive as you scale, limited segmentation on free tier
- **Price**: Free → $13/mo (500-2,500 contacts)

**Option 2: Loops.so** (Best for developers)
- **Free tier**: 2,000 contacts, unlimited emails
- **Pros**: API-first, easy integration, modern UI
- **Cons**: Newer platform, fewer integrations
- **Price**: Free → $29/mo (10K contacts)

**Option 3: ConvertKit** (Best for creators)
- **Free tier**: 1,000 subscribers, unlimited emails
- **Pros**: Creator-focused, great automation, visual automation builder
- **Cons**: More expensive, overkill for simple needs
- **Price**: Free → $25/mo (1K-3K subscribers)

**Recommendation for Audiolux**: Start with **Loops.so** (dev-friendly, generous free tier) or **Mailchimp** (easiest if non-technical).

---

## Integration with Audiolux

### Trigger Events (Send to ESP via API)

**User Actions to Capture**:
```javascript
// Example: Track email events in Audiolux app

// 1. User signs up
analytics.track('user_signed_up', {
  email: user.email,
  name: user.name,
  signup_date: Date.now()
});
// → Trigger Welcome Series

// 2. User creates first project
analytics.track('first_project_created', {
  email: user.email,
  project_id: project.id
});
// → Tag user as "activated"

// 3. User hits free tier limit (3 projects)
analytics.track('free_tier_limit_reached', {
  email: user.email,
  days_since_signup: 30
});
// → Trigger Free to Pro sequence

// 4. User hasn't logged in for 7 days
// (Server-side cron job checks daily)
if (daysSinceLastLogin === 7 && projectsCreated === 0) {
  analytics.track('user_inactive_7_days', {
    email: user.email
  });
  // → Trigger Onboarding Nudge
}

// 5. Pro user cancels subscription
analytics.track('pro_subscription_cancelled', {
  email: user.email,
  reason: cancellation_reason
});
// → Don't send more Pro upgrade emails
```

### Segmentation Strategy

**User Segments**:
- **New Users (0-7 days)**: Welcome Series
- **Active Free (8-30 days, 1+ projects)**: General nurture, occasional Pro offers
- **Free Tier Power Users (30+ days, 3+ projects)**: Free to Pro sequence
- **Inactive Free (7+ days, 0 projects)**: Onboarding Nudge
- **Pro Active**: Feature announcements, advanced tips
- **Pro Inactive (14+ days no login)**: Churn Prevention
- **Churned (60+ days)**: Win-Back

---

## Success Metrics

### 30-Day Goals
- ✅ Welcome Series sent to 50+ new users
- ✅ 25%+ open rate on welcome emails
- ✅ 10%+ of welcome recipients create first project
- ✅ Email infrastructure set up (Mailchimp/Loops.so)

### 60-Day Goals
- ✅ Free to Pro sequence live, sent to 20+ users
- ✅ 5+ Pro conversions from email sequences
- ✅ <0.5% unsubscribe rate
- ✅ Segmentation working (inactive users tagged correctly)

### 90-Day Goals
- ✅ 10+ Pro conversions from email (target: $800+ MRR from email)
- ✅ 30%+ email-to-activation rate (welcome series → first project)
- ✅ All 5 sequences live and optimized
- ✅ Email = Top 3 acquisition/retention channel

---

## Document Version

**Version**: 1.0
**Created**: 2025-01-25
**Last Updated**: 2025-01-25
**Next Review**: End of Week 4 (Feb 21, 2025)

**Owner**: Solo Dev + AI Assist
**Updated**: Monthly based on email performance metrics
