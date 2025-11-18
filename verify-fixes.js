/**
 * VERIFICATION SCRIPT - Confirm all email generation fixes are applied
 */

const fs = require('fs');
const path = require('path');

console.log(`
================================================================================
🔍 VERIFYING EMAIL GENERATION FIXES
================================================================================
`);

let allPassed = true;

// Check 1: Enhanced placeholder removal
console.log(`\n✅ CHECK 1: Enhanced placeholder removal patterns`);
const agentCode = fs.readFileSync(path.join(__dirname, 'server/agents/LangGraphMarketingAgent.js'), 'utf8');

const checks = [
  {
    name: 'Aggressive Name placeholder removal',
    pattern: /Any bracket with.*Name.*in it/,
    required: true
  },
  {
    name: 'Aggressive Company placeholder removal',
    pattern: /Any bracket with.*Company.*in it/,
    required: true
  },
  {
    name: 'Mixed-case pattern matching',
    pattern: /\[A-Z\]\[a-zA-Z/,
    required: true
  }
];

checks.forEach(check => {
  const found = check.pattern.test(agentCode);
  console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'PRESENT' : 'MISSING'}`);
  if (!found && check.required) allPassed = false;
});

// Check 2: Color customization function
console.log(`\n✅ CHECK 2: Color customization function`);
const colorChecks = [
  {
    name: 'applyColorCustomizations function exists',
    pattern: /applyColorCustomizations\(html, customizations\)/,
    required: true
  },
  {
    name: 'Primary color replacement',
    pattern: /#28a745/,
    required: true
  },
  {
    name: 'Text color replacement',
    pattern: /#343a40/,
    required: true
  },
  {
    name: 'hexToRgb helper function',
    pattern: /hexToRgb\(hex\)/,
    required: true
  },
  {
    name: 'Function is being called',
    pattern: /const colorCustomizedHtml = this\.applyColorCustomizations/,
    required: true
  },
  {
    name: 'colorCustomizedHtml used in return',
    pattern: /body: colorCustomizedHtml/,
    required: true
  },
  {
    name: 'html field also uses colorCustomizedHtml',
    pattern: /html: colorCustomizedHtml/,
    required: true
  }
];

colorChecks.forEach(check => {
  const found = check.pattern.test(agentCode);
  console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'PRESENT' : 'MISSING'}`);
  if (!found && check.required) allPassed = false;
});

// Check 3: Improved AI prompts
console.log(`\n✅ CHECK 3: Improved AI prompts`);
const promptChecks = [
  {
    name: 'Critical instructions added',
    pattern: /CRITICAL INSTRUCTIONS - READ CAREFULLY/,
    required: true
  },
  {
    name: 'Verification checklist added',
    pattern: /VERIFICATION CHECKLIST/,
    required: true
  },
  {
    name: 'No brackets instruction',
    pattern: /NO BRACKETS.*in your output/,
    required: true
  }
];

promptChecks.forEach(check => {
  const found = check.pattern.test(agentCode);
  console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'PRESENT' : 'MISSING'}`);
  if (!found && check.required) allPassed = false;
});

// Check 4: Campaign isolation
console.log(`\n✅ CHECK 4: Enhanced campaign isolation`);
const workflowCode = fs.readFileSync(path.join(__dirname, 'server/routes/workflow.js'), 'utf8');

const isolationChecks = [
  {
    name: 'Multi-field campaign ID check',
    pattern: /email\.campaignId \|\| email\.campaign_id \|\| email\.campaign/,
    required: true
  },
  {
    name: 'Campaign isolation logging',
    pattern: /Campaign isolation:/,
    required: true
  },
  {
    name: 'Filtering warning for mismatch',
    pattern: /Filtering out email with/,
    required: true
  }
];

isolationChecks.forEach(check => {
  const found = check.pattern.test(workflowCode);
  console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'PRESENT' : 'MISSING'}`);
  if (!found && check.required) allPassed = false;
});

// Final summary
console.log(`
================================================================================
${allPassed ? '✅ ALL FIXES VERIFIED SUCCESSFULLY!' : '❌ SOME FIXES ARE MISSING!'}
================================================================================
`);

if (allPassed) {
  console.log(`
🎉 All email generation fixes are properly applied!

Next Steps:
1. Restart your server: npm run server:dev
2. Test with a new campaign
3. Verify:
   ✓ No placeholder text in generated emails
   ✓ Your color customizations are applied
   ✓ Emails don't mix between campaigns

Happy emailing! 📧
  `);
} else {
  console.log(`
⚠️  Some fixes are missing. Please re-run:
    node fix-email-generation-issues.js

Then verify again with:
    node verify-fixes.js
  `);
  process.exit(1);
}
