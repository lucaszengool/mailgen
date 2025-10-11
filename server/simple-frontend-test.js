/**
 * 简化前端模拟测试 - 使用内置模块测试API调用
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3333,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          resolve({ error: 'Invalid JSON response', body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testFrontendFlow() {
  console.log('🎭 模拟前端用户操作流程...\n');
  
  try {
    // 步骤1: 网站分析 (对应前端AgentSetupWizard第一步)
    console.log('🔍 步骤1: 网站分析');
    const analysisResult = await makeRequest('/api/agent/test/analyze-website', 'POST', {
      url: 'https://fruitai.org',
      goal: 'promote product',
      businessType: 'toc'
    });
    
    if (!analysisResult.success) {
      console.log('❌ 网站分析失败:', analysisResult.error);
      return;
    }
    
    console.log('✅ 网站分析成功');
    console.log('   公司:', analysisResult.companyName);
    
    // 步骤2: 配置代理
    console.log('\n⚙️  步骤2: 配置AI代理');
    await makeRequest('/api/agent/configure', 'POST', {
      targetWebsite: 'https://fruitai.org',
      campaignGoal: 'promote product',
      businessType: 'toc',
      smtpConfig: {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@example.com',
        password: 'testpass',
        senderName: 'FruitAI团队'
      }
    });
    
    // 步骤3: 启动代理
    console.log('🚀 步骤3: 启动AI代理');
    const startResult = await makeRequest('/api/agent/start', 'POST', {});
    
    if (!startResult.success) {
      console.log('❌ 启动失败:', startResult.error);
      return;
    }
    
    console.log('✅ AI代理启动成功');
    
    // 步骤4: 等待并获取策略
    console.log('\n⏳ 步骤4: 等待AI生成策略...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const strategyResult = await makeRequest('/api/agent/strategy');
    
    if (!strategyResult.success) {
      console.log('⚠️  策略尚未生成，再等待一下...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const retryResult = await makeRequest('/api/agent/strategy');
      if (!retryResult.success) {
        console.log('❌ 无法获取策略:', retryResult.error);
        return;
      }
      strategyResult.strategy = retryResult.strategy;
    }
    
    // 步骤5: 分析关键词
    console.log('📊 步骤5: 分析生成的关键词\n');
    
    const strategy = strategyResult.strategy;
    const keywords = strategy.target_audience?.search_keywords || [];
    
    console.log(`生成了 ${keywords.length} 个关键词:`);
    
    let goodCount = 0;
    keywords.forEach((keyword, i) => {
      const isGood = keyword.length <= 15 && !keyword.includes('：') && !keyword.includes('。') && !keyword.includes('，');
      console.log(`  ${i+1}. "${keyword}" (${keyword.length}字符) ${isGood ? '✅' : '❌'}`);
      if (isGood) goodCount++;
    });
    
    const successRate = Math.round((goodCount / keywords.length) * 100);
    console.log(`\n📈 结果: ${goodCount}/${keywords.length} 合格 (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('🎉 测试通过！前端修复成功');
    } else {
      console.log('⚠️  仍需优化');
    }
    
    // 停止代理
    await makeRequest('/api/agent/stop', 'POST', {});
    console.log('\n🛑 测试完成，代理已停止');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFrontendFlow();