const { chromium } = require('playwright');

// User credentials
const username = 'admin';
const password = 'admin123';

// Base URL
const baseURL = 'http://localhost:5173';

async function verifyUI() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto(`${baseURL}/login`);
    
    await page.screenshot({ path: 'login-page.png' });
    
    // Login page DOM check
    const loginFormHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('Login page HTML sample:', loginFormHTML.substring(0, 500) + '...');
    
    await browser.close();
    console.log('Browser closed. Check the screenshots for verification.');
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-state.png' });
    await browser.close();
  }
}

// Run the verification
verifyUI().catch(console.error);