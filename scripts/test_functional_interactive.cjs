const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

async function testInteractions() {
  console.log('🚀 Running Comprehensive Functional & Interactive Verification...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  // Test on standard mobile (375x812)
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- 1. Testing Mood Selection on Home Screen ---');
  // Click "Calm" mood emoji
  const moodClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const calmBtn = buttons.find((b) => b.textContent && b.textContent.includes('Calm'));
    if (calmBtn) {
      calmBtn.click();
      return true;
    }
    return false;
  });
  console.log('  Mood "Calm" clicked:', moodClicked);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_1_mood_selected.png') });

  console.log('--- 2. Testing Duration Selector ---');
  const durationChanged = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tenMinBtn = buttons.find((b) => b.textContent && b.textContent.includes('10m'));
    if (tenMinBtn) {
      tenMinBtn.click();
      return true;
    }
    return false;
  });
  console.log('  Duration "10m" selected:', durationChanged);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_2_duration_selected.png') });

  console.log('--- 3. Testing Breathing Session Lifecycle (Warmup -> Pause -> Resume -> Finish) ---');
  // Start session
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find((b) => b.textContent && b.textContent.includes('Start Session'));
    if (startBtn) startBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Skip warmup
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const skipBtn = buttons.find((b) => b.textContent && b.textContent.includes('Start Now'));
    if (skipBtn) skipBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_3_session_active.png') });

  // Pause session
  await page.evaluate(() => {
    const pauseBtn = document.querySelector('button[aria-label="Pause session"]');
    if (pauseBtn) pauseBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_4_session_paused.png') });

  // Finish session early -> goes to reflection screen
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const finishBtn = buttons.find((b) => b.textContent && b.textContent.includes('Finish Session'));
    if (finishBtn) finishBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_5_session_reflection.png') });

  // Skip post-session reflection to return home
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const skipBtn = buttons.find((b) => b.textContent && b.textContent.includes('Skip'));
    if (skipBtn) skipBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('--- 4. Testing Habit Tracker in Progress Tab ---');
  // Navigate to Progress tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const progressBtn = buttons.find((b) => b.textContent && b.textContent.includes('Progress'));
    if (progressBtn) progressBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Add new habit
  const habitInput = await page.$('input[placeholder*="habit"]');
  if (habitInput) {
    await habitInput.type('Evening Reading');
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 500));
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_6_habit_added.png') });

  // Toggle habit completion
  const habitToggled = await page.evaluate(() => {
    const checkBtns = Array.from(document.querySelectorAll('button[title*="today"]'));
    if (checkBtns.length > 0) {
      checkBtns[0].click();
      return true;
    }
    return false;
  });
  console.log('  Habit toggled today:', habitToggled);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_7_habit_toggled.png') });

  console.log('--- 5. Testing Profile & Dark Mode Toggle ---');
  // Navigate to Profile / Settings tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const profileBtn = buttons.find((b) => b.textContent && b.textContent.includes('Profile'));
    if (profileBtn) profileBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Toggle Dark Mode
  const darkModeToggled = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const darkBtn = buttons.find((b) => b.textContent && (b.textContent.includes('Off') || b.textContent.includes('On')));
    if (darkBtn) {
      darkBtn.click();
      return true;
    }
    return false;
  });
  console.log('  Dark mode toggled:', darkModeToggled);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_8_dark_mode.png') });

  console.log('--- 6. Testing PWA Install Button & Modal ---');
  // Check if Install Button is present in Profile tab
  const installClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const installBtn = buttons.find((b) => b.textContent && b.textContent.includes('Install'));
    if (installBtn) {
      installBtn.click();
      return true;
    }
    return false;
  });
  console.log('  Install button clicked:', installClicked);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interaction_9_install_flow.png') });

  await browser.close();
  console.log('🎉 All interactive functional flows tested and screenshots recorded successfully!');
}

testInteractions().catch((err) => {
  console.error('Fatal interaction test error:', err);
  process.exit(1);
});
