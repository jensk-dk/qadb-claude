// @ts-check
const { test, expect } = require('@playwright/test');

// Credential info for login
const username = 'admin';  
const password = 'admin123';
const baseURL = 'http://localhost:5173';

test.describe('Test Run and Test Run Template Workflows', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    // Create a new page for each test
    page = await browser.newPage();
    
    // Login to the application
    await page.goto(`${baseURL}/login`);
    
    // Wait for login form to be visible
    await page.waitForSelector('form');
    
    // Fill login form - note: these inputs don't have name attributes
    // Use the input types to find them
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    
    // Click the login button - it's the button with text "LOGIN"
    await page.click('button:has-text("LOGIN")');
    
    // Verify we're logged in by waiting for the dashboard
    await page.waitForURL(`${baseURL}/`);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });
  
  test.afterEach(async () => {
    await page.close();
  });
  
  // Screenshot helper function for debugging and documentation
  async function takeScreenshot(page, name) {
    await page.screenshot({ path: `./playwright-report/screenshots/${name}-${Date.now()}.png` });
  }

  test('Should display test runs and show details', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Check if test runs table is visible
    const testRunsTable = page.locator('table');
    await expect(testRunsTable).toBeVisible();
    
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
    
    // Verify the test run details are displayed
    const detailsHeading = page.locator('h1');
    await expect(detailsHeading).toContainText(testRunName);
    
    // Check if test case results are displayed
    await expect(page.locator('h2:has-text("Test Case Results")')).toBeVisible();
  });
  
  test('Should verify all components of test run detail view', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Check if we have at least one test run
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Click the view button (eye icon) on the first test run
    await firstRow.locator('button i.mdi-eye').click();
    
    // Wait for the details page to load
    await page.waitForURL(`${baseURL}/test-runs/*`);
    
    // Verify all components of the test run detail page
    
    // 1. Header Section
    const statusChip = page.locator('.v-chip').first();
    await expect(statusChip).toBeVisible();
    
    // 2. Action Buttons (Edit & Delete)
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    
    // 3. Summary Card
    await expect(page.locator('.v-card-title').filter({ hasText: 'Summary' })).toBeVisible();
    
    // 4. Pass Rate information
    await expect(page.locator('.v-list-item-title').filter({ hasText: 'Pass Rate' })).toBeVisible();
    const progressBar = page.locator('.v-progress-linear');
    await expect(progressBar).toBeVisible();
    
    // 5. Test Case Results Section
    await expect(page.locator('h2:has-text("Test Case Results")')).toBeVisible();
    
    // 6. Test Results Filtering
    await expect(page.locator('.v-select').filter({ hasText: 'Filter by Result' })).toBeVisible();
    await expect(page.locator('.v-text-field').filter({ hasText: 'Search' })).toBeVisible();
    
    // 7. Action Buttons for Results
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Result")')).toBeVisible();
    
    // 8. Test Case Results Table
    const resultsTable = page.locator('.v-data-table');
    await expect(resultsTable).toBeVisible();
    
    // Test filtering functionality
    // Filter by "Pass" results
    await page.locator('.v-select').filter({ hasText: 'Filter by Result' }).locator('.v-field').click();
    await page.locator('.v-list-item').filter({ hasText: 'Pass' }).click();
    
    // Add a search term if there are results
    const hasResults = await page.locator('table tbody tr').count() > 0;
    if (hasResults) {
      // Get first result's test case title to search for
      const firstResultTitle = await page.locator('table tbody tr').first().locator('td').nth(1).textContent();
      if (firstResultTitle && firstResultTitle.length > 3) {
        // Search for part of the title
        const searchTerm = firstResultTitle.substring(0, 3);
        await page.locator('input[aria-label="Search"]').fill(searchTerm);
        // Give time for search to apply
        await page.waitForTimeout(500);
      }
    }
    
    // Test the view details functionality if there are results
    if (hasResults) {
      // Click eye icon to view details
      await page.locator('table tbody tr').first().locator('button i.mdi-eye').click();
      
      // Verify details dialog appears
      const resultDialog = page.locator('.v-dialog').filter({ hasText: 'Close' });
      await expect(resultDialog).toBeVisible();
      
      // Close the dialog
      await page.locator('button:has-text("Close")').click();
      await expect(resultDialog).not.toBeVisible();
    }
    
    // Test the edit dialog
    await page.locator('button:has-text("Edit")').click();
    const editDialog = page.locator('.v-dialog').filter({ hasText: 'Edit Test Run' });
    await expect(editDialog).toBeVisible();
    
    // Fill in a new description in the edit dialog
    const newDescription = `Updated via Playwright test at ${new Date().toISOString()}`;
    await page.locator('textarea').fill(newDescription);
    
    // Save the changes
    await page.locator('button:has-text("Save")').click();
    
    // Verify dialog is closed
    await expect(editDialog).not.toBeVisible();
    
    // Check if description was updated in the UI
    await expect(page.locator('.v-card-text')).toContainText(newDescription);
  });

  test('Should create a new test run', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Click the "New Test Run" button
    await page.click('button:has-text("New Test Run")');
    
    // Wait for the dialog to appear
    await page.waitForSelector('div.v-dialog');
    
    // Fill out the form
    const testRunName = `Playwright Test Run ${Date.now().toString().slice(-6)}`;
    await page.fill('input[name="name"]', testRunName);
    
    // Select "Completed" from the status dropdown
    await page.click('.v-select:has-text("Status") .v-field');
    await page.click('.v-list-item:has-text("Completed")');
    
    // Try to select the first device if available
    try {
      // Find all select dropdowns
      const selects = await page.locator('.v-select .v-field').all();
      
      // Check if we have at least 2 selects (status and device)
      if (selects.length >= 2) {
        // Click the second select (device)
        await selects[1].click();
        // Select the first option
        await page.click('.v-list-item', { timeout: 2000 });
      }
    } catch (e) {
      console.log('Could not select a device, continuing...');
    }
    
    // Try to select an operator if available
    try {
      // Find all select dropdowns
      const selects = await page.locator('.v-select .v-field').all();
      
      // Check if we have at least 3 selects (status, device, operator)
      if (selects.length >= 3) {
        // Click the third select (operator)
        await selects[2].click();
        // Select the first option
        await page.click('.v-list-item', { timeout: 2000 });
      }
    } catch (e) {
      console.log('Could not select an operator, continuing...');
    }
    
    // Add a description
    await page.fill('textarea', 'Test run created by Playwright test automation');
    
    // Save the test run
    await page.click('button:has-text("Save")');
    
    // Wait for the dialog to close
    await page.waitForSelector('div.v-dialog', { state: 'hidden' });
    
    // Verify the new test run appears in the table
    const testRunRow = page.locator(`table tbody tr:has-text("${testRunName}")`);
    await expect(testRunRow).toBeVisible();
  });

  test('Should display and manage test run templates', async () => {
    // Navigate to test run templates page
    await page.goto(`${baseURL}/run-templates`);
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Test Run Templates")');
    
    // Check if templates table is visible
    const templatesTable = page.locator('table');
    await expect(templatesTable).toBeVisible();
    
    // Check if we have at least one template
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Get the name of the first template
    const templateName = await firstRow.locator('td').nth(1).textContent();
    console.log(`Found template: ${templateName}`);
    
    // Create a new template
    await page.click('button:has-text("Add Template")');
    
    // Wait for the dialog to appear
    await page.waitForSelector('div.v-dialog');
    
    // Fill out the form
    const newTemplateName = `Playwright Template ${Date.now().toString().slice(-6)}`;
    const templateId = `PW-TEMP-${Date.now().toString().slice(-6)}`;
    
    await page.fill('input[name="template_id"]', templateId);
    await page.fill('input[name="name"]', newTemplateName);
    await page.fill('textarea', 'Test run template created by Playwright test automation');
    
    // Save the template
    await page.click('button:has-text("Save")');
    
    // Wait for the dialog to close
    await page.waitForSelector('div.v-dialog', { state: 'hidden' });
    
    // Verify the new template appears in the table
    const templateRow = page.locator(`table tbody tr:has-text("${newTemplateName}")`);
    await expect(templateRow).toBeVisible();
  });
});

