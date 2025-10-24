# Breaking Change Policy

## Purpose

This document defines how Audiolux (Centaurus Drum Machine) handles API changes to prevent breaking existing functionality while enabling rapid feature development. It establishes versioning strategies, deprecation timelines, and migration paths for all public interfaces.

**Related Files**:
- `src/types/api-contracts.ts` - Versioned API definitions
- `src/utils/featureFlags.ts` - Feature flag system
- `.env.example` - Feature flag configuration

---

## Principles

### 1. Stability Over Innovation
When in conflict, choose backward compatibility. Users and integrations depend on stable APIs.

### 2. Version Everything
All public interfaces must be versioned (e.g., `GlobalMusicAPI_v1`). Never modify unversioned types used across modules.

### 3. Feature Flags for Experiments
Use feature flags to isolate experimental code. Don't create long-lived feature branches.

### 4. Gradual Deprecation
Give users time to migrate. Maintain deprecated APIs for minimum 2 release cycles.

### 5. Clear Migration Paths
Always provide migration guides and helper functions when introducing breaking changes.

---

## What Constitutes a Breaking Change?

### 🔴 Always Breaking
- Removing a field from an interface
- Changing a field's type (e.g., `string` → `number`)
- Renaming a field or method
- Removing a method from an API
- Changing method signatures (parameters, return type)
- Changing behavior that consumers depend on

### 🟡 Sometimes Breaking
- Adding required fields to interfaces (breaks existing implementations)
- Changing default values
- Tightening validation rules
- Adding new enum values (if consumers use `switch` without `default`)

### 🟢 Never Breaking
- Adding optional fields (with `?`)
- Adding new methods to interfaces (if interface is only consumed, not implemented)
- Adding new enum values (if consumers handle unknown values)
- Deprecating with warnings (if functionality remains)
- Internal implementation changes

---

## Versioning Strategy

### API Contract Versions

**Format**: `InterfaceName_v{major}`

**Example**: `GlobalMusicAPI_v1`, `GlobalMusicAPI_v2`

**When to Increment**:
- **v1 → v2**: Breaking changes (field removal, type changes, signature changes)
- **v1.1**: Minor changes (add optional fields) - Keep same v1 name, document in comments

**Version Registry**:
All versions tracked in `API_VERSION_REGISTRY` constant in `src/types/api-contracts.ts`.

```typescript
export const API_VERSION_REGISTRY = {
  GlobalMusicAPI: {
    current: 'v1',
    versions: ['v1'], // Add 'v2' when created
    deprecated: [],   // Add 'v1' when v2 becomes current
  },
};
```

---

## Creating New Versions

### Step 1: Create New Version Interface

```typescript
// src/types/api-contracts.ts

/**
 * GlobalMusicState_v2 - Central musical configuration
 *
 * Changes from v1:
 * - Added: swingAmount field (optional)
 * - Changed: tempo type from number to TempoConfig
 * - Removed: colorMode (moved to visualization settings)
 *
 * Migration: Use migrateGlobalMusicState_v1_to_v2()
 *
 * Stability: STABLE - v2.0
 * Introduced: 2025-02-01
 */
export interface GlobalMusicState_v2 {
  readonly tempo: TempoConfig; // Changed from number
  readonly key: string;
  readonly scale: string;
  readonly masterVolume: number;
  readonly isPlaying: boolean;
  readonly swingAmount?: number; // New field
  // colorMode removed - see VisualizationSettings_v1
}
```

### Step 2: Create Migration Helper

```typescript
// src/types/api-contracts.ts

/**
 * Migrate GlobalMusicState from v1 to v2
 */
export function migrateGlobalMusicState_v1_to_v2(
  oldState: GlobalMusicState_v1
): GlobalMusicState_v2 {
  return {
    tempo: {
      bpm: oldState.tempo,
      locked: false,
    },
    key: oldState.key,
    scale: oldState.scale,
    masterVolume: oldState.masterVolume,
    isPlaying: oldState.isPlaying,
    swingAmount: 0, // Default value for new field
    // colorMode moved to separate settings
  };
}
```

### Step 3: Update Version Registry

```typescript
export const API_VERSION_REGISTRY = {
  GlobalMusicAPI: {
    current: 'v2',           // Updated
    versions: ['v1', 'v2'],  // Added v2
    deprecated: ['v1'],      // v1 now deprecated
  },
};
```

### Step 4: Add Deprecation Warnings

