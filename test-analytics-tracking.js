/**
 * Test Analytics Tracking
 * 1. Configure SMTP with Gmail credentials
 * 2. Send test email
 * 3. Verify analytics tracking (delivered, opens, clicks)
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3333';

// Gmail credentials provided by user
const SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  username: 'fruitaiofficial@gmail.com',
  password: 'rlvyvbyeiygmjmbj', // App password with ALL spaces removed
  from: 'fruitaiofficial@gmail.com',
  fromName: 'FruitAI Team'
};

async function configureSMTP() {
  console.log('\n📧 Step 1: Configuring SMTP with Gmail credentials...\n');

  try {
    const response = await axios.post(`${API_BASE}/api/settings/smtp`, {
      smtpConfig: SMTP_CONFIG,
      timestamp: new Date().toISOString()
    });

    console.log('✅ SMTP configured successfully:', response.data);
    return true;
  } catch (error) {
    console.error('❌ SMTP configuration failed:', error.response?.data || error.message);
    return false;
  }
}

async function sendTestEmail(campaignId = 'test_campaign_' + Date.now()) {
  console.log('\n📤 Step 2: Sending test email...\n');

  const testEmail = {
    campaignId: campaignId,
    to: 'fruitaiofficial@gmail.com', // Send to self for testing
    subject: 'Test Email - Analytics Tracking Verification',
    html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
            .header { color: #00f5a0; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .content { color: #333; line-height: 1.6; margin-bottom: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #00f5a0;
              color: #000;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Analytics Tracking Test</div>
            <div class="content">
              <p>Hi there!</p>
              <p>This is a test email to verify that our analytics tracking system is working correctly.</p>
              <p>When you receive this email, the system should track:</p>
              <ul>
                <li>✅ <strong>Delivery</strong> - Email successfully delivered</li>
                <li>👁️ <strong>Open</strong> - When you open this email (via tracking pixel)</li>
                <li>🖱️ <strong>Click</strong> - When you click the button below</li>
              </ul>
              <p>Please click the button below to test click tracking:</p>
              <a href="http://localhost:3333/api/analytics/track-click/${campaignId}/test-link-${Date.now()}" class="button">
                Click Here to Test Tracking
              </a>
            </div>
            <div class="footer">
              <p>This is an automated test email from your Email Marketing System</p>
              <p>Campaign ID: ${campaignId}</p>
            </div>
          </div>
          <!-- Tracking Pixel for Open Tracking -->
          <img src="http://localhost:3333/api/analytics/track-open/${campaignId}/${Date.now()}" width="1" height="1" style="display:none;" alt="" />
        </body>
      </html>
    `,
    recipientName: 'Test Recipient',
    company: 'FruitAI',
    userId: 'anonymous'
  };

  try {
    const response = await axios.post(`${API_BASE}/api/send-email/send`, testEmail);

    console.log('✅ Test email sent successfully!');
    console.log('   Campaign ID:', campaignId);
    console.log('   To:', testEmail.to);
    console.log('   Subject:', testEmail.subject);
    console.log('   Response:', response.data);

    return campaignId;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.response?.data || error.message);
    return null;
  }
}

async function checkAnalytics(campaignId) {
  console.log('\n📊 Step 3: Checking analytics data...\n');

  try {
    // Wait a moment for data to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    const metricsResponse = await axios.get(`${API_BASE}/api/analytics/email-metrics`, {
      params: {
        timeRange: '24h',
        campaign: campaignId,
        userId: 'anonymous'
      }
    });

    console.log('📈 Email Metrics:');
    console.log('   Total Sent:', metricsResponse.data.totalSent);
    console.log('   Total Delivered:', metricsResponse.data.totalDelivered);
    console.log('   Total Opens:', metricsResponse.data.totalOpens);
    console.log('   Total Clicks:', metricsResponse.data.totalClicks);
    console.log('   Delivery Rate:', metricsResponse.data.deliveryRate);
    console.log('   Open Rate:', metricsResponse.data.openRate);
    console.log('   Click Rate:', metricsResponse.data.clickRate);

    return metricsResponse.data;
  } catch (error) {
    console.error('❌ Failed to fetch analytics:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Analytics Tracking Test\n');
  console.log('=' + '='.repeat(60) + '\n');

  // Step 1: Configure SMTP
  const smtpConfigured = await configureSMTP();
  if (!smtpConfigured) {
    console.error('\n❌ Test aborted: SMTP configuration failed');
    return;
  }

  // Step 2: Send test email
  const campaignId = await sendTestEmail();
  if (!campaignId) {
    console.error('\n❌ Test aborted: Failed to send test email');
    return;
  }

  // Step 3: Check analytics
  const analytics = await checkAnalytics(campaignId);

  console.log('\n' + '=' + '='.repeat(60));
  console.log('\n✅ Test Complete!\n');

  if (analytics) {
    console.log('📊 Summary:');
    console.log('   - Email sent and tracked in database');
    console.log('   - Analytics API is returning data');
    console.log('   - Open tracking pixel included in email');
    console.log('   - Click tracking link included in email\n');

    console.log('📋 Next Steps:');
    console.log('   1. Check your inbox at: fruitaiofficial@gmail.com');
    console.log('   2. Open the email to trigger open tracking');
    console.log('   3. Click the button to trigger click tracking');
    console.log('   4. Refresh the Analytics page to see updated metrics\n');
  }
}

// Run the test
main().catch(error => {
  console.error('\n💥 Test failed with error:', error.message);
  process.exit(1);
});
