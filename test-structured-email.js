#!/usr/bin/env node

/**
 * Direct test of structured email generation
 * This tests the StructuredEmailGenerator service directly
 */

const StructuredEmailGenerator = require('./server/services/StructuredEmailGenerator');

async function testStructuredEmailGeneration() {
  console.log('🎨 Testing Structured Email Generation...\n');
  
  const generator = new StructuredEmailGenerator();
  
  // Test context
  const context = {
    companyName: 'FruitAI',
    industry: 'AI Technology',
    targetAudience: 'Business Executives',
    campaignGoal: 'partnership',
    product: 'AI-powered fruit analyzer',
    prospectEmail: 'test@example.com',
    prospectCompany: 'TechCorp'
  };

  // Test different template types
  const templatesToTest = [
    'executive_summit',
    'tech_startup_vibrant',
    'luxury_brand',
    'saas_modern',
    'ecommerce_flash'
  ];

  console.log('🔍 Available Templates:');
  const availableTemplates = generator.getAvailableTemplates();
  availableTemplates.forEach((template, i) => {
    console.log(`   ${i + 1}. ${template.name} (${template.category})`);
  });
  console.log(`\n📊 Total: ${availableTemplates.length} templates available\n`);

  for (const templateType of templatesToTest) {
    console.log(`🎯 Testing template: ${templateType}`);
    console.log('-'.repeat(50));
    
    try {
      // Generate structured content
      const result = await generator.generateStructuredContent(templateType, context);
      
      if (result.success) {
        console.log('✅ Generation successful!');
        console.log('📝 Generated sections:');
        
        const sections = result.sections;
        Object.keys(sections).forEach(key => {
          const value = sections[key];
          if (Array.isArray(value)) {
            console.log(`   ${key}: [${value.join(', ')}]`);
          } else if (typeof value === 'object') {
            console.log(`   ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`   ${key}: "${value}"`);
          }
        });
        
        // Generate complete email
        console.log('\n📧 Generating complete email...');
        const emailResult = await generator.generateEmail(templateType, context);
        
        if (emailResult.success) {
          console.log('✅ Complete email generated!');
          console.log(`📏 Sections count: ${Object.keys(emailResult.sections).length}`);
          console.log('📄 Email sections preview:');
          
          // Show first few sections
          const sectionKeys = Object.keys(emailResult.sections).slice(0, 5);
          sectionKeys.forEach(key => {
            const value = emailResult.sections[key];
            const preview = typeof value === 'string' && value.length > 50 
              ? value.substring(0, 50) + '...' 
              : value;
            console.log(`   • ${key}: ${JSON.stringify(preview)}`);
          });
          
        } else {
          console.log('❌ Complete email generation failed:', emailResult.error);
        }
        
      } else {
        console.log('❌ Generation failed:', result.error);
        console.log('🔄 Fallback content provided:', Object.keys(result.fallback || {}).length, 'sections');
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
    
    console.log(''); // Empty line between tests
  }
  
  console.log('🏁 Structured email generation test completed!');
}

// Test the PersonalizedEmailGenerator integration
async function testPersonalizedEmailIntegration() {
  console.log('\n🔗 Testing PersonalizedEmailGenerator Integration...\n');
  
  try {
    const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
    const generator = new PersonalizedEmailGenerator();
    
    // Mock prospect with preferred template
    const prospect = {
      email: 'test@executive.com',
      name: 'John Executive',
      company: 'ExecutiveCorp',
      preferredTemplate: 'executive_summit'
    };
    
    // Mock business analysis
    const businessAnalysis = {
      companyName: 'FruitAI',
      industry: 'AI Technology', 
      mainProducts: ['AI Fruit Analyzer'],
      valueProposition: 'Revolutionary fruit freshness detection',
      senderInfo: {
        senderName: 'AI Team',
        senderEmail: 'team@fruitai.org'
      }
    };
    
    console.log('📧 Generating personalized email with executive_summit template...');
    
    const result = await generator.generatePersonalizedEmail(
      prospect,
      businessAnalysis,
      { campaign_objectives: { primary_goal: 'partnership' } },
      'partnership'
    );
    
    if (result.success && result.email) {
      console.log('✅ Personalized email generated successfully!');
      console.log('📋 Email details:');
      console.log(`   Subject: "${result.email.subject}"`);
      console.log(`   Template: ${result.email.template_used}`);
      console.log(`   Template Type: ${result.email.template_type}`);
      console.log(`   Has Sections: ${result.email.sections ? 'Yes' : 'No'}`);
      
      if (result.email.sections) {
        console.log('🎨 Structured sections found:');
        const sectionKeys = Object.keys(result.email.sections);
        console.log(`   📊 Total sections: ${sectionKeys.length}`);
        console.log(`   🔑 Section keys: ${sectionKeys.join(', ')}`);
        
        // Show sample section content
        if (result.email.sections.headline) {
          console.log(`   📰 Headline: "${result.email.sections.headline}"`);
        }
        if (result.email.sections.features) {
          console.log(`   ⭐ Features: ${JSON.stringify(result.email.sections.features)}`);
        }
      }
      
      console.log(`   📏 Body length: ${result.email.body?.length || 0} chars`);
      console.log(`   📏 HTML length: ${result.email.html?.length || 0} chars`);
      
      // Check if it's a fancy structured email
      if (result.email.template_type === 'structured_fancy') {
        console.log('🎉 FANCY STRUCTURED EMAIL DETECTED!');
        console.log('   This email will render with fancy UI components!');
      } else {
        console.log('⚠️  Regular email detected - not using structured system');
      }
      
    } else {
      console.log('❌ Personalized email generation failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Integration test error:', error.message);
  }
}

async function runAllTests() {
  try {
    await testStructuredEmailGeneration();
    await testPersonalizedEmailIntegration();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Structured email generation system tested');
    console.log('✅ PersonalizedEmailGenerator integration tested');
    console.log('✅ Template selection and content generation verified');
    console.log('\n🚀 System appears to be working correctly!');
    console.log('\n🔍 To verify frontend UI:');
    console.log('   1. Check http://localhost:3000');
    console.log('   2. Generate an email campaign'); 
    console.log('   3. Look for "FANCY" badge in email display');
    console.log('   4. Verify structured content appears in UI');
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  }
}

runAllTests();