```typescript
/**
 * @deprecated Use GlobalMusicState_v2 instead
 * Will be removed in v3.0.0 (target: 2025-04-01)
 * Migration: Use migrateGlobalMusicState_v1_to_v2()
 */
export interface GlobalMusicState_v1 {
  // ... existing interface
}
```

---

## Deprecation Timeline

### Phase 1: Deprecation Announcement (Current Release)
- Add `@deprecated` JSDoc tag
- Document migration path
- Set removal target date (minimum 2 release cycles)
- Log warnings in development mode

### Phase 2: Deprecation Warning (Next Release)
- Keep deprecated API functional
- Show runtime warnings in console (development only)
- Update documentation with migration examples

### Phase 3: Removal (2+ Releases Later)
- Remove deprecated API
- Provide migration helper for breaking change

**Example Timeline**:
- **v1.0** (2025-01-24): API introduced
- **v1.1** (2025-02-15): API deprecated, v2 introduced
- **v1.2** (2025-03-15): Deprecation warnings active
- **v2.0** (2025-04-15): v1 removed

---

## Feature Flag Strategy

### When to Use Feature Flags

**✅ Use Feature Flags For**:
- Experimental features in active development
- Gradual rollouts (A/B testing)
- Features that may be reverted
- Optional premium features (monetization)
- Beta feature previews

**❌ Don't Use Feature Flags For**:
- Bug fixes (fix and deploy immediately)
- Stable features (commit to main branch)
- Features in use by >50% of users (bake into codebase)

### Feature Flag Lifecycle

```typescript
// 1. EXPERIMENTAL (0-10% rollout)
VITE_FEATURE_AI_ASSISTANT=true
VITE_FEATURE_AI_ASSISTANT_ROLLOUT=10

// 2. BETA (10-50% rollout)
VITE_FEATURE_AI_ASSISTANT_ROLLOUT=50

// 3. GA (General Availability - 100% rollout)
VITE_FEATURE_AI_ASSISTANT_ROLLOUT=100

// 4. BAKED IN (remove flag, make permanent)
// Remove from featureFlags.ts and .env
```

### Feature Flag Retirement

After **3 months** at 100% rollout:
1. Remove feature flag checks from code
2. Remove flag from `featureFlags.ts`
3. Remove environment variables
4. Document in changelog: "Feature X is now permanent"

---

## Module-Specific Policies

### GlobalMusicContext Changes

**Critical Impact**: All modules consume this context

**Required Steps**:
1. Create versioned interface in `api-contracts.ts`
2. Add migration helper
3. Update all consuming modules within same PR
4. Test all 8+ feature domains (Studio, Jam, Education, Hardware, etc.)
5. Document breaking changes in PR description

### Hardware Abstraction Layer

**Critical Impact**: External hardware integrations

**Required Steps**:
1. Maintain backward compatibility for 6 months minimum
2. Support multiple hardware controller versions simultaneously
3. Log hardware version warnings in console
4. Provide firmware update guides if applicable

### Module Routing System

**Critical Impact**: Inter-module communication

**Required Steps**:
1. Event format changes require new event type (e.g., `note-on-v2`)
2. Support both old and new event types during transition
3. Deprecate old events only after all modules updated
4. Test routing with all module combinations

### Visualization System

**Critical Impact**: LED/WLED integrations

**Required Steps**:
1. Maintain compatibility with existing visualization types
2. Add new visualization types as optional
3. Provide fallback visualizations for unsupported types
4. Test with physical hardware before deploying

---

## Change Management Checklist

### Before Making Changes

- [ ] Check if change affects public API (see "What Constitutes a Breaking Change")
- [ ] Search codebase for all consumers of the API
- [ ] Review related epic/story documentation
- [ ] Check if feature is behind a feature flag

### For Breaking Changes

- [ ] Create versioned interface in `api-contracts.ts`
- [ ] Create migration helper function
- [ ] Update version registry
- [ ] Add deprecation warnings to old version
- [ ] Document migration path in JSDoc
- [ ] Update all consumers in same PR (or create migration plan)
- [ ] Add to changelog with "BREAKING CHANGE:" prefix
- [ ] Set removal target date (minimum 2 releases)

### For New Features

- [ ] Consider if feature should be behind feature flag
- [ ] Add new fields as optional (`?`) when possible
- [ ] Document feature flag in `.env.example`
- [ ] Add feature flag to `featureFlags.ts` if needed
- [ ] Update feature flag documentation

### Testing

- [ ] Build succeeds: `npm run build`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Test affected modules in browser
- [ ] Test with feature flags ON and OFF
- [ ] Test migration helpers (if applicable)
- [ ] Verify no console errors or warnings

