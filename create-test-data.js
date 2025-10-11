// Paste this in browser console when on the email editor page

// Clear any existing auto-save
Object.keys(localStorage).filter(k => k.includes('email_editor_autosave')).forEach(k => localStorage.removeItem(k));

// Create test auto-save data
const testData = {
  subject: '🔥 TEST AUTO-SAVE SUBJECT 🔥',
  preheader: 'TEST PREHEADER',
  components: [
    {
      type: 'hero',
      id: 'test_hero_123',
      content: { html: '<h1>TEST HERO COMPONENT</h1>' }
    },
    {
      type: 'cta_primary',
      id: 'test_button_456',
      content: { html: '<button>TEST BUTTON</button>' }
    }
  ],
  html: '<h1>🚀 THIS IS TEST AUTO-SAVED CONTENT 🚀</h1><p>If you see this, auto-save worked!</p>',
  timestamp: new Date().toISOString()
};

// Save with multiple keys to ensure it's found
const keys = [
  'email_editor_autosave_default',
  'email_editor_autosave_campaign_1758398724130'
];

keys.forEach(key => {
  localStorage.setItem(key, JSON.stringify(testData));
  console.log('✅ Saved test data to:', key);
});

console.log('\n🎯 Test data created! Now refresh the page and you should see:');
console.log('- Subject: "🔥 TEST AUTO-SAVE SUBJECT 🔥"');
console.log('- Content: "🚀 THIS IS TEST AUTO-SAVED CONTENT 🚀"');
console.log('- Auto-save: ✅ LOADED');
console.log('- Green "Draft Restored" badge');

// Show what we saved
console.log('\n📦 Saved data:', testData);