/**
 * Test Fixed Super Power Email Search Engine
 * Quick test to verify the improvements work
 */

const SuperPowerEmailSearchEngine = require('./server/agents/SuperPowerEmailSearchEngine');

async function testFixedEngine() {
  console.log('🧪 Testing Fixed Super Power Email Search Engine');
  console.log('=' .repeat(60));
  
  const engine = new SuperPowerEmailSearchEngine();
  
  // Test with a simple company
  const testCompany = {
    name: 'GitHub',
    website: 'https://github.com',
    domain: 'github.com',
    industry: 'technology'
  };
  
  console.log(`\n🔍 Testing: ${testCompany.name}`);
  console.log('─'.repeat(40));
  
  try {
    const startTime = Date.now();
    const results = await engine.searchRealEmails(testCompany);
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Results after ${duration}ms:`);
    console.log(`   Total emails found: ${results.emails?.length || 0}`);
    console.log(`   Sources used: ${results.sources?.join(', ') || 'none'}`);
    console.log(`   Search queries: ${results.searchQueries?.length || 0}`);
    
    if (results.emails && results.emails.length > 0) {
      console.log('\n📧 Found emails:');
      results.emails.slice(0, 5).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email}`);
        console.log(`      Role: ${email.title}`);
        console.log(`      Source: ${email.source}`);
        console.log(`      Confidence: ${email.confidence}%`);
        console.log(`      Verified: ${email.verified ? '✅' : '❌'}`);
      });
      
      console.log('\n🎉 SUCCESS: Super Power Engine is working!');
    } else {
      console.log('\n⚠️  No emails found, but engine is running');
      
      // Show what queries were attempted
      if (results.searchQueries && results.searchQueries.length > 0) {
        console.log('\n🔎 Search queries attempted:');
        results.searchQueries.forEach((query, index) => {
          console.log(`   ${index + 1}. "${query}"`);
        });
      }
    }
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    
    // Check what went wrong
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Fix: Make sure Ollama is running:');
      console.log('   ollama serve');
    }
    
    if (error.message.includes('timeout') || error.message.includes('network')) {
      console.log('\n💡 Fix: Network/timeout issue - this is normal, try again');
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test completed!');
}

// Run the test
testFixedEngine().catch(console.error);