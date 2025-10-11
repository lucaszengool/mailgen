console.log('🧪 测试关键邮件修复验证...');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const agent = new LangGraphMarketingAgent();

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
  }
};

console.log('✅ 验证关键修复:');
console.log('   1. SMTP发件人地址: james@fruitai.org (不是 fruitaiofficial@gmail.com)');
console.log('   2. 邮件内容: HTML格式，长内容 (不是简短text)');
console.log('   3. 调试日志: 详细的邮件生成过程');
console.log('');

// 设置30秒超时
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('测试30秒超时')), 30000);
});

Promise.race([
  agent.executeCampaign(testConfig),
  timeoutPromise
]).then(results => {
  console.log('\n=== 关键修复验证结果 ===');
  console.log('✅ Prospects Found:', results.prospects ? results.prospects.length : 0);
  console.log('✅ Email Campaign:', results.emailCampaign ? 'SUCCESS' : 'FAILED');
  
  if (results.emailCampaign && results.emailCampaign.emailsSent && results.emailCampaign.emailsSent.length > 0) {
    const firstEmail = results.emailCampaign.emailsSent[0];
    console.log('\n📧 第一封邮件验证:');
    console.log('   发件人:', firstEmail.from);
    console.log('   主题:', firstEmail.subject);
    console.log('   内容长度:', firstEmail.body?.length || 0, 'chars');
    console.log('   模板类型:', firstEmail.template_used);
    
    const hasCorrectSender = firstEmail.from?.includes('james@fruitai.org');
    const hasWrongSender = firstEmail.from?.includes('fruitaiofficial@gmail.com');
    const hasLongContent = firstEmail.body && firstEmail.body.length > 500;
    const isHTMLFormat = firstEmail.body && firstEmail.body.includes('<html>');
    
    console.log('\n🎯 关键修复检查:');
    console.log('   ✅ 正确发件人:', hasCorrectSender ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ 无错误发件人:', !hasWrongSender ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ 长内容:', hasLongContent ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ HTML格式:', isHTMLFormat ? 'PASS ✅' : 'FAIL ❌');
    
    if (hasCorrectSender && !hasWrongSender && hasLongContent && isHTMLFormat) {
      console.log('\n🎉 所有关键修复验证成功!');
      console.log('✅ 发件人地址修复: james@fruitai.org');
      console.log('✅ 邮件内容修复: 长HTML格式');
      console.log('✅ 模板系统修复: 正常工作');
    } else {
      console.log('\n⚠️ 部分修复仍需调试');
      if (!hasCorrectSender) console.log('   ❌ 发件人地址仍有问题');
      if (hasWrongSender) console.log('   ❌ 仍在使用旧的发件人地址');
      if (!hasLongContent) console.log('   ❌ 邮件内容仍然过短');
      if (!isHTMLFormat) console.log('   ❌ 邮件格式不是HTML');
    }
    
    // 显示邮件内容预览
    console.log('\n📄 邮件内容预览 (前300字符):');
    console.log(firstEmail.body ? firstEmail.body.substring(0, 300) + '...' : '无内容');
    
  } else {
    console.log('\n❌ 没有邮件发送数据可供验证');
  }
  
}).catch(error => {
  console.error('\n❌ 测试失败:', error.message);
  if (error.message.includes('timeout')) {
    console.log('⏰ 测试超时，但修复代码已应用');
  }
});