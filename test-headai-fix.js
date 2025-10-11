// 测试HeadAI修复
const MarketingStrategyAgent = require('./server/agents/MarketingStrategyAgent');

async function testHeadAIFix() {
  console.log('🧪 测试HeadAI内容修复');
  console.log('='.repeat(50));
  
  const agent = new MarketingStrategyAgent();
  
  // 模拟HeadAI业务分析数据
  const mockHeadAIAnalysis = {
    companyName: 'HeadAI',
    industry: 'AI Technology',
    mainProducts: [{
      title: 'HeadAI - AI Marketing Platform',
      description: 'Advanced AI solutions for marketing automation and lead generation'
    }],
    valueProposition: {
      primaryContent: {
        description: 'AI-powered marketing automation for businesses'
      }
    },
    businessModel: 'b2b'
  };
  
  try {
    console.log('🎯 测试营销策略生成...');
    const strategy = await agent.generateMarketingStrategy(
      'https://headai.io',
      'generate leads',
      mockHeadAIAnalysis,
      'tob'
    );
    
    console.log('✅ 策略生成结果:');
    console.log(`  Success: ${strategy.success}`);
    console.log(`  Fallback Used: ${strategy.fallback_used || false}`);
    
    if (strategy.strategy) {
      const keywords = strategy.strategy.target_audience?.search_keywords || [];
      console.log(`  关键词数量: ${keywords.length}`);
      console.log(`  前5个关键词: ${keywords.slice(0, 5).join(', ')}`);
      
      // 检查是否还有FruitAI相关内容
      const strategyText = JSON.stringify(strategy.strategy);
      const hasFruitAI = strategyText.toLowerCase().includes('fruit');
      const hasHeadAI = strategyText.toLowerCase().includes('head') || strategyText.toLowerCase().includes('ai technology');
      
      console.log(`  包含FruitAI内容: ${hasFruitAI ? '❌ Yes (需要修复)' : '✅ No'}`);
      console.log(`  包含HeadAI内容: ${hasHeadAI ? '✅ Yes' : '❌ No (需要检查)'}`);
    }
    
    console.log('\n🎯 测试邮件生成...');
    const prospect = {
      email: 'test@techcorp.com',
      company: 'TechCorp',
      name: 'Test User'
    };
    
    const email = await agent.generatePersonalizedEmail(
      prospect,
      strategy.strategy,
      [],
      'https://headai.io'
    );
    
    console.log('✅ 邮件生成结果:');
    console.log(`  Subject: ${email.subject}`);
    console.log(`  Content Length: ${email.content?.length || 0} characters`);
    console.log(`  Fallback Used: ${email.fallback_used || false}`);
    
    // 检查邮件内容是否正确
    const emailText = (email.subject + ' ' + email.content).toLowerCase();
    const emailHasFruitAI = emailText.includes('fruit');
    const emailHasHeadAI = emailText.includes('headai') || emailText.includes('head ai');
    
    console.log(`  邮件包含FruitAI内容: ${emailHasFruitAI ? '❌ Yes (需要修复)' : '✅ No'}`);
    console.log(`  邮件包含HeadAI内容: ${emailHasHeadAI ? '✅ Yes' : '❌ No (需要检查)'}`);
    
    if (emailHasFruitAI) {
      console.log('\n⚠️ 发现问题: 邮件仍包含FruitAI内容');
      console.log('Subject:', email.subject);
      console.log('Content preview:', email.content?.substring(0, 200) + '...');
    }
    
    console.log('\n✅ 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testHeadAIFix();