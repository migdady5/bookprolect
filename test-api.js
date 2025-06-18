const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🚀 Starting API Tests...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test 2: Login with invalid credentials
  console.log('\n2. Testing Login with invalid credentials...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login Response (expected error):', loginData);
  } catch (error) {
    console.log('❌ Login Test Failed:', error.message);
  }

  // Test 3: Protected route without token
  console.log('\n3. Testing Protected Route without token...');
  try {
    const protectedResponse = await fetch(`${BASE_URL}/api/protected`);
    const protectedData = await protectedResponse.json();
    console.log('✅ Protected Route Response (expected unauthorized):', protectedData);
  } catch (error) {
    console.log('❌ Protected Route Test Failed:', error.message);
  }

  // Test 4: Test CORS headers
  console.log('\n4. Testing CORS headers...');
  try {
    const corsResponse = await fetch(`${BASE_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS Test - Status:', corsResponse.status);
    console.log('✅ CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    });
  } catch (error) {
    console.log('❌ CORS Test Failed:', error.message);
  }

  console.log('\n🎉 API Tests Completed!');
  console.log('\nTo test with real credentials:');
  console.log('1. Use Postman to send POST request to: http://localhost:3000/api/auth/login');
  console.log('2. Body: {"email": "your_real_email", "password": "your_real_password"}');
  console.log('3. Copy the token from the response');
  console.log('4. Use the token in Authorization header: Bearer your_token');
  console.log('5. Test protected route: GET http://localhost:3000/api/protected');
}

// Run the tests
testAPI().catch(console.error); 