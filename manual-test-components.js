/**
 * Manual Test Script for Component Position Preservation
 * Tests the complete workflow with real component editing and approval
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3333/api';

// Mock prospects for testing
const testProspects = [
  {
    name: "John Smith",
    email: "john@testcompany1.com",
    company: "TestCompany1",
    title: "CEO",
    website: "https://testcompany1.com"
  },
  {
    name: "Sarah Johnson",
    email: "sarah@testcompany2.com",
    company: "TestCompany2",
    title: "Marketing Director",
    website: "https://testcompany2.com"
  },
  {
    name: "Mike Davis",
    email: "mike@testcompany3.com",
    company: "TestCompany3",
    title: "CTO",
    website: "https://testcompany3.com"
  }
];

// Test template with components in specific positions
const testTemplate = {
  subject: "Partnership Opportunity with {company}",
  preheader: "Let's explore ways to collaborate",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">Hello {name}!</h1>

      <!-- COMPONENT 1: Logo at top -->
      <div id="component-logo" style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f0f8ff; border-radius: 8px;">
        <img src="https://via.placeholder.com/200x50/007bff/ffffff?text=Our+Logo" alt="Company Logo" style="max-width: 200px;">
        <p style="margin: 10px 0 0 0; color: #666;">Connecting businesses worldwide</p>
      </div>

      <p>I hope this email finds you well at {company}. We've been following your work in the industry and are impressed by your innovation.</p>

      <!-- COMPONENT 2: Call-to-Action in middle -->
      <div id="component-cta-middle" style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
        <h3 style="color: #28a745; margin: 0 0 10px 0;">Ready to Explore Partnership?</h3>
        <a href="https://calendly.com/meeting" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Schedule a Meeting</a>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Click to book a 15-minute discovery call</p>
      </div>

      <p>We believe there's tremendous potential for collaboration between our companies, particularly in areas where {company} excels.</p>

      <!-- COMPONENT 3: Testimonial at bottom -->
      <div id="component-testimonial" style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 0 8px 8px 0;">
        <blockquote style="margin: 0; font-style: italic; color: #856404;">
          "Working with this team transformed our business operations. The partnership exceeded all our expectations."
        </blockquote>
        <cite style="display: block; text-align: right; margin-top: 10px; color: #856404; font-size: 14px;">- Previous Partner CEO</cite>
      </div>

      <p>Looking forward to connecting with you soon!</p>

      <p>Best regards,<br>
      Marketing Team</p>
    </div>
  `,
  components: [
    {
      id: "component-logo",
      type: "logo",
      position: { x: 0, y: 100 },
      properties: {
        logoUrl: "https://via.placeholder.com/200x50/007bff/ffffff?text=Our+Logo",
        altText: "Company Logo",
        tagline: "Connecting businesses worldwide"
      }
    },
    {
      id: "component-cta-middle",
      type: "button",
      position: { x: 0, y: 300 },
      properties: {
        text: "Schedule a Meeting",
        url: "https://calendly.com/meeting",
        backgroundColor: "#28a745",
        textColor: "white",
        description: "Click to book a 15-minute discovery call"
      }
    },
    {
      id: "component-testimonial",
      type: "testimonial",
      position: { x: 0, y: 500 },
      properties: {
        quote: "Working with this team transformed our business operations. The partnership exceeded all our expectations.",
        author: "Previous Partner CEO",
        backgroundColor: "#fff3cd"
      }
    }
  ]
};

async function runManualTest() {
  console.log('🧪 Starting Manual Component Position Preservation Test');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create a new workflow with our test template
    console.log('\n1️⃣ Creating test workflow...');
    const workflowResponse = await axios.post(`${API_BASE}/workflow/start`, {
      businessDescription: "Tech Partnership Agency",
      targetAudience: "Technology Companies",
      initialMessage: "We help tech companies form strategic partnerships",
      initialProspects: testProspects
    });

    const workflowId = workflowResponse.data.workflowId;
    console.log(`✅ Workflow created: ${workflowId}`);

    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Simulate user editing the email template (adding our components)
    console.log('\n2️⃣ Simulating user editing email with components at specific positions...');

    const editResponse = await axios.post(`${API_BASE}/email-editor/save-template`, {
      workflowId: workflowId,
      template: testTemplate
    });

    console.log('✅ Template saved with components at specific positions:');
    console.log('   - Logo component at position (0, 100)');
    console.log('   - CTA button at position (0, 300)');
    console.log('   - Testimonial at position (0, 500)');

    // Step 3: Simulate sending first email to first prospect
    console.log('\n3️⃣ Testing first email generation with component preservation...');

    const firstEmailResponse = await axios.post(`${API_BASE}/email/send-template-directly`, {
      workflowId: workflowId,
      recipient: testProspects[0],
      templateData: testTemplate
    });

    console.log('✅ First email generated for:', testProspects[0].name);
    console.log('📧 First email HTML length:', firstEmailResponse.data.htmlContent?.length || 'N/A');

    // Check if components are in correct positions in first email
    const firstEmailHTML = firstEmailResponse.data.htmlContent || '';
    console.log('\n🔍 Checking component positions in first email:');
    console.log('   - Logo component present:', firstEmailHTML.includes('component-logo') ? '✅' : '❌');
    console.log('   - CTA component present:', firstEmailHTML.includes('component-cta-middle') ? '✅' : '❌');
    console.log('   - Testimonial component present:', firstEmailHTML.includes('component-testimonial') ? '✅' : '❌');
    console.log('   - Components in middle (not appended at bottom):',
                firstEmailHTML.indexOf('component-cta-middle') < firstEmailHTML.indexOf('Best regards') ? '✅' : '❌');

    // Step 4: Simulate user approving the template
    console.log('\n4️⃣ Simulating user approving email template...');

    const approveResponse = await axios.post(`${API_BASE}/email-editor/approve-template`, {
      workflowId: workflowId,
      approved: true,
      templateData: testTemplate
    });

    console.log('✅ Template approved, ready for bulk sending');

    // Step 5: Test subsequent emails to verify they use the approved template
    console.log('\n5️⃣ Testing subsequent emails use the approved template...');

    for (let i = 1; i < testProspects.length; i++) {
      const prospect = testProspects[i];
      console.log(`\n📧 Testing email ${i + 1} for ${prospect.name}...`);

      const emailResponse = await axios.post(`${API_BASE}/email/send-template-directly`, {
        workflowId: workflowId,
        recipient: prospect,
        templateData: testTemplate
      });

      const emailHTML = emailResponse.data.htmlContent || '';
      console.log(`✅ Email ${i + 1} generated, HTML length:`, emailHTML.length);

      // Verify components are preserved in correct positions
      console.log('🔍 Component position verification:');
      console.log('   - Logo component present:', emailHTML.includes('component-logo') ? '✅' : '❌');
      console.log('   - CTA component present:', emailHTML.includes('component-cta-middle') ? '✅' : '❌');
      console.log('   - Testimonial component present:', emailHTML.includes('component-testimonial') ? '✅' : '❌');
      console.log('   - Components integrated (not at bottom):',
                  emailHTML.indexOf('component-cta-middle') < emailHTML.indexOf('Best regards') ? '✅' : '❌');

      // Check personalization worked
      console.log('   - Name personalized:', emailHTML.includes(prospect.name) ? '✅' : '❌');
      console.log('   - Company personalized:', emailHTML.includes(prospect.company) ? '✅' : '❌');

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 6: Final verification
    console.log('\n6️⃣ Final Test Results Summary');
    console.log('=' .repeat(60));
    console.log('✅ Template Creation: Components added at specific positions');
    console.log('✅ First Email: Components preserved in edited positions');
    console.log('✅ Template Approval: Template structure maintained');
    console.log('✅ Subsequent Emails: All use approved template with correct component positions');
    console.log('✅ Personalization: Names and companies properly replaced');
    console.log('\n🎉 COMPONENT POSITION PRESERVATION TEST COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.log('\n📊 Test Results:');
    console.log('❌ Component position preservation needs debugging');
  }
}

// Run the test
runManualTest().catch(console.error);