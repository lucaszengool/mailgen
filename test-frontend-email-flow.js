console.log('🔍 Testing Frontend Email Display Data Flow...');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Create mock server for WebSocket manager
const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testEmailDataFlow() {
  console.log('🔗 Setting up WebSocket manager...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // Mock WebSocket client to capture ALL email broadcasts
  const capturedEmails = [];
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      
      if (parsedData.type === 'email_sent') {
        console.log('📧 Single Email Event:', parsedData.data.to, '-', parsedData.data.subject?.substring(0, 50));
        capturedEmails.push(parsedData.data);
      } else if (parsedData.type === 'data_update' && parsedData.data?.emailCampaign) {
        console.log('📡 Email Campaign Update:', parsedData.data.emailCampaign.emailsSent?.length || 0, 'emails');
        if (parsedData.data.emailCampaign.emailsSent) {
          capturedEmails.push(...parsedData.data.emailCampaign.emailsSent);
        }
      } else if (parsedData.type === 'email_list' && parsedData.emails) {
        console.log('📋 Email List Update:', parsedData.emails.length, 'emails');
        capturedEmails.push(...parsedData.emails);
      }
    }
  };
  
  wsManager.clients.set('test-client', {
    ws: mockWsClient,
    subscriptions: new Set(),
    lastActivity: Date.now()
  });
  
  console.log('🤖 Setting up LangGraph agent...');
  const agent = new LangGraphMarketingAgent();
  agent.setWebSocketManager(wsManager);
  
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'sales',
    businessType: 'technology'
  };
  
  console.log('🚀 Running campaign to generate multiple emails...');
  
  try {
    const results = await agent.executeCampaign(testConfig);
    
    console.log('\n=== FRONTEND EMAIL DISPLAY TEST RESULTS ===');
    console.log('✅ Campaign completed');
    console.log('📊 Backend Results - Prospects Found:', results.prospects ? results.prospects.length : 0);
    console.log('📧 Backend Results - Email Campaign:', results.emailCampaign ? 'SUCCESS' : 'FAILED');
    
    if (results.emailCampaign && results.emailCampaign.emailsSent) {
      console.log('\n📧 BACKEND EMAIL DATA STRUCTURE:');
      console.log('   EmailsSent array length:', results.emailCampaign.emailsSent.length);
      
      results.emailCampaign.emailsSent.forEach((email, i) => {
        console.log(`   Email ${i + 1}:`, email.to, '-', email.subject?.substring(0, 30));
      });
    }
    
    console.log('\n📡 WEBSOCKET CAPTURED EMAILS:');
    console.log('   Total emails captured via WebSocket:', capturedEmails.length);
    const uniqueEmails = [...new Map(capturedEmails.map(e => [e.to, e])).values()];
    console.log('   Unique emails after deduplication:', uniqueEmails.length);
    
    uniqueEmails.forEach((email, i) => {
      console.log(`   Captured ${i + 1}:`, email.to, '-', email.subject?.substring(0, 30));
    });
    
    console.log('\n🎯 FRONTEND DISPLAY ISSUE DIAGNOSIS:');
    if (results.emailCampaign?.emailsSent?.length > 1 && uniqueEmails.length === 1) {
      console.log('❌ ISSUE FOUND: Backend has multiple emails but WebSocket only broadcasting 1');
      console.log('   Root cause: WebSocket not broadcasting all emails to frontend');
      console.log('   Fix needed: Update WebSocket broadcast logic to send ALL emails');
    } else if (results.emailCampaign?.emailsSent?.length > 1 && uniqueEmails.length > 1) {
      console.log('✅ WebSocket correctly broadcasting all emails');
      console.log('   Issue may be in frontend email state management or display logic');
    } else if (results.emailCampaign?.emailsSent?.length <= 1) {
      console.log('⚠️ Backend only generating 1 email, so frontend behavior is correct');
    } else {
      console.log('⚠️ No emails generated to test frontend display');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testEmailDataFlow().catch(console.error);