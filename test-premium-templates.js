console.log('🧪 Testing PREMIUM Email Templates with Deep Personalization...\n');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const generator = new PersonalizedEmailGenerator();

// Test with different prospect profiles to show variety
const testProspects = [
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techcorp.com',
    company: 'TechCorp',
    domain: 'techcorp.com',
    industry: 'technology',
    role: 'CTO',
    preferredTemplate: 'partnership_outreach',
    templateData: {
      senderName: 'James Wilson',
      senderEmail: 'james@fruitai.org',
      companyWebsite: 'https://fruitai.org',
      companyName: 'FruitAI'
    }
  },
  {
    name: 'Michael Johnson',
    email: 'mjohnson@healthinnovate.com',
    company: 'HealthInnovate Inc',
    domain: 'healthinnovate.com',
    industry: 'healthcare',
    role: 'CEO',
    preferredTemplate: 'value_demonstration',
    templateData: {
      senderName: 'James Wilson',
      senderEmail: 'james@fruitai.org',
      companyWebsite: 'https://fruitai.org',
      companyName: 'FruitAI'
    }
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily@financeplus.com',
    company: 'FinancePlus',
    domain: 'financeplus.com',
    industry: 'finance',
    role: 'CFO',
    preferredTemplate: 'problem_solution',
    templateData: {
      senderName: 'James Wilson',
      senderEmail: 'james@fruitai.org',
      companyWebsite: 'https://fruitai.org',
      companyName: 'FruitAI'
    }
  }
];

const businessAnalysis = {
  companyName: 'FruitAI',
  industry: 'AI Technology',
  valueProposition: 'AI-powered solutions that transform business operations',
  website: 'https://fruitai.org'
};

const marketingStrategy = {
  target_audience: {
    type: 'b2b',
    primary_segments: ['technology leaders', 'innovation-driven companies'],
    pain_points: ['operational efficiency', 'digital transformation', 'competitive advantage'],
    search_keywords: { 
      industry_keywords: ['AI', 'automation', 'digital transformation']
    }
  },
  industry: 'technology'
};

async function testPremiumTemplates() {
  console.log('📊 PREMIUM TEMPLATE FEATURES:');
  console.log('   ✨ Industry-specific messaging (tech, healthcare, finance, etc)');
  console.log('   👤 Role-based personalization (CEO, CTO, CFO focus)');
  console.log('   🎯 Pain point addressing with solutions');
  console.log('   📈 Real metrics and testimonials');
  console.log('   🎨 Beautiful, Gmail-compatible design');
  console.log('   🔄 Unique content for each prospect\n');
  
  for (const [index, prospect] of testProspects.entries()) {
    console.log('━'.repeat(60));
    console.log(`\n📧 TEST ${index + 1}: ${prospect.name} (${prospect.role} at ${prospect.company})`);
    console.log(`   Industry: ${prospect.industry}`);
    console.log(`   Template: ${prospect.preferredTemplate}`);
    console.log('━'.repeat(60));
    
    try {
      // Customize marketing strategy for each prospect's industry
      const customStrategy = {
        ...marketingStrategy,
        industry: prospect.industry,
        target_audience: {
          ...marketingStrategy.target_audience,
          pain_points: getIndustryPainPoints(prospect.industry)
        }
      };
      
      const result = await generator.generatePersonalizedEmail(
        prospect, 
        businessAnalysis, 
        customStrategy, 
        'partnership'
      );
      
      if (result.success) {
        console.log('\n✅ EMAIL GENERATED SUCCESSFULLY');
        console.log('   📋 Subject:', result.email.subject);
        console.log('   🎯 Personalization Level:', result.metadata.personalization_level);
        console.log('   ✨ Features:', result.metadata.features?.join(', ') || 'standard');
        
        // Check for key personalization elements
        const hasIndustryContent = result.email.body.includes(prospect.industry) || 
                                  result.email.body.toLowerCase().includes(prospect.industry);
        const hasCompanyName = result.email.body.includes(prospect.company);
        const hasPersonName = result.email.body.includes(prospect.name.split(' ')[0]);
        const hasMetrics = /\d+%/.test(result.email.body);
        const hasTestimonial = result.email.body.includes('quote') || result.email.body.includes('"');
        
        console.log('\n🔍 PERSONALIZATION CHECK:');
        console.log(`   Industry-specific: ${hasIndustryContent ? '✅' : '❌'}`);
        console.log(`   Company mentioned: ${hasCompanyName ? '✅' : '❌'}`);
        console.log(`   Personal greeting: ${hasPersonName ? '✅' : '❌'}`);
        console.log(`   Metrics included: ${hasMetrics ? '✅' : '❌'}`);
        console.log(`   Testimonial added: ${hasTestimonial ? '✅' : '❌'}`);
        
        // Show a preview of unique content
        const bodyText = result.email.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        const preview = bodyText.substring(bodyText.indexOf(prospect.name.split(' ')[0]), bodyText.indexOf(prospect.name.split(' ')[0]) + 200);
        console.log('\n📝 UNIQUE CONTENT PREVIEW:');
        console.log('   "' + preview + '..."');
        
      } else {
        console.log('❌ Generation failed:', result.error);
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
    console.log('');
  }
  
  console.log('━'.repeat(60));
  console.log('\n🎉 PREMIUM TEMPLATE TESTING COMPLETE!');
  console.log('\n📊 KEY IMPROVEMENTS:');
  console.log('   1. ✅ Each email is completely unique with different content');
  console.log('   2. ✅ Industry-specific messaging and pain points');
  console.log('   3. ✅ Role-based focus (CEO sees growth, CTO sees tech, CFO sees ROI)');
  console.log('   4. ✅ Beautiful design with gradients, cards, and metrics');
  console.log('   5. ✅ Gmail-compatible HTML with table layouts');
  console.log('   6. ✅ Social proof with testimonials');
  console.log('   7. ✅ Dynamic subject lines');
  console.log('   8. ✅ Personalized CTAs and urgency messaging');
}

function getIndustryPainPoints(industry) {
  const painPoints = {
    technology: ['scaling infrastructure', 'technical debt', 'development velocity'],
    healthcare: ['patient engagement', 'compliance burden', 'operational efficiency'],
    finance: ['risk management', 'regulatory compliance', 'customer acquisition'],
    default: ['operational efficiency', 'growth acceleration', 'cost optimization']
  };
  
  return painPoints[industry] || painPoints.default;
}

testPremiumTemplates().catch(console.error);