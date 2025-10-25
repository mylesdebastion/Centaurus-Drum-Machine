# Epic 22 Tools: AI Outreach Generator

## Overview

The **AI Outreach Message Generator** uses Claude API to create personalized outreach messages for product-led growth campaigns. It generates 3 message variations (friendly, professional, brief) with custom persona URLs.

## Setup

### 1. Install Dependencies

```bash
pip install anthropic
```

### 2. Set API Key

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or add to your `.env` file (project root):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

### Option 1: Command Line Arguments

```bash
python tools/outreach_generator.py \
  --name "Sean Forbes" \
  --persona d \
  --platform Instagram \
  --bio "Deaf rapper, musician, and activist" \
  --content "Recent posts about ASL music videos"
```

### Option 2: Config File (Recommended)

```bash
python tools/outreach_generator.py --config tools/targets/sean-forbes.json
```

**Example config** (`tools/targets/sean-forbes.json`):

```json
{
  "name": "Sean Forbes",
  "persona": "d",
  "platform": "Instagram",
  "bio": "Deaf rapper, musician, and activist...",
  "recent_content": "Recent Instagram posts about ASL music videos..."
}
```

## Persona Codes

| Code | Persona | Focus |
|------|---------|-------|
| `m` | Musician | Browser-based music creation |
| `d` | Deaf/HOH Person | Music for everyone. No hearing required. |
| `e` | Educator | Teach music visually |
| `v` | Visual Learner | Music for visual thinkers |
| `p` | Producer/Beatmaker | Professional DAW in browser |
| `i` | Enterprise/Institution | Scalable accessible music education |

## Output

The tool generates:

1. **3 message variations**:
   - **Friendly**: Warm, conversational, personal connection
   - **Professional**: Respectful, concise, value-focused
   - **Brief**: Very short, attention-grabbing, direct

2. **Custom URL** with discrete codes:
   - Format: `jam.audiolux.app?v=d&r=se8a`
   - `v=d` → Deaf/HOH persona tutorial
   - `r=se8a` → Sean Forbes referral hash (first 2 chars of name + 2-char MD5)

3. **JSON output file**:
   - Auto-saved to `tools/outreach/{name}-{persona}.json`
   - Or specify with `--output path/to/file.json`

## Example Output

```
======================================================================
OUTREACH MESSAGES: Sean Forbes
======================================================================

Persona: Deaf/HOH Person (d)
Platform: Instagram
Referral Hash: se8a
URL: jam.audiolux.app?v=d&r=se8a

----------------------------------------------------------------------

**FRIENDLY**

Hey Sean! 👋 Been following your work with D-PAN - the way you make
music accessible for the Deaf community is incredible. I wanted to share
something I think you'd appreciate: Audiolux, a browser-based music tool
where you can SEE music, not just hear it. No hearing required, fully
visual. Would love your feedback! jam.audiolux.app?v=d&r=se8a

----------------------------------------------------------------------

**PROFESSIONAL**

Sean, your advocacy for accessible music technology through D-PAN has
been inspiring. I'd like to introduce you to Audiolux - a visual music
creation platform designed for the Deaf community. Browser-based, no
installation, fully accessible. I believe it aligns with your mission.
jam.audiolux.app?v=d&r=se8a

----------------------------------------------------------------------

**BRIEF**

Sean - visual music tool for the Deaf community. Browser-based, no
hearing required. Thought you'd appreciate it: jam.audiolux.app?v=d&r=se8a

----------------------------------------------------------------------

✅ Saved to: tools/outreach/sean-forbes-d.json
```

## Target Configs

Pre-configured target files in `tools/targets/`:

- `sean-forbes.json` - Deaf rapper, D-PAN founder (Instagram, persona `d`)
- `scarlet-watters.json` - Deaf TikTok creator (TikTok, persona `d`)
- `music-educator-template.json` - Template for educators (Email, persona `e`)

## Workflow

### Week 1-4: Seeding Phase

**Monday**: Generate outreach for 2 targets from Top 10 list

```bash
# Generate for Sean Forbes
python tools/outreach_generator.py --config tools/targets/sean-forbes.json

# Generate for Scarlet Watters
python tools/outreach_generator.py --config tools/targets/scarlet-watters.json
```

**Tuesday**: Review messages, personalize if needed, send

**Wednesday**: Monitor analytics, reply to inbound interest

**Thursday**: Adjust messaging based on conversion data

**Friday**: Weekly retrospective - which personas converting best?

### Daily Time Investment

- **30 minutes** (AI generates messages, you review & send)
- **10 minutes** (Week 5-12, optimization phase)

## Advanced Usage

### Quiet Mode (Save Only)

```bash
python tools/outreach_generator.py --config tools/targets/sean-forbes.json --quiet
```

### Custom Output Path

```bash
python tools/outreach_generator.py \
  --config tools/targets/sean-forbes.json \
  --output campaigns/2025-01/sean-forbes.json
```

### Batch Processing

```bash
#!/bin/bash
# Generate for all targets in tools/targets/
for config in tools/targets/*.json; do
  python tools/outreach_generator.py --config "$config"
done
```

## Referral Tracking

Referral hashes are generated from the target's name:

```python
def generate_referral_hash(name: str) -> str:
    clean_name = name.lower().replace(" ", "-")
    hash_suffix = hashlib.md5(clean_name.encode()).hexdigest()[:2]
    prefix = clean_name[:2]
    return f"{prefix}{hash_suffix}"

# Examples:
# "Sean Forbes" → "se8a"
# "Scarlet Watters" → "sc4t"
# "Gallaudet University" → "gl7u"
```

When a user clicks the URL, Story 22.3 (Analytics) will track:
- Persona code (`v=d`)
- Referral hash (`r=se8a`)
- Tutorial completion rate
- Conversion to Pro

## Troubleshooting

### Error: `anthropic package not installed`

```bash
pip install anthropic
```

### Error: `ANTHROPIC_API_KEY environment variable not set`

```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### Error: `Failed to parse Claude response as JSON`

The tool attempts to extract JSON from markdown code blocks automatically. If this fails, the raw response will be printed for debugging.

## Next Steps

- **Story 22.3**: Analytics dashboard will consume referral codes
- **Story 22.4**: Share modals will use `buildShareURL()` function
- **Week 2-4**: Monitor which personas convert best, double down

## Notes

- Messages are AI-generated but should be reviewed before sending
- Personalize further based on target's recent work (check their social media)
- Discrete URL codes (`?v=d&r=se8a`) look professional, not spammy
- Track results in Story 22.3 analytics dashboard (coming next)
