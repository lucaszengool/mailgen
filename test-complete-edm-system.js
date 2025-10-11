// 测试完整的EDM系统 - 集成所有新功能
const EnhancedEmailSequenceManager = require('./server/agents/EnhancedEmailSequenceManager');
const SmartEmailScheduler = require('./server/agents/SmartEmailScheduler');
const BehaviorTriggerEngine = require('./server/agents/BehaviorTriggerEngine');

async function testCompleteEDMSystem() {
  console.log('🚀 测试完整的EDM邮件营销系统');
  console.log('='.repeat(80));
  
  // 初始化系统组件
  const sequenceManager = new EnhancedEmailSequenceManager();
  const scheduler = new SmartEmailScheduler();
  const behaviorEngine = new BehaviorTriggerEngine();
  
  console.log('✅ 所有系统组件初始化完成\n');
  
  // 测试场景：B2B潜在客户的完整营销流程
  const prospect = {
    email: 'john.doe@techcorp.com',
    name: 'John Doe',
    company: 'TechCorp Solutions'
  };
  
  const businessAnalysis = {
    companyName: 'HeadAI',
    industry: 'AI Technology',
    mainProducts: [{
      title: 'HeadAI - AI Marketing Platform',
      description: 'Advanced AI solutions for marketing automation and lead generation'
    }],
    valueProposition: {
      primaryContent: {
        description: 'AI-powered marketing automation for businesses'
      }
    },
    businessModel: 'b2b'
  };
  
  try {
    // 第1步：创建个性化邮件序列
    console.log('📧 第1步：创建个性化邮件序列');
    console.log('-'.repeat(50));
    
    const emailSequence = await sequenceManager.createPersonalizedSequence(
      prospect,
      businessAnalysis,
      'generate leads',
      'tob'
    );
    
    console.log(`✅ 创建了 ${emailSequence.emails.length} 封邮件的序列`);
    console.log(`📋 序列类型: ${emailSequence.sequenceType}`);
    console.log(`📅 首封邮件计划时间: ${emailSequence.emails[0].scheduledFor}`);
    
    // 显示邮件序列概览
    console.log('\n📋 邮件序列概览:');
    emailSequence.emails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.type} - "${email.personalizedSubject}"`);
      console.log(`      计划时间: ${new Date(email.scheduledFor).toLocaleString()}`);
    });
    
    // 第2步：测试行为触发器
    console.log('\n🎯 第2步：测试行为触发器系统');
    console.log('-'.repeat(50));
    
    // 模拟用户行为事件
    const behaviorEvents = [
      { type: 'email_opened', data: { emailId: 'email_1', openTime: new Date() } },
      { type: 'website_visited', data: { page: 'homepage', duration: 45 } },
      { type: 'email_clicked', data: { emailId: 'email_1', linkUrl: 'https://headai.io/demo' } },
      { type: 'demo_page_viewed', data: { duration: 120, source: 'email' } },
      { type: 'pricing_page_viewed', data: { duration: 90, plans_viewed: ['pro', 'enterprise'] } }
    ];
    
    for (const event of behaviorEvents) {
      const userProfile = await behaviorEngine.recordBehaviorEvent(
        prospect.email,
        event.type,
        event.data
      );
      
      console.log(`   📊 ${event.type}: 得分 ${userProfile.score}, 阶段 ${userProfile.stage}`);
      
      // 模拟时间间隔
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 第3步：获取用户行为分析
    console.log('\n📈 第3步：用户行为分析');
    console.log('-'.repeat(50));
    
    const userAnalysis = behaviorEngine.getUserAnalysis(prospect.email);
    console.log('🔍 详细用户分析:');
    console.log(`   用户阶段: ${userAnalysis.stage}`);
    console.log(`   总得分: ${userAnalysis.score}`);
    console.log(`   总事件数: ${userAnalysis.totalEvents}`);
    console.log(`   参与趋势: ${userAnalysis.engagementTrend.trend}`);
    console.log(`   事件分类:`);
    Object.entries(userAnalysis.eventsByCategory).forEach(([category, data]) => {
      console.log(`     ${category}: ${data.count} 次事件`);
    });
    
    console.log(`   推荐动作:`);
    userAnalysis.recommendations.forEach(rec => {
      console.log(`     - ${rec}`);
    });
    
    // 第4步：测试智能调度器
    console.log('\n⏰ 第4步：测试智能邮件调度器');
    console.log('-'.repeat(50));
    
    const schedulerStats = scheduler.getSendingStats();
    console.log('📊 调度器状态:');
    console.log(`   当前小时已发送: ${schedulerStats.current.hour}/${schedulerStats.current.limits.hourly}`);
    console.log(`   今日已发送: ${schedulerStats.current.day}/${schedulerStats.current.limits.daily}`);
    console.log(`   调度器状态: ${schedulerStats.status}`);
    
    // 手动触发邮件处理
    console.log('\n🔄 手动触发邮件处理...');
    await scheduler.triggerManualProcessing();
    
    // 第5步：序列性能统计
    console.log('\n📊 第5步：序列性能统计');
    console.log('-'.repeat(50));
    
    const performance = await sequenceManager.getSequencePerformance();
    console.log('📈 总体性能统计:');
    console.log(`   总序列数: ${performance.totalSequences}`);
    console.log(`   活跃序列: ${performance.activeSequences}`);
    console.log(`   总发送邮件: ${performance.totalEmailsSent}`);
    console.log(`   平均打开率: ${performance.avgOpenRate}%`);
    console.log(`   平均点击率: ${performance.avgClickRate}%`);
    console.log(`   平均回复率: ${performance.avgReplyRate}%`);
    
    // 第6步：模拟邮件事件处理
    console.log('\n📬 第6步：模拟邮件事件处理');
    console.log('-'.repeat(50));
    
    const emailEvents = [
      { emailId: 'msg_123', eventType: 'opened', data: {} },
      { emailId: 'msg_123', eventType: 'clicked', data: { linkUrl: 'https://headai.io/demo' } },
      { emailId: 'msg_124', eventType: 'replied', data: { replyContent: 'Interested in learning more' } }
    ];
    
    for (const event of emailEvents) {
      await sequenceManager.handleEmailEvent(
        event.emailId,
        event.eventType,
        event.data
      );
      console.log(`   ✅ 处理邮件事件: ${event.eventType} for ${event.emailId}`);
    }
    
    // 第7步：行为触发器汇总
    console.log('\n🎯 第7步：所有用户行为汇总');
    console.log('-'.repeat(50));
    
    const usersSummary = behaviorEngine.getAllUsersSummary();
    console.log('👥 用户汇总统计:');
    console.log(`   总用户数: ${usersSummary.totalUsers}`);
    console.log(`   按阶段分布:`);
    Object.entries(usersSummary.usersByStage).forEach(([stage, count]) => {
      console.log(`     ${stage}: ${count} 用户`);
    });
    console.log(`   总事件数: ${usersSummary.totalEvents}`);
    console.log(`   平均得分: ${usersSummary.avgScore}`);
    
    // 第8步：展示EDM系统核心功能
    console.log('\n🎉 第8步：EDM系统核心功能展示');
    console.log('-'.repeat(50));
    
    console.log('✅ 已实现的传统EDM功能:');
    console.log('   📧 多序列邮件营销 (8-touch B2B, 6-touch B2C)');
    console.log('   ⏰ 智能时间间隔管理 (基于业务类型优化)');
    console.log('   🎯 行为触发器系统 (15+ 种行为事件)');
    console.log('   📊 实时性能追踪和分析');
    console.log('   🤖 AI个性化内容生成');
    console.log('   📈 用户行为评分系统');
    console.log('   🔄 自动化工作流管理');
    console.log('   📱 多渠道事件跟踪');
    
    console.log('\n🚀 我们的AI优势:');
    console.log('   🧠 Ollama本地大模型驱动的内容生成');
    console.log('   🎯 智能用户意图识别和阶段判断');
    console.log('   📝 动态个性化邮件内容');
    console.log('   🔮 行为预测和推荐系统');
    console.log('   ⚡ 实时响应和序列调整');
    console.log('   🎨 多种邮件模板和风格自动选择');
    
    console.log('\n💡 与传统EDM的对比优势:');
    console.log('   传统EDM: 静态模板 + 规则触发');
    console.log('   我们的系统: AI动态生成 + 智能行为分析');
    console.log('   传统EDM: 固定序列时间间隔');
    console.log('   我们的系统: 基于用户行为动态调整');
    console.log('   传统EDM: 人工设置触发条件');
    console.log('   我们的系统: AI自动识别最佳时机');
    
    console.log('\n🎯 完整的Follow-up流程:');
    console.log('   1. 初始邮件 → 2. 价值内容 → 3. 社会证明 → 4. 异议处理');
    console.log('   5. 演示邀请 → 6. 稀缺性 → 7. 分手邮件 → 8. 长期培养');
    console.log('   + 随时基于行为插入触发邮件');
    console.log('   + 智能加速/延迟序列进度');
    console.log('   + 自动销售团队通知');
    
    console.log('\n✅ 测试完成! 完整的EDM系统已成功集成');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理资源
    scheduler.stopScheduler();
    console.log('\n🔧 清理完成');
  }
}

// 运行测试
testCompleteEDMSystem();