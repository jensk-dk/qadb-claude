// Script to check the data in the system
const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8000/api';
let token = null;

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

// Check data in the system
async function checkData() {
  try {
    // Test Suites
    const suitesResponse = await axios.get(`${API_BASE}/test-suites/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Test Suites:', suitesResponse.data.length);
    suitesResponse.data.forEach(suite => {
      console.log(`- ${suite.name} (ID: ${suite.id})`);
    });
    
    // DUTs (Devices Under Test)
    const dutsResponse = await axios.get(`${API_BASE}/duts/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\nDUTs:', dutsResponse.data.length);
    dutsResponse.data.forEach(dut => {
      console.log(`- ${dut.product_name} (ID: ${dut.id})`);
    });
    
    // Test Cases
    const casesResponse = await axios.get(`${API_BASE}/test-cases/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\nTest Cases:', casesResponse.data.length);
    casesResponse.data.forEach(testCase => {
      console.log(`- ${testCase.title} (ID: ${testCase.id})`);
    });
    
    // Test Run Templates
    const templatesResponse = await axios.get(`${API_BASE}/test-run-templates/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\nTest Run Templates:', templatesResponse.data.length);
    templatesResponse.data.forEach(template => {
      console.log(`- ${template.name} (ID: ${template.id})`);
    });
    
    // Test Runs
    const runsResponse = await axios.get(`${API_BASE}/test-runs/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\nTest Runs:', runsResponse.data.length);
    runsResponse.data.forEach(run => {
      console.log(`- ${run.name || 'Unnamed'} (ID: ${run.id})`);
    });
    
    return {
      suites: suitesResponse.data,
      duts: dutsResponse.data,
      cases: casesResponse.data,
      templates: templatesResponse.data,
      runs: runsResponse.data
    };
  } catch (error) {
    console.error('Error checking data:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await login();
    const data = await checkData();
    console.log('\nSummary:');
    console.log(`- ${data.suites.length} test suites`);
    console.log(`- ${data.cases.length} test cases`);
    console.log(`- ${data.duts.length} DUTs`);
    console.log(`- ${data.templates.length} test run templates`);
    console.log(`- ${data.runs.length} test runs`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main().catch(console.error);