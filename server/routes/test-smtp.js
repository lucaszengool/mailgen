/**
 * SMTP Test Endpoint for Railway
 * Visit: https://honest-hope-production.up.railway.app/api/test-smtp
 */

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const net = require('net');

// Test raw TCP connection to SMTP server
function testTCPConnection(host, port, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = net.createConnection({ host, port, timeout });

    socket.on('connect', () => {
      const duration = Date.now() - startTime;
      socket.end();
      resolve({ success: true, duration, message: `Connected in ${duration}ms` });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'TIMEOUT', message: 'Connection timed out after ' + timeout + 'ms' });
    });

    socket.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({ success: false, error: err.code, message: err.message, duration });
    });
  });
}

// Test SMTP with nodemailer
async function testSMTPAuth(config) {
  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        resolve({
          success: false,
          error: error.code || 'UNKNOWN',
          message: error.message,
          command: error.command
        });
      } else {
        resolve({
          success: true,
          message: 'SMTP authentication successful'
        });
      }
    });
  });
}

router.get('/', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local',
    railwayRegion: process.env.RAILWAY_REGION || 'unknown',
    tests: {}
  };

  console.log('\n='.repeat(60));
  console.log('🔍 SMTP CONNECTIVITY TEST STARTED');
  console.log('='.repeat(60));

  // Test 1: TCP connection to Gmail SMTP port 587
  console.log('\n📡 Test 1: TCP connection to smtp.gmail.com:587...');
  results.tests.tcp_587 = await testTCPConnection('smtp.gmail.com', 587, 15000);
  console.log('Result:', results.tests.tcp_587);

  // Test 2: TCP connection to Gmail SMTP port 465
  console.log('\n📡 Test 2: TCP connection to smtp.gmail.com:465...');
  results.tests.tcp_465 = await testTCPConnection('smtp.gmail.com', 465, 15000);
  console.log('Result:', results.tests.tcp_465);

  // Test 3: TCP connection to port 25
  console.log('\n📡 Test 3: TCP connection to smtp.gmail.com:25...');
  results.tests.tcp_25 = await testTCPConnection('smtp.gmail.com', 25, 15000);
  console.log('Result:', results.tests.tcp_25);

  // Test 4: Control test - HTTP connection to Google
  console.log('\n📡 Test 4: Control test - HTTP to google.com:80...');
  results.tests.http_control = await testTCPConnection('google.com', 80, 10000);
  console.log('Result:', results.tests.http_control);

  // Test 5: HTTPS connection to api.sendgrid.com
  console.log('\n📡 Test 5: HTTPS to api.sendgrid.com:443...');
  results.tests.https_api = await testTCPConnection('api.sendgrid.com', 443, 10000);
  console.log('Result:', results.tests.https_api);

  // Test 6: Full SMTP authentication (if credentials provided)
  if (req.query.test_auth === 'true') {
    console.log('\n🔐 Test 6: SMTP authentication with Gmail...');

    const smtpConfig = {
      host: req.query.host || 'smtp.gmail.com',
      port: parseInt(req.query.port || '587'),
      secure: req.query.port === '465',
      user: req.query.user || process.env.SMTP_USER,
      pass: req.query.pass || process.env.SMTP_PASS
    };

    if (smtpConfig.user && smtpConfig.pass) {
      results.tests.smtp_auth = await testSMTPAuth(smtpConfig);
      console.log('Result:', results.tests.smtp_auth);
    } else {
      results.tests.smtp_auth = {
        success: false,
        message: 'No credentials provided. Use ?test_auth=true&user=xxx&pass=xxx'
      };
    }
  }

  // Analysis
  console.log('\n='.repeat(60));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(60));

  const smtpBlocked = !results.tests.tcp_587.success && !results.tests.tcp_465.success;
  const httpWorks = results.tests.http_control.success;

  results.diagnosis = {};

  if (smtpBlocked && httpWorks) {
    results.diagnosis.verdict = 'SMTP_BLOCKED';
    results.diagnosis.message = '❌ Railway is blocking SMTP ports (587, 465, 25)';
    results.diagnosis.recommendation = 'Use API-based email service (SendGrid, Resend, etc.)';
    console.log(results.diagnosis.message);
  } else if (!smtpBlocked) {
    results.diagnosis.verdict = 'SMTP_ACCESSIBLE';
    results.diagnosis.message = '✅ SMTP ports are accessible';
    results.diagnosis.recommendation = 'Check your Gmail credentials and App Password';
    console.log(results.diagnosis.message);
  } else {
    results.diagnosis.verdict = 'NETWORK_ISSUE';
    results.diagnosis.message = '⚠️ General network connectivity issue';
    results.diagnosis.recommendation = 'Contact Railway support';
    console.log(results.diagnosis.message);
  }

  console.log('='.repeat(60));
  console.log('\n');

  // Return HTML page with results
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SMTP Test Results - Railway</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
    .container { max-width: 1000px; margin: 0 auto; }
    .success { color: #22c55e; }
    .fail { color: #ef4444; }
    .warning { color: #f59e0b; }
    pre { background: #2a2a2a; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .test-card { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #3b82f6; }
    h1 { color: #3b82f6; }
    h2 { color: #8b5cf6; margin-top: 30px; }
    .verdict { font-size: 1.2em; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .verdict.blocked { background: #7f1d1d; border: 2px solid #ef4444; }
    .verdict.accessible { background: #14532d; border: 2px solid #22c55e; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 SMTP Connectivity Test Results</h1>
    <p><strong>Platform:</strong> ${results.platform}</p>
    <p><strong>Region:</strong> ${results.railwayRegion}</p>
    <p><strong>Time:</strong> ${results.timestamp}</p>

    <h2>Test Results</h2>

    <div class="test-card">
      <h3>📡 Gmail SMTP Port 587 (STARTTLS)</h3>
      <p class="${results.tests.tcp_587.success ? 'success' : 'fail'}">
        ${results.tests.tcp_587.success ? '✅ CONNECTED' : '❌ FAILED'}
      </p>
      <pre>${JSON.stringify(results.tests.tcp_587, null, 2)}</pre>
    </div>

    <div class="test-card">
      <h3>📡 Gmail SMTP Port 465 (SSL)</h3>
      <p class="${results.tests.tcp_465.success ? 'success' : 'fail'}">
        ${results.tests.tcp_465.success ? '✅ CONNECTED' : '❌ FAILED'}
      </p>
      <pre>${JSON.stringify(results.tests.tcp_465, null, 2)}</pre>
    </div>

    <div class="test-card">
      <h3>📡 Gmail SMTP Port 25 (Plain)</h3>
      <p class="${results.tests.tcp_25.success ? 'success' : 'fail'}">
        ${results.tests.tcp_25.success ? '✅ CONNECTED' : '❌ FAILED'}
      </p>
      <pre>${JSON.stringify(results.tests.tcp_25, null, 2)}</pre>
    </div>

    <div class="test-card">
      <h3>🌐 Control Test: HTTP to Google</h3>
      <p class="${results.tests.http_control.success ? 'success' : 'fail'}">
        ${results.tests.http_control.success ? '✅ CONNECTED' : '❌ FAILED'}
      </p>
      <pre>${JSON.stringify(results.tests.http_control, null, 2)}</pre>
    </div>

    <div class="test-card">
      <h3>🔒 HTTPS to SendGrid API</h3>
      <p class="${results.tests.https_api.success ? 'success' : 'fail'}">
        ${results.tests.https_api.success ? '✅ CONNECTED' : '❌ FAILED'}
      </p>
      <pre>${JSON.stringify(results.tests.https_api, null, 2)}</pre>
    </div>

    <div class="verdict ${results.diagnosis.verdict === 'SMTP_BLOCKED' ? 'blocked' : 'accessible'}">
      <h2>📊 Diagnosis</h2>
      <p><strong>Verdict:</strong> ${results.diagnosis.verdict}</p>
      <p><strong>Message:</strong> ${results.diagnosis.message}</p>
      <p><strong>Recommendation:</strong> ${results.diagnosis.recommendation}</p>
    </div>

    <h2>💡 Test SMTP Auth</h2>
    <p>To test SMTP authentication with your credentials, visit:</p>
    <pre>https://honest-hope-production.up.railway.app/api/test-smtp?test_auth=true&user=your@email.com&pass=your_app_password</pre>

    <h2>📋 Raw JSON</h2>
    <pre>${JSON.stringify(results, null, 2)}</pre>
  </div>
</body>
</html>
  `;

  res.send(html);
});

// POST endpoint for automated testing from setup wizard
router.post('/', async (req, res) => {
  try {
    const { host, port, secure, username, password, testImap, imapHost, imapPort } = req.body;

    console.log(`🔍 Testing SMTP: ${username}@${host}:${port}`);

    // Test SMTP if not testing IMAP
    if (!testImap) {
      const smtpResult = await testSMTPAuth({
        host,
        port: parseInt(port),
        secure: secure || false,
        user: username,
        pass: password
      });

      return res.json(smtpResult);
    }

    // Test IMAP
    console.log(`🔍 Testing IMAP: ${username}@${imapHost}:${imapPort}`);

    const Imap = require('imap');

    const imapResult = await new Promise((resolve) => {
      const imap = new Imap({
        user: username,
        password: password,
        host: imapHost || 'imap.gmail.com',
        port: parseInt(imapPort) || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 15000,
        authTimeout: 15000
      });

      const timeout = setTimeout(() => {
        imap.end();
        resolve({
          success: false,
          message: 'IMAP connection timed out after 15 seconds'
        });
      }, 15000);

      imap.once('ready', () => {
        clearTimeout(timeout);
        imap.end();
        resolve({
          success: true,
          message: 'IMAP connection successful'
        });
      });

      imap.once('error', (err) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: err.message || 'IMAP connection failed'
        });
      });

      try {
        imap.connect();
      } catch (error) {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: error.message || 'Failed to connect to IMAP'
        });
      }
    });

    return res.json(imapResult);

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Test failed'
    });
  }
});

module.exports = router;
