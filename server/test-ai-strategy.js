const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');
const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testAIStrategy() {
  console.log('=== 测试AI策略生成内容 ===\n');
  
  try {
    // 1. 分析网站
    console.log('📍 分析 fruitai.org...');
    const analyzer = new SmartBusinessAnalyzer();
    const businessAnalysis = await analyzer.performDeepAnalysis('https://fruitai.org', 'promote product');
    
    // 2. 生成AI策略
    console.log('🤖 调用AI生成策略...');
    const marketingAgent = new MarketingStrategyAgent();
    const strategyResult = await marketingAgent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product',
      businessAnalysis,
      'toc' // 指定为ToC消费者导向
    );
    
    if (strategyResult.success) {
      console.log('\n✅ 策略生成成功！\n');
      const strategy = strategyResult.strategy;
      
      console.log('📝 业务理解:');
      console.log('  核心产品:', strategy.business_understanding?.core_product);
      console.log('  解决问题:', strategy.business_understanding?.problem_solved);
      console.log('  使用场景:', strategy.business_understanding?.use_cases);
      
      console.log('\n🎯 目标受众:');
      console.log('  类型:', strategy.target_audience?.type);
      console.log('  主要群体:', strategy.target_audience?.primary_segments);
      console.log('  特征:', strategy.target_audience?.characteristics);
      console.log('  痛点:', strategy.target_audience?.pain_points);
      
      console.log('\n🔍 搜索关键词 (这些将用于Google搜索):');
      const keywords = strategy.target_audience?.search_keywords || [];
      keywords.forEach((keyword, index) => {
        console.log(`  ${index + 1}. "${keyword}"`);
        // 检查关键词长度
        if (keyword.length > 30) {
          console.log(`     ⚠️ 关键词太长 (${keyword.length}字符)，可能影响搜索效果`);
        }
      });
      
      console.log('\n💬 价值主张:');
      console.log('  核心:', strategy.messaging_framework?.value_proposition);
      console.log('  益处:', strategy.messaging_framework?.key_benefits);
      
      // 分析问题
      console.log('\n⚠️ 问题分析:');
      if (keywords.length === 0) {
        console.log('❌ 没有生成搜索关键词');
      } else if (keywords.some(k => k.length > 50)) {
        console.log('❌ 关键词太长，Google搜索将无法找到结果');
      } else if (keywords.some(k => k.includes('：') || k.includes('。'))) {
        console.log('❌ 关键词包含完整句子或描述，不适合搜索');
      } else {
        console.log('✅ 关键词格式看起来合理');
      }
      
    } else {
      console.log('❌ 策略生成失败:', strategyResult.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 设置超时提醒
setTimeout(() => {
  console.log('⏰ AI处理中，请稍候...');
}, 3000);

testAIStrategy().catch(console.error);