---

## Common Scenarios

### Scenario 1: Adding Optional Field to Existing Interface

**Safe** - No version bump needed

```typescript
// BEFORE
export interface GlobalMusicState_v1 {
  readonly tempo: number;
  readonly key: string;
}

// AFTER
export interface GlobalMusicState_v1 {
  readonly tempo: number;
  readonly key: string;
  readonly swingAmount?: number; // Optional field - safe to add
}
```

**Documentation**:
```typescript
/**
 * GlobalMusicState_v1
 *
 * Changelog:
 * - v1.1 (2025-02-01): Added optional swingAmount field
 * - v1.0 (2025-01-24): Initial version
 */
```

### Scenario 2: Changing Field Type

**Breaking** - Requires new version

```typescript
// Step 1: Create v2
export interface GlobalMusicState_v2 {
  readonly tempo: TempoConfig; // Changed from number
  readonly key: string;
}

// Step 2: Deprecate v1
/**
 * @deprecated Use GlobalMusicState_v2 instead
 * Migration: Use migrateGlobalMusicState_v1_to_v2()
 */
export interface GlobalMusicState_v1 {
  readonly tempo: number;
  readonly key: string;
}

// Step 3: Migration helper
export function migrateGlobalMusicState_v1_to_v2(
  old: GlobalMusicState_v1
): GlobalMusicState_v2 {
  return {
    tempo: { bpm: old.tempo, locked: false },
    key: old.key,
  };
}
```

### Scenario 3: Experimental Feature Behind Feature Flag

**Safe** - Isolated with flag

```typescript
import { useFeatureFlags } from '@/utils/featureFlags';

function MyComponent() {
  const { experimentalVisualizations } = useFeatureFlags();

  return (
    <>
      <StandardVisualization />
      {experimentalVisualizations.enabled && (
        <ExperimentalVisualization />
      )}
    </>
  );
}
```

**Environment Configuration**:
```bash
# .env.local
VITE_FEATURE_EXPERIMENTAL_VIZ=true
VITE_FEATURE_EXPERIMENTAL_VIZ_ROLLOUT=25  # 25% of users
```

---

## Rollback Procedures

### Immediate Rollback (Production Emergency)

```bash
# Option 1: Revert commit
git revert <commit-hash>
git push origin main

# Option 2: Feature flag disable (instant)
# In Vercel dashboard:
VITE_FEATURE_X=false
```

### Gradual Rollback

```bash
# Reduce rollout percentage
VITE_FEATURE_X_ROLLOUT=50  # Was 100, reduce to 50%
VITE_FEATURE_X_ROLLOUT=25  # Further reduce to 25%
VITE_FEATURE_X_ROLLOUT=0   # Complete rollback
```

---

## Monitoring & Alerts

### Development Warnings

Feature flags and deprecated APIs log warnings in development:

```typescript
// Automatic logging in featureFlags.ts
if (import.meta.env.DEV) {
  console.warn('[DEPRECATED] GlobalMusicState_v1 is deprecated. Use v2.');
}
```

### Production Monitoring

Track via Vercel Analytics:
- Feature flag adoption rates
- API version usage
- Migration completion rates
- Error rates after deployments

---

## Questions & Answers

### Q: Can I modify an interface used only in one component?

**A**: If the interface is truly local (not exported, not in `types/`), you can modify freely. But if it's exported or could be used elsewhere, follow versioning rules.

### Q: What if I need to make a breaking change urgently?

**A**:
1. Create v2 interface immediately
2. Update all consumers in same PR
3. Deploy directly to main (skip deprecation phase)
4. Document in changelog as "EMERGENCY BREAKING CHANGE"
5. Notify team/users of immediate change

### Q: How long do I maintain deprecated APIs?

**A**: Minimum 2 release cycles (~2 months for monthly releases). For critical APIs (GlobalMusicContext, HardwareController), maintain for 6 months.

### Q: Can I use feature flags for bug fixes?

**A**: Generally no. Bug fixes should be deployed immediately. Use feature flags only for new features or risky refactors.

---

## Resources

- **API Contracts**: `src/types/api-contracts.ts`
- **Feature Flags**: `src/utils/featureFlags.ts`
- **Environment Config**: `.env.example`
- **Assessment Document**: `docs/assessments/workflow-assessment-2025-01-24.md`
- **Semantic Versioning**: https://semver.org/

---

**Document Version**: 1.0
**Last Updated**: 2025-01-24
**Next Review**: After first API version bump
