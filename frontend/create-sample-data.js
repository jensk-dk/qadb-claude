// Simple script to create sample data for the QA database
const axios = require('axios');

// Sample data
const testSuites = [
  {
    name: 'Core Functionality',
    description: 'Tests for the core system functionality',
    version: '1.0'
  },
  {
    name: 'UI Components',
    description: 'Tests for UI components',
    version: '1.0'
  }
];

const testCases = [
  {
    name: 'User Login',
    description: 'Test user login functionality',
    status: 'Active',
    procedure: '1. Navigate to login page\n2. Enter credentials\n3. Submit\n4. Verify login success'
  },
  {
    name: 'Data Entry Form',
    description: 'Test form validation',
    status: 'Active',
    procedure: '1. Open form\n2. Enter invalid data\n3. Verify validation errors\n4. Enter valid data\n5. Submit'
  },
  {
    name: 'Dashboard',
    description: 'Test dashboard display',
    status: 'Active',
    procedure: '1. Login\n2. Navigate to dashboard\n3. Verify data is displayed correctly'
  }
];

const devices = [
  {
    name: 'Test Server',
    description: 'Primary test server',
    model: 'XS2000',
    firmware_version: '10.2.3',
    status: 'Active',
    location: 'Lab Room 101'
  },
  {
    name: 'Dev Workstation',
    description: 'Development workstation',
    model: 'WS500',
    firmware_version: '5.1.2',
    status: 'Active',
    location: 'Office 303'
  }
];

// Create sample data
async function createData() {
  try {
    // Login to get token - using URLSearchParams for form data in Node.js
    const formData = new URLSearchParams();
    formData.append('username', 'admin');  // Replace with real credentials
    formData.append('password', 'password'); // Replace with real credentials
    
    const loginResponse = await axios.post('http://localhost:8000/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const token = loginResponse.data.access_token;
    console.log('Logged in successfully');
    
    const headers = {
      Authorization: `Bearer ${token}`
    };
    
    // Create test suites
    for (const ts of testSuites) {
      try {
        const response = await axios.post('http://localhost:8000/api/test-suites/', ts, { headers });
        console.log(`Created test suite: ${response.data.name} (ID: ${response.data.id})`);
        
        // Create test cases linked to this suite
        for (const tc of testCases) {
          try {
            const tcData = { ...tc, test_suite_id: response.data.id };
            const tcResponse = await axios.post('http://localhost:8000/api/test-cases/', tcData, { headers });
            console.log(`Created test case: ${tcResponse.data.name} (ID: ${tcResponse.data.id})`);
          } catch (err) {
            console.error(`Failed to create test case ${tc.name}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`Failed to create test suite ${ts.name}:`, err.message);
      }
    }
    
    // Create devices
    const createdDevices = [];
    for (const dev of devices) {
      try {
        const response = await axios.post('http://localhost:8000/api/duts/', dev, { headers });
        console.log(`Created device: ${response.data.name} (ID: ${response.data.id})`);
        createdDevices.push(response.data);
      } catch (err) {
        console.error(`Failed to create device ${dev.name}:`, err.message);
      }
    }
    
    // Get all test cases
    const tcResponse = await axios.get('http://localhost:8000/api/test-cases/', { headers });
    const allTestCases = tcResponse.data;
    
    if (allTestCases.length > 0 && createdDevices.length > 0) {
      // Create test runs
      for (let i = 0; i < 2; i++) {
        try {
          const testRun = {
            name: `Sample Test Run ${i+1}`,
            status: i === 0 ? 'Completed' : 'In Progress',
            device_id: createdDevices[i % createdDevices.length].id,
            operator: 'System',
            notes: 'Created by sample data script',
            test_case_results: allTestCases.map(tc => ({
              test_case_id: tc.id,
              result: Math.random() > 0.3 ? 'Pass' : 'Fail',  // 70% pass rate
              comments: 'Generated result'
            }))
          };
          
          const response = await axios.post('http://localhost:8000/api/test-runs/', testRun, { headers });
          console.log(`Created test run: ${response.data.name} (ID: ${response.data.id})`);
        } catch (err) {
          console.error(`Failed to create test run:`, err.message);
        }
      }
    }
    
    console.log('Sample data creation completed!');
  } catch (error) {
    console.error('Error creating sample data:', error.message);
  }
}

// Run the script
createData().catch(err => console.error(err));