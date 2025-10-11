const LocalAISearchEngine = require('./agents/LocalAISearchEngine');

async function testSimpleSearch() {
  console.log('🧪 简单测试真实搜索...');
  
  const engine = new LocalAISearchEngine();
  
  try {
    // 简单查询
    const results = await engine.searchProspects('contact business', {
      industry: 'technology',
      targetAudience: 'B2B',
      maxResults: 5,
      searchDepth: 'light' // 减少搜索深度
    });
    
    console.log(`\n📊 搜索结果: ${results.prospects.length} 个潜在客户`);
    
    if (results.prospects.length > 0) {
      console.log('\n📧 前3个结果:');
      results.prospects.slice(0, 3).forEach((prospect, index) => {
        console.log(`${index + 1}. ${prospect.company || 'Unknown'}`);
        console.log(`   📧 ${prospect.email}`);
        console.log(`   🏢 行业: ${prospect.industry || 'N/A'}`);
        console.log(`   🔗 来源: ${prospect.source}`);
      });
    } else {
      console.log('⚠️ 没有找到邮箱地址');
    }
    
  } catch (error) {
    console.error('❌ 搜索失败:', error.message);
  }
  
  console.log('\n🏁 测试完成!');
}

testSimpleSearch().catch(console.error);