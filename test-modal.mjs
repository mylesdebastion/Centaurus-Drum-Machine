import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  console.log('Navigating to /wled-test...');
  await page.goto('http://localhost:5173/wled-test');

  console.log('Waiting for page load...');
  await page.waitForLoadState('networkidle');

  console.log('Looking for "Add Your First WLED Device" button...');
  const button = page.locator('button:has-text("Add Your First WLED Device")');
  const isVisible = await button.isVisible();
  console.log(`Button visible: ${isVisible}`);

  if (isVisible) {
    console.log('Clicking button...');
    await button.click();

    console.log('Waiting 1 second...');
    await page.waitForTimeout(1000);

    console.log('Checking for modal...');
    const modal = page.locator('text=Add WLED Device').first();
    const modalVisible = await modal.isVisible();
    console.log(`Modal visible: ${modalVisible}`);

    if (modalVisible) {
      console.log('✅ Modal is visible!');
    } else {
      console.log('❌ Modal is NOT visible');
      console.log('Checking if modal exists in DOM...');
      const modalExists = await modal.count();
      console.log(`Modal exists in DOM: ${modalExists > 0}`);

      if (modalExists > 0) {
        const boundingBox = await modal.boundingBox();
        console.log('Modal bounding box:', boundingBox);

        const styles = await modal.evaluate(el => {
          const computed = window.getComputedStyle(el.closest('div'));
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            zIndex: computed.zIndex,
            position: computed.position
          };
        });
        console.log('Modal styles:', styles);
      }
    }

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'modal-test.png', fullPage: true });
    console.log('Screenshot saved as modal-test.png');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
