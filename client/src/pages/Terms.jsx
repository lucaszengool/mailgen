import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="flex items-center mb-8">
          <FileText className="w-8 h-8 mr-3" style={{ color: '#00f5a0' }} />
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 text-lg mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using MailGen ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              MailGen is an AI-powered email marketing automation platform that helps you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Discover and research prospects</li>
              <li>Generate personalized email content using AI</li>
              <li>Send automated email campaigns</li>
              <li>Track email performance and analytics</li>
              <li>Conduct market research and competitive analysis</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Comply with Laws:</strong> Use the Service in compliance with all applicable laws and regulations</li>
              <li><strong>Respect Recipients:</strong> Only send emails to people who have consented to receive them</li>
              <li><strong>No Spam:</strong> Not use the Service for spam, unsolicited bulk emails, or illegal activities</li>
              <li><strong>CAN-SPAM Compliance:</strong> Include accurate sender information and honor opt-out requests</li>
              <li><strong>Secure Credentials:</strong> Keep your account credentials secure and confidential</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. OAuth and Email Access</h2>
            <p className="text-gray-700 mb-4">
              When you connect your email account (Gmail, Outlook, etc.):
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You grant MailGen permission to send emails on your behalf</li>
              <li>You authorize us to read email analytics (opens, replies)</li>
              <li>You can revoke access at any time through your email provider's settings</li>
              <li>We will only use your email account for the purposes you authorize</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
            <p className="text-gray-700 mb-4">You may NOT use MailGen to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Send spam or unsolicited commercial emails</li>
              <li>Phish, scam, or deceive recipients</li>
              <li>Violate any person's privacy or data protection rights</li>
              <li>Distribute malware, viruses, or harmful content</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Harass, threaten, or abuse others</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Violation of this policy may result in immediate account termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. AI-Generated Content</h2>
            <p className="text-gray-700 mb-4">
              Our Service uses AI to generate email content. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>AI-generated content should be reviewed before sending</li>
              <li>You are responsible for all content sent through your account</li>
              <li>We do not guarantee accuracy or appropriateness of AI-generated content</li>
              <li>Final approval and responsibility for emails rests with you</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
            <p className="text-gray-700">
              We strive to provide reliable service, but we do not guarantee uninterrupted access.
              We may suspend or terminate the Service for maintenance, updates, or other reasons with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service and its content are protected by copyright and other intellectual property laws.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>MailGen retains all rights to the Service and its technology</li>
              <li>You retain ownership of your data and email content</li>
              <li>You grant us a license to process your data to provide the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, MailGen shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Account Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate accounts that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Violate these Terms of Service</li>
              <li>Engage in abusive or illegal behavior</li>
              <li>Are inactive for extended periods</li>
              <li>Pose security risks to our Service or users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about these Terms, please contact us at:{' '}
              <a href="mailto:support@mailgen.com" className="text-blue-600 hover:underline">
                support@mailgen.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
              in which MailGen operates, without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
