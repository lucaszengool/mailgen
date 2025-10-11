console.log('🧪 测试修复后的WebSocket邮件数据广播');

const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testFixedEmailBroadcast() {
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // 模拟前端WebSocket客户端
  let capturedEmailData = null;
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      
      if (parsedData.type === 'email_campaign_update') {
        console.log('📧 捕获到 EMAIL_CAMPAIGN_UPDATE:');
        console.log('   emails数组长度:', parsedData.emails ? parsedData.emails.length : 0);
        console.log('   stats:', parsedData.stats);
        capturedEmailData = parsedData;
        
        if (parsedData.emails && parsedData.emails.length > 0) {
          console.log('   第一封邮件:', {
            to: parsedData.emails[0].to,
            subject: parsedData.emails[0].subject,
            sent: parsedData.emails[0].sent
          });
        }
      } else if (parsedData.type === 'data_update' && parsedData.data?.emailCampaign) {
        console.log('📧 捕获到 DATA_UPDATE 中的 emailCampaign:');
        console.log('   emails:', parsedData.data.emailCampaign.emails?.length || 0);
        console.log('   emailsSent:', parsedData.data.emailCampaign.emailsSent?.length || 0);
      }
    }
  };
  
  wsManager.clients.set('test-client', {
    ws: mockWsClient,
    subscriptions: new Set(['test-workflow']),
    lastActivity: Date.now()
  });
  
  // 创建一个运行中的工作流状态
  const workflowId = 'test-workflow-' + Date.now();
  wsManager.workflowStates.set(workflowId, {
    id: workflowId,
    status: 'running',
    data: {}
  });
  
  // 模拟邮件生成完成，调用stepCompleted
  const mockEmailResults = {
    emailsSent: [
      {
        to: 'prospect1@company.com',
        subject: 'Partnership Opportunity with FruitAI',
        sent: true,
        from: 'james@fruitai.org',
        body: 'Test email body',
        template_used: 'partnership_outreach'
      },
      {
        to: 'prospect2@company.com', 
        subject: 'Collaboration Proposal - Food Technology',
        sent: true,
        from: 'james@fruitai.org',
        body: 'Test email body 2',
        template_used: 'cold_outreach'
      }
    ],
    sent: 2,
    opened: 0,
    replied: 0,
    totalEmails: 2
  };
  
  console.log('🚀 调用 stepCompleted("email_campaign", emailResults)');
  wsManager.stepCompleted('email_campaign', mockEmailResults);
  
  console.log('\n=== 测试结果分析 ===');
  if (capturedEmailData && capturedEmailData.emails && capturedEmailData.emails.length > 0) {
    console.log('✅ SUCCESS: WebSocket正确广播了邮件数据!');
    console.log('✅ 前端应该能接收到', capturedEmailData.emails.length, '封邮件');
    console.log('✅ HunterStyleEmailCampaignManager的emails prop应该非空');
    console.log('\n🎯 修复验证:');
    console.log('   - emails数组:', capturedEmailData.emails.length, '个邮件');
    console.log('   - stats.sent:', capturedEmailData.stats.sent);
    console.log('   - 第一封邮件主题:', capturedEmailData.emails[0].subject);
  } else {
    console.log('❌ FAILED: WebSocket仍然没有广播邮件数据');
  }
}

testFixedEmailBroadcast().catch(console.error);