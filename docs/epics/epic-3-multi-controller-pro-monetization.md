# Epic 3: Multi-Controller Support Framework with Pro Monetization

**Epic Goal**: Expand hardware controller support beyond APC40 to multiple popular MIDI controllers as a Pro tier feature, while establishing a legally-safe, extensible architecture that balances commercial viability with community contribution potential.

**Business Requirements**:
- Monetize hardware controller support through Pro tier subscription
- Minimize trademark/legal risk when using controller brand names
- Enable community contributions through separate open-source library
- Provide clear value proposition for Pro tier ($9.99/month or $79.99/year)
- Maintain excellent UX for both free and Pro users

**Technical Requirements**:
- Build on existing APC40 abstraction layer (Epic 1)
- Create pluggable controller architecture with hot-swappable profiles
- Implement feature gating tied to license/subscription status
- Design for future npm package separation (@centaurus/controller-lib)
- Ensure zero performance impact when controllers not in use

**Development Sequence**:
Stories ordered to enable iterative development without payment infrastructure blocking progress:
1. **10.1 - Plugin Registry**: Core architecture (foundation)
2. **10.2 - Controller Profiles**: Build and test actual hardware support
3. **10.3 - Legal Branding**: Ensure trademark compliance in UI
4. **10.4 - npm Package**: Separate community contribution layer
5. **10.5 - License Management**: Add payment infrastructure (Stripe, database)
6. **10.6 - Unlock Onboarding**: Complete Pro tier UX flows

## Story 10.1: Controller Plugin Architecture & Registry System

As a **system architect**,
I want **a plugin-based controller registry with hot-swappable controller profiles**,
so that **new controllers can be added without modifying core application code and can be gated by license tier**.

**Acceptance Criteria**:
1. Create `src/hardware/registry/ControllerRegistry.ts` with plugin registration system
2. Implement controller profile schema (metadata, MIDI mapping, LED config, capabilities)
3. Build controller discovery/enumeration based on connected MIDI devices
4. Create hot-swap mechanism for loading/unloading controller profiles at runtime
5. Design feature flag system for Pro-gated vs free-tier controller access
6. Implement fallback behavior when Pro-gated controllers detected without license

**Integration Verification**:
- **IV1**: Existing APC40 integration continues working unchanged
- **IV2**: Registry system adds <2% memory overhead when no additional controllers loaded
- **IV3**: Free tier users can still use APC40 (legacy support) and see Pro controller availability

## Story 10.2: Controller Profile Library (Popular Controllers)

As a **music producer**,
I want **native support for my Novation Launchpad / Akai MPK Mini / Arturia BeatStep**,
so that **I can use my preferred hardware controller without complex manual configuration**.

**Acceptance Criteria**:
1. Implement Novation Launchpad Mini MK3 profile (8x8 grid, RGB LEDs, SysEx)
2. Implement Akai MPK Mini MK3 profile (25 keys, 8 pads, 8 knobs)
3. Implement Arturia BeatStep profile (16 pads, 16 encoders, transport controls)
4. Create consistent UI for controller-specific settings (brightness, color modes, button mapping)
5. Build automated testing suite for controller profiles using virtual MIDI devices
6. Document controller profile creation API for community contributions

**Integration Verification**:
- **IV1**: All three new controllers work simultaneously with existing APC40 without conflicts
- **IV2**: LED feedback latency remains <50ms for all controllers under typical load
- **IV3**: Controller hot-swap (connect/disconnect) doesn't affect audio playback or sequencer state

## Story 10.3: Legal-Safe Controller Branding & Discovery UI

As a **legal/compliance stakeholder**,
I want **trademark-compliant controller naming and clear compatibility messaging**,
so that **we minimize legal risk while maintaining user-friendly controller discovery**.

**Acceptance Criteria**:
1. Use descriptive language: "Compatible with Akai APC40" vs "Akai APC40 Integration"
2. Add trademark disclaimer in UI and documentation: "Third-party product names used for compatibility identification only. Not affiliated with or endorsed by [manufacturer]."
3. Create controller detection UI that highlights "detected hardware" without over-emphasizing brands
4. Design "Community Contributed" vs "Official Support" badges for controller profiles
5. Implement "bring your own controller config" option for free tier (advanced users)
6. Legal review checklist document for future controller additions

**Integration Verification**:
- **IV1**: All controller references use compatibility language, not ownership/endorsement claims
- **IV2**: UI clearly distinguishes official profiles from community contributions
- **IV3**: Documentation includes proper trademark acknowledgments and fair use statements

## Story 10.4: Separate npm Package Architecture (@centaurus/controller-lib)

As a **technical architect**,
I want **hardware controller profiles separated into standalone npm package**,
so that **community can contribute controller profiles without access to core app and legal liability is further isolated**.

