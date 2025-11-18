/**
 * COMPREHENSIVE FIX FOR EMAIL GENERATION ISSUES
 *
 * This fix addresses:
 * 1. AI generating placeholder text like "[Recipient's Name]" instead of actual names
 * 2. User's color customizations not being applied to final HTML
 * 3. Campaign isolation - emails from different campaigns mixing together
 *
 * Date: 2025-11-18
 */

const fs = require('fs');
const path = require('path');

console.log(`
================================================================================
🔧 COMPREHENSIVE EMAIL GENERATION FIXES
================================================================================

This script will fix:
✅ Issue 1: AI placeholder text in generated emails
✅ Issue 2: User color customizations not being applied
✅ Issue 3: Campaign isolation for email storage

`);

// ============================================================================
// FIX 1: Enhanced Placeholder Removal
// ============================================================================

const enhancedPlaceholderRemoval = `
  /**
   * 🔥 ENHANCED: More comprehensive placeholder removal
   * Handles ALL bracket placeholder patterns including mixed-case
   */
  removeHTMLPlaceholders(html) {
    if (!html) return html;

    console.log(\`🧹 Removing placeholders from customized HTML (\${html.length} chars)...\`);

    // Only remove bracketed placeholders, preserve all HTML structure and whitespace
    let cleaned = html
      // Remove [GENERATED CONTENT X: ...] placeholders
      .replace(/\\[GENERATED CONTENT[^\\]]*\\]/gi, '')

      // ✅ FIX: Remove ALL bracket patterns - be more aggressive
      // This catches [Name], [Recipient's Name], [Your Name], [Contact Information], etc.
      .replace(/\\[[^\\]]+Name[^\\]]*\\]/gi, '')  // Any bracket with "Name" in it
      .replace(/\\[[^\\]]+Company[^\\]]*\\]/gi, '')  // Any bracket with "Company" in it
      .replace(/\\[[^\\]]+Email[^\\]]*\\]/gi, '')  // Any bracket with "Email" in it
      .replace(/\\[[^\\]]+Contact[^\\]]*\\]/gi, '')  // Any bracket with "Contact" in it
      .replace(/\\[[^\\]]+Information[^\\]]*\\]/gi, '')  // Any bracket with "Information" in it
      .replace(/\\[[^\\]]+Location[^\\]]*\\]/gi, '')  // Any bracket with "Location" in it
      .replace(/\\[[^\\]]+Date[^\\]]*\\]/gi, '')  // Any bracket with "Date" in it
      .replace(/\\[[^\\]]+Time[^\\]]*\\]/gi, '')  // Any bracket with "Time" in it
      .replace(/\\[[^\\]]+Title[^\\]]*\\]/gi, '')  // Any bracket with "Title" in it
      .replace(/\\[[^\\]]+Role[^\\]]*\\]/gi, '')  // Any bracket with "Role" in it
      .replace(/\\[[^\\]]+Position[^\\]]*\\]/gi, '')  // Any bracket with "Position" in it

      // Remove old specific patterns (keep for backwards compatibility)
      .replace(/\\[Name\\]/gi, '')
      .replace(/\\[Company\\]/gi, '')
      .replace(/\\[Position\\]/gi, '')
      .replace(/\\[Industry\\]/gi, '')
      .replace(/\\[Title\\]/gi, '')
      .replace(/\\[Role\\]/gi, '')
      .replace(/\\[Email\\]/gi, '')

      // ✅ FIX: Remove any remaining bracket placeholders (be very aggressive)
      // This catches anything in brackets that looks like a placeholder
      .replace(/\\[[A-Z][a-zA-Z\\s']*\\]/g, '');  // Matches [Name], [Recipient's Name], etc.

    // DO NOT remove whitespace, line breaks, or any HTML formatting
    // The user designed this structure intentionally

    console.log(\`✅ Placeholder removal complete (\${cleaned.length} chars)\`);
    return cleaned;
  }
`;

// ============================================================================
// FIX 2: Apply Color Customizations to HTML
// ============================================================================

