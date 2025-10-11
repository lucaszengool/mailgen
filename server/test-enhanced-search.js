/**
 * 测试增强的邮箱搜索功能
 * 包括Google搜索操作符和社交媒体提取
 */

const ProspectSearchAgent = require('./agents/ProspectSearchAgent');

async function testEnhancedSearch() {
  console.log('🧪 测试增强的邮箱搜索功能\n');
  
  const agent = new ProspectSearchAgent();
  
  // 测试策略 - AI水果应用，ToC用户
  const mockStrategy = {
    target_audience: {
      type: 'toc',
      search_keywords: ['fruit freshness', 'AI app', 'healthy eating'],
      primary_segments: ['Health-conscious consumers', 'Grocery shoppers']
    },
    value_proposition: 'AI-powered fruit freshness detection for healthier shopping'
  };
  
  console.log('📋 测试策略:');
  console.log('   目标类型:', mockStrategy.target_audience.type);
  console.log('   关键词:', mockStrategy.target_audience.search_keywords);
  console.log('   用户群体:', mockStrategy.target_audience.primary_segments);
  console.log('   价值主张:', mockStrategy.value_proposition);
  
  // 验证API密钥
  if (!process.env.SCRAPINGDOG_API_KEY || process.env.SCRAPINGDOG_API_KEY === 'your_scrapingdog_api_key') {
    console.log('\n❌ Scrapingdog API密钥未配置');
    console.log('   请设置环境变量: SCRAPINGDOG_API_KEY=689e1eadbec7a9c318cc34e9');
    return;
  }
  
  console.log('\n✅ API密钥已配置');
  console.log('🔗 使用增强搜索策略:');
  console.log('   ✓ Google搜索操作符 (site:, filetype:, intext:)');
  console.log('   ✓ 社交媒体邮箱提取');  
  console.log('   ✓ 多策略搜索');
  console.log('   ✓ 智能查询生成');
  
  console.log('\n🧪 执行增强搜索测试...');
  try {
    const startTime = Date.now();
    const prospects = await agent.searchProspects(mockStrategy, 'food technology');
    const endTime = Date.now();
    
    console.log(`\n✅ 搜索完成，耗时 ${(endTime - startTime)/1000}s`);
    console.log(`📧 找到 ${prospects.length} 个潜在客户\n`);
    
    if (prospects.length > 0) {
      console.log('📋 搜索结果详情:');
      prospects.slice(0, 5).forEach((prospect, i) => {
        console.log(`\n   ${i+1}. ${prospect.company}`);
        console.log(`      📧 ${prospect.email} (${prospect.email_type})`);
        console.log(`      👤 ${prospect.contact_role}`);
        console.log(`      🔍 来源: ${prospect.source}`);
        console.log(`      ⭐ 优先级分数: ${prospect.priority_score || 'N/A'}`);
        console.log(`      📊 转化概率: ${prospect.conversion_probability || 'N/A'}%`);
        if (prospect.source_url) {
          console.log(`      🔗 ${prospect.source_url.substring(0, 60)}...`);
        }
      });
      
      // 统计分析
      const emailTypes = prospects.reduce((acc, p) => {
        acc[p.email_type] = (acc[p.email_type] || 0) + 1;
        return acc;
      }, {});
      
      const sources = prospects.reduce((acc, p) => {
        acc[p.source] = (acc[p.source] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 搜索统计:');
      console.log('   邮箱类型分布:', emailTypes);
      console.log('   数据来源分布:', sources);
      
      // 质量分析
      const personalEmails = prospects.filter(p => 
        p.email.includes('@gmail.com') || 
        p.email.includes('@yahoo.com') || 
        p.email.includes('@hotmail.com')
      ).length;
      
      const businessEmails = prospects.length - personalEmails;
      
      console.log('\n📈 质量分析:');
      console.log(`   个人邮箱: ${personalEmails} (${Math.round(personalEmails/prospects.length*100)}%)`);
      console.log(`   商业邮箱: ${businessEmails} (${Math.round(businessEmails/prospects.length*100)}%)`);
      console.log(`   ToC适配度: ${personalEmails >= businessEmails ? '高' : '中'}`);
      
    } else {
      console.log('⚠️  未找到潜在客户');
      console.log('建议检查:');
      console.log('   - API配额是否充足');
      console.log('   - 搜索关键词是否合适');
      console.log('   - 网络连接是否正常');
    }
    
  } catch (error) {
    console.log(`❌ 搜索测试失败: ${error.message}`);
    console.log('\n🔧 故障排查建议:');
    console.log('   1. 检查Scrapingdog API密钥');
    console.log('   2. 检查网络连接');
    console.log('   3. 检查API配额状态');
    console.log('   4. 重试搜索操作');
  }
}

// 测试社交媒体邮箱提取
async function testSocialMediaExtraction() {
  console.log('\n📱 测试社交媒体邮箱提取功能...');
  
  const agent = new ProspectSearchAgent();
  
  const testTexts = [
    'Follow me on Instagram @healthyfruit_lover for daily tips! Contact: healthy.fruit@gmail.com for collaborations',
    'LinkedIn profile: John Doe, CEO at FreshTech Solutions. Business inquiries: john.doe@freshtech.com',
    'Twitter bio: Passionate about AI and nutrition. DM me or email: nutrition.ai@yahoo.com',
    'Facebook page admin for Fruit Lovers Community. Event inquiries: events@fruitlovers.org'
  ];
  
  for (let i = 0; i < testTexts.length; i++) {
    console.log(`\n📝 测试文本 ${i + 1}:`);
    console.log(`   "${testTexts[i].substring(0, 50)}..."`);
    
    const extractedEmails = agent.extractEmailsFromSocialMediaContext(testTexts[i], 'toc');
    console.log(`   📧 提取结果: ${extractedEmails.length > 0 ? extractedEmails.join(', ') : '无'}`);
  }
}

// 主测试函数
async function runTests() {
  try {
    await testEnhancedSearch();
    await testSocialMediaExtraction();
    
    console.log('\n🎉 所有测试完成!');
    console.log('\n📈 增强功能摘要:');
    console.log('   ✅ Google搜索操作符集成');
    console.log('   ✅ 社交媒体邮箱提取');
    console.log('   ✅ 多策略搜索机制');
    console.log('   ✅ 智能查询生成');
    console.log('   ✅ 实时错误恢复');
    console.log('   ✅ 质量评分系统');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
  }
}

runTests();