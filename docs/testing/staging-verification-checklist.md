# Staging Verification Checklist

**Purpose**: Verify all critical infrastructure fixes work correctly before promoting to production.

**Staging URL**: Check your Vercel dashboard for the `dev` branch deployment URL

---

## ✅ Pre-Verification: Find Your Staging URL

1. Go to: https://vercel.com/dashboard
2. Click on your project: "Centaurus-Drum-Machine" or "audiolux-jam-session"
3. Look for the deployment from the `dev` branch
4. Click on the deployment to get the URL
5. It will look like: `https://centaurus-drum-machine-git-dev-*.vercel.app`

---

## 🔍 Verification Tests

### Test 1: SEO Meta Tags ✅

**What to Check**: Page has proper SEO metadata for search engines and social media

**Steps**:
1. Visit your staging URL
2. Right-click → "View Page Source" (or Ctrl+U)
3. Search for `<title>` - Should be: **"Audiolux | Web-Based Music Production Studio"**
4. Search for `og:title` - Should see Open Graph tags
5. Search for `twitter:card` - Should see Twitter Card tags

**Expected Results**:
```html
<title>Audiolux | Web-Based Music Production Studio</title>
<meta name="description" content="Create beats, melodies..." />
<meta property="og:title" content="Audiolux | Web-Based Music Production Studio" />
<meta property="og:image" content="https://...og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```

**Pass Criteria**: ✅ All meta tags present with correct content

---

### Test 2: Facebook Sharing Preview ✅

**What to Check**: Facebook will show rich preview when URL is shared

**Steps**:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your staging URL
3. Click "Debug" or "Scrape Again"
4. Check the preview

**Expected Results**:
- **Title**: Audiolux | Web-Based Music Production Studio
- **Description**: Create beats, melodies, and chord progressions...
- **Image**: Should show og-image.png (or placeholder if not created yet)

**Pass Criteria**: ✅ Preview shows correct title and description

**Note**: Image will show placeholder until you create `public/og-image.png`

---

### Test 3: Twitter Card Preview ✅

**What to Check**: Twitter will show card preview when URL is shared

**Steps**:
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your staging URL
3. Click "Preview card"

**Expected Results**:
- **Card Type**: Summary Card with Large Image
- **Title**: Audiolux | Web-Based Music Production Studio
- **Description**: Browser-based drum machine, chord arranger...
- **Image**: Should show twitter-card.png (or placeholder)

**Pass Criteria**: ✅ Card preview displays correctly

---

### Test 4: Vercel Analytics Tracking ✅

**What to Check**: Analytics are tracking page views

**Steps**:
1. Visit your staging URL
2. Navigate to a few pages (Studio, Jam Session, etc.)
3. Go to: https://vercel.com/dashboard/analytics
4. Select your project
5. Check for recent page views (may take 1-2 minutes to appear)

**Expected Results**:
- Page views appear in analytics dashboard
- Real-time tracking of user interactions

**Pass Criteria**: ✅ Analytics dashboard shows page views

---

### Test 5: Feature Flags in Browser ✅

**What to Check**: Feature flag system is loaded and accessible

**Steps**:
1. Visit your staging URL
2. Open browser console (F12 or Ctrl+Shift+J)
3. Type: `window.__FEATURE_FLAGS__`
4. Press Enter

**Expected Results**:
```javascript
{
  monetization: {
    enabled: false,
    name: "Monetization",
    description: "Premium features, paywalls, and subscription system",
    rollout: 0
  },
  analytics: {
    enabled: true,
    name: "Analytics",
    description: "Usage analytics and performance monitoring",
    rollout: 100
  },
  advancedMidiRouting: {
    enabled: true,
    name: "Advanced MIDI Routing",
    description: "Inter-module MIDI communication and routing matrix",
    rollout: 100
  },
  // ... 5 more flags
}
```

**Pass Criteria**: ✅ Object with 8 feature flags is returned

---

### Test 6: Feature Flag Logging (Dev Mode) ✅

**What to Check**: Feature flags log enabled features in console

**Steps**:
1. Still in browser console from Test 5
2. Refresh the page
3. Look for console log: `[Feature Flags] Enabled:`

**Expected Results**:
```
[Feature Flags] Enabled: Analytics (analytics), Advanced MIDI Routing (advancedMidiRouting)
```

**Pass Criteria**: ✅ Console shows enabled features (should show 2: analytics, advancedMidiRouting)

---

### Test 7: robots.txt and sitemap.xml ✅

**What to Check**: SEO infrastructure files are accessible

**Steps**:
1. Visit: `https://your-staging-url/robots.txt`
2. Visit: `https://your-staging-url/sitemap.xml`

**Expected Results**:

**robots.txt**:
```
User-agent: *
Allow: /

Sitemap: https://centaurus-drum-machine.vercel.app/sitemap.xml
```

**sitemap.xml**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://centaurus-drum-machine.vercel.app/</loc>
    <lastmod>2025-01-24</lastmod>
    ...
```

**Pass Criteria**: ✅ Both files load without 404 errors

---

### Test 8: Application Functionality ✅

**What to Check**: Core features still work (no breaking changes)

**Steps**:
1. Visit your staging URL
2. Navigate to "Studio" view
3. Try loading a module (Drum Machine, Piano Roll, etc.)
4. Test global transport controls (play/pause)
5. Navigate to "Jam Session"
6. Check that Education Mode loads

**Expected Results**:
- All views load without errors
- No console errors
- Music plays when expected
- Navigation works smoothly

**Pass Criteria**: ✅ No breaking changes, all core features work

---

## 📋 Summary Checklist

Print this or keep it handy while testing:

- [ ] **Test 1**: SEO meta tags present in page source
- [ ] **Test 2**: Facebook sharing debugger shows correct preview
- [ ] **Test 3**: Twitter card validator shows correct card
- [ ] **Test 4**: Vercel Analytics dashboard shows page views
- [ ] **Test 5**: `window.__FEATURE_FLAGS__` returns 8 flags
- [ ] **Test 6**: Console logs enabled features on load
- [ ] **Test 7**: robots.txt and sitemap.xml load successfully
- [ ] **Test 8**: Core application features work without errors

---

## ✅ All Tests Pass? Proceed to Production

If all 8 tests pass, you're ready to deploy to production!

### Next Step: Merge dev → main

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

This will trigger production deployment to: `https://centaurus-drum-machine.vercel.app`

---

## ❌ If Tests Fail

### Common Issues & Fixes

**Issue**: Meta tags not showing
- **Cause**: Caching issue
- **Fix**: Hard refresh (Ctrl+Shift+R) or clear browser cache

**Issue**: Analytics not tracking
- **Cause**: Takes 1-2 minutes to appear
- **Fix**: Wait a few minutes and refresh analytics dashboard

**Issue**: Feature flags undefined
- **Cause**: JavaScript not loaded yet
- **Fix**: Wait for page to fully load, then check console

**Issue**: Application errors
- **Cause**: Build issue or TypeScript error
- **Fix**: Check Vercel deployment logs for errors

---

## 🎯 Success Criteria Summary

**Minimum to Pass**:
- ✅ SEO meta tags present (Tests 1-3)
- ✅ Analytics tracking (Test 4)
- ✅ Feature flags accessible (Tests 5-6)
- ✅ No breaking changes (Test 8)

**Optional (Can fix later)**:
- Social media images (create og-image.png, twitter-card.png)
- Additional analytics configuration

---

**Document Version**: 1.0
**Last Updated**: 2025-01-24
**Related**: `docs/assessments/workflow-assessment-2025-01-24.md`
