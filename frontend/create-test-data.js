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

const devices = [
  {
    product_name: 'Smart TV Alpha',
    make: 'TechVision',
    model: 'STV-A5000',
    countries: 'US, EU, JP'
  },
  {
    product_name: 'Smart Speaker Beta',
    make: 'AudioTech',
    model: 'SSB-200',
    countries: 'US, CA, UK'
  },
  {
    product_name: 'Media Player Gamma',
    make: 'MediaStream',
    model: 'MPG-300',
    countries: 'Global'
  }
];

// Set up functions
async function login() {
  try {
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', 'admin123'); // Default password from README
    
    const response = await axios.post(`${API_BASE}/auth/token`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    token = response.data.access_token;
    console.log('Successfully logged in and obtained token');
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

async function createDevices() {
  const createdDevices = [];
  
  for (const device of devices) {
    try {
      const response = await axios.post(`${API_BASE}/duts/`, device, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Created device:', response.data.product_name);
      createdDevices.push(response.data);
    } catch (error) {
      console.error(`Failed to create device ${device.product_name}:`, error.response?.data || error.message);
    }
  }
  
  return createdDevices;
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

// Add test run templates
const testRunTemplates = [
  {
    template_id: 'QUICK-TEMPLATE',
    name: 'Quick Test Template',
    description: 'Template for quick smoke tests'
  },
  {
    template_id: 'FULL-TEMPLATE',
    name: 'Full Test Template',
    description: 'Complete test coverage template'
  }
];

async function createTestRunTemplates(testCases) {
  const createdTemplates = [];
  
  for (const template of testRunTemplates) {
    try {
      // Select a subset of test cases for this template
      const templateTestCases = testCases
        .slice(0, Math.min(testCases.length, 2)) // Use up to 2 test cases
        .map(tc => ({ test_case_id: tc.id }));
      
      const templateData = {
        ...template,
        test_cases: templateTestCases
      };
      
      const response = await axios.post(`${API_BASE}/test-run-templates/`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Created test run template:', response.data.name);
      createdTemplates.push(response.data);
    } catch (error) {
      console.error(`Failed to create template ${template.name}:`, error.response?.data || error.message);
    }
  }
  
  return createdTemplates;
}

// Main execution
async function main() {
  await login();
  
  // Create test suite
  const createdSuite = await createTestSuite();
  
  // Create test cases
  const createdTestCases = await createTestCases(createdSuite?.id);
  
  // Create devices
  const createdDevices = await createDevices();
  
  // Create test run templates
  if (createdTestCases.length > 0) {
    await createTestRunTemplates(createdTestCases);
  }
  
  // Create test run if we have test cases and devices
  if (createdTestCases.length > 0 && createdDevices.length > 0) {
    // Use the first device for the test run
    const firstDevice = createdDevices[0];
    await createTestRun(createdTestCases, firstDevice.id);
    
    // Also create a "JSON imported" test run
    try {
      await createJsonTestRun(createdTestCases, firstDevice.id);
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