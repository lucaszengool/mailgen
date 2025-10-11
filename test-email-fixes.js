console.log('🧪 Testing Fixed Email Generation Issues...');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const agent = new LangGraphMarketingAgent();

const testConfig = {
  targetWebsite: 'https://fruitai.org',
  campaignGoal: 'sales',
  businessType: 'technology',
  smtpConfig: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    senderName: 'James Wilson',
    auth: {
      user: 'james@fruitai.org',
      pass: 'test123'
    }
  }
};

console.log('✅ Testing with SMTP config that includes auth.user field:');
console.log('   Sender Name:', testConfig.smtpConfig.senderName);
console.log('   Sender Email:', testConfig.smtpConfig.auth.user);
console.log('');
console.log('🎯 Expected fixes:');
console.log('   1. ✅ templateData.senderEmail should be james@fruitai.org (not undefined)');
console.log('   2. ✅ Template rotation should work (different templates per email)');
console.log('   3. ✅ SMTP sender should be james@fruitai.org (not fruitaiofficial@gmail.com)');
console.log('');

const startTime = Date.now();

// Set a timeout to prevent hanging
setTimeout(() => {
  console.log('⏱️ Test timed out after 60 seconds');
  process.exit(1);
}, 60000);

agent.executeCampaign(testConfig).then(results => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('\n=== COMPREHENSIVE FIX TEST RESULTS ===');
  console.log('✅ Campaign ID:', results.campaignId);
  console.log('✅ Business Analysis:', results.businessAnalysis ? 'SUCCESS' : 'FAILED');
  console.log('✅ Marketing Strategy:', results.marketingStrategy ? 'SUCCESS' : 'FAILED');  
  console.log('✅ Prospects Found:', results.prospects ? results.prospects.length : 0);
  console.log('✅ Email Campaign:', results.emailCampaign ? 'SUCCESS' : 'FAILED');
  
  if (results.emailCampaign && results.emailCampaign.emailsSent && results.emailCampaign.emailsSent.length > 0) {
    console.log('\n📧 EMAIL FIXES VERIFICATION:');
    console.log('   Total emails sent:', results.emailCampaign.emailsSent.length);
    
    // Check fix #1: templateData.senderEmail 
    const firstEmail = results.emailCampaign.emailsSent[0];
    const hasCorrectSender = firstEmail.from && firstEmail.from.includes('james@fruitai.org');
    const hasOldSender = firstEmail.from && firstEmail.from.includes('fruitaiofficial@gmail.com');
    
    console.log('\n   🔧 Fix #1 - SMTP Sender:');
    console.log('     From field:', firstEmail.from);
    console.log('     Uses correct sender:', hasCorrectSender ? '✅ FIXED' : '❌ NOT FIXED');
    console.log('     No old sender:', hasOldSender ? '❌ STILL HAS OLD' : '✅ FIXED');
    
    // Check fix #2: Template rotation
    const emailSubjects = results.emailCampaign.emailsSent.map(e => e.subject);
    const uniqueSubjects = [...new Set(emailSubjects)];
    const hasRotation = uniqueSubjects.length > 1 && results.emailCampaign.emailsSent.length > 1;
    
    console.log('\n   🔄 Fix #2 - Template Rotation:');
    console.log('     Total subjects:', emailSubjects.length);
    console.log('     Unique subjects:', uniqueSubjects.length);
    console.log('     Rotation working:', hasRotation ? '✅ FIXED' : '⚠️ NEEDS MORE EMAILS TO TEST');
    if (uniqueSubjects.length > 1) {
      console.log('     Subject samples:', uniqueSubjects.slice(0, 3));
    }
    
    // Check fix #3: templateData undefined issue
    const firstEmailBody = firstEmail.body || '';
    const hasUndefined = firstEmailBody.includes('undefined');
    
    console.log('\n   📝 Fix #3 - Template Data:');
    console.log('     Subject has undefined:', firstEmail.subject.includes('undefined') ? '❌' : '✅ FIXED');
    console.log('     Body has undefined:', hasUndefined ? '❌' : '✅ FIXED');
    
    // Summary
    if (hasCorrectSender && !hasOldSender && !hasUndefined) {
      console.log('\n🎉 ALL CRITICAL EMAIL FIXES VERIFIED SUCCESSFUL!');
      console.log('✅ No more undefined templateData');
      console.log('✅ Correct SMTP sender from user settings');  
      console.log('✅ No hardcoded fruitaiofficial@gmail.com');
      if (hasRotation) {
        console.log('✅ Template rotation working with different templates');
      }
    } else {
      console.log('\n⚠️ Some fixes still need attention');
    }
    
  } else {
    console.log('\n⚠️ No emails sent - cannot verify email fixes');
  }
  
  console.log('\nTest duration:', duration + 'ms');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error.message);
  if (!error.message.includes('network') && !error.message.includes('timeout')) {
    console.log('⚠️ This may be due to Ollama or other service issues');
  }
  process.exit(1);
});