test.describe('Device (DUT) Management Workflows', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    // Create a new page for each test
    page = await browser.newPage();
    
    // Login to the application
    await page.goto(`${baseURL}/login`);
    
    // Wait for login form to be visible
    await page.waitForSelector('form');
    
    // Fill login form - note: these inputs don't have name attributes
    // Use the input types to find them
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    
    // Click the login button - it's the button with text "LOGIN"
    await page.click('button:has-text("LOGIN")');
    
    // Verify we're logged in by waiting for the dashboard
    await page.waitForURL(`${baseURL}/`);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });
  
  test.afterEach(async () => {
    await page.close();
  });

  test('Should display devices and allow creating new devices', async () => {
    // Navigate to devices page
    await page.goto(`${baseURL}/devices`);
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Devices Under Test")');
    
    // Check if devices table is visible
    const devicesTable = page.locator('table');
    await expect(devicesTable).toBeVisible();
    
    // Create a new device
    await page.click('button:has-text("Add Device")');
    
    // Wait for the dialog to appear
    await page.waitForSelector('div.v-dialog');
    
    // Fill out the form
    const deviceName = `Playwright Test Device ${Date.now().toString().slice(-6)}`;
    const deviceModel = `PW-Model-${Date.now().toString().slice(-6)}`;
    
    await page.fill('input[name="name"]', deviceName);
    await page.fill('input[name="model"]', deviceModel);
    await page.fill('input[name="firmware_version"]', '1.0.0');
    
    // Select "Active" from the status dropdown
    await page.click('.v-select:has-text("Status") .v-field');
    await page.click('.v-list-item:has-text("Active")');
    
    await page.fill('input[name="location"]', 'Test Lab');
    await page.fill('textarea', 'Test device created by Playwright test automation');
    
    // Save the device
    await page.click('button:has-text("Save")');
    
    // Wait for the dialog to close
    await page.waitForSelector('div.v-dialog', { state: 'hidden' });
    
    // Verify the new device appears in the table
    const deviceRow = page.locator(`table tbody tr:has-text("${deviceName}")`);
    await expect(deviceRow).toBeVisible();
  });

  test('Should edit an existing device', async () => {
    // Navigate to devices page
    await page.goto(`${baseURL}/devices`);
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Devices Under Test")');
    
    // Check if we have at least one device
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Get the name of the first device
    const deviceName = await firstRow.locator('td').nth(1).textContent();
    console.log(`Found device: ${deviceName}`);
    
    // Click the edit button (pencil icon) on the first device
    await firstRow.locator('button i.mdi-pencil').click();
    
    // Wait for the dialog to appear
    await page.waitForSelector('div.v-dialog');
    
    // Get current model value to verify it changes
    const currentModelInput = page.locator('input[name="model"]');
    const currentModel = await currentModelInput.inputValue();
    
    // Update the model field
    const updatedModel = `Updated-${Date.now().toString().slice(-6)}`;
    await currentModelInput.fill(updatedModel);
    
    // Save the device
    await page.click('button:has-text("Save")');
    
    // Wait for the dialog to close
    await page.waitForSelector('div.v-dialog', { state: 'hidden' });
    
    // Verify the device row shows the updated model
    const updatedRow = page.locator(`table tbody tr:has-text("${updatedModel}")`);
    await expect(updatedRow).toBeVisible();
  });
});

