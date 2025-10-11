#!/usr/bin/env node

/**
 * Email Switching Test - Validates that email component persistence works correctly
 *
 * This test simulates:
 * 1. Creating multiple emails with different content
 * 2. Editing components in email A
 * 3. Switching to email B
 * 4. Switching back to email A
 * 5. Verifying that email A's edits are preserved
 */

const { EmailDatabase, EmailPersistenceManager, debouncedSaver } = require('./client/src/utils/emailDatabase.js');

async function testEmailSwitching() {
  console.log('🧪 Starting Email Switching Test...\n');

  try {
    // Test data
    const emailA = {
      to: 'test1@example.com',
      subject: 'Email A Subject',
      components: [
        { id: 'comp1', type: 'text_rich', content: { text: 'Original Email A content' } },
        { id: 'comp2', type: 'button', content: { text: 'Click me A' } }
      ],
      html: '<p>Original Email A content</p><button>Click me A</button>'
    };

    const emailB = {
      to: 'test2@example.com',
      subject: 'Email B Subject',
      components: [
        { id: 'comp3', type: 'text_rich', content: { text: 'Original Email B content' } }
      ],
      html: '<p>Original Email B content</p>'
    };

    const emailAKey = `email_editor_autosave_email_${emailA.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const emailBKey = `email_editor_autosave_email_${emailB.to.replace(/[^a-zA-Z0-9]/g, '_')}`;

    console.log('📧 Email A Key:', emailAKey);
    console.log('📧 Email B Key:', emailBKey);
    console.log('');

    // 1. Clear any existing data
    console.log('🧹 Clearing existing test data...');
    await EmailPersistenceManager.deleteEmailEdit(emailAKey);
    await EmailPersistenceManager.deleteEmailEdit(emailBKey);
    console.log('✅ Test data cleared\n');

    // 2. Start "editing" email A
    console.log('📝 Starting to edit Email A...');
    await EmailPersistenceManager.saveEmailEdit(emailAKey, emailA);
    console.log('✅ Email A saved\n');

    // 3. Make some edits to email A
    console.log('✏️ Making edits to Email A...');
    const editedEmailA = {
      ...emailA,
      subject: 'Email A Subject - EDITED',
      components: [
        { id: 'comp1', type: 'text_rich', content: { text: 'EDITED Email A content - MODIFIED' } },
        { id: 'comp2', type: 'button', content: { text: 'Click me A - EDITED' } },
        { id: 'comp4', type: 'text_rich', content: { text: 'NEW component added to Email A' } }
      ],
      html: '<p>EDITED Email A content - MODIFIED</p><button>Click me A - EDITED</button><p>NEW component added to Email A</p>'
    };

    await EmailPersistenceManager.saveEmailEdit(emailAKey, editedEmailA);
    console.log('✅ Email A edits saved');
    console.log(`   📊 Components: ${editedEmailA.components.length}`);
    console.log(`   📝 Subject: ${editedEmailA.subject}`);
    console.log('');

    // 4. Switch to email B (simulate user clicking on different email)
    console.log('🔄 Switching to Email B...');
    await EmailPersistenceManager.saveEmailEdit(emailBKey, emailB);
    console.log('✅ Email B loaded and saved\n');

    // 5. Make some edits to email B
    console.log('✏️ Making edits to Email B...');
    const editedEmailB = {
      ...emailB,
      subject: 'Email B Subject - EDITED',
      components: [
        { id: 'comp3', type: 'text_rich', content: { text: 'EDITED Email B content - MODIFIED' } },
        { id: 'comp5', type: 'button', content: { text: 'New button in Email B' } }
      ],
      html: '<p>EDITED Email B content - MODIFIED</p><button>New button in Email B</button>'
    };

    await EmailPersistenceManager.saveEmailEdit(emailBKey, editedEmailB);
    console.log('✅ Email B edits saved');
    console.log(`   📊 Components: ${editedEmailB.components.length}`);
    console.log(`   📝 Subject: ${editedEmailB.subject}`);
    console.log('');

    // 6. Switch back to email A (critical test - should preserve edits)
    console.log('🔄 Switching back to Email A...');
    const loadedEmailA = await EmailPersistenceManager.loadEmailEdit(emailAKey);

    if (!loadedEmailA) {
      throw new Error('❌ FAILED: No data found for Email A after switching back');
    }

    console.log('✅ Email A data loaded:');
    console.log(`   📊 Components: ${loadedEmailA.components?.length || 0}`);
    console.log(`   📝 Subject: ${loadedEmailA.subject || 'NO SUBJECT'}`);
    console.log(`   📄 HTML length: ${loadedEmailA.html?.length || 0}`);
    console.log('');

    // 7. Verify Email A edits are preserved
    console.log('🔍 Verifying Email A edits are preserved...');

    const checks = [
      {
        name: 'Subject preservation',
        expected: 'Email A Subject - EDITED',
        actual: loadedEmailA.subject,
        pass: loadedEmailA.subject === 'Email A Subject - EDITED'
      },
      {
        name: 'Component count',
        expected: 3,
        actual: loadedEmailA.components?.length || 0,
        pass: (loadedEmailA.components?.length || 0) === 3
      },
      {
        name: 'First component edit',
        expected: 'EDITED Email A content - MODIFIED',
        actual: loadedEmailA.components?.[0]?.content?.text || '',
        pass: (loadedEmailA.components?.[0]?.content?.text || '') === 'EDITED Email A content - MODIFIED'
      },
      {
        name: 'New component addition',
        expected: 'NEW component added to Email A',
        actual: loadedEmailA.components?.[2]?.content?.text || '',
        pass: (loadedEmailA.components?.[2]?.content?.text || '') === 'NEW component added to Email A'
      }
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (check.pass) {
        console.log(`   ✅ ${check.name}: PASS`);
      } else {
        console.log(`   ❌ ${check.name}: FAIL`);
        console.log(`      Expected: ${check.expected}`);
        console.log(`      Actual: ${check.actual}`);
        allPassed = false;
      }
    });

    console.log('');

    // 8. Verify Email B is still intact
    console.log('🔍 Verifying Email B is still intact...');
    const loadedEmailB = await EmailPersistenceManager.loadEmailEdit(emailBKey);

    if (!loadedEmailB) {
      console.log('❌ Email B data lost!');
      allPassed = false;
    } else {
      const emailBChecks = [
        {
          name: 'Email B subject',
          expected: 'Email B Subject - EDITED',
          actual: loadedEmailB.subject,
          pass: loadedEmailB.subject === 'Email B Subject - EDITED'
        },
        {
          name: 'Email B components',
          expected: 2,
          actual: loadedEmailB.components?.length || 0,
          pass: (loadedEmailB.components?.length || 0) === 2
        }
      ];

      emailBChecks.forEach(check => {
        if (check.pass) {
          console.log(`   ✅ ${check.name}: PASS`);
        } else {
          console.log(`   ❌ ${check.name}: FAIL`);
          allPassed = false;
        }
      });
    }

    console.log('');

    // 9. Test meaningful edit detection
    console.log('🔍 Testing meaningful edit detection...');
    const meaningfulA = await EmailPersistenceManager.hasMeaningfulEdit(emailAKey);
    const meaningfulB = await EmailPersistenceManager.hasMeaningfulEdit(emailBKey);

    if (meaningfulA && meaningfulB) {
      console.log('   ✅ Both emails detected as having meaningful edits');
    } else {
      console.log('   ❌ Meaningful edit detection failed');
      console.log(`      Email A meaningful: ${meaningfulA}`);
      console.log(`      Email B meaningful: ${meaningfulB}`);
      allPassed = false;
    }

    console.log('');

    // 10. Final result
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Email switching works correctly.');
      console.log('✅ Email edits are preserved when switching between emails');
      console.log('✅ Each email maintains its own isolated data');
      console.log('✅ No data contamination between emails');
    } else {
      console.log('❌ SOME TESTS FAILED! Email switching needs more fixes.');
      throw new Error('Email switching test failed');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await EmailPersistenceManager.deleteEmailEdit(emailAKey);
    await EmailPersistenceManager.deleteEmailEdit(emailBKey);
    console.log('✅ Test cleanup complete');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailSwitching().then(() => {
  console.log('\n🏁 Test completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});