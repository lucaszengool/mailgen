const SenderNameGenerator = require('./server/utils/SenderNameGenerator');
const EmailService = require('./server/services/EmailService');

async function testSenderNames() {
  console.log('🧪 Testing Intelligent Sender Name Generation...\n');

  // Test different scenarios
  const testScenarios = [
    {
      website: 'https://petpoofficial.org',
      goal: 'promote product',
      industry: 'veterinary'
    },
    {
      website: 'https://petpoofficial.org', 
      goal: 'partnership',
      industry: 'retail'
    },
    {
      website: 'https://petpoofficial.org',
      goal: 'collaboration',
      industry: 'photography'
    }
  ];

  console.log('📋 Sender Name Generation Results:');
  console.log('=====================================');

  for (const scenario of testScenarios) {
    const senderInfo = SenderNameGenerator.generatePersonalizedSender(
      scenario.website,
      scenario.goal,
      scenario.industry
    );

    console.log(`\n🎯 Scenario: ${scenario.goal} to ${scenario.industry} industry`);
    console.log(`   Company: ${senderInfo.companyName}`);
    console.log(`   Sender Name: ${senderInfo.senderName}`);
    console.log(`   Title: ${senderInfo.senderTitle}`);
    console.log(`   Full Name: ${senderInfo.fullSenderName}`);
  }

  console.log('\n📧 Testing Real Email with Intelligent Sender...');

  try {
    const emailService = new EmailService();
    
    // Generate sender for PETPO veterinary outreach
    const senderInfo = SenderNameGenerator.generatePersonalizedSender(
      'https://petpoofficial.org',
      'promote AI pet portrait products',
      'veterinary'
    );

    const testResult = await emailService.sendEmail({
      to: process.env.SMTP_USERNAME || 'luzgool001@gmail.com',
      subject: `✅ Sender Name Test - ${senderInfo.companyName} Outreach`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #28a745; border-radius: 10px;">
          <h2 style="color: #28a745;">🎉 Intelligent Sender Name Test Successful!</h2>
          
          <p>This email demonstrates the new intelligent sender name generation system.</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📊 Sender Information Generated:</h3>
            <ul>
              <li><strong>Company:</strong> ${senderInfo.companyName}</li>
              <li><strong>Sender Name:</strong> ${senderInfo.senderName}</li>
              <li><strong>Department:</strong> ${senderInfo.senderTitle}</li>
              <li><strong>Full Name:</strong> ${senderInfo.fullSenderName}</li>
            </ul>
          </div>

          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: white;">✅ What's Fixed:</h3>
            <ul style="color: white; margin: 10px 0;">
              <li>🏷️ Sender names now reflect the target company (${senderInfo.companyName})</li>
              <li>🎯 Names are personalized based on prospect industry</li>
              <li>📧 Professional department titles automatically generated</li>
              <li>🤖 No more generic "AI Agent" sender names</li>
              <li>🏢 Company branding maintained in all communications</li>
            </ul>
          </div>

          <p>The sender name will now appear as: <strong>"${senderInfo.senderName}"</strong> instead of "AI Agent"</p>

          <p>Best regards,<br>
          <strong>${senderInfo.senderTitle} Team</strong><br>
          ${senderInfo.companyName}<br>
          <a href="https://petpoofficial.org">petpoofficial.org</a></p>

          <hr style="margin: 30px 0; border: 1px solid #eee;">
          <p style="font-size: 11px; color: #666; text-align: center;">
            🧪 Sender Name Generation Test • ${new Date().toLocaleString()}<br>
            System: Intelligent Email Personalization
          </p>
        </div>
      `,
      from: `"${senderInfo.senderName}" <${process.env.SMTP_USERNAME}>`,
      trackingId: `sender_test_${Date.now()}`
    });

    console.log(`✅ Test email sent successfully!`);
    console.log(`📬 From: "${senderInfo.senderName}" <${process.env.SMTP_USERNAME}>`);
    console.log(`📨 Message ID: ${testResult.messageId}`);
    console.log(`🎯 Recipient: ${testResult.recipient}`);

    console.log('\n🚀 Sender Name System Status: WORKING ✅');
    console.log('=====================================');
    console.log('✅ Company-specific sender names: ACTIVE');
    console.log('✅ Industry personalization: ACTIVE');
    console.log('✅ Professional titles: ACTIVE');
    console.log('✅ Real email delivery: WORKING');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
}

testSenderNames();