**Acceptance Criteria**:
1. Create new GitHub repo: `centaurus-controller-lib` with Apache 2.0 license
2. Extract controller profile schemas and base classes into library package
3. Design npm package structure: `@centaurus/controller-lib` with tree-shakeable exports
4. Create contribution guidelines for community controller profiles
5. Implement profile validation/linting tools in library repo
6. Build automated CI/CD for testing and publishing controller profiles
7. Maintain core app's ability to load profiles from both npm package and internal registry

**Integration Verification**:
- **IV1**: Core app can import profiles from both `@centaurus/controller-lib` and internal src/hardware/
- **IV2**: npm package has zero dependencies on core application code
- **IV3**: Community contributors can test profiles locally without building entire Centaurus app

## Story 10.5: Pro Tier Feature Gating & License Management

As a **business stakeholder**,
I want **secure Pro tier license validation that gates access to premium controllers**,
so that **revenue-generating features are properly protected while maintaining good UX**.

**Acceptance Criteria**:
1. Create `src/services/LicenseManager.ts` for Pro tier validation
2. Implement local license storage with encryption and expiry checks
3. Build license validation flow (online check + offline grace period)
4. Create "Upgrade to Pro" UI flows when Pro controllers detected
5. Design graceful degradation when license expires (warning period, then disable)
6. Implement analytics tracking for controller usage and upgrade prompts

**Integration Verification**:
- **IV1**: License checks do not block critical path or cause latency in audio/MIDI operations
- **IV2**: Offline mode allows 7-day grace period for Pro features before requiring reconnection
- **IV3**: Users cannot bypass license gates through localStorage manipulation or browser tools

## Story 10.6: Controller Unlock Flow & User Onboarding

As a **first-time Pro user**,
I want **seamless discovery of available controllers and clear upgrade prompts**,
so that **I understand the value of Pro tier and can easily unlock premium hardware support**.

**Acceptance Criteria**:
1. Design hardware discovery screen showing all available controllers with license status
2. Create inline upgrade prompts when Pro-gated controller is physically connected
3. Build onboarding flow for Pro subscribers showing supported hardware and setup guides
4. Implement "Try before you buy" demo mode (5-minute sessions with Pro controllers)
5. Create controller showcase page with video demos and feature comparisons
6. Add in-app notifications for newly added controller support in library updates

**Integration Verification**:
- **IV1**: Controller discovery and upgrade prompts don't interrupt active music production sessions
- **IV2**: Demo mode timer is accurate and cannot be circumvented through browser resets
- **IV3**: Onboarding flow adapts based on which controllers user physically owns

---

## Monetization Model (Phase 1)

**Pro Tier Pricing**:
- **Monthly**: $9.99/month (cancel anytime)
- **Annual**: $79.99/year (2 months free, ~33% savings)

**Feature Comparison**:

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| APC40 Support | ✅ Full support (legacy) | ✅ Full support |
| Launchpad Mini MK3 | ❌ Demo only (5 min) | ✅ Unlimited |
| MPK Mini MK3 | ❌ Demo only (5 min) | ✅ Unlimited |
| BeatStep | ❌ Demo only (5 min) | ✅ Unlimited |
| Future Controllers | ❌ Demo only | ✅ Unlimited |
| Custom Controller Config | ✅ DIY import/export | ✅ + Cloud sync |
| Multi-Controller Setups | ❌ Single controller | ✅ Up to 4 simultaneous |
| LED Brightness Control | ✅ Basic | ✅ Advanced per-controller |
| Controller Presets | ❌ N/A | ✅ Save/share configs |

**Value Proposition**: Pro tier unlocks the full potential of your hardware investment, supporting the latest controllers and enabling professional multi-device setups.

---

## Legal Strategy & Risk Mitigation

**Trademark Fair Use Approach**:
1. **Compatibility Doctrine**: Using brand names to describe compatibility is generally protected
2. **Descriptive Use**: "Works with Akai APC40" vs "Akai APC40 app"
3. **Disclaimer Placement**: Visible on controller pages and in app footer
4. **No Endorsement Claims**: Avoid language suggesting official partnership

**Liability Separation**:
- Core commercial app: Centaurus Drum Machine (your IP, your liability)
- Open-source library: @centaurus/controller-lib (community contributions, Apache 2.0)
- Controller profiles in library are community-maintained (distributed liability)
- Core app only ships "official" profiles for popular controllers (curated, tested)

**Prior Art Examples**:
- **Ableton Live**: Lists dozens of controller manufacturers by name ("Supported Controllers")
- **Bitwig Studio**: Similar approach with "Controller Scripts"
- **VCV Rack**: Community-contributed hardware modules use manufacturer names
- **FL Studio**: Direct hardware integration using brand names

**Recommendation**: Proceed with confidence using trademark fair use doctrine, maintain clear disclaimers, separate community contributions via npm package, and monitor for any C&D letters (unlikely based on industry precedent).

---

**This epic establishes a sustainable business model for hardware controller support while minimizing legal risk and creating a path for community contribution. Phase 1 focuses on proven commercial viability before opening fully to open-source ecosystem.**
