import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Bot, Clock, Scale, Globe, Shield, UserX, RefreshCw, Mail, ChevronRight } from 'lucide-react';

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

export default function Terms() {
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
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>Terms of Service</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Please read these terms carefully before using MailGen. By using our service, you agree to these terms.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose max-w-none">
          <Section icon={<CheckCircle className="w-5 h-5" style={{ color: '#00c98d' }} />} title="1. Acceptance of Terms" index={0}>
            <p>
              By accessing and using MailGen ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </Section>

          <Section icon={<FileText className="w-5 h-5" style={{ color: '#00c98d' }} />} title="2. Service Description" index={1}>
            <p>MailGen is an AI-powered email marketing automation platform that helps you:</p>
            <ul>
              <li>Discover and research prospects</li>
              <li>Generate personalized email content using AI</li>
              <li>Send automated email campaigns</li>
              <li>Track email performance and analytics</li>
              <li>Conduct market research and competitive analysis</li>
            </ul>
          </Section>

          <Section icon={<CheckCircle className="w-5 h-5" style={{ color: '#00c98d' }} />} title="3. User Responsibilities" index={2}>
            <p>You agree to:</p>
            <ul>
              <li><strong>Comply with Laws:</strong> Use the Service in compliance with all applicable laws and regulations</li>
              <li><strong>Respect Recipients:</strong> Only send emails to people who have consented to receive them</li>
              <li><strong>No Spam:</strong> Not use the Service for spam, unsolicited bulk emails, or illegal activities</li>
              <li><strong>CAN-SPAM Compliance:</strong> Include accurate sender information and honor opt-out requests</li>
              <li><strong>Secure Credentials:</strong> Keep your account credentials secure and confidential</li>
            </ul>
          </Section>

          <Section icon={<Mail className="w-5 h-5" style={{ color: '#00c98d' }} />} title="4. OAuth and Email Access" index={3}>
            <p>When you connect your email account (Gmail, Outlook, etc.):</p>
            <ul>
              <li>You grant MailGen permission to send emails on your behalf</li>
              <li>You authorize us to read email analytics (opens, replies)</li>
              <li>You can revoke access at any time through your email provider's settings</li>
              <li>We will only use your email account for the purposes you authorize</li>
            </ul>
          </Section>

          <Section icon={<AlertTriangle className="w-5 h-5" style={{ color: '#00c98d' }} />} title="5. Acceptable Use Policy" index={4}>
            <p>You may NOT use MailGen to:</p>
            <ul>
              <li>Send spam or unsolicited commercial emails</li>
              <li>Phish, scam, or deceive recipients</li>
              <li>Violate any person's privacy or data protection rights</li>
              <li>Distribute malware, viruses, or harmful content</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Harass, threaten, or abuse others</li>
            </ul>
            <p>Violation of this policy may result in immediate account termination.</p>
          </Section>

          <Section icon={<Bot className="w-5 h-5" style={{ color: '#00c98d' }} />} title="6. AI-Generated Content" index={5}>
            <p>Our Service uses AI to generate email content. You acknowledge that:</p>
            <ul>
              <li>AI-generated content should be reviewed before sending</li>
              <li>You are responsible for all content sent through your account</li>
              <li>We do not guarantee accuracy or appropriateness of AI-generated content</li>
              <li>Final approval and responsibility for emails rests with you</li>
            </ul>
          </Section>

          <Section icon={<Clock className="w-5 h-5" style={{ color: '#00c98d' }} />} title="7. Service Availability" index={6}>
            <p>
              We strive to provide reliable service, but we do not guarantee uninterrupted access.
              We may suspend or terminate the Service for maintenance, updates, or other reasons with or without notice.
            </p>
          </Section>

          <Section icon={<Shield className="w-5 h-5" style={{ color: '#00c98d' }} />} title="8. Intellectual Property" index={7}>
            <p>The Service and its content are protected by copyright and other intellectual property laws.</p>
            <ul>
              <li>MailGen retains all rights to the Service and its technology</li>
              <li>You retain ownership of your data and email content</li>
              <li>You grant us a license to process your data to provide the Service</li>
            </ul>
          </Section>

          <Section icon={<Scale className="w-5 h-5" style={{ color: '#00c98d' }} />} title="9. Limitation of Liability" index={8}>
            <p>
              To the maximum extent permitted by law, MailGen shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </Section>

          <Section icon={<UserX className="w-5 h-5" style={{ color: '#00c98d' }} />} title="10. Account Termination" index={9}>
            <p>We reserve the right to suspend or terminate accounts that:</p>
            <ul>
              <li>Violate these Terms of Service</li>
              <li>Engage in abusive or illegal behavior</li>
              <li>Are inactive for extended periods</li>
              <li>Pose security risks to our Service or users</li>
            </ul>
          </Section>

          <Section icon={<RefreshCw className="w-5 h-5" style={{ color: '#00c98d' }} />} title="11. Changes to Terms" index={10}>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the new Terms.
            </p>
          </Section>

          <Section icon={<Mail className="w-5 h-5" style={{ color: '#00c98d' }} />} title="12. Contact Us" index={11}>
            <p>
              If you have questions about these Terms, please contact us at:{' '}
              <a href="mailto:support@mailgen.com">support@mailgen.com</a>
            </p>
          </Section>

          <Section icon={<Globe className="w-5 h-5" style={{ color: '#00c98d' }} />} title="13. Governing Law" index={12}>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
              in which MailGen operates, without regard to its conflict of law provisions.
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
            Our team is here to help with any questions about our terms
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
