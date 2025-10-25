<!-- Powered by BMAD™ Core -->

# create-persona

Create a new user persona document with demographics, pain points, goals, user journey, and success metrics. Personas inform PRD creation, UX design, and QA testing.

## Inputs

```yaml
required:
  - persona_code: 'Single letter code (m/d/e/v/p/i or new)'
  - persona_name: 'User-facing name (e.g., "Musician", "Educator")'
optional:
  - persona_file: 'docs/personas/{code}-{slug}.md' # Auto-generated if not provided
  - template: 'persona-tmpl.yaml' # Default template
  - elicit: true # Elicit details from user interactively
```

## Purpose

Personas are foundational documents that:
- Inform PRD creation (target user needs)
- Guide UX design decisions (user journey mapping)
- Enable persona-driven QA testing (realistic user perspective)
- Align team on who we're building for

**When to create personas:**
- New product or feature (greenfield)
- Entering new market segment
- Significant pivot in target audience
- UX testing reveals missing persona

## Prerequisites

- Market research completed (or available)
- Competitive analysis (understand existing solutions)
- User interviews (if available)

## Process

### Step 1: Determine Persona Code

If creating a new persona (not m/d/e/v/p/i), choose a single-letter code:

**Existing codes:**
- `m` = Musician
- `d` = Deaf/HOH Person
- `e` = Educator
- `v` = Visual Learner
- `p` = Producer
- `i` = Enterprise/Institution

**For new personas**, choose a letter that:
- Represents the persona name clearly
- Doesn't conflict with existing codes
- Is memorable and intuitive

### Step 2: Elicit Persona Details (if elicit=true)

Use interactive prompts to gather details:

#### Demographics
```
Who is this persona?
- Age range:
- Experience level (beginner/intermediate/advanced):
- Budget (free/paid tier, price point):
- Primary platforms (where do they hang out?):
```

#### Pain Points
```
What frustrates them about current solutions?
- List 3-5 pain points in their own words:
  1. "I just want to..."
  2. "Why do I have to..."
  3. "I can't believe there's no..."
```

#### Goals
```
What do they want to accomplish?
- Primary goal:
- Secondary goals:
- Long-term aspirations:
```

#### User Journey
```
How do they discover and adopt our product?
- Hook (3-5 sec): What gets their attention?
- Tutorial (30-60 sec): What do they experience first?
- Celebration (5 sec): What success do they achieve?
```

#### Success Metrics
```
How do we measure success with this persona?
- Engagement metric (e.g., tutorial completion %):
- Conversion metric (e.g., free to paid %):
- Retention metric (e.g., return within 7 days %):
```

#### Outreach Targets
```
Where do we find this persona?
- Communities (Reddit, Discord, Facebook, etc.):
- Influencers (key advocates):
- Conferences/events:
```

### Step 3: Generate Persona Document

Using the template (persona-tmpl.yaml), create structured markdown file:

**File location:** `docs/personas/{code}-{slug}.md`

Example: `docs/personas/m-musician.md`

**Required sections:**
1. Header (code, URL parameter, budget, example URL)
2. Who They Are
3. Demographics
4. Pain Points
5. Goals
6. User Journey
7. Messaging (headline, subhead, CTA)
8. Success Metrics
9. Outreach Targets
10. Tutorial Modules Used
11. Language Preferences (YES/NO terms)
12. Bailout Triggers (what makes them quit)
13. What Makes Them Trust Us
14. What Makes Them Convert (or Advocate)

**Optional sections (context-dependent):**
- Specific Needs Addressed (for accessibility personas)
- Community Influence Potential (for advocacy personas)
- Pricing Tiers (for paid personas)
- Decision-Making Process (for enterprise personas)
- ROI Calculation (for enterprise personas)

### Step 4: Update Persona README

Add new persona to `docs/personas/README.md`:

**In "Persona Quick Reference" table:**
```markdown
| Code | Persona | Primary Need | Budget | Location |
|------|---------|--------------|--------|----------|
| `x` | New Persona | What they want | Price | [x-slug.md](x-slug.md) |
```

**In "URL Code Mapping" table:**
```markdown
| Persona | Code | Example URL |
|---------|------|-------------|
| New Persona | `x` | jam.audiolux.app?v=x&r=hash |
```

### Step 5: Cross-Reference with Existing Personas

