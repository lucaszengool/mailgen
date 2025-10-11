console.log('🧪 Testing Frontend WebSocket Connection to Real Backend Data');

const WebSocket = require('ws');

// Test WebSocket connection
const ws = new WebSocket('ws://localhost:3333/ws/workflow');

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully to ws://localhost:3333/ws/workflow');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 WebSocket message received:');
    console.log('   Type:', message.type);
    console.log('   Data keys:', Object.keys(message.data || {}));
    
    if (message.type === 'data_update' && message.data.prospects) {
      console.log('🎯 PROSPECTS DATA UPDATE:');
      console.log('   Prospects count:', message.data.prospects.length);
      console.log('   First prospect email:', message.data.prospects[0]?.email);
      console.log('   Has persona data:', !!message.data.prospects[0]?.persona);
    }
  } catch (error) {
    console.log('📨 Raw WebSocket message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('🔌 WebSocket connection closed');
});

// Test the workflow results API directly
setTimeout(async () => {
  try {
    const response = await fetch('http://localhost:3333/api/workflow/results');
    if (response.ok) {
      const data = await response.json();
      console.log('');
      console.log('🔍 Direct API Test - /api/workflow/results:');
      console.log('   Success:', data.success);
      console.log('   Has prospects:', !!data.data?.prospects);
      console.log('   Prospects count:', data.data?.prospects?.length || 0);
      
      if (data.data?.prospects?.length > 0) {
        console.log('   Sample prospect:', {
          email: data.data.prospects[0].email,
          name: data.data.prospects[0].name,
          company: data.data.prospects[0].company,
          hasPersona: !!data.data.prospects[0].persona
        });
      }
    } else {
      console.log('❌ API request failed:', response.status);
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}, 2000);

// Keep testing for 30 seconds
setTimeout(() => {
  console.log('');
  console.log('🎯 WebSocket Connection Test Summary:');
  console.log('If you saw prospect data above, WebSocket is working');
  console.log('If not, the issue is in frontend React component data handling');
  ws.close();
  process.exit(0);
}, 30000);