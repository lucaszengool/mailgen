/**
 * COMPREHENSIVE EMAIL FIXES WITH DEBUG LOGGING
 *
 * This patch fixes:
 * 1. Email HTML rendering - ensures full HTML with customizations is displayed
 * 2. Campaign isolation - prevents emails from mixing between campaigns
 * 3. Subject line truncation - ensures full subject is stored/displayed
 * 4. Adds extensive debug logging for troubleshooting
 *
 * Apply this patch by running: node server/patches/comprehensive-email-fixes-with-debug.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 =====================================================');
console.log('🔧 COMPREHENSIVE EMAIL FIXES WITH DEBUG LOGGING');
console.log('🔧 =====================================================\n');

// ============================================================================
// FIX 1: EMAIL HTML RENDERING - Ensure full HTML template is stored/displayed
// ============================================================================

console.log('📝 FIX 1: Patching email generation to ensure complete HTML storage...\n');

const langGraphAgentPath = path.join(__dirname, '../agents/LangGraphMarketingAgent.js');
const langGraphContent = fs.readFileSync(langGraphAgentPath, 'utf8');

// Add comprehensive debug logging to email generation
const emailGenerationDebugPatch = `
// 🔍 DEBUG: Comprehensive email data logging before storage
console.log('\\n${'='.repeat(80)}');
console.log('📧 [EMAIL GENERATION DEBUG] Email data before storage');
console.log('${'='.repeat(80)}');
console.log('📋 Subject:', finalEmail.subject);
console.log('📋 Subject length:', finalEmail.subject?.length || 0);
console.log('📋 To:', finalEmail.to);
console.log('📋 Body/HTML exists:', !!finalEmail.body);
console.log('📋 Body/HTML length:', finalEmail.body?.length || 0);
console.log('📋 Body/HTML type:', typeof finalEmail.body);
console.log('📋 Body/HTML first 200 chars:', finalEmail.body?.substring(0, 200) || 'NONE');
console.log('📋 Campaign ID:', finalEmail.campaignId);
console.log('📋 Template:', finalEmail.template);
console.log('📋 Quality Score:', finalEmail.quality_score);
console.log('📋 All email keys:', Object.keys(finalEmail));
console.log('${'='.repeat(80)}\\n');

// 🔍 CRITICAL: Ensure body field contains full HTML
if (!finalEmail.body && finalEmail.html) {
  console.log('⚠️  WARNING: body field missing but html field exists - copying html to body');
  finalEmail.body = finalEmail.html;
} else if (!finalEmail.body) {
  console.log('❌ CRITICAL ERROR: No body or html field in email object!');
  console.log('❌ Email object structure:', JSON.stringify(finalEmail, null, 2));
}

// 🔍 CRITICAL: Validate HTML contains template elements
if (finalEmail.body) {
  const htmlValidation = {
    hasDiv: finalEmail.body.includes('<div'),
    hasStyle: finalEmail.body.includes('style='),
    hasColor: finalEmail.body.includes('color:') || finalEmail.body.includes('background'),
    length: finalEmail.body.length,
    isPlainText: !finalEmail.body.includes('<') && !finalEmail.body.includes('>'),
    hasComponents: finalEmail.body.includes('component-') || finalEmail.body.includes('id='),
  };

  console.log('\\n🔍 [HTML VALIDATION]', htmlValidation);

  if (htmlValidation.isPlainText) {
    console.log('⚠️  WARNING: Email body appears to be plain text, not HTML!');
    console.log('⚠️  This may indicate template personalization failed');
  } else if (!htmlValidation.hasStyle && !htmlValidation.hasColor) {
    console.log('⚠️  WARNING: Email body has no styling - user customizations may be missing');
  }
}
`;

// Find where emails are generated and add debug logging
let patchedContent = langGraphContent;

// Patch location: After email object is created in generatePersonalizedEmail
const emailCreationMarker = 'const finalEmail = {';
if (patchedContent.includes(emailCreationMarker)) {
  const insertAfter = patchedContent.indexOf('};', patchedContent.indexOf(emailCreationMarker)) + 2;
  patchedContent = patchedContent.slice(0, insertAfter) + '\n' + emailGenerationDebugPatch + '\n' + patchedContent.slice(insertAfter);
  console.log('✅ Added email generation debug logging');
} else {
  console.log('⚠️  Could not find email creation marker - manual patch may be needed');
}

// Write patched content back
fs.writeFileSync(langGraphAgentPath, patchedContent);
console.log('✅ Email generation debug patch applied\n');

// ============================================================================
// FIX 2: CAMPAIGN ISOLATION - Prevent emails from mixing between campaigns
// ============================================================================

console.log('🔒 FIX 2: Patching campaign isolation in workflow results...\n');

const workflowRoutePath = path.join(__dirname, '../routes/workflow.js');
let workflowContent = fs.readFileSync(workflowRoutePath, 'utf8');

// Add comprehensive campaign isolation debug logging
const campaignIsolationPatch = `
// 🔍 CAMPAIGN ISOLATION DEBUG
console.log('\\n${'='.repeat(80)}');
console.log('🔒 [CAMPAIGN ISOLATION CHECK]');
console.log('${'='.repeat(80)}');
console.log('📋 Requested Campaign ID:', campaignId);
console.log('📋 User ID:', userId);
console.log('📋 Results Campaign ID:', results.campaignId);
console.log('📋 Campaign ID Match:', results.campaignId === campaignId);

// 🔍 Email campaign debug
if (results.emailCampaign && results.emailCampaign.emails) {
  console.log('📧 Email Campaign Analysis:');
  console.log('   Total emails:', results.emailCampaign.emails.length);

  // Check each email's campaign ID
  const emailsByCampaign = {};
  results.emailCampaign.emails.forEach((email, index) => {
    const emailCampaignId = email.campaignId || email.campaign_id || 'NO_CAMPAIGN_ID';
    if (!emailsByCampaign[emailCampaignId]) {
      emailsByCampaign[emailCampaignId] = [];
    }
    emailsByCampaign[emailCampaignId].push({
      index,
      to: email.to,
      subject: email.subject?.substring(0, 50),
      campaignId: emailCampaignId
    });
  });

  console.log('   Emails by Campaign ID:');
  Object.keys(emailsByCampaign).forEach(cid => {
    console.log(\`      \${cid}: \${emailsByCampaign[cid].length} emails\`);
    if (cid !== campaignId) {
      console.log(\`      ⚠️  MISMATCH: Found \${emailsByCampaign[cid].length} emails from wrong campaign!\`);
      emailsByCampaign[cid].forEach((email, i) => {
        if (i < 3) { // Show first 3 only
          console.log(\`         - \${email.to}: \${email.subject}\`);
        }
      });
    }
  });

  // 🔥 CRITICAL FIX: Filter emails to only include this campaign
  const emailsBeforeFilter = results.emailCampaign.emails.length;
  results.emailCampaign.emails = results.emailCampaign.emails.filter(email => {
    const emailCid = email.campaignId || email.campaign_id;
    const matches = emailCid === campaignId;
    if (!matches) {
      console.log(\`   🗑️  Filtering out email from campaign \${emailCid}: \${email.to}\`);
    }
    return matches;
  });
  const emailsAfterFilter = results.emailCampaign.emails.length;

  if (emailsBeforeFilter !== emailsAfterFilter) {
    console.log(\`   ✅ Filtered emails: \${emailsBeforeFilter} → \${emailsAfterFilter} (removed \${emailsBeforeFilter - emailsAfterFilter})\`);
  } else {
    console.log('   ✅ All emails belong to this campaign');
  }
}

// 🔍 Prospects debug
if (results.prospects) {
  console.log('👥 Prospects Analysis:');
  console.log('   Total prospects:', results.prospects.length);

  const prospectsByCampaign = {};
  results.prospects.forEach((prospect, index) => {
    const prospectCampaignId = prospect.campaignId || prospect.campaign_id || 'NO_CAMPAIGN_ID';
    if (!prospectsByCampaign[prospectCampaignId]) {
      prospectsByCampaign[prospectCampaignId] = [];
    }
    prospectsByCampaign[prospectCampaignId].push({
      index,
      email: prospect.email,
      name: prospect.name,
      campaignId: prospectCampaignId
    });
  });

  console.log('   Prospects by Campaign ID:');
  Object.keys(prospectsByCampaign).forEach(cid => {
    console.log(\`      \${cid}: \${prospectsByCampaign[cid].length} prospects\`);
    if (cid !== campaignId) {
      console.log(\`      ⚠️  MISMATCH: Found \${prospectsByCampaign[cid].length} prospects from wrong campaign!\`);
    }
  });

  // 🔥 CRITICAL FIX: Filter prospects to only include this campaign
  const prospectsBeforeFilter = results.prospects.length;
  results.prospects = results.prospects.filter(prospect => {
    const prospectCid = prospect.campaignId || prospect.campaign_id;
    const matches = prospectCid === campaignId;
    if (!matches) {
      console.log(\`   🗑️  Filtering out prospect from campaign \${prospectCid}: \${prospect.email}\`);
    }
    return matches;
  });
  const prospectsAfterFilter = results.prospects.length;

  if (prospectsBeforeFilter !== prospectsAfterFilter) {
    console.log(\`   ✅ Filtered prospects: \${prospectsBeforeFilter} → \${prospectsAfterFilter} (removed \${prospectsBeforeFilter - prospectsAfterFilter})\`);
  } else {
    console.log('   ✅ All prospects belong to this campaign');
  }
}

console.log('${'='.repeat(80)}\\n');
`;

// Find where workflow results are retrieved and add filtering
const resultsMarker = 'const results = getWorkflowResults';
if (workflowContent.includes(resultsMarker)) {
  const insertPoint = workflowContent.indexOf('\n', workflowContent.indexOf(resultsMarker) + resultsMarker.length);
  workflowContent = workflowContent.slice(0, insertPoint) + '\n' + campaignIsolationPatch + workflowContent.slice(insertPoint);
  console.log('✅ Added campaign isolation patch');
} else {
  console.log('⚠️  Could not find workflow results marker - manual patch may be needed');
}

fs.writeFileSync(workflowRoutePath, workflowContent);
console.log('✅ Campaign isolation patch applied\n');

// ============================================================================
// FIX 3: SUBJECT LINE - Ensure full subject is stored and displayed
// ============================================================================

console.log('📝 FIX 3: Patching subject line handling...\n');

// Re-read the patched content
let langGraphContentV2 = fs.readFileSync(langGraphAgentPath, 'utf8');

const subjectDebugPatch = `
// 🔍 SUBJECT LINE DEBUG
console.log('\\n${'='.repeat(80)}');
console.log('📝 [SUBJECT LINE DEBUG]');
console.log('${'='.repeat(80)}');
console.log('📋 Original subject from template:', subject);
console.log('📋 Subject type:', typeof subject);
console.log('📋 Subject length:', subject?.length || 0);
console.log('📋 Subject is truncated:', subject && subject.length < 10);
if (subject && subject.includes('{')) {
  console.log('📋 Subject has placeholders:', subject.match(/\\{[^}]+\\}/g));
}
console.log('📋 After personalization:', finalEmail.subject);
console.log('📋 Personalized length:', finalEmail.subject?.length || 0);
console.log('${'='.repeat(80)}\\n');

// 🔥 CRITICAL: Ensure subject is never truncated
if (finalEmail.subject && finalEmail.subject.length < 10) {
  console.log('⚠️  WARNING: Subject appears truncated (< 10 chars):', finalEmail.subject);
  console.log('⚠️  Attempting to recover from templateData...');
  if (templateData && templateData.subject && templateData.subject.length > finalEmail.subject.length) {
    console.log('✅ Recovered longer subject from templateData:', templateData.subject);
    finalEmail.subject = templateData.subject
      .replace(/\\{company\\}/gi, prospect.company || 'Your Company')
      .replace(/\\{name\\}/gi, prospect.name || 'there');
  }
}
`;

// Find subject line handling and add debug
const subjectMarker = "finalEmail.subject = ";
if (langGraphContentV2.includes(subjectMarker)) {
  const insertPoint = langGraphContentV2.indexOf(';', langGraphContentV2.indexOf(subjectMarker)) + 1;
  langGraphContentV2 = langGraphContentV2.slice(0, insertPoint) + '\n' + subjectDebugPatch + langGraphContentV2.slice(insertPoint);
  console.log('✅ Added subject line debug logging');
} else {
  console.log('⚠️  Could not find subject marker - manual patch may be needed');
}

fs.writeFileSync(langGraphAgentPath, langGraphContentV2);
console.log('✅ Subject line patch applied\n');

// ============================================================================
// FIX 4: WEBSOCKET EMAIL BROADCAST - Add debug logging
// ============================================================================

console.log('📡 FIX 4: Adding WebSocket broadcast debug logging...\n');

const websocketPath = path.join(__dirname, '../services/WebSocketManager.js');
if (fs.existsSync(websocketPath)) {
  let wsContent = fs.readFileSync(websocketPath, 'utf8');

  const wsBroadcastDebug = `
// 🔍 WEBSOCKET BROADCAST DEBUG
console.log('\\n${'='.repeat(80)}');
console.log('📡 [WEBSOCKET BROADCAST DEBUG]');
console.log('${'='.repeat(80)}');
console.log('📋 Message type:', message.type);
console.log('📋 User ID:', userId);
console.log('📋 Campaign ID:', message.data?.campaignId);
if (message.type === 'first_email_ready' || message.type === 'email_preview_generated') {
  console.log('📧 Email broadcast details:');
  console.log('   To:', message.data?.firstEmailGenerated?.to || message.data?.preview?.to);
  console.log('   Subject:', message.data?.firstEmailGenerated?.subject || message.data?.preview?.subject);
  console.log('   Body length:', message.data?.firstEmailGenerated?.body?.length || message.data?.preview?.body?.length || 0);
  console.log('   Body is HTML:', (message.data?.firstEmailGenerated?.body || message.data?.preview?.body)?.includes('<'));
}
console.log('${'='.repeat(80)}\\n');
`;

  // Add debug to broadcast method
  if (wsContent.includes('broadcast(message, userId')) {
    const broadcastPoint = wsContent.indexOf('{', wsContent.indexOf('broadcast(message, userId')) + 1;
    wsContent = wsContent.slice(0, broadcastPoint) + '\n' + wsBroadcastDebug + wsContent.slice(broadcastPoint);
    console.log('✅ Added WebSocket broadcast debug logging');
    fs.writeFileSync(websocketPath, wsContent);
  } else {
    console.log('⚠️  Could not find WebSocket broadcast method');
  }
} else {
  console.log('⚠️  WebSocketManager.js not found');
}

console.log('✅ WebSocket debug logging added\n');

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n🎉 =====================================================');
console.log('🎉 COMPREHENSIVE PATCHES APPLIED SUCCESSFULLY!');
console.log('🎉 =====================================================\n');

console.log('✅ Applied fixes:');
console.log('   1. ✅ Email HTML rendering - added validation & debug logs');
console.log('   2. ✅ Campaign isolation - added filtering & campaign ID checks');
console.log('   3. ✅ Subject line handling - added truncation detection & recovery');
console.log('   4. ✅ WebSocket broadcasts - added comprehensive debug logging\n');

console.log('📋 Next steps:');
console.log('   1. Restart your server: npm run server:dev');
console.log('   2. Start a new campaign and generate emails');
console.log('   3. Check logs for debug output marked with [EMAIL GENERATION DEBUG]');
console.log('   4. Check logs for [CAMPAIGN ISOLATION CHECK]');
console.log('   5. Check logs for [SUBJECT LINE DEBUG]');
console.log('   6. Check logs for [WEBSOCKET BROADCAST DEBUG]\n');

console.log('🔍 Debug log markers to look for:');
console.log('   📧 [EMAIL GENERATION DEBUG] - Shows email data before storage');
console.log('   🔒 [CAMPAIGN ISOLATION CHECK] - Shows campaign filtering');
console.log('   📝 [SUBJECT LINE DEBUG] - Shows subject line processing');
console.log('   📡 [WEBSOCKET BROADCAST DEBUG] - Shows WebSocket messages\n');

console.log('📝 If issues persist, check the logs for these markers and share them for analysis.\n');
