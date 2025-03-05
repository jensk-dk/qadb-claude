// Script to test JSON import functionality with different formats
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Configuration
const API_BASE = 'http://localhost:8000/api';
const MOCK_DATA_DIR = '/home/jensk/QaDb2/mock_data';
let token = null;

// Login to get token
async function login() {
  try {
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', 'admin123');
    
    const response = await axios.post(`${API_BASE}/auth/token`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    token = response.data.access_token;
    console.log('Successfully logged in and obtained token');
    return token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Import a local file
async function importLocalFile(filePath, testRunName) {
  try {
    const response = await axios.post(`${API_BASE}/uploads/import-local-file`, {
      file_path: filePath,
      test_run_name: testRunName
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Successfully imported: ${path.basename(filePath)}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to import: ${path.basename(filePath)}`);
    console.error('   Error:', error.response?.data || error.message);
    return null;
  }
}

// Test runs API
async function getTestRuns() {
  try {
    const response = await axios.get(`${API_BASE}/test-runs/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting test runs:', error.response?.data || error.message);
    return [];
  }
}

// Main function
async function main() {
  console.log('Starting JSON import test script...');
  
  // Login
  await login();
  
  // Get JSON files from mock_data directory
  let directoryToSearch = process.argv[2] || MOCK_DATA_DIR;
  console.log(`Searching for JSON files in: ${directoryToSearch}`);
  
  const files = fs.readdirSync(directoryToSearch)
    .filter(file => file.endsWith('.json'));
  
  console.log(`Found ${files.length} JSON files for testing`);
  
  // Get initial count of test runs
  const initialRuns = await getTestRuns();
  console.log(`Initial test run count: ${initialRuns.length}`);
  
  // Import each file
  const importResults = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(directoryToSearch, fileName);
    console.log(`\nTesting file ${i+1}/${files.length}: ${fileName}`);
    
    const result = await importLocalFile(filePath, `JSON Format Test: ${fileName}`);
    if (result) {
      importResults.push({ file: fileName, success: true, details: result });
    } else {
      importResults.push({ file: fileName, success: false });
    }
    
    // Wait briefly between imports
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Check final test run count
  const finalRuns = await getTestRuns();
  console.log(`\nFinal test run count: ${finalRuns.length}`);
  console.log(`Net increase: ${finalRuns.length - initialRuns.length} test runs`);
  
  // Summarize results
  console.log('\nImport Results Summary:');
  let successCount = 0;
  for (const result of importResults) {
    if (result.success) {
      successCount++;
      console.log(`✅ ${result.file} - Success`);
    } else {
      console.log(`❌ ${result.file} - Failed`);
    }
  }
  
  console.log(`\nSuccessfully imported ${successCount} out of ${files.length} files`);
}

// Run the main function
main().catch(console.error);