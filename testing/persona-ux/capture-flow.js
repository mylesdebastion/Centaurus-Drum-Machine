/**
 * Playwright Screenshot Capture for Persona UX Testing
 *
 * Captures screenshots of persona tutorial flows for visual analysis.
 *
 * Usage:
 *   node capture-flow.js --story=22.1 --persona=m
 *   node capture-flow.js --story=22.1 --persona=e --url="/?v=e"
 *
 * Options:
 *   --story=epic.story Story ID for organization (default: adhoc)
 *   --persona=m|e|v|p  Persona code (required)
 *   --url=path         URL path to test (default: /?v={persona})
 *   --base=url         Base URL (default: http://localhost:5173)
 *   --mobile-only      Only capture mobile viewport
 *   --desktop-only     Only capture desktop viewport
 *
 * Screenshots saved to: testing/persona-ux/screenshots/{story}-{persona}/
 * Filename format: {story}-{persona}-{step}-{viewport}-{date}.png
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const PERSONA_CODE = args.persona;
const STORY_ID = args.story || 'adhoc'; // e.g., "22.1"
const BASE_URL = args.base || 'http://localhost:5173';
const URL_PATH = args.url || `/?v=${PERSONA_CODE}`;
const MOBILE_ONLY = args['mobile-only'];
const DESKTOP_ONLY = args['desktop-only'];

// Persona metadata
const PERSONAS = {
  m: { name: 'Musician', steps: 4 },
  e: { name: 'Educator', steps: 4 },
  v: { name: 'Visual Learner', steps: 4 },
  p: { name: 'Producer', steps: 4 }
};

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2 }, // iPhone SE
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1 }
};

// Validate persona code
if (!PERSONA_CODE || !PERSONAS[PERSONA_CODE]) {
  console.error('❌ Error: Invalid or missing persona code');
  console.error('Usage: node capture-flow.js --persona=m|e|v|p');
  process.exit(1);
}

const persona = PERSONAS[PERSONA_CODE];
const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
// Organize by story/persona: screenshots/22.1-m/
const screenshotDir = path.join(__dirname, 'screenshots', `${STORY_ID}-${PERSONA_CODE}`);

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

console.log(`\n🎭 Persona UX Screenshot Capture`);
console.log(`================================`);
console.log(`Persona: ${persona.name} (${PERSONA_CODE})`);
console.log(`URL: ${BASE_URL}${URL_PATH}`);
console.log(`Output: ${screenshotDir}/`);
console.log(`Timestamp: ${timestamp}\n`);

/**
 * Capture screenshot with retry logic
 */
async function captureScreenshot(page, stepName, viewport) {
  // Filename format: {story}-{persona}-{step}-{viewport}-{date}.png
  // Example: 22.1-m-step2-desktop-20250125.png
  const filename = `${STORY_ID}-${PERSONA_CODE}-${stepName}-${viewport}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);

  try {
    await page.screenshot({
      path: filepath,
      fullPage: false // Only capture viewport (not full scrollable page)
    });
    console.log(`✅ Captured: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Failed to capture ${filename}:`, error.message);
    return null;
  }
}

/**
 * Wait for page to be interactive
 */
async function waitForInteractive(page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.warn('⚠️  Network not idle after 10s, continuing anyway...');
  });
  await page.waitForTimeout(1000); // Additional wait for animations
}

/**
 * Capture flow for specific viewport
 */
async function captureFlow(browser, viewport, viewportName) {
  console.log(`\n📱 ${viewportName} Viewport (${viewport.width}x${viewport.height})`);
  console.log(`${'='.repeat(50)}`);

  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    // Navigate to initial URL
    console.log(`Loading: ${BASE_URL}${URL_PATH}`);
    await page.goto(`${BASE_URL}${URL_PATH}`, { waitUntil: 'domcontentloaded' });
    await waitForInteractive(page);

    // Step 0: Initial landing (persona selector or first tutorial step)
    await captureScreenshot(page, 'step0-landing', viewportName);

    // For tutorial flows, capture each step
    for (let step = 1; step <= persona.steps; step++) {
      // Try to find and click "Next" or "Continue" button
      const nextButtonSelectors = [
        'button:has-text("Next")',
        'button:has-text("Continue")',
        'button:has-text("Start")',
        'button:has-text("Get Started")',
        '[data-testid="next-step"]',
        '.btn-primary:has-text("Next")',
      ];

      let clicked = false;
      for (const selector of nextButtonSelectors) {
        try {
          const button = await page.waitForSelector(selector, { timeout: 2000 });
          if (button) {
            await button.click();
            await waitForInteractive(page);
            clicked = true;
            break;
          }
        } catch (e) {
          // Button not found, try next selector
        }
      }

      if (!clicked) {
        console.warn(`⚠️  Could not find next button for step ${step}, ending capture`);
        break;
      }

      // Capture current step
      await captureScreenshot(page, `step${step}`, viewportName);
    }

    // Capture final/completion screen
    await captureScreenshot(page, 'completion', viewportName);

  } catch (error) {
    console.error(`❌ Error during ${viewportName} capture:`, error.message);
  } finally {
    await context.close();
  }
}

/**
 * Main execution
 */
(async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    // Capture desktop viewport (unless mobile-only)
    if (!MOBILE_ONLY) {
      await captureFlow(browser, VIEWPORTS.desktop, 'desktop');
    }

    // Capture mobile viewport (unless desktop-only)
    if (!DESKTOP_ONLY) {
      await captureFlow(browser, VIEWPORTS.mobile, 'mobile');
    }

    console.log(`\n✅ Screenshot capture complete!`);
    console.log(`📁 Screenshots saved to: ${screenshotDir}/`);
    console.log(`\n🔍 Next step: Run QA agent UX review`);
    console.log(`   @qa *ux-review ${PERSONA_CODE}\n`);

  } catch (error) {
    console.error(`\n❌ Fatal error:`, error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
