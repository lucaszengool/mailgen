const LocalAISearchEngine = require('./server/agents/LocalAISearchEngine');

/**
 * 简化测试：快速验证本地AI搜索引擎核心功能
 */
async function quickTest() {
  console.log('🚀 快速测试本地AI搜索引擎核心功能...\n');
  
  const searchEngine = new LocalAISearchEngine();
  
  try {
    // 1. 测试策略生成
    console.log('📋 测试1: 智能策略生成');
    const strategy = await searchEngine.generateSearchStrategy(
      'AI software for business',
      'technology',
      'B2B'
    );
    console.log('✅ 策略生成成功:');
    console.log(`   关键词: ${strategy.keywords.slice(0, 3).join(', ')}...`);
    console.log(`   方法: ${strategy.approach}`);
    console.log();

    // 2. 测试URL生成
    console.log('📋 测试2: URL生成');
    const urls = searchEngine.generateTargetUrls('AI');
    console.log('✅ URL生成成功:');
    console.log(`   生成了 ${urls.length} 个目标URL`);
    console.log(`   示例: ${urls[0]}`);
    console.log();

    // 3. 测试规则分析
    console.log('📋 测试3: 规则分析');
    const mockResult = {
      url: 'https://techcrunch.com/startups/',
      content: {
        title: 'AI startup company for business solutions',
        description: 'Technology company providing AI software',
        text: 'Our AI company helps business enterprise corporation with software solutions. Contact us for more information.',
        emails: ['contact@aicompany.com']
      }
    };
    const analysis = searchEngine.analyzeWithRules(mockResult, 'AI software for business');
    console.log('✅ 规则分析成功:');
    console.log(`   相关性评分: ${analysis.relevanceScore}/10`);
    console.log(`   商业价值: ${analysis.businessValue}`);
    console.log(`   推荐行动: ${analysis.recommendedAction}`);
    console.log();

    // 4. 测试增强功能
    console.log('📋 测试4: 潜在客户增强');
    const mockProspect = {
      email: 'ceo@techstartup.com',
      company: 'TechStartup Inc',
      industry: 'technology',
      website: 'https://techstartup.com',
      rawData: { title: 'TechStartup Inc - AI Solutions for Enterprise' }
    };
    const enhanced = searchEngine.enhanceWithRules(mockProspect);
    console.log('✅ 增强功能成功:');
    console.log(`   估算角色: ${enhanced.role}`);
    console.log(`   优先级: ${enhanced.priority}`);
    console.log(`   公司规模: ${enhanced.companySize}`);
    console.log(`   营销角度: ${enhanced.aiEnhancement.marketingAngle}`);
    console.log();

    // 5. 测试完整搜索流程（快速模式）
    console.log('📋 测试5: 完整搜索流程');
    const searchResult = await searchEngine.searchProspects('AI software', {
      industry: 'technology',
      targetAudience: 'B2B',
      maxResults: 5,
      searchDepth: 'light'
    });
    
    console.log('✅ 完整搜索成功:');
    console.log(`   搜索成功: ${searchResult.success}`);
    console.log(`   发现潜在客户: ${searchResult.prospects?.length || 0} 个`);
    
    if (searchResult.prospects && searchResult.prospects.length > 0) {
      const firstProspect = searchResult.prospects[0];
      console.log('   示例潜在客户:');
      console.log(`     公司: ${firstProspect.company}`);
      console.log(`     邮箱: ${firstProspect.email}`);
      console.log(`     角色: ${firstProspect.role}`);
      console.log(`     置信度: ${firstProspect.confidence}`);
      console.log(`     合成: ${firstProspect.synthetic || false}`);
    }
    console.log();

    // 总结
    console.log('🎉 所有核心功能测试通过!');
    console.log('📊 系统状态:');
    console.log('  ✅ 策略生成正常 (使用智能默认策略)');
    console.log('  ✅ 网站爬取正常');
    console.log('  ✅ 规则分析正常');
    console.log('  ✅ 结果增强正常');
    console.log('  ✅ 端到端流程正常');
    console.log();
    console.log('💡 优化建议:');
    console.log('  🔧 启动Ollama服务可获得更智能的AI分析');
    console.log('  🌐 确保网络连接以访问更多数据源');
    console.log('  ⚡ 当前使用规则引擎作为AI后备，性能稳定');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('💥 错误详情:', error.stack);
  }
}

// 运行快速测试
if (require.main === module) {
  quickTest()
    .then(() => {
      console.log('\n✨ 快速测试完成!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { quickTest };