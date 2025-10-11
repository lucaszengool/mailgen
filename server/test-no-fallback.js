const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');

async function testNoFallback() {
  const agent = new MarketingStrategyAgent();
  
  // 模拟业务分析数据
  const businessAnalysis = {
    url: 'https://fruitai.org',
    companyName: 'FruitAI',
    industry: 'ai-technology',
    mainProducts: ['AI Fruit Freshness Detection App'],
    keyFeatures: ['Mobile App', 'Image Recognition', 'Freshness Analysis'],
    targetCustomers: [
      {
        segment: 'Consumers',
        characteristics: ['Health-conscious', 'Grocery shoppers'],
        painPoints: ['Unable to determine fruit freshness', 'Food waste']
      }
    ]
  };
  
  console.log('=== 测试无模板AI策略生成 ===');
  console.log('网站: https://fruitai.org');
  console.log('目标: ToC 水果新鲜度检测产品');
  
  try {
    const result = await agent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product',
      businessAnalysis,
      'toc'
    );
    
    if (result.success) {
      console.log('\n✅ AI策略生成成功');
      console.log('核心产品:', result.strategy.business_understanding?.core_product);
      console.log('目标客户群体:', result.strategy.target_audience?.primary_segments);
      console.log('搜索关键词:', result.strategy.target_audience?.search_keywords);
      console.log('价值主张:', result.strategy.messaging_framework?.value_proposition);
    } else {
      console.log('\n❌ AI策略生成失败');
      console.log('错误:', result.error);
      console.log('策略内容:', result.strategy);
    }
  } catch (error) {
    console.log('\n❌ 系统错误:', error.message);
  }
}

testNoFallback().catch(console.error);