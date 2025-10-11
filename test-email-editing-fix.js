const fetch = require('node-fetch');

async function testEmailEditingFix() {
  console.log('🧪 Testing Email Editing Fix');
  console.log('============================');
  
  // Test email configuration (using the same SMTP config as the app)
  const testEmailData = {
    subject: '🧪 TEST: Email Editing Fix Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Email Editing Fix Test</h1>
        <p>This is a test to verify that edited email content is being sent correctly.</p>
        
        <div style="background: linear-gradient(45deg, #ff0000 0%, #ff8000 16.67%, #ffff00 33.33%, #00ff00 50%, #0080ff 66.67%, #8000ff 83.33%, #ff0080 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
          <h2>Rainbow Component Added</h2>
          <p>This component was added to test if custom components are included in sent emails.</p>
        </div>
        
        <div style="border-left: 4px solid #10b981; padding: 20px; background: #f0fdf4; margin: 20px 0;">
          <h3 style="color: #065f46; margin: 0 0 10px 0;">Edited Content Test</h3>
          <p style="color: #047857; margin: 0;">This text was edited to verify that text changes are captured and sent.</p>
        </div>
        
        <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Fix Status:</strong> ✅ If you can see this HTML with all components, the fix is working!</p>
      </div>
    `,
    from: 'fruitaiofficial@gmail.com',
    to: ['luzgool001@gmail.com'], // Test recipient
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'fruitaiofficial@gmail.com',
        pass: 'oiwq qinf mazo mxkq' // App password - note: 'pass' not 'password'
      }
    }
  };
  
  try {
    console.log('📧 Sending test email...');
    console.log('  📮 To:', testEmailData.to[0]);
    console.log('  📝 Subject:', testEmailData.subject);
    console.log('  🔗 HTML Length:', testEmailData.html.length);
    
    const response = await fetch('http://localhost:3333/api/send-email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testEmailData)
    });
    
    const responseText = await response.text();
    console.log('📡 Server Response Status:', response.status);
    console.log('📡 Server Response:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      if (result.success) {
        console.log('');
        console.log('✅ SUCCESS: Test email sent successfully!');
        console.log('📧 Please check the email at:', testEmailData.to[0]);
        console.log('📝 Look for:');
        console.log('  - Rainbow gradient component');
        console.log('  - Green bordered text box');
        console.log('  - Proper HTML formatting');
        console.log('  - Current timestamp');
        console.log('');
        console.log('🔍 If the email contains all these elements, the fix is working!');
      } else {
        console.log('❌ Email send failed:', result.message);
      }
    } else {
      console.log('❌ HTTP Error:', response.status, responseText);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('💡 Make sure the backend server is running on port 3333');
  }
}

// Run the test
testEmailEditingFix();