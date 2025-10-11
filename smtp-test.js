#!/usr/bin/env node
/**
 * SMTP Configuration Tester
 * Test your Gmail App Password setup before running the marketing campaign
 */

const nodemailer = require('nodemailer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Gmail SMTP Configuration Tester');
console.log('═'.repeat(50));
console.log('This tool will help you verify your Gmail App Password setup.');
console.log('');

// Collect SMTP credentials
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function testSmtpConfig() {
  try {
    console.log('📧 Please enter your Gmail SMTP configuration:');
    console.log('');
    
    const email = await askQuestion('Gmail address (e.g., your-email@gmail.com): ');
    const appPassword = await askQuestion('Gmail App Password (16 characters): ');
    
    console.log('');
    console.log('🧪 Testing SMTP configuration...');
    
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: appPassword
      },
      debug: true,
      logger: false // Reduce noise
    };
    
    const transporter = nodemailer.createTransporter(smtpConfig);
    
    console.log('🔍 Step 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('');
    console.log('📤 Step 2: Sending test email...');
    
    const mailOptions = {
      from: `"Marketing Agent Test" <${email}>`,
      to: email, // Send to yourself
      subject: 'SMTP Test - LangGraph Marketing Agent',
      html: `
        <h2>✅ SMTP Configuration Test Successful!</h2>
        <p>Your Gmail App Password is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>SMTP Host: smtp.gmail.com</li>
          <li>Port: 587</li>
          <li>Email: ${email}</li>
          <li>Authentication: App Password</li>
          <li>Test Time: ${new Date().toISOString()}</li>
        </ul>
        <p>You can now use this configuration in your LangGraph Marketing Agent.</p>
      `,
      text: 'SMTP Configuration Test Successful! Your Gmail App Password is working correctly.'
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('');
    console.log('🎉 SUCCESS! Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Check your inbox for the test email.');
    console.log('');
    console.log('✅ Your SMTP configuration is correct and ready to use!');
    console.log('');
    console.log('🔧 Configuration Summary:');
    console.log('   Host: smtp.gmail.com');
    console.log('   Port: 587');
    console.log('   Email:', email);
    console.log('   App Password: ✅ Working');
    
  } catch (error) {
    console.log('');
    console.log('❌ SMTP Test Failed:', error.message);
    console.log('');
    
    if (error.code === 'EAUTH') {
      console.log('🔑 AUTHENTICATION ERROR - Here\'s how to fix it:');
      console.log('');
      console.log('1. 🔐 Enable 2-Factor Authentication:');
      console.log('   • Go to your Google Account settings');
      console.log('   • Navigate to Security > 2-Step Verification');
      console.log('   • Follow the setup instructions');
      console.log('');
      console.log('2. 📱 Generate App Password:');
      console.log('   • Go to: https://myaccount.google.com/apppasswords');
      console.log('   • Select "Mail" as the app');
      console.log('   • Select "Other" as the device');
      console.log('   • Enter "LangGraph Marketing Agent"');
      console.log('   • Copy the 16-character password exactly');
      console.log('');
      console.log('3. ✅ Use the App Password:');
      console.log('   • Use the 16-character App Password (not your regular Gmail password)');
      console.log('   • Make sure there are no spaces');
      console.log('   • Enter it exactly as generated');
      console.log('');
      console.log('📞 If you still have issues, try:');
      console.log('   • Generate a new App Password');
      console.log('   • Wait a few minutes after generation');
      console.log('   • Make sure your Gmail account doesn\'t have advanced security restrictions');
      
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 NETWORK ERROR:');
      console.log('   • Check your internet connection');
      console.log('   • Verify you can access smtp.gmail.com');
      
    } else {
      console.log('🔧 General troubleshooting:');
      console.log('   • Double-check your email address');
      console.log('   • Verify the App Password was copied correctly');
      console.log('   • Try generating a new App Password');
    }
  }
  
  rl.close();
}

testSmtpConfig();