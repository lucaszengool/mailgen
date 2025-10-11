const ComprehensiveEmailAgent = require('./agents/ComprehensiveEmailAgent');

async function testFinalWorkflow() {
  console.log('=== 最终工作流程测试 ===\n');
  
  // 配置测试参数
  const config = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'promote product',
    businessType: 'toc', // 明确指定为消费者导向
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'test@example.com',
      password: 'test_password'
    }
  };
  
  console.log('📋 测试配置:');
  console.log('目标网站:', config.targetWebsite);
  console.log('目标客户:', config.businessType, '(消费者导向)');
  
  try {
    console.log('\n🚀 初始化全面的AI邮件营销系统...');
    const agent = new ComprehensiveEmailAgent();
    
    const initResult = await agent.initialize(config);
    
    if (initResult.success) {
      console.log('\n✅ 系统初始化成功');
      console.log('SMTP状态:', initResult.smtp_status);
      
      console.log('\n📊 生成的营销策略分析:');
      const strategy = initResult.strategy;
      if (strategy) {
        console.log('业务理解:', strategy.business_understanding?.core_product);
        console.log('目标受众类型:', strategy.target_audience?.type);
        console.log('主要用户群体:', strategy.target_audience?.primary_segments);
        
        console.log('\n🔍 搜索关键词质量分析:');
        const keywords = strategy.target_audience?.search_keywords || [];
        if (keywords.length > 0) {
          keywords.forEach((keyword, index) => {
            const length = keyword.length;
            const isGoodLength = length <= 15;
            const hasProblematicChars = keyword.includes('：') || keyword.includes('。') || keyword.includes(',');
            const status = isGoodLength && !hasProblematicChars ? '✅' : '⚠️';
            console.log(`  ${index + 1}. "${keyword}" (${length}字符) ${status}`);
          });
          
          const goodKeywords = keywords.filter(k => k.length <= 15 && !k.includes('：') && !k.includes('。'));
          console.log(`\n✅ 合格关键词: ${goodKeywords.length}/${keywords.length}`);
          
          if (goodKeywords.length >= keywords.length * 0.7) {
            console.log('🎯 关键词质量: 优秀！');
          } else {
            console.log('🔄 关键词质量: 需要进一步优化');
          }
        } else {
          console.log('❌ 没有生成搜索关键词');
        }
        
        console.log('\n🚀 启动营销代理...');
        const startResult = await agent.start();
        
        if (startResult.success) {
          console.log('✅ 营销代理启动成功');
          
          // 等待一会儿让系统处理
          setTimeout(async () => {
            const stats = agent.getStats();
            console.log('\n📈 最终统计:');
            console.log('发现潜在客户:', stats.discoveredProspects);
            console.log('排队邮件:', stats.queuedEmails);
            console.log('自动回复状态:', stats.autoReplyEnabled);
            
            await agent.stop();
            console.log('\n🏁 测试完成！');
            
            if (stats.discoveredProspects > 0) {
              console.log('🎉 成功：系统找到了相关的潜在客户');
            } else {
              console.log('⚠️ 注意：没有找到潜在客户，可能需要进一步优化');
            }
          }, 5000);
          
        } else {
          console.log('❌ 营销代理启动失败:', startResult.error);
        }
        
      } else {
        console.log('❌ 没有生成营销策略');
      }
      
    } else {
      console.log('❌ 系统初始化失败');
    }
    
  } catch (error) {
    console.error('❌ 工作流程测试失败:', error.message);
  }
}

console.log('⏰ 注意：完整测试可能需要几分钟...\n');
testFinalWorkflow().catch(console.error);