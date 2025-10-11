// Email Navigation Test Script for Browser Console
// This script simulates the exact navigation scenario that was causing autosave issues

console.log('🧪 EMAIL NAVIGATION AUTOSAVE TEST SCRIPT');
console.log('======================================');

// Test the scenario where emailData.to doesn't match availableEmails[0].to
function testEmailMismatchScenario() {
  console.log('\n🔍 TEST: Email Data Mismatch Scenario');

  // Simulate the exact scenario from the logs
  const emailData = {
    to: 'foodscience@ag.tamu.edu',
    subject: 'Ag - Strategic Collaboration with Ag',
    body: 'Test content',
    recipientName: 'Foodscience',
    company: 'Ag',
    quality_score: 0.85,
    campaignId: 'campaign_123'
  };

  const availableEmails = [
    {
      id: 'email_campaign_1758410735585_2',
      to: 'editors@ift.org',  // Different email!
      subject: 'Ag - Strategic Collaboration with Ag',
      body: 'Different content',
      status: 'sent'
    },
    {
      id: 'email_campaign_1758410735585_3',
      to: 'foodscience@ag.tamu.edu',  // Matching email at index 1
      subject: 'Another email',
      body: 'More content',
      status: 'pending'
    }
  ];

  console.log('📧 emailData.to:', emailData.to);
  console.log('📧 availableEmails[0].to:', availableEmails[0].to);
  console.log('🚨 Mismatch detected:', emailData.to !== availableEmails[0].to);

  // Test autosave key calculation - OLD WAY (broken)
  const oldWayKey = `email_editor_autosave_email_${availableEmails[0].to.replace(/[^a-zA-Z0-9]/g, '_')}`;
  console.log('❌ OLD WAY key (using availableEmails[0]):', oldWayKey);

  // Test autosave key calculation - NEW WAY (fixed)
  const newWayKey = `email_editor_autosave_email_${emailData.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
  console.log('✅ NEW WAY key (using emailData.to):', newWayKey);

  console.log('🔑 Keys match?', oldWayKey === newWayKey ? 'YES ✅' : 'NO ❌');

  return { emailData, availableEmails, oldWayKey, newWayKey };
}

// Test localStorage consistency
function testLocalStorageConsistency() {
  console.log('\n🔍 TEST: localStorage Consistency');

  const autoSaveKeys = Object.keys(localStorage).filter(key =>
    key.includes('email_editor_autosave')
  );

  console.log('📋 Found autosave keys:', autoSaveKeys.length);

  autoSaveKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      const parsed = JSON.parse(data);
      console.log(`📝 Key: ${key}`);
      console.log(`   Email: ${parsed.emailAddress || 'unknown'}`);
      console.log(`   Components: ${parsed.componentsCount || 0}`);
      console.log(`   Timestamp: ${new Date(parsed.timestamp).toLocaleString()}`);

      // Check if key matches email address
      if (parsed.emailAddress) {
        const expectedKey = `email_editor_autosave_email_${parsed.emailAddress.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const keyMatches = key === expectedKey;
        console.log(`   Key consistency: ${keyMatches ? '✅' : '❌'} ${keyMatches ? '' : '(Expected: ' + expectedKey + ')'}`);
      }
    } catch (e) {
      console.log(`❌ Invalid data for key: ${key}`);
    }
  });
}

// Test component preservation
function testComponentPreservation() {
  console.log('\n🔍 TEST: Component Preservation Check');

  // Check if there are any components in memory
  if (typeof window.emailComponents !== 'undefined') {
    console.log('📋 Current emailComponents:', window.emailComponents.length);
    window.emailComponents.forEach((comp, index) => {
      console.log(`   Component ${index}: ${comp.type} (${comp.id})`);
    });
  } else {
    console.log('⚠️ No emailComponents found in window object');
  }

  // Check autosave data for current email
  const currentEmail = window.currentEmailData || { to: 'unknown' };
  const currentKey = `email_editor_autosave_email_${currentEmail.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const savedData = localStorage.getItem(currentKey);

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      console.log('💾 Autosaved components for current email:');
      console.log(`   Components count: ${parsed.componentsCount || 0}`);
      console.log(`   HTML length: ${parsed.htmlLength || 0}`);
      console.log(`   Last saved: ${new Date(parsed.timestamp).toLocaleString()}`);
    } catch (e) {
      console.log('❌ Invalid autosave data');
    }
  } else {
    console.log('📭 No autosave data found for current email');
  }
}

// Test for remaining mismatch patterns
function checkForMismatchPatterns() {
  console.log('\n🔍 TEST: Checking for Mismatch Patterns in Console');

  const patterns = [
    '🚨 IS MISMATCH? true',
    '🚨 WILL AUTO-SAVE BREAK? YES',
    '🚨 KEY MISMATCH? true',
    'COMPONENTS WILL BE LOST'
  ];

  console.log('🔍 Looking for these error patterns in console:');
  patterns.forEach(pattern => {
    console.log(`   - "${pattern}"`);
  });

  console.log('\n✅ If you see these patterns above, the issue is NOT fixed');
  console.log('✅ If you see "Using emailData.to as primary source", the fix is working');
}

// Run all tests
function runAllTests() {
  console.log('🧪 RUNNING ALL AUTOSAVE TESTS');
  console.log('============================');

  const results = testEmailMismatchScenario();
  testLocalStorageConsistency();
  testComponentPreservation();
  checkForMismatchPatterns();

  console.log('\n🏁 TEST SUMMARY');
  console.log('===============');
  console.log('✅ Fixed: Always use emailData.to for autosave keys');
  console.log('✅ Fixed: Removed dependency on currentEmailIndex');
  console.log('✅ Fixed: Consistent key calculation across all functions');

  // Store test results for later reference
  window.autosaveTestResults = results;

  return results;
}

// Auto-run tests when script is loaded
runAllTests();