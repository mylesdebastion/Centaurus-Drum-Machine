# Story Implementation Checklist

**Purpose:** Prevent common implementation mistakes and ensure dev agents work on the correct components.

## Before Starting Implementation

### 1. Route Verification (CRITICAL)

**If story mentions a route (e.g., `/wled-manager`, `/studio`, `/jam`):**

- [ ] Check `src/App.tsx` for the route definition
- [ ] Identify which component is rendered at that route
- [ ] Verify component directory structure

**Example:**
```
Story mentions: "/wled-manager"
1. Search App.tsx for "wled-manager"
2. Find: <Route path="/wled-manager" element={<WLEDManager ... />} />
3. Trace import: import { WLEDManager } from './components/WLEDManager'
4. Work in: src/components/WLEDManager/ ✓
```

### 2. Component Architecture Check

**If multiple similar components exist:**

- [ ] Check for deprecation warnings in component headers
- [ ] Read component directory README if it exists
- [ ] Check git history to see which is newer (`git log --oneline <file>`)
- [ ] Ask user which component to modify if unclear

**Red Flags:**
- Two components with similar names (e.g., `WLED/` vs `WLEDManager/`)
- "Legacy" or "Deprecated" in component comments
- Component not referenced in main App.tsx routes

### 3. Story File Path Verification

**Check "Source Tree References" or "Modified Files" sections:**

- [ ] Story lists explicit file paths to modify
- [ ] File paths exist in current codebase
- [ ] Paths match the route component identified in step 1

**If paths are ambiguous or missing:**
- [ ] Ask user for clarification before starting
- [ ] Document the correct paths in story notes

### 4. Dependency Verification

**Before importing shared components:**

- [ ] Verify component types are compatible
- [ ] Check if type adapters needed (e.g., `WLEDDevice` vs `WLEDDeviceInput`)
- [ ] Read component props interface

## During Implementation

### 5. Progress Verification

**After each task:**

- [ ] Verify changes in correct file (check file path in editor)
- [ ] TypeScript compilation passes
- [ ] No new linter warnings

### 6. Integration Testing Checklist

**Before marking story complete:**

- [ ] Route renders without errors
- [ ] UI elements appear in browser
- [ ] No console errors
- [ ] TypeScript compilation passes

## Common Mistakes

### Mistake 1: Wrong Component Directory

**Symptom:** Code compiles but UI doesn't change
**Cause:** Modified legacy/unused component
**Prevention:** Follow Route Verification checklist above

### Mistake 2: Type Mismatches

**Symptom:** TypeScript errors with `as any` workarounds
**Cause:** Using incompatible type definitions
**Prevention:** Read component interfaces, use type adapters

### Mistake 3: Missing Imports

**Symptom:** Component renders but feature doesn't work
**Cause:** Forgot to import/register new service
**Prevention:** Check story integration points section

## Quick Reference

**Before implementing ANY story:**

```bash
# 1. Find the route component
grep -r "path=\"/your-route\"" src/App.tsx

# 2. Check for multiple similar components
find src/components -name "*ComponentName*"

# 3. Look for README in component directory
ls src/components/YourComponent/README.md

# 4. Check for deprecation warnings
grep -i "deprecated\|legacy" src/components/YourComponent/*.tsx
```

## Story Quality Standards

**Good Story (Easy to implement):**
- ✅ Explicit file paths listed
- ✅ Route clearly specified
- ✅ Component architecture documented
- ✅ Integration points listed

**Ambiguous Story (Requires clarification):**
- ⚠️ Generic component names (e.g., "WLEDManager")
- ⚠️ Route mentioned but files not specified
- ⚠️ Multiple similar components exist
- ⚠️ No "Modified Files" section

**Action:** Ask user for clarification before starting implementation.

---

**Last Updated:** 2025-10-19 (Post Story 18.8 - WLED component confusion incident)
