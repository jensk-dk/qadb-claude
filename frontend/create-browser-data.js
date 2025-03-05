// Browser-friendly version of the test data creation script
// Copy and paste this into your browser console when logged in

(async function() {
  // Configuration 
  const API_BASE = '/api';  // Relative URL in browser
  
  // Get token from localStorage (should be there if logged in)
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }
  
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
  
  // Helper function for API calls
  async function apiCall(method, endpoint, data = null) {
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  
  // Create test suite
  async function createTestSuite() {
    try {
      const response = await apiCall('POST', '/test-suites/', testSuite);
      console.log('Created test suite:', response);
      return response;
    } catch (error) {
      console.error('Failed to create test suite:', error);
      return null;
    }
  }
  
  // Create test cases linked to a test suite
  async function createTestCases(testSuiteId) {
    const createdTestCases = [];
    
    for (const testCase of testCases) {
      try {
        // Add test suite ID if provided
        const testCaseData = { ...testCase };
        if (testSuiteId) {
          testCaseData.test_suite_id = testSuiteId;
        }
        
        const response = await apiCall('POST', '/test-cases/', testCaseData);
        console.log('Created test case:', response.name);
        createdTestCases.push(response);
      } catch (error) {
        console.error(`Failed to create test case ${testCase.name}:`, error);
      }
    }
    
    return createdTestCases;
  }
  
  // Create a device
  async function createDevice() {
    try {
      const response = await apiCall('POST', '/duts/', device);
      console.log('Created device:', response);
      return response;
    } catch (error) {
      console.error('Failed to create device:', error);
      return null;
    }
  }
  
  // Create a test run with results
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
      
      const response = await apiCall('POST', '/test-runs/', testRun);
      console.log('Created test run:', response);
      return response;
    } catch (error) {
      console.error('Failed to create test run:', error);
      return null;
    }
  }
  
  // Main execution function
  async function main() {
    console.log('Creating test data...');
    
    // Create test suite
    const createdSuite = await createTestSuite();
    
    // Create test cases linked to the suite
    const createdTestCases = await createTestCases(createdSuite?.id);
    
    // Create a device
    const createdDevice = await createDevice();
    
    // Create a test run
    if (createdTestCases.length > 0 && createdDevice) {
      await createTestRun(createdTestCases, createdDevice.id);
    }
    
    console.log('Test data creation complete. Please refresh the page to see the data.');
    
    // Force reload of the current page to show new data
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
  
  // Run the script
  await main();
})();