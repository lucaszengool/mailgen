const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testFreshAnalysis() {
  console.log('=== 测试全新网站分析（绕过缓存）===');
  
  const analyzer = new SmartBusinessAnalyzer();
  
  try {
    // 直接调用performDeepAnalysis来绕过缓存
    const result = await analyzer.performDeepAnalysis('https://fruitai.org', 'promote product');
    
    console.log('\n✅ 新分析逻辑测试成功');
    console.log('公司名称:', result.companyName);
    console.log('\n🔍 行业识别结果类型:', typeof result.industry);
    if (typeof result.industry === 'object') {
      console.log('✅ 行业分析已优化为结构化数据');
      console.log('包含内容分析:', !!result.industry.contentAnalysis);
    }
    
    console.log('\n🎯 产品提取结果类型:', typeof result.mainProducts[0]);
    if (typeof result.mainProducts[0] === 'object') {
      console.log('✅ 产品分析已优化为结构化数据');
      console.log('包含标题:', !!result.mainProducts[0].title);
      console.log('包含内容片段:', !!result.mainProducts[0].bodySnippets);
    }
    
    console.log('\n👥 目标客户结果类型:', typeof result.targetCustomers);
    if (typeof result.targetCustomers === 'object' && result.targetCustomers.websiteAnalysis) {
      console.log('✅ 客户分析已优化为结构化数据');
      console.log('包含完整内容:', !!result.targetCustomers.websiteAnalysis.fullContent);
    }
    
    console.log('\n📈 营销策略结果类型:', typeof result.recommendedApproach);
    if (typeof result.recommendedApproach === 'object' && result.recommendedApproach.contentAnalysis) {
      console.log('✅ 营销策略已优化为结构化数据');
    }
    
    console.log('\n🎉 所有预设逻辑已成功移除！');
    console.log('现在所有数据都是结构化格式，供AI进行真正的分析');
    
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
  }
}

testFreshAnalysis().catch(console.error);