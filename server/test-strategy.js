const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');

async function testStrategy() {
  const agent = new MarketingStrategyAgent();
  
  console.log('=== 测试 fruitai.org ToC策略生成 ===');
  const fruitAIStrategy = agent.generateDefaultStrategy('https://fruitai.org', 'promote product', 'toc');
  console.log('搜索关键词:', fruitAIStrategy.target_audience.search_keywords);
  console.log('目标客户群体:', fruitAIStrategy.target_audience.primary_segments);
  console.log('核心产品:', fruitAIStrategy.business_understanding.core_product);
  
  console.log('\n=== 测试 techcompany.com ToB策略生成 ===');
  const techStrategy = agent.generateDefaultStrategy('https://techcompany.com', 'partnership', 'tob');
  console.log('搜索关键词:', techStrategy.target_audience.search_keywords);
  console.log('目标客户群体:', techStrategy.target_audience.primary_segments);
  console.log('核心产品:', techStrategy.business_understanding.core_product);
  
  console.log('\n=== 测试 petcare.com ToC策略生成 ===');
  const petStrategy = agent.generateDefaultStrategy('https://petcare.com', 'promote product', 'toc');
  console.log('搜索关键词:', petStrategy.target_audience.search_keywords);
  console.log('目标客户群体:', petStrategy.target_audience.primary_segments);
  console.log('核心产品:', petStrategy.business_understanding.core_product);
}

testStrategy().catch(console.error);