import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacy() {
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
          <Shield className="w-8 h-8 mr-3" style={{ color: '#00f5a0' }} />
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 text-lg mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              When you use MailGen, we collect the following information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and authentication credentials</li>
              <li><strong>Email Data:</strong> Email content, recipients, send status, and analytics</li>
              <li><strong>Usage Data:</strong> How you interact with our service, features used, and preferences</li>
              <li><strong>OAuth Tokens:</strong> Access and refresh tokens for email integration (encrypted)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Send marketing emails on your behalf via your connected email account</li>
              <li>Track email delivery, opens, and replies</li>
              <li>Generate AI-powered email content and market research</li>
              <li>Provide analytics and insights about your campaigns</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Gmail API Usage</h2>
            <p className="text-gray-700 mb-4">
              MailGen's use of information received from Gmail APIs will adhere to{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="text-gray-700 mb-4">
              Specifically, we:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Only access Gmail to send emails and read email analytics</li>
              <li>Do not share Gmail data with third parties</li>
              <li>Do not use Gmail data for advertising</li>
              <li>Encrypt OAuth tokens and store them securely</li>
              <li>Allow you to revoke access at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>OAuth tokens are encrypted at rest</li>
              <li>All connections use HTTPS/TLS encryption</li>
              <li>Access controls and authentication on all APIs</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700">
              We retain your data as long as your account is active. You can request deletion at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Google Gmail API:</strong> For email sending and analytics</li>
              <li><strong>Ollama:</strong> For local AI processing (your data stays on our servers)</li>
              <li><strong>Railway:</strong> For hosting and infrastructure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Revoke OAuth access at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@mailgen.com" className="text-blue-600 hover:underline">
                privacy@mailgen.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
