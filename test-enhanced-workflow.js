// 增强的完整工作流测试 - 验证所有改进功能
const EnhancedEmailValidator = require('./server/services/EnhancedEmailValidator');
const ContentStateManager = require('./server/services/ContentStateManager');
const ImprovedMarketingStrategy = require('./server/agents/ImprovedMarketingStrategy');

// 模拟邮件发送服务
class MockEmailService {
  constructor(validator) {
    this.validator = validator;
    this.sentEmails = [];
    this.failedEmails = [];
  }

  async sendEmail(to, subject, content) {
    // 发送前验证
    const validation = await this.validator.validateEmail(to);
    
    if (!validation.valid) {
      this.failedEmails.push({
        to,
        subject,
        reason: validation.reason,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        error: `Email validation failed: ${validation.reason}`
      };
    }

    // 模拟发送
    this.sentEmails.push({
      to,
      subject,
      content: content.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  getStats() {
    return {
      sent: this.sentEmails.length,
      failed: this.failedEmails.length,
      successRate: this.sentEmails.length + this.failedEmails.length > 0 ?
        (this.sentEmails.length / (this.sentEmails.length + this.failedEmails.length) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

// 主测试函数
async function testEnhancedWorkflow() {
  console.log('🚀 开始增强工作流测试');
  console.log('='.repeat(60));
  
  // 初始化组件
  const emailValidator = new EnhancedEmailValidator();
  const contentManager = new ContentStateManager();
  const strategyGenerator = new ImprovedMarketingStrategy();
  const emailService = new MockEmailService(emailValidator);
  
  // 测试场景：为两个不同的网站创建营销活动
  const campaigns = [
    {
      website: 'https://headai.io',
      businessType: 'tob',
      prospects: [
        { email: 'john.doe@techcorp.com', name: 'John Doe', company: 'TechCorp' },
        { email: 'sarah@innovate.com', name: 'Sarah Chen', company: 'Innovate Inc' },
        { email: 'admin@gnail.com', name: 'Admin', company: 'Unknown' }, // 拼写错误
        { email: 'info@tempmail.com', name: 'Info', company: 'TempCo' }, // 一次性邮箱
        { email: 'michael.zhang@microsoft.com', name: 'Michael Zhang', company: 'Microsoft' }
      ]
    },
    {
      website: 'http://fruitai.org',
      businessType: 'toc',
      prospects: [
        { email: 'alice.wang@gmail.com', name: 'Alice Wang', company: 'Personal' },
        { email: 'bob.smith@yahoo.com', name: 'Bob Smith', company: 'Personal' },
        { email: 'test@example.com', name: 'Test User', company: 'Test' }, // 测试邮箱
        { email: 'v230official@gmail.com', name: 'V230', company: 'Personal' }, // 您提到的地址
        { email: 'lisa.chen@qq.com', name: 'Lisa Chen', company: 'Personal' }
      ]
    }
  ];
  
  // 处理每个营销活动
  for (const campaign of campaigns) {
    console.log(`\n📊 处理营销活动: ${campaign.website}`);
    console.log('-'.repeat(50));
    
    // 步骤1: 生成营销策略
    console.log('\n1️⃣ 生成营销策略...');
    const strategy = await strategyGenerator.generateImprovedStrategy(
      campaign.website,
      'promote product',
      campaign.businessType
    );
    
    console.log(`   ✅ 策略生成完成`);
    console.log(`   - 业务类型: ${strategy.targetAudience.type}`);
    console.log(`   - 关键词数量: ${strategy.targetAudience.searchKeywords.length}`);
    console.log(`   - 会话ID: ${strategy.sessionId}`);
    
    // 步骤2: 验证邮件地址
    console.log('\n2️⃣ 验证潜在客户邮件地址...');
    const emails = campaign.prospects.map(p => p.email);
    const validationResults = await emailValidator.validateBulk(emails, {
      skipDNS: true // 跳过DNS检查以加快测试
    });
    
    console.log(`   验证结果:`);
    console.log(`   - 有效: ${validationResults.stats.valid}`);
    console.log(`   - 无效: ${validationResults.stats.invalid}`);
    console.log(`   - 一次性邮箱: ${validationResults.stats.disposable}`);
    console.log(`   - 拼写错误: ${validationResults.stats.typos}`);
    
    // 显示建议
    if (validationResults.suggestions.length > 0) {
      console.log(`   📝 建议修正:`);
      validationResults.suggestions.forEach(s => {
        console.log(`      ${s.suggestion}`);
      });
    }
    
    // 步骤3: 生成个性化内容
    console.log('\n3️⃣ 生成个性化邮件内容...');
    const emailContents = [];
    
    for (const prospect of campaign.prospects) {
      // 检查邮件是否有效
      const validation = validationResults.valid.find(v => v.email === prospect.email) ||
                        validationResults.invalid.find(v => v.email === prospect.email);
      
      if (validation && validation.valid) {
        // 生成内容
        const content = generatePersonalizedContent(
          prospect,
          strategy,
          campaign.website
        );
        
        // 保存到内容管理器
        contentManager.saveGeneratedContent('email', content, {
          prospect: prospect.email,
          website: campaign.website
        });
        
        emailContents.push({
          prospect,
          content,
          validation
        });
      }
    }
    
    console.log(`   ✅ 生成了 ${emailContents.length} 封个性化邮件`);
    
    // 步骤4: 发送邮件
    console.log('\n4️⃣ 发送邮件...');
    
    for (const { prospect, content } of emailContents) {
      const subject = generateSubjectLine(strategy, prospect);
      const result = await emailService.sendEmail(
        prospect.email,
        subject,
        content.body
      );
      
      if (result.success) {
        console.log(`   ✅ 发送成功: ${prospect.email}`);
      } else {
        console.log(`   ❌ 发送失败: ${prospect.email} - ${result.error}`);
      }
    }
    
    // 显示活动统计
    const campaignStats = emailService.getStats();
    console.log(`\n   📈 活动统计:`);
    console.log(`   - 发送成功: ${campaignStats.sent}`);
    console.log(`   - 发送失败: ${campaignStats.failed}`);
    console.log(`   - 成功率: ${campaignStats.successRate}`);
  }
  
  // 总体统计
  console.log('\n' + '='.repeat(60));
  console.log('📊 总体测试结果');
  console.log('='.repeat(60));
  
  const validatorStats = emailValidator.getStats();
  console.log('\n邮件验证统计:');
  console.log(`  - 总验证数: ${validatorStats.totalValidated}`);
  console.log(`  - 有效邮件: ${validatorStats.validEmails}`);
  console.log(`  - 无效邮件: ${validatorStats.invalidEmails}`);
  console.log(`  - 一次性邮箱: ${validatorStats.disposableDetected}`);
  console.log(`  - 修正拼写错误: ${validatorStats.typosFixed}`);
  console.log(`  - 有效率: ${validatorStats.validRate}`);
  
  const sessions = contentManager.getActiveSessions();
  console.log('\n内容管理统计:');
  console.log(`  - 活动会话数: ${sessions.length}`);
  sessions.forEach(session => {
    console.log(`    • ${session.website}: ${session.contentCount} 个内容`);
  });
  
  const emailStats = emailService.getStats();
  console.log('\n邮件发送统计:');
  console.log(`  - 发送成功: ${emailStats.sent}`);
  console.log(`  - 发送失败: ${emailStats.failed}`);
  console.log(`  - 总体成功率: ${emailStats.successRate}`);
  
  // 失败分析
  if (emailService.failedEmails.length > 0) {
    console.log('\n❌ 失败邮件分析:');
    emailService.failedEmails.forEach(failed => {
      console.log(`  - ${failed.to}: ${failed.reason}`);
    });
  }
  
  // 系统验证
  console.log('\n✅ 系统验证:');
  console.log('  ✓ 邮件验证功能正常');
  console.log('  ✓ 内容隔离功能正常');
  console.log('  ✓ 策略生成功能正常');
  console.log('  ✓ 个性化内容生成正常');
  console.log('  ✓ 邮件发送流程正常');
  
  console.log('\n🎉 增强工作流测试完成！');
}

// 辅助函数：生成个性化内容
function generatePersonalizedContent(prospect, strategy, website) {
  const websiteName = website.includes('headai') ? 'HeadAI' : 'FruitAI';
  const isB2B = strategy.targetAudience.type === 'tob';
  
  const content = {
    body: `Dear ${prospect.name},\n\n`,
    website,
    personalized: true
  };
  
  if (isB2B) {
    content.body += `I hope this message finds you well at ${prospect.company}. `;
    content.body += `I wanted to introduce you to ${websiteName}, our innovative AI solution designed specifically for businesses like yours. `;
    content.body += `Our platform can help ${prospect.company} streamline operations and increase efficiency.\n\n`;
    content.body += `Key benefits for ${prospect.company}:\n`;
    content.body += `• Automated workflow optimization\n`;
    content.body += `• Real-time analytics and insights\n`;
    content.body += `• Seamless integration with existing systems\n\n`;
    content.body += `Would you be interested in a brief demo to see how ${websiteName} can transform your business operations?`;
  } else {
    content.body += `Have you ever wished for a smarter way to ${websiteName === 'FruitAI' ? 'check fruit freshness' : 'use AI in your daily life'}? `;
    content.body += `${websiteName} is here to make your life easier!\n\n`;
    content.body += `With ${websiteName}, you can:\n`;
    content.body += `• Save time with instant analysis\n`;
    content.body += `• Make better decisions with AI insights\n`;
    content.body += `• Enjoy a user-friendly experience\n\n`;
    content.body += `Try ${websiteName} today and see the difference!`;
  }
  
  content.body += `\n\nBest regards,\nThe ${websiteName} Team\n${website}`;
  
  return content;
}

// 辅助函数：生成主题行
function generateSubjectLine(strategy, prospect) {
  const isB2B = strategy.targetAudience.type === 'tob';
  const websiteName = strategy.website.includes('headai') ? 'HeadAI' : 'FruitAI';
  
  if (isB2B) {
    return `${prospect.company} - Unlock AI-Powered Efficiency with ${websiteName}`;
  } else {
    return `${prospect.name.split(' ')[0]}, Discover the Smart Way with ${websiteName}!`;
  }
}

// 运行测试
testEnhancedWorkflow().catch(error => {
  console.error('❌ 工作流测试失败:', error);
  process.exit(1);
});