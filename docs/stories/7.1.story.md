# Story 7.1: Fix Vercel Preview Deployment Authentication

## Status
📝 **BLOCKED** - Awaiting Configuration

## Story
**As a** project maintainer,
**I want** testers to access preview deployments at `jam-dev.audiolux.app` without requiring Vercel authentication,
**so that** I can gather feedback from external testers without adding them to the Vercel team

## Background / Context

Currently, the preview deployment has an authentication barrier:

**✅ Working:**
- Production: `jam.audiolux.app` → Publicly accessible (no authentication)
- Direct Vercel URL: `centaurus-drum-machine-git-dev-myles-3235s-projects.vercel.app` → May be publicly accessible

**❌ Blocked:**
- Preview: `jam-dev.audiolux.app` → **Requires Vercel login** (authentication wall)
- Testers see: "Sign in to view this deployment"
- Cannot gather external feedback without granting Vercel team access

### Root Cause: Vercel Deployment Protection

**Vercel Deployment Protection** is enabled with **Standard Protection** mode:
- Protects **ALL domains EXCEPT Production Custom Domains**
- `jam.audiolux.app` = Production Custom Domain → ✅ Excluded from protection
- `jam-dev.audiolux.app` = Preview Custom Domain → ❌ Protected (requires auth)

**Current Configuration:**
- Project: `centaurus-drum-machine`
- Org: `myles-3235s-projects` (team_IJ1abltjpGu6BWkSlHxwwaym)
- Git deployment enabled for: `main` (production) + `dev` (preview)
- Deployment Protection: **Standard Protection** (default)

## Acceptance Criteria

1. **Public Preview Access**
   - External testers can access `jam-dev.audiolux.app` without Vercel login
   - No authentication prompt or "Sign in to view" page
   - Preview deployment fully functional for anonymous users

2. **Security Maintained**
   - Production deployment (`jam.audiolux.app`) remains publicly accessible
   - Other internal deployments remain protected (if desired)
   - No exposure of sensitive deployment information

3. **Simple Sharing**
   - Clean, shareable URL (no long bypass tokens)
   - URL works immediately without additional steps
   - Testers can bookmark and revisit preview deployment

4. **No Team Access Required**
   - Testers do NOT need Vercel accounts
   - Testers do NOT need to join the Vercel team
   - Works for completely external users

## Proposed Solutions

### Solution 1: Deployment Protection Exception (RECOMMENDED)
**Add `jam-dev.audiolux.app` as an exception to Deployment Protection.**

**Steps:**
1. Go to Vercel Dashboard → `centaurus-drum-machine` project
2. Settings → Deployment Protection
3. Under "Deployment Protection Exceptions", add:
   - Exception Type: "Domain"
   - Domain: `jam-dev.audiolux.app`
4. Save configuration

**Pros:**
- ✅ Clean URL for testers (`jam-dev.audiolux.app`)
- ✅ Professional, branded preview domain
- ✅ Maintains security for other deployments
- ✅ Granular control over which domains are public

**Cons:**
- ⚠️ May require Pro/Enterprise plan (verify plan requirements)
- ⚠️ Need to check if domain-level exceptions are available on current plan

**Plan Verification Required:**
```bash
# Check current Vercel plan and available features
vercel project inspect --scope myles-3235s-projects
```

---

### Solution 2: Deployment Protection Bypass Link
**Generate a bypass token that allows public access via special URL.**

**Steps:**
1. Get deployment ID: `vercel inspect jam-dev.audiolux.app`
2. Generate bypass link from Vercel dashboard:
   - Go to Deployments → Select dev branch deployment
   - Click "..." → "Visit" → "Copy Link with Bypass"
3. Share bypass URL with testers

**Example URL:**
```
https://jam-dev.audiolux.app?dpl=<deployment-id>&protection_bypass=<token>
```

**Pros:**
- ✅ Works on all plan tiers
- ✅ No configuration changes needed
- ✅ Can revoke by generating new token

**Cons:**
- ❌ Long, ugly URL with query parameters
- ❌ Token may expire (requires re-sharing)
- ❌ Less professional for testers

**CLI Commands:**
```bash
# Inspect deployment and get bypass information
vercel inspect jam-dev.audiolux.app --json

# Alternative: Get from dashboard
# vercel.com/myles-3235s-projects/centaurus-drum-machine/deployments
```

---

### Solution 3: Disable Deployment Protection (NOT RECOMMENDED)
**Disable protection entirely for all deployments.**

