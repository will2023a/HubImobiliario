// Integration test skeleton - requires running DB and server.
// This is a sample using node's fetch API; enable and adapt when DB/server are available.

const assert = require('assert');

(async function(){
  if(!process.env.RUN_INTEGRATION) {
    console.log('Skipping integration tests (set RUN_INTEGRATION=1 to run)');
    return;
  }

  const base = process.env.BASE_URL || 'http://localhost:4000';
  console.log('Running integration sample tests against', base);

  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.ok, true);
  console.log('Integration sample passed');
})();
