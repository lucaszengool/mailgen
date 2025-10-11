const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testWebsiteAnalysis() {
  console.log('=== 测试优化后的网站分析 ===');
  
  const analyzer = new SmartBusinessAnalyzer();
  
  try {
    const result = await analyzer.analyzeTargetBusiness('https://fruitai.org', 'promote product');
    console.log('\n✅ 网站分析成功完成');
    console.log('公司名称:', result.companyName);
    console.log('行业分析:', typeof result.industry === 'object' ? '结构化数据供AI分析' : result.industry);
    console.log('主要产品:', Array.isArray(result.mainProducts) && typeof result.mainProducts[0] === 'object' ? '结构化数据供AI分析' : result.mainProducts);
    console.log('目标客户:', typeof result.targetCustomers === 'object' && result.targetCustomers.websiteAnalysis ? '结构化数据供AI分析' : result.targetCustomers);
    
    // 显示提取的内容结构
    console.log('\n📊 内容结构优化:');
    console.log('- 移除了所有预设判断逻辑');
    console.log('- 返回结构化原始内容供AI分析');
    console.log('- 不再使用硬编码的关键词或模板');
    
  } catch (error) {
    console.error('❌ 网站分析失败:', error.message);
  }
}

testWebsiteAnalysis().catch(console.error);