// @ts-check
const { test, expect } = require('@playwright/test');

// Credential info for login
const username = 'admin';  
const password = 'admin123';
const baseURL = 'http://localhost:5173';

test.describe('Test Run Detail View Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    // Create a new page for each test
    page = await browser.newPage();
    
    // Login to the application
    await page.goto(`${baseURL}/login`);
    
    // Wait for login form to be visible
    await page.waitForSelector('form');
    
    // Fill login form
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    
    // Click the login button
    await page.click('button:has-text("LOGIN")');
    
    // Verify we're logged in by waiting for the dashboard
    await page.waitForURL(`${baseURL}/`);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('Should show test run details page with all components', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Check if we have at least one test run
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Get the name of the first test run
    const testRunName = await firstRow.locator('td').nth(1).textContent();
    console.log(`Found test run: ${testRunName}`);
    
    // Click the view button (eye icon) on the first test run
    await firstRow.locator('button i.mdi-eye').click();
    
    // Wait for the details page to load
    await page.waitForURL(`${baseURL}/test-runs/*`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: './playwright-report/test-run-detail.png' });
    
    // Verify the main components are displayed
    
    // 1. Header with test run name
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // 2. Status chip
    const statusChip = page.locator('.v-chip').first();
    await expect(statusChip).toBeVisible();
    
    // 3. Summary card
    const summaryCard = page.locator('.v-card-title').filter({ hasText: 'Summary' });
    await expect(summaryCard).toBeVisible();
    
    // 4. Test case results section
    const resultsHeading = page.locator('h2:has-text("Test Case Results")');
    await expect(resultsHeading).toBeVisible();
    
    // 5. Filtering controls
    const filterSelect = page.locator('.v-select').filter({ hasText: 'Filter by Result' });
    await expect(filterSelect).toBeVisible();
    
    // 6. Results table
    const resultsTable = page.locator('.v-data-table');
    await expect(resultsTable).toBeVisible();
  });
  
  test('Should be able to edit test run details', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Get the first test run
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click the view button (eye icon) on the first test run
    await firstRow.locator('button i.mdi-eye').click();
    
    // Wait for the details page to load
    await page.waitForURL(`${baseURL}/test-runs/*`);
    
    // Click the edit button
    await page.locator('button:has-text("Edit")').click();
    
    // Wait for edit dialog to appear
    const editDialog = page.locator('.v-dialog').filter({ hasText: 'Edit Test Run' });
    await expect(editDialog).toBeVisible();
    
    // Update the description
    const newDescription = `Updated via Playwright test at ${new Date().toISOString()}`;
    await page.locator('.v-dialog textarea').fill(newDescription);
    
    // Save the changes
    await page.locator('.v-dialog button:has-text("Save")').click();
    
    // Wait for dialog to close
    await expect(editDialog).not.toBeVisible();
    
    // Check if description was updated in the UI
    await expect(page.locator('.v-card-text')).toContainText(newDescription);
  });
  
  test('Should filter test case results', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Get the first test run
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click the view button (eye icon) on the first test run
    await firstRow.locator('button i.mdi-eye').click();
    
    // Wait for the details page to load
    await page.waitForURL(`${baseURL}/test-runs/*`);
    
    // Count initial results rows
    const initialRowCount = await page.locator('table tbody tr').count();
    console.log(`Initial row count: ${initialRowCount}`);
    
    // If there are results, test filtering
    if (initialRowCount > 0) {
      // Filter by "Pass" results
      await page.locator('.v-select').filter({ hasText: 'Filter by Result' }).locator('.v-field').click();
      await page.locator('.v-list-item').filter({ hasText: 'Pass' }).click();
      
      // Give time for filtering to apply
      await page.waitForTimeout(500);
      
      // Search for a term
      const searchTerm = 'test';
      await page.locator('input[aria-label="Search"]').fill(searchTerm);
      
      // Give time for search to apply
      await page.waitForTimeout(500);
      
      // Check if filtering worked - count may be different
      const filteredRowCount = await page.locator('table tbody tr').count();
      console.log(`Filtered row count: ${filteredRowCount}`);
      
      // Clear filters
      await page.locator('input[aria-label="Search"]').fill('');
      await page.locator('.v-select').filter({ hasText: 'Filter by Result' }).locator('.v-field').click();
      await page.locator('.v-list-item').filter({ hasText: 'All' }).click();
      
      // Give time for clearing to apply
      await page.waitForTimeout(500);
      
      // Count should be back to initial
      const clearedRowCount = await page.locator('table tbody tr').count();
      console.log(`Cleared filter row count: ${clearedRowCount}`);
      expect(clearedRowCount).toEqual(initialRowCount);
    }
  });
  
  test.afterEach(async () => {
    await page.close();
  });
});