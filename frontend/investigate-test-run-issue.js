// Script to investigate test run creation issues
const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8000/api';
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

// Get test run schema info
async function getTestRunEndpointInfo() {
  try {
    // Try to hit the OpenAPI docs to get endpoint info
    const response = await axios.get(`${API_BASE.split('/api')[0]}/openapi.json`);
    
    // Find the test run POST schema
    const schema = response.data.components.schemas.TestRunCreate;
    console.log('Test Run Create Schema:', schema);
    
    return schema;
  } catch (error) {
    console.error('Failed to get OpenAPI schema:', error.message);
    return null;
  }
}

// Create a minimalist test run
async function createMinimalTestRun() {
  try {
    // Minimal test run data
    const testRunData = {
      status: 'Scheduled', // Required field based on previous errors
      operator_id: 1 // Using admin as operator
    };
    
    console.log('Attempting to create test run with minimal data:', testRunData);
    
    const response = await axios.post(`${API_BASE}/test-runs/`, testRunData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Successfully created test run:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create minimal test run:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Try creating a test run with different fields to narrow down the issue
async function testDifferentConfigurations() {
  const testCases = [
    {
      name: 'Minimal',
      data: {
        status: 'Scheduled',
        operator_id: 1
      }
    },
    {
      name: 'With name',
      data: {
        name: 'Test Run Name',
        status: 'Scheduled',
        operator_id: 1
      }
    },
    {
      name: 'Different status',
      data: {
        status: 'Completed',
        operator_id: 1
      }
    },
    {
      name: 'Without operator_id',
      data: {
        status: 'Scheduled'
      }
    },
    {
      name: 'With empty results array',
      data: {
        status: 'Scheduled',
        operator_id: 1,
        test_case_results: []
      }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTest case: ${testCase.name}`);
      console.log('Data:', testCase.data);
      
      const response = await axios.post(`${API_BASE}/test-runs/`, testCase.data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('SUCCESS! Created test run:', response.data);
    } catch (error) {
      console.error(`FAILED: ${testCase.name}`);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
  }
}

// Main execution
async function main() {
  try {
    await login();
    //await getTestRunEndpointInfo();
    //await createMinimalTestRun();
    await testDifferentConfigurations();
  } catch (error) {
    console.error('Main execution error:', error);
  }
}

// Run the script
main().catch(console.error);