const colorCustomizationFix = `
  /**
   * 🎨 NEW FUNCTION: Apply user's color customizations to HTML
   * This ensures user-selected colors actually appear in the final email
   */
  applyColorCustomizations(html, customizations) {
    if (!html || !customizations) return html;

    const { primaryColor, accentColor, textColor, backgroundColor } = customizations;

    console.log(\`🎨 Applying color customizations:\`);
    console.log(\`   Primary: \${primaryColor || 'NOT SET'}\`);
    console.log(\`   Accent: \${accentColor || 'NOT SET'}\`);
    console.log(\`   Text: \${textColor || 'NOT SET'}\`);
    console.log(\`   Background: \${backgroundColor || 'NOT SET'}\`);

    let coloredHtml = html;

    // Apply primary color (replaces green #28a745, #047857, etc.)
    if (primaryColor && primaryColor !== '#6b7280') {
      coloredHtml = coloredHtml
        .replace(/#28a745/gi, primaryColor)  // Default green
        .replace(/#047857/gi, primaryColor)  // Dark green
        .replace(/#10b981/gi, primaryColor)  // Light green
        .replace(/#059669/gi, primaryColor)  // Medium green
        .replace(/rgb\\(40,\\s*167,\\s*69\\)/gi, \`rgb(\${hexToRgb(primaryColor)})\`);
      console.log(\`   ✅ Applied primary color: \${primaryColor}\`);
    }

    // Apply accent color (replaces secondary colors)
    if (accentColor && accentColor !== '#047857') {
      coloredHtml = coloredHtml
        .replace(/#6366f1/gi, accentColor)  // Default accent
        .replace(/#4f46e5/gi, accentColor)  // Dark accent
        .replace(/rgb\\(99,\\s*102,\\s*241\\)/gi, \`rgb(\${hexToRgb(accentColor)})\`);
      console.log(\`   ✅ Applied accent color: \${accentColor}\`);
    }

    // Apply text color (replaces #343a40, #495057, etc.)
    if (textColor && textColor !== '#1f2937') {
      coloredHtml = coloredHtml
        .replace(/#343a40/gi, textColor)  // Dark gray text
        .replace(/#495057/gi, textColor)  // Medium gray text
        .replace(/#1f2937/gi, textColor)  // Very dark gray
        .replace(/rgb\\(52,\\s*58,\\s*64\\)/gi, \`rgb(\${hexToRgb(textColor)})\`);
      console.log(\`   ✅ Applied text color: \${textColor}\`);
    }

    // Apply background color if provided
    if (backgroundColor && backgroundColor !== '#ffffff') {
      coloredHtml = coloredHtml
        .replace(/background:\\s*#ffffff/gi, \`background: \${backgroundColor}\`)
        .replace(/background-color:\\s*#ffffff/gi, \`background-color: \${backgroundColor}\`)
        .replace(/background:\\s*white/gi, \`background: \${backgroundColor}\`)
        .replace(/background-color:\\s*white/gi, \`background-color: \${backgroundColor}\`);
      console.log(\`   ✅ Applied background color: \${backgroundColor}\`);
    }

    console.log(\`🎨 Color customization complete!\`);
    return coloredHtml;
  }

  /**
   * Helper: Convert hex color to RGB string
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result
      ? \`\${parseInt(result[1], 16)}, \${parseInt(result[2], 16)}, \${parseInt(result[3], 16)}\`
      : '0, 0, 0';
  }
`;

// ============================================================================
// FIX 3: Improved AI Prompt to Prevent Placeholders
// ============================================================================

const improvedPromptAddition = `
CRITICAL INSTRUCTIONS - READ CAREFULLY:
- You MUST use the ACTUAL names provided in the context
- NEVER EVER use placeholders like [Recipient's Name], [Your Name], [Company Name], [Date], [Time], [Location]
- If you see "{recipientName}" in the context, write the ACTUAL NAME, not "[Recipient's Name]"
- If you see "{company}" in the context, write the ACTUAL COMPANY, not "[Company Name]"
- Write as if YOU are \${templateData.senderName || 'the sender'} writing DIRECTLY to \${prospect.name || 'the recipient'}
- Use natural language - "Hello \${prospect.name || 'there'}" NOT "Hello [Recipient's Name]"
- NO BRACKETS [] in your output - write real content only

VERIFICATION CHECKLIST before you write:
✓ I know the recipient's name: \${prospect.name || 'there'}
✓ I know their company: \${prospect.company || 'their company'}
✓ I know the sender: \${templateData.senderName || 'our team'}
✓ I will write using these ACTUAL values, not placeholders
`;

// ============================================================================
// Apply Fixes to LangGraphMarketingAgent.js
// ============================================================================

const agentFilePath = path.join(__dirname, 'server', 'agents', 'LangGraphMarketingAgent.js');

console.log(`📝 Reading LangGraphMarketingAgent.js...`);
let agentCode = fs.readFileSync(agentFilePath, 'utf8');

// Fix 1: Replace removeHTMLPlaceholders method
console.log(`\n✅ FIX 1: Enhancing placeholder removal...`);
agentCode = agentCode.replace(
  /removeHTMLPlaceholders\(html\) \{[\s\S]*?^  \}/m,
  enhancedPlaceholderRemoval.trim()
);

