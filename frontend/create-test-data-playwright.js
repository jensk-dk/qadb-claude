const { chromium } = require('playwright');

// User credentials
const username = 'admin';
const password = 'admin123';

// Base URL
const baseURL = 'http://localhost:5173';

async function createTestData() {
  console.log('Starting browser...');
  // Run in headless mode for CI/CD environments
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto(`${baseURL}/login`);
    
    // Wait for the login form to be visible
    await page.waitForSelector('form');
    console.log('Login form visible, filling credentials...');
    
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'login-form.png' });
    console.log('Saved login form screenshot for debugging');
    
    await page.click('form button[type="submit"]');
    
    // Wait for dashboard to appear after login
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {
      console.log('Navigation after login timed out, continuing...');
    });
    
    // Check if we're logged in by looking for dashboard elements
    const isLoggedIn = await page.isVisible('header nav').catch(() => false);
    if (!isLoggedIn) {
      console.error('Failed to log in, cannot continue');
      await page.screenshot({ path: 'login-failed.png' });
      return;
    }
    
    console.log('Successfully logged in');

    // Create test suites
    console.log('Creating test suites...');
    await page.goto(`${baseURL}/test-suites`);
    await page.waitForSelector('h1:has-text("Test Suites")').catch(() => {
      console.log('Test Suites page not loaded properly');
    });
    
    const testSuites = [
      { name: 'UI Functionality', format: 'HTML', version: '1.0' },
      { name: 'API Integration', format: 'JSON', version: '1.0' },
      { name: 'Performance Tests', format: 'Excel', version: '1.0' }
    ];
    
    for (const suite of testSuites) {
      try {
        // Look for Add button
        const addButton = await page.waitForSelector('button:has-text("Add")', { timeout: 5000 });
        await addButton.click();
        
        // Wait for the form dialog
        await page.waitForSelector('form', { timeout: 5000 });
        
        // Fill out the form
        await page.fill('input[name="name"]', suite.name);
        await page.fill('input[name="format"]', suite.format);
        await page.fill('input[name="version_string"]', suite.version);
        
        // Submit the form
        await page.click('form button[type="submit"]');
        await page.waitForTimeout(1000); // Wait for the operation to complete
        console.log(`Created test suite: ${suite.name}`);
      } catch (error) {
        console.error(`Error creating test suite ${suite.name}:`, error.message);
        await page.screenshot({ path: `suite-error-${suite.name}.png` });
      }
    }

    // Create DUTs
    console.log('Creating devices...');
    await page.goto(`${baseURL}/devices`);
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {
      console.log('Devices page not loaded properly');
    });
    
    const devices = [
      { name: 'Smart TV Model X', make: 'TechCorp', model: 'X2000' },
      { name: 'Set-top Box Pro', make: 'MediaTech', model: 'STB-500' },
      { name: 'Mobile Testing Device', make: 'DeviceCo', model: 'TestPhone 10' }
    ];
    
    for (const device of devices) {
      try {
        // Look for Add button
        const addButton = await page.waitForSelector('button:has-text("Add")', { timeout: 5000 });
        await addButton.click();
        
        // Wait for the form dialog
        await page.waitForSelector('form', { timeout: 5000 });
        
        // Fill out the form
        await page.fill('input[name="product_name"]', device.name);
        await page.fill('input[name="make"]', device.make);
        await page.fill('input[name="model"]', device.model);
        
        // Submit the form
        await page.click('form button[type="submit"]');
        await page.waitForTimeout(1000); // Wait for the operation to complete
        console.log(`Created device: ${device.name}`);
      } catch (error) {
        console.error(`Error creating device ${device.name}:`, error.message);
        await page.screenshot({ path: `device-error-${device.name}.png` });
      }
    }

    // Create test cases
    console.log('Creating test cases...');
    await page.goto(`${baseURL}/test-cases`);
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {
      console.log('Test Cases page not loaded properly');
    });
    
    const testCases = [
      { id: 'UI-001', title: 'Login Form Validation', version: '1.0' },
      { id: 'UI-002', title: 'Dashboard Data Display', version: '1.0' },
      { id: 'API-001', title: 'REST API Authentication', version: '1.0' },
      { id: 'PERF-001', title: 'Page Load Performance', version: '1.0' }
    ];
    
    for (const testCase of testCases) {
      try {
        // Look for Add button
        const addButton = await page.waitForSelector('button:has-text("Add")', { timeout: 5000 });
        await addButton.click();
        
        // Wait for the form dialog
        await page.waitForSelector('form', { timeout: 5000 });
        
        // Fill out the form
        await page.fill('input[name="case_id"]', testCase.id);
        await page.fill('input[name="title"]', testCase.title);
        await page.fill('input[name="version_string"]', testCase.version);
        
        // Try to select a test suite
        try {
          // Click dropdown to open options
          await page.click('div[role="button"]', { timeout: 3000 });
          // Select first option
          await page.click('li', { timeout: 3000 });
        } catch (error) {
          console.log('Could not select a test suite, continuing without one');
        }
        
        // Submit the form
        await page.click('form button[type="submit"]');
        await page.waitForTimeout(1000); // Wait for the operation to complete
        console.log(`Created test case: ${testCase.title}`);
      } catch (error) {
        console.error(`Error creating test case ${testCase.title}:`, error.message);
        await page.screenshot({ path: `testcase-error-${testCase.id}.png` });
      }
    }

    // Create test run templates
    console.log('Creating test run templates...');
    await page.goto(`${baseURL}/run-templates`);
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {
      console.log('Test Run Templates page not loaded properly');
    });
    
    const templates = [
      { id: 'TEMPLATE-001', name: 'Release Test Template' },
      { id: 'TEMPLATE-002', name: 'Regression Test Template' }
    ];
    
    for (const template of templates) {
      try {
        // Look for Add button
        const addButton = await page.waitForSelector('button:has-text("Add")', { timeout: 5000 });
        await addButton.click();
        
        // Wait for the form dialog
        await page.waitForSelector('form', { timeout: 5000 });
        
        // Fill out the form
        await page.fill('input[name="template_id"]', template.id);
        await page.fill('input[name="name"]', template.name);
        
        // Submit the form
        await page.click('form button[type="submit"]');
        await page.waitForTimeout(1000); // Wait for the operation to complete
        console.log(`Created test run template: ${template.name}`);
      } catch (error) {
        console.error(`Error creating template ${template.name}:`, error.message);
        await page.screenshot({ path: `template-error-${template.id}.png` });
      }
    }

    // Create test runs
    console.log('Creating test runs...');
    await page.goto(`${baseURL}/test-runs`);
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {
      console.log('Test Runs page not loaded properly');
    });
    
    for (let i = 0; i < 2; i++) {
      try {
        // Look for Add button
        const addButton = await page.waitForSelector('button:has-text("Add")', { timeout: 5000 });
        await addButton.click();
        
        // Wait for the form dialog
        await page.waitForSelector('form', { timeout: 5000 });
        
        // Fill out the form
        await page.fill('input[name="name"]', `Test Run ${i + 1}`);
        
        // Try to select status
        try {
          // Click dropdown to open options
          await page.click('div[role="button"]', { timeout: 3000 });
          // Select first option
          await page.click('li:has-text("Completed")', { timeout: 3000 });
        } catch (error) {
          console.log('Could not select status, continuing with default');
        }
        
        // Try to select a device
        try {
          // Find device dropdown (second dropdown after status)
          const dropdowns = await page.$$('div[role="button"]');
          if (dropdowns.length > 1) {
            await dropdowns[1].click();
            await page.click('li', { timeout: 3000 }); // Select first option
          }
        } catch (error) {
          console.log('Could not select a device, continuing without one');
        }
        
        // Submit the form
        await page.click('form button[type="submit"]');
        await page.waitForTimeout(1000); // Wait for the operation to complete
        console.log(`Created test run: Test Run ${i + 1}`);
      } catch (error) {
        console.error(`Error creating test run ${i + 1}:`, error.message);
        await page.screenshot({ path: `testrun-error-${i + 1}.png` });
      }
    }

    console.log('Test data creation completed successfully!');
  } catch (error) {
    console.error('Error creating test data:', error);
    // Take final screenshot on error
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
}

// Run the script
createTestData().catch(console.error);