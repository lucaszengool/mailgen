console.log('🔍 Debug Workflow State Issue...');

const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Create mock server for WebSocket manager
const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function debugWorkflowState() {
  console.log('🔗 Setting up WebSocket manager...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // Mock test emails
  const testEmails = [
    {
      to: 'test1@example.com',
      subject: 'Partnership Opportunity',
      body: '<html><body>Test email</body></html>',
      sent: true,
      template_used: 'partnership_outreach'
    }
  ];
  
  // Mock WebSocket client
  const capturedBroadcasts = [];
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      capturedBroadcasts.push(parsedData);
      console.log('📡 Broadcast:', parsedData.type);
    }
  };
  
  wsManager.clients.set('debug-client', {
    ws: mockWsClient,
    subscriptions: new Set(),
    lastActivity: Date.now()
  });
  
  console.log('\n🧪 Current workflow states:', wsManager.workflowStates.size);
  
  // Create a workflow state first (like a real campaign would)
  console.log('\n🔧 Creating workflow state...');
  const workflowId = `workflow_${Date.now()}`;
  wsManager.workflowStates.set(workflowId, {
    id: workflowId,
    status: 'running',
    startTime: new Date().toISOString(),
    data: {}
  });
  
  console.log('📊 Workflow created:', workflowId);
  console.log('📊 Total workflows:', wsManager.workflowStates.size);
  
  // Now test stepCompleted with a running workflow
  console.log('\n🧪 Testing stepCompleted with running workflow...');
  wsManager.stepCompleted('email_campaign', {
    emails: testEmails,
    emailsSent: testEmails,
    sent: 1,
    opened: 0,
    replied: 0
  });
  
  console.log('\n=== RESULTS ===');
  console.log('Broadcasts captured:', capturedBroadcasts.length);
  
  capturedBroadcasts.forEach((broadcast, i) => {
    console.log(`\nBroadcast ${i + 1}:`, broadcast.type);
    if (broadcast.type === 'data_update' && broadcast.data?.emailCampaign) {
      console.log('  ✅ Email campaign data found!');
      console.log('  📧 Emails:', broadcast.data.emailCampaign.emails?.length || 0);
      console.log('  📤 EmailsSent:', broadcast.data.emailCampaign.emailsSent?.length || 0);
    } else if (broadcast.type === 'email_campaign_update') {
      console.log('  ✅ Email campaign update found!');
      console.log('  📧 Emails:', broadcast.emails?.length || 0);
    }
  });
}

debugWorkflowState().catch(console.error);