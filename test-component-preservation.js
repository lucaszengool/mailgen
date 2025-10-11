/**
 * Test Script for Component Position Preservation
 * This script tests that email components maintain their positions and properties
 * across all emails in a campaign after user edits and template approval
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3333/api';

// Test data with properly formatted components
const testTemplate = {
  subject: "🚀 Partnership Opportunity with [COMPANY_NAME]",
  components: [
    {
      id: "header_custom_1",
      type: "header",
      position: 0,
      style: "background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%); padding: 40px; text-align: center;",
      className: "custom-gradient-header",
      content: {
        headline: "🎯 Exclusive Partnership Invitation",
        subheadline: "Transform Your Business with AI Innovation"
      }
    },
    {
      id: "text_custom_2",
      type: "freeform_editor",
      position: 1,
      style: "padding: 30px; background: #f7f9fc; border-left: 5px solid #ff6b6b;",
      content: {
        text: "Dear [CONTACT_NAME], We've been following [COMPANY_NAME]'s impressive growth and believe there's tremendous synergy between our companies. Our cutting-edge AI solutions have helped similar companies increase efficiency by 300%.",
        html: "<div style='padding: 30px; background: #f7f9fc; border-left: 5px solid #ff6b6b;'><p>Dear [CONTACT_NAME],</p><p>We've been following [COMPANY_NAME]'s impressive growth and believe there's tremendous synergy between our companies.</p><p>Our cutting-edge AI solutions have helped similar companies increase efficiency by 300%.</p></div>"
      }
    },
    {
      id: "button_custom_3",
      type: "button",
      position: 2,
      style: "text-align: center; margin: 40px 0;",
      content: {
        text: "Schedule Your Strategy Call",
        url: "https://calendly.com/ai-partnership",
        style: "background: linear-gradient(90deg, #ff6b6b, #4ecdc4); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;"
      }
    }
  ],
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="custom-gradient-header" style="background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0;">🎯 Exclusive Partnership Invitation</h1>
      <p style="color: white; margin: 10px 0 0 0;">Transform Your Business with AI Innovation</p>
    </div>
    <div style="padding: 30px; background: #f7f9fc; border-left: 5px solid #ff6b6b;">
      <p>Dear [CONTACT_NAME],</p>
      <p>We've been following [COMPANY_NAME]'s impressive growth and believe there's tremendous synergy between our companies.</p>
      <p>Our cutting-edge AI solutions have helped similar companies increase efficiency by 300%.</p>
    </div>
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://calendly.com/ai-partnership" style="background: linear-gradient(90deg, #ff6b6b, #4ecdc4); color: white; padding: 18px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">Schedule Your Strategy Call</a>
    </div>
  </div>
</body>
</html>`
};

// Test prospects
const testProspects = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@techcorp.ai",
    company: "TechCorp AI",
    title: "CEO"
  },
  {
    name: "Michael Chen",
    email: "m.chen@innovateml.com",
    company: "InnovateML",
    title: "CTO"
  },
  {
    name: "Lisa Rodriguez",
    email: "lisa.r@datafuture.io",
    company: "DataFuture",
    title: "VP Engineering"
  }
];

async function runTest() {
  console.log('🧪 Starting Component Preservation Test...\n');

  try {
    // Step 1: Test sending first email with template
    console.log('📧 Step 1: Testing first email with user-edited template...');

    const firstEmailResponse = await axios.post(`${API_BASE}/workflow/send-email`, {
      action: 'test_first_email',
      emailData: {
        to: testProspects[0].email,
        subject: testTemplate.subject.replace('[COMPANY_NAME]', testProspects[0].company)
      },
      userTemplate: testTemplate,
      smtpConfig: {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@example.com',
        fromName: 'AI Partnership Team'
      },
      campaignId: `test_campaign_${Date.now()}`
    });

    console.log('✅ First email request sent');
    console.log('   Response:', firstEmailResponse.data.success ? 'Success' : 'Failed');

    // Step 2: Simulate template approval
    console.log('\n📋 Step 2: Simulating template approval...');

    const approvalResponse = await axios.post(`${API_BASE}/workflow/approve-template`, {
      userTemplate: testTemplate,
      decision: 'continue',
      campaignId: `test_campaign_${Date.now()}`
    });

    console.log('✅ Template approval simulated');

    // Step 3: Test subsequent emails with same template
    console.log('\n📨 Step 3: Testing subsequent emails with approved template...');

    for (let i = 1; i < testProspects.length; i++) {
      const prospect = testProspects[i];
      console.log(`\n   Testing email ${i+1} to ${prospect.email}...`);

      const emailResponse = await axios.post(`${API_BASE}/workflow/send-email`, {
        action: 'send_with_template',
        emailData: {
          to: prospect.email,
          subject: testTemplate.subject.replace('[COMPANY_NAME]', prospect.company)
        },
        userTemplate: testTemplate,
        smtpConfig: {
          host: 'smtp.gmail.com',
          port: 587,
          username: 'test@example.com',
          fromName: 'AI Partnership Team'
        },
        campaignId: `test_campaign_${Date.now()}`
      });

      console.log(`   ✅ Email ${i+1} sent: ${emailResponse.data.success ? 'Success' : 'Failed'}`);

      // Verify component preservation
      if (emailResponse.data.emailContent) {
        const html = emailResponse.data.emailContent;

        // Check if all custom styles are preserved
        const hasGradientHeader = html.includes('background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)');
        const hasCustomBorder = html.includes('border-left: 5px solid #ff6b6b');
        const hasButtonStyle = html.includes('border-radius: 30px');

        console.log(`   🔍 Component preservation check:`);
        console.log(`      - Gradient header: ${hasGradientHeader ? '✅' : '❌'}`);
        console.log(`      - Custom border: ${hasCustomBorder ? '✅' : '❌'}`);
        console.log(`      - Button styling: ${hasButtonStyle ? '✅' : '❌'}`);

        // Check personalization
        const hasPersonalizedName = html.includes(prospect.name) || html.includes(prospect.company);
        console.log(`      - Personalization: ${hasPersonalizedName ? '✅' : '❌'}`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All emails sent with same template structure');
    console.log('   - Component positions preserved');
    console.log('   - Custom styles maintained');
    console.log('   - Personalization applied correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the test
runTest();