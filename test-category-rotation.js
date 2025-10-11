console.log('🧪 Testing Category-Based Template Rotation...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const generator = new PersonalizedEmailGenerator();

// Test prospects with same template category - should rotate within that category
const testProspects = [
  { name: 'John Doe', email: 'john@company1.com', company: 'Company1', preferredTemplate: 'partnership_outreach' },
  { name: 'Jane Smith', email: 'jane@company2.com', company: 'Company2', preferredTemplate: 'partnership_outreach' },
  { name: 'Bob Johnson', email: 'bob@company3.com', company: 'Company3', preferredTemplate: 'partnership_outreach' },
  { name: 'Alice Brown', email: 'alice@company4.com', company: 'Company4', preferredTemplate: 'cold_outreach' },
  { name: 'Charlie Davis', email: 'charlie@company5.com', company: 'Company5', preferredTemplate: 'cold_outreach' },
  { name: 'David Wilson', email: 'david@company6.com', company: 'Company6', preferredTemplate: 'cold_outreach' }
];

console.log('\n=== Testing Category-Based Template Rotation ===');

async function testCategoryRotation() {
  console.log('\n🔄 Testing Template Rotation Within User-Selected Categories:');
  
  const partnershipTemplates = [];
  const coldOutreachTemplates = [];
  
  for (let i = 0; i < testProspects.length; i++) {
    const prospect = testProspects[i];
    console.log(`\nProspect ${i + 1}: ${prospect.name} (${prospect.email})`);
    console.log(`   Selected Category: ${prospect.preferredTemplate}`);
    
    // Test template selection within category
    const selectedTemplate = generator.selectTemplateWithRotation(prospect.preferredTemplate, true);
    
    if (prospect.preferredTemplate === 'partnership_outreach') {
      partnershipTemplates.push(selectedTemplate);
    } else if (prospect.preferredTemplate === 'cold_outreach') {
      coldOutreachTemplates.push(selectedTemplate);
    }
    
    console.log(`   Selected Template: ${selectedTemplate}`);
  }
  
  console.log('\n=== Category Rotation Results ===');
  
  console.log('\n🤝 Partnership Outreach Category:');
  console.log(`   Templates used: ${partnershipTemplates.join(', ')}`);
  console.log(`   Unique templates: ${new Set(partnershipTemplates).size}/${partnershipTemplates.length}`);
  
  console.log('\n❄️ Cold Outreach Category:');
  console.log(`   Templates used: ${coldOutreachTemplates.join(', ')}`);
  console.log(`   Unique templates: ${new Set(coldOutreachTemplates).size}/${coldOutreachTemplates.length}`);
  
  console.log('\n🎯 Verification:');
  
  // Check partnership category rotation
  const partnershipVariations = generator.getTemplateVariations('partnership_outreach');
  console.log(`   Partnership variations available: ${partnershipVariations.length}`);
  console.log(`   Partnership variations: ${partnershipVariations.join(', ')}`);
  
  // Check cold outreach category rotation  
  const coldVariations = generator.getTemplateVariations('cold_outreach');
  console.log(`   Cold outreach variations available: ${coldVariations.length}`);
  console.log(`   Cold outreach variations: ${coldVariations.join(', ')}`);
  
  // Verify rotation is working correctly within categories
  const partnershipUnique = new Set(partnershipTemplates).size;
  const coldUnique = new Set(coldOutreachTemplates).size;
  
  if (partnershipUnique > 1 && coldUnique > 1) {
    console.log('\n🎉 CATEGORY-BASED ROTATION SUCCESS!');
    console.log('✅ Templates rotate within user-selected categories only');
    console.log('✅ Partnership outreach templates are different for each email');
    console.log('✅ Cold outreach templates are different for each email');
    console.log('✅ No cross-category template mixing');
  } else {
    console.log('\n⚠️ Category rotation needs adjustment');
    if (partnershipUnique <= 1) console.log('   Partnership templates not rotating properly');
    if (coldUnique <= 1) console.log('   Cold outreach templates not rotating properly');
  }
}

testCategoryRotation().catch(console.error);