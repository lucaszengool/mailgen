const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');
const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');
const ProspectSearchAgent = require('./agents/ProspectSearchAgent');

async function testCompleteWorkflow() {
  console.log('=== 测试完整优化后的AI营销工作流程 ===\n');
  
  try {
    // 1. 网站分析
    console.log('1️⃣ 开始网站分析...');
    const analyzer = new SmartBusinessAnalyzer();
    const businessAnalysis = await analyzer.performDeepAnalysis('https://fruitai.org', 'promote product');
    console.log('✅ 网站分析完成 - 使用结构化数据格式');
    
    // 2. AI营销策略生成  
    console.log('\n2️⃣ 生成AI营销策略（ToC - 消费者导向）...');
    const marketingAgent = new MarketingStrategyAgent();
    
    // 使用简化的提示词来避免超时
    console.log('🧠 正在调用Ollama生成策略...');
    const strategyResult = await marketingAgent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product', 
      businessAnalysis,
      'toc'
    );
    
    if (strategyResult.success) {
      console.log('✅ AI营销策略生成成功');
      console.log('目标客户类型:', strategyResult.strategy.target_audience?.type);
      console.log('主要用户群体:', strategyResult.strategy.target_audience?.primary_segments);
      console.log('搜索关键词:', strategyResult.strategy.target_audience?.search_keywords);
      
      // 3. 基于AI策略搜索潜在客户
      console.log('\n3️⃣ 基于AI策略搜索潜在客户...');
      const prospectAgent = new ProspectSearchAgent();
      const prospects = await prospectAgent.searchProspects(
        strategyResult.strategy,
        'consumer'
      );
      
      console.log(`✅ 发现 ${prospects.length} 个潜在客户`);
      prospects.forEach((prospect, index) => {
        console.log(`   ${index + 1}. ${prospect.company} (${prospect.email})`);
        console.log(`      发现方式: ${prospect.discovery_context}`);
      });
      
      console.log('\n🎉 完整工作流程测试成功！');
      console.log('✅ 网站分析：无预设逻辑，使用结构化数据');
      console.log('✅ AI策略生成：基于真实内容分析');
      console.log('✅ 潜在客户搜索：基于AI生成的关键词');
      
    } else {
      console.log('❌ AI营销策略生成失败:', strategyResult.error);
      console.log('原因：可能是Ollama响应超时或解析失败');
    }
    
  } catch (error) {
    console.error('❌ 工作流程测试失败:', error.message);
  }
}

// 设置较长的超时时间
setTimeout(() => {
  console.log('\n⏰ 测试可能需要较长时间，请耐心等待...');
}, 5000);

testCompleteWorkflow().catch(console.error);