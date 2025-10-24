# Social Media Images - Creation Guide

## Required Images

### 1. Open Graph Image (`og-image.png`)
**Dimensions**: 1200 × 630 pixels
**Format**: PNG or JPG
**Purpose**: Facebook, LinkedIn, Slack previews
**Location**: `/public/og-image.png`

### 2. Twitter Card Image (`twitter-card.png`)
**Dimensions**: 1200 × 628 pixels (or 1200 × 675 for 16:9)
**Format**: PNG or JPG
**Purpose**: Twitter/X link previews
**Location**: `/public/twitter-card.png`

---

## Design Guidelines

### Color Scheme
Use the project's color palette from `tailwind.config.js`:
- **Primary**: Indigo/Purple tones (#6366f1 to #a855f7)
- **Accent**: Pink/Rose tones (#ec4899 to #f43f5e)
- **Background**: Dark gradient (gray-900 to gray-800)

### Typography
- **Font**: Inter (already loaded in project)
- **Title**: Bold, large (60-80px)
- **Subtitle**: Medium weight (24-32px)

### Content Suggestions

#### Option 1: Screenshot-Based
- Take screenshot of Studio view with multiple modules
- Add dark gradient overlay
- Overlay text: "Audiolux | Web-Based Music Production"
- Add tagline: "Create beats, melodies & chord progressions in your browser"

#### Option 2: Icon-Based
- Dark gradient background
- Large centered icon/logo
- Text: "Audiolux"
- Feature icons: MIDI controller, LED visualization, collaboration
- Tagline at bottom

#### Option 3: Feature Showcase
- Split image into 3-4 sections
- Show different modules: Drum Machine, Chord Arranger, Piano Roll
- Overlay text: "All-in-One Music Studio"

---

## Quick Creation Tools

### Free Design Tools
1. **Figma** (Recommended)
   - Use free tier
   - Template: Social Media Graphics → OG Image
   - Export as PNG

2. **Canva**
   - Use "Facebook Post" template (1200 × 630)
   - Free tier sufficient
   - Export as PNG

3. **Photopea** (Browser-based Photoshop)
   - https://www.photopea.com/
   - Create new image: 1200 × 630px
   - Free, no account required

### AI Image Generation
1. **Midjourney/DALL-E** (if you have access)
   - Prompt: "Modern music production studio interface, dark theme, purple and pink gradients, minimalist UI, web dashboard, isometric view, professional"

2. **Stable Diffusion**
   - Similar prompt
   - Use UI/dashboard style keywords

---

## Step-by-Step: Figma Quick Method

1. **Create Account** (free): https://figma.com

2. **Create New File**
   - Frame: 1200 × 630px (name it "og-image")
   - Frame: 1200 × 628px (name it "twitter-card")

3. **Design Elements**
   ```
   Background: Linear gradient
   - Start: #111827 (gray-900)
   - End: #1f2937 (gray-800)
   - Angle: 135°

   Title Text: "Audiolux"
   - Font: Inter Bold
   - Size: 80px
   - Color: #ffffff

   Subtitle: "Web-Based Music Production Studio"
   - Font: Inter Medium
   - Size: 32px
   - Color: #d1d5db (gray-300)

   Accent Elements:
   - Add purple/pink gradient shapes
   - Use rounded rectangles (border-radius: 12px)
   - Add subtle glow effects
   ```

4. **Export**
   - Select frame
   - Right panel → Export → PNG → 2x quality
   - Save to `/public/` folder

---

## Alternative: Use Screenshot + Overlay

### 1. Take App Screenshot
```bash
# Run app locally
npm run dev

# Navigate to Studio view with modules open
# Use browser screenshot tool or:
# - Windows: Win + Shift + S
# - Mac: Cmd + Shift + 4
```

### 2. Edit in Any Tool
- Add dark overlay (opacity 30-50%)
- Add title text
- Crop to 1200 × 630px

### 3. Quick Photoshop/Photopea Steps
1. Open screenshot
2. Resize canvas to 1200 × 630px (Image → Canvas Size)
3. Add new layer
4. Fill with black gradient (opacity 40%)
5. Add text layer: "Audiolux | Music Production Studio"
6. Export as PNG

---

## Validation

### Check Your Images
Before deploying, validate with:

1. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Enter your URL
   - Check image preview

2. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Enter your URL
   - Check card preview

3. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/
   - Enter your URL
   - Check preview

---

## Temporary Placeholder

Until custom images are created, you can use a solid color image:

### Quick Placeholder Generator (Browser Console)
```javascript
// Run in browser console to generate base64 placeholder
const canvas = document.createElement('canvas');
canvas.width = 1200;
canvas.height = 630;
const ctx = canvas.getContext('2d');

// Gradient background
const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
gradient.addColorStop(0, '#6366f1');
gradient.addColorStop(1, '#a855f7');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1200, 630);

// Text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 80px Inter';
ctx.textAlign = 'center';
ctx.fillText('Audiolux', 600, 280);

ctx.font = '32px Inter';
ctx.fillText('Web-Based Music Production', 600, 380);

// Download
canvas.toBlob(blob => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'og-image.png';
  a.click();
});
```

---

## Current Status

### ✅ SEO Meta Tags Ready
- All meta tags reference `/og-image.png` and `/twitter-card.png`
- Ready for images to be added

### ⏳ Images Needed
- [ ] Create `public/og-image.png` (1200 × 630px)
- [ ] Create `public/twitter-card.png` (1200 × 628px)
- [ ] Validate with Facebook Sharing Debugger
- [ ] Validate with Twitter Card Validator

### 🎨 Recommendation
Use Figma or take a Studio screenshot with text overlay for fastest results.

---

## Resources

- **Figma Templates**: https://www.figma.com/community/tag/social%20media
- **OG Image Guide**: https://og-image.vercel.app/
- **Image Size Reference**: https://sproutsocial.com/insights/social-media-image-sizes-guide/
- **Color Picker**: https://coolors.co/

---

**Document Version**: 1.0
**Last Updated**: 2025-01-24
**Related**: `index.html` (meta tags), `docs/assessments/workflow-assessment-2025-01-24.md`
