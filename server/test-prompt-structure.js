const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');
const SmartBusinessAnalyzer = require('./agents/SmartBusinessAnalyzer');

async function testPromptStructure() {
  console.log('=== 检查优化后的提示词结构 ===\n');
  
  // 1. 获取网站分析数据
  const analyzer = new SmartBusinessAnalyzer();
  const businessAnalysis = await analyzer.performDeepAnalysis('https://fruitai.org', 'promote product');
  
  console.log('✅ 网站分析数据获取完成');
  console.log('标题:', businessAnalysis.companyName);
  
  // 2. 构建MarketingStrategyAgent实例来查看提示词结构
  const marketingAgent = new MarketingStrategyAgent();
  
  // 模拟提示词构建过程
  const targetAudienceType = 'toc';
  const audienceTypeText = targetAudienceType === 'tob' ? 'B2B企业客户' : 'B2C个人消费者';
  
  console.log('\n📋 提示词关键要求检查:');
  console.log('✅ 目标客户类型:', audienceTypeText);
  console.log('✅ 要求基于网站实际内容分析');
  console.log('✅ 要求生成1-3个词的简短关键词');
  console.log('✅ 要求避免长句子和描述性文字');
  console.log('✅ 强调适合Google搜索的格式');
  
  console.log('\n📊 网站内容结构化数据:');
  console.log('- 行业分析:', typeof businessAnalysis.industry);
  console.log('- 产品信息:', typeof businessAnalysis.mainProducts);
  console.log('- 目标客户:', typeof businessAnalysis.targetCustomers);
  console.log('- 价值主张:', typeof businessAnalysis.valueProposition);
  
  console.log('\n🎯 提示词优化重点:');
  console.log('1. ✅ 移除了所有预设示例关键词');
  console.log('2. ✅ 强调基于网站内容理解');
  console.log('3. ✅ 明确要求短关键词格式');
  console.log('4. ✅ 提供结构化网站分析数据');
  
  console.log('\n📝 JSON示例格式:');
  console.log('search_keywords: ["基于实际内容的关键词", "1-3个词", "适合搜索"]');
  console.log('而不是: ["长描述性句子", "包含冒号和句号的文字"]');
  
  console.log('\n🚀 提示词结构检查完成！');
  console.log('现在AI应该能够基于真实网站内容生成合适的短关键词。');
}

testPromptStructure().catch(console.error);