const MarketingStrategyAgent = require('./server/agents/MarketingStrategyAgent');

async function testStrategyGeneration() {
  console.log('🧪 测试营销策略生成...');
  
  const agent = new MarketingStrategyAgent();
  
  // Mock business analysis data similar to what fruitai.org would generate
  const businessAnalysis = {
    companyName: 'FruitAI',
    url: 'http://fruitai.org',
    industry: 'food_technology',
    businessModel: 'b2c',
    mainProducts: [{
      title: 'FruitAI - AI Fruit Freshness Detection',
      description: 'AI-powered app that helps consumers analyze fruit freshness using computer vision',
      headings: ['AI Fruit Analysis', 'Smart Freshness Detection', 'Consumer App'],
      bodySnippets: [
        'Use AI to check if your fruit is fresh',
        'Scan fruits with your phone camera',
        'Get instant freshness ratings',
        'Perfect for consumers who want fresh produce'
      ],
      url: 'http://fruitai.org'
    }],
    valueProposition: {
      primaryContent: {
        description: 'AI-powered fruit freshness detection for everyday consumers'
      }
    },
    targetCustomers: ['Individual consumers', 'Health-conscious users', 'Grocery shoppers']
  };

  try {
    console.log('📊 业务分析数据:', {
      companyName: businessAnalysis.companyName,
      industry: businessAnalysis.industry,
      businessModel: businessAnalysis.businessModel,
      productsCount: businessAnalysis.mainProducts?.length
    });

    const result = await agent.generateMarketingStrategy(
      'http://fruitai.org',
      'promote product', 
      businessAnalysis,
      'toc' // Explicitly set to consumer-focused
    );
    
    console.log('✅ 策略生成结果:', {
      success: result.success,
      hasStrategy: !!result.strategy,
      error: result.error || 'None'
    });
    
    if (result.strategy) {
      console.log('📋 策略详情:');
      console.log('  Target Audience Type:', result.strategy.target_audience?.type);
      console.log('  Primary Segments:', result.strategy.target_audience?.primary_segments);
      console.log('  Search Keywords:', result.strategy.target_audience?.search_keywords);
      console.log('  Value Proposition:', result.strategy.messaging_framework?.value_proposition);
    } else {
      console.log('❌ 策略为空或未定义');
      console.log('📄 原始响应:', result.raw_response);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testStrategyGeneration();
