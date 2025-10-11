console.log('🧪 Testing Premium Email Templates 2025 directly...');

const PremiumEmailTemplates2025 = require('./server/services/PremiumEmailTemplates2025');

// Create instance
const templates = new PremiumEmailTemplates2025();

// Mock data
const testProspect = {
  name: 'Sarah Johnson',
  email: 'sarah@techcorp.com',
  company: 'TechCorp',
  templateData: {
    senderName: 'James Wilson',
    senderEmail: 'james@fruitai.org',
    companyWebsite: 'https://fruitai.org',
    companyName: 'FruitAI'
  }
};

const businessAnalysis = {
  companyName: 'FruitAI',
  industry: 'AI Technology',
  valueProposition: 'AI-powered solutions'
};

const marketingStrategy = {
  target_audience: {
    primary_segments: ['tech companies'],
    pain_points: ['efficiency', 'growth']
  }
};

console.log('🎨 Testing Premium 2025 template generation...');

try {
  const result = templates.generateDynamicPremiumEmail(
    'partnership_outreach',
    testProspect,
    businessAnalysis,
    marketingStrategy,
    {
      campaignGoal: 'sales',
      userSelectedTemplate: 'partnership_outreach',
      templateVariationIndex: 0,
      forceUniqueDesign: true
    }
  );
  
  console.log('\n=== Premium Template Test Results ===');
  console.log('✅ Success:', !!result);
  
  if (result && result.subject && result.body) {
    console.log('📧 Subject:', result.subject);
    console.log('📋 Template Used:', result.template_used);
    console.log('🎨 Has gradient:', result.body.includes('linear-gradient'));
    console.log('🎨 Has cards:', result.body.includes('border-radius'));
    console.log('🎨 Has HTML structure:', result.body.includes('<html>'));
    console.log('📝 Body length:', result.body.length + ' chars');
    console.log('📄 Body preview:', result.body.substring(0, 200) + '...');
    
    if (result.body.includes('linear-gradient') && result.body.includes('<html>')) {
      console.log('\n🎉 PREMIUM TEMPLATES 2025 WORKING CORRECTLY!');
    } else {
      console.log('\n⚠️ Premium templates may have regression issues');
    }
  } else {
    console.log('❌ Template generation returned null or incomplete result');
  }
  
} catch (error) {
  console.error('❌ Premium template test failed:', error.message);
  console.error('Stack:', error.stack);
}