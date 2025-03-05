// Script to check backend data
const axios = require('axios');

async function check() {
  try {
    // Get auth token
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', 'admin123');
    const authResponse = await axios.post('http://localhost:8000/api/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const token = authResponse.data.access_token;
    console.log('Got authentication token');
    
    // Check for DUTs
    const dutsResponse = await axios.get('http://localhost:8000/api/duts/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('DUTs in backend:', dutsResponse.data.length);
    if (dutsResponse.data.length > 0) {
      console.log('Sample DUT:', dutsResponse.data[0]);
    }
    
    // Check for test run templates
    const templatesResponse = await axios.get('http://localhost:8000/api/test-run-templates/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Templates in backend:', templatesResponse.data.length);
    if (templatesResponse.data.length > 0) {
      console.log('Sample template:', templatesResponse.data[0]);
    }
    
    // Check for test runs
    const runsResponse = await axios.get('http://localhost:8000/api/test-runs/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Test runs in backend:', runsResponse.data.length);
    if (runsResponse.data.length > 0) {
      console.log('Sample test run:', runsResponse.data[0]);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

check();