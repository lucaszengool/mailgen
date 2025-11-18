#!/usr/bin/env node
/**
 * Apply frontend email display fixes to SimpleWorkflowDashboard.jsx
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/components/SimpleWorkflowDashboard.jsx');

console.log('🔧 Applying frontend email display fixes...\n');
console.log('📝 File:', filePath);

let content = fs.readFileSync(filePath, 'utf8');

// FIX 1: Enhanced email preview with debug logging
const oldEmailPreview = `          {/* Email Preview */}
          {email.body && (
            <details className="bg-gray-800/30 border border-gray-700 rounded-xl">
              <summary className="cursor-pointer text-sm font-medium p-4 text-white hover:bg-gray-800/50 transition-colors rounded-xl flex items-center justify-between">
                <span>📄 Preview Generated Email</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 border-t border-gray-700">
                <div className="text-sm mb-3 font-medium text-gray-300">
                  <strong className="text-white">Subject:</strong> {email.subject}
                </div>
                <div className="text-sm border-t border-gray-700 pt-3 text-gray-300 max-h-48 overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: email.body }}
                    className="prose prose-sm prose-invert max-w-none"
                  />
                </div>
              </div>
            </details>
          )}`;

const newEmailPreview = `          {/* Email Preview - ✅ FIXED: Full HTML rendering with debug */}
          {email.body && (() => {
            console.log('🔍 [EMAIL PREVIEW] Rendering email:', {
              to: email.to,
              subject: email.subject,
              subjectLength: email.subject?.length,
              bodyLength: email.body?.length,
              bodyIsHTML: email.body?.includes('<'),
              hasCustomizations: email.body?.includes('style='),
              campaignId: email.campaignId || email.campaign_id
            });
            return (
              <details className="bg-gray-800/30 border border-gray-700 rounded-xl">
                <summary className="cursor-pointer text-sm font-medium p-4 text-white hover:bg-gray-800/50 transition-colors rounded-xl flex items-center justify-between">
                  <span>📄 Preview Generated Email</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 border-t border-gray-700">
                  <div className="text-sm mb-3 font-medium text-gray-300">
                    <strong className="text-white">Subject:</strong> <span className="ml-2">{email.subject || '(No subject)'}</span>
                    {email.subject && email.subject.length < 15 && (
                      <span className="ml-2 text-yellow-400 text-xs">⚠️ May be truncated ({email.subject.length} chars)</span>
                    )}
                  </div>
                  <div className="text-sm border-t border-gray-700 pt-3 text-gray-300" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {email.body.includes('<') ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: email.body }}
                        className="prose prose-sm prose-invert max-w-none"
                        style={{ color: 'inherit', fontFamily: 'inherit' }}
                      />
                    ) : (
                      <div className="text-yellow-400 p-4 border border-yellow-700 rounded bg-yellow-900/20">
                        <p className="font-bold mb-2">⚠️ Warning: Plain Text</p>
                        <p className="text-sm mb-3">Email is plain text, not HTML. Customizations may not be visible.</p>
                        <pre className="whitespace-pre-wrap text-gray-300">{email.body}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            );
          })()}`;

if (content.includes(oldEmailPreview)) {
  content = content.replace(oldEmailPreview, newEmailPreview);
  console.log('✅ FIX 1: Enhanced email preview with debug logging');
} else {
  console.log('⚠️  FIX 1: Could not find exact match for email preview - may need manual fix');
}

// FIX 2: Add campaign validation to WebSocket first_email_ready handler
const oldWebSocketHandler = `      // 🔥 IMMEDIATE: Handle first email ready signal
      if (data.type === 'first_email_ready') {
        console.log('🔔 FIRST EMAIL READY signal received via WebSocket!', data.data);
        if (data.data.firstEmailGenerated && !hasShownFirstEmailModal) {
          console.log('👀 Immediately showing first email popup from WebSocket');

          // 🔥 CRITICAL: Clear any animation state that might interfere
          setWaitingForDetailedWindow(false);
          setIsAnimating(false);

          setEmailForReview(data.data.firstEmailGenerated);
          setShowEmailReview(true);
          console.log('🔥 POPUP STATE SET via WebSocket: showEmailReview = true');
          setHasShownFirstEmailModal(true);
          setWorkflowStatus('paused_for_review');
        }
      }`;

const newWebSocketHandler = `      // 🔥 IMMEDIATE: Handle first email ready signal - ✅ FIXED: Campaign validation
      if (data.type === 'first_email_ready') {
        console.log('🔔 FIRST EMAIL READY signal received via WebSocket!', data.data);

        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const emailCampaignId = data.data?.firstEmailGenerated?.campaignId;

        console.log('🔍 [WEBSOCKET] Campaign validation:');
        console.log('   Current campaign:', currentCampaignId);
        console.log('   Email campaign:', emailCampaignId);
        console.log('   Match:', currentCampaignId === emailCampaignId);

        // ✅ Only process if campaign IDs match
        if (currentCampaignId && emailCampaignId && currentCampaignId !== emailCampaignId) {
          console.log('🗑️  [WEBSOCKET] Ignoring email from different campaign');
          return;
        }

        if (data.data.firstEmailGenerated && !hasShownFirstEmailModal) {
          console.log('👀 Immediately showing first email popup from WebSocket');

          // 🔥 CRITICAL: Clear any animation state that might interfere
          setWaitingForDetailedWindow(false);
          setIsAnimating(false);

          setEmailForReview(data.data.firstEmailGenerated);
          setShowEmailReview(true);
          console.log('🔥 POPUP STATE SET via WebSocket: showEmailReview = true');
          setHasShownFirstEmailModal(true);
          setWorkflowStatus('paused_for_review');
        }
      }`;

if (content.includes(oldWebSocketHandler)) {
  content = content.replace(oldWebSocketHandler, newWebSocketHandler);
  console.log('✅ FIX 2: Added campaign validation to WebSocket handler');
} else {
  console.log('⚠️  FIX 2: Could not find exact match for WebSocket handler - may need manual fix');
}

// Write the updated content
fs.writeFileSync(filePath, content);

console.log('\n✅ Frontend fixes applied successfully!');
console.log('\n📋 Changes made:');
console.log('   1. Enhanced email preview with HTML/plain text detection');
console.log('   2. Added subject line truncation warning');
console.log('   3. Added comprehensive debug logging');
console.log('   4. Added campaign ID validation to WebSocket handler');
console.log('\n🔄 Next steps:');
console.log('   1. Restart your development server');
console.log('   2. Create a new campaign and generate emails');
console.log('   3. Check browser console for debug output');
console.log('   4. Verify HTML renders with colors/logos/components');
console.log('   5. Verify emails don\'t mix between campaigns\n');
