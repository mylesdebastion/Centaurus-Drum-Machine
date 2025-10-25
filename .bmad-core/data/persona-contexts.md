<!-- Powered by BMAD™ Core -->

# persona-contexts

**IMPORTANT**: This file is a reference pointer to canonical persona documents. For full persona details, see `docs/personas/{code}-*.md`.

## Canonical Persona Locations

Personas are now stored in the project's `docs/personas/` directory following BMAD greenfield conventions:

| Code | Persona | Location |
|------|---------|----------|
| `m` | Musician | [docs/personas/m-musician.md](../../docs/personas/m-musician.md) |
| `d` | Deaf/HOH Person | [docs/personas/d-deaf-hoh.md](../../docs/personas/d-deaf-hoh.md) |
| `e` | Educator | [docs/personas/e-educator.md](../../docs/personas/e-educator.md) |
| `v` | Visual Learner | [docs/personas/v-visual-learner.md](../../docs/personas/v-visual-learner.md) |
| `p` | Producer | [docs/personas/p-producer.md](../../docs/personas/p-producer.md) |
| `i` | Enterprise/Institution | [docs/personas/i-enterprise.md](../../docs/personas/i-enterprise.md) |

## Quick Reference for UX Testing

When performing UX persona reviews (`@qa *ux-review {story} --persona={code}`), use these persona attributes:

### Musician (`m`)
- **Primary Need**: Make music easily, no installation
- **Pain Points**: "I just want to make a beat, not learn a PhD program"
- **Bailout Triggers**: Tutorial >5 steps, technical jargon appears early, configuration before sound
- **Language YES**: Jam, beat, loop, tempo, create, play
- **Language NO**: MIDI configuration, buffer settings, sample rate

### Deaf/HOH Person (`d`)
- **Primary Need**: Accessible music experience without hearing
- **Pain Points**: "Everything is designed for hearing people"
- **Bailout Triggers**: Any step requiring hearing, audio-only tutorials, no visual feedback
- **Language YES**: See the music, colors show pitch, visual patterns
- **Language NO**: Listen to, hear the difference, audio settings

### Educator (`e`)
- **Primary Need**: Teach music visually in inclusive classrooms
- **Pain Points**: "I need something that works on Chromebooks without tech support"
- **Bailout Triggers**: Requires installation, not accessible for diverse students
- **Language YES**: Classroom-ready, inclusive, accessible, Chromebook-compatible
- **Language NO**: Installation required, IT setup, technical support needed

### Visual Learner (`v`)
- **Primary Need**: Learn music by seeing patterns, no notation
- **Pain Points**: "I can't read sheet music", "I need to SEE it to understand"
- **Bailout Triggers**: Traditional notation appears, text-heavy explanations
- **Language YES**: See the pattern, visual grid, colors show pitch
- **Language NO**: Read the notation, sheet music, staff notation

### Producer (`p`)
- **Primary Need**: Professional browser DAW, portable workflow
- **Pain Points**: "I want Ableton-level features in a browser"
- **Bailout Triggers**: Features feel toy-like, no export options
- **Language YES**: Modular, DAW, workflow, stems, export, automation
- **Language NO**: Simple, beginner-friendly, basic, starter

### Enterprise/Institution (`i`)
- **Primary Need**: Scalable, accessible education platform
- **Pain Points**: "Traditional software is too expensive and requires IT approval"
- **Bailout Triggers**: No clear pricing, no dedicated support, not accessible
- **Language YES**: Enterprise, scalable, ADA-compliant, ROI, cost savings
- **Language NO**: Experimental, beta, unproven, no support

## How to Create New Personas

Use the Analyst agent:

```bash
@analyst *create-persona
```

This will:
1. Run the `create-persona.md` task
2. Use the `persona-tmpl.yaml` template
3. Interactively gather persona details
4. Save to `docs/personas/{code}-{slug}.md`
5. Update `docs/personas/README.md`

## Integration with BMAD Workflows

**PM Workflow** - Reference personas in PRDs:
```markdown
## Target Audience
Primary: Musician (m) - wants quick beat creation
See: docs/personas/m-musician.md
```

**UX Workflow** - Design flows for personas:
```markdown
## User Journey (Musician Persona)
See: docs/personas/m-musician.md#user-journey
```

**QA Workflow** - Test from persona perspective:
```bash
@qa *ux-review {story} --persona=m
# Reads docs/personas/m-musician.md
```

## Using Personas Effectively in UX Review

### Before Analysis
1. Read full persona document from `docs/personas/{code}-*.md`
2. Note their primary goal and pain points
3. Memorize their bailout triggers
4. Internalize their language preferences (YES/NO terms)

### During Analysis
1. View each screenshot through persona lens
2. Ask: "Would this persona get their goal met?"
3. Use persona voice in quotes: "{Persona} says: '...'"
4. Check against their frustration/bailout triggers

### In Feedback
1. Quote persona voice throughout analysis
2. Explain WHY something fails for THIS persona
3. Add "What Would Help Me" suggestions in persona's words
4. Prioritize issues by persona impact (bailout triggers = CRITICAL)

## Why Personas Are Canonical in docs/personas/

**BMAD Convention**: Domain-specific documentation lives in `docs/{domain}/`:
- PRDs → `docs/prd/`
- Architecture → `docs/architecture/`
- Stories → `docs/stories/`
- **Personas → `docs/personas/`**

**Benefits**:
- Shared across PM, UX, Dev, and QA workflows
- Version-controlled with the project
- Single source of truth (no duplicates)
- Reusable across epics and features

**`.bmad-core/data/` is for**:
- BMAD framework data (technical-preferences.md, ux-analysis-framework.md)
- Workflow reference data (not project-specific personas)

## Migration from Old Structure

**Old location** (deprecated):
- `.bmad-core/data/persona-contexts.md` - Full persona details embedded (542 lines)

**New location** (canonical):
- `docs/personas/{code}-{slug}.md` - Individual persona files
- `docs/personas/README.md` - Overview and reusable modules

**This file now serves as**:
- Quick reference for UX testing
- Pointer to canonical locations
- Migration documentation
