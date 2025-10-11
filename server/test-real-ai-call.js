const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');
const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testRealAICall() {
  console.log('=== 直接测试真实AI调用 ===\n');
  
  try {
    // 1. 快速分析网站
    console.log('📍 快速分析 fruitai.org...');
    const analyzer = new SmartBusinessAnalyzer();
    
    // 使用基础分析避免过长提示词
    const basicAnalysis = {
      url: 'https://fruitai.org',
      companyName: 'FruitAI',
      industry: { contentAnalysis: { title: 'AI-powered fruit freshness analyzer' } },
      mainProducts: [{ title: 'AI Fruit Freshness Detection' }],
      valueProposition: { 
        primaryContent: { 
          description: 'AI-powered fruit and vegetable freshness analyzer for smart grocery shopping' 
        } 
      }
    };
    
    console.log('✅ 使用简化的网站分析数据');
    
    // 2. 直接测试MarketingStrategyAgent
    console.log('\n🤖 直接调用MarketingStrategyAgent...');
    const agent = new MarketingStrategyAgent();
    
    const result = await agent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product',
      basicAnalysis,
      'toc' // 明确指定ToC
    );
    
    if (result.success) {
      console.log('\n🎉 AI策略生成成功！');
      const strategy = result.strategy;
      
      console.log('\n📋 策略分析:');
      console.log('业务理解:', strategy.business_understanding);
      console.log('目标受众类型:', strategy.target_audience?.type);
      console.log('用户群体:', strategy.target_audience?.primary_segments);
      
      console.log('\n🔍 关键词详细分析:');
      const keywords = strategy.target_audience?.search_keywords || [];
      
      if (keywords.length === 0) {
        console.log('❌ 没有生成关键词');
      } else {
        keywords.forEach((keyword, index) => {
          const length = keyword.length;
          const hasProblems = keyword.includes('：') || keyword.includes('。') || keyword.includes('，') || length > 15;
          console.log(`  ${index + 1}. "${keyword}"`);
          console.log(`      长度: ${length} 字符`);
          console.log(`      状态: ${hasProblems ? '❌ 有问题' : '✅ 合适'}`);
          
          if (hasProblems) {
            console.log(`      问题: ${length > 15 ? '太长' : ''} ${keyword.includes('：') || keyword.includes('。') || keyword.includes('，') ? '包含描述文字' : ''}`);
          }
        });
        
        const goodKeywords = keywords.filter(k => k.length <= 15 && !k.includes('：') && !k.includes('。') && !k.includes('，'));
        console.log(`\n📊 关键词质量: ${goodKeywords.length}/${keywords.length} 个合格`);
        
        if (goodKeywords.length >= keywords.length * 0.7) {
          console.log('🎯 结果: 优化成功！');
        } else {
          console.log('⚠️ 结果: 需要进一步优化提示词');
        }
      }
      
    } else {
      console.log('\n❌ AI策略生成失败');
      console.log('错误:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

console.log('⚡ 直接测试AI调用，查看优化效果...\n');
testRealAICall().catch(console.error);