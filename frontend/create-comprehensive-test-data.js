// Script to create comprehensive test data for QA Database
const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE = 'http://localhost:8000/api';
let token = null;

// Sample data for test suites
const testSuites = [
  {
    name: 'UI Functionality Suite',
    format: 'HTML',
    version: 1,
    version_string: '1.0',
    url: 'https://example.com/ui-tests',
    is_final: false
  },
  {
    name: 'API Integration Suite', 
    format: 'JSON',
    version: 1,
    version_string: '1.0',
    url: 'https://example.com/api-tests',
    is_final: false
  },
  {
    name: 'Performance Suite', 
    format: 'Excel',
    version: 1,
    version_string: '1.0',
    url: 'https://example.com/perf-tests',
    is_final: true
  }
];

// Sample data for DUTs (Devices Under Test)
const duts = [
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
  },
  {
    product_name: 'Set-top Box Delta',
    make: 'ViewConnect',
    model: 'STB-D400',
    countries: 'EU, APAC'
  },
  {
    product_name: 'Mobile Device Epsilon',
    make: 'MobiConnect',
    model: 'MDE-500',
    countries: 'US, EU, CA'
  }
];

// Login to get token
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
    throw error;
  }
}

// Create test suites
async function createTestSuites() {
  const createdSuites = [];
  
  for (const suite of testSuites) {
    try {
      const response = await axios.post(`${API_BASE}/test-suites/`, suite, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Created test suite: ${response.data.name} (ID: ${response.data.id})`);
      createdSuites.push(response.data);
    } catch (error) {
      // Check if it's a duplication error
      console.error(`Failed to create test suite ${suite.name}:`, error.response?.data || error.message);
    }
  }
  
  // If no suites were created, try to get existing ones
  if (createdSuites.length === 0) {
    try {
      const response = await axios.get(`${API_BASE}/test-suites/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`Using ${response.data.length} existing test suites`);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get test suites:', error.response?.data || error.message);
    }
  }
  
  return createdSuites;
}

// Create test cases linked to test suites
async function createTestCases(suites) {
  // Sample data for test cases with corrected field names
  const testCases = [];
  
  // Generate 5 test cases for each suite
  suites.forEach(suite => {
    for (let i = 1; i <= 5; i++) {
      const prefix = suite.name.split(' ')[0].substring(0, 2).toUpperCase();
      testCases.push({
        case_id: `${prefix}-${String(i).padStart(3, '0')}`,
        title: `${suite.name} Test Case ${i}`,
        version: 1,
        version_string: '1.0',
        description: `This is test case ${i} for ${suite.name}`,
        steps: `Step 1: Prepare test environment\nStep 2: Execute test case\nStep 3: Verify results\nStep 4: Record outcome`,
        precondition: `System is in a stable state with ${suite.name} available`,
        area: suite.name.split(' ')[0],
        automatability: Math.random() > 0.3 ? 'Yes' : 'Manual',
        author: 'Test Author',
        material: 'Test Documentation',
        is_challenged: Math.random() > 0.8,
        test_suite_id: suite.id
      });
    }
  });

  const createdCases = [];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post(`${API_BASE}/test-cases/`, testCase, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Created test case: ${response.data.title} (ID: ${response.data.id})`);
      createdCases.push(response.data);
    } catch (error) {
      console.error(`Failed to create test case ${testCase.title}:`, error.response?.data || error.message);
    }
  }
  
  // If no cases were created, try to get existing ones
  if (createdCases.length === 0) {
    try {
      const response = await axios.get(`${API_BASE}/test-cases/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`Using ${response.data.length} existing test cases`);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get test cases:', error.response?.data || error.message);
    }
  }
  
  return createdCases;
}

