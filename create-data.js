// Script to create sample data for testing
const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8000/api';
let token = null;

// Sample data for test suites
const testSuites = [
  {
    name: 'UI Functionality',
    format: 'HTML',
    version: 1,
    version_string: '1.0',
    url: 'https://example.com/ui-tests',
    is_final: false
  },
  {
    name: 'API Integration', 
    format: 'JSON',
    version: 1,
    version_string: '1.0',
    url: 'https://example.com/api-tests',
    is_final: false
  },
  {
    name: 'Performance', 
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
    product_name: 'Smart TV Model X',
    make: 'TechCorp',
    model: 'X2000',
    countries: 'US, EU, JP'
  },
  {
    product_name: 'Set-top Box Pro',
    make: 'MediaTech',
    model: 'STB-500',
    countries: 'US, CA, UK'
  },
  {
    product_name: 'Mobile Testing Device',
    make: 'DeviceCo',
    model: 'TestPhone 10',
    countries: 'Global'
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
      console.error(`Failed to create test suite ${suite.name}:`, error.response?.data || error.message);
    }
  }
  
  return createdSuites;
}

// Create test cases linked to test suites
async function createTestCases(suites) {
  // Sample data for test cases with corrected field names
  const testCases = [
    {
      case_id: 'UI-001',
      title: 'Login Form Validation',
      version: 1,
      version_string: '1.0',
      description: 'Verify login form validation for various inputs',
      steps: '1. Navigate to login page\n2. Try empty username\n3. Try invalid password\n4. Try valid credentials',
      precondition: 'User account exists in system',
      area: 'Authentication',
      automatability: 'Yes',
      author: 'QA Engineer',
      material: 'Test Data Set 1',
      is_challenged: false
    },
    {
      case_id: 'UI-002',
      title: 'Dashboard Data Display',
      version: 1,
      version_string: '1.0',
      description: 'Verify dashboard correctly displays user data',
      steps: '1. Login as test user\n2. Navigate to dashboard\n3. Verify data matches expected values',
      precondition: 'User has associated data',
      area: 'Dashboard',
      automatability: 'Yes',
      author: 'QA Engineer',
      material: 'User Data Sample',
      is_challenged: false
    },
    {
      case_id: 'API-001',
      title: 'REST API Authentication',
      version: 1,
      version_string: '1.0',
      description: 'Verify REST API authentication works correctly',
      steps: '1. Attempt unauthenticated access\n2. Verify 401 response\n3. Authenticate with token\n4. Verify successful access',
      precondition: 'API server is running',
      area: 'API Security',
      automatability: 'Yes',
      author: 'API Tester',
      material: 'API Documentation',
      is_challenged: false
    },
    {
      case_id: 'PERF-001',
      title: 'Page Load Performance',
      version: 1,
      version_string: '1.0',
      description: 'Measure page load times under various conditions',
      steps: '1. Measure initial page load\n2. Measure cached page load\n3. Compare against baseline',
      precondition: 'System is in baseline state',
      area: 'Performance',
      automatability: 'Yes',
      author: 'Performance Engineer',
      material: 'Performance Metrics',
      is_challenged: false
    }
  ];

  const createdCases = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const suiteIndex = i % suites.length; // Distribute test cases among suites
    
    try {
      const testCaseData = {
        ...testCase,
        test_suite_id: suites[suiteIndex].id
      };
      
      const response = await axios.post(`${API_BASE}/test-cases/`, testCaseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Created test case: ${response.data.title} (ID: ${response.data.id})`);
      createdCases.push(response.data);
    } catch (error) {
      console.error(`Failed to create test case ${testCase.title}:`, error.response?.data || error.message);
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
  
  return createdDUTs;
}

// Create test run templates
async function createTestRunTemplates(testCases) {
  const templates = [
    {
      template_id: 'TEMPLATE-001',
      name: 'Release Test Template',
      description: 'Template for release verification tests'
    },
    {
      template_id: 'TEMPLATE-002',
      name: 'Regression Test Template',
      description: 'Template for regression testing'
    }
  ];
  
  const createdTemplates = [];
  
  for (const template of templates) {
    try {
      // Create template with half the test cases
      const templateTestCases = testCases
        .slice(0, Math.ceil(testCases.length / 2))
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
  
  return createdTemplates;
}

// Register a test operator/user
async function createTestOperator() {
  try {
    const operatorData = {
      name: 'Test Operator',
      mail: 'operator@example.com',
      login: 'testoperator',
      password: 'testpassword123',
      access_rights: 'User'
    };
    
    const response = await axios.post(`${API_BASE}/auth/register`, operatorData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Created operator: ${response.data.name} (ID: ${response.data.id})`);
    return response.data.id;
  } catch (error) {
    console.error('Failed to create operator:', error.response?.data || error.message);
    
    // Try to list users to find one we can use
    try {
      const usersResponse = await axios.get(`${API_BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (usersResponse.data && usersResponse.data.length > 0) {
        const firstUser = usersResponse.data[0];
        console.log(`Using existing operator: ${firstUser.name} (ID: ${firstUser.id})`);
        return firstUser.id;
      }
    } catch (getError) {
      console.error('Failed to get users:', getError.response?.data || getError.message);
    }
    
    return null;
  }
}

// Create simpler version of test runs without test case results
async function createSimpleTestRuns(operatorId, duts) {
  const testRuns = [];
  
  // Create two simple test runs
  for (let i = 0; i < 2; i++) {
    try {
      const testRunData = {
        name: `Simple Test Run ${i + 1}`,
        status: 'Completed',
        operator_id: operatorId,
        dut_id: duts[i % duts.length].id,
        description: `Test run created for validation ${i + 1}`,
      };
      
      const response = await axios.post(`${API_BASE}/test-runs/`, testRunData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Created simple test run: ${response.data.name} (ID: ${response.data.id})`);
      testRuns.push(response.data);
    } catch (error) {
      console.error(`Failed to create simple test run ${i + 1}:`, error.response?.data || error.message);
      console.error("Response data:", error.response?.data);
    }
  }
  
  return testRuns;
}

