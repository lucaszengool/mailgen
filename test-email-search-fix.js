#!/usr/bin/env node

/**
 * Test script to verify email search functionality works after fixes
 */

const ProspectSearchAgent = require('./server/agents/ProspectSearchAgent');

async function testEmailSearch() {
  console.log('🧪 Testing Email Search Functionality...\n');
  
  try {
    const prospectSearchAgent = new ProspectSearchAgent();
    
    // Test with a more specific industry
    const strategy = {
      target_audience: {
        search_keywords: {
          primary_keywords: ['SaaS', 'software'],
          industry_keywords: ['technology', 'startup']
        }
      }
    };
    
    const targetIndustry = 'Software';
    const businessType = 'startup';
    
    console.log('🎯 Testing with:');
    console.log(`   Industry: ${targetIndustry}`);
    console.log(`   Business Type: ${businessType}`);
    console.log(`   Strategy Keywords: ${JSON.stringify(strategy.target_audience.search_keywords)}`);
    
    // Test buildSearchTerm method
    const searchTerm = prospectSearchAgent.buildSearchTerm(strategy, targetIndustry);
    console.log(`\n🔍 Generated Search Term: "${searchTerm}"`);
    
    if (searchTerm.includes('business startup company')) {
      console.log('❌ Search term still contains generic words - this is bad');
    } else {
      console.log('✅ Search term looks more specific - this is good');
    }
    
    // Test prospect search (first 5 results only for speed)
    console.log('\n🚀 Testing prospect search...');
    const results = await prospectSearchAgent.searchProspects(strategy, targetIndustry, businessType);
    
    console.log(`\n📊 Search Results:`);
    console.log(`   Found: ${results.prospects ? results.prospects.length : 0} prospects`);
    console.log(`   Success: ${results.success || false}`);
    
    if (results.prospects && results.prospects.length > 0) {
      console.log('✅ SUCCESS: Found email prospects!');
      console.log('\n📧 Sample prospect:');
      const sample = results.prospects[0];
      console.log(`   Email: ${sample.email}`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Company: ${sample.company}`);
      console.log(`   Source: ${sample.source}`);
    } else {
      console.log('❌ FAILED: No email prospects found');
      console.log('   This indicates the search engines are still not working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testEmailSearch().catch(console.error);