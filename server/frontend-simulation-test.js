/**
 * 前端模拟测试 - 完全模拟用户在前端界面的操作流程
 * 
 * 模拟用户流程:
 * 1. 输入网站 fruitai.org
 * 2. 选择营销目标 'promote product'  
 * 3. 选择目标客户类型 'toc' (B2C个人客户)
 * 4. 点击"下一步"触发网站分析
 * 5. 验证返回的策略是否生成短关键词
 */

// Use built-in fetch (Node.js 18+) or add polyfill
const fetch = globalThis.fetch || require('node-fetch').default;

const SERVER_URL = 'http://localhost:3333';

async function simulateFrontendUserFlow() {
  console.log('🎭 开始模拟真实用户前端操作流程...\n');
  
  try {
    // 步骤1: 模拟用户在AgentSetupWizard第一步的操作
    console.log('👤 用户操作: 在前端填写配置信息');
    console.log('   - 网站: https://fruitai.org');
    console.log('   - 营销目标: promote product (推广产品)');
    console.log('   - 目标客户: toc (B2C个人客户)');
    console.log('   - 点击"下一步"按钮...\n');
    
    // 步骤2: 调用与AgentSetupWizard.jsx中analyzeWebsite()相同的API
    console.log('🔍 触发网站分析 (调用 /api/agent/test/analyze-website)...');
    
    const analysisResponse = await fetch(`${SERVER_URL}/api/agent/test/analyze-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: 'https://fruitai.org',
        goal: 'promote product',
        businessType: 'toc'
      })
    });
    
    const analysisResult = await analysisResponse.json();
    
    if (!analysisResult.success) {
      console.log('❌ 网站分析失败:', analysisResult.error);
      return;
    }
    
    console.log('✅ 网站分析成功!');
    console.log('   检测到公司:', analysisResult.companyName);
    
    // 步骤3: 模拟用户继续到第三步，点击"启动AI代理"
    console.log('\n👤 用户操作: 继续到第三步，点击"启动AI代理"');
    
    // 先配置agent (对应AgentSetupWizard的completeSetup方法)
    console.log('⚙️  配置AI代理...');
    await fetch(`${SERVER_URL}/api/agent/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetWebsite: 'https://fruitai.org',
        campaignGoal: 'promote product',
        businessType: 'toc',
        smtpConfig: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          username: 'test@example.com',
          password: 'testpass',
          senderName: 'FruitAI团队'
        }
      })
    });
    
    // 启动AI代理 (对应AgentSetupWizard的completeSetup方法)
    console.log('🚀 启动AI代理...\n');
    const startResponse = await fetch(`${SERVER_URL}/api/agent/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const startResult = await startResponse.json();
    
    if (!startResult.success) {
      console.log('❌ 启动代理失败:', startResult.error);
      return;
    }
    
    console.log('✅ AI代理启动成功!');
    
    // 步骤4: 等待一段时间让AI代理生成策略
    console.log('⏳ 等待AI代理生成营销策略 (5秒)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤5: 获取生成的营销策略
    console.log('📋 获取生成的营销策略...\n');
    const strategyResponse = await fetch(`${SERVER_URL}/api/agent/strategy`);
    const strategyResult = await strategyResponse.json();
    
    if (!strategyResult.success) {
      console.log('⚠️  营销策略尚未生成，继续等待...');
      // 再等待5秒
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const retryResponse = await fetch(`${SERVER_URL}/api/agent/strategy`);
      const retryResult = await retryResponse.json();
      
      if (!retryResult.success) {
        console.log('❌ 无法获取营销策略');
        return;
      }
      
      strategyResult.strategy = retryResult.strategy;
    }
    
    // 步骤6: 分析关键词质量 - 这是用户最关心的部分！
    console.log('🔍 分析生成的关键词质量...\n');
    
    const strategy = strategyResult.strategy;
    console.log('📊 完整策略分析:');
    console.log('   业务理解:', strategy.business_understanding || '未生成');
    console.log('   目标受众类型:', strategy.target_audience?.type || '未指定');
    console.log('   用户群体:', strategy.target_audience?.primary_segments || '未指定');
    
    const keywords = strategy.target_audience?.search_keywords || [];
    
    console.log('\n🎯 关键词详细分析:');
    console.log(`   共生成 ${keywords.length} 个关键词\n`);
    
    if (keywords.length === 0) {
      console.log('❌ 未生成任何关键词！');
      return;
    }
    
    let goodKeywords = 0;
    let problemKeywords = 0;
    
    keywords.forEach((keyword, index) => {
      const length = keyword.length;
      const hasProblems = keyword.includes('：') || keyword.includes('。') || keyword.includes('，') || length > 15;
      
      console.log(`   ${index + 1}. "${keyword}"`);
      console.log(`      长度: ${length} 字符`);
      console.log(`      状态: ${hasProblems ? '❌ 有问题' : '✅ 合适'}`);
      
      if (hasProblems) {
        problemKeywords++;
        const problems = [];
        if (length > 15) problems.push('太长');
        if (keyword.includes('：') || keyword.includes('。') || keyword.includes('，')) {
          problems.push('包含描述文字');
        }
        console.log(`      问题: ${problems.join(', ')}`);
      } else {
        goodKeywords++;
      }
      console.log('');
    });
    
    // 步骤7: 总结测试结果
    console.log('📈 测试结果总结:');
    console.log(`   ✅ 合格关键词: ${goodKeywords} 个`);
    console.log(`   ❌ 问题关键词: ${problemKeywords} 个`);
    console.log(`   📊 成功率: ${Math.round((goodKeywords / keywords.length) * 100)}%\n`);
    
    if (goodKeywords >= keywords.length * 0.8) {
      console.log('🎉 测试通过！ 关键词质量达标');
      console.log('   - 生成的关键词适合搜索');
      console.log('   - 针对ToC用户的关键词策略正确');
      console.log('   - 前端修复成功！');
    } else if (goodKeywords >= keywords.length * 0.5) {
      console.log('⚠️  测试部分通过，仍有改进空间');
      console.log('   - 大部分关键词质量良好');
      console.log('   - 建议进一步优化提示词');
    } else {
      console.log('❌ 测试失败！ 关键词质量不达标');
      console.log('   - 生成的关键词不适合搜索');
      console.log('   - 需要继续优化AI提示词');
    }
    
    // 步骤8: 停止代理
    console.log('\n🛑 停止AI代理...');
    await fetch(`${SERVER_URL}/api/agent/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ 前端模拟测试完成！');
    
  } catch (error) {
    console.error('❌ 前端模拟测试失败:', error.message);
  }
}

// 运行测试
console.log('🧪 前端用户操作模拟测试');
console.log('目标：验证用户在前端界面操作后是否能生成短关键词\n');
simulateFrontendUserFlow().catch(console.error);