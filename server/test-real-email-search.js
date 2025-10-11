const ProspectSearchAgent = require('./agents/ProspectSearchAgent');

async function testRealEmailSearch() {
  console.log('🧪 测试真实邮件搜索...');
  
  const agent = new ProspectSearchAgent();
  
  // 创建一个模拟策略，目标是寻找技术公司的联系人
  const mockStrategy = {
    target_audience: {
      type: 'toc',
      search_keywords: ['contact', 'startup', 'tech'],
      search_keyword_groups: {
        primary_keywords: ['contact', 'email'],
        industry_keywords: ['startup', 'tech', 'software'],
        solution_keywords: ['demo', 'support'],
        technology_keywords: ['AI', 'SaaS', 'web'],
        audience_keywords: ['founder', 'CEO', 'team']
      }
    }
  };
  
  console.log('📋 使用的搜索策略:');
  console.log('目标类型:', mockStrategy.target_audience.type);
  console.log('基础关键词:', mockStrategy.target_audience.search_keywords);
  
  try {
    console.log('\n🔍 开始搜索...');
    const prospects = await agent.searchProspects(mockStrategy, 'technology', 'toc');
    
    console.log(`\n📊 搜索结果: 找到 ${prospects.length} 个潜在客户`);
    
    if (prospects.length > 0) {
      console.log('\n📧 前5个结果:');
      prospects.slice(0, 5).forEach((prospect, index) => {
        console.log(`\\n${index + 1}. ${prospect.company || 'Unknown Company'}`);
        console.log(`   📧 ${prospect.email}`);
        console.log(`   🏷️ 行业: ${prospect.industry || 'N/A'}`);
        console.log(`   📍 来源: ${prospect.source}`);
        console.log(`   🔗 网站: ${prospect.website || 'N/A'}`);
        if (prospect.rawData) {
          console.log(`   📝 原始数据: ${prospect.rawData.title || 'N/A'}`);
        }
      });
      
      // 统计邮箱类型
      const emailTypes = {};
      prospects.forEach(p => {
        const domain = p.email.split('@')[1];
        emailTypes[domain] = (emailTypes[domain] || 0) + 1;
      });
      
      console.log('\\n📈 邮箱域名统计:');
      Object.entries(emailTypes).forEach(([domain, count]) => {
        console.log(`   ${domain}: ${count} 个`);
      });
      
    } else {
      console.log('⚠️ 没有找到任何邮箱地址');
      console.log('💡 这可能是因为:');
      console.log('   1. 现实网站很少直接显示邮箱地址');
      console.log('   2. 需要更深层的抓取策略');
      console.log('   3. 可能需要集成专业的邮箱查找服务');
    }
    
  } catch (error) {
    console.error('❌ 搜索失败:', error.message);
  }
  
  console.log('\n🏁 测试完成!');
}

testRealEmailSearch().catch(console.error);