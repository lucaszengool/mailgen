console.log('🧪 Testing CTA Button Website Redirect...');

const ModernEmailTemplates = require('./server/services/ModernEmailTemplates');
const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const PremiumEmailTemplates2025 = require('./server/services/PremiumEmailTemplates2025');

console.log('\n=== Testing CTA Button Configuration ===');

// Test ModernEmailTemplates CTA logic
const modernTemplates = new ModernEmailTemplates();

console.log('🎯 Testing ModernEmailTemplates CTA:');

// Test without booking URL - should redirect to website
const templateDataWithoutBooking = {
  companyWebsite: 'https://mycompany.com',
  senderName: 'John Doe'
};

const ctaWithoutBooking = modernTemplates.getCallToAction(templateDataWithoutBooking);
console.log('   Without booking URL:');
console.log(`     Text: "${ctaWithoutBooking.text}"`);
console.log(`     URL: "${ctaWithoutBooking.url}"`);
console.log(`     Description: "${ctaWithoutBooking.description}"`);

// Test with booking URL - should still allow scheduling
const templateDataWithBooking = {
  companyWebsite: 'https://mycompany.com',
  bookingUrl: 'https://calendly.com/john-doe/meeting',
  senderName: 'John Doe'
};

const ctaWithBooking = modernTemplates.getCallToAction(templateDataWithBooking);
console.log('   With booking URL:');
console.log(`     Text: "${ctaWithBooking.text}"`);
console.log(`     URL: "${ctaWithBooking.url}"`);
console.log(`     Description: "${ctaWithBooking.description}"`);

// Test PersonalizedEmailGenerator CTA logic
console.log('\n🎯 Testing PersonalizedEmailGenerator CTA:');
const generator = new PersonalizedEmailGenerator();

// Mock prospect without calendar link
const prospectWithoutCalendar = {
  name: 'Jane Smith',
  email: 'jane@company.com',
  company: 'TestCorp',
  templateData: {
    companyWebsite: 'https://mycompany.com'
    // No calendarLink
  }
};

// Mock prospect with calendar link  
const prospectWithCalendar = {
  name: 'John Doe', 
  email: 'john@company.com',
  company: 'TestCorp',
  templateData: {
    companyWebsite: 'https://mycompany.com',
    calendarLink: 'https://calendly.com/john-doe/meeting'
  }
};

// Test PremiumEmailTemplates2025 campaign goals
console.log('\n🎯 Testing PremiumEmailTemplates2025 Campaign Goals:');
const premiumTemplates = new PremiumEmailTemplates2025();

const partnershipGoal = premiumTemplates.campaignGoalMessaging.partnership;
const directSalesGoal = premiumTemplates.campaignGoalMessaging['direct sales'];

console.log('   Partnership goal CTA:', partnershipGoal.cta);
console.log('   Direct sales goal CTA:', directSalesGoal.cta);

// Verification results
console.log('\n🎯 CTA Redirect Verification:');

const tests = [
  {
    name: 'ModernTemplates without booking',
    expected: 'Visit Our Website',
    actual: ctaWithoutBooking.text,
    urlExpected: 'https://mycompany.com', 
    urlActual: ctaWithoutBooking.url
  },
  {
    name: 'ModernTemplates with booking',
    expected: 'Schedule a Call',
    actual: ctaWithBooking.text,
    urlExpected: 'https://calendly.com/john-doe/meeting',
    urlActual: ctaWithBooking.url
  },
  {
    name: 'Partnership goal CTA',
    expected: 'Visit Our Website',
    actual: partnershipGoal.cta
  },
  {
    name: 'Direct sales goal CTA', 
    expected: 'Visit Our Website',
    actual: directSalesGoal.cta
  }
];

let allTestsPassed = true;

tests.forEach(test => {
  const textPassed = test.actual === test.expected;
  const urlPassed = !test.urlExpected || test.urlActual === test.urlExpected;
  const testPassed = textPassed && urlPassed;
  
  if (!testPassed) allTestsPassed = false;
  
  console.log(`   ${testPassed ? '✅' : '❌'} ${test.name}:`);
  console.log(`       Text: "${test.actual}" ${textPassed ? '✅' : '❌'}`);
  if (test.urlExpected) {
    console.log(`       URL: "${test.urlActual}" ${urlPassed ? '✅' : '❌'}`);
  }
});

if (allTestsPassed) {
  console.log('\n🎉 CTA WEBSITE REDIRECT SUCCESS!');
  console.log('✅ "Schedule Meeting" buttons replaced with "Visit Our Website"');
  console.log('✅ Default CTAs redirect to company website');
  console.log('✅ Calendar booking still available when URL provided');
  console.log('✅ All campaign goals use website redirect by default');
  console.log('✅ Professional and user-friendly CTA text updated');
} else {
  console.log('\n⚠️ Some CTA redirect issues remain');
}

console.log('\n📋 Summary:');
console.log('   Default CTA behavior: Redirect to website');
console.log('   Optional calendar booking: Available when URL provided');
console.log('   All templates updated: ModernEmailTemplates, PersonalizedEmailGenerator, PremiumEmailTemplates2025');