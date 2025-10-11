console.log('🧪 Testing PersonalizedEmailGenerator Premium Template Integration...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');

// Create instance
const generator = new PersonalizedEmailGenerator();

// Mock data that mimics real campaign data
const testProspect = {
  name: 'Sarah Johnson',
  email: 'sarah@techcorp.com',
  company: 'TechCorp',
  preferredTemplate: 'partnership_outreach',
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

console.log('🎨 Testing full PersonalizedEmailGenerator workflow...');

generator.generatePersonalizedEmail(testProspect, businessAnalysis, marketingStrategy, 'sales').then(result => {
  console.log('\n=== PersonalizedEmailGenerator Test Results ===');
  console.log('✅ Success:', result.success);
  
  if (result.success) {
    console.log('📧 Subject:', result.email.subject);
    console.log('📋 Template Used:', result.email.template_used);
    console.log('⚙️ Method:', result.metadata?.method);
    console.log('🎨 Template Type:', result.metadata?.template_type);
    
    // Check for Premium Template indicators
    const isPremium = result.metadata?.template_type?.includes('premium_2025');
    const hasPremiumHTML = result.email.body?.includes('linear-gradient') && result.email.body?.includes('<html>');
    const bodyLength = result.email.body?.length || 0;
    
    console.log('\n🎯 Premium Template Analysis:');
    console.log('  ✅ Uses Premium 2025 metadata:', isPremium);
    console.log('  ✅ Has premium HTML features:', hasPremiumHTML);
    console.log('  📝 Body length:', bodyLength + ' chars');
    console.log('  🎨 Has gradient backgrounds:', result.email.body?.includes('linear-gradient'));
    console.log('  🎨 Has card layouts:', result.email.body?.includes('border-radius'));
    console.log('  🎨 Has HTML structure:', result.email.body?.includes('<html>'));
    
    if (isPremium && hasPremiumHTML && bodyLength > 1000) {
      console.log('\n🎉 PREMIUM TEMPLATES WORKING IN FULL WORKFLOW!');
    } else {
      console.log('\n⚠️ Premium templates may be falling back to basic templates');
      console.log('📄 Email preview:', result.email.body?.substring(0, 300) + '...');
    }
  } else {
    console.log('❌ Email generation failed:', result.error);
  }
  
}).catch(error => {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack?.substring(0, 500));
});