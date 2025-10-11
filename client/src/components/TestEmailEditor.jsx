import React from 'react';

export default function TestEmailEditor({
  emailData,
  availableEmails = [],
  onSave,
  onSend,
  onClose,
  onRefresh,
  campaignId,
  prospectId
}) {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Email Editor</h1>
      <p>This is a simple test component to verify React is working.</p>
      <p>Email Data: {emailData ? 'Present' : 'Not present'}</p>
      <p>Available Emails: {availableEmails.length}</p>
      <p>Campaign ID: {campaignId}</p>
      <button onClick={() => console.log('Test button clicked')}>Test Button</button>
    </div>
  );
}