// Create DUTs (Devices Under Test)
async function createDUTs() {
  const createdDUTs = [];
  
  for (const dut of duts) {
    try {
      const response = await axios.post(`${API_BASE}/duts/`, dut, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Created DUT: ${response.data.product_name} (ID: ${response.data.id})`);
      createdDUTs.push(response.data);
    } catch (error) {
      console.error(`Failed to create DUT ${dut.product_name}:`, error.response?.data || error.message);
    }
  }
  
  // If no DUTs were created, try to get existing ones
  if (createdDUTs.length === 0) {
    try {
      const response = await axios.get(`${API_BASE}/duts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`Using ${response.data.length} existing DUTs`);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get DUTs:', error.response?.data || error.message);
    }
  }
  
  return createdDUTs;
}

// Create test run templates
async function createTestRunTemplates(testCases) {
  const templates = [
    {
      template_id: 'RELEASE-TEMPLATE',
      name: 'Release Certification Template',
      description: 'Standard template for release certification tests'
    },
    {
      template_id: 'REGRESSION-TEMPLATE',
      name: 'Regression Test Template',
      description: 'Template for regression testing after code changes'
    },
    {
      template_id: 'SMOKE-TEMPLATE',
      name: 'Smoke Test Template',
      description: 'Quick smoke test to validate basic functionality'
    }
  ];
  
  const createdTemplates = [];
  
  for (const template of templates) {
    try {
      // Select a subset of test cases for this template
      const templateTestCases = testCases
        .slice(0, Math.ceil(Math.random() * 5) + 3) // Random number between 3 and 8
        .map(tc => ({ test_case_id: tc.id }));
      
      const templateData = {
        ...template,
        test_cases: templateTestCases
      };
      
      const response = await axios.post(`${API_BASE}/test-run-templates/`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Created test run template: ${response.data.name} (ID: ${response.data.id})`);
      createdTemplates.push(response.data);
    } catch (error) {
      console.error(`Failed to create template ${template.name}:`, error.response?.data || error.message);
    }
  }
  
  // If no templates were created, try to get existing ones
  if (createdTemplates.length === 0) {
    try {
      const response = await axios.get(`${API_BASE}/test-run-templates/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`Using ${response.data.length} existing test run templates`);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get test run templates:', error.response?.data || error.message);
    }
  }
  
  return createdTemplates;
}