Check for overlap with existing personas:

**Ask:**
- Does this persona share journey modules with others?
- Can they be combined (e.g., "Deaf Educator" = d + e)?
- Are there unique needs that require separate persona?

**Update README reusable modules table** if new journey components introduced.

### Step 6: Validation Against Research

If market research or community research exists:

1. **Map persona to communities**: Which communities does this persona belong to?
2. **Identify influencers**: Who are key advocates for this persona?
3. **Validate pain points**: Do research findings support these frustrations?
4. **Confirm messaging**: Does headline/subhead resonate with persona language?

**Document validation** in persona file under "Community Research Alignment" section.

### Step 7: Output Summary

Print summary for user:

```
✅ Persona Created: {persona_name} ({code})

File: docs/personas/{code}-{slug}.md
URL Parameter: ?v={code}
Example: jam.audiolux.app?v={code}&r=hash

Key Details:
- Budget: {budget}
- Primary Need: {primary_need}
- Tutorial Modules: {modules_list}
- Success Metric: {key_metric}

Outreach Targets:
- {community_1}
- {community_2}
- {influencer_1}

Next Steps:
1. Reference in PRDs: @pm *create-prd (mention persona in target audience)
2. Design UX flow: @ux-expert (create persona-specific onboarding)
3. QA testing: @qa *ux-review {story} --persona={code}
```

## Integration with BMAD Workflows

### PM Workflow
When creating PRDs, reference personas:

```markdown
## Target Audience

Primary: Musician (m) - wants quick beat creation
Secondary: Producer (p) - needs advanced features

See: docs/personas/m-musician.md, docs/personas/p-producer.md
```

### UX Workflow
When designing flows, use persona journey:

```markdown
## User Journey (Musician Persona)

1. Hook (3 sec): "Make a beat in 30 seconds"
2. Quick Beat (25 sec): Load drum sequencer, tap pattern
3. Celebration (5 sec): "You made music!"

See: docs/personas/m-musician.md#user-journey
```

### QA Workflow
When testing UX, embody persona:

```bash
@qa *ux-review 22.1 --persona=m
# Reads docs/personas/m-musician.md to understand persona context
```

## Template Fields Explained

**persona_code**: Single letter (m/d/e/v/p/i or new)
**persona_name**: User-facing name ("Musician", "Educator")
**persona_slug**: Filename slug (auto-generated from name)
**primary_need**: What they want in one sentence
**budget**: Free, $10/mo, $199/yr, etc.
**age_range**: Demographic age range
**platforms**: Where they hang out (Reddit, Discord, etc.)
**pain_points**: 3-5 frustrations in their own words
**goals**: What they want to accomplish
**journey_hook**: First 3-5 seconds (what grabs attention)
**journey_tutorial**: 30-60 second experience (what they do)
**journey_celebration**: 5 second win (what they achieve)
**headline**: Marketing headline for this persona
**subhead**: Supporting headline detail
**cta**: Call to action
**success_metrics**: How we measure success (engagement, conversion, retention)
**outreach_targets**: Communities, influencers, conferences
**modules_used**: Tutorial modules from reusable library
**language_yes**: Terms/phrases that resonate (use these)
**language_no**: Terms/phrases that alienate (avoid these)
**bailout_triggers**: What makes them quit
**trust_factors**: What makes them trust us
**conversion_factors**: What makes them convert/advocate

## Key Principles

- **User Language First** - Write pain points and goals in persona's voice, not marketing speak
- **Specificity Over Generality** - "I can't collaborate with my friend 200 miles away" > "Lacks collaboration"
- **Actionable Insights** - Every section should inform product/UX/QA decisions
- **Research-Grounded** - Base personas on real user research, not assumptions
- **Living Documents** - Update personas as we learn more from users
- **Cross-Team Alignment** - Personas used by PM, UX, Dev, and QA

## Blocking Conditions

Stop and request clarification if:

- No market research available (personas would be assumptions)
- Persona overlaps 100% with existing persona (suggest combining instead)
- Persona code conflicts with existing code
- User journey is unclear or too generic

## Completion

After persona created:

1. File saved: `docs/personas/{code}-{slug}.md`
2. README updated with new persona
3. Output summary printed for user
4. Recommend next steps:
   - Create PRD referencing persona
   - Design UX flow for persona
   - Plan QA testing with persona
