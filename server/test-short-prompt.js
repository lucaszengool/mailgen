const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');
const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testShortPrompt() {
  console.log('=== 测试优化后的短提示词 ===\n');
  
  try {
    // 分析网站
    const analyzer = new SmartBusinessAnalyzer();
    const businessAnalysis = await analyzer.performDeepAnalysis('https://fruitai.org', 'promote product');
    
    console.log('✅ 网站分析完成');
    console.log('公司:', businessAnalysis.companyName);
    
    // 生成策略
    console.log('\n🤖 使用优化后的短提示词生成策略...');
    const marketingAgent = new MarketingStrategyAgent();
    
    // 估算提示词长度
    const websiteInfo = {
      title: businessAnalysis.companyName || 'Unknown',
      description: businessAnalysis.valueProposition?.primaryContent?.description || 'No description',
      products: 'AI Fruit Detection'
    };
    
    const estimatedPromptLength = JSON.stringify(websiteInfo).length + 500; // 基础提示词长度
    console.log(`📏 预计提示词长度: ~${estimatedPromptLength} 字符 (应该 < 4096)`);
    
    const strategyResult = await marketingAgent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product',
      businessAnalysis,
      'toc'
    );
    
    if (strategyResult.success) {
      console.log('\n🎉 策略生成成功！');
      const strategy = strategyResult.strategy;
      
      console.log('\n📊 结果分析:');
      console.log('核心产品:', strategy.business_understanding?.core_product);
      console.log('解决问题:', strategy.business_understanding?.problem_solved);
      console.log('目标类型:', strategy.target_audience?.type);
      console.log('用户群体:', strategy.target_audience?.primary_segments);
      
      console.log('\n🔍 搜索关键词:');
      const keywords = strategy.target_audience?.search_keywords || [];
      keywords.forEach((keyword, index) => {
        const length = keyword.length;
        const isShort = length <= 10;
        console.log(`  ${index + 1}. "${keyword}" (${length}字符) ${isShort ? '✅' : '⚠️'}`);
      });
      
      const shortCount = keywords.filter(k => k.length <= 10).length;
      console.log(`\n📈 关键词质量: ${shortCount}/${keywords.length} 个短关键词`);
      
      if (shortCount >= 2) {
        console.log('🎯 成功！生成了适合搜索的短关键词');
      } else {
        console.log('🔄 需要继续优化关键词长度');
      }
      
    } else {
      console.log('❌ 策略生成失败:', strategyResult.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

console.log('⚡ 使用简化提示词，应该响应更快...\n');
testShortPrompt().catch(console.error);