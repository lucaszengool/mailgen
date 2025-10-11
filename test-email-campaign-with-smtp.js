console.log('🧪 测试包含SMTP配置的完整邮件campaign生成');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testEmailCampaignWithSmtp() {
  console.log('🔗 设置WebSocket管理器...');
  const wsManager = new WorkflowWebSocketManager(mockServer);
  
  // 模拟前端WebSocket客户端来捕获邮件数据
  let capturedEmailData = null;
  let capturedProspects = null;
  
  const mockWsClient = {
    readyState: 1,
    send: (data) => {
      const parsedData = JSON.parse(data);
      
      // 捕获prospects数据
      if (parsedData.type === 'data_update' && parsedData.data && parsedData.data.prospects) {
        console.log('👥 捕获到 prospects 数据!');
        console.log('   Prospects数量:', parsedData.data.prospects.length);
        capturedProspects = parsedData.data.prospects;
      }
      
      // 捕获邮件campaign数据
      if (parsedData.type === 'email_campaign_update') {
        console.log('📧 捕获到 email_campaign_update 事件!');
        console.log('   邮件数组:', parsedData.emails ? parsedData.emails.length : 0, '个邮件');
        console.log('   统计数据:', parsedData.stats);
        capturedEmailData = parsedData;
      } else if (parsedData.type === 'data_update' && parsedData.data && parsedData.data.emailCampaign) {
        console.log('📧 捕获到 data_update 中的 emailCampaign!');
        console.log('   emailsSent:', parsedData.data.emailCampaign.emailsSent ? parsedData.data.emailCampaign.emailsSent.length : 0);
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
  
  // 包含SMTP配置的测试配置
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'sales',
    businessType: 'technology',
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      senderName: 'James Wilson',
      auth: {
        user: 'james@fruitai.org',
        pass: 'test123'
      }
    },
    templateData: {
      senderName: 'James Wilson',
      senderEmail: 'james@fruitai.org',
      companyWebsite: 'https://fruitai.org',
      companyName: 'FruitAI'
    }
  };
  
  console.log('🚀 执行包含SMTP配置的campaign...');
  console.log('   SMTP Host:', testConfig.smtpConfig.host);
  console.log('   Sender:', testConfig.smtpConfig.senderName);
  console.log('   Email:', testConfig.smtpConfig.auth.user);
  
  try {
    const results = await agent.executeCampaign(testConfig);
    
    console.log('\n=== 最终结果分析 ===');
    console.log('Campaign ID:', results.campaignId);
    console.log('Prospects Found:', results.prospects ? results.prospects.length : 0);
    console.log('Email Campaign Present:', results.emailCampaign ? 'YES' : 'NO');
    console.log('EmailsSent Count:', results.emailCampaign && results.emailCampaign.emailsSent ? results.emailCampaign.emailsSent.length : 0);
    
    console.log('\n=== WebSocket数据捕获结果 ===');
    console.log('Captured Prospects:', capturedProspects ? capturedProspects.length : 0);
    console.log('Captured Email Data:', capturedEmailData ? 'YES' : 'NO');
    
    if (capturedEmailData && capturedEmailData.emails && capturedEmailData.emails.length > 0) {
      console.log('\n📧 捕获的邮件样本:');
      const firstEmail = capturedEmailData.emails[0];
      console.log('  收件人:', firstEmail.to);
      console.log('  主题:', firstEmail.subject ? firstEmail.subject.substring(0, 50) + '...' : 'No subject');
      console.log('  发送状态:', firstEmail.sent);
      console.log('  邮件字段:', Object.keys(firstEmail));
    }
    
    console.log('\n🎯 前端显示问题诊断:');
    const hasProspects = capturedProspects && capturedProspects.length > 0;
    const hasEmails = capturedEmailData && capturedEmailData.emails && capturedEmailData.emails.length > 0;
    
    if (hasProspects && hasEmails) {
      console.log('✅ 完美！后端生成了prospects和emails，WebSocket也正确广播了');
      console.log('✅ 前端应该能够在Email Campaign页面看到邮件');
      console.log('');
      console.log('🔧 如果前端仍然不显示邮件，请检查:');
      console.log('1. 浏览器控制台 - 确认收到WebSocket消息');
      console.log('2. SimpleWorkflowDashboard.jsx:250行 - emailCampaignStats是否正确更新');
      console.log('3. HunterStyleEmailCampaignManager的emails prop是否非空');
    } else if (hasProspects && !hasEmails) {
      console.log('⚠️  有prospects但没有邮件 - 邮件生成可能还有问题');
      console.log('   可能原因: SMTP配置验证失败或邮件生成过程出错');
    } else if (!hasProspects) {
      console.log('❌ 没有找到prospects - prospect搜索阶段失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    // 显示部分堆栈以便调试
    console.error('Stack:', error.stack ? error.stack.substring(0, 500) : 'No stack available');
  }
}

// 设置合理的超时
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('测试超时 - 120秒')), 120000);
});

Promise.race([testEmailCampaignWithSmtp(), timeoutPromise])
  .then(() => {
    console.log('\n✅ 测试完成');
  })
  .catch((error) => {
    console.error('\n❌ 测试失败或超时:', error.message);
  });