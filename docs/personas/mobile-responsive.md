# Persona: Mobile User / Responsive Layout Test

**Code**: `responsive` (alias: `mobile`)
**URL Parameter**: `?mobile=true` (forces mobile testing)
**Budget**: Free/mobile users
**Context**: Testing responsive design, touch interactions, mobile navigation

## Who They Are

- Anyone accessing Audiolux on a phone or tablet
- Small screen (375-667px typical)
- Touch-based interaction (no mouse/trackpad)
- Limited time/attention (in transit, quick sessions)
- May have varying connectivity (3G/4G/WiFi)

## The Core Question

**"Can I access every feature on my phone? Can I navigate without getting stuck? Does everything work with my thumb?"**

## Goals

- Navigate app smoothly on small screen
- Access all core features (no mobile-only limitations)
- Use touch targets comfortably (44px+ minimum)
- Understand responsive layout at breakpoints
- Complete tasks without desktop version

## Bailout Triggers (Mobile-Specific)

- Text too small to read without zooming
- Buttons too small to tap (< 44px touch target)
- Horizontal scrolling needed (layout broken)
- Navigation menu hidden/confusing
- Inputs cramped (can't type in fields)
- Slow load times (mobile internet)
- Elements overlap or cut off
- Need to rotate to landscape to see content

## Layout Evaluation Criteria

### Visual Hierarchy at Mobile Sizes
- ✅ PASS: CTA clear, hierarchy maintained, scannable
- ⚠️ CONCERNS: Some hierarchy lost, but recoverable
- ❌ FAIL: CTA buried, layout broken, unnavigable

### Touch Targets & Spacing
- ✅ PASS: All buttons 44px+, adequate spacing (8px gaps)
- ⚠️ CONCERNS: Some buttons 38-44px, spacing tight
- ❌ FAIL: Buttons < 38px, overlapping, cramped

### Responsive Breakpoints
- ✅ PASS: Smooth adaptation at 320px, 375px, 667px (common sizes)
- ⚠️ CONCERNS: Awkward at one breakpoint
- ❌ FAIL: Layout broken at multiple sizes

### Mobile Navigation
- ✅ PASS: Hamburger/tab bar clear, navigation obvious
- ⚠️ CONCERNS: Navigation hard to find
- ❌ FAIL: Navigation missing or unusable on mobile

### Viewport Sizes Tested

| Device | Width | Height | Usage |
|--------|-------|--------|-------|
| iPhone SE | 375px | 667px | Standard mobile |
| Small Android | 360px | 640px | Common Android |
| Tablet (portrait) | 768px | 1024px | Larger mobile |
| Tablet (landscape) | 1024px | 768px | Wide mobile |

## What Would Help Me (Mobile User Voice)

- "I need to use this one-handed"
- "Big buttons that don't overlap"
- "Text I can read without zooming"
- "Navigation I can understand"
- "No horizontal scrolling - ever"
- "Everything should work rotated landscape"
- "Let me see the important stuff without scrolling too much"

## Measurement Criteria

**Technical Checks:**
- Viewport meta tag present? (controls mobile rendering)
- All text readable at 320px width?
- Touch targets 44px minimum? (iOS/Android accessibility)
- No horizontal scrolling at standard sizes?
- Breakpoints at 320px, 375px, 768px?
- Images responsive (no overflow)?
- Forms usable on touch (inputs focused, keyboards appear)?
- Mobile navigation works (tabs/hamburger)?

**User Experience Checks:**
- Can complete primary task on mobile?
- Navigation clear without instructions?
- CTAs easy to find and tap?
- Content hierarchy maintained?
- No layout jumps or shifts?
- Readable without squinting?

## Persona Language

**YES**: "Mobile-first, responsive, touch-friendly, small screen, compact, lightweight"
**NO**: "Desktop-only, requires zoom, hover-based, mouse-dependent, hover states"

## Success Metrics

- 100% of features accessible on mobile (no "desktop only" content)
- All touch targets ≥44px
- No horizontal scrolling
- Forms work without keyboard lag
- Load time <3 seconds on 4G
- Mobile navigation clear (tab bar or hamburger)

## Common Issues Found

1. **Text too small** - Needs zoom to read (min 16px base)
2. **Buttons too small** - Can't tap accurately (< 44px)
3. **Horizontal scrolling** - Layout breaks at viewport
4. **Cramped inputs** - Can't see what you're typing
5. **Hidden navigation** - Menu not accessible
6. **Slow loading** - Images not optimized for mobile
7. **Overlapping elements** - Touch targets conflicting
8. **Unclear CTAs** - Primary action not obvious

## Notes for Testers

- Test on real device when possible (simulator doesn't show lag/responsiveness)
- Test both portrait and landscape
- Test on various sizes (not just common sizes)
- Check touch targets in browser DevTools (Ctrl+Shift+I → Toggle device toolbar)
- Test with network throttling (Chrome DevTools → Network tab → Throttle)
- Use touch (not mouse) to test - hover states don't work on mobile
