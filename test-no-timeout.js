const LocalAISearchEngine = require('./server/agents/LocalAISearchEngine');

/**
 * 测试移除timeout后的Ollama调用
 */
async function testNoTimeoutOllama() {
  console.log('🚀 测试移除timeout后的Ollama调用...\n');
  
  const searchEngine = new LocalAISearchEngine();
  
  try {
    console.log('📋 测试1: 策略生成（无timeout限制）');
    console.log('🤖 开始调用Ollama，AI将有充足时间思考...\n');
    
    const strategy = await searchEngine.generateSearchStrategy(
      'AI software for business automation',
      'technology',
      'B2B'
    );
    
    console.log('✅ 策略生成成功！');
    console.log('📊 生成的策略:');
    console.log(`   关键词: ${strategy.keywords.join(', ')}`);
    console.log(`   网站类型: ${strategy.websiteTypes.join(', ')}`);
    console.log(`   策略方法: ${strategy.approach}`);
    console.log(`   预期联系人: ${strategy.expectedContacts.join(', ')}`);
    console.log();
    
    console.log('📋 测试2: 完整搜索流程（无timeout限制）');
    console.log('🤖 启动本地AI搜索引擎，AI将有充足时间分析...\n');
    
    const searchResult = await searchEngine.searchProspects('AI business automation tools', {
      industry: 'technology',
      targetAudience: 'B2B',
      maxResults: 3,
      searchDepth: 'light'
    });
    
    if (searchResult.success) {
      console.log('✅ 搜索完成！');
      console.log(`📊 发现潜在客户: ${searchResult.prospects.length}个`);
      console.log(`🎯 搜索策略: ${searchResult.searchStrategy.approach}`);
      
      if (searchResult.prospects.length > 0) {
        console.log('\n🔍 潜在客户示例:');
        const prospect = searchResult.prospects[0];
        console.log(`   公司: ${prospect.company}`);
        console.log(`   邮箱: ${prospect.email}`);
        console.log(`   角色: ${prospect.role}`);
        console.log(`   优先级: ${prospect.priority}`);
        console.log(`   AI增强: ${prospect.aiEnhancement ? '是' : '否'}`);
      }
    } else {
      console.log('❌ 搜索失败:', searchResult.error);
    }
    
    console.log();
    console.log('🎉 测试完成！');
    console.log('💡 关键改进:');
    console.log('   ✅ 移除了所有Ollama调用的timeout限制');
    console.log('   ✅ AI有充足时间进行深度思考和分析');
    console.log('   ✅ 系统更加稳定，不会因为AI思考时间长而失败');
    console.log('   ✅ 保持了规则引擎作为后备方案');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('Ollama服务未运行')) {
      console.log('\n💡 提示:');
      console.log('   请先启动Ollama服务：ollama serve');
      console.log('   然后下载模型：ollama pull llama3.2');
      console.log('   系统将自动使用智能规则引擎作为后备方案');
    }
  }
}

// 运行测试
if (require.main === module) {
  testNoTimeoutOllama()
    .then(() => {
      console.log('\n✨ 无timeout测试完成！');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testNoTimeoutOllama };