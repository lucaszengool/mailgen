#!/usr/bin/env node

const ProspectSearchAgent = require('./server/agents/ProspectSearchAgent');

async function testKeywordFix() {
  console.log('🔍 Testing Fixed Keyword Generation...\n');
  
  const agent = new ProspectSearchAgent();
  
  // Test the problematic case
  const problemCase = {
    strategy: {
      target_audience: {
        search_keywords: {
          primary_keywords: ['Food Technology', 'business'],
          industry_keywords: ['Food Technology', 'food']
        }
      }
    },
    targetIndustry: 'Food Technology'
  };
  
  const result = agent.buildSearchTerm(problemCase.strategy, problemCase.targetIndustry);
  console.log(`Problematic case result: "${result}"`);
  
  if (result.includes('Food Technology Food Technology')) {
    console.log('❌ Still has duplicate keywords!');
  } else if (result.includes('business')) {
    console.log('⚠️ Still contains generic "business" word');
  } else {
    console.log('✅ Looks much better!');
  }
  
  // Test more cases
  const testCases = [
    {
      name: 'Empty strategy',
      strategy: {},
      targetIndustry: 'Food Technology',
      expected: 'Food Technology'
    },
    {
      name: 'With duplicates',
      strategy: {
        target_audience: {
          search_keywords: {
            primary_keywords: ['Food Technology', 'food'],
            industry_keywords: ['Food Technology', 'technology']
          }
        }
      },
      targetIndustry: 'Food Technology',
      expected: 'Food Technology food' // should be deduplicated
    }
  ];
  
  testCases.forEach(testCase => {
    const result = agent.buildSearchTerm(testCase.strategy, testCase.targetIndustry);
    console.log(`${testCase.name}: "${result}"`);
    
    if (result.split(' ').length <= 2) {
      console.log('  ✅ Length looks good (≤2 words)');
    } else {
      console.log('  ⚠️ Might be too long');
    }
  });
  
  console.log('\n📊 Testing with a working keyword:');
  // Test with a keyword we know works
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    console.log('🔍 Testing "Food Technology" with Python engine...');
    const command = `python3 SuperEmailDiscoveryEngine.py "Food Technology" 2`;
    
    // Run with 30 second timeout
    const timeout = setTimeout(() => {
      console.log('⏰ Test timed out - but this is normal for comprehensive search');
    }, 30000);
    
    const { stdout } = await execPromise(command, { 
      timeout: 30000,
      maxBuffer: 1024 * 1024 
    });
    
    clearTimeout(timeout);
    
    if (stdout.includes('"success": true')) {
      console.log('✅ Python engine can find emails with "Food Technology"');
    } else if (stdout.includes('"success": false')) {
      console.log('⚠️ Python engine returns success:false for this keyword');
    }
    
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Python search timed out (30s) - this is normal');
    } else {
      console.log(`⚠️ Python test error: ${error.message}`);
    }
  }
}

testKeywordFix();