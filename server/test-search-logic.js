const ProspectSearchAgent = require('./agents/ProspectSearchAgent');

async function testSearchLogic() {
  console.log('=== 测试搜索逻辑优化 ===\n');
  
  // 创建一个模拟的优化策略
  const mockStrategy = {
    target_audience: {
      type: 'toc',
      primary_segments: ['健康生活博客', '家庭主妇论坛', '食品评测网站'],
      search_keywords: ['买菜', '新鲜水果', '健康饮食', '选购技巧', '食品安全'], // 简短关键词
      characteristics: ['关注健康', '经常购买生鲜', '分享生活经验'],
      pain_points: ['不知道怎么挑选新鲜水果', '担心食品安全', '想要健康饮食']
    }
  };
  
  console.log('📋 使用优化后的模拟策略:');
  console.log('目标类型:', mockStrategy.target_audience.type);
  console.log('关键词:', mockStrategy.target_audience.search_keywords);
  
  try {
    const prospectAgent = new ProspectSearchAgent();
    
    console.log('\n🔍 生成搜索查询...');
    const queries = prospectAgent.generateSearchQueries(mockStrategy, 'consumer');
    
    console.log('\n🚀 执行搜索...');
    const prospects = await prospectAgent.searchProspects(mockStrategy, 'consumer');
    
    console.log(`\n✅ 搜索结果: ${prospects.length} 个潜在客户`);
    
    if (prospects.length > 0) {
      prospects.forEach((prospect, index) => {
        console.log(`\n${index + 1}. ${prospect.company}`);
        console.log(`   📧 ${prospect.email}`);
        console.log(`   🏷️ ${prospect.industry}`);
        console.log(`   📝 ${prospect.discovery_context}`);
      });
      
      console.log('\n🎉 搜索功能正常工作！');
      console.log('✅ 关键词简短易搜索');
      console.log('✅ 生成了相关的潜在客户');
      
    } else {
      console.log('\n❌ 没有找到潜在客户');
      console.log('可能的原因:');
      console.log('- Google API配置问题');
      console.log('- 搜索词组合不当');
      console.log('- 模拟数据生成逻辑需要调整');
    }
    
  } catch (error) {
    console.error('❌ 搜索测试失败:', error.message);
  }
}

testSearchLogic().catch(console.error);