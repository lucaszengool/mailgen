console.log('🔍 Debug WebSocket Broadcasts - Show All Captured Data...');

const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Create mock server for WebSocket manager
const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function debugWebSocketBroadcasts() {
  console.log('🔗 Setting up WebSocket manager...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // Mock test emails to simulate campaign results
  const testEmails = [
    {
      to: 'test1@example.com',
      subject: 'Partnership Opportunity with FruitAI',
      body: '<html><body>Dear Test User 1...</body></html>',
      sent: true,
      template_used: 'partnership_outreach'
    },
    {
      to: 'test2@example.com', 
      subject: 'Collaboration Proposal',
      body: '<html><body>Dear Test User 2...</body></html>',
      sent: true,
      template_used: 'cold_outreach'
    }
  ];
  
  // Mock WebSocket client to capture ALL broadcasts with full details
  const capturedBroadcasts = [];
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      try {
        const parsedData = JSON.parse(data);
        capturedBroadcasts.push(parsedData);
        console.log('\n📡 CAPTURED BROADCAST:');
        console.log('   Type:', parsedData.type);
        console.log('   Keys:', Object.keys(parsedData));
        
        // Show relevant data structure
        if (parsedData.data) {
          console.log('   Data keys:', Object.keys(parsedData.data));
          if (parsedData.data.emailCampaign) {
            console.log('   EmailCampaign keys:', Object.keys(parsedData.data.emailCampaign));
            console.log('   Emails count:', parsedData.data.emailCampaign.emails?.length || 0);
            console.log('   EmailsSent count:', parsedData.data.emailCampaign.emailsSent?.length || 0);
          }
        }
        
        if (parsedData.emails) {
          console.log('   Direct emails count:', parsedData.emails.length);
        }
        
      } catch (err) {
        console.log('📡 Broadcast parse error:', err.message);
      }
    }
  };
  
  wsManager.clients.set('debug-client', {
    ws: mockWsClient,
    subscriptions: new Set(),
    lastActivity: Date.now()
  });
  
  console.log('\n🧪 Testing stepCompleted with email_campaign...');
  
  // Test the stepCompleted method with email campaign data
  wsManager.stepCompleted('email_campaign', {
    emailCampaign: {
      emails: testEmails,
      emailsSent: testEmails,
      sent: 2,
      opened: 0,
      replied: 0
    }
  });
  
  console.log('\n🧪 Testing stepCompleted with different result structure...');
  
  // Test with different structure
  wsManager.stepCompleted('email_campaign', {
    emails: testEmails,
    emailsSent: testEmails,
    totalEmails: 2,
    sent: 2,
    opened: 0,
    replied: 0
  });
  
  console.log('\n=== DEBUGGING RESULTS ===');
  console.log('Total broadcasts captured:', capturedBroadcasts.length);
  
  console.log('\n📊 Broadcast Types:');
  const broadcastTypes = {};
  capturedBroadcasts.forEach(b => {
    if (!broadcastTypes[b.type]) broadcastTypes[b.type] = 0;
    broadcastTypes[b.type]++;
  });
  
  Object.entries(broadcastTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} broadcasts`);
  });
  
  console.log('\n📧 Email-related broadcasts:');
  capturedBroadcasts.forEach((broadcast, i) => {
    if (broadcast.type === 'data_update' || broadcast.type === 'email_campaign_update' || broadcast.type.includes('email')) {
      console.log(`\n   Broadcast ${i + 1} (${broadcast.type}):`);
      console.log('     Full structure:', JSON.stringify(broadcast, null, 2));
    }
  });
}

debugWebSocketBroadcasts().catch(console.error);