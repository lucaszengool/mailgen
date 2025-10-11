console.log('🧪 测试WebSocket邮件数据接收详细日志');

const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

// 创建WebSocket管理器并模拟邮件数据广播
const wsManager = new WorkflowWebSocketManager(mockServer);

// 模拟前端WebSocket客户端 - 记录所有接收到的数据
const mockWsClient = {
  readyState: 1,
  send: (data) => {
    const parsedData = JSON.parse(data);
    console.log('📡 WebSocket广播类型:', parsedData.type);
    
    if (parsedData.type === 'email_campaign_update') {
      console.log('📧 EMAIL_CAMPAIGN_UPDATE 事件详细信息:');
      console.log('   emails数组:', parsedData.emails ? parsedData.emails.length : 0, '个邮件');
      console.log('   stats对象:', parsedData.stats);
      
      if (parsedData.emails && parsedData.emails.length > 0) {
        console.log('   第一封邮件详情:');
        const firstEmail = parsedData.emails[0];
        console.log('     to:', firstEmail.to);
        console.log('     subject:', firstEmail.subject);
        console.log('     sent:', firstEmail.sent);
        console.log('     所有字段:', Object.keys(firstEmail));
      }
    } else if (parsedData.type === 'data_update' && parsedData.data && parsedData.data.emailCampaign) {
      console.log('📧 DATA_UPDATE 中的 emailCampaign 详细信息:');
      console.log('   emailsSent:', parsedData.data.emailCampaign.emailsSent ? parsedData.data.emailCampaign.emailsSent.length : 0);
      console.log('   所有emailCampaign字段:', Object.keys(parsedData.data.emailCampaign));
      
      if (parsedData.data.emailCampaign.emailsSent && parsedData.data.emailCampaign.emailsSent.length > 0) {
        console.log('   第一封emailsSent详情:');
        const firstEmail = parsedData.data.emailCampaign.emailsSent[0];
        console.log('     to:', firstEmail.to);
        console.log('     subject:', firstEmail.subject);
        console.log('     sent:', firstEmail.sent);
        console.log('     所有字段:', Object.keys(firstEmail));
      }
    } else if (parsedData.type === 'email_list') {
      console.log('📧 EMAIL_LIST 事件详细信息:');
      console.log('   emails数组:', parsedData.emails ? parsedData.emails.length : 0, '个邮件');
    } else {
      console.log('   其他数据类型，跳过详细分析');
    }
  }
};

wsManager.clients.set('test-client', {
  ws: mockWsClient,
  subscriptions: new Set(['test-workflow']),
  lastActivity: Date.now()
});

// 模拟不同类型的邮件数据广播
console.log('\n1. 测试 email_campaign_update 广播:');
const mockEmails = [
  {
    to: 'test1@example.com',
    subject: 'Partnership Opportunity with FruitAI',
    sent: true,
    opened: false,
    replied: false,
    template_used: 'partnership_outreach',
    from: 'james@fruitai.org'
  },
  {
    to: 'test2@example.com', 
    subject: 'Collaboration Proposal - FruitAI',
    sent: true,
    opened: false,
    replied: false,
    template_used: 'cold_outreach',
    from: 'james@fruitai.org'
  }
];

const mockStats = {
  sent: 2,
  opened: 0,
  replied: 0,
  totalEmails: 2
};

wsManager.broadcast({
  type: 'email_campaign_update',
  emails: mockEmails,
  stats: mockStats,
  campaignId: 'test-campaign'
});

console.log('\n2. 测试 data_update 中的 emailCampaign 广播:');
wsManager.stepCompleted('email_campaign', {
  emailsSent: mockEmails,
  sent: 2,
  opened: 0,
  replied: 0,
  totalEmails: 2,
  executed: true
});

console.log('\n✅ WebSocket邮件数据广播测试完成');
console.log('\n🎯 预期结果:');
console.log('- 前端应该接收到这两种类型的WebSocket事件');
console.log('- SimpleWorkflowDashboard应该更新emailCampaignStats.emails数组');
console.log('- HunterStyleEmailCampaignManager应该接收到非空的emails prop');
console.log('\n⚠️  如果前端仍然不显示邮件，请检查:');
console.log('1. 浏览器开发者工具 -> Network -> WS 查看WebSocket消息');
console.log('2. 浏览器控制台查看上述类型的日志消息');
console.log('3. React DevTools查看HunterStyleEmailCampaignManager的emails prop是否非空');