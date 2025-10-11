const axios = require('axios');

async function testFrontendSimulation() {
  console.log('=== 模拟前端用户操作测试 ===\n');
  
  // 模拟用户在前端填写的配置
  const userConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'promote product',
    businessType: 'toc', // 用户明确选择ToC
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'test@example.com',
      password: 'test_password',
      senderName: 'AI Marketing Team'
    }
  };
  
  console.log('📋 用户配置:');
  console.log('目标网站:', userConfig.targetWebsite);
  console.log('业务类型:', userConfig.businessType, '(ToC - 消费者导向)');
  console.log('营销目标:', userConfig.campaignGoal);
  
  try {
    // 启动本地Express服务器
    console.log('\n🚀 启动后端服务器...');
    const express = require('express');
    const cors = require('cors');
    const app = express();
    
    app.use(express.json());
    app.use(cors());
    
    // 加载路由
    const agentRoutes = require('./routes/agent');
    app.use('/api/agent', agentRoutes);
    
    const server = app.listen(3001, () => {
      console.log('✅ 后端服务器启动在 http://localhost:3001');
    });
    
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📡 模拟前端API调用...');
    
    // 1. 初始化AI代理 (模拟前端调用)
    const initResponse = await axios.post('http://localhost:3001/api/agent/initialize', userConfig);
    
    console.log('\n✅ 初始化响应:', initResponse.data);
    
    if (initResponse.data.success) {
      const strategy = initResponse.data.strategy;
      
      console.log('\n📊 检查AI生成的策略:');
      console.log('目标类型:', strategy.target_audience?.type);
      console.log('用户群体:', strategy.target_audience?.primary_segments);
      
      console.log('\n🔍 关键词分析:');
      const keywords = strategy.target_audience?.search_keywords || [];
      keywords.forEach((keyword, index) => {
        const length = keyword.length;
        const isLong = length > 20;
        const hasDesc = keyword.includes('：') || keyword.includes('。') || keyword.includes('，');
        const status = isLong || hasDesc ? '❌ 太长/有描述' : '✅ 合适';
        console.log(`  ${index + 1}. "${keyword}" (${length}字符) ${status}`);
      });
      
      // 2. 启动营销代理
      console.log('\n🚀 启动营销代理...');
      const startResponse = await axios.post('http://localhost:3001/api/agent/start');
      
      console.log('启动结果:', startResponse.data);
      
      // 等待一会让系统处理
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. 检查统计数据
      const statsResponse = await axios.get('http://localhost:3001/api/agent/stats');
      console.log('\n📈 最终统计:', statsResponse.data);
      
      if (statsResponse.data.discoveredProspects === 0) {
        console.log('\n❌ 问题确认：没有找到潜在客户');
        console.log('原因：AI仍在生成长关键词，需要修复');
      } else {
        console.log('\n✅ 系统正常工作');
      }
      
    } else {
      console.log('❌ 初始化失败:', initResponse.data);
    }
    
    server.close();
    
  } catch (error) {
    console.error('❌ 模拟测试失败:', error.message);
    if (error.response) {
      console.error('API错误:', error.response.data);
    }
  }
}

testFrontendSimulation().catch(console.error);