console.log('🧪 Testing WebSocket Connection...');

const WebSocket = require('ws');

// Test WebSocket connection
console.log('🔌 Connecting to WebSocket server...');

const ws = new WebSocket('ws://localhost:3333/ws/workflow');

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  
  // Mock the prospects data that would be sent from server
  const mockProspectData = {
    type: 'data_update',
    data: {
      prospects: [
        {
          email: 'test1@example.com',
          name: 'John Doe',
          company: 'TechCorp',
          confidence: 85
        },
        {
          email: 'test2@example.com', 
          name: 'Jane Smith',
          company: 'InnovateAI',
          confidence: 90
        }
      ],
      totalProspects: 2
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Sending mock prospect data...');
  console.log(JSON.stringify(mockProspectData, null, 2));
  
  // Close after test
  setTimeout(() => {
    ws.close();
    console.log('🔌 WebSocket connection closed');
    process.exit(0);
  }, 2000);
});

ws.on('message', (data) => {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 WebSocket connection closed');
});