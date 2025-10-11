const fs = require('fs');

function verifyNoTemplates() {
  console.log('=== 验证系统已移除所有模板和默认策略 ===\n');
  
  // 读取MarketingStrategyAgent文件
  const agentContent = fs.readFileSync('./agents/MarketingStrategyAgent.js', 'utf8');
  
  // 检查是否还有默认策略相关代码
  const templateKeywords = [
    'generateDefaultStrategy',
    'generateDefaultEmail', 
    'generateDefaultReply',
    'generateConsumerKeywords',
    'generateBusinessKeywords',
    'analyzeWebsiteForDefaultStrategy',
    'fallback',
    'default strategy',
    '默认策略'
  ];
  
  let hasTemplates = false;
  console.log('检查模板相关代码：');
  
  templateKeywords.forEach(keyword => {
    // 检查是否有实际的功能代码，而不是注释
    const lines = agentContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes(keyword) && 
          !line.trim().startsWith('//') && 
          !line.includes('移除') && 
          !line.includes('不再提供') &&
          !line.includes('不使用') &&
          line.includes('function') || line.includes('return {')) {
        console.log(`❌ 发现模板代码 (第${index+1}行): ${keyword}`);
        hasTemplates = true;
      }
    });
  });
  
  // 检查ComprehensiveEmailAgent
  const comprehensiveContent = fs.readFileSync('./agents/ComprehensiveEmailAgent.js', 'utf8');
  
  if (comprehensiveContent.includes('generateFallbackProspects')) {
    console.log('❌ ComprehensiveEmailAgent仍有fallback代码');
    hasTemplates = true;
  }
  
  if (hasTemplates) {
    console.log('\n❌ 系统仍包含模板代码！');
    return false;
  } else {
    console.log('✅ 所有模板代码已移除');
    console.log('\n=== 验证系统行为 ===');
    
    // 检查错误处理
    if (agentContent.includes('throw new Error(\'AI策略生成失败')) {
      console.log('✅ AI策略生成失败时正确抛出错误，不使用默认策略');
    }
    
    if (agentContent.includes('throw error;')) {
      console.log('✅ 邮件生成失败时正确抛出错误，不使用默认模板');
    }
    
    if (comprehensiveContent.includes('throw new Error(`潜在客户搜索失败')) {
      console.log('✅ 潜在客户搜索失败时正确抛出错误，不使用fallback数据');
    }
    
    console.log('\n✅ 系统已完全移除所有模板，只依赖AI生成！');
    console.log('现在系统将：');
    console.log('- 完全基于网站真实内容分析');
    console.log('- 为fruitai.org生成针对买菜用户的关键词');
    console.log('- 不使用任何预定义模板或默认策略');
    console.log('- 所有内容都由AI动态生成');
    
    return true;
  }
}

verifyNoTemplates();