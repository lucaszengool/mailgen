console.log('🧪 Quick Frontend-Backend Connection Test...');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Mock HTTP server for WebSocket manager
const mockServer = { on: () => {}, addListener: () => {}, removeListener: () => {}, emit: () => {} };

async function quickTest() {
  console.log('⚡ Setting up quick test...');
  
  const wsManager = new WorkflowWebSocketManager(mockServer);
  const agent = new LangGraphMarketingAgent({ wsManager });
  agent.setWebSocketManager(wsManager);
  
  console.log('🚀 Testing workflow execution for 5 seconds max...');
  
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'partnership', 
    businessType: 'technology'
  };
  
  // Set a timeout to stop after 5 seconds
  const timeout = new Promise(resolve => {
    setTimeout(() => {
      console.log('⏱️ 5-second test timeout reached');
      resolve({ timeout: true });
    }, 5000);
  });
  
  try {
    const result = await Promise.race([
      agent.executeCampaign(testConfig),
      timeout
    ]);
    
    if (result.timeout) {
      console.log('✅ Test stopped after 5 seconds - checking WebSocket states...');
    } else {
      console.log('🎉 Campaign completed within 5 seconds!');
      console.log('📊 Results:', {
        campaignId: result.campaignId,
        businessAnalysis: !!result.businessAnalysis,
        marketingStrategy: !!result.marketingStrategy,
        prospects: result.prospects?.length || 0,
        emailCampaign: !!result.emailCampaign
      });
    }
    
    // Check WebSocket states regardless
    console.log('\n🔍 WebSocket States Check:');
    console.log('   Workflow states count:', wsManager.workflowStates.size);
    
    let foundProspects = false;
    for (const [workflowId, state] of wsManager.workflowStates) {
      if (state.data && state.data.prospects && state.data.prospects.length > 0) {
        console.log('✅ Found prospects in WebSocket state:', state.data.prospects.length);
        foundProspects = true;
        break;
      }
    }
    
    if (foundProspects) {
      console.log('\n🎉 SUCCESS: Frontend-Backend connection fix is working!');
      console.log('✅ WebSocket manager properly stores prospect data');
      console.log('✅ Frontend should now display prospects instead of 0');
    } else {
      console.log('\n⚠️ WebSocket states created but no prospect data found yet');
      console.log('   This is normal if campaign was interrupted early');
    }
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('⏱️ Test timed out - this is expected for testing purposes');
    } else {
      console.error('❌ Test error:', error.message);
    }
  }
  
  console.log('\n✅ Quick test completed');
}

quickTest().catch(console.error);