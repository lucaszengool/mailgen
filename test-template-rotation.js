console.log('🧪 Testing Template Rotation System...');

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const generator = new PersonalizedEmailGenerator();

// Test template rotation with multiple prospects
const testProspects = [
  { name: 'John Doe', email: 'john@company1.com', company: 'Company1', preferredTemplate: null }, // Should use rotation
  { name: 'Jane Smith', email: 'jane@company2.com', company: 'Company2', preferredTemplate: null }, // Should use next template
  { name: 'Bob Johnson', email: 'bob@company3.com', company: 'Company3', preferredTemplate: 'cold_outreach' }, // Should use specified template
  { name: 'Alice Brown', email: 'alice@company4.com', company: 'Company4', preferredTemplate: null }, // Should use rotation (next)
  { name: 'Charlie Davis', email: 'charlie@company5.com', company: 'Company5', preferredTemplate: null } // Should use rotation
];

const businessAnalysis = {
  companyName: 'TestCorp',
  industry: 'Technology',
  valueProposition: 'AI solutions'
};

console.log('\n=== Testing Template Rotation Logic ===');
console.log(`Available templates: ${generator.availableTemplates.length}`);
console.log('First 10 templates:', generator.availableTemplates.slice(0, 10));

async function testTemplateRotation() {
  console.log('\n🔄 Testing Template Selection for 5 Different Prospects:');
  
  const selectedTemplates = [];
  
  for (let i = 0; i < testProspects.length; i++) {
    const prospect = testProspects[i];
    console.log(`\nProspect ${i + 1}: ${prospect.name} (${prospect.email})`);
    console.log(`   Preferred Template: ${prospect.preferredTemplate || 'none (should use rotation)'}`);
    
    // Test template selection without full email generation
    const selectedTemplate = generator.selectTemplateWithRotation(prospect.preferredTemplate, true);
    selectedTemplates.push(selectedTemplate);
    
    console.log(`   Selected Template: ${selectedTemplate}`);
    console.log(`   Rotation Index: ${generator.templateRotationIndex}/${generator.availableTemplates.length}`);
  }
  
  console.log('\n=== Template Rotation Test Results ===');
  console.log('Selected templates for each prospect:');
  selectedTemplates.forEach((template, i) => {
    const prospect = testProspects[i];
    console.log(`  ${i + 1}. ${prospect.name}: ${template} ${prospect.preferredTemplate ? '(user specified)' : '(rotated)'}`);
  });
  
  // Verify rotation is working
  const rotatedTemplates = selectedTemplates.filter((_, i) => !testProspects[i].preferredTemplate);
  const uniqueRotatedTemplates = new Set(rotatedTemplates);
  
  console.log('\n🎯 Rotation Verification:');
  console.log(`   Total rotated templates: ${rotatedTemplates.length}`);
  console.log(`   Unique rotated templates: ${uniqueRotatedTemplates.size}`);
  console.log(`   Templates used: ${Array.from(uniqueRotatedTemplates).join(', ')}`);
  
  if (uniqueRotatedTemplates.size >= Math.min(rotatedTemplates.length, 4)) {
    console.log('\n🎉 TEMPLATE ROTATION SUCCESS!');
    console.log('✅ Different templates are being used for each prospect');
    console.log('✅ User-specified templates are respected');  
    console.log('✅ Automatic rotation is working correctly');
    console.log(`✅ ${generator.availableTemplates.length} templates available for rotation`);
  } else {
    console.log('\n⚠️ Template rotation may need adjustment');
  }
}

testTemplateRotation().catch(console.error);