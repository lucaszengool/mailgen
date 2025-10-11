// Test script for per-email auto-save functionality
// Paste this in browser console when on email editor page

console.log('🧪 TESTING PER-EMAIL AUTO-SAVE FUNCTIONALITY');

// Clear all existing auto-save data
const clearAutoSave = () => {
  Object.keys(localStorage).filter(k => k.includes('email_editor_autosave')).forEach(k => {
    localStorage.removeItem(k);
    console.log('🗑️ Cleared:', k);
  });
};

// Create test data for multiple emails
const createTestData = () => {
  clearAutoSave();

  // Email 1: ftc@uidaho.edu
  const email1Data = {
    subject: '🔥 EMAIL 1 EDITED SUBJECT 🔥',
    preheader: 'Email 1 preheader',
    components: [
      {type: 'hero', id: 'email1_hero', content: {html: '<h1>EMAIL 1 HERO</h1>'}},
      {type: 'button', id: 'email1_btn', content: {html: '<button>EMAIL 1 BUTTON</button>'}}
    ],
    html: '<h1>🎯 THIS IS EMAIL 1 CONTENT 🎯</h1><p>Email 1 unique content</p>',
    timestamp: new Date().toISOString()
  };

  // Email 2: dclevenger@atsautomation.com
  const email2Data = {
    subject: '🚀 EMAIL 2 EDITED SUBJECT 🚀',
    preheader: 'Email 2 preheader',
    components: [
      {type: 'hero', id: 'email2_hero', content: {html: '<h1>EMAIL 2 HERO</h1>'}},
      {type: 'text', id: 'email2_text', content: {html: '<p>EMAIL 2 TEXT BLOCK</p>'}},
      {type: 'social', id: 'email2_social', content: {html: '<div>EMAIL 2 SOCIAL</div>'}}
    ],
    html: '<h1>⭐ THIS IS EMAIL 2 CONTENT ⭐</h1><p>Email 2 unique content - different from email 1</p>',
    timestamp: new Date().toISOString()
  };

  // Save with email-specific keys
  localStorage.setItem('email_editor_autosave_email_ftc_uidaho_edu', JSON.stringify(email1Data));
  localStorage.setItem('email_editor_autosave_email_dclevenger_atsautomation_com', JSON.stringify(email2Data));

  console.log('✅ Created test data for 2 emails:');
  console.log('📧 Email 1 (ftc@uidaho.edu):', email1Data.subject, '-', email1Data.components.length, 'components');
  console.log('📧 Email 2 (dclevenger@atsautomation.com):', email2Data.subject, '-', email2Data.components.length, 'components');
};

// Check what's saved
const checkSaved = () => {
  console.log('\n📦 CHECKING SAVED DATA:');
  Object.keys(localStorage).filter(k => k.includes('email_editor_autosave')).forEach(key => {
    const data = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(data);
      console.log(`\n🔑 ${key}:`);
      console.log(`  Subject: ${parsed.subject}`);
      console.log(`  Components: ${parsed.components?.length || 0}`);
      console.log(`  HTML: ${parsed.html?.substring(0, 50)}...`);
    } catch (e) {
      console.log(`  ❌ Failed to parse`);
    }
  });
};

// Test workflow
const testWorkflow = () => {
  console.log('\n🧪 TESTING WORKFLOW:');
  console.log('1. Create test data for multiple emails...');
  createTestData();

  setTimeout(() => {
    console.log('\n2. Check what was saved...');
    checkSaved();

    console.log('\n✅ TEST COMPLETE!');
    console.log('📋 EXPECTED BEHAVIOR:');
    console.log('• Each email should have DIFFERENT auto-save data');
    console.log('• Email 1 should show: "🔥 EMAIL 1 EDITED SUBJECT 🔥" and 2 components');
    console.log('• Email 2 should show: "🚀 EMAIL 2 EDITED SUBJECT 🚀" and 3 components');
    console.log('• Switching between emails should show different content');
    console.log('• Going to other pages and back should preserve per-email edits');

    console.log('\n🔄 NOW TEST IN UI:');
    console.log('• Refresh the page');
    console.log('• Check if auto-save loads for the current email');
    console.log('• Switch to different email - should load different auto-save');
    console.log('• Navigate away and back - should restore the right email\'s data');
  }, 500);
};

// Run the test
testWorkflow();