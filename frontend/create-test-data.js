// Script to create test data for the QA Database
const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8000/api';
let token = null;

// Sample data
const testSuite = {
  name: 'Core Functionality Tests',
  description: 'Basic tests for core system functionality',
  version: '1.0'
};

const testCases = [
  {
    name: 'Login Verification',
    description: 'Verify user can log in with valid credentials',
    status: 'Active',
    procedure: '1. Navigate to login page\n2. Enter valid credentials\n3. Click login button\n4. Verify user is redirected to dashboard'
  },
  {
    name: 'Data Validation',
    description: 'Ensure proper data validation on input forms',
    status: 'Active',
    procedure: '1. Navigate to data entry form\n2. Attempt to submit invalid data\n3. Verify error messages appear\n4. Submit valid data\n5. Verify submission succeeds'
  },
  {
    name: 'Report Generation',
    description: 'Test the report generation functionality',
    status: 'Active',
    procedure: '1. Navigate to reports section\n2. Select report parameters\n3. Click generate\n4. Verify report is created with correct data'
  }
];

const device = {
  name: 'Test Server',
  description: 'Primary test environment server',
  model: 'Server-X2000',
  firmware_version: '10.5.2',
  status: 'Active',
  location: 'Lab Room 302'
};

// Set up functions
async function login() {
  try {
    const formData = new FormData();
    formData.append('username', 'admin');  // Replace with actual credentials
    formData.append('password', 'password');  // Replace with actual credentials
    
    const response = await axios.post(`${API_BASE}/auth/token`, formData);
    token = response.data.access_token;
    console.log('Successfully logged in');
    return token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function createTestSuite() {
  try {
    const response = await axios.post(`${API_BASE}/test-suites/`, testSuite, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Created test suite:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create test suite:', error.response?.data || error.message);
    return null;
  }
}

async function createTestCases(testSuiteId) {
  const createdTestCases = [];
  
  for (const testCase of testCases) {
    try {
      // Add test suite ID if provided
      const testCaseData = { ...testCase };
      if (testSuiteId) {
        testCaseData.test_suite_id = testSuiteId;
      }
      
      const response = await axios.post(`${API_BASE}/test-cases/`, testCaseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Created test case:', response.data.name);
      createdTestCases.push(response.data);
    } catch (error) {
      console.error(`Failed to create test case ${testCase.name}:`, error.response?.data || error.message);
    }
  }
  
  return createdTestCases;
}

async function createDevice() {
  try {
    const response = await axios.post(`${API_BASE}/duts/`, device, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Created device:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create device:', error.response?.data || error.message);
    return null;
  }
}

async function createTestRun(testCases, deviceId) {
  try {
    const testRun = {
      name: 'Verification Test Run',
      status: 'Completed',
      device_id: deviceId,
      operator: 'System',
      notes: 'Automatically created test run',
      test_case_results: testCases.map(tc => ({
        test_case_id: tc.id,
        result: Math.random() > 0.3 ? 'Pass' : 'Fail',  // 70% pass rate
        comments: 'Automated test result'
      }))
    };
    
    const response = await axios.post(`${API_BASE}/test-runs/`, testRun, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Created test run:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create test run:', error.response?.data || error.message);
    return null;
  }
}

async function createJsonTestRun(testCases, deviceId) {
  try {
    // Create a JSON structure for a test run with results
    const testRunJson = {
      test_run: {
        name: 'Imported JSON Test Run',
        date: new Date().toISOString(),
        device_id: deviceId,
        operator: 'System'
      },
      results: testCases.map(tc => ({
        test_case_id: tc.id,
        result: Math.random() > 0.3 ? 'Pass' : 'Fail',  // 70% pass rate
        comments: 'Imported from JSON'
      }))
    };
    
    // Create a Blob from the JSON
    const jsonBlob = new Blob([JSON.stringify(testRunJson)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', jsonBlob, 'test-results.json');
    formData.append('test_run_name', 'JSON Import Test Run');
    if (deviceId) {
      formData.append('device_id', deviceId);
    }
    
    const response = await axios.post(`${API_BASE}/uploads/test-results`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('Created JSON test run:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create JSON test run:', error.response?.data || error.message);
    return null;
  }
}

// Main execution
async function main() {
  await login();
  
  // Create test suite
  const createdSuite = await createTestSuite();
  
  // Create test cases
  const createdTestCases = await createTestCases(createdSuite?.id);
  
  // Create device
  const createdDevice = await createDevice();
  
  // Create test run if we have test cases
  if (createdTestCases.length > 0 && createdDevice) {
    await createTestRun(createdTestCases, createdDevice.id);
    
    // Also create a "JSON imported" test run
    try {
      await createJsonTestRun(createdTestCases, createdDevice.id);
    } catch (error) {
      console.log('Note: JSON import simulation failed, but regular test run should work');
    }
  }
  
  console.log('Test data creation complete');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
});