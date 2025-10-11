console.log('🧪 Testing emailsSent array fix for Hunter.io interface...');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const agent = new LangGraphMarketingAgent();

const testConfig = {
  targetWebsite: 'https://fruitai.org',
  campaignGoal: 'partnership', 
  businessType: 'technology'
};

console.log('🚀 Running quick test to verify emailsSent array...');

agent.executeCampaign(testConfig).then(results => {
  console.log('\n=== HUNTER.IO INTERFACE DATA STRUCTURE TEST ===');
  console.log('✅ Campaign ID:', results.campaignId);
  console.log('✅ Prospects Found:', results.prospects ? results.prospects.length : 0);
  console.log('✅ Email Campaign Present:', Boolean(results.emailCampaign));
  
  if (results.emailCampaign) {
    console.log('\n📧 Email Campaign Structure:');
    console.log('   Keys:', Object.keys(results.emailCampaign));
    console.log('   Has emails array:', Boolean(results.emailCampaign.emails));
    console.log('   Has emailsSent array:', Boolean(results.emailCampaign.emailsSent));
    console.log('   Emails count:', results.emailCampaign.emails ? results.emailCampaign.emails.length : 0);
    console.log('   EmailsSent count:', results.emailCampaign.emailsSent ? results.emailCampaign.emailsSent.length : 0);
    
    if (results.emailCampaign.emailsSent && results.emailCampaign.emailsSent.length > 0) {
      console.log('\n🎉 SUCCESS: emailsSent array is populated!');
      console.log('📧 First email structure:');
      const firstEmail = results.emailCampaign.emailsSent[0];
      console.log('   Keys:', Object.keys(firstEmail));
      console.log('   To:', firstEmail.to);
      console.log('   Subject:', firstEmail.subject ? firstEmail.subject.substring(0, 50) : 'No subject');
      console.log('\n✅ HUNTER.IO INTERFACE DATA READY!');
      console.log('✅ Frontend should now display the email list properly');
    } else {
      console.log('\n❌ emailsSent array is still empty or missing');
    }
  }
  
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});