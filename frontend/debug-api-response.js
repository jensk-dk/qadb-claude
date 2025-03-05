// Script to debug API response fields
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

// Examine DUTs data structure
async function inspectDUTs() {
  try {
    const response = await axios.get(`${API_BASE}/duts/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('DUTs Data Structure:');
    if (response.data.length > 0) {
      const sampleItem = response.data[0];
      console.log(JSON.stringify(sampleItem, null, 2));
      
      // Check specific fields being used in the UI component
      console.log('\nFields used in DevicesView.vue component:');
      console.log('- Using "id" field:', '"id" field exists:', 'id' in sampleItem);
      console.log('- Using "name" field:', '"name" field exists:', 'name' in sampleItem);
      console.log('- Using "product_name" field:', '"product_name" field exists:', 'product_name' in sampleItem);
      console.log('- Using "identifier" field:', '"identifier" field exists:', 'identifier' in sampleItem);
      console.log('- Using "model" field:', '"model" field exists:', 'model' in sampleItem);
      console.log('- Using "make" field:', '"make" field exists:', 'make' in sampleItem);
      console.log('- Using "firmware_version" field:', '"firmware_version" field exists:', 'firmware_version' in sampleItem);
      console.log('- Using "status" field:', '"status" field exists:', 'status' in sampleItem);
      console.log('- Using "location" field:', '"location" field exists:', 'location' in sampleItem);
      console.log('- Using "countries" field:', '"countries" field exists:', 'countries' in sampleItem);
      console.log('- Using "capabilities" field:', '"capabilities" field exists:', 'capabilities' in sampleItem);
    } else {
      console.log('No DUTs found in the database');
    }
  } catch (error) {
    console.error('Error fetching DUTs:', error.message);
  }
}

// Test capabilities endpoint
async function testCapabilitiesEndpoint() {
  try {
    console.log('\nTesting capabilities endpoint:');
    const response = await axios.get(`${API_BASE}/duts/capabilities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Capabilities endpoint response:');
    console.log(`Status: ${response.status}`);
    console.log(`Data length: ${response.data.length}`);
    if (response.data.length > 0) {
      console.log('Sample capability:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
  } catch (error) {
    console.error('Error calling capabilities endpoint:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.status, error.response.data);
    }
  }
}

// Main execution
async function main() {
  try {
    await login();
    await inspectDUTs();
    await testCapabilitiesEndpoint();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main().catch(console.error);