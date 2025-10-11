// 测试fallback机制的修复
const MarketingStrategyAgent = require('./server/agents/MarketingStrategyAgent');

async function testFallbackFix() {
  console.log('🧪 测试Fallback机制的HeadAI内容修复');
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
    console.log('🎯 测试fallback策略生成...');
    
    // 创建简单的fallback策略
    const fallbackStrategy = {
      target_audience: {
        type: 'tob',
        search_keywords: ['AI Technology', 'Marketing Automation']
      }
    };
    
    console.log('\n🎯 测试fallback邮件生成...');
    
    const prospect = {
      email: 'test@techcorp.com',
      company: 'TechCorp',
      name: 'Test User'
    };
    
    // 直接调用fallback邮件生成
    const fallbackEmail = agent.generateFallbackEmail(
      prospect,
      fallbackStrategy,
      'https://headai.io'
    );
    
    console.log('✅ Fallback邮件生成结果:');
    console.log(`Subject: ${fallbackEmail.subject}`);
    console.log(`Content Length: ${fallbackEmail.content?.length || 0} characters`);
    console.log(`Fallback Used: ${fallbackEmail.fallback_used || false}`);
    
    // 检查内容是否正确
    const emailText = (fallbackEmail.subject + ' ' + fallbackEmail.content).toLowerCase();
    const emailHasFruitAI = emailText.includes('fruit');
    const emailHasHeadAI = emailText.includes('headai') || emailText.includes('head ai');
    
    console.log(`\n📊 内容检查:`);
    console.log(`  包含FruitAI内容: ${emailHasFruitAI ? '❌ Yes (需要修复)' : '✅ No'}`);
    console.log(`  包含HeadAI内容: ${emailHasHeadAI ? '✅ Yes' : '❌ No (需要检查)'}`);
    
    if (emailHasFruitAI) {
      console.log('\n⚠️ 发现问题: Fallback邮件仍包含FruitAI内容');
      console.log('Subject:', fallbackEmail.subject);
      console.log('Content preview:', fallbackEmail.content?.substring(0, 200) + '...');
    } else {
      console.log('\n✅ 修复成功: Fallback邮件不再包含FruitAI内容');
    }
    
    console.log('\n✅ Fallback测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testFallbackFix();