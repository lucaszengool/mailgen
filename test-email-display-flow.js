console.log('🧪 测试完整的邮件数据流 - 从后端生成到前端显示');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testCompleteEmailDataFlow() {
  console.log('🔗 设置WebSocket管理器...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // 模拟前端WebSocket客户端
  let capturedEmailData = null;
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      
      // 捕获所有与邮件相关的广播
      if (parsedData.type === 'email_campaign_update') {
        console.log('📧 捕获到 email_campaign_update 事件!');
        console.log('   邮件数组:', parsedData.emails ? parsedData.emails.length : 0, '个邮件');
        console.log('   统计数据:', parsedData.stats);
        capturedEmailData = parsedData;
      } else if (parsedData.type === 'data_update' && parsedData.data && parsedData.data.emailCampaign) {
        console.log('📧 捕获到 data_update 中的 emailCampaign!');
        console.log('   emailsSent:', parsedData.data.emailCampaign.emailsSent ? parsedData.data.emailCampaign.emailsSent.length : 0);
        console.log('   数据结构:', Object.keys(parsedData.data.emailCampaign));
        if (!capturedEmailData) {
          capturedEmailData = {
            emails: parsedData.data.emailCampaign.emailsSent || [],
            stats: parsedData.data.emailCampaign
          };
        }
      }
    }
  };
  
  wsManager.clients.set('test-client', {
    ws: mockWsClient,
    subscriptions: new Set(['test-workflow']),
    lastActivity: Date.now()
  });
  
  console.log('🤖 设置LangGraph代理...');
  const agent = new LangGraphMarketingAgent();
  agent.setWebSocketManager(wsManager);
  
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'sales',
    businessType: 'technology'
  };
  
  console.log('🚀 执行完整campaign...');
  
  try {
    const results = await agent.executeCampaign(testConfig);
    
    console.log('\n=== 后端结果 ===');
    console.log('Campaign ID:', results.campaignId);
    console.log('Prospects:', results.prospects ? results.prospects.length : 0);
    console.log('Email Campaign Present:', results.emailCampaign ? 'YES' : 'NO');
    console.log('EmailsSent in Results:', results.emailCampaign && results.emailCampaign.emailsSent ? results.emailCampaign.emailsSent.length : 0);
    
    console.log('\n=== WebSocket广播结果 ===');
    console.log('捕获到邮件数据:', capturedEmailData ? 'YES' : 'NO');
    if (capturedEmailData) {
      console.log('邮件数组长度:', capturedEmailData.emails ? capturedEmailData.emails.length : 0);
      console.log('统计数据:', capturedEmailData.stats);
      
      if (capturedEmailData.emails && capturedEmailData.emails.length > 0) {
        const firstEmail = capturedEmailData.emails[0];
        console.log('\n📧 第一封邮件样本:');
        console.log('  收件人:', firstEmail.to);
        console.log('  主题:', firstEmail.subject ? firstEmail.subject.substring(0, 50) : 'No subject');
        console.log('  发送状态:', firstEmail.sent);
        console.log('  所有字段:', Object.keys(firstEmail));
      }
    }
    
    console.log('\n🎯 数据流诊断结论:');
    const backendHasEmails = results.emailCampaign && results.emailCampaign.emailsSent && results.emailCampaign.emailsSent.length > 0;
    const websocketHasEmails = capturedEmailData && capturedEmailData.emails && capturedEmailData.emails.length > 0;
    
    if (backendHasEmails && websocketHasEmails) {
      console.log('✅ 完整数据流正常: 后端生成 → WebSocket广播 → 前端应该能接收');
      console.log('⚠️  如果前端仍然不显示，问题在前端组件或状态更新');
      console.log('\n🔧 前端调试建议:');
      console.log('1. 检查浏览器控制台是否有WebSocket消息日志');
      console.log('2. 确认 emailCampaignStats.emails 数组是否被正确更新');
      console.log('3. 验证 HunterStyleEmailCampaignManager 是否接收到非空 emails 数组');
    } else if (backendHasEmails && !websocketHasEmails) {
      console.log('❌ WebSocket广播有问题: 后端生成了邮件但未正确广播');
    } else if (!backendHasEmails) {
      console.log('❌ 后端邮件生成有问题: 没有生成邮件数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testCompleteEmailDataFlow().catch(console.error);