// Create or get operator for test runs
async function getOrCreateOperator() {
  let operatorId = null;
  
  // First, try to get existing users
  try {
    const response = await axios.get(`${API_BASE}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.length > 0) {
      operatorId = response.data[0].id;
      console.log(`Using existing operator ID: ${operatorId}`);
      return operatorId;
    }
  } catch (error) {
    console.error('Failed to get users:', error.response?.data || error.message);
  }
  
  // If no users found, try to register a new one
  try {
    const userData = {
      name: 'Test Operator',
      mail: 'test.operator@example.com',
      login: 'testoperator',
      password: 'testpassword123',
      access_rights: 'User'
    };
    
    const response = await axios.post(`${API_BASE}/auth/register`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    operatorId = response.data.id;
    console.log(`Created new operator: ${response.data.name} (ID: ${operatorId})`);
    return operatorId;
  } catch (error) {
    console.error('Failed to create operator:', error.response?.data || error.message);
  }
  
  // If we couldn't get or create an operator, default to admin (ID 1)
  console.log('Defaulting to operator ID 1 (admin)');
  return 1;
}

// Create test runs
async function createTestRuns(testCases, duts) {
  // Get operator ID
  const operatorId = await getOrCreateOperator();
  
  const testRunTypes = [
    { name: 'Daily Smoke Test', status: 'Completed' },
    { name: 'Weekly Regression', status: 'Completed' },
    { name: 'Monthly Release Certification', status: 'Completed' },
    { name: 'Critical Issue Verification', status: 'Completed' },
    { name: 'Current Sprint Validation', status: 'Running' },
    { name: 'Upcoming Release', status: 'Scheduled' }
  ];
  
  const createdRuns = [];
  
  for (let i = 0; i < testRunTypes.length; i++) {
    try {
      // Use a different DUT for each test run (cycling if needed)
      const dutId = duts[i % duts.length].id;
      
      // Include a subset of test cases with results
      const testCaseSubset = testCases.slice(0, Math.ceil(Math.random() * 7) + 3); // 3-10 test cases
      
      const testRunData = {
        name: testRunTypes[i].name,
        status: testRunTypes[i].status,
        operator_id: operatorId,
        dut_id: dutId,
        description: `Test run for ${testRunTypes[i].name}`,
        run_date: new Date().toISOString().split('T')[0]
      };
      
      // Create the test run
      const response = await axios.post(`${API_BASE}/test-runs/`, testRunData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Created test run: ${response.data.name} (ID: ${response.data.id})`);
      const testRunId = response.data.id;
      
      // Add results to the test run
      if (testRunTypes[i].status === 'Completed') {
        let passCount = 0;
        
        for (const testCase of testCaseSubset) {
          try {
            // 80% pass rate for completed test runs
            const result = Math.random() < 0.8 ? 'Pass' : 'Fail';
            if (result === 'Pass') passCount++;
            
            const resultData = {
              test_run_id: testRunId,
              test_case_id: testCase.id,
              result: result,
              comment: `${result === 'Pass' ? 'Successfully passed.' : 'Failed due to unexpected output.'}`,
              logs: `Test execution log for case ${testCase.case_id}`
            };
            
            await axios.post(`${API_BASE}/test-case-results/`, resultData, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (resultError) {
            console.error(`Failed to add result for test case ${testCase.id}:`, resultError.response?.data || resultError.message);
          }
        }
        
        console.log(`Added ${testCaseSubset.length} results to test run ${testRunId} (${passCount} passes)`);
      }
      
      createdRuns.push(response.data);
    } catch (error) {
      console.error(`Failed to create test run ${testRunTypes[i].name}:`, error.response?.data || error.message);
    }
  }
  
  return createdRuns;
}

// Create JSON test result file for import testing
function createTestResultJSONFile(testCases, duts) {
  const dutId = duts[0].id;
  
  const testRunJson = {
    test_run: {
      name: 'Imported JSON Test Run',
      date: new Date().toISOString().split('T')[0],
      device_id: dutId,
      operator: 'Test Script',
      description: 'This test run was created by the test data script for import testing'
    },
    results: testCases.slice(0, 5).map(tc => ({
      test_case_id: tc.id,
      result: Math.random() > 0.2 ? 'Pass' : 'Fail', // 80% pass rate
      comments: 'Automatically generated test result',
      logs: `Test execution log for case ${tc.case_id}`
    }))
  };
  
  // Write to file
  const fileName = './test-results-import.json';
  fs.writeFileSync(fileName, JSON.stringify(testRunJson, null, 2));
  console.log(`Created test results JSON file at ${fileName}`);
  
  return fileName;
}

// Main execution
async function main() {
  try {
    await login();
    
    const suites = await createTestSuites();
    if (suites.length === 0) {
      console.error('Failed to create or retrieve any test suites. Exiting.');
      return;
    }
    
    const duts = await createDUTs();
    if (duts.length === 0) {
      console.error('Failed to create or retrieve any DUTs. Exiting.');
      return;
    }
    
    const cases = await createTestCases(suites);
    if (cases.length === 0) {
      console.error('Failed to create or retrieve any test cases. Exiting.');
      return;
    }
    
    const templates = await createTestRunTemplates(cases);
    const runs = await createTestRuns(cases, duts);
    
    // Create a test results JSON file for import testing
    const jsonFile = createTestResultJSONFile(cases, duts);
    
    console.log('\nTest data creation completed successfully!');
    console.log('Created or using:');
    console.log(`- ${suites.length} test suites`);
    console.log(`- ${cases.length} test cases`);
    console.log(`- ${duts.length} DUTs`);
    console.log(`- ${templates.length} test run templates`);
    console.log(`- ${runs.length} test runs`);
    console.log(`- 1 test results JSON file for import testing`);
  } catch (error) {
    console.error('Error in main execution:', error);
  }
}

// Run the script
main().catch(console.error);