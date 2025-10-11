console.log('🎨 Testing color variable resolution in Premium Templates...');

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

async function testColorResolution() {
  console.log('🔍 Generating email to check color variable resolution...');
  
  try {
    const result = await generator.generatePersonalizedEmail(
      testProspect,
      businessAnalysis,
      null,
      'partnership'
    );
    
    if (result.success) {
      console.log('✅ Email generated successfully');
      console.log('📧 Subject:', result.email.subject);
      console.log('📏 Body length:', result.email.body.length, 'chars');
      
      // Check for color variable issues
      const bodyContent = result.email.body;
      const hasLiteralVariables = bodyContent.includes('${palette.') || bodyContent.includes('${this.typography.');
      const hasActualColors = bodyContent.includes('#') || bodyContent.includes('rgb') || bodyContent.includes('color:');
      
      console.log('\n🎨 COLOR RESOLUTION ANALYSIS:');
      console.log('   Has literal variables (${palette.*, ${this.typography.*):', hasLiteralVariables ? '❌ YES (BAD)' : '✅ NO (GOOD)');
      console.log('   Has actual color values (#, rgb, color:):', hasActualColors ? '✅ YES (GOOD)' : '❌ NO (BAD)');
      
      // Show relevant parts of the email
      if (hasLiteralVariables) {
        console.log('\n🔧 FOUND LITERAL VARIABLES:');
        const literalMatches = bodyContent.match(/\$\{[^}]+\}/g);
        if (literalMatches) {
          literalMatches.slice(0, 5).forEach((match, i) => {
            console.log(`   ${i + 1}. ${match}`);
          });
        }
      }
      
      // Show first 500 chars of body style to check colors
      console.log('\n📄 BODY STYLE PREVIEW (first 500 chars):');
      const bodyTagMatch = bodyContent.match(/<body[^>]*>/);
      if (bodyTagMatch) {
        console.log('   Body tag:', bodyTagMatch[0]);
      }
      
      // Check for specific color patterns
      console.log('\n🔍 COLOR PATTERN ANALYSIS:');
      console.log('   Contains background-color:', bodyContent.includes('background-color:') ? '✅ YES' : '❌ NO');
      console.log('   Contains font-family:', bodyContent.includes('font-family:') ? '✅ YES' : '❌ NO');
      console.log('   Contains ${palette.background}:', bodyContent.includes('${palette.background}') ? '❌ YES (PROBLEM)' : '✅ NO');
      console.log('   Contains ${this.typography.body.font}:', bodyContent.includes('${this.typography.body.font}') ? '❌ YES (PROBLEM)' : '✅ NO');
      
      if (hasLiteralVariables) {
        console.log('\n❌ COLOR ISSUE CONFIRMED: Template literals not being evaluated');
        console.log('   User complaint: "你字体颜色显示不出来，我要选择才看清" (colors not displaying)');
        console.log('   Root cause: Variables like ${palette.primary} not being substituted with actual color values');
      } else {
        console.log('\n✅ Colors should be working properly - variables are evaluated');
      }
      
    } else {
      console.log('❌ Email generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testColorResolution().catch(console.error);