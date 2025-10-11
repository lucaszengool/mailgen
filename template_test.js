// Template Selection Test Script
// Run this in the browser console to test template selection

console.log('🧪 TEMPLATE TEST: Starting template selection test');

// First, let's simulate having some email data
const testEmailData = {
  to: 'test@example.com',
  name: 'John Doe',
  company: 'Test Corp'
};

// Function to simulate template selection
function testTemplateSelection() {
  console.log('🧪 TEMPLATE TEST: Simulating template selection');

  // Look for the template selector button
  const templateButton = document.querySelector('[data-testid="template-selector"]') ||
                        document.querySelector('button[class*="template"]') ||
                        document.querySelector('button:contains("Template")');

  if (templateButton) {
    console.log('🧪 TEMPLATE TEST: Found template button, clicking...');
    templateButton.click();

    setTimeout(() => {
      // Look for template options
      const templates = document.querySelectorAll('[data-template-id]') ||
                       document.querySelectorAll('[class*="template-card"]');

      if (templates.length > 0) {
        console.log('🧪 TEMPLATE TEST: Found', templates.length, 'templates');

        // Select the first template
        console.log('🧪 TEMPLATE TEST: Selecting first template...');
        templates[0].click();

        setTimeout(() => {
          // Look for confirm button
          const confirmButton = document.querySelector('button:contains("Use This Template")') ||
                               document.querySelector('[data-testid="confirm-template"]') ||
                               document.querySelector('button[class*="confirm"]');

          if (confirmButton) {
            console.log('🧪 TEMPLATE TEST: Found confirm button, clicking...');
            confirmButton.click();
          } else {
            console.log('🧪 TEMPLATE TEST: No confirm button found');
          }
        }, 1000);
      } else {
        console.log('🧪 TEMPLATE TEST: No templates found in modal');
      }
    }, 1000);
  } else {
    console.log('🧪 TEMPLATE TEST: No template button found');
    console.log('🧪 TEMPLATE TEST: Available buttons:', document.querySelectorAll('button'));
  }
}

// Function to test email generation
function testEmailGeneration() {
  console.log('🧪 TEMPLATE TEST: Testing email generation');

  // Look for send button
  const sendButton = document.querySelector('button:contains("SEND")') ||
                    document.querySelector('[data-testid="send-button"]') ||
                    document.querySelector('button[class*="send"]');

  if (sendButton) {
    console.log('🧪 TEMPLATE TEST: Found send button, clicking...');
    sendButton.click();
  } else {
    console.log('🧪 TEMPLATE TEST: No send button found');
    console.log('🧪 TEMPLATE TEST: Available buttons:', document.querySelectorAll('button'));
  }
}

// Start the test
console.log('🧪 TEMPLATE TEST: Waiting 3 seconds for page to load...');
setTimeout(() => {
  testTemplateSelection();

  // Test email generation after template selection
  setTimeout(() => {
    testEmailGeneration();
  }, 5000);
}, 3000);

console.log('🧪 TEMPLATE TEST: Test script loaded. Check console for debug logs.');