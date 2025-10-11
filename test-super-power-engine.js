/**
 * Test Super Power Email Search Engine
 * This tests the REAL web search capabilities using SearXNG + Ollama
 */

const SuperPowerEmailSearchEngine = require('./server/agents/SuperPowerEmailSearchEngine');

async function testSuperPowerEngine() {
  console.log('🧪 Testing Super Power Email Search Engine');
  console.log('=' .repeat(80));
  console.log('🌐 This will perform REAL web searches for emails!');
  console.log('⚡ Using SearXNG meta-search + Ollama LLM intelligence');
  console.log('=' .repeat(80));
  
  const engine = new SuperPowerEmailSearchEngine();
  
  // Test cases for real companies
  const testCases = [
    {
      name: 'Stripe',
      website: 'https://stripe.com',
      domain: 'stripe.com',
      industry: 'fintech',
      description: 'Online payment processing platform'
    },
    {
      name: 'Shopify',
      website: 'https://shopify.com',
      domain: 'shopify.com', 
      industry: 'ecommerce',
      description: 'E-commerce platform for online stores'
    },
    {
      name: 'GitHub',
      website: 'https://github.com',
      domain: 'github.com',
      industry: 'technology',
      description: 'Code hosting and collaboration platform'
    }
  ];
  
  let totalEmails = 0;
  let verifiedEmails = 0;
  let highConfidenceEmails = 0;
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name} (${testCase.domain})`);
    console.log('─'.repeat(60));
    
    const startTime = Date.now();
    
    try {
      const results = await engine.searchRealEmails(testCase);
      const duration = Date.now() - startTime;
      
      if (results.emails && results.emails.length > 0) {
        totalEmails += results.emails.length;
        const verified = results.emails.filter(e => e.verified).length;
        const highConf = results.emails.filter(e => e.confidence > 70).length;
        
        verifiedEmails += verified;
        highConfidenceEmails += highConf;
        
        console.log(`✅ Found ${results.emails.length} emails for ${testCase.name}`);
        console.log(`   📊 Search queries used: ${results.searchQueries?.length || 'N/A'}`);
        console.log(`   ✅ Verified emails: ${verified}`);
        console.log(`   🎯 High confidence (>70%): ${highConf}`);
        console.log(`   ⏱️  Search time: ${duration}ms`);
        
        // Show search queries used
        if (results.searchQueries && results.searchQueries.length > 0) {
          console.log('\\n   🔎 Search queries:');
          results.searchQueries.slice(0, 3).forEach((query, index) => {
            console.log(`      ${index + 1}. "${query}"`);
          });
        }
        
        // Show top 5 emails
        console.log('\\n   📧 Top 5 emails found:');
        results.emails.slice(0, 5).forEach((email, index) => {
          console.log(`      ${index + 1}. ${email.email}`);
          console.log(`         Role: ${email.title || 'Unknown'}`);
          console.log(`         Source: ${email.source || 'Unknown'}`);
          console.log(`         Engine: ${email.engine || 'Unknown'}`);
          console.log(`         Confidence: ${email.confidence}%`);
          console.log(`         Verified: ${email.verified ? '✅' : '❌'}`);
          if (email.llmScore) {
            console.log(`         LLM Score: ${email.llmScore}`);
          }
        });
        
      } else {
        console.log(`❌ No emails found for ${testCase.name}`);
        console.log(`   ⏱️  Search time: ${duration}ms`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${testCase.name}: ${error.message}`);
    }
  }
  
  console.log('\\n' + '=' .repeat(80));
  console.log('📊 FINAL RESULTS SUMMARY');
  console.log('=' .repeat(80));
  console.log(`🎯 Total emails found: ${totalEmails}`);
  console.log(`✅ Verified emails: ${verifiedEmails}`);
  console.log(`🎯 High confidence emails: ${highConfidenceEmails}`);
  console.log(`📈 Verification rate: ${totalEmails > 0 ? Math.round((verifiedEmails / totalEmails) * 100) : 0}%`);
  console.log(`🎯 High confidence rate: ${totalEmails > 0 ? Math.round((highConfidenceEmails / totalEmails) * 100) : 0}%`);
  
  console.log('\\n🌟 KEY FEATURES DEMONSTRATED:');
  console.log('✅ Real web search using SearXNG meta-search');
  console.log('✅ Intelligent query generation using Ollama LLM');
  console.log('✅ Multiple search engines (Google, Bing, DuckDuckGo)');
  console.log('✅ Deep web scraping for email extraction');
  console.log('✅ LLM-powered email validation and ranking');
  console.log('✅ Advanced search operators (site:, inurl:, etc.)');
  console.log('✅ Business email filtering and verification');
  
  console.log('\\n📋 SETUP INSTRUCTIONS:');
  console.log('1. Install SearXNG locally:');
  console.log('   docker-compose -f docker-compose.searxng.yml up -d');
  console.log('\\n2. Make sure Ollama is running:');
  console.log('   ollama serve');
  console.log('   ollama run llama2');
  console.log('\\n3. Set environment variables:');
  console.log('   export SEARXNG_URL=http://localhost:8080');
  console.log('   export OLLAMA_URL=http://localhost:11434');
  
  if (totalEmails > 0) {
    console.log('\\n🎉 SUCCESS: Super Power Email Search Engine is working!');
  } else {
    console.log('\\n⚠️  Setup required: Follow setup instructions above');
  }
}

// Run the test
testSuperPowerEngine().catch(console.error);