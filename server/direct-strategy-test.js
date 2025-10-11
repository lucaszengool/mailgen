/**
 * 直接测试MarketingStrategyAgent，验证ToC关键词生成
 */

const MarketingStrategyAgent = require('./agents/MarketingStrategyAgent');

async function testDirectStrategy() {
  console.log('🧪 直接测试MarketingStrategyAgent...\n');
  
  try {
    const agent = new MarketingStrategyAgent();
    
    // 模拟简化的业务分析数据
    const mockBusinessAnalysis = {
      url: 'https://fruitai.org',
      companyName: 'FruitAI',
      industry: { contentAnalysis: { title: 'AI-powered fruit freshness analyzer' } },
      mainProducts: [{ title: 'AI Fruit Freshness Detection' }],
      valueProposition: { 
        primaryContent: { 
          description: 'AI-powered fruit and vegetable freshness analyzer for smart grocery shopping' 
        } 
      }
    };
    
    console.log('📊 测试参数:');
    console.log('   网站: https://fruitai.org');
    console.log('   目标: promote product');
    console.log('   客户类型: toc (B2C个人客户)');
    console.log('   期望关键词: 买菜, 新鲜水果, 健康饮食 等短关键词\n');
    
    console.log('🤖 调用AI生成策略...');
    
    // 设置较短的超时来避免长时间等待
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI调用超时 (30秒)')), 30000)
    );
    
    const strategyPromise = agent.generateMarketingStrategy(
      'https://fruitai.org',
      'promote product',
      mockBusinessAnalysis,
      'toc'  // 明确指定ToC
    );
    
    const result = await Promise.race([strategyPromise, timeoutPromise]);
    
    if (result.success) {
      console.log('✅ AI策略生成成功！\n');
      
      const strategy = result.strategy;
      const keywords = strategy.target_audience?.search_keywords || [];
      
      console.log('📋 生成的策略分析:');
      console.log('   业务理解:', strategy.business_understanding || '未生成');
      console.log('   目标受众类型:', strategy.target_audience?.type || '未指定');
      console.log('   用户群体:', strategy.target_audience?.primary_segments?.slice(0, 2) || '未指定');
      
      console.log(`\n🔍 关键词详细分析 (共 ${keywords.length} 个):`);
      
      if (keywords.length === 0) {
        console.log('❌ 没有生成关键词！');
        return;
      }
      
      let goodCount = 0;
      let problemCount = 0;
      
      keywords.forEach((keyword, index) => {
        const length = keyword.length;
        const hasProblems = keyword.includes('：') || keyword.includes('。') || keyword.includes('，') || 
                           keyword.includes('特别是') || keyword.includes('企业') || length > 15;
        
        console.log(`   ${index + 1}. "${keyword}"`);
        console.log(`      长度: ${length} 字符`);
        console.log(`      状态: ${hasProblems ? '❌ 有问题' : '✅ 合适'}`);
        
        if (hasProblems) {
          problemCount++;
          const problems = [];
          if (length > 15) problems.push('太长');
          if (keyword.includes('：') || keyword.includes('。') || keyword.includes('，')) {
            problems.push('包含标点符号');
          }
          if (keyword.includes('企业') || keyword.includes('决策者')) {
            problems.push('错误定位企业客户');
          }
          console.log(`      问题: ${problems.join(', ')}`);
        } else {
          goodCount++;
        }
        console.log('');
      });
      
      const successRate = Math.round((goodCount / keywords.length) * 100);
      console.log('📊 测试结果总结:');
      console.log(`   ✅ 合格关键词: ${goodCount} 个`);
      console.log(`   ❌ 问题关键词: ${problemCount} 个`);
      console.log(`   📈 成功率: ${successRate}%\n`);
      
      // 检查是否正确理解ToC
      const hasToC = keywords.some(k => 
        k.includes('买菜') || k.includes('水果') || k.includes('超市') || 
        k.includes('健康') || k.includes('食物') || k.includes('新鲜')
      );
      
      const hasToBErrors = keywords.some(k => 
        k.includes('企业') || k.includes('决策者') || k.includes('商务')
      );
      
      console.log('🎯 ToC定位检查:');
      console.log(`   ✅ 包含消费者关键词: ${hasToC ? '是' : '否'}`);
      console.log(`   ❌ 错误包含企业关键词: ${hasToBErrors ? '是' : '否'}`);
      
      if (successRate >= 80 && hasToC && !hasToBErrors) {
        console.log('\n🎉 测试完全通过！');
        console.log('   - AI正确理解了ToC客户需求');
        console.log('   - 生成了适合搜索的短关键词');
        console.log('   - 针对个人消费者而非企业客户');
        console.log('   - 前端问题已完全修复！');
      } else if (successRate >= 50) {
        console.log('\n⚠️  测试部分通过，仍有改进空间');
        console.log('   - 关键词质量基本达标');
        console.log('   - 但可能仍需要进一步优化');
      } else {
        console.log('\n❌ 测试失败！');
        console.log('   - AI仍在生成长描述或企业关键词');
        console.log('   - 需要进一步优化提示词');
      }
      
    } else {
      console.log('❌ AI策略生成失败');
      console.log('错误:', result.error);
    }
    
  } catch (error) {
    if (error.message.includes('超时')) {
      console.log('⏰ AI调用超时 - Ollama可能响应缓慢');
      console.log('建议检查Ollama服务状态或重启服务');
    } else {
      console.log('❌ 测试失败:', error.message);
    }
  }
}

console.log('🧪 MarketingStrategyAgent ToC关键词生成测试\n');
testDirectStrategy().then(() => {
  console.log('\n✅ 测试完成');
}).catch(console.error);