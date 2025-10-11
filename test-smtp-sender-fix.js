console.log('🧪 测试SMTP发件人地址修复...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const generator = new PersonalizedEmailGenerator();

// 模拟真实prospect数据，包含用户的SMTP配置
const testProspect = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@techcorp.com',
  company: 'TechCorp',
  domain: 'techcorp.com',
  preferredTemplate: 'partnership_outreach',
  templateData: {
    senderName: 'James Wilson',  // 用户配置的发件人姓名
    senderEmail: 'james@fruitai.org',  // 用户配置的发件人邮箱
    companyWebsite: 'https://fruitai.org',
    companyName: 'FruitAI'
  }
};

// 模拟业务分析数据
const businessAnalysis = {
  companyName: 'FruitAI',
  industry: 'AI Technology',
  valueProposition: 'AI-powered fruit freshness analysis for smart grocery shopping'
};

console.log('✅ 测试参数:');
console.log('   发件人姓名:', testProspect.templateData.senderName);
console.log('   发件人邮箱:', testProspect.templateData.senderEmail);
console.log('   预期结果: james@fruitai.org (不是 fruitaiofficial@gmail.com)');
console.log('');

const startTime = Date.now();
console.log('🚀 测试邮件生成...');

generator.generatePersonalizedEmail(testProspect, businessAnalysis, null, 'partnership').then(result => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('\n=== SMTP发件人修复验证结果 ===');
  console.log('✅ 生成成功:', result.success);
  console.log('⏱️ 耗时:', duration + 'ms');
  
  if (result.success) {
    console.log('📧 邮件主题:', result.email.subject);
    console.log('📋 使用模板:', result.email.template_used);
    console.log('📝 内容长度:', result.email.body.length, 'chars');
    
    // 检查发件人信息（可能在body中）
    const bodyIncludesCorrectSender = result.email.body.includes('james@fruitai.org') || result.email.body.includes('James Wilson');
    const bodyIncludesWrongSender = result.email.body.includes('fruitaiofficial@gmail.com');
    const isHTMLFormat = result.email.body.includes('<html>') || result.email.body.includes('<table>');
    const hasLongContent = result.email.body.length > 500;
    
    console.log('\n🎯 修复验证:');
    console.log('   ✅ 包含正确发件人信息:', bodyIncludesCorrectSender ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ 无错误发件人信息:', !bodyIncludesWrongSender ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ HTML格式:', isHTMLFormat ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ 长内容:', hasLongContent ? 'PASS ✅' : 'FAIL ❌');
    
    if (bodyIncludesCorrectSender && !bodyIncludesWrongSender && isHTMLFormat && hasLongContent) {
      console.log('\n🎉 SMTP发件人修复验证成功!');
      console.log('✅ 邮件生成使用正确的发件人信息');
      console.log('✅ HTML格式长内容生成正常');
      console.log('✅ 无硬编码错误发件人地址');
    } else {
      console.log('\n⚠️ 部分问题可能仍存在');
    }
    
    // 显示邮件内容片段
    console.log('\n📄 邮件内容预览 (前200字符):');
    console.log(result.email.body.substring(0, 200) + '...');
    
  } else {
    console.log('❌ 邮件生成失败:', result.error);
  }
  
}).catch(error => {
  console.error('\n❌ 测试失败:', error.message);
});