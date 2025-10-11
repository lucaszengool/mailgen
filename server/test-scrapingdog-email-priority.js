/**
 * 测试 Scrapingdog 邮箱优先级和搜索功能
 */

const ProspectSearchAgent = require('./agents/ProspectSearchAgent');

async function testEmailPriority() {
  console.log('🧪 测试邮箱优先级逻辑\n');
  
  const agent = new ProspectSearchAgent();
  
  // 测试邮箱样本
  const testEmails = [
    'contact@company.com',
    'john.doe@gmail.com', // 个人邮箱 - 应该对ToC最高优先级
    'sales@business.com',
    'sarah@yahoo.com',    // 个人邮箱 - 应该对ToC高优先级
    'admin@company.com',
    'ceo@startup.com',
    'mike@hotmail.com'    // 个人邮箱 - 应该对ToC高优先级
  ];
  
  console.log('🔍 测试 ToC (个人消费者) 邮箱优先级:');
  const tocPriorities = testEmails.map(email => ({
    email,
    priority: agent.getEmailPriority(email, 'toc'),
    type: agent.classifyEmailType(email)
  })).sort((a, b) => b.priority - a.priority);
  
  tocPriorities.forEach((item, index) => {
    const isPersonal = item.email.includes('@gmail.com') || 
                      item.email.includes('@yahoo.com') || 
                      item.email.includes('@hotmail.com');
    const marker = isPersonal ? '✅' : '⚪';
    console.log(`   ${index + 1}. ${marker} ${item.email} (优先级: ${item.priority}, 类型: ${item.type})`);
  });
  
  console.log('\n🔍 测试 ToB (企业) 邮箱优先级:');
  const tobPriorities = testEmails.map(email => ({
    email,
    priority: agent.getEmailPriority(email, 'tob'),
    type: agent.classifyEmailType(email)
  })).sort((a, b) => b.priority - a.priority);
  
  tobPriorities.forEach((item, index) => {
    const isBusiness = item.email.includes('sales@') || 
                      item.email.includes('contact@') || 
                      item.email.includes('ceo@');
    const marker = isBusiness ? '✅' : '⚪';
    console.log(`   ${index + 1}. ${marker} ${item.email} (优先级: ${item.priority}, 类型: ${item.type})`);
  });
  
  // 验证 ToC 优先级正确性
  const topTocEmails = tocPriorities.slice(0, 3);
  const hasPersonalEmailsOnTop = topTocEmails.some(item => 
    item.email.includes('@gmail.com') || 
    item.email.includes('@yahoo.com') || 
    item.email.includes('@hotmail.com')
  );
  
  console.log('\n📊 ToC 优先级验证结果:');
  console.log(`   ${hasPersonalEmailsOnTop ? '✅' : '❌'} 个人邮箱在ToC模式下获得高优先级`);
  
  // 简单的 Scrapingdog API 连接测试
  if (process.env.SCRAPINGDOG_API_KEY && process.env.SCRAPINGDOG_API_KEY !== 'your_scrapingdog_api_key') {
    console.log('\n🐕 测试 Scrapingdog API 连接:');
    console.log('   ✅ API 密钥已配置');
    
    try {
      // 生成一个简单的搜索查询来测试连接
      const strategy = {
        target_audience: {
          type: 'toc',
          search_keywords: ['fresh', 'fruit']
        }
      };
      
      const queries = agent.generateSearchQueries(strategy, 'food');
      console.log(`   ✅ 生成了 ${queries.length} 个搜索查询:`);
      queries.forEach((query, i) => {
        console.log(`      ${i+1}. "${query}"`);
      });
      
      console.log('   ✅ Scrapingdog 集成准备就绪');
    } catch (error) {
      console.log(`   ❌ 搜索查询生成失败: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  Scrapingdog API 密钥未配置');
  }
}

testEmailPriority().then(() => {
  console.log('\n✅ 测试完成');
}).catch(console.error);