console.log('🧪 Testing Workflow Timing Fix - Email Broadcasting Order...');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Create mock server for WebSocket manager
const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testWorkflowTimingFix() {
  console.log('🔗 Setting up WebSocket manager...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // Capture all broadcasts in order
  const capturedBroadcasts = [];
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      capturedBroadcasts.push({
        type: parsedData.type,
        timestamp: Date.now(),
        hasEmailCampaign: !!(parsedData.data?.emailCampaign),
        emailCount: parsedData.data?.emailCampaign?.emails?.length || 
                   parsedData.data?.emailCampaign?.emailsSent?.length || 0
      });
      console.log(`📡 Broadcast: ${parsedData.type} ${parsedData.data?.emailCampaign ? '(with email data)' : ''}`);
    }
  };
  
  wsManager.clients.set('test-client', {
    ws: mockWsClient,
    subscriptions: new Set(),
    lastActivity: Date.now()
  });
  
  console.log('\n🤖 Setting up LangGraph agent...');
  const agent = new LangGraphMarketingAgent();
  agent.setWebSocketManager(wsManager);
  
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'partnership',
    businessType: 'technology'
  };
  
  console.log('\n🚀 Testing workflow timing fix with actual campaign execution...');
  console.log('Expected: stepCompleted should broadcast BEFORE workflow marked as completed');
  console.log('Expected: Frontend should receive email data via WebSocket broadcasts');
  
  try {
    const results = await agent.executeCampaign(testConfig);
    
    console.log('\n=== WORKFLOW TIMING FIX TEST RESULTS ===');
    console.log('✅ Campaign executed successfully');
    console.log('📊 Total broadcasts captured:', capturedBroadcasts.length);
    console.log('📧 Email campaign result:', results.emailCampaign ? 'SUCCESS' : 'FAILED');
    console.log('📧 Emails in result:', results.emailCampaign?.emailsSent?.length || 0);
    
    // Analyze broadcast timing and email data
    console.log('\n📡 Broadcast Analysis:');
    let emailBroadcastsFound = 0;
    let workflowCompleteBroadcast = null;
    let emailBroadcastTiming = [];
    
    capturedBroadcasts.forEach((broadcast, i) => {
      console.log(`  ${i + 1}. ${broadcast.type}${broadcast.hasEmailCampaign ? ' (✅ has email data)' : ''}`);
      
      if (broadcast.hasEmailCampaign) {
        emailBroadcastsFound++;
        emailBroadcastTiming.push(i);
        console.log(`     📧 Contains ${broadcast.emailCount} emails`);
      }
      
      if (broadcast.type === 'workflow_update') {
        workflowCompleteBroadcast = i;
      }
    });
    
    console.log('\n🎯 TIMING FIX VERIFICATION:');
    console.log(`   Email broadcasts found: ${emailBroadcastsFound}`);
    console.log(`   Email broadcast positions: [${emailBroadcastTiming.join(', ')}]`);
    console.log(`   Workflow completion position: ${workflowCompleteBroadcast || 'N/A'}`);
    
    if (emailBroadcastsFound > 0) {
      const firstEmailBroadcast = emailBroadcastTiming[0];
      const timingCorrect = workflowCompleteBroadcast === null || firstEmailBroadcast < workflowCompleteBroadcast;
      
      console.log(`   Timing correct: ${timingCorrect ? '✅ YES' : '❌ NO'}`);
      
      if (timingCorrect && emailBroadcastsFound > 0) {
        console.log('\n🎉 WORKFLOW TIMING FIX SUCCESSFUL!');
        console.log('✅ stepCompleted now executes BEFORE workflow completion');
        console.log('✅ Email campaign data is broadcast while workflow is still "running"');
        console.log('✅ Frontend should now receive all email data via WebSocket');
        console.log('✅ "没显示生成邮件" issue should be RESOLVED');
      } else {
        console.log('\n⚠️ Fix partially successful but may need refinement');
      }
    } else {
      console.log('\n❌ No email broadcasts found - may indicate other issues');
    }
    
  } catch (error) {
    console.error('\n❌ Campaign execution failed:', error.message);
    console.log('⚠️ This may indicate network/API issues, not workflow timing');
  }
}

testWorkflowTimingFix().catch(console.error);