test.afterEach(async () => {
  // Moved page close to each describe block
});

test.describe('Adding Test Results to a Test Run', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    // Create a new page for each test
    page = await browser.newPage();
    
    // Login to the application
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("LOGIN")');
    await page.waitForURL(`${baseURL}/`);
  });
  
  test('Should add a new test case result to a test run', async () => {
    // Navigate to test runs page
    await page.goto(`${baseURL}/test-runs`);
    await page.waitForSelector('h1:has-text("Test Runs")');
    
    // Check if we have at least one test run
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Go to the detail view
    await firstRow.locator('button i.mdi-eye').click();
    await page.waitForURL(`${baseURL}/test-runs/*`);
    
    // Click "Add Result" button
    await page.locator('button:has-text("Add Result")').click();
    
    // Verify dialog appears
    const addDialog = page.locator('.v-dialog').filter({ hasText: 'Add Test Case Result' });
    await expect(addDialog).toBeVisible();
    
    // Select a test case from the dropdown (first one available)
    await page.locator('.v-select').filter({ hasText: 'Test Case' }).locator('.v-field').click();
    await page.locator('.v-list-item').first().click();
    
    // Select a result (Pass or Fail)
    await page.locator('.v-select').filter({ hasText: 'Result' }).locator('.v-field').click();
    await page.locator('.v-list-item').filter({ hasText: 'Pass' }).click();
    
    // Add a comment
    const comment = `Playwright test result added at ${new Date().toISOString()}`;
    await page.locator('textarea').first().fill(comment);
    
    // Add some logs
    await page.locator('textarea').nth(1).fill('Test log data created by Playwright test');
    
    // Save the result
    await page.locator('button:has-text("Add")').click();
    
    // Verify dialog is closed
    await expect(addDialog).not.toBeVisible();
    
    // Verify snackbar appears with success message
    await expect(page.locator('.v-snackbar')).toBeVisible();
  });
  
  test.afterEach(async () => {
    await page.close();
  });
});