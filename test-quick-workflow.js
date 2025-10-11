/**
 * 快速测试LangGraph工作流修复
 */

const axios = require('axios');

async function testQuickWorkflow() {
  console.log('🧪 测试修复后的LangGraph工作流...');
  
  try {
    const controller = new AbortController();
    
    // 15秒超时
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await axios.post('http://localhost:3000/api/agent/intelligent/start-campaign', {
      targetWebsite: "http://fruitai.org",
      campaignGoal: "promote product", 
      businessType: "toc"
    }, {
      signal: controller.signal,
      timeout: 15000
    });

    clearTimeout(timeoutId);
    
    console.log('✅ 工作流测试成功:');
    console.log('Status:', response.status);
    if (response.data) {
      console.log('结果:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log('❌ 工作流测试结果:', error.name === 'CanceledError' ? 'TIMEOUT (15s)' : error.message);
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误详情:', error.response.data);
    }
  }
}

testQuickWorkflow();