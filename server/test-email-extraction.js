const LocalAISearchEngine = require('./agents/LocalAISearchEngine');

async function testEmailExtraction() {
  console.log('🧪 测试邮箱提取功能...');
  
  const engine = new LocalAISearchEngine();
  
  // 测试邮箱提取正则表达式
  const testText = `
    Contact us at info@example.com or support@testcompany.com.
    CEO: john.doe@startup.io
    Sales: sales@business.org
    For partnerships: partner@techcorp.net
    Email me directly: mary.smith@company.co.uk
  `;
  
  console.log('\n📝 测试文本:', testText);
  
  const extractedEmails = engine.extractEmailsFromText(testText);
  console.log('\n📧 提取到的邮箱:');
  extractedEmails.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
  });
  
  console.log(`\n✅ 总共提取到 ${extractedEmails.length} 个邮箱地址`);
  
  // 测试网站爬取
  console.log('\n🕷️ 测试网站爬取...');
  try {
    const content = await engine.scrapeWebsite('https://techcrunch.com');
    if (content && content.emails) {
      console.log(`📧 从TechCrunch提取到 ${content.emails.length} 个邮箱`);
      content.emails.slice(0, 3).forEach((email, index) => {
        console.log(`${index + 1}. ${email}`);
      });
    } else {
      console.log('⚠️ 未从TechCrunch提取到邮箱');
    }
  } catch (error) {
    console.log('❌ 网站爬取失败:', error.message);
  }
  
  console.log('\n🧪 测试完成!');
}

testEmailExtraction().catch(console.error);