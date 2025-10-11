// Test script for email campaign workflow
// This tests:
// 1. Email preview generation and WebSocket updates
// 2. Email display without compression
// 3. Professional Email Editor updates

const WebSocket = require('ws');

console.log('🧪 Starting Email Campaign Workflow Test...\n');

// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3333/ws/workflow');

ws.on('open', () => {
  console.log('✅ WebSocket connected');
  console.log('📧 Monitoring for email events...\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    // Log specific email-related events
    if (message.type === 'email_preview_generated') {
      console.log('🎉 EMAIL PREVIEW GENERATED!');
      console.log('   Prospect:', message.data?.prospectId);
      console.log('   Subject:', message.data?.preview?.structure?.subject);
      console.log('   Has Editor Preview:', !!message.data?.preview);
      console.log('   Has Editable HTML:', !!message.data?.preview?.editableHtml);
      console.log('');
    } else if (message.type === 'data_update' && message.data?.emailCampaign) {
      console.log('📧 Email Campaign Update:');
      console.log('   Emails:', message.data.emailCampaign.emails?.length || 0);
      console.log('   Sent:', message.data.emailCampaign.sent || 0);
      console.log('');
    } else if (message.type === 'log_update' && message.stepId === 'email_generation') {
      console.log('📝 Email Generation Log:', message.message);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('🔌 WebSocket disconnected');
});

// Keep the script running
console.log('Press Ctrl+C to exit\n');
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing test...');
  ws.close();
  process.exit(0);
});