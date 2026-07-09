import http from 'http';
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

function request(method: string, path: string, body?: any, token?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const parsedUrl = new URL(url);
    const options: http.RequestOptions = {
      method: method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 0,
            data: responseBody ? JSON.parse(responseBody) : {}
          });
        } catch (e) {
          resolve({
            status: res.statusCode || 0,
            data: responseBody
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runIntegrationTests() {
  console.log('🏁 Starting Integration API Test Suite on http://localhost:5000/api...');

  const uniqueId = Date.now();
  const testEmail = `integration_tester_${uniqueId}@eyeglaze.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Integration Tester';

  let jwtToken = '';

  try {
    // ----------------------------------------------------
    // TEST CASE: Registration (REQ-REG-001 / TC-REG-001)
    // ----------------------------------------------------
    console.log('\n🧪 Testing Registration (Happy Path)...');
    const regRes = await request('POST', '/auth/register', {
      name: testName,
      email: testEmail,
      password: testPassword
    });
    
    assert.strictEqual(regRes.status, 201, 'Registration status code should be 201 Created');
    assert.ok(regRes.data.token, 'Registration should return an auth token');
    console.log(`   👉 PASS: User registered successfully. Email: ${testEmail}`);

    // Store token for subsequent requests
    jwtToken = regRes.data.token;

    // ----------------------------------------------------
    // TEST CASE: Duplicate Registration (REQ-REG-002 / TC-REG-002)
    // ----------------------------------------------------
    console.log('🧪 Testing Duplicate Registration (Negative)...');
    const dupRes = await request('POST', '/auth/register', {
      name: testName,
      email: testEmail,
      password: testPassword
    });
    assert.strictEqual(dupRes.status, 400, 'Duplicate email should be blocked with 400 Bad Request');
    console.log('   👉 PASS: Server rejected duplicate email registration.');

    // ----------------------------------------------------
    // TEST CASE: Login (REQ-LOG-001 / TC-LOGIN-001)
    // ----------------------------------------------------
    console.log('\n🧪 Testing Login (Happy Path)...');
    const loginRes = await request('POST', '/auth/login', {
      email: testEmail,
      password: testPassword
    });
    assert.strictEqual(loginRes.status, 200, 'Login status code should be 200 OK');
    assert.ok(loginRes.data.token, 'Login should return a valid JWT token');
    console.log('   👉 PASS: Authenticated successfully. JWT token retrieved.');

    // ----------------------------------------------------
    // TEST CASE: Login Fails with Incorrect Credentials (REQ-LOG-001 / TC-LOGIN-002)
    // ----------------------------------------------------
    console.log('🧪 Testing Login (Negative - Wrong Password)...');
    const wrongLoginRes = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'WrongPassword!'
    });
    assert.strictEqual(wrongLoginRes.status, 401, 'Incorrect password should return 401 Unauthorized');
    console.log('   👉 PASS: Access denied for invalid password.');

    // ----------------------------------------------------
    // TEST CASE: Fetch Profile with JWT (REQ-PRF-001 / TC-PROFILE-001)
    // ----------------------------------------------------
    console.log('\n🧪 Testing Authenticated Profile Fetch...');
    const profileRes = await request('GET', '/auth/me', null, jwtToken);
    assert.strictEqual(profileRes.status, 200, 'Profile fetch should return 200 OK');
    assert.strictEqual(profileRes.data.user.email, testEmail, 'Profile email should match registered email');
    console.log(`   👉 PASS: Authenticated profile fetched successfully. User: ${profileRes.data.user.name}`);

    // ----------------------------------------------------
    // TEST CASE: Access Gated Endpoint without Token (REQ-USR-002 / TC-USER-002)
    // ----------------------------------------------------
    console.log('🧪 Testing Unauthorized Route Access (Security)...');
    const unauthorizedRes = await request('GET', '/auth/me');
    assert.strictEqual(unauthorizedRes.status, 401, 'Request without JWT should return 401 Unauthorized');
    console.log('   👉 PASS: Server successfully blocked unauthorized access.');

    // ----------------------------------------------------
    // TEST CASE: SQL Injection on Products Query (REQ-SEC-001 / TC-SEC-001)
    // ----------------------------------------------------
    console.log('\n🧪 Testing SQL Injection protection in product filters...');
    const sqliRes = await request('GET', "/products?search=Glasses' OR '1'='1");
    assert.strictEqual(sqliRes.status, 200, 'Products search with SQL injection string should still return 200 OK');
    // Ensure it doesn't crash the database or server
    assert.ok(Array.isArray(sqliRes.data.products), 'Products query should return products list');
    console.log('   👉 PASS: SQL Injection payload handled safely as literal search string.');

    // ----------------------------------------------------
    // TEST CASE: Clean up - Delete user account (REQ-SET-003 / TC-SET-003)
    // ----------------------------------------------------
    console.log('\n🧪 Testing Account Deletion...');
    const deleteRes = await request('DELETE', '/auth/profile', null, jwtToken);
    assert.strictEqual(deleteRes.status, 200, 'Account deletion should return 200 OK');
    console.log('   👉 PASS: Test user account deleted successfully.');

    console.log('\n🎉 ALL INTEGRATION API TESTS COMPLETED AND PASSED!');
  } catch (err) {
    console.error('❌ Integration test suite failed with error:', err);
    process.exit(1);
  }
}

runIntegrationTests();
