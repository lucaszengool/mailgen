// Paste this in the browser console when on the email editor page

// 1. Check what's in localStorage
console.log('=== CHECKING LOCALSTORAGE ===');
const autoSaveKeys = Object.keys(localStorage).filter(k => k.includes('email_editor_autosave'));
console.log('Auto-save keys found:', autoSaveKeys);

autoSaveKeys.forEach(key => {
  const data = localStorage.getItem(key);
  try {
    const parsed = JSON.parse(data);
    console.log(`\n📦 ${key}:`);
    console.log('  Subject:', parsed.subject);
    console.log('  Components:', parsed.components?.length || 0);
    console.log('  HTML length:', parsed.html?.length || 0);
    console.log('  Timestamp:', parsed.timestamp);
  } catch (e) {
    console.log(`Failed to parse ${key}`);
  }
});

// 2. Simulate saving some test data
console.log('\n=== SIMULATING SAVE ===');
const testData = {
  subject: 'TEST AUTO-SAVE SUBJECT',
  preheader: 'Test preheader',
  components: [{type: 'test', id: 'test123'}],
  html: '<h1>TEST CONTENT THAT SHOULD BE RESTORED</h1>',
  timestamp: new Date().toISOString()
};

// Save with multiple keys to ensure we find it
['email_editor_autosave_default', 'email_editor_autosave_campaign_test'].forEach(key => {
  localStorage.setItem(key, JSON.stringify(testData));
  console.log('Saved test data to:', key);
});

console.log('\n✅ Test data saved. Now:');
console.log('1. Navigate to another page');
console.log('2. Come back to email editor');
console.log('3. You should see "TEST AUTO-SAVE SUBJECT" and "TEST CONTENT THAT SHOULD BE RESTORED"');