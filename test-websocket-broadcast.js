console.log('📡 Testing WebSocket Email Broadcasting Logic...');

const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Create mock server for WebSocket manager
const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testWebSocketBroadcast() {
  console.log('🔗 Setting up WebSocket manager...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // Mock multiple emails to simulate campaign results
  const testEmails = [
    {
      to: 'test1@example.com',
      subject: 'Partnership Opportunity with FruitAI - Enhance Your Food Technology',
      body: '<html><body>Dear Test User 1...</body></html>',
      sent: true,
      template_used: 'partnership_outreach'
    },
    {
      to: 'test2@example.com', 
      subject: 'Collaboration Proposal - AI Fruit Analysis Solutions',
      body: '<html><body>Dear Test User 2...</body></html>',
      sent: true,
      template_used: 'cold_outreach'
    },
    {
      to: 'test3@example.com',
      subject: 'Strategic Alliance - Revolutionary Food Technology',
      body: '<html><body>Dear Test User 3...</body></html>',
      sent: true,
      template_used: 'value_demonstration'
    }
  ];
  
  // Mock WebSocket client to capture broadcasts
  const capturedBroadcasts = [];
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      capturedBroadcasts.push(parsedData);
      console.log('📧 WebSocket Broadcast:', parsedData.type, 
        parsedData.data?.emailCampaign?.emailsSent?.length || 0, 'emails');
    }
  };
  
  wsManager.clients.set('test-client', {
    ws: mockWsClient,
    subscriptions: new Set(),
    lastActivity: Date.now()
  });
  
  console.log('\n🧪 Testing email campaign data broadcast...');
  
  // Test 1: Simulate email campaign completion with multiple emails
  console.log('\n📊 Test 1: Broadcasting email campaign with 3 emails...');
  wsManager.stepCompleted('email_campaign', {
    emailCampaign: {
      emails: testEmails,
      emailsSent: testEmails,
      sent: 3,
      opened: 0,
      replied: 0
    }
  });
  
  // Test 2: Check individual email broadcasts
  console.log('\n📧 Test 2: Broadcasting individual email events...');
  testEmails.forEach((email, i) => {
    wsManager.broadcast('email_sent', email);
    console.log(`   Broadcasted email ${i + 1}: ${email.to}`);
  });
  
  // Analyze captured broadcasts
  console.log('\n=== WEBSOCKET BROADCAST ANALYSIS ===');
  console.log('Total broadcasts captured:', capturedBroadcasts.length);
  
  const emailCampaignBroadcasts = capturedBroadcasts.filter(b => 
    b.type === 'data_update' && b.data?.emailCampaign
  );
  const individualEmailBroadcasts = capturedBroadcasts.filter(b => 
    b.type === 'email_sent'
  );
  
  console.log('\n📊 Email Campaign Broadcasts:', emailCampaignBroadcasts.length);
  emailCampaignBroadcasts.forEach((broadcast, i) => {
    const emailCount = broadcast.data.emailCampaign?.emailsSent?.length || 0;
    console.log(`   Campaign broadcast ${i + 1}: ${emailCount} emails`);
    if (broadcast.data.emailCampaign?.emailsSent) {
      broadcast.data.emailCampaign.emailsSent.forEach((email, j) => {
        console.log(`     Email ${j + 1}: ${email.to} - ${email.subject?.substring(0, 40)}...`);
      });
    }
  });
  
  console.log('\n📧 Individual Email Broadcasts:', individualEmailBroadcasts.length);
  individualEmailBroadcasts.forEach((broadcast, i) => {
    console.log(`   Individual broadcast ${i + 1}: ${broadcast.data?.to}`);
  });
  
  console.log('\n🎯 FRONTEND DISPLAY DIAGNOSIS:');
  
  if (emailCampaignBroadcasts.length > 0) {
    const campaignBroadcast = emailCampaignBroadcasts[0];
    const emailsInBroadcast = campaignBroadcast.data.emailCampaign?.emailsSent?.length || 0;
    
    if (emailsInBroadcast === testEmails.length) {
      console.log('✅ WEBSOCKET IS CORRECTLY BROADCASTING ALL EMAILS');
      console.log('   The issue is likely in the frontend React state management');
      console.log('   Check: SimpleWorkflowDashboard.jsx email state updates');
      console.log('   Check: HunterStyleEmailCampaignManager.jsx email filtering');
    } else {
      console.log('❌ WEBSOCKET IS NOT BROADCASTING ALL EMAILS');
      console.log(`   Expected: ${testEmails.length} emails`);
      console.log(`   Broadcasted: ${emailsInBroadcast} emails`);
      console.log('   Fix needed: WebSocket broadcast logic');
    }
  } else {
    console.log('❌ NO EMAIL CAMPAIGN BROADCASTS CAPTURED');
    console.log('   Issue: stepCompleted method not broadcasting email campaign data');
  }
  
  if (individualEmailBroadcasts.length === testEmails.length) {
    console.log('✅ Individual email broadcasts working correctly');
  } else {
    console.log('⚠️ Individual email broadcasts may have issues');
  }
}

testWebSocketBroadcast().catch(console.error);