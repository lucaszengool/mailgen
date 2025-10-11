const nodemailer = require('nodemailer');

async function sendRealEmailsNow() {
  console.log('🚀 REAL EMAIL SENDING TEST - Quick Version\n');
  console.log('=' .repeat(60));
  
  // Configure SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'luzgool001@gmail.com',
      pass: 'rksj xojs zqbs fnsg'
    }
  });

  // Real prospects with public emails
  const realProspects = [
    {
      company: 'Y Combinator',
      email: 'software@ycombinator.com', // YC's software inquiries email
      name: 'YC Software Team'
    },
    {
      company: 'AngelList',
      email: 'press@angellist.com', // AngelList press email
      name: 'AngelList Team'
    }
  ];

  console.log(`📋 Sending emails to ${realProspects.length} REAL prospects:\n`);

  const results = [];
  
  for (const prospect of realProspects) {
    console.log(`\n📧 Sending to: ${prospect.email} (${prospect.company})`);
    
    const emailContent = {
      from: '"AI Partnership Team" <luzgool001@gmail.com>',
      to: prospect.email,
      subject: `AI Partnership Inquiry - ${prospect.company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h3>Partnership Opportunity</h3>
          
          <p>Dear ${prospect.name},</p>
          
          <p>We're developing an innovative AI-powered platform that helps ${prospect.company === 'Y Combinator' ? 'accelerators and their portfolio companies' : 'startups and investors'} automate their outreach and growth strategies.</p>
          
          <p>Our system uses advanced AI to:</p>
          <ul>
            <li>Discover and validate real business prospects in real-time</li>
            <li>Generate fully customized outreach based on business analysis</li>
            <li>Automate personalized communication at scale</li>
          </ul>
          
          <p>We believe there could be valuable synergies between our AI technology and ${prospect.company}'s ecosystem.</p>
          
          <p>Would you be open to a brief discussion about potential collaboration?</p>
          
          <p>Best regards,<br>
          AI Innovation Team</p>
          
          <hr style="margin: 20px 0; border: 1px solid #ddd;">
          <p style="font-size: 11px; color: #666;">
            This is a real email sent by our AI-powered marketing system<br>
            Timestamp: ${new Date().toISOString()}<br>
            System: Fully Automated AI Outreach Platform
          </p>
        </div>
      `
    };
    
    try {
      const info = await transporter.sendMail(emailContent);
      
      console.log('✅ SUCCESS - Email sent!');
      console.log(`   📬 Message ID: ${info.messageId}`);
      console.log(`   ✉️ Accepted by: ${info.accepted.join(', ')}`);
      console.log(`   📡 Server response: ${info.response}`);
      
      results.push({
        success: true,
        company: prospect.company,
        email: prospect.email,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      });
      
      // Wait 2 seconds between emails
      if (realProspects.indexOf(prospect) < realProspects.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next email...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`❌ FAILED: ${error.message}`);
      results.push({
        success: false,
        company: prospect.company,
        email: prospect.email,
        error: error.message
      });
    }
  }
  
  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL REPORT - REAL EMAILS SENT');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successfully sent: ${successful.length} real emails`);
  console.log(`❌ Failed: ${failed.length} emails\n`);
  
  if (successful.length > 0) {
    console.log('📬 SUCCESSFULLY DELIVERED TO:');
    successful.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.company}`);
      console.log(`     Email: ${r.email}`);
      console.log(`     Message ID: ${r.messageId}`);
      console.log(`     Sent at: ${r.timestamp}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED DELIVERIES:');
    failed.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.company} (${r.email}): ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 COMPLETE! Real emails have been sent to actual business emails!');
  console.log('='.repeat(60) + '\n');
  
  return results;
}

// Execute the real email sending
sendRealEmailsNow()
  .then(results => {
    console.log('📈 JSON Summary:', JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });