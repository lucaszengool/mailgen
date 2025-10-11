// Test script to verify unique auto-save keys are working
// Paste this in browser console when on email editor page

console.log('🧪 TESTING UNIQUE AUTO-SAVE KEYS');

// Clear existing auto-save data
Object.keys(localStorage).filter(k => k.includes('email_editor_autosave')).forEach(k => {
  localStorage.removeItem(k);
  console.log('🗑️ Cleared:', k);
});

// Simulate email data for different emails
const emails = [
  {
    to: 'ftc@uidaho.edu',
    subject: 'Original Subject 1',
    body: '<h1>Original Email 1</h1>'
  },
  {
    to: 'dclevenger@atsautomation.com',
    subject: 'Original Subject 2',
    body: '<h1>Original Email 2</h1>'
  },
  {
    to: 'editor@foodtech.com',
    subject: 'Original Subject 3',
    body: '<h1>Original Email 3</h1>'
  }
];

// Create unique auto-save data for each email
emails.forEach((email, index) => {
  const key = `email_editor_autosave_email_${email.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const autoSaveData = {
    subject: `🔥 EDITED EMAIL ${index + 1} SUBJECT 🔥`,
    preheader: `Email ${index + 1} edited preheader`,
    components: [
      {type: 'hero', id: `email${index + 1}_hero`, content: {html: `<h1>EMAIL ${index + 1} HERO COMPONENT</h1>`}},
      {type: 'button', id: `email${index + 1}_btn`, content: {html: `<button>EMAIL ${index + 1} BUTTON</button>`}},
      ...(index === 1 ? [{type: 'extra', id: `email${index + 1}_extra`, content: {html: `<div>EMAIL ${index + 1} EXTRA COMPONENT</div>`}}] : [])
    ],
    html: `<h1>🎯 THIS IS EDITED EMAIL ${index + 1} CONTENT 🎯</h1><p>Unique content for email ${index + 1}</p>`,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(autoSaveData));
  console.log(`✅ Created auto-save for Email ${index + 1}:`, key);
  console.log(`   Subject: ${autoSaveData.subject}`);
  console.log(`   Components: ${autoSaveData.components.length}`);
  console.log(`   HTML: ${autoSaveData.html.substring(0, 50)}...`);
});

console.log('\n📦 VERIFICATION - All saved keys:');
Object.keys(localStorage).filter(k => k.includes('email_editor_autosave')).forEach(key => {
  console.log('🔑', key);
});

console.log('\n✅ TEST DATA CREATED!');
console.log('🔄 Expected behavior when switching emails:');
console.log('• Email 1 (ftc@uidaho.edu) should show: "🔥 EDITED EMAIL 1 SUBJECT 🔥" and 2 components');
console.log('• Email 2 (dclevenger@atsautomation.com) should show: "🔥 EDITED EMAIL 2 SUBJECT 🔥" and 3 components');
console.log('• Email 3 (editor@foodtech.com) should show: "🔥 EDITED EMAIL 3 SUBJECT 🔥" and 2 components');
console.log('• Each email should have completely different content!');

console.log('\n🔍 Now check the console logs when switching emails - you should see:');
console.log('• "🔑 Using email-based key: email_editor_autosave_email_ftc_uidaho_edu"');
console.log('• "🚀 FOUND AUTO-SAVE FOR THIS EMAIL"');
console.log('• Different content loading for each email');