**Steps:**
1. Go to Vercel Dashboard → `centaurus-drum-machine` project
2. Settings → Deployment Protection
3. Select "No Protection" or disable feature entirely
4. Save configuration

**Pros:**
- ✅ All preview deployments instantly accessible
- ✅ Simplest solution

**Cons:**
- ⚠️ **SECURITY RISK**: ALL deployments become public
- ⚠️ No protection for experimental/sensitive features
- ⚠️ Not recommended for production projects

---

### Solution 4: Use Standard Vercel URLs (WORKAROUND)
**Share the auto-generated Vercel URL instead of custom domain.**

**Current URLs:**
- ❌ `jam-dev.audiolux.app` (protected)
- ✅ `centaurus-drum-machine-git-dev-myles-3235s-projects.vercel.app` (may be public)

**Steps:**
1. Share Vercel-generated URL instead of custom domain
2. Test if auto-generated URLs have different protection rules

**Pros:**
- ✅ May work immediately without configuration
- ✅ No plan limitations

**Cons:**
- ❌ Long, non-branded URL
- ❌ Less professional for testers
- ❌ May still be protected depending on settings

---

### Solution 5: Change Domain to Production (ADVANCED)
**Reconfigure `jam-dev.audiolux.app` as a Production Custom Domain for dev branch.**

**Steps:**
1. In Vercel project settings, add `jam-dev.audiolux.app` as Production domain
2. Configure domain to deploy from `dev` branch
3. Keep `jam.audiolux.app` for `main` branch

**Pros:**
- ✅ Clean URL, no authentication
- ✅ Preview domain treated as "production"

**Cons:**
- ⚠️ Changes semantic meaning of "production"
- ⚠️ May affect deployment workflow
- ⚠️ Requires careful branch configuration

---

## Implementation Plan

### PHASE 1: Verify Plan and Options (5 minutes)

```bash
# Check current Vercel plan
vercel project inspect --scope myles-3235s-projects

# Check deployment protection settings
vercel inspect jam-dev.audiolux.app
```

**Decision Point:**
- If Pro/Enterprise plan → Proceed with **Solution 1** (Protection Exception)
- If Hobby/Free plan → Proceed with **Solution 2** (Bypass Link) or **Solution 4** (Vercel URL)

### PHASE 2A: Implement Protection Exception (Solution 1)

1. **Verify Feature Availability:**
   - Check if Deployment Protection Exceptions are available on current plan
   - Verify domain-level exceptions are supported

2. **Configure Exception:**
   - Go to: https://vercel.com/myles-3235s-projects/centaurus-drum-machine/settings/deployment-protection
   - Add exception for `jam-dev.audiolux.app`
   - Save and verify

3. **Test Public Access:**
   ```bash
   # Test in incognito/private window (no Vercel login)
   # Visit: https://jam-dev.audiolux.app
   # Expected: Should load without authentication
   ```

4. **Share with Testers:**
   - Provide clean URL: `https://jam-dev.audiolux.app`
   - No additional instructions needed

### PHASE 2B: Implement Bypass Link (Solution 2)

1. **Generate Bypass Link:**
   ```bash
   # Get deployment info
   vercel inspect jam-dev.audiolux.app

   # Or via dashboard:
   # 1. Go to: https://vercel.com/myles-3235s-projects/centaurus-drum-machine/deployments
   # 2. Find dev branch deployment
   # 3. Click "..." → "Visit" → "Copy Link with Bypass"
   ```

2. **Share Bypass URL:**
   - Send full URL with bypass token to testers
   - Include instructions: "This link allows you to preview without login"

3. **Document Token Management:**
   - Note: Bypass tokens may expire
   - Plan to regenerate if testers report access issues
   - Consider creating new bypass links for each testing cycle

### PHASE 3: Test and Verify (10 minutes)

1. **Incognito Test:**
   - Open browser in private/incognito mode
   - Visit preview URL (without Vercel login)
   - Verify full functionality without authentication

2. **External Tester Test:**
   - Share URL with someone outside the team
   - Confirm they can access without Vercel account
   - Gather feedback on accessibility

3. **Production Verification:**
   - Verify `jam.audiolux.app` still works (no regression)
   - Confirm production domain unaffected by changes

### PHASE 4: Document Solution (5 minutes)

1. **Update README/Docs:**
   - Document preview URL for testers
   - Add instructions for accessing preview deployment
   - Note any expiration or renewal procedures

2. **Update Story:**
   - Mark chosen solution
   - Document configuration steps taken
   - Close story as COMPLETE

