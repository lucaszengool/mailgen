const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');
const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testOptimizedPrompt() {
  console.log('=== 测试优化后的AI提示词 ===\n');
  
  try {
    console.log('📍 重新分析 fruitai.org...');
    const analyzer = new SmartBusinessAnalyzer();
    const businessAnalysis = await analyzer.performDeepAnalysis('https://fruitai.org', 'promote product');
    
    console.log('✅ 网站分析完成');
    console.log('网站标题:', businessAnalysis.companyName);
    
    console.log('\n🤖 使用优化后的提示词生成策略...');
    const marketingAgent = new MarketingStrategyAgent();
    
    const strategyResult = await marketingAgent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product',
      businessAnalysis,
      'toc'
    );
    
    if (strategyResult.success) {
      console.log('\n🎉 策略生成成功！');
      const strategy = strategyResult.strategy;
      
      console.log('\n📊 关键分析结果:');
      console.log('业务类型:', strategy.target_audience?.type);
      console.log('核心产品:', strategy.business_understanding?.core_product);
      
      console.log('\n🔍 生成的搜索关键词:');
      const keywords = strategy.target_audience?.search_keywords || [];
      keywords.forEach((keyword, index) => {
        const length = keyword.length;
        const isShort = length <= 10;
        const status = isShort ? '✅' : '⚠️';
        console.log(`  ${index + 1}. "${keyword}" (${length}字符) ${status}`);
      });
      
      console.log('\n📈 关键词质量评估:');
      const shortKeywords = keywords.filter(k => k.length <= 10);
      const longKeywords = keywords.filter(k => k.length > 10);
      const hasDescriptiveText = keywords.some(k => k.includes('：') || k.includes('。') || k.includes(','));
      
      console.log(`✅ 短关键词 (≤10字符): ${shortKeywords.length}`);
      console.log(`⚠️ 长关键词 (>10字符): ${longKeywords.length}`);
      console.log(`❌ 包含描述文字: ${hasDescriptiveText ? 'Yes' : 'No'}`);
      
      if (shortKeywords.length >= 3 && !hasDescriptiveText) {
        console.log('\n🎯 关键词质量: 优秀！适合Google搜索');
      } else if (shortKeywords.length >= 1) {
        console.log('\n🔄 关键词质量: 良好，但还可以改进');
      } else {
        console.log('\n❌ 关键词质量: 需要进一步优化');
      }
      
    } else {
      console.log('\n❌ 策略生成失败:', strategyResult.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

console.log('⚠️ 注意：AI生成可能需要几分钟时间...\n');
testOptimizedPrompt().catch(console.error);