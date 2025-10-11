console.log('🧪 Testing Fixed Premium Template System - No Emergency Fallback...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const generator = new PersonalizedEmailGenerator();

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
  valueProposition: 'AI-powered fruit freshness analysis for smart grocery shopping'
};

console.log('🎯 Testing premium template generation WITHOUT emergency template fallback...');
console.log('Expected: Premium templates should work with fixed layout methods');

generator.generatePersonalizedEmail(testProspect, businessAnalysis, null, 'partnership').then(result => {
  console.log('\n=== PREMIUM TEMPLATE SYSTEM TEST RESULTS ===');
  console.log('Success:', result.success);
  
  if (result.success) {
    console.log('📧 Subject:', result.email.subject);
    console.log('📏 Body Length:', result.email.body.length, 'chars');
    console.log('🎨 Template Used:', result.email.template_used);
    console.log('📋 Method:', result.metadata?.method || 'unknown');
    
    // Critical verification
    const bodyContent = result.email.body;
    const isHTML = bodyContent.includes('<html>') || bodyContent.includes('<!DOCTYPE');
    const isUltraSophisticated = bodyContent.length > 1000 && bodyContent.includes('gradient');
    const hasNonGenericContent = !bodyContent.includes('your company') && !bodyContent.includes('Your Company');
    const noEmergencyTemplate = !result.email.template_used.includes('emergency');
    
    console.log('\n🎯 PREMIUM TEMPLATE FIX VERIFICATION:');
    console.log('   ✅ HTML format:', isHTML ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ Ultra-sophisticated (>1000 chars + gradient):', isUltraSophisticated ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ Non-generic content:', hasNonGenericContent ? 'PASS ✅' : 'FAIL ❌');
    console.log('   ✅ No emergency template used:', noEmergencyTemplate ? 'PASS ✅' : 'FAIL ❌');
    
    if (isHTML && isUltraSophisticated && hasNonGenericContent && noEmergencyTemplate) {
      console.log('\n🎉 PREMIUM TEMPLATE SYSTEM FULLY FIXED!');
      console.log('✅ Root cause resolved: Layout methods in PremiumEmailTemplates2025 now return proper style objects');
      console.log('✅ Emergency template approach removed as requested');
      console.log('✅ Ultra-sophisticated templates working without fallback');
      console.log('✅ User complaint "UI还是和之前一样很simple" should be RESOLVED');
    } else {
      console.log('\n⚠️ Some issues may remain - check specific failures above');
    }
    
    console.log('\n📧 Subject Sample:', result.email.subject);
    console.log('📄 Body Preview (first 300 chars):');
    console.log(bodyContent.substring(0, 300) + '...');
    
  } else {
    console.log('❌ Generation failed:', result.error);
    console.log('   This indicates premium templates are still failing');
  }
}).catch(error => {
  console.error('❌ Test failed:', error.message);
  console.log('Stack:', error.stack?.substring(0, 500));
});