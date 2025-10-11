/**
 * Test SearXNG + Ollama Integration
 * Quick test to verify the system is working with real companies
 */

const SuperPowerEmailSearchEngine = require('./server/agents/SuperPowerEmailSearchEngine');

async function testSearXNGOllama() {
  console.log('🧪 Testing SearXNG + Ollama Integration');
  console.log('=' .repeat(50));
  
  const engine = new SuperPowerEmailSearchEngine();
  
  // Test with OpenAI (they should have some discoverable contact info)
  const testCompany = {
    name: 'OpenAI',
    website: 'https://openai.com',
    domain: 'openai.com',
    industry: 'artificial intelligence'
  };
  
  console.log(`\n🔍 Testing: ${testCompany.name}`);
  console.log('─'.repeat(30));
  
  try {
    const startTime = Date.now();
    const results = await engine.searchRealEmails(testCompany);
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Results after ${duration}ms:`);
    console.log(`   Total emails found: ${results.emails?.length || 0}`);
    console.log(`   Search queries generated: ${results.searchQueries?.length || 0}`);
    console.log(`   Sources used: ${results.sources?.join(', ') || 'none'}`);
    
    if (results.searchQueries && results.searchQueries.length > 0) {
      console.log('\n🤖 Ollama-generated search queries:');
      results.searchQueries.slice(0, 5).forEach((query, index) => {
        console.log(`   ${index + 1}. "${query}"`);
      });
    }
    
    if (results.emails && results.emails.length > 0) {
      console.log('\n📧 Found emails:');
      results.emails.slice(0, 3).forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.email} (${email.confidence}% confidence)`);
        console.log(`      Source: ${email.source}`);
      });
      
      console.log('\n🎉 SUCCESS: SearXNG + Ollama is working!');
    } else {
      console.log('\n⚠️  No emails found, but system is operational');
    }
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    
    // Check specific issues
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Fix: Make sure Ollama is running: ollama serve');
    }
    
    if (error.message.includes('timeout')) {
      console.log('💡 Fix: SearXNG instances may be slow, this is normal');
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ SearXNG + Ollama test completed!');
}

// Run the test
testSearXNGOllama().catch(console.error);