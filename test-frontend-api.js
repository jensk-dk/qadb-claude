// Script to test frontend API connections
const axios = require('axios');

// Configuration
const BACKEND_API_BASE = 'http://localhost:8000/api';
const FRONTEND_API_BASE = 'http://localhost:5173/api';
let token = null;

// Login to get token
async function login() {
  try {
    console.log('Attempting login to backend API...');
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', 'admin123');
    
    const response = await axios.post(`${BACKEND_API_BASE}/auth/token`, formData, {
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

// Test direct backend API access
async function testBackendAPI() {
  console.log('\n--- TESTING DIRECT BACKEND API ACCESS ---');
  try {
    // Test Cases
    console.log('\nFetching test cases from backend API...');
    const testCasesResponse = await axios.get(`${BACKEND_API_BASE}/test-cases/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Success! Found ${testCasesResponse.data.length} test cases`);
    if (testCasesResponse.data.length > 0) {
      console.log('Sample test case:', JSON.stringify(testCasesResponse.data[0], null, 2));
    }
    
    // Test Runs
    console.log('\nFetching test runs from backend API...');
    const testRunsResponse = await axios.get(`${BACKEND_API_BASE}/test-runs/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Success! Found ${testRunsResponse.data.length} test runs`);
    if (testRunsResponse.data.length > 0) {
      console.log('Sample test run:', JSON.stringify(testRunsResponse.data[0], null, 2));
    }
    
    return {
      backendTestCases: testCasesResponse.data,
      backendTestRuns: testRunsResponse.data
    };
  } catch (error) {
    console.error('Error testing backend API:', error.response?.data || error.message);
    throw error;
  }
}

// Test frontend API proxying
async function testFrontendAPI() {
  console.log('\n--- TESTING FRONTEND API PROXYING ---');
  try {
    // Test Cases
    console.log('\nFetching test cases through frontend proxy...');
    const testCasesResponse = await axios.get(`${FRONTEND_API_BASE}/test-cases/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(error => {
      console.error('Error fetching test cases through frontend:', error.message);
      return { data: [] };
    });
    
    if (testCasesResponse.data) {
      console.log(`Success! Found ${testCasesResponse.data.length} test cases through frontend`);
      if (testCasesResponse.data.length > 0) {
        console.log('Sample test case:', JSON.stringify(testCasesResponse.data[0], null, 2));
      }
    }
    
    // Test Runs
    console.log('\nFetching test runs through frontend proxy...');
    const testRunsResponse = await axios.get(`${FRONTEND_API_BASE}/test-runs/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(error => {
      console.error('Error fetching test runs through frontend:', error.message);
      return { data: [] };
    });
    
    if (testRunsResponse.data) {
      console.log(`Success! Found ${testRunsResponse.data.length} test runs through frontend`);
      if (testRunsResponse.data.length > 0) {
        console.log('Sample test run:', JSON.stringify(testRunsResponse.data[0], null, 2));
      }
    }
    
    return {
      frontendTestCases: testCasesResponse.data || [],
      frontendTestRuns: testRunsResponse.data || []
    };
  } catch (error) {
    console.error('Error testing frontend API:', error.message);
    return {
      frontendTestCases: [],
      frontendTestRuns: []
    };
  }
}

// Compare the data from backend and frontend
function compareResults(backendData, frontendData) {
  console.log('\n--- COMPARISON RESULTS ---');
  
  // Test Cases comparison
  console.log('\nTest Cases:');
  console.log(`- Backend: ${backendData.backendTestCases.length} items`);
  console.log(`- Frontend: ${frontendData.frontendTestCases.length} items`);
  
  if (backendData.backendTestCases.length !== frontendData.frontendTestCases.length) {
    console.log('MISMATCH! Different number of test cases between backend and frontend');
  }
  
  // Test Runs comparison
  console.log('\nTest Runs:');
  console.log(`- Backend: ${backendData.backendTestRuns.length} items`);
  console.log(`- Frontend: ${frontendData.frontendTestRuns.length} items`);
  
  if (backendData.backendTestRuns.length !== frontendData.frontendTestRuns.length) {
    console.log('MISMATCH! Different number of test runs between backend and frontend');
  }
}

// Main execution
async function main() {
  try {
    await login();
    const backendData = await testBackendAPI();
    const frontendData = await testFrontendAPI();
    compareResults(backendData, frontendData);
    
    console.log('\n--- DIAGNOSTICS SUMMARY ---');
    if (backendData.backendTestCases.length > 0 && frontendData.frontendTestCases.length === 0) {
      console.log('FRONTEND TEST CASES ISSUE: Backend has data but frontend is not receiving it.');
      console.log('Possible causes:');
      console.log('1. API proxy configuration issue in Vite config');
      console.log('2. CORS issues preventing frontend from accessing backend');
      console.log('3. Authentication token not being properly sent to backend');
    }
    
    if (backendData.backendTestRuns.length > 0 && frontendData.frontendTestRuns.length === 0) {
      console.log('FRONTEND TEST RUNS ISSUE: Backend has data but frontend is not receiving it.');
      console.log('Same potential causes as test cases.');
    }
    
    console.log('\nCheck the Vite dev server console for errors and the browser network tab for failed requests.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main().catch(console.error);