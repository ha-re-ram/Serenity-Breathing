const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { id: 'small_mobile', name: 'Small mobile', width: 320, height: 568 },
  { id: 'standard_mobile', name: 'Standard mobile', width: 375, height: 812 },
  { id: 'large_mobile', name: 'Large mobile', width: 430, height: 932 },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024 },
  { id: 'laptop', name: 'Laptop', width: 1366, height: 768 },
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900 },
  { id: 'large_desktop', name: 'Large desktop', width: 1920, height: 1080 },
  { id: 'landscape_small', name: 'Landscape small mobile', width: 568, height: 320 },
  { id: 'landscape_mobile', name: 'Landscape mobile', width: 812, height: 375 }
];

async function run() {
  console.log('🚀 Launching Google Chrome for responsive inspection...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const page = await browser.newPage();
    const errors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      errors.push(`Page Error: ${err.message}`);
    });

    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Helper: Check horizontal overflow
    const checkOverflow = async (contextName) => {
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth;
        const overflowingElements = [];

        if (hasOverflow) {
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              overflowingElements.push({
                tag: el.tagName,
                className: (el.className || '').toString().slice(0, 80),
                right: Math.round(rect.right),
                excess: Math.round(rect.right - winWidth)
              });
            }
          }
        }

        return {
          hasOverflow,
          docWidth,
          winWidth,
          excess: docWidth - winWidth,
          overflowingElements: overflowingElements.slice(0, 5)
        };
      });

      if (overflow.hasOverflow) {
        console.warn(`  ⚠️ [${contextName}] Horizontal overflow detected! docWidth: ${overflow.docWidth}px, winWidth: ${overflow.winWidth}px (+${overflow.excess}px)`);
        console.warn('    Elements causing overflow:', JSON.stringify(overflow.overflowingElements));
      } else {
        console.log(`  ✅ [${contextName}] No horizontal overflow (${overflow.docWidth}px / ${overflow.winWidth}px)`);
      }

      return overflow;
    };

    const vpResult = {
      viewport: vp,
      overflow: {},
      screenshots: {},
      errors: []
    };

    // 1. Home Screen Check & Screenshot
    vpResult.overflow.home = await checkOverflow('Home Screen');
    const homeShot = path.join(SCREENSHOT_DIR, `${vp.id}_home.png`);
    await page.screenshot({ path: homeShot, fullPage: false });
    vpResult.screenshots.home = homeShot;

    // 2. Navigate to Progress Screen
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const progressBtn = buttons.find((b) => b.textContent && b.textContent.includes('Progress'));
        if (progressBtn) progressBtn.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      vpResult.overflow.progress = await checkOverflow('Progress Screen');
      const progressShot = path.join(SCREENSHOT_DIR, `${vp.id}_progress.png`);
      await page.screenshot({ path: progressShot, fullPage: false });
      vpResult.screenshots.progress = progressShot;
    } catch (e) {
      errors.push(`Progress navigation failed: ${e.message}`);
    }

    // 3. Navigate to Profile / Settings Screen
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const profileBtn = buttons.find((b) => b.textContent && b.textContent.includes('Profile'));
        if (profileBtn) profileBtn.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      vpResult.overflow.settings = await checkOverflow('Profile/Settings Screen');
      const settingsShot = path.join(SCREENSHOT_DIR, `${vp.id}_settings.png`);
      await page.screenshot({ path: settingsShot, fullPage: false });
      vpResult.screenshots.settings = settingsShot;
    } catch (e) {
      errors.push(`Profile navigation failed: ${e.message}`);
    }

    // 4. Return to Home and Open Active Breathing Session
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const homeBtn = buttons.find((b) => b.textContent && b.textContent.includes('Home'));
        if (homeBtn) homeBtn.click();
      });
      await new Promise((r) => setTimeout(r, 400));

      // Click "Start Session"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find((b) => b.textContent && b.textContent.includes('Start Session'));
        if (startBtn) startBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));

      vpResult.overflow.session = await checkOverflow('Active Session Screen');
      const sessionShot = path.join(SCREENSHOT_DIR, `${vp.id}_session.png`);
      await page.screenshot({ path: sessionShot, fullPage: false });
      vpResult.screenshots.session = sessionShot;

      // 5. Open Sound & Ambience Modal inside Session
      const soundBtnClicked = await page.evaluate(() => {
        const soundBtn = document.querySelector('button[title="Sound settings"]') ||
                         document.querySelector('button[aria-label="Sound settings"]');
        if (soundBtn) {
          soundBtn.click();
          return true;
        }
        return false;
      });

      if (soundBtnClicked) {
        await new Promise((r) => setTimeout(r, 400));
        vpResult.overflow.soundModal = await checkOverflow('Sound Modal');
        const soundShot = path.join(SCREENSHOT_DIR, `${vp.id}_sound_modal.png`);
        await page.screenshot({ path: soundShot, fullPage: false });
        vpResult.screenshots.soundModal = soundShot;

        // Close sound modal
        await page.evaluate(() => {
          const closeBtn = document.querySelector('button[aria-label="Close"]') ||
                           Array.from(document.querySelectorAll('button')).find((b) => b.querySelector('svg.lucide-x'));
          if (closeBtn) closeBtn.click();
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      // Close / cancel active session
      await page.evaluate(() => {
        const cancelBtn = document.querySelector('button[aria-label="Cancel session"]') ||
                          Array.from(document.querySelectorAll('button')).find((b) => b.querySelector('svg.lucide-x'));
        if (cancelBtn) cancelBtn.click();
      });
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      errors.push(`Session check failed: ${e.message}`);
    }

    vpResult.errors = errors;
    results.push(vpResult);
    await page.close();
  }

  await browser.close();

  const reportPath = path.join(SCREENSHOT_DIR, 'responsive_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n🎉 Responsive test suite complete! Report saved to ${reportPath}`);
}

run().catch((err) => {
  console.error('Fatal error running responsive test suite:', err);
  process.exit(1);
});
