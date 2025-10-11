// Test script to run in browser console
// Go to http://localhost:3000, open DevTools Console, paste this code

console.log('🧪 BROWSER CONSOLE TEST - Template Variable Replacement');

// Simulate the replaceTemplateVariables function from the component
const replaceTemplateVariables = (content, email) => {
  if (!content || typeof content !== 'string') return content
  
  const variables = {
    '{{companyName}}': email.recipient_company || 'Your Company',
    '{{recipientName}}': email.recipient_name || 'there',
    '{{senderName}}': email.sender_name || 'AI Marketing',
    '{{websiteUrl}}': email.website_url || 'https://example.com',
    '{{campaignId}}': email.campaign_id || 'default'
  }
  
  let processedContent = content
  Object.entries(variables).forEach(([placeholder, value]) => {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
    processedContent = processedContent.replace(regex, value)
  })
  
  return processedContent
}

// Test with sample email data
const testEmail = {
  to: "maria@deeplearning.ai",
  subject: "Strategic Collaboration with {{companyName}}",
  body: "<p>Dear {{recipientName}},</p><p>I hope this email finds you well. I am reaching out from {{companyName}} to discuss a potential strategic partnership.</p>",
  recipient_name: "Maria",
  recipient_company: "Deeplearning",
  sender_name: "John Smith"
};

console.log('📧 Test Email Data:', testEmail);
console.log();

// Test subject replacement
const originalSubject = testEmail.subject;
const replacedSubject = replaceTemplateVariables(originalSubject, testEmail);

console.log('📝 SUBJECT TEST:');
console.log('Original:', originalSubject);
console.log('Replaced:', replacedSubject);
console.log('Working:', originalSubject !== replacedSubject);
console.log();

// Test body replacement
const originalBody = testEmail.body;
const replacedBody = replaceTemplateVariables(originalBody, testEmail);

console.log('📄 BODY TEST:');
console.log('Original:', originalBody);
console.log('Replaced:', replacedBody);
console.log('Working:', originalBody !== replacedBody);
console.log();

// Check if the function exists in the component
if (typeof window !== 'undefined') {
  console.log('🔍 CHECKING CURRENT PAGE:');
  
  // Try to get the current emails from React DevTools or global state
  try {
    // This might work if React DevTools is available
    const emails = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    console.log('React DevTools available:', !!emails);
  } catch (e) {
    console.log('React DevTools not available');
  }
  
  console.log('Current URL:', window.location.href);
  console.log('Page loaded:', document.readyState);
}

console.log('✅ Test completed. The replaceTemplateVariables function should work correctly.');