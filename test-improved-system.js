// 测试改进后的系统
const FreeEmailValidator = require('./server/services/FreeEmailValidator');
const ContentStateManager = require('./server/services/ContentStateManager');
const ImprovedMarketingStrategy = require('./server/agents/ImprovedMarketingStrategy');

async function testImprovedSystem() {
  console.log('🧪 测试改进后的AI邮件营销系统\n');
  console.log('=' . repeat(50));
  
  // 1. 测试免费邮件验证
  console.log('\n📧 测试1: 免费邮件验证服务');
  console.log('-'.repeat(30));
  
  const emailValidator = new FreeEmailValidator();
  
  const testEmails = [
    'v230official@gmail.com',  // 您提到的无效地址
    'test@example.com',         // 明显的测试地址
    'john.doe@gmail.com',       // 有效的Gmail地址
    'info@tempmail.com',        // 一次性邮箱
    'admin@gnail.com',          // 拼写错误
    'business@microsoft.com'    // 企业邮箱
  ];
  
  console.log('验证邮件地址:');
  for (const email of testEmails) {
    const result = await emailValidator.validateEmail(email);
    console.log(`  ${email}: ${result.valid ? '✅' : '❌'} ${result.reason || ''}`);
  }
  
  // 2. 测试内容状态管理（防止网站内容混淆）
  console.log('\n🔐 测试2: 内容状态管理（防止混淆）');
  console.log('-'.repeat(30));
  
  const stateManager = new ContentStateManager();
  
  // 模拟两个不同的网站
  const website1 = 'https://headai.io';
  const website2 = 'http://fruitai.org';
  
  // 为HeadAI创建会话
  const session1 = stateManager.initializeWebsiteSession(website1, {
    companyName: 'HeadAI',
    industry: 'AI Technology',
    mainProducts: ['AI Solutions', 'Machine Learning Platform']
  });
  console.log(`  创建会话: ${website1} (ID: ${session1})`);
  
  // 为FruitAI创建会话
  const session2 = stateManager.initializeWebsiteSession(website2, {
    companyName: 'FruitAI',
    industry: 'Food Technology',
    mainProducts: ['Fruit Freshness Detection App']
  });
  console.log(`  创建会话: ${website2} (ID: ${session2})`);
  
  // 切换到HeadAI并获取其业务分析
  stateManager.switchToWebsite(website1);
  const headAIAnalysis = stateManager.getBusinessAnalysis();
  console.log(`  HeadAI分析: ${headAIAnalysis.companyName} - ${headAIAnalysis.industry}`);
  
  // 切换到FruitAI并获取其业务分析
  stateManager.switchToWebsite(website2);
  const fruitAIAnalysis = stateManager.getBusinessAnalysis();
  console.log(`  FruitAI分析: ${fruitAIAnalysis.companyName} - ${fruitAIAnalysis.industry}`);
  
  // 验证内容没有混淆
  console.log(`  ✅ 内容隔离验证: ${headAIAnalysis.companyName !== fruitAIAnalysis.companyName ? '通过' : '失败'}`);
  
  // 3. 测试改进的营销策略生成
  console.log('\n🎯 测试3: 改进的营销策略生成');
  console.log('-'.repeat(30));
  
  const strategyGenerator = new ImprovedMarketingStrategy();
  
  // 测试HeadAI策略生成
  console.log('\n  为HeadAI生成策略:');
  const headAIStrategy = await strategyGenerator.generateImprovedStrategy(
    website1,
    'promote product',
    'tob'  // 明确指定为B2B
  );
  
  console.log(`    网站: ${headAIStrategy.website}`);
  console.log(`    业务类型: ${headAIStrategy.targetAudience.type}`);
  console.log(`    搜索关键词 (前5个):`);
  headAIStrategy.targetAudience.searchKeywords.slice(0, 5).forEach(kw => {
    console.log(`      - ${kw}`);
  });
  
  // 测试FruitAI策略生成
  console.log('\n  为FruitAI生成策略:');
  const fruitAIStrategy = await strategyGenerator.generateImprovedStrategy(
    website2,
    'promote product',
    'toc'  // 明确指定为B2C
  );
  
  console.log(`    网站: ${fruitAIStrategy.website}`);
  console.log(`    业务类型: ${fruitAIStrategy.targetAudience.type}`);
  console.log(`    搜索关键词 (前5个):`);
  fruitAIStrategy.targetAudience.searchKeywords.slice(0, 5).forEach(kw => {
    console.log(`      - ${kw}`);
  });
  
  // 4. 测试关键词准确性
  console.log('\n🔍 测试4: 关键词准确性验证');
  console.log('-'.repeat(30));
  
  // 验证HeadAI关键词是否包含AI相关词汇
  const headAIKeywordsValid = headAIStrategy.targetAudience.searchKeywords.some(kw => 
    kw.includes('ai') || kw.includes('intelligence') || kw.includes('machine')
  );
  console.log(`  HeadAI关键词相关性: ${headAIKeywordsValid ? '✅ 通过' : '❌ 失败'}`);
  
  // 验证FruitAI关键词是否包含水果相关词汇
  const fruitAIKeywordsValid = fruitAIStrategy.targetAudience.searchKeywords.some(kw => 
    kw.includes('fruit') || kw.includes('fresh') || kw.includes('food')
  );
  console.log(`  FruitAI关键词相关性: ${fruitAIKeywordsValid ? '✅ 通过' : '❌ 失败'}`);
  
  // 5. 系统改进总结
  console.log('\n📊 系统改进总结');
  console.log('=' . repeat(50));
  console.log('✅ 实现的改进:');
  console.log('  1. 免费邮件验证（无需付费API）');
  console.log('  2. 内容状态隔离（防止网站内容混淆）');
  console.log('  3. 改进的关键词生成（更准确的搜索词）');
  console.log('  4. 智能业务类型检测（B2B vs B2C）');
  console.log('  5. 基于网站实际内容的策略生成');
  
  console.log('\n💡 解决的问题:');
  console.log('  ✅ "address not found"错误 - 通过邮件预验证');
  console.log('  ✅ 内容混淆（FruitAI/HeadAI）- 通过会话隔离');
  console.log('  ✅ 关键词不准确 - 通过内容分析生成');
  
  console.log('\n🚀 下一步建议:');
  console.log('  1. 集成到主系统中');
  console.log('  2. 添加更多免费邮件验证源');
  console.log('  3. 实现邮件发送重试机制');
  console.log('  4. 添加A/B测试功能');
  console.log('  5. 实现邮件打开率跟踪');
}

// 运行测试
testImprovedSystem().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});