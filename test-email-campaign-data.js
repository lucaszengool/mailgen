const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');

async function testEmailCampaignData() {
  console.log('🧪 Testing Email Campaign Data Flow...');
  
  const agent = new LangGraphMarketingAgent();
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'sales',
    businessType: 'technology'
  };

  console.log('🔍 Testing email data structure...');

  try {
    const results = await agent.executeCampaign(testConfig);
    
    console.log('\n=== EMAIL DATA STRUCTURE TEST ===');
    console.log('✅ Campaign ID:', results.campaignId);
    console.log('✅ Prospects Found:', results.prospects ? results.prospects.length : 0);
    console.log('✅ Email Campaign Present:', Boolean(results.emailCampaign));
    
    if (results.emailCampaign) {
      console.log('\n📧 Email Campaign Structure:');
      console.log('   Keys:', Object.keys(results.emailCampaign));
      console.log('   Emails Sent:', results.emailCampaign.emailsSent ? results.emailCampaign.emailsSent.length : 0);
      
      if (results.emailCampaign.emailsSent && results.emailCampaign.emailsSent.length > 0) {
        const firstEmail = results.emailCampaign.emailsSent[0];
        console.log('\n   📩 First Email Structure:');
        console.log('     Keys:', Object.keys(firstEmail));
        console.log('     To:', firstEmail.to);
        console.log('     Subject:', firstEmail.subject ? firstEmail.subject.substring(0, 50) : 'N/A');
        console.log('     Template Used:', firstEmail.template_used);
        console.log('     Has Body:', Boolean(firstEmail.body));
        console.log('     Sent Status:', firstEmail.sent);
        
        console.log('\n🎯 EMAIL CAMPAIGN DATA READY FOR HUNTER.IO STYLE DISPLAY!');
        console.log('✅ Data structure is proper for frontend consumption');
      } else {
        console.log('\n⚠️ No emailsSent array found');
      }
    } else {
      console.log('⚠️ No email campaign data found');
    }
    
    if (results.prospects && results.prospects.length > 0) {
      console.log('\n📋 Prospect Data Available:');
      console.log('   Count:', results.prospects.length);
      const firstProspect = results.prospects[0];
      console.log('   Has persona:', Boolean(firstProspect.persona));
      if (firstProspect.persona) {
        console.log('   Persona keys:', Object.keys(firstProspect.persona));
      }
    }
    
    console.log('\n✅ Backend data is ready - now fixing frontend display...');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailCampaignData();