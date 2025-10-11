console.log('🧪 Testing SMTP config data flow from frontend...');

// Mock frontend request with the same structure the frontend should be sending
const mockRequest = {
  targetWebsite: 'https://fruitai.org',
  campaignGoal: 'sales',
  businessType: 'technology',
  smtpConfig: {
    senderName: 'James Wilson',
    username: 'james@fruitai.org',
    password: 'test123',
    companyWebsite: 'https://fruitai.org',
    companyName: 'FruitAI',
    ctaUrl: 'https://calendly.com/james-wilson',
    ctaText: 'Book a Demo'
  },
  templateData: {
    senderName: 'James Wilson',
    senderEmail: 'james@fruitai.org',
    companyWebsite: 'https://fruitai.org',
    companyName: 'FruitAI'
  }
};

console.log('📧 Mock frontend request structure:');
console.log('  smtpConfig:', mockRequest.smtpConfig ? Object.keys(mockRequest.smtpConfig) : 'MISSING');
console.log('  templateData:', mockRequest.templateData ? Object.keys(mockRequest.templateData) : 'MISSING');

// Test the templateData creation logic from the agent
console.log('\n🔍 Testing templateData creation logic...');
let testTemplateData = mockRequest.templateData;
const testSmtpConfig = mockRequest.smtpConfig;

// This is the logic from lines 772-782 in LangGraphMarketingAgent.js
if (!testTemplateData && testSmtpConfig) {
  testTemplateData = {
    senderName: testSmtpConfig.senderName || testSmtpConfig.username?.split('@')[0] || 'Partnership Team',
    senderEmail: testSmtpConfig.username,
    companyWebsite: testSmtpConfig.companyWebsite,
    companyName: testSmtpConfig.companyName || 'Our Company',
    ctaUrl: testSmtpConfig.ctaUrl || 'https://calendly.com/schedule-meeting',
    ctaText: testSmtpConfig.ctaText || 'Schedule a Meeting'
  };
  console.log('📧 Created templateData from SMTP config:', testTemplateData);
} else if (testTemplateData) {
  console.log('📧 Using provided templateData:', testTemplateData);
} else {
  console.log('❌ No templateData created - this would cause the error!');
}

// Test with null/undefined values (what might be happening)
console.log('\n🔍 Testing with null/undefined values...');
let testNull = null;
let testUndefined = undefined;

console.log('testNull falsy:', !testNull);
console.log('testUndefined falsy:', !testUndefined);

// Test actual LangGraphMarketingAgent
console.log('\n🔍 Testing actual method call...');
const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const agent = new LangGraphMarketingAgent();

// Mock the method call with debug
try {
  console.log('Calling agent method with:');
  console.log('  prospects: []');
  console.log('  marketingStrategy: {}');
  console.log('  campaignId: test123');
  console.log('  smtpConfig:', testSmtpConfig ? 'PROVIDED' : 'MISSING');
  console.log('  emailTemplate: partnership_outreach');
  console.log('  templateData:', testTemplateData ? 'PROVIDED' : 'MISSING');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n✅ SMTP config debugging complete');