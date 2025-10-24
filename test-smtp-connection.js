/**
 * Test SMTP connectivity on Railway
 * This will help us determine if Railway blocks SMTP ports
 */

const net = require('net');

console.log('🔍 Testing SMTP connectivity...\n');

// Test Gmail SMTP on port 587
function testConnection(host, port) {
  return new Promise((resolve) => {
    console.log(`📡 Testing connection to ${host}:${port}...`);
    const startTime = Date.now();

    const socket = net.createConnection({
      host,
      port,
      timeout: 10000 // 10 second timeout
    });

    socket.on('connect', () => {
      const duration = Date.now() - startTime;
      console.log(`✅ SUCCESS: Connected to ${host}:${port} in ${duration}ms`);
      socket.end();
      resolve({ success: true, duration, host, port });
    });

    socket.on('timeout', () => {
      console.log(`❌ TIMEOUT: Could not connect to ${host}:${port} within 10 seconds`);
      socket.destroy();
      resolve({ success: false, error: 'timeout', host, port });
    });

    socket.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ERROR: ${err.message} (${host}:${port}) after ${duration}ms`);
      resolve({ success: false, error: err.message, host, port, duration });
    });
  });
}

async function runTests() {
  console.log('=' .repeat(60));
  console.log('SMTP CONNECTIVITY TEST');
  console.log('=' .repeat(60));
  console.log('Platform:', process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local');
  console.log('Time:', new Date().toISOString());
  console.log('');

  const tests = [
    { host: 'smtp.gmail.com', port: 587, name: 'Gmail SMTP (STARTTLS)' },
    { host: 'smtp.gmail.com', port: 465, name: 'Gmail SMTP (SSL)' },
    { host: 'smtp.gmail.com', port: 25, name: 'Gmail SMTP (Plain)' },
    { host: 'api.sendgrid.com', port: 443, name: 'SendGrid API (HTTPS)' },
    { host: 'google.com', port: 80, name: 'Google HTTP (Control test)' }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n[${test.name}]`);
    const result = await testConnection(test.host, test.port);
    results.push({ ...result, name: test.name });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }

  console.log('\n');
  console.log('=' .repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('=' .repeat(60));

  results.forEach(r => {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    const duration = r.duration ? `${r.duration}ms` : 'N/A';
    const error = r.error ? `(${r.error})` : '';
    console.log(`${status} ${r.name.padEnd(30)} ${duration} ${error}`);
  });

  const smtpBlocked = results.filter(r => r.name.includes('SMTP') && !r.success).length;
  const httpsWorks = results.find(r => r.name.includes('HTTPS') || r.name.includes('HTTP'))?.success;

  console.log('\n');
  console.log('DIAGNOSIS:');
  if (smtpBlocked > 0 && httpsWorks) {
    console.log('❌ SMTP ports appear to be BLOCKED by Railway');
    console.log('✅ HTTPS/API connections work fine');
    console.log('');
    console.log('RECOMMENDATION: Use SendGrid API instead of SMTP');
    console.log('  1. Sign up: https://sendgrid.com/free/');
    console.log('  2. Get API key');
    console.log('  3. Set SENDGRID_API_KEY in Railway env vars');
  } else if (smtpBlocked === 0) {
    console.log('✅ SMTP connections are working');
    console.log('Issue may be with credentials or Gmail security settings');
  } else {
    console.log('⚠️ Mixed results - network may be unstable');
  }

  console.log('=' .repeat(60));
}

runTests().catch(console.error);
