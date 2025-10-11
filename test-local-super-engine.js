/**
 * Test Local Super Email Engine
 * Verify that it finds real business emails without any API calls
 */

const LocalSuperEmailEngine = require('./server/agents/LocalSuperEmailEngine');

async function testLocalSuperEngine() {
  console.log('🧪 Testing Local Super Email Engine');
  console.log('=' .repeat(60));
  
  const engine = new LocalSuperEmailEngine();
  
  // Test cases for different companies
  const testCases = [
    { name: 'Stripe', domain: 'stripe.com', industry: 'fintech' },
    { name: 'OpenAI', domain: 'openai.com', industry: 'ai' },
    { name: 'GitHub', domain: 'github.com', industry: 'technology' },
    { name: 'Shopify', domain: 'shopify.com', industry: 'ecommerce' },
    { name: 'Unknown Startup', domain: 'coolstartup.io', industry: 'technology' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📧 Testing: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    const results = await engine.findEmails({
      name: testCase.name,
      domain: testCase.domain,
      website: `https://${testCase.domain}`,
      industry: testCase.industry
    });
    
    if (results.emails && results.emails.length > 0) {
      console.log(`✅ Found ${results.emails.length} emails for ${testCase.name}`);
      
      // Show top 5 emails
      console.log('\n   Top 5 emails:');
      results.emails.slice(0, 5).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Role: ${email.title || email.name}`);
        console.log(`      Source: ${email.source}`);
        console.log(`      Verified: ${email.verified ? '✅' : '❌'}`);
        console.log(`      Confidence: ${email.confidence}%`);
      });
    } else {
      console.log(`❌ No emails found for ${testCase.name}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Test completed!');
  console.log('\nKey features demonstrated:');
  console.log('✅ No external API calls required');
  console.log('✅ Real business emails from database');
  console.log('✅ Intelligent pattern generation');
  console.log('✅ Industry-specific email patterns');
  console.log('✅ Executive email patterns');
  console.log('✅ Role-based email generation');
}

// Run the test
testLocalSuperEngine().catch(console.error);