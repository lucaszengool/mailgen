/**
 * Test Multi-Source Email Aggregation MCP
 * Demonstrates the no-API, multi-source email finding capabilities
 */

const MCPEmailAggregator = require('./server/integrations/MCPEmailAggregator');

async function testMCPEmailAggregator() {
  console.log('🧪 Testing MCP Multi-Source Email Aggregator');
  console.log('============================================================');
  
  const aggregator = new MCPEmailAggregator();
  
  try {
    // Test 1: Health check
    console.log('\n📊 Health Check:');
    const health = await aggregator.healthCheck();
    console.log(`   Status: ${health.status}`);
    console.log(`   Initialized: ${health.initialized}`);
    
    // Test 2: Search for company emails
    console.log('\n🔍 Testing Company Email Search:');
    console.log('────────────────────────────────────────');
    
    const testCompany = {
      name: 'GitHub',
      domain: 'github.com',
      website: 'https://github.com',
      description: 'Development platform for software projects'
    };
    
    console.log(`Searching emails for: ${testCompany.name}`);
    const startTime = Date.now();
    
    const results = await aggregator.searchRealEmails(testCompany);
    
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Results after ${duration}ms:`);
    console.log(`   Total emails found: ${results.emails.length}`);
    console.log(`   Sources used: ${results.sources.join(', ')}`);
    console.log(`   Search queries: ${results.searchQueries.length}`);
    
    if (results.mcp_confidence_scores) {
      console.log(`\n📈 Source Performance:`);
      Object.entries(results.mcp_confidence_scores).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} emails`);
      });
    }
    
    if (results.emails.length > 0) {
      console.log(`\n📧 Found emails:`);
      results.emails.slice(0, 10).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Role: ${email.title}`);
        console.log(`      Sources: ${email.mcp_sources ? email.mcp_sources.join(', ') : email.source}`);
        console.log(`      Confidence: ${email.confidence}%`);
        if (email.name) console.log(`      Name: ${email.name}`);
        if (email.github_username) console.log(`      GitHub: ${email.github_username}`);
        console.log(`      Verified: ${email.verified ? '✅' : '❌'}`);
        console.log('');
      });
      
      console.log('🎉 SUCCESS: MCP Email Aggregator is working!');
    } else {
      console.log('⚠️ No emails found, but system is functioning');
    }
    
    // Test 3: Prospect search
    console.log('\n🎯 Testing Prospect Search:');
    console.log('────────────────────────────────────────');
    
    const userCompany = {
      name: 'FruitAI',
      company_name: 'FruitAI',
      domain: 'fruitai.org',
      website: 'http://fruitai.org',
      description: 'AI-powered business solutions'
    };
    
    console.log(`Searching prospects for: ${userCompany.name}`);
    const prospectStartTime = Date.now();
    
    const prospectResults = await aggregator.searchForProspects(userCompany);
    
    const prospectDuration = Date.now() - prospectStartTime;
    
    console.log(`\n📊 Prospect Results after ${prospectDuration}ms:`);
    console.log(`   Total prospect emails found: ${prospectResults.emails.length}`);
    console.log(`   Prospect companies analyzed: ${prospectResults.prospect_companies ? prospectResults.prospect_companies.join(', ') : 'None'}`);
    
    if (prospectResults.emails.length > 0) {
      console.log(`\n📧 Prospect emails:`);
      prospectResults.emails.slice(0, 5).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Company: ${email.prospect_company}`);
        console.log(`      Role: ${email.title}`);
        console.log(`      Confidence: ${email.confidence}%`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n============================================================');
  console.log('Test completed!');
}

// Run the test
if (require.main === module) {
  testMCPEmailAggregator().catch(console.error);
}

module.exports = testMCPEmailAggregator;