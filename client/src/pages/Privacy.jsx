import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Server, UserCheck, Mail, ChevronRight } from 'lucide-react';

// Animation hook for scroll reveal
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Section component with animation
const Section = ({ icon, title, children, index }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <section
      ref={ref}
      className="mb-12 transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${index * 50}ms`
      }}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)' }}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold pt-1" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
          {title}
        </h2>
      </div>
      <div className="pl-14">
        {children}
      </div>
    </section>
  );
};

export default function Privacy() {
  const navigate = useNavigate();
  const [heroRef, heroVisible] = useScrollReveal();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* CSS for animations and styling */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .prose p {
          color: rgba(0, 0, 0, 0.65);
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 16px;
        }
        .prose ul {
          margin-bottom: 16px;
        }
        .prose li {
          color: rgba(0, 0, 0, 0.65);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 10px;
          padding-left: 24px;
          position: relative;
        }
        .prose li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00c98d;
        }
        .prose strong {
          color: rgba(0, 0, 0, 0.88);
          font-weight: 600;
        }
        .prose a {
          color: #00c98d;
          text-decoration: none;
          transition: color 0.2s;
        }
        .prose a:hover {
          color: #00a86b;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-1/4 w-96 h-96 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 240, 160, 0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-16">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium mb-10 transition-all duration-300 hover:gap-3 group"
            style={{ color: 'rgba(0, 0, 0, 0.5)' }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>

          <div
            ref={heroRef}
            className="transition-all duration-1000"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)' }}>
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>Privacy Policy</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Your privacy is important to us. This policy explains how MailGen collects, uses, and protects your information.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose max-w-none">
          <Section icon={<Database className="w-5 h-5" style={{ color: '#00c98d' }} />} title="1. Information We Collect" index={0}>
            <p>When you use MailGen, we collect the following information:</p>
            <ul>
              <li><strong>Account Information:</strong> Email address, name, and authentication credentials</li>
              <li><strong>Email Data:</strong> Email content, recipients, send status, and analytics</li>
              <li><strong>Usage Data:</strong> How you interact with our service, features used, and preferences</li>
              <li><strong>OAuth Tokens:</strong> Access and refresh tokens for email integration (encrypted)</li>
            </ul>
          </Section>

          <Section icon={<Eye className="w-5 h-5" style={{ color: '#00c98d' }} />} title="2. How We Use Your Information" index={1}>
            <p>We use your information to:</p>
            <ul>
              <li>Send marketing emails on your behalf via your connected email account</li>
              <li>Track email delivery, opens, and replies</li>
              <li>Generate AI-powered email content and market research</li>
              <li>Provide analytics and insights about your campaigns</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </Section>

          <Section icon={<Mail className="w-5 h-5" style={{ color: '#00c98d' }} />} title="3. Gmail API Usage" index={2}>
            <p>
              MailGen's use of information received from Gmail APIs will adhere to{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p>Specifically, we:</p>
            <ul>
              <li>Only access Gmail to send emails and read email analytics</li>
              <li>Do not share Gmail data with third parties</li>
              <li>Do not use Gmail data for advertising</li>
              <li>Encrypt OAuth tokens and store them securely</li>
              <li>Allow you to revoke access at any time</li>
            </ul>
          </Section>

          <Section icon={<Lock className="w-5 h-5" style={{ color: '#00c98d' }} />} title="4. Data Security" index={3}>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul>
              <li>OAuth tokens are encrypted at rest</li>
              <li>All connections use HTTPS/TLS encryption</li>
              <li>Access controls and authentication on all APIs</li>
              <li>Regular security audits and updates</li>
            </ul>
          </Section>

          <Section icon={<Database className="w-5 h-5" style={{ color: '#00c98d' }} />} title="5. Data Retention" index={4}>
            <p>
              We retain your data as long as your account is active. You can request deletion at any time by contacting us.
            </p>
          </Section>

          <Section icon={<Server className="w-5 h-5" style={{ color: '#00c98d' }} />} title="6. Third-Party Services" index={5}>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Google Gmail API:</strong> For email sending and analytics</li>
              <li><strong>Ollama:</strong> For local AI processing (your data stays on our servers)</li>
              <li><strong>Railway:</strong> For hosting and infrastructure</li>
            </ul>
          </Section>

          <Section icon={<UserCheck className="w-5 h-5" style={{ color: '#00c98d' }} />} title="7. Your Rights" index={6}>
            <p>You have the right to:</p>
            <ul>
              <li>Access your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Revoke OAuth access at any time</li>
            </ul>
          </Section>

          <Section icon={<Mail className="w-5 h-5" style={{ color: '#00c98d' }} />} title="8. Contact Us" index={7}>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@mailgen.com">privacy@mailgen.com</a>
            </p>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl text-center"
             style={{ backgroundColor: '#fafafa', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Have Questions?
          </h3>
          <p className="mb-6" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Our team is here to help with any privacy concerns
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105 group"
            style={{ backgroundColor: '#00f0a0', color: '#001529' }}
          >
            Contact Us
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
