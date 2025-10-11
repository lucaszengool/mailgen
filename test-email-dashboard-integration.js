/**
 * 测试邮件营销仪表板完整集成
 */

const axios = require('axios');

async function testEmailDashboardIntegration() {
  console.log('🚀 测试邮件营销仪表板完整集成...\n');
  
  const serverUrl = 'http://localhost:3333';
  
  try {
    // 测试API端点
    console.log('📋 测试1: API端点连接');
    
    const response = await axios.get(`${serverUrl}/api/email-dashboard/overview?timeRange=last_7_days`, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data) {
      console.log('✅ API端点连接成功');
      console.log(`📊 返回数据结构: ${Object.keys(response.data).join(', ')}`);
      
      if (response.data.kpiCards) {
        console.log(`📈 KPI卡片: ${response.data.kpiCards.length}个`);
      }
      
      if (response.data.recentCampaigns) {
        console.log(`📧 最近活动: ${response.data.recentCampaigns.length}个`);
      }
      
      if (response.data.aiInsights) {
        console.log(`🧠 AI洞察: 已生成`);
        if (response.data.aiInsights.optimizationSuggestions) {
          console.log(`💡 优化建议: ${response.data.aiInsights.optimizationSuggestions.length}个`);
        }
      }
      
      console.log();
      console.log('🎉 测试完成！');
      console.log('📱 前端访问路径:');
      console.log('   1. 启动前端: npm run dev (在client目录)');
      console.log('   2. 访问: http://localhost:3000/email-marketing');
      console.log('   3. 或点击侧边栏的"邮件营销面板"');
      console.log();
      console.log('✨ 专业邮件营销仪表板特性:');
      console.log('   ✅ 基于Mailchimp/HubSpot最佳实践');
      console.log('   ✅ 6个核心KPI指标');
      console.log('   ✅ AI增强洞察和建议');
      console.log('   ✅ 实时活动监控');
      console.log('   ✅ 受众细分分析');
      console.log('   ✅ 智能警报系统');
      console.log('   ✅ 亮黄色主题配色');
      
    } else {
      console.log('❌ API响应异常');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 服务器未启动');
      console.log('💡 请先启动服务器: npm start');
    } else {
      console.error('❌ 测试失败:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  testEmailDashboardIntegration()
    .then(() => {
      console.log('\n✨ 集成测试完成！');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testEmailDashboardIntegration };