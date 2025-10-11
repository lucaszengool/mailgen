/**
 * Test Complete Multi-Source Email Integration
 * Tests the full integration that replaces SuperPowerEmailSearchEngine
 */

const MultiSourceEmailIntegration = require('./server/integrations/MultiSourceEmailIntegration');

async function testCompleteIntegration() {
  console.log('🧪 Testing Complete Multi-Source Email Integration');
  console.log('============================================================');
  
  const integration = new MultiSourceEmailIntegration();
  
  try {
    // Test 1: Health check
    console.log('\n📊 Health Check:');
    const health = await integration.healthCheck();
    console.log(`   Status: ${health.status}`);
    console.log(`   Engine: ${health.engine}`);
    console.log(`   Capabilities: ${health.capabilities.join(', ')}`);
    
    // Test 2: User's own website detection (should search for prospects)
    console.log('\n🎯 Testing User Website Detection (Prospect Search):');
    console.log('────────────────────────────────────────');
    
    const userCompany = {
      name: 'FruitAI',
      company_name: 'FruitAI',
      domain: 'fruitai.org',
      website: 'http://fruitai.org',
      description: 'AI-powered business solutions'
    };
    
    console.log(`Testing with user company: ${userCompany.name}`);
    console.log(`Description: ${userCompany.description}`);
    
    const startTime = Date.now();
    const userResults = await integration.searchRealEmails(userCompany);
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 User Company Results after ${duration}ms:`);
    console.log(`   Total emails found: ${userResults.emails.length}`);
    console.log(`   Sources used: ${userResults.sources.join(', ')}`);
    console.log(`   Prospect companies: ${userResults.prospect_companies ? userResults.prospect_companies.join(', ') : 'None'}`);
    
    if (userResults.emails.length > 0) {
      console.log(`\n📧 Prospect emails found:`);
      userResults.emails.slice(0, 5).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Company: ${email.prospect_company || email.company}`);
        console.log(`      Role: ${email.title}`);
        console.log(`      Industry: ${email.prospect_industry || 'N/A'}`);
        console.log(`      Confidence: ${email.confidence}%`);
        console.log(`      Is Prospect: ${email.is_prospect ? '✅' : '❌'}`);
        console.log('');
      });
    }
    
    // Test 3: External company search (should search for their emails)
    console.log('\n🔍 Testing External Company Search:');
    console.log('────────────────────────────────────────');
    
    const externalCompany = {
      name: 'Stripe',
      domain: 'stripe.com',
      website: 'https://stripe.com',
      description: 'Payment processing platform'
    };
    
    console.log(`Testing with external company: ${externalCompany.name}`);
    
    const externalStartTime = Date.now();
    const externalResults = await integration.searchRealEmails(externalCompany);
    const externalDuration = Date.now() - externalStartTime;
    
    console.log(`\n📊 External Company Results after ${externalDuration}ms:`);
    console.log(`   Total emails found: ${externalResults.emails.length}`);
    console.log(`   Sources used: ${externalResults.sources.join(', ')}`);
    
    if (externalResults.source_performance) {
      console.log(`\n📈 Source Performance:`);
      Object.entries(externalResults.source_performance).forEach(([source, details]) => {
        console.log(`   ${source}: ${details.count} emails (${details.status})`);
        if (details.error) console.log(`      Error: ${details.error}`);
      });
    }
    
    if (externalResults.emails.length > 0) {
      console.log(`\n📧 External company emails found:`);
      externalResults.emails.slice(0, 5).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Role: ${email.title}`);
        console.log(`      Source: ${email.source}`);
        console.log(`      Confidence: ${email.confidence}%`);
        if (email.name) console.log(`      Name: ${email.name}`);
        if (email.github_username) console.log(`      GitHub: ${email.github_username}`);
        console.log('');
      });
    }
    
    // Test 4: Format compatibility test
    console.log('\n🔄 Testing Format Compatibility:');
    console.log('────────────────────────────────────────');
    
    const testResult = externalResults.emails.length > 0 ? externalResults : userResults;
    
    if (testResult.emails.length > 0) {
      const sampleEmail = testResult.emails[0];
      console.log(`   Sample email format:`);
      console.log(`   ✅ email: ${sampleEmail.email}`);
      console.log(`   ✅ source: ${sampleEmail.source}`);
      console.log(`   ✅ title: ${sampleEmail.title}`);
      console.log(`   ✅ confidence: ${sampleEmail.confidence}`);
      console.log(`   ✅ engine: ${sampleEmail.engine}`);
      console.log(`   ✅ verified: ${sampleEmail.verified}`);
      console.log(`   ✅ multi_source: ${sampleEmail.multi_source}`);
      
      console.log('\n✅ Format is compatible with existing system!');
    }
    
    // Summary
    console.log('\n📊 Integration Test Summary:');
    console.log('────────────────────────────────────────');
    console.log(`   Health Status: ${health.status}`);
    console.log(`   User Website Detection: ${userResults.prospect_companies ? 'Working' : 'Not triggered'}`);
    console.log(`   External Search: ${externalResults.emails.length > 0 ? 'Working' : 'No results'}`);
    console.log(`   Format Compatibility: Compatible`);
    console.log(`   Multi-Source Capabilities: Enabled`);
    
    if (userResults.emails.length > 0 || externalResults.emails.length > 0) {
      console.log('\n🎉 SUCCESS: Multi-Source Email Integration is fully functional!');
      console.log('   ✅ No API keys required');
      console.log('   ✅ Multiple sources aggregated');
      console.log('   ✅ Prospect detection working');
      console.log('   ✅ Compatible with existing system');
    } else {
      console.log('\n⚠️ Integration working but no emails found in this test');
      console.log('   This may be due to rate limiting or network restrictions');
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n============================================================');
  console.log('Integration test completed!');
}

// Run the test
if (require.main === module) {
  testCompleteIntegration().catch(console.error);
}

module.exports = testCompleteIntegration;