## Technical Details

### Vercel Deployment Protection Overview

**Protection Levels:**
1. **Standard Protection** (current setting)
   - Protects all domains EXCEPT Production Custom Domains
   - Uses: Vercel Authentication / Password / Trusted IPs

2. **All Deployments** (Pro/Enterprise)
   - Protects ALL URLs including production
   - Maximum security

3. **Only Production Deployments** (Enterprise)
   - Protects only production URLs
   - Preview deployments publicly accessible

### Current Deployment Configuration

```json
// .vercel/project.json
{
  "projectId": "prj_W7WQ04j0KokSEBZipjlZGtIii7Yf",
  "orgId": "team_IJ1abltjpGu6BWkSlHxwwaym",
  "projectName": "centaurus-drum-machine"
}
```

**Git Deployment:**
- `main` branch → `jam.audiolux.app` (Production Custom Domain)
- `dev` branch → `jam-dev.audiolux.app` (Preview Custom Domain)

**Current Protection:**
- Method: Vercel Authentication
- Level: Standard Protection
- Effect: `jam-dev.audiolux.app` requires login

### Useful Vercel CLI Commands

```bash
# Check deployment status
vercel inspect jam-dev.audiolux.app

# List all projects
vercel project ls --scope myles-3235s-projects

# Check who is logged in
vercel whoami

# View deployment details in JSON
vercel inspect jam-dev.audiolux.app --json
```

### Documentation References

- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Protection Methods](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments)
- [Bypass Methods](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection)
- [Protection Exceptions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/deployment-protection-exceptions)

## Risks and Considerations

### Security Risks
- **Public Preview Access**: Preview deployments contain unreleased features
  - Mitigation: Only share preview URL with trusted testers
  - Consider: Add application-level authentication if needed

- **Token Exposure**: Bypass tokens in URLs could be shared unintentionally
  - Mitigation: Use Protection Exceptions instead of bypass links when possible
  - Plan: Rotate tokens periodically if using bypass method

### Operational Risks
- **Plan Limitations**: Some solutions require paid plans
  - Mitigation: Verify plan tier before implementation
  - Fallback: Use bypass links on free/hobby plans

- **Domain Configuration**: Changing domain settings could affect deployments
  - Mitigation: Test thoroughly in staging before production
  - Rollback: Document original configuration for quick revert

## Success Criteria

- [ ] Testers can access `jam-dev.audiolux.app` without Vercel login
- [ ] Preview URL works in incognito/private browsing
- [ ] External users (not on Vercel team) can access and test
- [ ] Production deployment (`jam.audiolux.app`) remains unaffected
- [ ] Solution is documented for future reference
- [ ] Testing workflow is streamlined (no manual auth management)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-09 | 1.0 | Initial story creation - Vercel preview deployment authentication issue | Claude Code |

## Dev Agent Record

### Issue Discovery
- **Date**: 2025-10-09
- **Discovered by**: User testing preview deployment
- **Symptom**: `jam-dev.audiolux.app` requires Vercel login, blocking external testers

### Root Cause Analysis
- **Cause**: Vercel Standard Protection enabled by default
- **Effect**: All non-production custom domains require authentication
- **Impact**: Cannot share preview deployments with external testers

### Research Findings
1. Production domain (`jam.audiolux.app`) excluded from protection → works correctly
2. Preview custom domains are treated differently than production domains
3. Vercel offers multiple bypass/exception methods depending on plan tier
4. Auto-generated Vercel URLs may have different protection rules

### Recommended Solution
**Solution 1 (Protection Exception)** if available on plan tier, otherwise **Solution 2 (Bypass Link)**

### Implementation Status
- [ ] Verify Vercel plan tier and feature availability
- [ ] Choose appropriate solution based on plan
- [ ] Implement configuration changes
- [ ] Test with external user (incognito)
- [ ] Document final solution
- [ ] Update testing workflow documentation

## Notes

### Alternative Considerations
- If preview access becomes a regular need, consider upgrading to Pro/Enterprise for better protection control
- For sensitive features, consider adding application-level authentication instead of relying on Vercel protection
- Monitor Vercel changelog for updates to Deployment Protection features

### Related Issues
- None currently

### External Dependencies
- Vercel platform plan tier
- DNS configuration for `jam-dev.audiolux.app`
- Team access permissions

---

**Next Steps**: Verify Vercel plan tier and implement recommended solution (Protection Exception or Bypass Link)
