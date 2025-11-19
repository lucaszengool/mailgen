/**
 * Direct SMTP Test - Send email directly using nodemailer
 */

const nodemailer = require('nodemailer');

const SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'fruitaiofficial@gmail.com',
    pass: 'rlvyvbyeiygmjmbj'
  }
};

async function testSMTP() {
  console.log('🚀 Testing SMTP connection...\n');

  try {
    // Create transporter
    const transporter = nodemailer.createTransporter(SMTP_CONFIG);

    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: '"FruitAI Team" <fruitaiofficial@gmail.com>',
      to: 'fruitaiofficial@gmail.com',
      subject: 'Test Email - SMTP Verification',
      html: `
        <h1>SMTP Test Successful!</h1>
        <p>Your Gmail SMTP configuration is working correctly.</p>
        <p>Email sent at: ${new Date().toISOString()}</p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('\n❌ SMTP Test Failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);

    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   1. App password is correct (no spaces)');
      console.error('   2. 2-Step Verification is enabled in Google Account');
      console.error('   3. App password was generated recently');
    }
  }
}

testSMTP();
