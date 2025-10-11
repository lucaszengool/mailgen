/**
 * 测试 Scrapingdog AI Mode 集成
 */

const ProspectSearchAgent = require('./agents/ProspectSearchAgent');

async function testAIMode() {
  console.log('🤖 测试Scrapingdog AI Mode集成\n');
  
  const agent = new ProspectSearchAgent();
  
  // 模拟策略 - 水果AI应用，ToC用户
  const mockStrategy = {
    target_audience: {
      type: 'toc',
      search_keywords: ['fruit freshness', 'AI app', 'healthy eating'],
      primary_segments: ['Health-conscious consumers', 'Grocery shoppers']
    }
  };
  
  console.log('📋 测试策略:');
  console.log('   目标类型:', mockStrategy.target_audience.type);
  console.log('   关键词:', mockStrategy.target_audience.search_keywords);
  console.log('   用户群体:', mockStrategy.target_audience.primary_segments);
  
  // 生成单个智能查询
  console.log('\n🧠 生成AI模式查询:');
  const query = agent.generateSearchQuery(mockStrategy, 'food');
  
  // 验证API密钥
  if (!process.env.SCRAPINGDOG_API_KEY || process.env.SCRAPINGDOG_API_KEY === 'your_scrapingdog_api_key') {
    console.log('\n❌ Scrapingdog API密钥未配置');
    console.log('   请设置环境变量: SCRAPINGDOG_API_KEY=689e1eadbec7a9c318cc34e9');
    return;
  }
  
  console.log('\n✅ API密钥已配置');
  console.log('🔗 AI Mode API端点:', agent.scrapingdogBaseUrl);
  console.log('💰 成本分析:');
  console.log('   旧方式: 4查询 × 10credits = 40 credits');
  console.log('   AI模式: 1查询 × 10credits = 10 credits');
  console.log('   节省: 75% credits');
  
  // 如果需要，可以测试实际API调用
  const shouldTestAPI = process.argv.includes('--test-api');
  if (shouldTestAPI) {
    console.log('\n🧪 执行实际API测试...');
    try {
      const prospects = await agent.searchProspects(mockStrategy, 'food');
      console.log(`✅ 测试成功: 发现 ${prospects.length} 个潜在客户`);
      
      if (prospects.length > 0) {
        console.log('\n📧 找到的联系人样本:');
        prospects.slice(0, 3).forEach((prospect, i) => {
          console.log(`   ${i+1}. ${prospect.company} - ${prospect.email} (${prospect.email_type})`);
        });
      }
    } catch (error) {
      console.log(`❌ API测试失败: ${error.message}`);
    }
  } else {
    console.log('\n💡 运行 "SCRAPINGDOG_API_KEY=689e1eadbec7a9c318cc34e9 node test-scrapingdog-ai-mode.js --test-api" 执行实际API测试');
  }
}

testAIMode().then(() => {
  console.log('\n✅ AI Mode测试完成');
}).catch(console.error);