#!/usr/bin/env python3
"""
AI Outreach Message Generator - Epic 22 Story 22.2

Generates personalized outreach messages for Epic 22 product-led growth.
Uses Claude API to create 3 message variations (friendly, professional, brief)
with custom persona URLs.

Usage:
    python tools/outreach_generator.py --name "Sean Forbes" --persona d --platform Instagram
    python tools/outreach_generator.py --config tools/targets/sean-forbes.json
"""

import argparse
import hashlib
import json
import os
import sys
from typing import Dict, List, Optional

try:
    import anthropic
except ImportError:
    print("Error: anthropic package not installed")
    print("Install with: pip install anthropic")
    sys.exit(1)


# Persona configurations (from src/utils/personaCodes.ts)
PERSONAS = {
    "m": {"title": "Musician", "focus": "Browser-based music creation"},
    "d": {"title": "Deaf/HOH Person", "focus": "Music for everyone. No hearing required."},
    "e": {"title": "Educator", "focus": "Teach music visually"},
    "v": {"title": "Visual Learner", "focus": "Music for visual thinkers"},
    "p": {"title": "Producer/Beatmaker", "focus": "Professional DAW in browser"},
    "i": {"title": "Enterprise/Institution", "focus": "Scalable accessible music education"},
}


def generate_referral_hash(name: str) -> str:
    """Generate discrete referral hash from name (4 chars)"""
    # Simple hash: first 2 chars of first name + first 2 chars of hash
    clean_name = name.lower().replace(" ", "-").replace("'", "")
    hash_suffix = hashlib.md5(clean_name.encode()).hexdigest()[:2]
    prefix = clean_name[:2]
    return f"{prefix}{hash_suffix}"


def build_persona_url(persona_code: str, referral_hash: str, base_url: str = "jam.audiolux.app") -> str:
    """Build shareable URL with persona and referral codes"""
    return f"{base_url}?v={persona_code}&r={referral_hash}"


def generate_outreach_messages(
    target_name: str,
    persona_code: str,
    platform: str,
    bio: Optional[str] = None,
    recent_content: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Dict[str, any]:
    """
    Generate 3 personalized outreach message variations using Claude API

    Args:
        target_name: Full name of outreach target
        persona_code: Persona code (m/d/e/v/p/i)
        platform: Platform (Instagram, TikTok, Email, Discord, etc.)
        bio: Optional bio/description of target
        recent_content: Optional recent work/content to reference
        api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)

    Returns:
        Dict with 'friendly', 'professional', 'brief' message variations + URL
    """

    # Get API key
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    # Validate persona
    if persona_code not in PERSONAS:
        raise ValueError(f"Invalid persona code: {persona_code}. Must be one of: {list(PERSONAS.keys())}")

    persona = PERSONAS[persona_code]
    referral_hash = generate_referral_hash(target_name)
    persona_url = build_persona_url(persona_code, referral_hash)

    # Build prompt for Claude
    prompt = f"""Generate 3 personalized outreach messages for a product-led growth campaign.

TARGET PROFILE:
- Name: {target_name}
- Platform: {platform}
- Bio: {bio or "Not provided"}
- Recent Content: {recent_content or "Not provided"}

PRODUCT: Audiolux
- Description: Browser-based visual music creation platform
- Key Feature: No installation, accessible for Deaf/HOH users, real-time collaboration
- Persona Focus: {persona['title']} - {persona['focus']}
- URL: {persona_url}

REQUIREMENTS:
1. Reference the target's specific work (if bio/content provided)
2. Keep messages authentic and non-salesy
3. Highlight value for their specific persona ({persona['title']})
4. Include the persona URL naturally
5. Adapt tone to the platform ({platform})

Generate 3 variations:

**Friendly**: Warm, conversational, personal connection
**Professional**: Respectful, concise, value-focused
**Brief**: Very short, attention-grabbing, direct

Return ONLY a valid JSON object with this exact structure:
{{
  "friendly": "message text here",
  "professional": "message text here",
  "brief": "message text here"
}}

Do not include any markdown formatting, code blocks, or additional text."""

    # Call Claude API
    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    # Parse response
    response_text = message.content[0].text.strip()

    try:
        messages = json.loads(response_text)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code block
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
            messages = json.loads(response_text)
        else:
            raise ValueError(f"Failed to parse Claude response as JSON:\n{response_text}")

    return {
        "target": target_name,
        "persona": persona_code,
        "platform": platform,
        "referral_hash": referral_hash,
        "url": persona_url,
        "messages": messages,
    }


def save_output(result: Dict, output_file: Optional[str] = None):
    """Save outreach result to JSON file"""
    if not output_file:
        # Auto-generate filename
        clean_name = result["target"].lower().replace(" ", "-")
        output_file = f"tools/outreach/{clean_name}-{result['persona']}.json"

    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)

    return output_file


def print_result(result: Dict):
    """Print formatted outreach messages"""
    print(f"\n{'='*70}")
    print(f"OUTREACH MESSAGES: {result['target']}")
    print(f"{'='*70}\n")
    print(f"Persona: {PERSONAS[result['persona']]['title']} ({result['persona']})")
    print(f"Platform: {result['platform']}")
    print(f"Referral Hash: {result['referral_hash']}")
    print(f"URL: {result['url']}\n")
    print(f"{'-'*70}\n")

    for style, message in result["messages"].items():
        print(f"**{style.upper()}**\n")
        print(f"{message}\n")
        print(f"{'-'*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Generate personalized outreach messages with AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    # Target info
    parser.add_argument("--name", help="Target's full name")
    parser.add_argument("--persona", choices=list(PERSONAS.keys()), help="Persona code (m/d/e/v/p/i)")
    parser.add_argument("--platform", help="Platform (Instagram, TikTok, Email, Discord, etc.)")
    parser.add_argument("--bio", help="Optional bio/description")
    parser.add_argument("--content", help="Optional recent content to reference")

    # Config file option
    parser.add_argument("--config", help="Path to JSON config file with target info")

    # Output
    parser.add_argument("--output", help="Output file path (default: auto-generate)")
    parser.add_argument("--quiet", action="store_true", help="Don't print messages (save only)")

    args = parser.parse_args()

    # Load config file or use CLI args
    if args.config:
        with open(args.config) as f:
            config = json.load(f)
        target_name = config["name"]
        persona_code = config["persona"]
        platform = config["platform"]
        bio = config.get("bio")
        recent_content = config.get("recent_content")
    else:
        if not all([args.name, args.persona, args.platform]):
            parser.error("--name, --persona, and --platform are required (or use --config)")
        target_name = args.name
        persona_code = args.persona
        platform = args.platform
        bio = args.bio
        recent_content = args.content

    try:
        # Generate messages
        result = generate_outreach_messages(
            target_name=target_name,
            persona_code=persona_code,
            platform=platform,
            bio=bio,
            recent_content=recent_content,
        )

        # Save to file
        output_file = save_output(result, args.output)

        if not args.quiet:
            print_result(result)
            print(f"✅ Saved to: {output_file}")

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
