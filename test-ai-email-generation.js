const AIEmailContentGenerator = require('./server/agents/AIEmailContentGenerator');

async function testRealAIEmailGeneration() {
  const emailGenerator = new AIEmailContentGenerator();
  
  const prospect = {
    name: "Daphne Koller",
    company: "insitro",
    jobTitle: "CEO and Founder", 
    industry: "biotechnology AI",
    email: "info@insitro.com",
    businessType: "AI-driven drug discovery",
    aiAnalysis: {
      mainProducts: ["AI drug discovery platform", "Machine learning for biology"],
      painPoints: ["Scaling drug discovery", "Reducing development costs"],
      keyStrengths: ["AI/ML expertise", "Data science innovation"],
      decisionMakers: ["Daphne Koller"]
    }
  };
  
  const sourceAnalysis = {
    companyName: "TechCrunch",
    industry: "media technology",
    mainProducts: ["Tech journalism", "Startup coverage", "Event hosting"],
    valueProposition: "Leading technology media platform connecting startups and investors",
    targetCustomers: ["Tech startups", "Investors", "Innovation leaders"]
  };
  
  const campaignObjective = "media partnership for AI/biotech startup coverage";
  
  try {
    console.log('🤖 Generating AI-driven customized email...');
    
    const customizedEmail = await emailGenerator.generateFullyCustomizedEmail(
      prospect,
      sourceAnalysis, 
      campaignObjective
    );
    
    console.log('✅ AI Email Generated Successfully!');
    console.log('📧 Subject:', customizedEmail.subject);
    console.log('📄 Body:', customizedEmail.body || customizedEmail.plainTextBody);
    console.log('⚡ Personalization Score:', customizedEmail.personalizationLevel);
    console.log('🎯 AI Analysis:', customizedEmail.relationshipAnalysis?.valueProposition);
    
    return customizedEmail;
    
  } catch (error) {
    console.error('❌ AI Email Generation Failed:', error.message);
    throw error;
  }
}

testRealAIEmailGeneration();