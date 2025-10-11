// Comprehensive autosave test script
// Run this in the browser console to test autosave functionality

console.log('🧪 STARTING COMPREHENSIVE AUTOSAVE TEST');

// Test 1: Check localStorage keys consistency
function testLocalStorageKeys() {
  console.log('\n🔍 TEST 1: localStorage Keys Consistency');

  const keys = Object.keys(localStorage).filter(key => key.includes('email_editor_autosave'));
  console.log('📋 Found autosave keys:', keys);

  keys.forEach(key => {
    const data = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(data);
      console.log(`📝 Key: ${key}`);
      console.log(`   Email: ${parsed.emailAddress || 'unknown'}`);
      console.log(`   Components: ${parsed.componentsCount || 0}`);
      console.log(`   Timestamp: ${parsed.timestamp}`);
    } catch (e) {
      console.log(`❌ Invalid data for key: ${key}`);
    }
  });
}

// Test 2: Simulate email data mismatch scenario
function testEmailMismatch() {
  console.log('\n🔍 TEST 2: Email Data Mismatch Scenario');

  // Check if we have the global state
  if (typeof window.testEmailData !== 'undefined') {
    const emailData = window.testEmailData;
    const availableEmails = window.testAvailableEmails;

    console.log('📧 Current emailData.to:', emailData?.to);
    console.log('📧 availableEmails[0].to:', availableEmails?.[0]?.to);
    console.log('🚨 Mismatch detected:', emailData?.to !== availableEmails?.[0]?.to);
  } else {
    console.log('⚠️ No test data available in window object');
  }
}

// Test 3: Check autosave key calculation
function testAutoSaveKeyCalculation() {
  console.log('\n🔍 TEST 3: AutoSave Key Calculation');

  const testEmails = [
    { to: 'foodscience@ag.tamu.edu', id: 'test1' },
    { to: 'editors@ift.org', id: 'test2' },
    { to: 'test@example.com', id: 'test3' }
  ];

  testEmails.forEach(email => {
    const expectedKey = `email_editor_autosave_email_${email.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
    console.log(`📧 Email: ${email.to} -> Key: ${expectedKey}`);
  });
}

// Test 4: Check console for error patterns
function checkConsoleErrors() {
  console.log('\n🔍 TEST 4: Console Error Patterns');
  console.log('🔍 Look for these patterns in console:');
  console.log('   ❌ "🚨 IS MISMATCH? true"');
  console.log('   ❌ "🚨 WILL AUTO-SAVE BREAK? YES"');
  console.log('   ❌ "🚨 KEY MISMATCH? true"');
  console.log('   ✅ "✅ Using emailData.to as primary source"');
  console.log('   ✅ "🚀 USING EMAILDATA as source of truth"');
}

// Run all tests
testLocalStorageKeys();
testEmailMismatch();
testAutoSaveKeyCalculation();
checkConsoleErrors();

console.log('\n🧪 TEST COMPLETE - Check output above for any issues');
console.log('💡 If you see mismatch warnings (🚨), the issue is NOT fully fixed');
console.log('✅ If you see "Using emailData.to as primary source", the fix is working');