// 测试完整的LangGraph邮件编排器
const LangGraphEmailOrchestrator = require('./server/agents/LangGraphEmailOrchestrator');

async function testOrchestrator() {
  console.log('🚀 测试LangGraph邮件营销编排器');
  console.log('='.repeat(50));
  
  const orchestrator = new LangGraphEmailOrchestrator();
  
  // 测试配置
  const config = {
    targetWebsite: 'https://headai.io',
    businessType: 'tob',
    campaignGoal: 'generate leads',
    maxEmails: 5
  };
  
  try {
    // 启动完整工作流
    console.log('📋 工作流配置:', JSON.stringify(config, null, 2));
    
    const result = await orchestrator.startEmailMarketingWorkflow(config);
    
    if (result.success) {
      console.log('\n🎉 工作流成功完成!');
      console.log(`📊 会话ID: ${result.sessionId}`);
      console.log(`⏱️ 执行时间: ${result.executionTime}ms`);
      
      // 显示详细统计
      console.log('\n📈 工作流统计:');
      console.log(`   - 网站分析: ${result.data.website_analysis ? '✅ 完成' : '❌ 失败'}`);
      console.log(`   - 策略生成: ${result.data.strategy_generation ? '✅ 完成' : '❌ 失败'}`);
      console.log(`   - 潜客发现: ${result.data.lead_discovery?.totalFound || 0} 个邮件`);
      console.log(`   - 邮件验证: ${result.data.email_validation?.validEmails?.length || 0} 个有效`);
      console.log(`   - 内容生成: ${result.data.content_generation?.totalGenerated || 0} 个内容`);
      console.log(`   - 邮件发送: ${result.data.email_sending?.successful || 0} 个成功`);
      
      // 显示性能报告
      if (result.data.performance_tracking) {
        const perf = result.data.performance_tracking;
        console.log('\n📊 性能报告:');
        console.log(`   - 整体成功率: ${perf.overallSuccessRate}`);
        console.log(`   - 推荐建议: ${perf.recommendations.length} 条`);
        
        if (perf.recommendations.length > 0) {
          console.log('   推荐详情:');
          perf.recommendations.forEach((rec, i) => {
            console.log(`     ${i + 1}. ${rec}`);
          });
        }
      }
      
      console.log('\n✅ 系统运行正常，所有错误已修复!');
      
    } else {
      console.log('\n❌ 工作流失败:');
      console.log(`   错误: ${result.error}`);
      console.log(`   部分数据: ${Object.keys(result.partialData || {}).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testOrchestrator();