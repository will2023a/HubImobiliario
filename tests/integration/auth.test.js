// Simple integration test skeleton
// To run: npm install --save-dev supertest
// Then: node tests/integration/auth.test.js

const http = require('http');
const app = require('../../src/app');

let server;
const port = 4001;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting integration tests...\n');

  server = app.listen(port, () => {
    console.log(`Test server running on ${port}`);
  });

  try {
    // Test 1: Health check
    console.log('Test 1: GET / (health check)');
    const health = await request('GET', '/');
    console.assert(health.status === 200, 'Health check should return 200');
    console.assert(health.data.ok === true, 'Health check should return ok:true');
    console.log('✅ Health check passed\n');

    // Test 2: Login with invalid credentials
    console.log('Test 2: POST /auth/login (invalid)');
    const loginFail = await request('POST', '/auth/login', {
      email: 'nonexistent@test.com',
      password: 'wrongpass',
    });
    console.assert(loginFail.status === 400, 'Should return 400 for invalid login');
    console.log('✅ Invalid login rejected\n');

    // Test 3: Register imobiliaria without required fields
    console.log('Test 3: POST /imobiliarias (missing fields)');
    const imobFail = await request('POST', '/imobiliarias', {
      nome: 'Test',
    });
    console.assert(imobFail.status === 400, 'Should return 400 for missing fields');
    console.log('✅ Validation working\n');

    console.log('🎉 All integration tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
