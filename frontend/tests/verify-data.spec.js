// @ts-check
const { test, expect } = require('@playwright/test');

// Credential info for login
const username = 'admin';  // Replace with actual username
const password = 'password';  // Replace with actual password
const baseURL = 'http://localhost:5173';

test.describe('QA Database Data Verification', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${baseURL}/login`);
    
    // Login to the application
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // Verify we're logged in (wait for dashboard)
    await page.waitForURL(`${baseURL}/`);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('Should have test cases data displayed in TestCasesView', async () => {
    // Navigate to test cases page
    await page.goto(`${baseURL}/test-cases`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Test Cases")');
    
    // Inject our data creation script
    await page.evaluate(async () => {
      // Sample test case data
      const testCase = {
        name: 'Playwright Test Case',
        description: 'Test case created by Playwright',
        status: 'Active',
        procedure: 'Automated test creation step'
      };
      
      // Get the auth token
      const token = localStorage.getItem('token');
      
      // Create the test case
      await fetch('/api/test-cases/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase)
      });
      
      // Wait a bit for the API to process
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // Reload the page to see new data
    await page.reload();
    
    // Wait for data table
    await page.waitForSelector('table');
    
    // Check if test cases are visible in the table
    const dataTable = page.locator('table');
    await expect(dataTable).toBeVisible();
    
    // Check for the test case we created
    const testCaseRow = page.locator('table >> text=Playwright Test Case');
    await expect(testCaseRow).toBeVisible();
  });

  test('Should have test runs data displayed in TestRunsView', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Inject our data creation script to create a test run
    await page.evaluate(async () => {
      // Sample test run data
      const testRun = {
        name: 'Playwright Test Run',
        status: 'Completed',
        operator: 'Playwright',
        notes: 'Created by Playwright test',
      };
      
      // Get the auth token
      const token = localStorage.getItem('token');
      
      // Create the test run
      await fetch('/api/test-runs/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRun)
      });
      
      // Wait a bit for the API to process
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // Reload the page to see new data
    await page.reload();
    
    // Wait for data table
    await page.waitForSelector('table');
    
    // Check if test runs are visible in the table
    const dataTable = page.locator('table');
    await expect(dataTable).toBeVisible();
    
    // Check for the test run we created
    const testRunRow = page.locator('table >> text=Playwright Test Run');
    await expect(testRunRow).toBeVisible();
  });

  test.afterEach(async () => {
    await page.close();
  });
});