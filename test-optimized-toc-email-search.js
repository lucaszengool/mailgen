const ProspectSearchAgent = require('./server/agents/ProspectSearchAgent');
const RealEmailFinder = require('./server/agents/RealEmailFinder');

async function testOptimizedToCEmailSearch() {
  console.log('🧪 测试优化后的ToC邮箱搜索策略\n');
  
  // 测试邮箱样本
  const testEmails = [
    // 个人邮箱 - 应该优先级最高
    'john.doe@gmail.com',
    'sarah.smith@outlook.com', 
    'mike.jones@yahoo.com',
    'lisa.wang@qq.com',
    'alex123@hotmail.com',
    
    // 消费者友好的商业邮箱 - 应该接受
    'hello@petcare.com',
    'support@fruitai.org',
    'contact@techstartup.io',
    'customer@service.com',
    'help@website.net',
    
    // B2B邮箱 - ToC模式下应该被拒绝
    'sales@company.com',
    'business@enterprise.net', 
    'ceo@bigcorp.com',
    'procurement@supplier.com',
    
    // 垃圾邮件 - 应该被完全排除
    'noreply@automated.com',
    'no-reply@system.org',
    'donotreply@notification.com'
  ];
  
  console.log('📋 测试邮箱列表:');
  testEmails.forEach((email, index) => {
    console.log(`  ${index + 1}. ${email}`);
  });
  
  // 初始化代理
  const prospectAgent = new ProspectSearchAgent();
  const emailFinder = new RealEmailFinder();
  
  console.log('\n🔍 测试 ProspectSearchAgent 邮箱过滤 (ToC模式):');
  
  // 测试过滤功能 - 将邮箱转换为文本后提取
  const emailText = testEmails.join(' ');
  const filteredEmails = prospectAgent.extractEmails(emailText, 'toc');
  console.log(`✅ 过滤后接受的邮箱 (${filteredEmails.length}/${testEmails.length}):`);
  filteredEmails.forEach((email, index) => {
    const priority = prospectAgent.getEmailPriority(email, 'toc');
    console.log(`  ${index + 1}. ${email} (优先级: ${priority})`);
  });
  
  console.log('\n📊 邮箱分类统计:');
  
  // 统计个人邮箱
  const personalEmails = filteredEmails.filter(email => 
    ['@gmail.com', '@outlook.com', '@yahoo.com', '@qq.com', '@hotmail.com'].some(domain => 
      email.includes(domain)
    )
  );
  
  // 统计消费者友好邮箱
  const consumerFriendlyEmails = filteredEmails.filter(email => 
    ['hello@', 'support@', 'contact@', 'customer@', 'help@'].some(prefix => 
      email.startsWith(prefix)
    )
  );
  
  // 检查是否有B2B邮箱被误接受
  const b2bEmails = filteredEmails.filter(email => 
    ['sales@', 'business@', 'ceo@', 'procurement@'].some(prefix => 
      email.startsWith(prefix)
    )
  );
  
  // 检查是否有垃圾邮件被误接受
  const spamEmails = filteredEmails.filter(email => 
    ['noreply@', 'no-reply@', 'donotreply@'].some(prefix => 
      email.startsWith(prefix)
    )
  );
  
  console.log(`   个人邮箱: ${personalEmails.length} 个`);
  console.log(`   消费者友好邮箱: ${consumerFriendlyEmails.length} 个`);
  console.log(`   误接受的B2B邮箱: ${b2bEmails.length} 个 ${b2bEmails.length === 0 ? '✅' : '❌'}`);
  console.log(`   误接受的垃圾邮件: ${spamEmails.length} 个 ${spamEmails.length === 0 ? '✅' : '❌'}`);
  
  console.log('\n🔍 测试 RealEmailFinder ToC适合性检查:');
  
  const toCResults = [];
  testEmails.forEach(email => {
    const isSuitable = emailFinder.isToCSuitableEmail(email);
    const priority = emailFinder.getToCPriority(email);
    toCResults.push({ email, isSuitable, priority });
  });
  
  // 只显示适合的邮箱
  const suitableEmails = toCResults.filter(result => result.isSuitable);
  console.log(`✅ 适合ToC营销的邮箱 (${suitableEmails.length}/${testEmails.length}):`);
  
  // 按优先级排序
  suitableEmails.sort((a, b) => b.priority - a.priority);
  suitableEmails.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.email} (优先级: ${result.priority})`);
  });
  
  console.log('\n📈 ToC邮箱搜索优化效果验证:');
  
  // 验证优化效果
  const validationResults = {
    personalEmailsAccepted: personalEmails.length >= 4, // 至少4个个人邮箱被接受
    consumerEmailsAccepted: consumerFriendlyEmails.length >= 3, // 至少3个消费者友好邮箱被接受
    b2bEmailsRejected: b2bEmails.length === 0, // 所有B2B邮箱都被拒绝
    spamEmailsRejected: spamEmails.length === 0, // 所有垃圾邮件都被拒绝
    priorityOrderCorrect: checkPriorityOrder(filteredEmails, prospectAgent)
  };
  
  console.log(`   ✅ 个人邮箱优先接受: ${validationResults.personalEmailsAccepted ? '通过' : '失败'}`);
  console.log(`   ✅ 消费者友好邮箱接受: ${validationResults.consumerEmailsAccepted ? '通过' : '失败'}`);
  console.log(`   ✅ B2B邮箱正确拒绝: ${validationResults.b2bEmailsRejected ? '通过' : '失败'}`);
  console.log(`   ✅ 垃圾邮件正确拒绝: ${validationResults.spamEmailsRejected ? '通过' : '失败'}`);
  console.log(`   ✅ 优先级排序正确: ${validationResults.priorityOrderCorrect ? '通过' : '失败'}`);
  
  const overallSuccess = Object.values(validationResults).every(result => result === true);
  
  console.log(`\n🎯 整体测试结果: ${overallSuccess ? '✅ 通过' : '❌ 失败'}`);
  
  if (overallSuccess) {
    console.log('\n🚀 ToC邮箱搜索策略优化成功！');
    console.log('   - 能够准确识别和优先排序个人邮箱');
    console.log('   - 正确接受消费者友好的商业邮箱');
    console.log('   - 有效过滤B2B和垃圾邮件');
    console.log('   - 优先级排序符合ToC营销需求');
  } else {
    console.log('\n⚠️ 需要进一步优化邮箱搜索策略');
  }
  
  return overallSuccess;
}

function checkPriorityOrder(emails, agent) {
  // 检查个人邮箱是否比商业邮箱优先级更高
  const gmailEmail = emails.find(email => email.includes('@gmail.com'));
  const contactEmail = emails.find(email => email.startsWith('contact@'));
  
  if (gmailEmail && contactEmail) {
    const gmailPriority = agent.getEmailPriority(gmailEmail, 'toc');
    const contactPriority = agent.getEmailPriority(contactEmail, 'toc');
    return gmailPriority > contactPriority;
  }
  
  return true; // 如果没有找到对比邮箱，默认通过
}

// 运行测试
if (require.main === module) {
  testOptimizedToCEmailSearch().catch(console.error);
}

module.exports = testOptimizedToCEmailSearch;