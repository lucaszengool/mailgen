console.log('🧪 Testing fixed SMTP config email template generation...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const generator = new PersonalizedEmailGenerator();

// Mock prospect with templateData from SMTP config (simulating user's settings)
const testProspect = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@techcorp.com',
  company: 'TechCorp',
  domain: 'techcorp.com',
  preferredTemplate: 'partnership_outreach',
  templateData: {
    senderName: 'James Wilson',
    senderEmail: 'james@mycompany.com',
    companyWebsite: 'https://mycompany.com',
    companyName: 'MyCompany Inc',
    ctaUrl: 'https://calendly.com/james-wilson/meeting',
    ctaText: 'Book a Demo'
  }
};

// Mock business analysis
const businessAnalysis = {
  companyName: 'MyCompany Inc',
  industry: 'AI Technology',
  valueProposition: 'AI-powered business solutions',
  website: 'https://mycompany.com'
};

console.log('📧 Testing email generation with user SMTP config...');
console.log('   Expected sender: James Wilson <james@mycompany.com>');
console.log('   Expected website: https://mycompany.com');

generator.generatePersonalizedEmail(testProspect, businessAnalysis, null, 'partnership').then(result => {
  console.log('\n=== SMTP Config Fix Test Results ===');
  console.log('✅ Success:', result.success);
  
  if (result.success) {
    console.log('📧 Subject:', result.email.subject);
    console.log('📋 Template Used:', result.email.template_used);
    
    // Check if the real SMTP config is used instead of hardcoded values
    const hasUserSender = result.email.body.includes('James Wilson');
    const hasUserWebsite = result.email.body.includes('mycompany.com');
    const hasUserCompany = result.email.body.includes('MyCompany Inc');
    const hasUserCTA = result.email.body.includes('Book a Demo');
    
    // Check for old hardcoded values
    const hasOldEmail = result.email.body.includes('contact@company.com') || result.email.body.includes('fruitai.org') || result.email.body.includes('team@fruitai.org');
    const hasOldWebsite = result.email.body.includes('yourcompany.com');
    
    console.log('\n🎯 SMTP Config Usage Verification:');
    console.log('  ✅ Uses user sender name:', hasUserSender ? 'PASS ✅' : 'FAIL ❌');
    console.log('  ✅ Uses user website:', hasUserWebsite ? 'PASS ✅' : 'FAIL ❌');
    console.log('  ✅ Uses user company name:', hasUserCompany ? 'PASS ✅' : 'FAIL ❌');  
    console.log('  ✅ Uses user CTA text:', hasUserCTA ? 'PASS ✅' : 'FAIL ❌');
    console.log('  ✅ No hardcoded fallbacks:', !hasOldEmail && !hasOldWebsite ? 'PASS ✅' : 'FAIL ❌');
    
    if (hasUserSender && hasUserWebsite && hasUserCompany && !hasOldEmail && !hasOldWebsite) {
      console.log('\n🎉 EMAIL TEMPLATE SENDER INFO FIX SUCCESSFUL!');
      console.log('✅ Templates now use real SMTP configuration from user settings');
      console.log('✅ No more hardcoded contact@company.com or generic websites');
      console.log('✅ Proper sender name and email from user configuration');
      console.log('✅ User company website and branding applied');
    } else {
      console.log('\n⚠️ Some issues remain:');
      if (!hasUserSender) console.log('   ❌ Still using hardcoded sender info');
      if (!hasUserWebsite) console.log('   ❌ Still using hardcoded website');
      if (!hasUserCompany) console.log('   ❌ Still using hardcoded company name');
      if (hasOldEmail || hasOldWebsite) console.log('   ❌ Still has hardcoded fallback values');
    }
    
    console.log('\n📄 Email Preview (first 500 chars):');
    console.log(result.email.body.substring(0, 500) + '...');
    
  } else {
    console.log('❌ Generation failed:', result.error);
  }
}).catch(error => {
  console.error('❌ Test failed:', error.message);
});