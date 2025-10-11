/**
 * Test script to verify background prospect search is working
 * Run this after starting a campaign to check backend logs
 */

const axios = require('axios');

async function testBackgroundWorkflow() {
  console.log('🧪 Testing background workflow...\n');

  try {
    // 1. Start a campaign
    console.log('1️⃣ Starting campaign...');
    const startResponse = await axios.post('http://localhost:5050/api/workflow/start', {
      targetWebsite: 'https://fruitai.org',
      campaignGoal: 'partnership',
      businessType: 'technology'
    });

    console.log('✅ Campaign started:', startResponse.data.message);
    console.log('📊 Status:', startResponse.data.data.status);
    console.log('🔄 Background search running:', startResponse.data.data.backgroundSearchRunning);

    // 2. Wait a bit for background process to start
    console.log('\n2️⃣ Waiting 5 seconds for background search to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Check workflow results
    console.log('\n3️⃣ Checking workflow results...');
    const resultsResponse = await axios.get('http://localhost:5050/api/workflow/results');

    console.log('📊 Results:', {
      prospectsCount: resultsResponse.data.data.totalProspects,
      isRealData: resultsResponse.data.data.isRealData,
      workflowState: resultsResponse.data.data.workflowState,
      demoMode: resultsResponse.data.data.demoMode
    });

    if (resultsResponse.data.data.totalProspects > 0) {
      console.log('\n✅ SUCCESS! Prospects found:', resultsResponse.data.data.totalProspects);
      console.log('📧 Sample prospects:',
        resultsResponse.data.data.prospects.slice(0, 3).map(p => p.email)
      );
    } else {
      console.log('\n⚠️ No prospects found yet. Background search may still be running.');
      console.log('💡 Check your terminal where the server is running for logs like:');
      console.log('   - ⚡ Background search scheduled on next event loop tick');
      console.log('   - 🔍 Starting executeProspectSearchWithLearning...');
      console.log('   - ✅ Background search found {n} prospects');
      console.log('   - 🎨 Template selection popup triggered');
    }

    // 4. Wait longer and check again
    console.log('\n4️⃣ Waiting another 90 seconds for prospect discovery...');
    await new Promise(resolve => setTimeout(resolve, 90000));

    console.log('\n5️⃣ Final check...');
    const finalResults = await axios.get('http://localhost:5050/api/workflow/results');

    console.log('📊 Final results:', {
      prospectsCount: finalResults.data.data.totalProspects,
      isRealData: finalResults.data.data.isRealData
    });

    if (finalResults.data.data.totalProspects > 0) {
      console.log('\n🎉 SUCCESS! Background search completed!');
      console.log(`📧 Found ${finalResults.data.data.totalProspects} prospects`);
    } else {
      console.log('\n❌ FAILED: No prospects found after 95 seconds');
      console.log('🔍 Check server logs for errors');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testBackgroundWorkflow();
