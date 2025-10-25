# Audiolux User Personas

**Version**: 2.0
**Last Updated**: 2025-10-25
**Status**: Active

## Overview

Audiolux serves 6 core personas with reusable journey components. Each persona has distinct needs, budgets, and success metrics, but shares modular tutorial elements for efficient onboarding.

## Design Philosophy

**Problem with v1.0**: "Deaf Musician" combined two separate attributes (hearing status + role), making it too narrow and excluding potential users.

**Solution v2.0**: Separate attributes into distinct personas with **reusable journey components** that combine based on user needs.

**Benefits**:
- More inclusive (Deaf person who doesn't identify as musician yet)
- Efficient (reuse tutorial components across personas)
- Scalable (easy to add new personas or combinations)
- Data-driven (track which combinations convert best)

## Persona Quick Reference

| Code | Persona | Primary Need | Budget | Location |
|------|---------|--------------|--------|----------|
| `m` | Musician | Make music easily | Free/$10/mo | [m-musician.md](m-musician.md) |
| `d` | Deaf/HOH Person | Accessible music experience | Free | [d-deaf-hoh.md](d-deaf-hoh.md) |
| `e` | Educator | Teach music visually | $199/yr | [e-educator.md](e-educator.md) |
| `v` | Visual Learner | Learn by seeing patterns | Free/$10/mo | [v-visual-learner.md](v-visual-learner.md) |
| `p` | Producer | Professional browser DAW | $10/mo | [p-producer.md](p-producer.md) |
| `i` | Enterprise/Institution | Scalable solution for programs | $199-$999/yr | [i-enterprise.md](i-enterprise.md) |

## Reusable Tutorial Modules

Journey components shared across personas for efficient development:

| Module | Used By Personas | Duration | Description |
|--------|------------------|----------|-------------|
| **Quick Beat Creation** | m, p | 20-25s | Drum sequencer, create kick/snare pattern |
| **Visual Music Theory** | d, e, v | 15-20s | Color-coded notes, Chord Builder demo |
| **Accessibility Tour** | d, e, i | 10-15s | Visual feedback, color sequencer, inclusive design |
| **Collaboration Demo** | m, e, p, i | 10-15s | Session link sharing, real-time jam |
| **Color Sequencer** | d, v | 15s | Grid-based pattern creation, no notation |
| **Advanced Features** | p, i | 10-15s | Export, automation, effects preview |
| **Pricing & Support** | i | 10s | Enterprise pricing, demo booking |

## URL Code Mapping

| Persona | Code | Example URL |
|---------|------|-------------|
| Musician | `m` | jam.audiolux.app?v=m&r=ab3c |
| Deaf/HOH Person | `d` | jam.audiolux.app?v=d&r=sc4t |
| Educator | `e` | jam.audiolux.app?v=e&r=se8a |
| Visual Learner | `v` | jam.audiolux.app?v=v&r=dr3m |
| Producer | `p` | jam.audiolux.app?v=p&r=ws9p |
| Enterprise/Institution | `i` | jam.audiolux.app?v=i&r=gl7u |

## Persona Overlap Examples

**Deaf Educator** (d + e):
- Modules: Visual Theory + Accessibility Tour + Collaboration Demo
- Total: 40-50s tutorial
- Messaging: "Teach music visually to Deaf/HOH students"

**Visual Learning Musician** (v + m):
- Modules: Quick Beat + Color Sequencer
- Total: 35-40s tutorial
- Messaging: "Make music by seeing patterns"

**Enterprise Educator** (i + e):
- Modules: Visual Theory + Collaboration + Admin Features + Pricing
- Total: 55-65s tutorial
- Messaging: "Scalable accessible music education"

## Usage in BMAD Workflows

### For Product Managers
Use personas when creating PRDs, epics, and stories:
```bash
@analyst *create-persona {code}  # Create new persona
@pm *create-story                # Reference personas in acceptance criteria
```

### For UX Designers
Reference personas for design decisions and prototypes:
```bash
@ux-expert                       # Design flows for specific personas
```

### For QA Testing
Perform persona-driven UX reviews:
```bash
@qa *ux-review {story} --persona={code}  # Test from persona perspective
```

## Community Research Alignment

**Top 10 Communities Mapped to Personas**:

| Community | Primary Persona | Why |
|-----------|----------------|-----|
| D-PAN (Sean Forbes) | `d` Deaf/HOH Person | Deaf music advocacy |
| Drake Music DMLab | `e` Educator | Accessible music instrument making |
| Scarlet Watters (TikTok) | `d` Deaf/HOH Person | ASL music content creator |
| AAMHL (Facebook) | `d` Deaf/HOH Person | Adult musicians with hearing loss |
| Connected Arts Networks | `e` Educator + `i` Enterprise | Accessible arts education orgs |
| Nordoff Robbins | `i` Enterprise | Music therapy (institutional) |
| Gallaudet University | `e` Educator + `i` Enterprise | Deaf higher ed |
| r/deaf + r/hardofhearing | `d` Deaf/HOH Person | Deaf community discussion |
| Ableton Discord | `p` Producer | Professional beatmakers |
| YouTube Deaf Musicians | `d` Deaf/HOH Person | Deaf music creators |

**Persona Coverage**:
- Deaf/HOH Person (`d`): 6/10 communities
- Educator (`e`): 4/10 communities
- Enterprise (`i`): 3/10 communities
- Producer (`p`): 1/10 communities

**Priority**: Focus `d`, `e`, `i` for initial outreach.

## Related Documentation

- **Marketing Strategy**: [docs/marketing/00-MARKETING-MASTER-PLAN.md](../marketing/00-MARKETING-MASTER-PLAN.md)
- **Community Research**: [docs/audiolux-community-research-2025.md](../audiolux-community-research-2025.md)
- **Epic 22 Implementation**: [docs/epics/epic-22-ai-native-product-led-growth.md](../epics/epic-22-ai-native-product-led-growth.md)
