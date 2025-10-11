console.log('📧 Generating sample email to inspect HTML output...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const fs = require('fs');
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

async function generateSampleEmail() {
  try {
    const result = await generator.generatePersonalizedEmail(
      testProspect,
      businessAnalysis,
      null,
      'partnership'
    );
    
    if (result.success) {
      // Save the HTML email to a file for inspection
      const htmlContent = result.email.body;
      
      fs.writeFileSync('/Users/James/Desktop/agent/sample-email.html', htmlContent);
      
      console.log('✅ Sample email saved to sample-email.html');
      console.log('📧 Subject:', result.email.subject);
      console.log('📏 Body length:', htmlContent.length, 'chars');
      
      // Analyze color usage
      console.log('\n🎨 COLOR ANALYSIS:');
      
      // Check for background colors
      const backgroundColors = htmlContent.match(/background-color:\s*[^;]+/g) || [];
      console.log('   Background colors found:', backgroundColors.length);
      backgroundColors.slice(0, 3).forEach((color, i) => {
        console.log(`   ${i + 1}. ${color}`);
      });
      
      // Check for text colors
      const textColors = htmlContent.match(/color:\s*[^;]+/g) || [];
      console.log('   Text colors found:', textColors.length);
      textColors.slice(0, 3).forEach((color, i) => {
        console.log(`   ${i + 1}. ${color}`);
      });
      
      // Check for font families
      const fontFamilies = htmlContent.match(/font-family:\s*[^;]+/g) || [];
      console.log('   Font families found:', fontFamilies.length);
      fontFamilies.slice(0, 2).forEach((font, i) => {
        console.log(`   ${i + 1}. ${font}`);
      });
      
      // Look for specific color values
      const hexColors = htmlContent.match(/#[0-9a-fA-F]{3,6}/g) || [];
      console.log('   Hex colors:', hexColors.slice(0, 5));
      
      // Check if it has proper HTML structure
      console.log('\n📋 HTML STRUCTURE:');
      console.log('   Has DOCTYPE:', htmlContent.includes('<!DOCTYPE html>'));
      console.log('   Has head tag:', htmlContent.includes('<head>'));
      console.log('   Has style tag:', htmlContent.includes('<style>'));
      console.log('   Has body tag:', htmlContent.includes('<body'));
      
      // Show first 200 characters of body
      const bodyMatch = htmlContent.match(/<body[^>]*>/);
      if (bodyMatch) {
        console.log('   Body tag:', bodyMatch[0].substring(0, 200));
      }
      
    } else {
      console.log('❌ Email generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

generateSampleEmail().catch(console.error);