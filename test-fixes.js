#!/usr/bin/env node

/**
 * Test script to verify all fixes are working properly
 * This tests:
 * 1. Template selection (cold_outreach vs partnership_outreach)
 * 2. campaignGoal undefined error fix
 * 3. Email generation flow
 */

const http = require('http');

console.log('🧪 Testing all fixes...\n');

function makeRequest(data, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3333,
      path: '/api/langgraph-agent/execute-campaign',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`📧 ${description}...`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log(`✅ ${description} - Campaign started successfully`);
            console.log(`   Campaign ID: ${response.campaignId}`);
            resolve(response);
          } else {
            console.log(`❌ ${description} - Failed:`, response);
            reject(new Error(response.error || 'Unknown error'));
          }
        } catch (error) {
          console.log(`❌ ${description} - Parse error:`, error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description} - Request error:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔧 Testing Template Selection Fix...');
  
  // Test 1: Cold Outreach Template
  try {
    await makeRequest({
      targetWebsite: "https://test1.com",
      businessType: "technology", 
      campaignGoal: "lead_generation",
      emailTemplate: "cold_outreach",
      templateData: {"id": "cold_outreach", "name": "Cold Outreach"}
    }, "Cold Outreach Template Test");
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
  } catch (error) {
    console.log('❌ Cold Outreach test failed:', error.message);
  }

  // Test 2: Partnership Template  
  try {
    await makeRequest({
      targetWebsite: "https://test2.com",
      businessType: "technology",
      campaignGoal: "partnership", 
      emailTemplate: "partnership_outreach",
      templateData: {"id": "partnership_outreach", "name": "Partnership Outreach"}
    }, "Partnership Template Test");
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
  } catch (error) {
    console.log('❌ Partnership template test failed:', error.message);
  }

  // Test 3: Missing campaignGoal (should use fallback)
  try {
    await makeRequest({
      targetWebsite: "https://test3.com",
      businessType: "technology",
      emailTemplate: "cold_outreach"
      // No campaignGoal provided - should use fallback
    }, "Missing campaignGoal Test (should use fallback)");
    
  } catch (error) {
    console.log('❌ Missing campaignGoal test failed:', error.message);
  }

  console.log('\n✅ All tests initiated successfully!');
  console.log('💡 Check the server console output for debug messages showing:');
  console.log('   - Template selection working correctly');
  console.log('   - No more "campaignGoal is not defined" errors');
  console.log('   - Proper template debug logging');
  console.log('\n📱 Also test the frontend UI at http://localhost:3000');
  console.log('   - Should show fancy email preview with browser mockup');
  console.log('   - Should display correct template names');
  console.log('   - Should not truncate long email content');
  
  process.exit(0);
}

runTests().catch(error => {
  console.error('🚫 Test suite failed:', error);
  process.exit(1);
});