// Create test runs with results
async function createTestRunsWithResults(testCases, duts, operatorId) {
  const testRuns = [];
  
  // Create test runs one by one, adding results after creating the run
  for (let i = 0; i < 2; i++) {
    try {
      // First create the test run without results
      const testRunData = {
        name: `Test Run With Results ${i + 1}`,
        status: 'Completed',
        operator_id: operatorId,
        dut_id: duts[i % duts.length].id,
        description: `Test run with results ${i + 1}`
      };
      
      const runResponse = await axios.post(`${API_BASE}/test-runs/`, testRunData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const testRunId = runResponse.data.id;
      console.log(`Created test run: ${runResponse.data.name} (ID: ${testRunId})`);
      
      // Now add results to this test run
      for (const testCase of testCases) {
        try {
          const resultData = {
            test_run_id: testRunId,
            test_case_id: testCase.id,
            result: Math.random() > 0.3 ? 'Pass' : 'Fail', // 70% pass rate
            comment: 'Automated test result',
            logs: 'Test execution logs would be here'
          };
          
          const resultResponse = await axios.post(`${API_BASE}/test-case-results/`, resultData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log(`Added result for test case ${testCase.id} to test run ${testRunId}`);
        } catch (resultError) {
          console.error(`Failed to add result for test case ${testCase.id}:`, resultError.response?.data || resultError.message);
        }
      }
      
      testRuns.push(runResponse.data);
    } catch (error) {
      console.error(`Failed to create test run ${i + 1}:`, error.response?.data || error.message);
    }
  }
  
  return testRuns;
}

// Main execution
async function main() {
  try {
    await login();
    const suites = await createTestSuites();
    if (suites.length === 0) {
      console.error('Failed to create any test suites. Exiting.');
      return;
    }
    
    const duts = await createDUTs();
    if (duts.length === 0) {
      console.error('Failed to create any DUTs. Exiting.');
      return;
    }
    
    const cases = await createTestCases(suites);
    if (cases.length === 0) {
      console.error('Failed to create any test cases. Exiting.');
      return;
    }
    
    const templates = await createTestRunTemplates(cases);
    
    // Create or get operator
    const operatorId = await createTestOperator();
    if (!operatorId) {
      console.error('Failed to create or find an operator. Cannot create test runs.');
      return;
    }
    
    // Create simple test runs first
    const simpleRuns = await createSimpleTestRuns(operatorId, duts);
    
    // Try a different approach for test runs with results
    const runsWithResults = await createTestRunsWithResults(cases, duts, operatorId);
    
    const allRuns = [...simpleRuns, ...runsWithResults];
    
    console.log('Test data creation completed successfully!');
    console.log('Created:');
    console.log(`- ${suites.length} test suites`);
    console.log(`- ${cases.length} test cases`);
    console.log(`- ${duts.length} DUTs`);
    console.log(`- ${templates.length} test run templates`);
    console.log(`- ${allRuns.length} test runs`);
    
    return { suites, cases, duts, templates, runs: allRuns };
  } catch (error) {
    console.error('Failed to create test data:', error);
  }
}

// Run the script
main();