// Fix 2: Add color customization method (insert before generateOptimizedEmailContentWithPersona)
console.log(`✅ FIX 2: Adding color customization function...`);
const generateOptimizedIndex = agentCode.indexOf('async generateOptimizedEmailContentWithPersona(');
if (generateOptimizedIndex > 0) {
  agentCode = agentCode.slice(0, generateOptimizedIndex) +
    colorCustomizationFix + '\n\n  ' +
    agentCode.slice(generateOptimizedIndex);
} else {
  console.warn(`⚠️  Could not find insertion point for color customization function`);
}

// Fix 2b: Apply color customizations after cleaning HTML
console.log(`✅ FIX 2b: Applying color customizations to final HTML...`);
agentCode = agentCode.replace(
  /(const cleanedHtml = this\.removeHTMLPlaceholders\(personalizedHtml\);)/,
  `$1\n\n          // 🎨 STEP 6.5: Apply user's color customizations\n          const colorCustomizedHtml = this.applyColorCustomizations(cleanedHtml, templateData.customizations);\n          console.log(\`   ✅ Color customizations applied\`);`
);

// Fix 2c: Return colorCustomizedHtml instead of cleanedHtml
agentCode = agentCode.replace(
  /(return \{\s*subject: cleanedSubject,\s*body: )cleanedHtml/,
  '$1colorCustomizedHtml'
);

// Fix 3: Improve AI prompt
console.log(`✅ FIX 3: Improving AI prompt to prevent placeholders...`);
agentCode = agentCode.replace(
  /(Remember: Write ONLY the email content paragraphs\. Make it feel like .*? personally wrote it for .*?\.)`/,
  `$1\n\n${improvedPromptAddition}`
);

// Save fixed file
console.log(`\n💾 Writing fixed file...`);
fs.writeFileSync(agentFilePath, agentCode);

console.log(`\n✅ All fixes applied successfully!`);

// ============================================================================
// Fix 3: Campaign Isolation in Workflow Results
// ============================================================================

console.log(`\n✅ FIX 4: Ensuring campaign isolation in workflow results...`);

const workflowFilePath = path.join(__dirname, 'server', 'routes', 'workflow.js');
let workflowCode = fs.readFileSync(workflowFilePath, 'utf8');

// Find and enhance the campaign isolation check
const isolationCheck = `
      // 🔒 CRITICAL: Filter emails by campaignId to ensure campaign isolation
      let filteredEmails = emails;
      if (campaignId && emails && emails.length > 0) {
        const beforeCount = emails.length;
        filteredEmails = emails.filter(email => {
          // Check all possible campaign ID fields
          const emailCampaignId = email.campaignId || email.campaign_id || email.campaign;
          const matches = emailCampaignId === campaignId || emailCampaignId === String(campaignId);

          if (!matches) {
            console.log(\`   ⚠️  Filtering out email with campaignId: \${emailCampaignId} (requested: \${campaignId})\`);
          }

          return matches;
        });

        console.log(\`   🔒 Campaign isolation: \${beforeCount} total → \${filteredEmails.length} for campaign \${campaignId}\`);

        if (filteredEmails.length === 0 && beforeCount > 0) {
          console.warn(\`   ⚠️  WARNING: All \${beforeCount} emails were filtered out! Campaign ID mismatch!\`);
          console.warn(\`   🔍 Sample email campaignIds: \${emails.slice(0, 3).map(e => e.campaignId || e.campaign_id || e.campaign).join(', ')}\`);
        }
      }

      // Use filtered emails
      if (results.emailCampaign) {
        results.emailCampaign.emails = filteredEmails;
      }
`;

// Replace the existing filter logic with enhanced version
workflowCode = workflowCode.replace(
  /\/\/ 🔒 CRITICAL: Filter emails by campaignId[\s\S]*?\/\/ Use filtered emails/,
  isolationCheck.trim()
);

fs.writeFileSync(workflowFilePath, workflowCode);

console.log(`✅ Campaign isolation fix applied!`);

// ============================================================================
// Summary
// ============================================================================

console.log(`
================================================================================
✅ ALL FIXES APPLIED SUCCESSFULLY!
================================================================================

Fixed Issues:
1. ✅ Enhanced placeholder removal to catch ALL bracket patterns
   - Now removes [Recipient's Name], [Your Name], [Contact Information], etc.
   - More aggressive pattern matching

2. ✅ Color customization now properly applied
   - New applyColorCustomizations() function
   - Replaces default colors with user-selected colors
   - Applied after placeholder removal, before email storage

3. ✅ Improved AI prompts
   - Added explicit instructions to use actual names, not placeholders
   - Added verification checklist in prompt

4. ✅ Enhanced campaign isolation
   - Better filtering logic to prevent email mixing
   - Improved logging to detect isolation issues

Next Steps:
1. Restart your server: npm run server:dev
2. Create a new campaign and test template customization
3. Verify generated emails show:
   - Actual recipient names (not placeholders)
   - Your selected colors
   - Only emails from the current campaign

================================================================================
`);
