/**
 * Test Simplified Multi-Source Email Finder
 * No MCP SDK required - pure JavaScript implementation
 */

const SimplifiedMultiSourceEmailFinder = require('./server/mcp/SimplifiedMultiSourceEmailFinder');

async function testSimplifiedMultiSource() {
  console.log('🧪 Testing Simplified Multi-Source Email Finder');
  console.log('============================================================');
  
  const finder = new SimplifiedMultiSourceEmailFinder();
  
  try {
    // Test 1: Real company search
    console.log('\n🔍 Testing Multi-Source Email Search:');
    console.log('────────────────────────────────────────');
    
    const testCompany = {
      name: 'GitHub',
      domain: 'github.com',
      website: 'https://github.com',
      description: 'Development platform for software projects'
    };
    
    console.log(`Searching emails for: ${testCompany.name}`);
    const startTime = Date.now();
    
    const results = await finder.searchRealEmails(testCompany);
    
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Results after ${duration}ms:`);
    console.log(`   Total emails found: ${results.emails.length}`);
    console.log(`   Sources used: ${results.sources.join(', ')}`);
    console.log(`   Search queries: ${results.searchQueries.length}`);
    
    console.log(`\n📈 Source Performance:`);
    Object.entries(results.source_details).forEach(([source, details]) => {
      console.log(`   ${source}: ${details.count} emails (${details.status})`);
      if (details.error) console.log(`      Error: ${details.error}`);
    });
    
    if (results.emails.length > 0) {
      console.log(`\n📧 Found emails:`);
      results.emails.slice(0, 10).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Role: ${email.title}`);
        console.log(`      Sources: ${Array.isArray(email.sources) ? email.sources.join(', ') : email.source}`);
        console.log(`      Confidence: ${email.confidence}%`);
        if (email.name) console.log(`      Name: ${email.name}`);
        if (email.github_username) console.log(`      GitHub: ${email.github_username}`);
        if (email.inferred) console.log(`      Inferred: ✅`);
        console.log('');
      });
      
      console.log('🎉 SUCCESS: Multi-Source Email Finder is working!');
    } else {
      console.log('⚠️ No emails found, checking if sources are accessible...');
    }
    
    // Test 2: Domain analysis only
    console.log('\n🔍 Testing Domain Analysis Only:');
    console.log('────────────────────────────────────────');
    
    const domainTestCompany = {
      name: 'OpenAI',
      domain: 'openai.com',
      website: 'https://openai.com'
    };
    
    console.log(`Testing domain analysis for: ${domainTestCompany.domain}`);
    const domainResults = await finder.searchRealEmails(domainTestCompany);
    
    console.log(`   Domain analysis found: ${domainResults.emails.length} emails`);
    
    if (domainResults.emails.length > 0) {
      domainResults.emails.slice(0, 5).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email} (${email.source}) - ${email.confidence}%`);
      });
    }
    
    // Test 3: Error handling
    console.log('\n🔍 Testing Error Handling:');
    console.log('────────────────────────────────────────');
    
    const invalidCompany = {
      name: 'NonExistentCompany12345',
      domain: 'nonexistent12345.invalidtld',
      website: 'https://nonexistent12345.invalidtld'
    };
    
    console.log(`Testing with invalid company: ${invalidCompany.name}`);
    const errorResults = await finder.searchRealEmails(invalidCompany);
    
    console.log(`   Error handling test: ${errorResults.emails.length} emails found`);
    console.log(`   Sources attempted: ${errorResults.sources.join(', ') || 'none'}`);
    
    // Show source performance for error case
    if (errorResults.source_details) {
      Object.entries(errorResults.source_details).forEach(([source, details]) => {
        console.log(`   ${source}: ${details.status} (${details.count} emails)`);
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
  testSimplifiedMultiSource().catch(console.error);
}

module.exports = testSimplifiedMultiSource;