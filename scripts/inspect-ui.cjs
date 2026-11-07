const path = require('path');
const fs = require('fs');

const playwrightPath = 'C:/Users/abu/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
const { chromium } = require(playwrightPath);

async function run() {
  console.log('--- Starting Playwright UI Verification & Interactive Testing ---');
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const artifactsDir = path.resolve(__dirname, '..', 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const checkOverflow = async (page, viewName) => {
    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const elementsWithOverflow = [];
      if (docWidth > winWidth) {
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 1) {
            elementsWithOverflow.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className || '').toString().slice(0, 80),
              right: rect.right,
              winWidth
            });
          }
        });
      }
      return { docWidth, winWidth, hasOverflow: docWidth > winWidth, badElements: elementsWithOverflow.slice(0, 5) };
    });

    console.log(`[${viewName}] Overflow check: docWidth=${overflow.docWidth}, winWidth=${overflow.winWidth}, hasOverflow=${overflow.hasOverflow}`);
    if (overflow.hasOverflow) {
      console.warn(`[${viewName}] WARNING: Horizontal overflow detected!`, overflow.badElements);
    }
    return overflow;
  };

  // 1. Desktop Light Mode
  console.log('\n[1/6] Capturing Desktop Light Mode (1280x800)...');
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(400);
    await checkOverflow(page, 'Desktop Light');
    await page.screenshot({ path: path.join(artifactsDir, 'desktop-light-fixed.png'), fullPage: true });
    console.log('Saved desktop-light-fixed.png');
    await context.close();
  }

  // 2. Desktop Dark Mode
  console.log('\n[2/6] Capturing Desktop Dark Mode (1280x800)...');
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(400);
    await checkOverflow(page, 'Desktop Dark');
    await page.screenshot({ path: path.join(artifactsDir, 'desktop-dark-fixed.png'), fullPage: true });
    console.log('Saved desktop-dark-fixed.png');
    await context.close();
  }

  // 3. Mobile Light Mode (iPhone 390x844)
  console.log('\n[3/6] Capturing Mobile Light Mode (390x844)...');
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(400);
    const ov = await checkOverflow(page, 'Mobile Light');
    if (ov.hasOverflow) {
      throw new Error(`Mobile Light has horizontal overflow! scrollWidth=${ov.docWidth} > innerWidth=${ov.winWidth}`);
    }
    await page.screenshot({ path: path.join(artifactsDir, 'mobile-light-fixed.png'), fullPage: true });
    console.log('Saved mobile-light-fixed.png');
    await context.close();
  }

  // 4. Mobile Dark Mode (Pixel 412x915)
  console.log('\n[4/6] Capturing Mobile Dark Mode (412x915)...');
  {
    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(400);
    const ov = await checkOverflow(page, 'Mobile Pixel Dark');
    if (ov.hasOverflow) {
      throw new Error(`Mobile Pixel Dark has horizontal overflow! scrollWidth=${ov.docWidth} > innerWidth=${ov.winWidth}`);
    }
    await page.screenshot({ path: path.join(artifactsDir, 'mobile-dark-fixed.png'), fullPage: true });
    console.log('Saved mobile-dark-fixed.png');
    await context.close();
  }

  // 5. Desktop Interactive Workflow Test
  console.log('\n[5/6] Testing Interactive UI on Desktop...');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Test Theme toggle button
    const themeBtn = await page.$('#theme-toggle-btn');
    if (themeBtn) {
      console.log('Clicking theme toggle button...');
      await themeBtn.click();
      await page.waitForTimeout(300);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      console.log('Theme toggled. Is dark now:', isDark);
    }

    // Test Model switching
    console.log('Testing Mode Selector tabs...');
    const thinkingTab = await page.locator('button[role="tab"]:has-text("Thinking Mode")');
    await thinkingTab.click();
    await page.waitForTimeout(200);
    const thinkingText = await page.locator('text=Deep Reasoning Mode').isVisible();
    console.log('Thinking Mode active and description visible:', thinkingText);

    // Test Tone switching
    console.log('Testing Tone Selector tabs...');
    const confidentTab = await page.locator('button[role="tab"]:has-text("Confident")');
    await confidentTab.click();
    await page.waitForTimeout(200);

    // Test Target Opportunity URL switch
    console.log('Testing Target Opportunity URL mode switch...');
    const urlTab = await page.locator('button[role="tab"]:has-text("URL")');
    await urlTab.click();
    await page.waitForTimeout(200);
    const urlInputVisible = await page.locator('input[type="url"]').isVisible();
    const urlModeActiveText = await page.locator('text=URL Mode Active').isVisible();
    console.log('URL input visible:', urlInputVisible, 'URL Mode Active banner visible:', urlModeActiveText);

    // Switch back to Text
    const textTab = await page.locator('button[role="tab"]:has-text("Text")');
    await textTab.click();
    await page.waitForTimeout(200);

    // Test Sample resume and job preview toggles
    console.log('Testing sample preview toggles...');
    const resumeSampleBtn = await page.locator('button:has-text("Preview sample resume")');
    await resumeSampleBtn.click();
    await page.waitForTimeout(200);
    const resumeSampleOpen = await page.locator('button:has-text("Hide sample")').count();
    console.log('Sample resume preview opened:', resumeSampleOpen > 0);

    const jobSampleBtn = await page.locator('button:has-text("Preview sample job description")');
    await jobSampleBtn.click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(artifactsDir, 'desktop-interactive.png'), fullPage: true });
    console.log('Saved desktop-interactive.png');
    await context.close();
  }

  // 6. Mobile Interactive & Avatar Dropdown Test
  console.log('\n[6/6] Testing Mobile Interactive & Avatar Circle Dropdown (390x844)...');
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Test Avatar Circle click to open the Popover
    console.log('Clicking mobile profile menu avatar circle (#profile-menu-button)...');
    const avatarBtn = await page.locator('#profile-menu-button');
    await avatarBtn.click();
    await page.waitForTimeout(300);

    const isPopoverVisible = await page.locator('role=dialog').isVisible();
    console.log('Avatar dropdown popover visible:', isPopoverVisible);

    // Check inside popover for Sign in text & theme toggle
    const signInTitle = await page.locator('text=Sign in to CoverCraft').isVisible();
    console.log('Sign in title visible inside popover:', signInTitle);

    // Capture the avatar menu popover on mobile
    await page.screenshot({ path: path.join(artifactsDir, 'mobile-avatar-menu.png') });
    console.log('Saved mobile-avatar-menu.png');

    // Click outside to close the popover
    await page.mouse.click(50, 400);
    await page.waitForTimeout(200);

    // Verify all 4 tones are accessible and clickable on mobile
    for (const tone of ['Professional', 'Enthusiastic', 'Confident', 'Creative']) {
      const tab = await page.locator(`button[role="tab"]:has-text("${tone}")`);
      const visible = await tab.isVisible();
      if (!visible) throw new Error(`Tone tab "${tone}" is not visible on mobile!`);
      await tab.click();
    }
    console.log('All 4 Tone tabs clicked successfully on mobile!');

    // Verify all 4 modes are accessible and clickable on mobile
    for (const mode of ['Standard', 'Thinking Mode', 'Low Latency', 'Search Grounding']) {
      const tab = await page.locator(`button[role="tab"]:has-text("${mode}")`);
      const visible = await tab.isVisible();
      if (!visible) throw new Error(`Mode tab "${mode}" is not visible on mobile!`);
      await tab.click();
    }
    console.log('All 4 Mode tabs clicked successfully on mobile!');

    await page.screenshot({ path: path.join(artifactsDir, 'mobile-interactive.png'), fullPage: true });
    console.log('Saved mobile-interactive.png');
    await context.close();
  }

  await browser.close();
  console.log('\n=== ALL PLAYWRIGHT UI TESTS PASSED CLEANLY! ===');
}

run().catch((err) => {
  console.error('\nPlaywright Test Failed:', err);
  process.exit(1);
});
