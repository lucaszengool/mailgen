// Test template variable replacement
const testEmails = [
  {
    id: "test_1",
    to: "maria@deeplearning.ai",
    subject: "Strategic Collaboration with {{companyName}}",
    body: `<div style="padding: 20px; font-family: Arial, sans-serif;">
      <p>Dear {{recipientName}},</p>
      <p>I hope this email finds you well. I am reaching out from {{companyName}} to discuss a potential strategic partnership.</p>
      <p>Our company specializes in AI/Machine Learning solutions and we believe there could be valuable synergies with Deeplearning.</p>
      <p>Would you be available for a brief call to explore collaboration opportunities?</p>
      <p>Best regards,<br>{{senderName}}</p>
      <a href="{{websiteUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Schedule Meeting</a>
    </div>`,
    recipient_name: "Maria",
    recipient_company: "Deeplearning",
    sender_name: "John Smith", 
    sender_email: "john@example.com",
    campaign_id: "test_campaign_123",
    template_used: "partnership_outreach",
    status: "sent",
    sent_at: new Date().toISOString(),
    opens: 0,
    clicks: 0,
    replies: 0
  },
  {
    id: "test_2",
    to: "contact@basis.ai", 
    subject: "{{companyName}} - Partnership Opportunity",
    body: `<div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2>Hello {{recipientName}},</h2>
      <p>{{companyName}} is excited to connect with innovative companies like Basis.</p>
      <p>We have developed cutting-edge solutions that could complement your AI platform perfectly.</p>
      <p>Let me know if you would be interested in a quick 15-minute call to discuss potential collaboration.</p>
      <p>Tagline here</p>
      <p>Looking forward to hearing from you!</p>
      <p>Best,<br>{{senderName}}</p>
    </div>`,
    recipient_name: "Contact",
    recipient_company: "Basis",
    sender_name: "AI Marketing Team",
    sender_email: "ai@company.com", 
    campaign_id: "test_campaign_123",
    template_used: "partnership_outreach",
    status: "sent",
    sent_at: new Date().toISOString(),
    opens: 1,
    clicks: 0,
    replies: 0
  }
];

// Post to workflow results endpoint
const postTestEmails = async () => {
  try {
    const response = await fetch('http://localhost:3333/api/workflow/mock-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailCampaign: {
          emails: testEmails,
          emailsSent: testEmails,
          sent: testEmails.length,
          campaignId: 'test_campaign_123'
        }
      })
    });
    
    const result = await response.json();
    console.log('Test emails injected:', result);
  } catch (error) {
    console.error('Failed to inject test emails:', error);
  }
};

if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  postTestEmails();
} else {
  // Browser environment
  postTestEmails();
}