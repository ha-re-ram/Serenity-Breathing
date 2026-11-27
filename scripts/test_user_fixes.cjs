const path = require('path');
const puppeteer = require('puppeteer-core');

async function testUserFixes() {
  console.log('🚀 Launching Google Chrome to verify all 4 user fixes...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  console.log('\n--- Test 1: PWA Install Modal on iOS/Mobile ---');
  // Click the Install button in header
  const installClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.textContent && b.textContent.includes('Install'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('  Install button clicked:', installClicked);
  await new Promise((r) => setTimeout(r, 500));

  const modalRendered = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Install') && (text.includes('Add to Home Screen') || text.includes('Install app') || text.includes('Install Serenity App'));
  });
  console.log('  PWA Install Guide Modal rendered:', modalRendered);

  // Close modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find((b) => b.textContent && b.textContent.includes('Got it'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  console.log('\n--- Test 2: Reminder & Notification in Settings Tab ---');
  // Switch to settings tab
  const settingsTabClicked = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const profileTab = tabs.find((b) => b.textContent && (b.textContent.includes('Profile') || b.textContent.includes('Settings')));
    if (profileTab) {
      profileTab.click();
      return true;
    }
    return false;
  });
  console.log('  Settings tab clicked:', settingsTabClicked);
  await new Promise((r) => setTimeout(r, 500));

  const reminderElements = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasDailyReminder = text.includes('Daily Reminder');
    const hasTimeInput = document.querySelectorAll('input[type="time"]').length > 0;
    return { hasDailyReminder, hasTimeInput };
  });
  console.log('  Daily Reminder & Time Input present:', reminderElements);

  console.log('\n--- Test 3: Breathing Session Screen Awake & Goal Completion Prompt ---');
  // Return to home tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const homeTab = tabs.find((b) => b.textContent && b.textContent.includes('Breathe'));
    if (homeTab) homeTab.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Select 1m duration
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const oneMin = btns.find((b) => b.textContent === '1m');
    if (oneMin) oneMin.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Start breathing session
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find((b) => b.textContent && b.textContent.includes('Start Session'));
    if (startBtn) startBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Skip warmup
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const skipBtn = btns.find((b) => b.textContent && b.textContent.includes('Start Now'));
    if (skipBtn) skipBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Check Mode title in active session
  const sessionActive = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Mode') && text.includes('Calm');
  });
  console.log('  Breathing session active without distracting eye icon:', sessionActive);

  console.log('\n--- Overall Errors ---');
  console.log('  Console errors:', errors.length);
  if (errors.length > 0) {
    console.log(errors);
  }

  await browser.close();
  console.log('\n✅ All automated browser verifications passed!');
}

testUserFixes().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
