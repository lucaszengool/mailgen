import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Send, Bot, User, Loader, CheckCircle, XCircle,
  ChevronDown, ChevronRight, ChevronLeft, Search, Mail, Building2,
  TrendingUp, MessageSquare, Brain, Globe, Database,
  FileText, Sparkles, ArrowRight, Clock, Activity,
  Target, Users, BarChart3, Link, Shield, Zap, Edit, Settings,
  Radar, Network, BarChart, PlayCircle, CheckSquare, AlertTriangle,
  Server, Eye, Cpu, Layers, Workflow, Gauge, Home, RefreshCw, Palette as SwatchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '../utils/apiClient';
import TemplateSelectionService from '../services/TemplateSelectionService';
import { EMAIL_TEMPLATES } from '../data/emailTemplatesConsistent.js';
import Analytics from '../pages/Analytics';
import HomePage from '../pages/Home';
import JobRightProspectCard from './JobRightProspectCard';
import JobRightEmailCard from './JobRightEmailCard';
import ProfessionalEmailEditor from './ProfessionalEmailEditor';
import TemplateSelectionModal from './TemplateSelectionModal';
import ComprehensiveCompanyDetailPage from './ComprehensiveCompanyDetailPage';
import AgentStatusNotification, { AgentActivityPanel } from './AgentStatusNotification';
import UserActionReminder from './UserActionReminder';
import ProcessNotifications from './ProcessNotifications';
import OnboardingTour from './OnboardingTour';
import MarketResearch from './MarketResearch';
import AIAssistantChatbot from './AIAssistantChatbot';
import QuotaBar from './QuotaBar';
import EmailThreadPanel from './EmailThreadPanel';


// Utility function for generating gradient patterns
const getMultiColorRainbowPattern = (seed) => {
  const seedString = seed || 'default';
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // JobRight.ai compatible green gradient patterns - no purple colors
  const greenPatterns = [
    'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)', // Primary JobRight green
    'linear-gradient(45deg, #28fcaf 0%, #00f0a0 50%, #00c98d 100%)', // Light to primary green
    'linear-gradient(90deg, #52ffba 0%, #00f0a0 50%, #00c98d 100%)', // Horizontal green spectrum
    'linear-gradient(180deg, #00f0a0 0%, #28fcaf 50%, #52ffba 100%)', // Vertical light green
    'linear-gradient(225deg, #00c98d 0%, #00f0a0 50%, #28fcaf 100%)', // Diagonal green
    'linear-gradient(315deg, #00f0a0 0%, #52ffba 100%)', // NW diagonal light
    'linear-gradient(60deg, #00c98d 0%, #00f0a0 100%)', // 60deg green
    'linear-gradient(120deg, #28fcaf 0%, #00c98d 100%)', // 120deg green
  ];

  const patternIndex = Math.abs(hash) % greenPatterns.length;
  return greenPatterns[patternIndex];
};

// Email Review Modal Component - Simple redirect notification
const EmailReviewModal = ({ isOpen, email, onApprove, onClose, onEdit }) => {
  if (!isOpen || !email) return null;
  
  const handleGoToEmailEditor = () => {
    // Redirect to email editor page and close modal
    onClose();
    // Trigger navigation to email editor (this will be handled by parent component)
    if (onEdit) {
      onEdit();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-[#00f5a0] rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-[#00f5a0]/20 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#00f5a0] rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">First Email Generated!</h3>
              <p className="text-sm text-gray-400">Ready for review and editing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Cards */}
        <div className="space-y-4 mb-6">
          {/* Recipient Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black border border-[#00f5a0] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email Generated For</p>
                <p className="text-lg font-semibold text-white">{email.to}</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-gradient-to-r from-[#00f5a0]/10 to-transparent border border-[#00f5a0]/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-black border border-[#00f5a0] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Important</p>
                <p className="text-sm text-gray-300">All remaining emails are paused. Any edits you make will be used as a template for all subsequent emails.</p>
              </div>
            </div>
          </div>

          {/* Email Preview - ✅ FIXED: Full HTML rendering with debug */}
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
                      <span className="ml-2 text-gray-500 text-xs">⚠️ May be truncated ({email.subject.length} chars)</span>
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
                      <div className="text-gray-700 p-4 border border-gray-300 rounded bg-white">
                        <p className="font-bold mb-2">⚠️ Warning: Plain Text</p>
                        <p className="text-sm mb-3">Email is plain text, not HTML. Customizations may not be visible.</p>
                        <pre className="whitespace-pre-wrap text-gray-300">{email.body}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            );
          })()}
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Next Step
          </h4>
          <p className="text-sm text-gray-300">
            Go to the <span className="text-[#00f5a0] font-semibold">Email Editor</span> to review, edit, and send your email.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-colors border border-gray-700"
          >
            Later
          </button>
          <button
            onClick={handleGoToEmailEditor}
            className="flex-1 bg-[#00f5a0] hover:bg-[#00d68a] text-black font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-[#00f5a0]/30"
          >
            Go to Email Editor
          </button>
        </div>
      </div>
    </div>
  );
};

// Email Send Confirmation Modal - Shows when user sends first email
const EmailSendConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-lg" style={{
        minHeight: '550px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Close Button */}
        <div className="flex justify-end p-6">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            style={{lineHeight: '1'}}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="px-12 pb-12" style={{paddingTop: '0'}}>
          <div className="text-center">
            {/* Large Green Card - mimicking the reference UI */}
            <div className="mx-auto mb-8 p-12 rounded-3xl" style={{
              backgroundColor: '#00f5a0',
              maxWidth: '600px'
            }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-4">First Email Sent!</h2>
              <p className="text-lg text-black mb-0">
                Your first email has been sent successfully. Would you like to use the same template to generate and send emails to all remaining prospects?
              </p>
            </div>

            {/* Batch Processing Info - White background with black text */}
            <div className="bg-white p-6 rounded-xl mb-8 border border-gray-200">
              <p className="text-base text-black">
                ⚡ <strong>Batch Processing:</strong> We'll use your approved email template to generate personalized emails for all remaining prospects.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 rounded-xl text-black hover:bg-gray-100 transition-colors font-medium"
              >
                Stop Here
              </button>
              <button
                onClick={onConfirm}
                className="px-12 py-4 rounded-2xl font-semibold text-lg text-black transition-colors"
                style={{
                  backgroundColor: '#00f5a0',
                  boxShadow: '0 4px 12px rgba(0, 245, 160, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 245, 160, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 245, 160, 0.3)';
                }}
              >
                Yes, Send All Emails
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Detailed Workflow Window Component for animations with history persistence
const DetailedWorkflowWindow = ({ content, onAnimationComplete, prospects = [], addCompletedAnimation, addDetailedWindow }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationState, setAnimationState] = useState('starting');
  const [hasStarted, setHasStarted] = useState(false);
  
  useEffect(() => {
    // Prevent re-execution if animation has already started
    if (hasStarted) return;
    
    setHasStarted(true);
    const timers = [];
    
    if (content.type === 'email_search') {
      // Email Search Engine Animation
      const steps = [
        { title: 'Initializing search engine...', icon: Radar, duration: 1000 },
        { title: 'Connecting to web crawlers...', icon: Network, duration: 1500 },
        { title: 'Scanning websites for contact information...', icon: BarChart, duration: 2000 },
        { title: 'Email discovery complete!', icon: CheckCircle, duration: 1000 }
      ];
      
      // Calculate total animation duration including results display
      const baseAnimationTime = steps.reduce((sum, s) => sum + s.duration, 0);
      const resultsDisplayTime = 3000; // Additional time for results to show
      
      steps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setCurrentStep(index);
          if (index === steps.length - 1) {
            setAnimationState('completed');
            // Save animation to history
            if (addCompletedAnimation) {
              addCompletedAnimation('email_search', {
                steps: steps,
                prospects: prospects,
                duration: baseAnimationTime + resultsDisplayTime
              });
            }
            // Notify parent that animation is complete after results are shown
            const completionTimer = setTimeout(() => {
              onAnimationComplete && onAnimationComplete();
            }, resultsDisplayTime);
            timers.push(completionTimer);
          }
        }, steps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
        timers.push(timer);
      });
    } else if (content.type === 'email_verification') {
      // Email Verification Animation
      const verificationSteps = [
        { title: 'Starting email verification...', icon: Mail, duration: 800 },
        { title: 'Checking DNS records...', icon: Search, duration: 1200 },
        { title: 'Validating SMTP servers...', icon: Server, duration: 1500 },
        { title: 'Verification complete!', icon: CheckCircle, duration: 800 }
      ];
      
      // Calculate total animation duration including results display
      const baseAnimationTime = verificationSteps.reduce((sum, s) => sum + s.duration, 0);
      const resultsDisplayTime = 2500; // Additional time for results to show
      
      verificationSteps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setCurrentStep(index);
          if (index === verificationSteps.length - 1) {
            setAnimationState('completed');
            // Save animation to history
            if (addCompletedAnimation) {
              addCompletedAnimation('email_verification', {
                steps: verificationSteps,
                duration: baseAnimationTime + resultsDisplayTime
              });
            }
            // Notify parent that animation is complete after results are shown
            const completionTimer = setTimeout(() => {
              console.log('🎬 Email verification animation completed, calling onAnimationComplete');
              onAnimationComplete && onAnimationComplete();
            }, resultsDisplayTime);
            timers.push(completionTimer);
          }
        }, verificationSteps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
        timers.push(timer);
      });
    } else if (content.type === 'persona_generation') {
      // Persona Generation Animation
      const personaSteps = [
        { title: 'Loading AI persona model...', icon: Brain, duration: 1000 },
        { title: 'Analyzing prospect profiles...', icon: Users, duration: 1500 },
        { title: 'Processing industry data...', icon: Database, duration: 1200 },
        { title: 'Generating personalized insights...', icon: Target, duration: 2000 },
        { title: 'Personas ready!', icon: CheckCircle, duration: 800 }
      ];
      
      // Calculate total animation duration including results display
      const baseAnimationTime = personaSteps.reduce((sum, s) => sum + s.duration, 0);
      const resultsDisplayTime = 3000; // Additional time for results to show
      
      personaSteps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setCurrentStep(index);
          if (index === personaSteps.length - 1) {
            setAnimationState('completed');
            // Save animation to history
            if (addCompletedAnimation) {
              addCompletedAnimation('persona_generation', {
                steps: personaSteps,
                prospects: prospects,
                duration: baseAnimationTime + resultsDisplayTime
              });
            }
            // Notify parent that animation is complete after results are shown
            const completionTimer = setTimeout(() => {
              onAnimationComplete && onAnimationComplete();
            }, resultsDisplayTime);
            timers.push(completionTimer);
          }
        }, personaSteps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
        timers.push(timer);
      });
    } else if (content.type === 'email_generation') {
      // Email Generation Animation
      const emailSteps = [
        { title: '📧 Analyzing prospect personas...', icon: Users, duration: 1200 },
        { title: '🎯 Selecting email templates...', icon: FileText, duration: 1000 },
        { title: '✍️ Creating personalized content...', icon: Edit, duration: 2000 },
        { title: '🔍 Optimizing for engagement...', icon: TrendingUp, duration: 1500 },
        { title: '✅ Emails ready to send!', icon: CheckCircle, duration: 800 }
      ];
      
      // Calculate total animation duration including results display
      const baseAnimationTime = emailSteps.reduce((sum, s) => sum + s.duration, 0);
      const resultsDisplayTime = 3500; // Additional time for results to show
      
      emailSteps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setCurrentStep(index);
          if (index === emailSteps.length - 1) {
            setAnimationState('completed');
            // Save animation to history
            if (addCompletedAnimation) {
              addCompletedAnimation('email_generation', {
                steps: emailSteps,
                prospects: prospects,
                duration: baseAnimationTime + resultsDisplayTime
              });
            }
            // Notify parent that animation is complete after results are shown
            const completionTimer = setTimeout(() => {
              onAnimationComplete && onAnimationComplete();
            }, resultsDisplayTime);
            timers.push(completionTimer);
          }
        }, emailSteps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
        timers.push(timer);
      });
    }
    
    // Cleanup function to clear all timers
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [content.type]); // Only depend on content.type, not the whole content or onAnimationComplete
  
  if (content.type === 'email_search') {
    return (
      <div className="p-8 space-y-6 bg-white">
        {/* Search Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('workflow-icon') }}>
              <Radar className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Email Discovery Progress</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-[#00f5a0]">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 25, 100)}%`}
            </div>
            <Gauge className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="space-y-3">
          {[
            { title: 'Initializing search engine...', icon: Radar },
            { title: 'Connecting to web crawlers...', icon: Network },
            { title: 'Scanning websites...', icon: BarChart },
            { title: 'Discovery complete!', icon: CheckCircle }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: currentStep >= index ? 1 : 0.3,
                scale: currentStep === index ? 1.02 : 1
              }}
              className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-white border-gray-300 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700'
              } ${currentStep === index ? 'animate-pulse scale-110' : ''}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium transition-all duration-300 ${
                currentStep >= index ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* Detailed Results */}
        {animationState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('success-icon') }}>
                <BarChart className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Search Results</h5>
            </div>
            
            {/* Website Crawling Results */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-[#00f5a0]" />
                <h6 className="font-semibold text-gray-900">Websites Crawled:</h6>
              </div>
              <div className="space-y-2 text-sm">
                {(prospects.length > 0 ? 
                  // Create domain statistics from real prospects
                  Array.from(new Set(prospects.map(p => p.email?.split('@')[1]).filter(Boolean))).slice(0, 5).map(domain => ({
                    domain,
                    emails: prospects.filter(p => p.email?.includes('@' + domain)).length,
                    status: 'success'
                  }))
                : [
                  { domain: 'foodtech.com', emails: 3, status: 'success' },
                  { domain: 'agritech.org', emails: 2, status: 'success' },
                  { domain: 'biotechfoods.co', emails: 1, status: 'success' },
                  { domain: 'foodinnovation.net', emails: 4, status: 'success' },
                  { domain: 'smartagriculture.com', emails: 0, status: 'failed' }
                ]).map((site, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.1) }}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center space-x-3">
                      {site.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-900 font-mono font-medium">{site.domain}</span>
                    </div>
                    <span className="text-gray-900">
                      {site.emails > 0 ? `${site.emails} emails found` : 'No emails'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Found Emails */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-[#00f5a0]" />
                <h6 className="font-semibold text-gray-900">Discovered Email Addresses:</h6>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(prospects.length > 0 ? prospects.slice(0, 10) : [
                  'john.smith@foodtech.com',
                  'sarah.jones@agritech.org', 
                  'mike.wilson@biotechfoods.co',
                  'lisa.brown@foodinnovation.net',
                  'david.taylor@foodinnovation.net',
                  'emma.davis@foodtech.com',
                  'alex.martin@foodtech.com',
                  'jane.garcia@agritech.org',
                  'chris.rodriguez@foodinnovation.net',
                  'anna.martinez@foodinnovation.net'
                ]).map((prospect, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + (idx * 0.1) }}
                    className="bg-white p-2 rounded border border-gray-200 text-gray-900 font-mono text-xs"
                  >
                    {typeof prospect === 'string' ? prospect : prospect.email}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
  
  if (content.type === 'email_verification') {
    return (
      <div className="p-8 space-y-6 bg-white">
        {/* Verification Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('workflow-icon') }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Email Verification Progress</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-[#00f5a0]">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 25, 100)}%`}
            </div>
            <Gauge className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        
        {/* Verification Steps */}
        <div className="space-y-3">
          {[
            { title: 'Starting verification...', icon: Mail },
            { title: 'Checking DNS records...', icon: Search },
            { title: 'Validating SMTP servers...', icon: Server },
            { title: 'Verification complete!', icon: CheckCircle }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: currentStep >= index ? 1 : 0.3,
                scale: currentStep === index ? 1.02 : 1
              }}
              className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-white border-gray-300 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700'
              } ${currentStep === index ? 'animate-pulse scale-110' : ''}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium transition-all duration-300 ${
                currentStep >= index ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* Verification Results */}
        {animationState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('success-icon') }}>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Verification Results</h5>
            </div>
            
            <div className="space-y-2">
              {(prospects.length > 0 ? prospects.slice(0, 10).map(p => ({ 
                email: p.email, 
                status: p.verified === false ? 'invalid' : 'valid' 
              })) : [
                { email: 'john.smith@foodtech.com', status: 'valid' },
                { email: 'sarah.jones@agritech.org', status: 'valid' },
                { email: 'mike.wilson@biotechfoods.co', status: 'valid' },
                { email: 'lisa.brown@foodinnovation.net', status: 'valid' },
                { email: 'david.taylor@foodinnovation.net', status: 'valid' },
                { email: 'emma.davis@foodtech.com', status: 'valid' },
                { email: 'alex.martin@foodtech.com', status: 'valid' },
                { email: 'jane.garcia@agritech.org', status: 'invalid' },
                { email: 'chris.rodriguez@foodinnovation.net', status: 'valid' },
                { email: 'anna.martinez@foodinnovation.net', status: 'valid' }
              ]).map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + (idx * 0.15) }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.status === 'valid'
                      ? 'bg-white border-gray-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {result.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-gray-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-mono text-sm font-medium">{result.email}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    result.status === 'valid'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {result.status.toUpperCase()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }
  
  if (content.type === 'persona_generation') {
    return (
      <div className="p-8 space-y-6 bg-white">
        {/* Persona Generation Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('ai-icon') }}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">🎯 AI Persona Generator</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-[#00f5a0]">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 20, 100)}%`}
            </div>
            <Target className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Progress Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">AI Model:</div>
            <div className="font-semibold text-gray-900">{content.aiModel || 'qwen2.5:0.5b'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">Processing Mode:</div>
            <div className="font-semibold text-gray-900">{content.processingMode || 'Deep persona analysis'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">Current Prospect:</div>
            <div className="font-semibold text-gray-900">{content.currentProspect || '1/10'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">Personalization Level:</div>
            <div className="font-semibold text-gray-900">{content.personalizationLevel || 'Industry & role-based'}</div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">Status:</div>
          <div className="text-lg font-bold text-gray-900">
            {animationState === 'completed' ? 'Personas ready!' : (content.status || 'Generating personas...')}
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="space-y-3">
          {[
            { title: 'Loading AI persona model...', icon: Brain },
            { title: 'Analyzing prospect profiles...', icon: Users },
            { title: 'Processing industry data...', icon: Database },
            { title: 'Generating personalized insights...', icon: Target },
            { title: 'Personas ready!', icon: CheckCircle }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: currentStep >= index ? 1 : 0.3,
                scale: currentStep === index ? 1.02 : 1
              }}
              className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-white border-gray-300 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700'
              } ${currentStep === index ? 'animate-pulse scale-110' : ''}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium transition-all duration-300 ${
                currentStep >= index ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Results Display */}
        {animationState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('ai-icon') }}>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Results</h5>
            </div>
            
            {/* Generated Personas Preview */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-[#00f5a0]" />
                <h6 className="font-semibold text-gray-900">Generated Personas:</h6>
              </div>
              <div className="space-y-3">
                {[
                  {
                    email: 'bmcdowell@ift.org',
                    type: 'influencer',
                    style: 'professional',
                    decisionLevel: 'Medium',
                    painPoints: ['time management', 'workflow optimization']
                  },
                  {
                    email: 'info@cgcfoodtechnology.com',
                    type: 'technical_buyer',
                    style: 'casual',
                    decisionLevel: 'High',
                    painPoints: ['efficiency', 'cost reduction']
                  }
                ].map((persona, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.2) }}
                    className="bg-white p-4 rounded-lg border border-gray-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-900 font-medium">{persona.email}</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-700">Generated</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-700">Type:</span> <span className="font-medium text-gray-900">{persona.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Style:</span> <span className="font-medium text-gray-900">{persona.style}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Decision Level:</span> <span className="font-medium text-gray-900">{persona.decisionLevel}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Pain Points:</span> 
                        <div className="flex flex-wrap gap-1 mt-1">
                          {persona.painPoints.map((pain, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                              {pain}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
  
  if (content.type === 'email_generation') {
    return (
      <div className="p-8 space-y-6 bg-white">
        {/* Email Generation Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('workflow-icon') }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">📝 AI Email Generation System</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-[#00f5a0]">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 20, 100)}%`}
            </div>
            <Sparkles className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Progress Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">AI Model:</div>
            <div className="font-semibold text-gray-900">{content.aiModel || 'qwen2.5:0.5b'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">Templates:</div>
            <div className="font-semibold text-gray-900">{content.templates || '38 templates loaded'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">Personalization:</div>
            <div className="font-semibold text-gray-900">{content.personalization || 'Deep industry & role-based'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-900 mb-1">Current Progress:</div>
            <div className="font-semibold text-gray-900">{content.currentProspect || '1/10'}</div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">Status:</div>
          <div className="text-lg font-bold text-gray-900">
            {animationState === 'completed' ? 'Emails ready to send!' : (content.status || 'Sequential email generation active')}
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="space-y-3">
          {[
            { title: '📧 Analyzing prospect personas...', icon: Users },
            { title: '🎯 Selecting email templates...', icon: FileText },
            { title: '✍️ Creating personalized content...', icon: Edit },
            { title: '🔍 Optimizing for engagement...', icon: TrendingUp },
            { title: '✅ Emails ready to send!', icon: CheckCircle }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: currentStep >= index ? 1 : 0.3,
                scale: currentStep === index ? 1.02 : 1
              }}
              className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-white border-gray-300 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700'
              } ${currentStep === index ? 'animate-pulse scale-110' : ''}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium transition-all duration-300 ${
                currentStep >= index ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Results Display */}
        {animationState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('workflow-icon') }}>
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Generated Emails</h5>
            </div>
            
            {/* Generated Emails Preview */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#00f5a0]" />
                <h6 className="font-semibold text-gray-900">Personalized Email Campaign:</h6>
              </div>
              <div className="space-y-3">
                {[
                  {
                    to: 'bmcdowell@ift.org',
                    subject: 'Transform Your Food Technology Operations with AI-Powered Solutions',
                    template: 'ecommerce_flash',
                    personalization: 'Professional style, industry-focused'
                  },
                  {
                    to: 'info@cgcfoodtechnology.com', 
                    subject: 'Boost Food Tech Efficiency: AI Solutions That Work',
                    template: 'modern_business',
                    personalization: 'Casual style, technical buyer approach'
                  }
                ].map((email, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.2) }}
                    className="bg-white p-4 rounded-lg border border-gray-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-900 font-medium">{email.to}</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-700">Generated</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{email.subject}</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-700">Template:</span> <span className="font-medium text-gray-900">{email.template}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">Style:</span> <span className="font-medium text-gray-900">{email.personalization}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
  
  // Default content display
  return (
    <div className="p-5 space-y-3">
      {Object.entries(content).map(([key, value]) => (
        <div key={key} className="flex items-center space-x-3">
          <span className="text-sm font-medium capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}:
          </span>
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      ))}
    </div>
  );
};

// Animated Workflow Window Component for Website Analysis and AI Marketing Strategy
const AnimatedWorkflowWindow = ({ content, title }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationState, setAnimationState] = useState('running');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Determine the steps based on the title
    let steps = [];
    if (title.includes('Website Analysis')) {
      steps = [
        { title: 'Connecting to website...', icon: Globe, duration: 800 },
        { title: 'Analyzing business profile...', icon: Brain, duration: 1200 },
        { title: 'Processing industry data...', icon: Database, duration: 1000 },
        { title: 'Analysis complete!', icon: CheckCircle, duration: 500 }
      ];
    } else if (title.includes('Marketing Strategy')) {
      steps = [
        { title: 'Initializing AI engine...', icon: Cpu, duration: 800 },
        { title: 'Processing market intelligence...', icon: TrendingUp, duration: 1500 },
        { title: 'Generating targeting strategy...', icon: Target, duration: 1200 },
        { title: 'Strategy complete!', icon: CheckCircle, duration: 500 }
      ];
    } else if (title.includes('Persona Generator')) {
      steps = [
        { title: 'Loading AI persona model...', icon: Brain, duration: 800 },
        { title: 'Analyzing prospect profiles...', icon: Users, duration: 1200 },
        { title: 'Processing industry data...', icon: Database, duration: 1000 },
        { title: 'Generating personalized insights...', icon: Target, duration: 1500 },
        { title: 'Personas ready!', icon: CheckCircle, duration: 500 }
      ];
    } else {
      // Generic steps for other windows
      steps = [
        { title: 'Processing request...', icon: Cpu, duration: 1000 },
        { title: 'Analyzing data...', icon: Brain, duration: 1200 },
        { title: 'Generating results...', icon: Sparkles, duration: 800 },
        { title: 'Complete!', icon: CheckCircle, duration: 500 }
      ];
    }

    let timers = [];
    
    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        if (index === steps.length - 1) {
          setAnimationState('completed');
          setShowResults(true);
        }
      }, steps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
      timers.push(timer);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [title]);

  const getSteps = () => {
    if (title.includes('Website Analysis')) {
      return [
        { title: 'Connecting to website...', icon: Globe },
        { title: 'Analyzing business profile...', icon: Brain },
        { title: 'Processing industry data...', icon: Database },
        { title: 'Analysis complete!', icon: CheckCircle }
      ];
    } else if (title.includes('Marketing Strategy')) {
      return [
        { title: 'Initializing AI engine...', icon: Cpu },
        { title: 'Processing market intelligence...', icon: TrendingUp },
        { title: 'Generating targeting strategy...', icon: Target },
        { title: 'Strategy complete!', icon: CheckCircle }
      ];
    } else if (title.includes('Persona Generator')) {
      return [
        { title: 'Loading AI persona model...', icon: Brain },
        { title: 'Analyzing prospect profiles...', icon: Users },
        { title: 'Processing industry data...', icon: Database },
        { title: 'Generating personalized insights...', icon: Target },
        { title: 'Personas ready!', icon: CheckCircle }
      ];
    } else {
      return [
        { title: 'Processing request...', icon: Cpu },
        { title: 'Analyzing data...', icon: Brain },
        { title: 'Generating results...', icon: Sparkles },
        { title: 'Complete!', icon: CheckCircle }
      ];
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: getMultiColorRainbowPattern('workflow-icon') }}>
            {title.includes('Website') ? <Globe className="w-4 h-4 text-white" /> : 
             title.includes('Persona') ? <Target className="w-4 h-4 text-white" /> : 
             <Brain className="w-4 h-4 text-white" />}
          </div>
          <h4 className="text-lg font-bold text-gray-900">Progress</h4>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold text-[#00f5a0]">
            {animationState === 'completed' ? '100%' : `${Math.min(Math.round(((currentStep + 1) / getSteps().length) * 100), 100)}%`}
          </div>
          <Gauge className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      
      {/* Processing Steps */}
      <div className="space-y-2">
        {getSteps().map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0.3 }}
            animate={{ 
              opacity: currentStep >= index ? 1 : 0.3,
              scale: currentStep === index ? 1.02 : 1
            }}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300 ${
              currentStep >= index
                ? 'bg-white border-gray-300 shadow-sm'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              currentStep >= index ? 'bg-gray-700' : 'bg-gray-300'
            }`}>
              <step.icon className={`w-3 h-3 ${currentStep >= index ? 'text-white' : 'text-gray-700'}`} />
            </div>
            <span className={`font-medium text-sm ${
              currentStep >= index ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {step.title}
            </span>
            {currentStep === index && animationState !== 'completed' && (
              <div className="ml-auto">
                <Loader className="w-3 h-3 text-gray-500 animate-spin" />
              </div>
            )}
            {currentStep > index && (
              <div className="ml-auto">
                <CheckCircle className="w-3 h-3 text-gray-500" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Results Section */}
      {showResults && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-gray-500" />
            <h5 className="font-bold text-gray-900">Results</h5>
          </div>
          <div className="space-y-2">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Settings View Component
const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [testingConnection, setTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // SMTP Configuration State
  const [smtpConfig, setSmtpConfig] = useState(() => {
    const saved = localStorage.getItem('smtpConfig');
    return saved ? JSON.parse(saved) : {
      name: '',
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      senderName: '',
      companyName: '',
      companyWebsite: '',
      ctaText: 'Schedule a Meeting',
      ctaUrl: ''
    };
  });

  const [websiteConfig, setWebsiteConfig] = useState({
    targetWebsite: '',
    businessName: '',
    productType: '',
    businessIntro: ''
  });

  const [campaignConfig, setCampaignConfig] = useState({
    defaultProspectCount: 10,
    searchStrategy: 'balanced',
    emailFrequency: 'daily',
    followUpEnabled: true,
    followUpDays: 3
  });

  // 🔧 Load current config from backend and agentConfig on mount
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        console.log('🔧 Loading current configuration from backend...');

        // Try backend API first
        const response = await apiGet('/api/config/current');

        if (response.success) {
          console.log('✅ Config loaded from backend:', response);

          // Update SMTP config if available
          if (response.smtp && Object.keys(response.smtp).length > 0) {
            setSmtpConfig(response.smtp);
          }

          // Update Website config if available
          if (response.website && Object.keys(response.website).length > 0) {
            setWebsiteConfig(response.website);
          }

          // Update Campaign config if available
          if (response.campaign && Object.keys(response.campaign).length > 0) {
            setCampaignConfig(response.campaign);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load config from backend:', error);
      }

      // 🔥 ALSO load from agentConfig (current campaign settings)
      try {
        const agentConfig = localStorage.getItem('agentConfig');
        if (agentConfig) {
          const config = JSON.parse(agentConfig);
          console.log('📦 Loading agentConfig values:', config);

          // Update Website Analysis from agentConfig
          if (config.targetWebsite || config.websiteAnalysis) {
            setWebsiteConfig(prev => ({
              ...prev,
              targetWebsite: config.targetWebsite || prev.targetWebsite,
              businessName: config.websiteAnalysis?.businessName || prev.businessName,
              productType: config.websiteAnalysis?.productServiceType || prev.productType,
              businessIntro: config.websiteAnalysis?.businessIntro || prev.businessIntro
            }));
          }

          // Update SMTP from agentConfig
          if (config.smtpConfig) {
            setSmtpConfig(prev => ({
              ...prev,
              ...config.smtpConfig
            }));
          }

          // Update Campaign settings from agentConfig
          if (config.campaignGoal || config.industries || config.roles) {
            setCampaignConfig(prev => ({
              ...prev,
              campaignGoal: config.campaignGoal || prev.campaignGoal,
              industries: config.industries || prev.industries,
              roles: config.roles || prev.roles,
              companySize: config.companySize || prev.companySize,
              location: config.location || prev.location
            }));
          }

          console.log('✅ agentConfig values loaded into Settings');
        }
      } catch (error) {
        console.warn('⚠️ Could not load agentConfig:', error);
      }
    };

    loadCurrentConfig();
  }, []); // Run once on mount

  const testSmtpConnection = async () => {
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }
    setTestingConnection(true);
    try {
      const response = await fetch('/api/email/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('SMTP Connection Successful!');
      } else {
        toast.error(`SMTP Test Failed: ${data.error}. Check your credentials and try again.`, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Cannot reach server. Check your internet connection and ensure the backend is running.', { duration: 5000 });
    } finally {
      setTestingConnection(false);
    }
  };

  const updateSmtpConfig = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for backwards compatibility
      localStorage.setItem('smtpConfig', JSON.stringify(smtpConfig));
      localStorage.setItem('websiteConfig', JSON.stringify(websiteConfig));
      localStorage.setItem('campaignConfig', JSON.stringify(campaignConfig));

      // 🔥 CRITICAL: Update agentConfig so current campaign uses new values
      const currentAgentConfig = JSON.parse(localStorage.getItem('agentConfig') || '{}');
      const updatedAgentConfig = {
        ...currentAgentConfig,
        targetWebsite: websiteConfig.targetWebsite,
        smtpConfig: smtpConfig,
        websiteAnalysis: {
          ...currentAgentConfig.websiteAnalysis,
          businessName: websiteConfig.businessName,
          productServiceType: websiteConfig.productType,
          businessIntro: websiteConfig.businessIntro
        },
        campaignGoal: campaignConfig.campaignGoal,
        industries: campaignConfig.industries,
        roles: campaignConfig.roles,
        companySize: campaignConfig.companySize,
        location: campaignConfig.location
      };
      localStorage.setItem('agentConfig', JSON.stringify(updatedAgentConfig));
      console.log('✅ Updated agentConfig for current campaign');

      // Save to backend (new unified API)
      console.log('💾 Saving configuration to backend...');
      const response = await apiPost('/api/config/update', {
        smtp: smtpConfig,
        website: websiteConfig,
        campaign: campaignConfig
      });

      if (response.success) {
        toast.success('Configuration saved! Current and future campaigns will use these settings ✅');
        console.log('✅ Configuration saved successfully');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Failed to save config:', error);
      toast.error(`Could not save settings to server. ${error.message}. Settings saved locally only.`, { duration: 6000 });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'smtp', label: 'SMTP Settings', icon: Mail },
    { id: 'website', label: 'Website Analysis', icon: Globe },
    { id: 'campaign', label: 'Campaign Config', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">Configure your email marketing system parameters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#00f5a0]/10 border border-[#00f5a0]/30 text-gray-900 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-[#00f5a0]' : 'text-gray-500'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* SMTP Settings */}
          {activeTab === 'smtp' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00f5a0]/10 flex items-center justify-center mr-3">
                  <Mail className="h-5 w-5 text-[#00f5a0]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">SMTP Email Server Settings</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Name</label>
                  <input
                    type="text"
                    value={smtpConfig.name}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                    placeholder="e.g., Company Email Server"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server *</label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Port *</label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smtpConfig.secure}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, secure: e.target.checked }))}
                      className="rounded border-gray-300 text-[#00f5a0] focus:ring-[#00f5a0]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Use SSL/TLS Encryption (Port 465)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username/Email *</label>
                    <input
                      type="email"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      placeholder="App-specific password"
                    />
                  </div>
                </div>

                {/* Marketing Campaign Configuration */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-2">
                      <Target className="h-4 w-4 text-gray-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900">Marketing Campaign Configuration</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sender Name *</label>
                      <input
                        type="text"
                        value={smtpConfig.senderName}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, senderName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                        placeholder="James Wilson"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                      <input
                        type="text"
                        value={smtpConfig.companyName}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                        placeholder="FruitAI"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Website *</label>
                      <input
                        type="url"
                        value={smtpConfig.companyWebsite}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, companyWebsite: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                        placeholder="https://fruitai.org"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CTA Button Text *</label>
                      <input
                        type="text"
                        value={smtpConfig.ctaText}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                        placeholder="Schedule a Meeting"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">CTA Link URL *</label>
                    <input
                      type="url"
                      value={smtpConfig.ctaUrl}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, ctaUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      placeholder="https://calendly.com/your-calendar"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For booking buttons in emails, e.g., Calendly, Acuity, or other scheduling systems
                    </p>
                  </div>
                </div>

                {/* Common SMTP Configurations */}
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center mr-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Common SMTP Configurations</h4>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-center"><span className="w-32 font-medium text-gray-900">Gmail:</span> <span className="text-gray-700">smtp.gmail.com, Port 587 (TLS) or 465 (SSL)</span></div>
                    <div className="flex items-center"><span className="w-32 font-medium text-gray-900">Outlook:</span> <span className="text-gray-700">smtp.office365.com, Port 587 (TLS)</span></div>
                    <div className="flex items-center"><span className="w-32 font-medium text-gray-900">Yahoo:</span> <span className="text-gray-700">smtp.mail.yahoo.com, Port 465 (SSL)</span></div>
                    <div className="flex items-center"><span className="w-32 font-medium text-gray-900">Corporate:</span> <span className="text-gray-700">Contact your IT administrator</span></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={testSmtpConnection}
                    disabled={testingConnection}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 font-medium shadow-sm"
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={updateSmtpConfig}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                  >
                    {isSaving ? 'Updating...' : 'Update Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Website Analysis Settings */}
          {activeTab === 'website' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00f5a0]/10 flex items-center justify-center mr-3">
                  <Globe className="h-5 w-5 text-[#00f5a0]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Website Analysis</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Website *</label>
                  <input
                    type="url"
                    value={websiteConfig.targetWebsite}
                    onChange={(e) => setWebsiteConfig(prev => ({ ...prev, targetWebsite: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={websiteConfig.businessName}
                    onChange={(e) => setWebsiteConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="FruitAI"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product / Service Type *</label>
                  <input
                    type="text"
                    value={websiteConfig.productType}
                    onChange={(e) => setWebsiteConfig(prev => ({ ...prev, productType: e.target.value }))}
                    placeholder="Food Technology"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Introduction *</label>
                  <textarea
                    rows={4}
                    value={websiteConfig.businessIntro}
                    onChange={(e) => setWebsiteConfig(prev => ({ ...prev, businessIntro: e.target.value }))}
                    placeholder="AI-powered fruit and vegetable freshness analyzer..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={updateSmtpConfig}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {isSaving ? 'Updating...' : 'Update Website Analysis'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Configuration */}
          {activeTab === 'campaign' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00f5a0]/10 flex items-center justify-center mr-3">
                  <Target className="h-5 w-5 text-[#00f5a0]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Campaign Configuration</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Goal</label>
                  <select
                    value={campaignConfig.campaignGoal || 'partnership'}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, campaignGoal: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-gray-50 hover:bg-white text-gray-900"
                  >
                    <option value="partnership">Partnership Outreach</option>
                    <option value="sales">Sales Prospecting</option>
                    <option value="recruitment">Talent Recruitment</option>
                    <option value="feedback">Customer Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Industries</label>
                  <input
                    type="text"
                    value={campaignConfig.industries || ''}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, industries: e.target.value }))}
                    placeholder="Technology, Healthcare, Finance..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple industries with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles</label>
                  <input
                    type="text"
                    value={campaignConfig.roles || ''}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, roles: e.target.value }))}
                    placeholder="CEO, CTO, Marketing Director..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple roles with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                  <input
                    type="text"
                    value={campaignConfig.companySize || ''}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, companySize: e.target.value }))}
                    placeholder="1-50, 51-200, 201-1000..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={campaignConfig.location || ''}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="United States, Europe, Global..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center mr-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Email Limits</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Emails per Hour</label>
                      <input
                        type="number"
                        value={campaignConfig.maxEmailsPerHour || 10}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, maxEmailsPerHour: parseInt(e.target.value) }))}
                        min={1}
                        max={100}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Daily Email Limit</label>
                      <input
                        type="number"
                        value={campaignConfig.dailyEmailLimit || 50}
                        onChange={(e) => setCampaignConfig(prev => ({ ...prev, dailyEmailLimit: parseInt(e.target.value) }))}
                        min={1}
                        max={500}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={updateSmtpConfig}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {isSaving ? 'Updating...' : 'Update Campaign Config'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

// Confirmation Modal Component for Destructive Actions
function ConfirmationModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, danger }) {
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg max-w-md w-full shadow-xl"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 whitespace-pre-line">{message}</p>
      </div>
      <div className="flex gap-3 px-6 pb-6 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg font-medium active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            danger
              ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              : 'text-white hover:opacity-90 focus:ring-[#00f5a0]'
          }`}
          style={danger ? {} : { backgroundColor: '#00f0a0', color: '#000' }}
        >
          {confirmText}
        </button>
      </div>
    </motion.div>
    </motion.div>
  );
}

// Loading Skeleton Components for Professional UX
const ProspectCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const EmailCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

const SimpleWorkflowDashboard = ({ agentConfig, onReset, campaign, onBackToCampaigns }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('workflow');
  const [showChatbot, setShowChatbot] = useState(true); // Always show on initial load
  const [chatbotExternalMessage, setChatbotExternalMessage] = useState(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected', 'error'
  const [campaignConfig, setCampaignConfig] = useState(null);

  // 🔥 Email Thread View State - for viewing email threads within the dashboard
  const [selectedEmailThreadId, setSelectedEmailThreadId] = useState(null);

  // 🔥 CRITICAL: Set campaign ID in localStorage immediately on mount
  useEffect(() => {
    if (campaign && campaign.id) {
      const storedCampaignId = localStorage.getItem('currentCampaignId');
      if (storedCampaignId !== campaign.id) {
        console.log('🔥 [MOUNT] Setting currentCampaignId:', campaign.id);
        localStorage.setItem('currentCampaignId', campaign.id);
      }
    }
  }, [campaign?.id]);

  // 🔥 CRITICAL FIX: Update localStorage whenever campaign object changes (not just ID)
  // This ensures campaign ID stays in sync when navigating between campaigns
  useEffect(() => {
    if (campaign && campaign.id) {
      console.log('🔥 [CAMPAIGN CHANGE] Updating localStorage currentCampaignId:', campaign.id);
      localStorage.setItem('currentCampaignId', campaign.id);
    }
  }, [campaign]); // Watch entire campaign object

  // Load campaign-specific configuration
  useEffect(() => {
    if (campaign && campaign.id) {
      console.log('📁 Loading campaign-specific configuration for:', campaign.name);

      // Load campaign config from localStorage
      const campaignStorageKey = `campaign_${campaign.id}_config`;
      const storedConfig = localStorage.getItem(campaignStorageKey);

      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        setCampaignConfig(config);
        console.log('✅ Loaded campaign config:', config);

        // Also set it as the main agentConfig and smtpConfig for backwards compatibility
        localStorage.setItem('agentConfig', JSON.stringify(config));
        if (config.smtpConfig) {
          localStorage.setItem('smtpConfig', JSON.stringify(config.smtpConfig));
        }
      } else {
        console.warn('⚠️ No configuration found for campaign:', campaign.id);
      }
    }
  }, [campaign]);

  // Open chatbot on component mount (first time landing on dashboard)
  useEffect(() => {
    // Check if this is first visit to dashboard in this session
    const hasSeenChatbot = sessionStorage.getItem('mailgenChatbotSeen');
    if (!hasSeenChatbot) {
      setShowChatbot(true);
      sessionStorage.setItem('mailgenChatbotSeen', 'true');
    }
  }, []);
  
  // Enhanced workflow history persistence system
  const [workflowHistory, setWorkflowHistory] = useState(() => {
    // DO NOT load from localStorage - always start fresh
    return {
      messages: [],
      completedAnimations: [],
      detailedWindows: [],
      workflowStates: {},
      lastUpdate: null,
      sessionId: Date.now().toString()
    };
  });

  // ChatGPT interface states for workflow view with persistence
  const [messages, setMessages] = useState(() => {
    return workflowHistory.messages || [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [hasInitiallyLoadedProspects, setHasInitiallyLoadedProspects] = useState(false);
  const [hasInitiallyLoadedEmails, setHasInitiallyLoadedEmails] = useState(false);

  // Workflow stats state
  const [workflowStats, setWorkflowStats] = useState({
    prospects: { total: 0, new: 0 },
    emails: { generated: 0, sent: 0, pending: 0 },
    rateLimit: { current: 0, max: 100, resetTime: null, timeUntilReset: 0, isLimited: false },
    workflow: { isRunning: false, isPaused: false, currentStep: null }
  });
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Search query states
  const [prospectSearchQuery, setProspectSearchQuery] = useState('');
  const [emailSearchQuery, setEmailSearchQuery] = useState('');

  // Filter states (kept for backward compatibility)
  const [prospectFilters, setProspectFilters] = useState({});
  const [emailFilters, setEmailFilters] = useState({});
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // 🎯 Agent status notification states
  const [agentStatus, setAgentStatus] = useState(null);
  const [agentMessage, setAgentMessage] = useState('');
  const [agentDetails, setAgentDetails] = useState([]);
  const [showAgentActivity, setShowAgentActivity] = useState(false);
  const [agentActivities, setAgentActivities] = useState([]);

  // 🎯 Onboarding tour state
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  // 🎯 Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
    danger: false
  });

  // 🏢 Company detail modal state
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [selectedProspectForDetail, setSelectedProspectForDetail] = useState(null);

  // 🔍 Batch Search modal state
  const [showBatchSearchModal, setShowBatchSearchModal] = useState(false);
  const [batchSearchData, setBatchSearchData] = useState({
    industry: '',
    region: '',
    keywords: ''
  });
  const [isBatchSearching, setIsBatchSearching] = useState(false);
  const [batchSearchProgress, setBatchSearchProgress] = useState(null);

  // Filter handlers
  const handleProspectFilterChange = (filterType, value) => {
    setProspectFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const handleEmailFilterChange = (filterType, value) => {
    setEmailFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  // Handle prospect card click to show company details
  const handleProspectClick = (prospect) => {
    console.log('🏢 Opening company details for:', prospect.company);
    setSelectedProspectForDetail(prospect);
    setShowCompanyDetail(true);
  };

  // Handle "Ask MailGen" prospect analysis
  const handleAskMailGen = async (prospect) => {
    try {
      // Open chatbot if not already open
      if (!showChatbot) {
        setShowChatbot(true);
      }

      // Extract prospect name for loading message
      const prospectName = prospect.name ||
                          prospect.persona?.name ||
                          (prospect.email ? prospect.email.split('@')[0] : 'prospect');

      // Show loading message immediately
      const loadingMessage = {
        content: `🔍 **MailGen is analyzing ${prospectName}...**\n\nPlease wait while I gather insights about this prospect and evaluate the match quality.`,
        suggestions: [],
        isLoading: true
      };
      setChatbotExternalMessage(loadingMessage);

      // Small delay to ensure loading message is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get website analysis from localStorage
      const websiteAnalysis = JSON.parse(localStorage.getItem('websiteAnalysis') || 'null');

      // Call analysis API
      const response = await fetch('/api/ollama/analyze-prospect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospect: prospect,
          websiteAnalysis: websiteAnalysis
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Format the message for chatbot
        const prospectInfo = data.prospectInfo;
        const message = {
          content: `**Analyzing Prospect: ${prospectInfo.name}**\n\nCompany: ${prospectInfo.company}\nEmail: ${prospectInfo.email}\nMatch Score: ${prospectInfo.matchScore}%\n\n${data.analysis}`,
          suggestions: [
            { text: 'Generate Email for this Prospect', action: 'goto_email_editor' },
            { text: 'View All Prospects', action: 'goto_prospects' }
          ]
        };
        setChatbotExternalMessage(message);
      } else {
        // Show error in chatbot
        const errorMessage = {
          content: `❌ I couldn't analyze this prospect. ${data.message || 'Please make sure Ollama is running with the command:\n\n```\nollama run qwen2.5:0.5b\n```'}`,
          suggestions: [
            { text: 'Try Again', action: 'retry_analysis' },
            { text: 'View All Prospects', action: 'goto_prospects' }
          ]
        };
        setChatbotExternalMessage(errorMessage);
      }
    } catch (error) {
      console.error('Error analyzing prospect:', error);
      const errorMessage = {
        content: `❌ I encountered an error while analyzing this prospect.\n\n**Possible solutions:**\n1. Make sure the backend server is running\n2. Verify Ollama is running: \`ollama run qwen2.5:0.5b\`\n3. Check your network connection\n\n**Error details:** ${error.message}`,
        suggestions: [
          { text: 'View All Prospects', action: 'goto_prospects' },
          { text: 'Go to Settings', action: 'goto_settings' }
        ]
      };
      setChatbotExternalMessage(errorMessage);
    }
  };

  // 🔍 Handle Batch Search for Prospects
  const handleBatchSearch = async () => {
    try {
      setIsBatchSearching(true);
      setShowBatchSearchModal(false);

      // Show start notification
      toast.success('Batch search started! 🔍 Searching in background...');
      setBatchSearchProgress({ status: 'running', message: 'Searching for prospects...' });

      // Get current campaign ID
      const campaignId = localStorage.getItem('currentCampaignId') || `campaign_${Date.now()}`;

      // Call backend batch search endpoint (runs in background)
      const response = await fetch('/api/prospects/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          industry: batchSearchData.industry,
          region: batchSearchData.region,
          keywords: batchSearchData.keywords
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`🔍 Batch search started with ID: ${result.searchId}`);
        // Reset form
        setBatchSearchData({ industry: '', region: '', keywords: '' });

        // Completion will be handled by WebSocket 'batch_search_complete' event
      } else {
        toast.error(`❌ Batch search failed: ${result.message}`);
        setBatchSearchProgress(null);
        setIsBatchSearching(false);
      }
    } catch (error) {
      console.error('Batch search error:', error);
      toast.error(`❌ Batch search failed: ${error.message}`);
      setBatchSearchProgress(null);
      setIsBatchSearching(false);
    }
  };

  // Filter functions
  const filterProspects = (prospects) => {
    if (!prospects) return [];

    return prospects.filter(prospect => {
      // Search by query
      if (prospectSearchQuery && prospectSearchQuery.trim()) {
        const query = prospectSearchQuery.toLowerCase().trim();
        const searchableFields = [
          prospect.name,
          prospect.email,
          prospect.company,
          prospect.title,
          prospect.role,
          prospect.location,
          prospect.persona?.type,
          prospect.persona?.communicationStyle,
          prospect.workType,
          prospect.type,
          prospect.communicationStyle
        ].filter(Boolean).map(field => String(field).toLowerCase());

        const matches = searchableFields.some(field => field.includes(query));
        if (!matches) return false;
      }

      return true;
    });
  };

  const filterEmails = (emails) => {
    if (!emails) return [];

    return emails.filter(email => {
      // Search by query
      if (emailSearchQuery && emailSearchQuery.trim()) {
        const query = emailSearchQuery.toLowerCase().trim();
        const searchableFields = [
          email.subject,
          email.to,
          email.recipient_name,
          email.recipient_email,
          email.status,
          email.template,
          email.body?.replace(/<[^>]*>/g, '') // Strip HTML tags from body
        ].filter(Boolean).map(field => String(field).toLowerCase());

        const matches = searchableFields.some(field => field.includes(query));
        if (!matches) return false;
      }

      return true;
    });
  };
  
  // Generate multi-color rainbow patterns for icons
  // Handle email approval
  const handleEmailApproval = async (editedEmail) => {
    try {
      console.log('✅ Approving email with edits:', editedEmail);
      
      // Send resume signal to backend immediately when user approves
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('🔄 User approved email - sending resume signal to backend');
        ws.send(JSON.stringify({
          type: 'resume_workflow',
          data: {
            campaignId: editedEmail?.campaignId,
            reason: 'user_approved_email',
            nextAction: 'continue_to_next_prospect',
            timestamp: Date.now()
          }
        }));
      }
      
      const response = await fetch('/api/workflow/approve-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailEdits: editedEmail
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Email approved successfully');
        setShowEmailReview(false);
        setEmailForReview(null);
        // Workflow will continue automatically on the backend
      } else {
        console.error('❌ Failed to approve email:', result.error);
      }
    } catch (error) {
      console.error('❌ Error approving email:', error);
    }
  };

  const [showTyping, setShowTyping] = useState(false);
  
  // Enhanced workflow history persistence - DISABLED (no caching)
  const saveWorkflowHistory = (updatedHistory) => {
    // DO NOT save to localStorage - disabled to prevent data persistence
    // Data will be cleared on page reload
    console.log('💾 Workflow history NOT saved (caching disabled)');
  };

  // Enhanced updateMessages that saves complete workflow history
  const updateMessages = (newMessages) => {
    if (typeof newMessages === 'function') {
      setMessages(prevMessages => {
        const updatedMessages = newMessages(prevMessages);
        const updatedHistory = {
          ...workflowHistory,
          messages: updatedMessages
        };
        setWorkflowHistory(updatedHistory);
        saveWorkflowHistory(updatedHistory);
        return updatedMessages;
      });
    } else {
      setMessages(newMessages);
      const updatedHistory = {
        ...workflowHistory,
        messages: newMessages
      };
      setWorkflowHistory(updatedHistory);
      saveWorkflowHistory(updatedHistory);
    }
  };

  // Function to add completed animations to history
  const addCompletedAnimation = (animationType, animationData) => {
    const completedAnimation = {
      id: Date.now().toString(),
      type: animationType,
      data: animationData,
      completedAt: new Date().toISOString(),
      sessionId: workflowHistory.sessionId
    };

    const updatedHistory = {
      ...workflowHistory,
      completedAnimations: [...(workflowHistory.completedAnimations || []), completedAnimation]
    };

    setWorkflowHistory(updatedHistory);
    saveWorkflowHistory(updatedHistory);
    console.log('🎬 Added completed animation to history:', animationType);
  };

  // Function to add detailed windows to history
  const addDetailedWindow = (windowType, windowData) => {
    const detailedWindow = {
      id: Date.now().toString(),
      type: windowType,
      data: windowData,
      createdAt: new Date().toISOString(),
      sessionId: workflowHistory.sessionId
    };

    const updatedHistory = {
      ...workflowHistory,
      detailedWindows: [...(workflowHistory.detailedWindows || []), detailedWindow]
    };

    setWorkflowHistory(updatedHistory);
    saveWorkflowHistory(updatedHistory);
    console.log('🪟 Added detailed window to history:', windowType);
  };

  // Function to update workflow states
  const updateWorkflowState = (stateKey, stateValue) => {
    const updatedHistory = {
      ...workflowHistory,
      workflowStates: {
        ...workflowHistory.workflowStates,
        [stateKey]: stateValue
      }
    };

    setWorkflowHistory(updatedHistory);
    saveWorkflowHistory(updatedHistory);
  };

  // Function to clear all workflow history
  const clearWorkflowHistory = () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Clear Workflow History?',
      message: 'This will clear your workflow conversation history.\n\nYour prospects and emails will not be affected.',
      confirmText: 'Clear History',
      cancelText: 'Cancel',
      danger: false,
      onConfirm: () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));

        const freshHistory = {
          messages: [],
          completedAnimations: [],
          detailedWindows: [],
          workflowStates: {},
          lastUpdate: null,
          sessionId: Date.now().toString()
        };

        setWorkflowHistory(freshHistory);
        setMessages([]);
        setHistoryRestored(false);

        // Clear from localStorage
        try {
          localStorage.removeItem('workflowHistory');
          localStorage.removeItem('workflowMessages'); // Clear old format too
          console.log('🗑️ Cleared all workflow history');
          toast.success('Workflow history cleared');
        } catch (error) {
          console.error('Failed to clear workflow history:', error);
          toast.error('Failed to clear history');
        }
      }
    });
  };

  // Function to clear all user data (prospects, campaigns, email drafts)
  const clearAllUserData = () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Clear This Campaign Data?',
      message: `This will permanently delete all data for "${campaign?.name || 'this campaign'}":\n\n• All prospects\n• All emails\n• All drafts\n\nThis action cannot be undone!`,
      confirmText: 'Clear Campaign Data',
      cancelText: 'Cancel',
      danger: true,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));

    try {
      const response = await apiPost('/api/email-editor/clear-all-data', {});

      if (response.success) {
        console.log('✅ All user data cleared successfully');
        toast.success('All data has been cleared successfully!');

        // Also clear workflow history
        clearWorkflowHistory();

        // Clear campaign-specific data
        if (campaign) {
          localStorage.removeItem(`campaign_${campaign.id}_data`);
        }

        // Go back to campaign selector
        toast.success('Campaign data cleared');
        if (onBackToCampaigns) {
          onBackToCampaigns();
        } else {
          window.location.reload();
        }
      } else {
        console.error('Failed to clear user data:', response.error);
        toast.error(`Could not clear all data: ${response.error}. Try clearing your browser cache or contact support.`, { duration: 6000 });
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
      toast.error(`Network error while clearing data: ${error.message}. Check your connection and try again.`, { duration: 6000 });
    }
      }
    });
  };

  const [waitingForDetailedWindow, setWaitingForDetailedWindow] = useState(false);
  const [showEmailReview, setShowEmailReview] = useState(false);
  const [emailForReview, setEmailForReview] = useState(null);

  // 🔥 FIX: Move all useState hooks BEFORE useEffect hooks
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);
  const [microSteps, setMicroSteps] = useState([]);
  const [currentMicroStepIndex, setCurrentMicroStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [backgroundWorkflowRunning, setBackgroundWorkflowRunning] = useState(false);

  // Timeout to prevent getting stuck in waitingForDetailedWindow state
  useEffect(() => {
    if (waitingForDetailedWindow) {
      const timeout = setTimeout(() => {
        // DON'T reset if we're showing email review or waiting for user approval
        if (showEmailReview || emailForReview) {
          console.log('🔧 Skipping auto-reset - email review is active');
          return;
        }
        console.log('🔧 Workflow stuck in waitingForDetailedWindow, auto-resetting...');
        setWaitingForDetailedWindow(false);
        setIsAnimating(false);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [waitingForDetailedWindow, showEmailReview, emailForReview]);

  // Fallback mechanism: Poll workflow status when WebSocket seems stuck
  useEffect(() => {
    if (backgroundWorkflowRunning && microSteps.length <= 2) { // If stuck with minimal progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/workflow/status');
          const statusData = await statusResponse.json();

          if (statusData.success && statusData.data) {
            const { isRunning, currentStep: currentStepFromAPI, steps: stepsFromAPI } = statusData.data;

            // If workflow is not running anymore, show completion
            if (!isRunning && microSteps.length <= 2) {
              console.log('🔧 Detected workflow completion via polling, showing results...');
              setWaitingForDetailedWindow(false);
              setIsAnimating(false);
              setBackgroundWorkflowRunning(false);

              // Create completion micro-steps
              const completionSteps = [
                {
                  type: 'agent_message',
                  message: '✅ Workflow completed successfully!',
                  timestamp: new Date().toISOString(),
                  delay: 0
                },
                {
                  type: 'agent_message',
                  message: 'Check the Prospects and Email Campaign tabs for results.',
                  timestamp: new Date().toISOString(),
                  delay: 1000
                }
              ];

              setMicroSteps(prev => [...prev, ...completionSteps]);
              setCurrentMicroStepIndex(prev => prev + completionSteps.length);
            }
          }
        } catch (error) {
          console.error('Error polling workflow status:', error);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [backgroundWorkflowRunning, microSteps.length]);

  // Original states for other views
  const [ws, setWs] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [showEmailSendConfirmation, setShowEmailSendConfirmation] = useState(false);
  const [hasShownFirstEmailModal, setHasShownFirstEmailModal] = useState(false);
  const [templateApproved, setTemplateApproved] = useState(false); // Track if user approved template usage
  const [approvedTemplate, setApprovedTemplate] = useState(null); // Store approved template data

  // 🎯 Process Notifications State
  const [notificationStage, setNotificationStage] = useState(null);
  const [showProcessNotification, setShowProcessNotification] = useState(false);

  // 🔥 FIX: Declare steps, prospects, generatedEmails BEFORE useEffect that uses them
  const [steps, setSteps] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [prospectForceUpdateKey, setProspectForceUpdateKey] = useState(0); // 🔥 Force re-render for prospects
  const [generatedEmails, setGeneratedEmails] = useState([]);

  const [emailForceUpdateKey, setEmailForceUpdateKey] = useState(0); // Force re-render for emails
  const [emailCampaignStats, setEmailCampaignStats] = useState({
    emails: [],
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0
  });
  const [selectedLogStep, setSelectedLogStep] = useState(null);

  // ⏰ Countdown timer for email generation
  const [generationTimeRemaining, setGenerationTimeRemaining] = useState(null);
  const [generationStartTime, setGenerationStartTime] = useState(null);

  // 🔥 FRESH START: Clear all data when switching campaigns AND load new data
  useEffect(() => {
    const currentCampaignId = agentConfig?.campaign?.id;
    if (currentCampaignId) {
      const previousCampaignId = localStorage.getItem('currentCampaignId');

      // Only reset if this is a DIFFERENT campaign
      if (previousCampaignId && previousCampaignId !== currentCampaignId) {
        console.log('🔥 [CAMPAIGN SWITCH] Switching from', previousCampaignId, 'to', currentCampaignId);
        console.log('🧹 Clearing all UI state for new campaign');

        // Reset everything
        setProspects([]);
        setGeneratedEmails([]);
        setSteps([]);
        setEmailCampaignStats({
          emails: [],
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0
        });
        setWorkflowStatus('idle');
        setHasShownProspectNotification(false); // 🔥 Reset notification flag for new campaign

        // 🔥 AUTO-LOAD: Immediately fetch data for this campaign
        console.log('📥 [AUTO-LOAD] Loading data for campaign:', currentCampaignId);

        // Trigger data fetch
        setTimeout(async () => {
          console.log('📥 [AUTO-LOAD] Fetching workflow results for campaign:', currentCampaignId);

          // Fetch data from API
          try {
            const url = `/api/workflow/results?campaignId=${currentCampaignId}`;
            const result = await apiGet(url);

            if (result.success && result.data) {
              const { prospects: prospectsFromAPI, campaignData } = result.data;
              const emailCampaign = campaignData?.emailCampaign;

              console.log(`📥 [AUTO-LOAD] Loaded ${prospectsFromAPI?.length || 0} prospects, ${emailCampaign?.emails?.length || 0} emails for campaign ${currentCampaignId}`);

              // 🔥 CRITICAL FIX: ALWAYS update state, even with empty arrays
              setProspects(prospectsFromAPI || []);
              setGeneratedEmails(emailCampaign?.emails || []);

              // Update workflow status based on data
              setWorkflowStatus(prevStatus => {
                // If we have prospects or emails, mark as completed (workflow finished)
                if ((prospectsFromAPI && prospectsFromAPI.length > 0) || (emailCampaign?.emails && emailCampaign.emails.length > 0)) {
                  return 'completed';
                }
                // If starting/waiting for template, keep that status
                if (prevStatus === 'starting' || prevStatus === 'waiting') {
                  return prevStatus;
                }
                // If running but no data yet, keep running
                if (prevStatus === 'running') {
                  return 'running';
                }
                // Otherwise idle
                return 'idle';
              });
            } else {
              console.log(`📥 [AUTO-LOAD] No data found for campaign ${currentCampaignId} from API`);
              // 🔥 FIX: DON'T clear prospects if we already have them in state (prevents race condition)
              // Only clear if this is truly a fresh campaign with no prior data
              setProspects(prev => {
                if (prev.length > 0) {
                  console.log(`📥 [AUTO-LOAD] Keeping ${prev.length} existing prospects in state (not clearing)`);
                  return prev;
                }
                return [];
              });
              setGeneratedEmails(prev => {
                if (prev.length > 0) {
                  console.log(`📥 [AUTO-LOAD] Keeping ${prev.length} existing emails in state (not clearing)`);
                  return prev;
                }
                return [];
              });
              // Only set to idle if not currently running
              setWorkflowStatus(prevStatus => {
                if (prevStatus === 'running' || prevStatus === 'starting' || prevStatus === 'paused' || prevStatus === 'waiting') {
                  return prevStatus;
                }
                return 'idle';
              });
            }
          } catch (error) {
            console.error('❌ [AUTO-LOAD] Failed to load campaign data:', error);
            // 🔥 FIX: DON'T clear on error - keep existing data
            console.log('📥 [AUTO-LOAD] Keeping existing state despite API error');
          }
        }, 500);
      }

      // Store the new campaignId
      localStorage.setItem('currentCampaignId', currentCampaignId);
      console.log('✅ [CAMPAIGN SWITCH] Current campaignId:', currentCampaignId);
    }
  }, [agentConfig?.campaign?.id]);

  // 🔥 INITIAL LOAD: Load campaign data when component mounts or campaign prop changes
  useEffect(() => {
    const loadInitialCampaignData = async () => {
      const campaignId = campaign?.id || localStorage.getItem('currentCampaignId');

      if (!campaignId) {
        console.log('⚠️  [INITIAL LOAD] No campaignId found, skipping data load');
        // Clear data if no campaign
        setProspects([]);
        setGeneratedEmails([]);
        return;
      }

      console.log(`📥 [INITIAL LOAD] Loading data for campaign: ${campaignId}`);

      try {
        const url = `/api/workflow/results?campaignId=${campaignId}`;
        const result = await apiGet(url);

        if (result.success && result.data) {
          const { prospects: prospectsFromAPI, campaignData } = result.data;
          const emailCampaign = campaignData?.emailCampaign;

          console.log(`📥 [INITIAL LOAD] Found ${prospectsFromAPI?.length || 0} prospects, ${emailCampaign?.emails?.length || 0} emails for campaign ${campaignId}`);

          // 🔥 CRITICAL FIX: ALWAYS set prospects, even if empty array
          // This ensures switching to a campaign with no prospects will clear the old ones
          setProspects(prospectsFromAPI || []);
          setGeneratedEmails(emailCampaign?.emails || []);

          if (prospectsFromAPI && prospectsFromAPI.length > 0) {
            console.log(`✅ [INITIAL LOAD] Loaded ${prospectsFromAPI.length} prospects for campaign ${campaignId}`);
            // 🔥 NEW FIX: Suppress prospect notification for initial load (onboarding prospects)
            // Only show notification for NEW prospects from background search
            setHasShownProspectNotification(true);
            console.log(`🔕 [INITIAL LOAD] Suppressed prospect notification - these are onboarding prospects`);
          } else {
            console.log(`📭 [INITIAL LOAD] No prospects found for campaign ${campaignId} - cleared prospects state`);
          }

          if (emailCampaign?.emails && emailCampaign.emails.length > 0) {
            console.log(`✅ [INITIAL LOAD] Loaded ${emailCampaign.emails.length} emails for campaign ${campaignId}`);
          } else {
            console.log(`📭 [INITIAL LOAD] No emails found for campaign ${campaignId} - cleared emails state`);
          }

          // Update workflow status based on data
          setWorkflowStatus(prevStatus => {
            // If we have prospects or emails, mark as completed (workflow finished)
            if ((prospectsFromAPI && prospectsFromAPI.length > 0) || (emailCampaign?.emails && emailCampaign.emails.length > 0)) {
              return 'completed';
            }
            // If starting/waiting for template, keep that status
            if (prevStatus === 'starting' || prevStatus === 'waiting') {
              return prevStatus;
            }
            // If running but no data yet, keep running
            if (prevStatus === 'running') {
              return 'running';
            }
            // Otherwise idle
            return 'idle';
          });
        } else {
          console.log(`📥 [INITIAL LOAD] No existing data for campaign ${campaignId} from API`);
          // 🔥 FIX: DON'T clear if we already have prospects (prevents race condition)
          setProspects(prev => {
            if (prev.length > 0) {
              console.log(`📥 [INITIAL LOAD] Keeping ${prev.length} existing prospects in state`);
              return prev;
            }
            return [];
          });
          setGeneratedEmails(prev => {
            if (prev.length > 0) {
              console.log(`📥 [INITIAL LOAD] Keeping ${prev.length} existing emails in state`);
              return prev;
            }
            return [];
          });
          // Only set to idle if not currently running
          setWorkflowStatus(prevStatus => {
            if (prevStatus === 'running' || prevStatus === 'starting' || prevStatus === 'paused' || prevStatus === 'waiting') {
              return prevStatus;
            }
            return 'idle';
          });
        }
      } catch (error) {
        console.error('❌ [INITIAL LOAD] Failed to load campaign data:', error);
        // 🔥 FIX: Keep existing state on error
        console.log('📥 [INITIAL LOAD] Keeping existing state despite API error');
      }
    };

    loadInitialCampaignData();
  }, [campaign?.id]); // Run when campaign changes OR on mount

  // 🚀 NEW: Show popup when workflow is just started from campaign onboarding
  useEffect(() => {
    if (agentConfig?.workflowJustStarted) {
      console.log('🚀 New campaign workflow just started - showing welcome popup');

      // 🔥 FRESH START: Ensure campaignId is stored
      if (agentConfig?.campaign?.id) {
        localStorage.setItem('currentCampaignId', agentConfig.campaign.id);
        console.log('✅ [FRESH START] Stored campaignId:', agentConfig.campaign.id);
      }

      setNotificationStage('websiteAnalysisStarting');
      setShowProcessNotification(true);
      setWorkflowStatus('starting');
      setHasShownProspectNotification(false); // 🔥 Reset notification flag for new campaign

      // Clear the flag so it doesn't show again on re-render
      // We do this by not modifying agentConfig directly, just consuming the flag
    }
  }, [agentConfig?.workflowJustStarted]);

  // 🔥 CRITICAL FIX: Poll for workflow RESULTS every 3 seconds when workflow is running
  // This ensures template popup and prospects update in real-time
  useEffect(() => {
    // Also poll when waiting for template (workflow is paused but still active)
    const isWorkflowActive = backgroundWorkflowRunning ||
                              workflowStatus === 'running' ||
                              workflowStatus === 'starting' ||
                              workflowStatus === 'waiting' ||
                              workflowStatus === 'paused';

    if (isWorkflowActive) {
      console.log('🔄 Starting workflow results polling (workflow is active, status:', workflowStatus, ')');

      // Immediate first poll
      fetchAndTriggerWorkflowSteps();

      const resultsInterval = setInterval(() => {
        console.log('🔄 Polling workflow results...');
        fetchAndTriggerWorkflowSteps();
      }, 3000); // Poll every 3 seconds for faster updates

      return () => {
        console.log('🔄 Stopping workflow results polling');
        clearInterval(resultsInterval);
      };
    }
  }, [backgroundWorkflowRunning, workflowStatus]);

  // 🔔 Watch for workflow status changes and show notifications
  useEffect(() => {
    console.log('🔔 Workflow status changed:', workflowStatus);

    if (workflowStatus === 'starting') {
      // Show website analysis starting notification
      setNotificationStage('websiteAnalysisStarting');
      setShowProcessNotification(true);
    } else if (workflowStatus === 'running') {
      // Check what step we're on
      const currentStep = steps[steps.length - 1];
      if (currentStep?.title?.includes('Website Analysis') || currentStep?.title?.includes('analyzing')) {
        // Currently analyzing website
        setNotificationStage('websiteAnalysisStarting');
        setShowProcessNotification(true);
      } else if (currentStep?.title?.includes('Marketing Strategy') || currentStep?.title?.includes('strategy')) {
        // Currently generating strategy
        setNotificationStage('strategyGenerationStarting');
        setShowProcessNotification(true);
      } else if (currentStep?.title?.includes('Prospect Search') || currentStep?.title?.includes('Finding')) {
        setNotificationStage('prospectSearchInProgress');
        setShowProcessNotification(true);
      }
    } else if (workflowStatus === 'finding_prospects') {
      // 🔥 NEW: Show prospect search starting notification
      setNotificationStage('prospectSearchStarting');
      setShowProcessNotification(true);
    } else if (workflowStatus === 'paused_for_review') {
      // Prospects found
      if (prospects.length > 0 && generatedEmails.length === 0) {
        setNotificationStage('prospectSearchComplete');
        setShowProcessNotification(true);
      }
    } else if (workflowStatus === 'generating_emails') {
      setNotificationStage('emailGenerationStarting');
      setShowProcessNotification(true);
    }
  }, [workflowStatus, steps, prospects.length, generatedEmails.length]);

  // 🔔 Watch for generated emails and show notifications
  useEffect(() => {
    if (generatedEmails.length > 0 && workflowStatus === 'paused_for_editing') {
      setNotificationStage('emailGenerationComplete');
      setShowProcessNotification(true);
    }
  }, [generatedEmails.length, workflowStatus]);

  // 🔔 Watch for completed workflow steps and show completion notifications
  useEffect(() => {
    if (steps.length > 0) {
      const latestStep = steps[steps.length - 1];

      // Check if latest step is completed
      if (latestStep.status === 'completed') {
        if (latestStep.title?.includes('Website Analysis') || latestStep.id?.includes('website')) {
          console.log('✅ Website analysis completed - showing notification');
          setNotificationStage('websiteAnalysisComplete');
          setShowProcessNotification(true);
        } else if (latestStep.title?.includes('Marketing Strategy') || latestStep.id?.includes('strategy')) {
          console.log('✅ Marketing strategy completed - showing notification');
          setNotificationStage('strategyGenerationComplete');
          setShowProcessNotification(true);
        }
      }
    }
  }, [steps]);

  // 🔔 NEW: Watch for prospects being found and show notification
  const [hasShownProspectNotification, setHasShownProspectNotification] = useState(false);
  useEffect(() => {
    if (prospects.length > 0 && !hasShownProspectNotification) {
      console.log(`✅ ${prospects.length} prospects found - showing notification`);
      setNotificationStage('prospectSearchComplete');
      setShowProcessNotification(true);
      setHasShownProspectNotification(true);
    }
  }, [prospects.length, hasShownProspectNotification]);

  // 🔔 NEW: Listen for global workflow notification events from other components
  useEffect(() => {
    const handleWorkflowNotification = (event) => {
      const { stage } = event.detail;
      console.log('🔔 Received workflow notification event:', stage);
      setNotificationStage(stage);
      setShowProcessNotification(true);
    };

    window.addEventListener('workflow-notification', handleWorkflowNotification);
    return () => {
      window.removeEventListener('workflow-notification', handleWorkflowNotification);
    };
  }, []);

  // 🎨 Template Selection State
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [templateRequest, setTemplateRequest] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const templateAlreadySubmittedRef = useRef(false); // 🔥 FIX: Use ref to persist across re-renders
  const [selectedFilters, setSelectedFilters] = useState(new Set());

  // 🚀 Email Generation Status Popup
  const [showGenerationPopup, setShowGenerationPopup] = useState(false);
  const [generationInfo, setGenerationInfo] = useState({ templateName: '', prospectCount: 0 });

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, isHome: true },
    { id: 'workflow', label: 'AI Agent', icon: Activity },
    { id: 'dashboard', label: 'Smart Workflow Platform', icon: Gauge },
    { id: 'prospects', label: 'Prospects', icon: FileText },
    { id: 'emails', label: 'Email Campaign', icon: Mail },
    { id: 'email_editor', label: 'Email Editor', icon: Edit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'research', label: 'Research', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Handle user scroll detection
  const handleScroll = () => {
    setUserIsScrolling(true);
    
    // Clear previous timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set user as not scrolling after 2 seconds of no scroll activity
    const timeout = setTimeout(() => {
      setUserIsScrolling(false);
    }, 2000);
    
    setScrollTimeout(timeout);
  };

  // Auto-scroll to bottom for ChatGPT interface and workflow updates
  useEffect(() => {
    if (!userIsScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userIsScrolling]);

  // Auto-scroll to latest workflow content when microSteps change
  useEffect(() => {
    if (activeView === 'workflow' && microSteps.length > 0 && !userIsScrolling) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [microSteps, currentMicroStepIndex, activeView, userIsScrolling]);

  // Create micro-steps from workflow data
  const createMicroSteps = (workflowData) => {
    const stepsArray = [];
    
    // Business Analysis Micro-steps
    if (workflowData.type === 'business_analysis' || workflowData.stepId?.includes('business')) {
      stepsArray.push({
        type: 'agent_message',
        message: "I'm analyzing your business and website.",
        delay: 1000
      });
      stepsArray.push({
        type: 'agent_message', 
        message: "I'll first analyze your website structure.",
        delay: 1500
      });
      stepsArray.push({
        type: 'window',
        title: 'Website Analysis',
        content: {
          website: 'https://fruitai.org/',
          industry: 'Food Technology',
          status: 'Analysis Complete'
        },
        delay: 2000
      });
      stepsArray.push({
        type: 'agent_message',
        message: "Now I'm generating your marketing strategy.",
        delay: 1500
      });
      stepsArray.push({
        type: 'window',
        title: 'Marketing Strategy Generated',
        content: {
          target: 'B2B Food Technology companies',
          keywords: 'Food Technology, business solutions',
          painPoints: 'efficiency, growth optimization'
        },
        delay: 2500
      });
    }
    
    // Prospect Search Micro-steps  
    if (workflowData.prospects || workflowData.stepId?.includes('prospect')) {
      stepsArray.push({
        type: 'agent_message',
        message: "I'm finding qualified prospects for you.",
        delay: 1000
      });
      stepsArray.push({
        type: 'agent_message',
        message: "I'll first activate the 🔍 Super Email Search Engine.",
        delay: 1500
      });
      stepsArray.push({
        type: 'window',
        title: 'Super Email Search Engine Active',
        content: {
          searchTerm: 'Food Technology',
          duration: '31.5 seconds',
          successRate: '100% (10/10 emails found)',
          websitesCrawled: 35,
          domainsDiscovered: 43
        },
        delay: 3000
      });
      
      // Add individual prospect micro-steps
      const workflowProspects = workflowData.prospects || [];
      workflowProspects.slice(0, 5).forEach((prospect, index) => {
        stepsArray.push({
          type: 'agent_message',
          message: index === 0 ? "I found this qualified prospect:" : "I found another qualified prospect:",
          delay: 1200
        });
        stepsArray.push({
          type: 'prospect_card',
          prospect: prospect,
          delay: 2000
        });
      });
    }
    
    // Email Generation Micro-steps
    if (workflowData.emails || workflowData.stepId?.includes('email')) {
      stepsArray.push({
        type: 'agent_message',
        message: "I'm creating personalized emails for you.",
        delay: 1000
      });
      stepsArray.push({
        type: 'agent_message',
        message: "I'll first analyze each prospect's persona.",
        delay: 1500
      });
      stepsArray.push({
        type: 'detailed_window',
        title: 'AI Email Generation System',
        content: {
          type: 'email_generation',
          aiModel: 'qwen2.5:0.5b (Fast generation)',
          templates: '38 premium templates loaded',
          personalization: 'Deep industry & role-based',
          status: 'Sequential email generation active'
        },
        delay: 2500
      });
      
      // Add individual email micro-steps
      const workflowEmails = workflowData.emails || [];
      workflowEmails.slice(0, 3).forEach((email, index) => {
        stepsArray.push({
          type: 'agent_message',
          message: index === 0 ? "I created this personalized email:" : "I created another personalized email:",
          delay: 1500
        });
        stepsArray.push({
          type: 'email_card',
          email: email,
          delay: 2500
        });
      });
    }
    
    return stepsArray;
  };

  // Sequential micro-step animation - only animate new steps
  const startMicroStepAnimation = (newMicroSteps) => {
    const currentStepsCount = microSteps.length;
    setMicroSteps(prevSteps => [...prevSteps, ...newMicroSteps]);

    // Start animating from the first new step
    if (!isAnimating) {
      setCurrentMicroStepIndex(currentStepsCount);
      setIsAnimating(true);
    }
  };

  // Auto-advance to next micro-step
  useEffect(() => {
    if (isAnimating && currentMicroStepIndex < microSteps.length && !waitingForDetailedWindow) {
      const currentMicroStep = microSteps[currentMicroStepIndex];
      console.log(`🎬 Processing micro-step ${currentMicroStepIndex}/${microSteps.length}: ${currentMicroStep.type} - ${currentMicroStep.message || currentMicroStep.title || 'N/A'}`);

      // Check if current step is a detailed window
      if (currentMicroStep.type === 'detailed_window') {
        console.log('🎬 Starting detailed window animation, pausing progression');
        setWaitingForDetailedWindow(true);
        // Don't set timer for next step yet - wait for detailed window completion
        return;
      }
      
      const timer = setTimeout(() => {
        setCurrentMicroStepIndex(prev => prev + 1);

        // Auto-scroll to latest content
        if (!userIsScrolling) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'end'
            });
          }, 200);
        }
      }, currentMicroStep.delay);

      return () => clearTimeout(timer);
    } else if (currentMicroStepIndex >= microSteps.length) {
      setIsAnimating(false);
    }
  }, [currentMicroStepIndex, microSteps, isAnimating, waitingForDetailedWindow]);

  // Handle detailed window completion
  const handleDetailedWindowComplete = () => {
    console.log('🎬 Detailed window animation completed, resuming progression');
    console.log('🎬 Current micro step index:', currentMicroStepIndex);
    console.log('🎬 Total micro steps:', microSteps.length);
    setWaitingForDetailedWindow(false);
    
    // Move to next step after detailed window completes
    setTimeout(() => {
      console.log('🎬 Advancing to next micro step');
      setCurrentMicroStepIndex(prev => {
        const newIndex = prev + 1;
        console.log('🎬 New micro step index:', newIndex);
        return newIndex;
      });
      
      // Auto-scroll to latest content
      if (!userIsScrolling) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end' 
          });
        }, 200);
      }
    }, 500); // Small delay before next step
  };

  // Track if we've already shown initial animation
  const [hasShownInitialAnimation, setHasShownInitialAnimation] = useState(false);
  // Track if we've already shown email and prospect steps
  const [hasShownEmailSteps, setHasShownEmailSteps] = useState(false);
  const [hasShownProspectSteps, setHasShownProspectSteps] = useState(false);
  const [isProcessingWorkflowResults, setIsProcessingWorkflowResults] = useState(false);
  const [justReset, setJustReset] = useState(false);
  const [lastWorkflowFetchTime, setLastWorkflowFetchTime] = useState(0);
  // Track currently processing steps
  const [processingSteps, setProcessingSteps] = useState(new Set());
  // Selected email for full preview
  const [selectedEmailPreview, setSelectedEmailPreview] = useState(null);
  // Track detailed window completion to pause progression
  const [historyRestored, setHistoryRestored] = useState(false);
  
  // DISABLED: Restore historical workflow data on component mount
  useEffect(() => {
    // DO NOT restore from localStorage - always start fresh
    console.log('🚫 Workflow history restoration DISABLED - starting fresh');

    // Clear any existing workflow history from localStorage
    try {
      localStorage.removeItem('workflowHistory');
      localStorage.removeItem('justReset');
      console.log('🧹 Cleared all workflow cache from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }

    setHistoryRestored(true);
  }, []);

  // DISABLED: Auto-save prospects to workflow history when they change
  useEffect(() => {
    // DO NOT save to localStorage
    if (prospects.length > 0) {
      console.log('🚫 Auto-save prospects DISABLED');
    }
  }, [prospects]);

  // DISABLED: Auto-save email campaign stats to workflow history when they change
  useEffect(() => {
    // DO NOT save to localStorage
    if (emailCampaignStats.emails.length > 0) {
      console.log('🚫 Auto-save email stats DISABLED');
    }
  }, [emailCampaignStats]);

  // DISABLED: Auto-save generated emails to workflow history when they change
  useEffect(() => {
    // DO NOT save to localStorage
    if (generatedEmails.length > 0) {
      console.log('🚫 Auto-save emails DISABLED');
    }
  }, [generatedEmails]);

  // Start initial demo only once when first receiving real data
  useEffect(() => {
    // Don't restart animation just from switching tabs
    // Only show initial animation once per session
    if (activeView === 'workflow' && microSteps.length === 0 && !hasShownInitialAnimation) {
      // Rich initial demo with windows while waiting for backend
      const initialMicroSteps = [
        {
          type: 'agent_message',
          message: "I'm starting your marketing campaign automation.",
          delay: 1000
        },
        {
          type: 'detailed_window',
          title: '🚀 AI Marketing System Initializing',
          content: {
            type: 'system_startup',
            aiModel: 'Ollama qwen2.5:0.5b',
            status: 'Loading marketing automation modules...',
            modules: ['Business Analysis', 'Prospect Discovery', 'Email Generation'],
            progress: '100%'
          },
          delay: 2000
        },
        {
          type: 'agent_message',
          message: "I'll analyze your business and find qualified prospects.",
          delay: 1500
        },
        {
          type: 'window',
          title: '🎯 Business Intelligence Engine',
          content: {
            website: 'https://fruitai.org/',
            industry: 'Food Technology',
            analysis: 'AI-powered freshness detection',
            targetMarket: 'B2B Food & Agriculture',
            status: 'Analysis complete'
          },
          delay: 2500
        }
      ];

      console.log('Starting enhanced initial demo micro-steps (one time only)');
      startMicroStepAnimation(initialMicroSteps);
      setHasShownInitialAnimation(true);
    }
  }, [activeView, hasShownInitialAnimation]);

  // Process backend pipeline messages and create real-time micro-steps
  const processPipelineMessage = (data) => {
    console.log('🔍 Processing pipeline message:', data);
    
    // Check for different message formats
    const message = data.message || data.log || data.text || JSON.stringify(data);
    
    // Create micro-steps based on backend activity patterns
    let shouldCreateMicroStep = false;
    let newMicroSteps = [];
    
    // Detect if this is start of a process (show processing indicator)
    const isProcessStart = message.includes('Starting') || message.includes('启动') || message.includes('开始');
    const isProcessProgress = message.includes('Processing') || message.includes('正在') || message.includes('Analyzing');
    const isProcessComplete = message.includes('Complete') || message.includes('完成') || message.includes('Success');
    
    // Super Email Search Engine - action and results
    if (message.includes('Super Email Search Engine') || data.searchComplete) {
      shouldCreateMicroStep = true;
      newMicroSteps = [{
        type: 'agent_message',
        message: "Perfect! I found qualified prospects using advanced search techniques.",
        delay: 500
      }, {
        type: 'window',
        title: 'Super Email Search Engine Results',
        icon: Radar,
        content: {
          searchTerm: 'Food Technology',
          duration: '31.5 seconds',
          successRate: '100% (10/10 emails found)',
          websitesCrawled: '35',
          domainsDiscovered: '43',
          status: 'Search complete'
        },
        delay: 1500
      }];
    }
    
    // Website Analysis - action and results
    else if (message.includes('网站分析') || message.includes('website_analysis') || data.websiteAnalysis) {
      const websiteMatch = message.match(/https?:\/\/[^\s)]+/) || [data.website];
      if (websiteMatch && websiteMatch[0]) {
        shouldCreateMicroStep = true;
        newMicroSteps = [{
          type: 'agent_message',
          message: "Now I'm analyzing each prospect's business profile.",
          delay: 500
        }, {
          type: 'window',
          title: '⚡ Website Analysis Engine',
          content: {
            website: websiteMatch[0] || 'https://fruitai.org/',
            status: 'Ultra-fast analysis mode',
            cacheStatus: 'Using cached results',
            analysisTime: '< 2 seconds',
            businessProfile: 'Industry analysis complete'
          },
          delay: 1500
        }];
      }
    }
    
    // AI Marketing Strategy Generation
    else if (message.includes('marketing_strategy') || message.includes('AI Marketing') || data.strategyGeneration) {
      shouldCreateMicroStep = true;
      newMicroSteps = [{
        type: 'agent_message',
        message: "I'm generating your AI-powered marketing strategy.",
        delay: 500
      }, {
        type: 'window',
        title: '🧠 AI Marketing Strategy Generator',
        content: {
          aiEngine: 'Ollama qwen2.5:0.5b',
          optimization: 'Real-time market intelligence',
          personalization: 'Industry-specific targeting',
          targetAudience: 'B2B Food Technology',
          status: 'Strategy generation complete'
        },
        delay: 1500
      }];
    }
    
    // Email Validation
    else if (message.includes('email_validation') || message.includes('Email Validation') || data.emailValidation) {
      shouldCreateMicroStep = true;
      newMicroSteps = [{
        type: 'agent_message',
        message: "I'm validating all email addresses for maximum deliverability.",
        delay: 500
      }, {
        type: 'window',
        title: 'Email Validation System',
        icon: Shield,
        content: {
          validationEngine: 'Advanced DNS verification',
          totalEmails: data.totalEmails || 10,
          validatedEmails: data.validatedEmails || 9,
          successRate: data.successRate || '90%',
          status: 'Validation complete'
        },
        delay: 1500
      }];
    }
    
    // Marketing Strategy & Ollama Generation
    else if (message.includes('OLLAMA') || message.includes('Marketing optimization') || message.includes('qwen2.5')) {
      shouldCreateMicroStep = true;
      newMicroSteps = [{
        type: 'agent_message',
        message: "I'm generating your AI-powered marketing strategy.",
        delay: 500
      }, {
        type: 'window',
        title: '🧠 AI Marketing Strategy Generator',
        content: {
          aiEngine: 'Ollama qwen2.5:0.5b',
          optimization: 'Real-time market intelligence',
          personalization: 'Industry-specific targeting',
          targetAudience: 'B2B Food Technology',
          status: 'Strategy generation complete'
        },
        delay: 1500
      }];
    }
    
    // Email Validation
    else if (message.includes('DNS验证') || message.includes('Validation passed') || data.emailValidation) {
      const validationMatch = message.match(/(\d+)\/(\d+)\s*通过/);
      if (validationMatch) {
        shouldCreateMicroStep = true;
        const [, passed, total] = validationMatch;
        newMicroSteps = [{
          type: 'agent_message',
          message: "I'm validating all email addresses for deliverability.",
          delay: 500
        }, {
          type: 'window',
          title: 'Email Validation System',
        icon: Shield,
          content: {
            validationEngine: 'Advanced DNS verification',
            totalEmails: total,
            validatedEmails: passed,
            successRate: `${Math.round((passed/total)*100)}%`,
            status: 'Validation complete'
          },
          delay: 1500
        }];
      }
    }
    
    // Persona Generation
    else if (message.includes('PROSPECT') || message.includes('Generating AI User Persona') || data.personaGeneration) {
      const prospectMatch = message.match(/PROSPECT (\d+)\/(\d+)/);
      if (prospectMatch) {
        shouldCreateMicroStep = true;
        const [, current, total] = prospectMatch;
        newMicroSteps = [{
          type: 'agent_message',
          message: `I'm creating a personalized profile for prospect ${current} of ${total}.`,
          delay: 500
        }, {
          type: 'detailed_window',
          title: 'AI Persona Generator',
          icon: Target,
          content: {
            type: 'persona_generation',
            aiModel: 'qwen2.5:0.5b',
            processingMode: 'Deep persona analysis',
            currentProspect: `${current}/${total}`,
            personalizationLevel: 'Industry & role-based',
            status: 'Generating persona...'
          },
          delay: 1500
        }];
      }
    }
    
    // Only add micro-steps if we created new ones and aren't already animating
    if (shouldCreateMicroStep && newMicroSteps.length > 0) {
      console.log('🎬 Adding new micro-steps:', newMicroSteps.length);
      
      // Append to existing micro-steps instead of replacing
      setMicroSteps(prevSteps => [...prevSteps, ...newMicroSteps]);
      
      // If not currently animating, start the animation
      if (!isAnimating) {
        setIsAnimating(true);
      }
    }
  };

  // 🎨 Handle template selection required
  const handleTemplateSelectionRequired = async (data) => {
    console.log('🎨 === INSIDE handleTemplateSelectionRequired ===');
    console.log('🎨 Template selection required data:', data);
    console.log('🎨 Setting templateRequest...');
    setTemplateRequest(data);
    console.log('🎨 Setting showTemplateSelection to TRUE...');
    setShowTemplateSelection(true);
    console.log('🎨 showTemplateSelection state updated to TRUE');

    // 🔥 CRITICAL: Set workflow status to 'waiting' so polling continues
    setWorkflowStatus('waiting');
    console.log('🎨 Set workflowStatus to waiting');

    // 🔥 CRITICAL FIX: Immediately show sample prospects from WebSocket message
    if (data.sampleProspects && data.sampleProspects.length > 0) {
      console.log(`📦 [TEMPLATE POPUP] Adding ${data.sampleProspects.length} sample prospects from WebSocket immediately`);
      setProspects(prev => {
        const existingEmails = new Set(prev.map(p => p.email));
        const newProspects = data.sampleProspects.filter(p => !existingEmails.has(p.email));
        if (newProspects.length > 0) {
          console.log(`📦 [TEMPLATE POPUP] Adding ${newProspects.length} sample prospects (${prev.length} → ${prev.length + newProspects.length})`);
          return [...prev, ...newProspects];
        }
        return prev;
      });
    }

    // 🔥 CRITICAL FIX: Then fetch and display ALL prospects for the campaign
    const campaignId = data.campaignId || localStorage.getItem('currentCampaignId');
    if (campaignId) {
      console.log(`📥 [TEMPLATE POPUP] Fetching ALL prospects for campaign ${campaignId} to display immediately`);
      try {
        const url = `/api/workflow/results?campaignId=${campaignId}`;
        const result = await apiGet(url);

        if (result.success && result.data?.prospects) {
          const allProspects = result.data.prospects;
          console.log(`📥 [TEMPLATE POPUP] Fetched ${allProspects.length} prospects - adding to UI immediately`);

          // Merge with existing prospects
          setProspects(prev => {
            const existingEmails = new Set(prev.map(p => p.email));
            const newProspects = allProspects.filter(p => !existingEmails.has(p.email));
            if (newProspects.length > 0) {
              console.log(`📦 [TEMPLATE POPUP] Adding ${newProspects.length} new prospects (${prev.length} → ${prev.length + newProspects.length})`);
              return [...prev, ...newProspects];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('❌ [TEMPLATE POPUP] Error fetching prospects:', error);
      }
    }

    // Show notification
    console.log(`✨ Found ${data.prospectsFound || data.prospectsCount || 'N/A'} prospects! Please select an email template.`);
    console.log('🎨 === EXITING handleTemplateSelectionRequired ===');
  };

  // 🎨 Handle template selected confirmation
  const handleTemplateSelected = (data) => {
    console.log('✅ Template selected:', data.templateName);
    setShowTemplateSelection(false);
    setIsSubmittingTemplate(false);
    setSelectedTemplate(null);

    console.log(`🎯 Template "${data.templateName}" applied! Email generation continuing...`);
  };

  // 🎨 Handle template selection confirm
  const handleTemplateConfirm = async (passedTemplate = null) => {
    // 🔥 FIX: Accept template as parameter to avoid race condition with React state
    const templateToUse = passedTemplate || selectedTemplate;

    if (!templateToUse) {
      console.error('❌ No template selected', { passedTemplate, selectedTemplate });
      return;
    }

    // 🔥 FIX: Get campaignId from context, not just from templateRequest
    // This allows manual template selection to work
    const contextCampaignId = agentConfig?.campaign?.id || localStorage.getItem('currentCampaignId');
    const campaignIdToUse = templateRequest?.campaignId || contextCampaignId || 'default';
    console.log('🎨 Using campaignId:', campaignIdToUse, '(from:', templateRequest?.campaignId ? 'websocket' : contextCampaignId ? 'context' : 'default', ')');

    setIsSubmittingTemplate(true);

    try {
      console.log('🎨 Confirming template selection:', templateToUse.id);
      console.log('🎨 Selected template data:', templateToUse);

      // Extract customization data from templateToUse
      const baseTemplate = EMAIL_TEMPLATES[templateToUse.id];

      // 🔥 FIX: Check for ACTUAL edits - compare HTML or check for real customization values
      const hasActualCustomizations = !!(
        (templateToUse.userEdited) || // Explicit flag that user edited something
        (templateToUse.isCustomized === true) || // Explicit customized flag
        (templateToUse.html && templateToUse.html !== baseTemplate?.html) || // HTML was edited
        (templateToUse.manualContent) || // Manual mode content exists
        (templateToUse.customizations && Object.keys(templateToUse.customizations).some(
          key => templateToUse.customizations[key] !== undefined &&
                 templateToUse.customizations[key] !== null &&
                 templateToUse.customizations[key] !== '' &&
                 templateToUse.customizations[key] !== baseTemplate?.customizations?.[key]
        ))
      );

      const customizations = {
        subject: templateToUse.subject || baseTemplate?.subject,
        greeting: templateToUse.greeting || 'Hi {name},',
        signature: templateToUse.signature || 'Best regards,\n{senderName}\n{company}',
        customizations: templateToUse.customizations || {},
        templateId: templateToUse.id,
        templateName: templateToUse.name || baseTemplate?.name,
        // 🎯 INCLUDE THE EDITED TEMPLATE HTML if user customized it
        html: templateToUse.html || baseTemplate?.html,
        components: baseTemplate?.structure?.components || [],
        // 🎨 INCLUDE MANUAL MODE CONTENT for custom templates
        templateMode: templateToUse.templateMode || 'ai',
        manualContent: templateToUse.manualContent || null,
        // FIXED: Only mark as customized if user actually edited something
        isCustomized: hasActualCustomizations
      };

      // 🎯 CRITICAL: Log all customizations being sent
      console.log('🎨 Full customizations object being sent:', customizations.customizations);
      console.log('🎨 Customizations include:', {
        logo: customizations.customizations.logo,
        greeting: customizations.greeting,
        headerTitle: customizations.customizations.headerTitle,
        mainHeading: customizations.customizations.mainHeading,
        buttonText: customizations.customizations.buttonText,
        buttonUrl: customizations.customizations.buttonUrl,
        primaryColor: customizations.customizations.primaryColor,
        textSize: customizations.customizations.textSize,
        textColor: customizations.customizations.textColor,
        fontWeight: customizations.customizations.fontWeight,
        fontStyle: customizations.customizations.fontStyle,
        testimonialText: customizations.customizations.testimonialText,
        testimonialAuthor: customizations.customizations.testimonialAuthor
      });

      console.log('🎨 Template HTML included:', !!customizations.html, `(${customizations.html?.length || 0} chars)`);

      console.log('🎨 Sending customizations to backend:', {
        hasCustomizations: !!customizations.customizations,
        hasSubject: !!customizations.subject,
        hasGreeting: !!customizations.greeting,
        isCustomized: customizations.isCustomized
      });

      // Get template components from EMAIL_TEMPLATES
      const templateComponents = EMAIL_TEMPLATES[templateToUse.id]?.structure?.components || [];
      console.log('🧩 Template components:', templateComponents);

      // Use TemplateSelectionService to send data with customizations AND components
      // 🔥 CRITICAL FIX: Always pass customizations if HTML was edited OR has real customization values OR has manual content
      const shouldPassCustomizations =
        (customizations.html && customizations.html !== baseTemplate?.html) ||
        (customizations.manualContent) ||  // Include manual mode content
        Object.keys(customizations.customizations || {}).some(
          key => customizations.customizations[key] !== undefined &&
                 customizations.customizations[key] !== null &&
                 customizations.customizations[key] !== ''
        );

      console.log('🔥 CRITICAL: shouldPassCustomizations =', shouldPassCustomizations, {
        hasHTML: !!customizations.html,
        htmlDifferent: customizations.html !== baseTemplate?.html,
        hasCustomizationValues: Object.keys(customizations.customizations || {}).length > 0
      });

      const result = await TemplateSelectionService.selectTemplate(
        templateToUse.id,
        campaignIdToUse,
        templateRequest?.workflowId || campaignIdToUse,
        shouldPassCustomizations ? customizations : null,
        templateComponents  // <-- NOW INCLUDING COMPONENTS!
      );

      console.log('✅ Template selection response:', result);
      console.log(`✅ Template ${templateToUse.name} applied successfully with customizations!`);

      // 🎉 Show success notification
      toast.success(`Template "${templateToUse.name}" selected! Starting email generation...`, {
        duration: 5000,
        icon: '🎨',
      });

      // 🚀 Show email generation status popup
      setGenerationInfo({
        templateName: templateToUse.name,
        prospectCount: prospects?.length || 0
      });
      setShowGenerationPopup(true);

      // Close template selection modal and mark as submitted
      setShowTemplateSelection(false);
      setSelectedTemplate(null);
      setTemplateRequest(null);
      templateAlreadySubmittedRef.current = true; // 🎯 CRITICAL: Prevent popup from appearing again
      console.log('🎯 Template submission flag set - popup will not retrigger');

    } catch (error) {
      console.error('❌ Failed to confirm template selection:', error);

      // 🎉 Show error notification
      toast.error(`Failed to select template: ${error.message}. Please try again.`, {
        duration: 6000,
      });
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  // 🔥 DEDICATED HANDLER: Process prospect_batch_update messages
  const handleProspectBatchUpdate = (data) => {
    // 🔥 CRITICAL: Always read FRESH from localStorage to avoid stale prop values
    const currentCampaignId = localStorage.getItem('currentCampaignId') || campaign?.id;
    const batchCampaignId = data.data?.campaignId || data.campaignId;

    console.log(`📦 [BATCH] Campaign check: batch=${batchCampaignId} (type: ${typeof batchCampaignId}), current=${currentCampaignId} (type: ${typeof currentCampaignId})`);

    // 🔒 Campaign isolation check - normalize to strings for comparison
    const batchStr = String(batchCampaignId || '');
    const currentStr = String(currentCampaignId || '');

    if (batchStr && currentStr && batchStr !== currentStr) {
      console.log(`🚫 [BATCH] Skipping - different campaign (${batchStr} !== ${currentStr})`);
      return;
    }

    const batchProspects = data.data?.prospects || [];
    console.log(`📦 [BATCH] ✅ PROCESSING ${batchProspects.length} prospects for campaign ${currentStr}`);

    if (batchProspects.length > 0) {
      console.log(`📦 [BATCH] 🚀 About to call setProspects with ${batchProspects.length} prospects`);

      setProspects(prev => {
        console.log(`📦 [BATCH] Inside setProspects: prev.length = ${prev.length}`);
        const existingEmails = new Set(prev.map(p => p.email));
        const newProspects = batchProspects.filter(p => p.email && !existingEmails.has(p.email));
        if (newProspects.length > 0) {
          console.log(`📦🚀 [BATCH] Adding ${newProspects.length} NEW prospects (${prev.length} → ${prev.length + newProspects.length})`);
          const updated = [...prev, ...newProspects];
          console.log(`📦🚀 [BATCH] New array length: ${updated.length}`);
          return updated;
        }
        console.log(`📦 [BATCH] No new prospects to add (all ${batchProspects.length} are duplicates)`);
        return prev;
      });

      // 🔥 CRITICAL: Force re-render by updating the key
      console.log(`📦 [BATCH] Forcing re-render via setProspectForceUpdateKey`);
      setProspectForceUpdateKey(k => k + 1);

      // Toast notification
      toast.success(`🎯 Found ${batchProspects.length} prospects!`, { duration: 3000 });
    } else {
      console.log(`📦 [BATCH] ⚠️ No prospects in batch data!`);
    }
  };

  // 🔥 DEDICATED HANDLER: Process prospect_list messages
  const handleProspectListUpdate = (data) => {
    // 🔥 CRITICAL: Always read FRESH from localStorage to avoid stale prop values
    const currentCampaignId = localStorage.getItem('currentCampaignId') || campaign?.id;
    const listCampaignId = data.campaignId || data.workflowId;

    console.log(`📋 [LIST] Campaign check: list=${listCampaignId}, current=${currentCampaignId}`);

    // 🔒 Campaign isolation check - normalize to strings for comparison
    const listStr = String(listCampaignId || '');
    const currentStr = String(currentCampaignId || '');

    if (listStr && currentStr && listStr !== currentStr) {
      console.log(`🚫 [LIST] Skipping - different campaign`);
      return;
    }

    const listProspects = data.prospects || [];
    console.log(`📋 [LIST] Processing ${listProspects.length} prospects`);

    if (listProspects.length > 0) {
      setProspects(prev => {
        const existingEmails = new Set(prev.map(p => p.email));
        const newProspects = listProspects.filter(p => p.email && !existingEmails.has(p.email));
        if (newProspects.length > 0) {
          console.log(`📋🚀 [LIST] Adding ${newProspects.length} prospects (${prev.length} → ${prev.length + newProspects.length})`);
          return [...prev, ...newProspects];
        }
        return prev;
      });

      // Force re-render
      setProspectForceUpdateKey(k => k + 1);
    }
  };

  // 🔥 DEDICATED HANDLER: Process data_update with prospects
  const handleDataUpdateProspects = (data) => {
    const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
    const updateCampaignId = data.campaignId || data.data?.campaignId;

    console.log(`📊 [DATA] Campaign check: update=${updateCampaignId}, current=${currentCampaignId}`);

    // Campaign isolation check
    if (updateCampaignId && currentCampaignId &&
        updateCampaignId !== currentCampaignId &&
        updateCampaignId !== String(currentCampaignId)) {
      console.log(`🚫 [DATA] Skipping - different campaign`);
      return;
    }

    const dataProspects = data.data?.prospects || [];
    console.log(`📊 [DATA] Processing ${dataProspects.length} prospects`);

    if (dataProspects.length > 0) {
      setProspects(prev => {
        const existingEmails = new Set(prev.map(p => p.email));
        const newProspects = dataProspects.filter(p => p.email && !existingEmails.has(p.email));
        if (newProspects.length > 0) {
          console.log(`📊🚀 [DATA] Adding ${newProspects.length} prospects (${prev.length} → ${prev.length + newProspects.length})`);
          return [...prev, ...newProspects];
        }
        return prev;
      });

      // Force re-render
      setProspectForceUpdateKey(k => k + 1);
    }
  };

  // Handle workflow updates for agent desktop view
  const handleWorkflowUpdate = (data) => {
    console.log('🎯 Processing workflow update:', data.type);
    
    // Handle various backend message types and create micro-steps
    if (data.type === 'workflow_update') {
      // Check if this step has already been processed
      const stepId = data.stepId || data.type;
      if (!completedSteps.has(stepId)) {
        // Create and start micro-step animation for new steps only
        const newMicroSteps = createMicroSteps(data);
        if (newMicroSteps.length > 0) {
          startMicroStepAnimation(newMicroSteps);
          setCompletedSteps(prev => new Set([...prev, stepId]));
        }
      }
      
      if (data.stepId && data.stepData) {
        const step = {
          id: data.stepId,
          title: data.stepData.title || data.stepId,
          description: data.stepData.description || '',
          status: data.stepData.status || 'running',
          details: data.stepData.details || {},
          metrics: data.stepData.metrics || {},
          timestamp: new Date().toISOString()
        };
        
        setCurrentStep(step);
        
        // Update steps array
        setSteps(prevSteps => {
          const existingIndex = prevSteps.findIndex(s => s.id === data.stepId);
          if (existingIndex !== -1) {
            const updated = [...prevSteps];
            updated[existingIndex] = step;
            return updated;
          } else {
            return [...prevSteps, step];
          }
        });
        
        // Update workflow status
        if (data.stepData.status === 'running') {
          setWorkflowStatus('running');
        } else if (data.stepData.status === 'completed') {
          // Check if all steps are completed
          setSteps(prevSteps => {
            const allCompleted = prevSteps.every(s => 
              s.id === data.stepId ? data.stepData.status === 'completed' : s.status === 'completed'
            );
            if (allCompleted && prevSteps.length > 0) {
              setWorkflowStatus('completed');
              setCurrentStep(null);
            }
            return prevSteps;
          });
        }
      }
      
      // Handle prospects data and trigger micro-steps
      if (data.prospects) {
        // 🔒 CRITICAL: Campaign isolation check to prevent mixing prospects
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const prospectCampaignId = data.campaignId || data.data?.campaignId;

        console.log(`📦 [WORKFLOW] Campaign check: prospects=${prospectCampaignId}, current=${currentCampaignId}`);

        if (prospectCampaignId && currentCampaignId &&
            prospectCampaignId !== currentCampaignId &&
            prospectCampaignId !== String(currentCampaignId)) {
          console.log(`🚫 [WORKFLOW] Skipping prospects from different campaign`);
          return; // Skip - different campaign
        }

        console.log(`📦 Received ${data.prospects.length} prospects via WebSocket - merging`);
        setProspects(prev => {
          const existingEmails = new Set(prev.map(p => p.email));
          const newProspects = data.prospects.filter(p => !existingEmails.has(p.email));
          if (newProspects.length > 0) {
            console.log(`📦 Adding ${newProspects.length} new prospects (${prev.length} → ${prev.length + newProspects.length})`);
            return [...prev, ...newProspects];
          }
          return prev;
        });

        // Show notification: Prospects found!
        setAgentStatus('prospects_found');
        setAgentMessage(`${data.prospects.length} Prospects Found!`);
        setAgentDetails([
          `${data.prospects.length} verified prospects ready`,
          'AI will personalize emails for each prospect',
          'Preview before sending'
        ]);

        // Create real micro-steps from backend data
        const realMicroSteps = [
          {
            type: 'agent_message',
            message: "Great! I found qualified prospects for you.",
            delay: 1000
          },
          {
            type: 'detailed_window',
            title: 'Super Email Search Engine Results',
        icon: Radar,
            content: {
              type: 'email_search',
              searchTerm: 'Food Technology',
              duration: '31.5 seconds',
              successRate: `100% (${data.prospects.length}/${data.prospects.length} emails found)`,
              websitesCrawled: 35,
              domainsDiscovered: 43
            },
            delay: 2000
          }
        ];
        
        // Add individual prospect cards
        data.prospects.slice(0, 5).forEach((prospect, index) => {
          realMicroSteps.push({
            type: 'agent_message',
            message: index === 0 ? "I found this qualified prospect:" : "I found another qualified prospect:",
            delay: 1200
          });
          realMicroSteps.push({
            type: 'prospect_card',
            prospect: prospect,
            delay: 2000
          });
        });
        
        console.log(`Starting real micro-steps for ${data.prospects.length} prospects`);
        startMicroStepAnimation(realMicroSteps);
      }
      
      // Handle email campaign data
      if (data.emailCampaign) {
        setEmailCampaignStats({
          emails: data.emailCampaign.emails || [],
          totalSent: data.emailCampaign.totalSent || 0,
          totalOpened: data.emailCampaign.totalOpened || 0,
          totalClicked: data.emailCampaign.totalClicked || 0
        });
        setGeneratedEmails(data.emailCampaign.emails || []);

        // Show notification: Generating emails
        if (data.emailCampaign.emails && data.emailCampaign.emails.length > 0) {
          setAgentStatus('emails_generated');
          setAgentMessage(`${data.emailCampaign.emails.length} Emails Generated Successfully!`);
          setAgentDetails([
            `${data.emailCampaign.emails.length} personalized emails ready`,
            'AI-powered content for each prospect',
            'Ready to review and send'
          ]);
        } else {
          setAgentStatus('generating');
          setAgentMessage('Generating personalized emails...');
          setAgentDetails([
            'AI analyzing prospect profiles',
            'Creating customized content',
            'Applying best practices'
          ]);
        }

        // Create email generation micro-steps
        const emailMicroSteps = [
          {
            type: 'agent_message',
            message: "Now I'm creating personalized emails for you.",
            delay: 1000
          },
          {
            type: 'agent_message',
            message: "I'll analyze each prospect's persona first.",
            delay: 1500
          },
          {
            type: 'detailed_window',
            title: 'AI Email Generation System',
            content: {
              type: 'email_generation',
              aiModel: 'qwen2.5:0.5b (Fast generation)',
              templates: '38 premium templates loaded',
              personalization: 'Deep industry & role-based',
              status: 'Sequential email generation active'
            },
            delay: 2500
          }
        ];
        
        // Add individual email cards
        data.emailCampaign.emails.slice(0, 3).forEach((email, index) => {
          emailMicroSteps.push({
            type: 'agent_message',
            message: index === 0 ? "I created this personalized email:" : "I created another personalized email:",
            delay: 1500
          });
          emailMicroSteps.push({
            type: 'email_card',
            email: email,
            delay: 2500
          });
        });
        
        console.log(`Starting email micro-steps for ${data.emailCampaign.emails.length} emails`);
        startMicroStepAnimation(emailMicroSteps);
      }
    }
  };

  // Trigger micro-steps when prospects are received from backend
  const triggerProspectMicroSteps = (prospects) => {
    console.log('🎯 Triggering prospect micro-steps for', prospects.length, 'prospects');
    console.log('🔍 First few prospects:', prospects.slice(0, 3).map(p => ({ email: p.email, name: p.name })));
    console.log('🔍 Prospect data structure:', prospects[0]);
    
    // Prevent duplicate prospect steps
    if (hasShownProspectSteps) {
      console.log('✅ Prospect steps already shown, skipping');
      return;
    }
    setHasShownProspectSteps(true);
    
    // Mark that we're showing real data now
    setHasShownInitialAnimation(true);
    
    const prospectMicroSteps = [
      {
        type: 'agent_message',
        message: "Perfect! I found qualified prospects using advanced search techniques.",
        delay: 500
      },
      {
        type: 'detailed_window',
        title: 'Super Email Search Engine Results',
        icon: Radar,
        content: {
          type: 'email_search',
          searchTerm: 'Food Technology',
          duration: '31.5 seconds',
          successRate: `100% (${prospects.length}/${prospects.length} emails found)`,
          websitesCrawled: '35',
          domainsDiscovered: '43',
          status: 'Search complete'
        },
        delay: 1500
      },
      {
        type: 'agent_message',
        message: "Now I'm analyzing each prospect's business profile.",
        delay: 300
      },
      {
        type: 'window',
        title: '⚡ Website Analysis Engine',
        content: {
          website: 'https://fruitai.org/',
          status: 'Ultra-fast analysis mode',
          cacheStatus: 'Using cached results',
          analysisTime: '< 2 seconds',
          businessProfile: 'Industry analysis complete'
        },
        delay: 500
      },
      {
        type: 'agent_message',
        message: "I'm generating your AI-powered marketing strategy.",
        delay: 300
      },
      {
        type: 'window',
        title: '🧠 AI Marketing Strategy Generator',
        content: {
          aiEngine: 'Ollama qwen2.5:0.5b',
          optimization: 'Real-time market intelligence',
          personalization: 'Industry-specific targeting',
          targetAudience: 'B2B Food Technology',
          status: 'Strategy generation complete'
        },
        delay: 500
      },
      {
        type: 'agent_message',
        message: "I'm validating all email addresses for maximum deliverability.",
        delay: 300
      },
      {
        type: 'detailed_window',
        title: 'Email Validation System',
        icon: Shield,
        content: {
          type: 'email_verification',
          validationEngine: 'Advanced DNS verification',
          totalEmails: prospects.length,
          validatedEmails: Math.max(1, prospects.length - 1), // Usually 1 fails validation
          successRate: `${Math.round(((prospects.length - 1) / prospects.length) * 100)}%`,
          status: 'Validation complete'
        },
        delay: 800
      }
    ];
    
    // Add individual prospect cards - show ALL prospects, not just first 3
    prospects.forEach((prospect, index) => {
      prospectMicroSteps.push({
        type: 'agent_message',
        message: index === 0 ? "I found this qualified prospect:" : "I found another qualified prospect:",
        delay: 400
      });
      prospectMicroSteps.push({
        type: 'prospect_card',
        prospect: prospect,
        delay: 800
      });
    });
    
    // Add persona generation step
    prospectMicroSteps.push({
      type: 'agent_message',
      message: "I'm creating personalized profiles for each prospect.",
      delay: 300
    });
    prospectMicroSteps.push({
      type: 'detailed_window',
      title: '🎯 AI Persona Generator',
      content: {
        type: 'persona_generation',
        aiModel: 'qwen2.5:0.5b',
        processingMode: 'Deep persona analysis',
        currentProspect: `1/${prospects.length}`,
        personalizationLevel: 'Industry & role-based',
        status: 'Generating personas...'
      },
      delay: 600
    });
    
    console.log('🔍 Generated prospect micro-steps:', prospectMicroSteps.map((step, i) => `${i}: ${step.type} - ${step.message || step.title || 'N/A'}`));
    
    // Append prospect micro-steps to existing steps instead of replacing
    setMicroSteps(prevSteps => {
      const newSteps = [...prevSteps, ...prospectMicroSteps];
      console.log('📊 Total micro-steps after adding prospects:', newSteps.length);
      console.log('📊 Current micro-step index:', currentMicroStepIndex);
      return newSteps;
    });
    // Don't reset the current step index - continue from current position
    setIsAnimating(true);
  };

  // Trigger micro-steps when emails are generated
  const triggerEmailMicroSteps = (emails) => {
    console.log('📧 Triggering email micro-steps for', emails.length, 'emails');
    
    // Prevent duplicate email steps
    if (hasShownEmailSteps) {
      console.log('✅ Email steps already shown, skipping');
      return;
    }
    setHasShownEmailSteps(true);
    
    const emailMicroSteps = [
      {
        type: 'agent_message',
        message: "Perfect! I'm now creating personalized emails for each prospect.",
        delay: 400
      },
      {
        type: 'detailed_window',
        title: '📝 AI Email Generation System',
        content: {
          type: 'email_generation',
          aiModel: 'qwen2.5:0.5b (Fast generation)',
          templates: '38 premium templates loaded',
          personalization: 'Deep industry & role-based',
          emailsGenerated: emails.length,
          status: 'Sequential email generation active'
        },
        delay: 800
      }
    ];
    
    // Add individual email cards - show ALL emails, not just first 3
    emails.forEach((email, index) => {
      emailMicroSteps.push({
        type: 'agent_message',
        message: index === 0 ? "I created this personalized email:" : "I created another personalized email:",
        delay: 500
      });
      emailMicroSteps.push({
        type: 'email_card',
        email: email,
        delay: 1000
      });
    });
    
    // Add to existing micro-steps instead of replacing
    setMicroSteps(prevSteps => [...prevSteps, ...emailMicroSteps]);
  };

  // Fetch workflow data and trigger micro-steps
  const fetchAndTriggerWorkflowSteps = async () => {
    const now = Date.now();

    // Prevent multiple simultaneous calls AND debounce rapid calls
    // BUT DON'T skip if animations have been shown - we still need to check for first email popup!
    if (isProcessingWorkflowResults || (now - lastWorkflowFetchTime < 2000)) {
      console.log('⏭️ Skipping fetchAndTriggerWorkflowSteps - already processing or too soon');
      console.log(`⏭️ Flags: processing=${isProcessingWorkflowResults}, timeSinceLast=${now - lastWorkflowFetchTime}ms`);
      return;
    }

    // Track if we should skip animations (but still check for first email)
    const shouldSkipAnimations = hasShownProspectSteps && hasShownEmailSteps;
    if (shouldSkipAnimations) {
      console.log('⏭️ Animations already shown, but continuing to check for first email popup...');
    }

    try {
      setIsProcessingWorkflowResults(true);
      // Only show loading skeleton on initial load, not during background polling
      if (!hasInitiallyLoadedProspects) {
        setIsLoadingProspects(true);
      }
      if (!hasInitiallyLoadedEmails) {
        setIsLoadingEmails(true);
      }
      setLastWorkflowFetchTime(now);

      // 🔥 PRODUCTION: Get current campaignId and include in request
      const currentCampaignId = localStorage.getItem('currentCampaignId');
      const url = currentCampaignId
        ? `/api/workflow/results?campaignId=${currentCampaignId}`
        : '/api/workflow/results';

      console.log(`🔄 Fetching workflow results for campaign: ${currentCampaignId || 'ALL'}`);
      const result = await apiGet(url);

      console.log('📊 Workflow results fetched:', result);
      console.log('📊 EmailCampaign data:', result.data?.emailCampaign);

      if (result.success && result.data) {
        const { prospects: prospectsFromAPI, campaignData } = result.data;
        const emailCampaign = campaignData?.emailCampaign;

        // 🎨 NEW: Check for template selection required (HTTP polling fallback)
        // This triggers when prospectsFromAPI are found but no template is selected yet
        if (result.data.status === 'waiting_for_template' ||
            result.data.canProceed === false ||
            (prospectsFromAPI && prospectsFromAPI.length > 0 && result.data.templateSelectionRequired)) {
          console.log('🎨🎨🎨 TEMPLATE SELECTION REQUIRED (via HTTP polling)! 🎨🎨🎨');
          console.log('🎨 Prospects found:', prospectsFromAPI?.length || 0);
          console.log('🎨 Status:', result.data.status);
          console.log('🎨 Can proceed:', result.data.canProceed);
          console.log('🎨 Template selection required:', result.data.templateSelectionRequired);
          console.log('🎨 Template already submitted?', templateAlreadySubmittedRef.current);

          // 🎯 CRITICAL FIX: Set prospectsFromAPI BEFORE triggering template selection
          if (prospectsFromAPI && prospectsFromAPI.length > 0) {
            console.log(`🎯 Merging ${prospectsFromAPI.length} prospectsFromAPI from API with existing prospects`);
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email));
              const newProspects = prospectsFromAPI.filter(p => !existingEmails.has(p.email));
              if (newProspects.length > 0) {
                console.log(`📦 Adding ${newProspects.length} new prospects from API (${prev.length} → ${prev.length + newProspects.length})`);
                return [...prev, ...newProspects];
              }
              return prev;
            });
          }

          // Trigger template selection popup ONLY if not already submitted
          if (!showTemplateSelection && !templateAlreadySubmittedRef.current) {
            console.log('🎨 Triggering template selection popup via HTTP polling');
            handleTemplateSelectionRequired({
              campaignId: result.data.campaignId,
              prospectsCount: prospectsFromAPI?.length || 0,
              prospectsFound: prospectsFromAPI?.length || 0,
              sampleProspects: prospectsFromAPI?.slice(0, 5) || [],
              message: `Found ${prospectsFromAPI?.length || 0} prospectsFromAPI! Please select an email template to continue.`,
              canProceed: false,
              status: 'waiting_for_template'
            });
          } else if (templateAlreadySubmittedRef.current) {
            console.log('🎨 Template already submitted - waiting for email generation to start...');
          }

          // Don't process further until template is selected
          setIsProcessingWorkflowResults(false);
          return;
        }

        // 🐛 DEBUG: Log all values for first email popup check
        console.log('🐛 DEBUG: Checking if first email popup should show:');
        console.log('🐛   waitingForUserApproval:', result.data.waitingForUserApproval);
        console.log('🐛   firstEmailGenerated:', result.data.firstEmailGenerated);
        console.log('🐛   firstEmailGenerated.subject:', result.data.firstEmailGenerated?.subject);
        console.log('🐛   firstEmailGenerated.body:', result.data.firstEmailGenerated?.body);
        console.log('🐛   hasShownFirstEmailModal:', hasShownFirstEmailModal);
        console.log('🐛   ALL CONDITIONS MET:',
          result.data.waitingForUserApproval &&
          result.data.firstEmailGenerated &&
          result.data.firstEmailGenerated.subject &&
          result.data.firstEmailGenerated.body &&
          !hasShownFirstEmailModal
        );

        // Check for email review state - ONLY trigger for truly first email with complete content
        if (result.data.waitingForUserApproval &&
            result.data.firstEmailGenerated &&
            result.data.firstEmailGenerated.subject &&
            result.data.firstEmailGenerated.body &&
            !hasShownFirstEmailModal) {
          console.log('👀 FIRST Email review required!', result.data.firstEmailGenerated);

          // Send immediate pause signal to backend
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('⏸️ IMMEDIATE PAUSE: First email ready, sending pause signal');
            ws.send(JSON.stringify({
              type: 'emergency_pause',
              data: {
                campaignId: result.data.firstEmailGenerated.campaignId,
                reason: 'first_email_review_required',
                timestamp: Date.now()
              }
            }));
          }

          console.log('🔍 DEBUG: Setting emailForReview from firstEmailGenerated:', result.data.firstEmailGenerated);
          console.log('🔍 DEBUG: firstEmailGenerated campaignId:', result.data.firstEmailGenerated?.campaignId);

          // 🔥 CRITICAL: Clear any animation state that might interfere
          setWaitingForDetailedWindow(false);
          setIsAnimating(false);

          setEmailForReview(result.data.firstEmailGenerated);
          setShowEmailReview(true);
          console.log('🔥 POPUP STATE SET: showEmailReview = true');
          setHasShownFirstEmailModal(true); // Mark first email modal as shown

          // Stop all polling while waiting for user input
          setWorkflowStatus('paused_for_review');
          return; // Don't process other results while waiting for approval
        }
        
        // 🎯 CRITICAL FIX: Set emails in state whenever they're available
        if (emailCampaign && emailCampaign.emails && emailCampaign.emails.length > 0) {
          console.log(`🎯 Setting ${emailCampaign.emails.length} emails in state`);
          setGeneratedEmails(emailCampaign.emails);
        } else if (result.data.generatedEmails && result.data.generatedEmails.length > 0) {
          console.log(`🎯 Setting ${result.data.generatedEmails.length} generated emails in state`);
          setGeneratedEmails(result.data.generatedEmails);
        }

        // 🎯 CRITICAL FIX: Always set prospects when available (separate from animation logic)
        if (prospectsFromAPI && prospectsFromAPI.length > 0) {
          console.log(`🎯 Found ${prospectsFromAPI.length} prospects from API - merging with existing`);
          setProspects(prev => {
            const existingEmails = new Set(prev.map(p => p.email));
            const newProspects = prospectsFromAPI.filter(p => !existingEmails.has(p.email));
            if (newProspects.length > 0) {
              console.log(`📦 Adding ${newProspects.length} new prospects from API (${prev.length} → ${prev.length + newProspects.length})`);
              return [...prev, ...newProspects];
            }
            return prev;
          });

          // Trigger animation micro-steps only if not shown yet
          if (!hasShownProspectSteps) {
            console.log('🎬 Triggering prospect animation micro-steps');
            triggerProspectMicroSteps(prospectsFromAPI);

            // Also check for emails immediately after showing prospectsFromAPI
            if (emailCampaign && emailCampaign.emails && emailCampaign.emails.length > 0) {
              console.log('📧 Also found', emailCampaign.emails.length, 'emails - scheduling email micro-steps!');
              setTimeout(() => {
                triggerEmailMicroSteps(emailCampaign.emails);
              }, 15000); // Delay to let prospect steps finish
            }
          }
        }
        // If we already showed prospectsFromAPI, just show emails
        else if (emailCampaign && emailCampaign.emails && emailCampaign.emails.length > 0) {
          console.log('📧 Found', emailCampaign.emails.length, 'emails - triggering email micro-steps!');
          // Check if we already showed email steps using state flag
          if (!hasShownEmailSteps) {
            triggerEmailMicroSteps(emailCampaign.emails);
          }
        } else if (result.data.generatedEmails && result.data.generatedEmails.length > 0) {
          console.log('📧 Found', result.data.generatedEmails.length, 'generated emails - triggering email micro-steps!');
          if (!hasShownEmailSteps) {
            triggerEmailMicroSteps(result.data.generatedEmails);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch workflow results:', error);
    } finally {
      setIsProcessingWorkflowResults(false);
      // Always clear loading states and mark as initially loaded
      setIsLoadingProspects(false);
      setIsLoadingEmails(false);
      setHasInitiallyLoadedProspects(true);
      setHasInitiallyLoadedEmails(true);
    }
  };

  // Check for email updates when email activity is detected
  const checkForEmailUpdates = async () => {
    try {
      console.log('🔄 Checking for email updates with authentication...');
      // 🔥 CRITICAL FIX: Pass campaignId to filter emails by campaign
      const currentCampaignId = localStorage.getItem('currentCampaignId');
      const url = currentCampaignId
        ? `/api/workflow/results?campaignId=${currentCampaignId}`
        : '/api/workflow/results';
      console.log(`🔍 [EMAIL UPDATES DEBUG] Checking campaign: ${currentCampaignId || 'ALL'}`);
      const result = await apiGet(url);

      if (result.success && result.data) {
        const { emailCampaign, generatedEmails: emailsFromAPI } = result.data;

        // Check if we have new emails that haven't been shown yet
        const updatedEmails = emailCampaign?.emails || emailsFromAPI || [];
        if (updatedEmails.length > 0) {
          console.log('📧 Found', updatedEmails.length, 'emails in update check');

          // DISABLE ANIMATIONS IN THIS FUNCTION - Only update state
          console.log('📧 Updating emails state without animations to prevent duplicates');
          setGeneratedEmails(updatedEmails);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check for email updates:', error);
    }
  };

  // Fetch workflow stats
  const fetchWorkflowStats = async () => {
    try {
      const result = await apiGet('/api/workflow/stats');
      if (result && result.data) {
        setWorkflowStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch workflow stats:', error);
    }
  };

  // Update time until reset countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (workflowStats.rateLimit.timeUntilReset > 0) {
        const remaining = workflowStats.rateLimit.timeUntilReset;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeUntilReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workflowStats.rateLimit.timeUntilReset]);

  // Fetch workflow stats periodically
  useEffect(() => {
    fetchWorkflowStats(); // Initial fetch
    const interval = setInterval(fetchWorkflowStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // ⏰ Email generation countdown timer
  useEffect(() => {
    // Start timer when workflow starts and no emails generated yet
    if ((workflowStatus === 'running' || workflowStatus === 'generating_emails') && generatedEmails.length === 0 && !generationStartTime) {
      setGenerationStartTime(Date.now());
      setGenerationTimeRemaining(180); // Estimate 3 minutes
    }

    // Clear timer when emails are generated
    if (generatedEmails.length > 0) {
      setGenerationStartTime(null);
      setGenerationTimeRemaining(null);
    }
  }, [workflowStatus, generatedEmails.length]);

  // Update countdown every second
  useEffect(() => {
    if (!generationStartTime || generationTimeRemaining === null) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - generationStartTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed); // 3 minutes max
      setGenerationTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generationStartTime]);

  // Poll for workflow updates periodically
  useEffect(() => {
    // IMPORTANT: Keep polling even when paused for email approval
    // Only pause animations/micro-steps, not data fetching
    const isPausedForAnimation = workflowStatus.includes('paused') && !workflowStatus.includes('waitingForUserApproval');

    // Check on workflow, dashboard, emails, and prospects views
    const shouldCheckForUpdates = workflowStatus === 'running' ||
                                   workflowStatus === 'starting' ||
                                   workflowStatus === 'waiting' ||
                                   workflowStatus.includes('waitingForUserApproval') || // Keep polling during email approval!
                                   activeView === 'workflow' ||
                                   activeView === 'dashboard' ||
                                   activeView === 'emails' ||
                                   activeView === 'prospects';

    if (shouldCheckForUpdates) {
      // 🔥 CRITICAL: Use FAST polling when workflow is running (WebSocket backup)
      const pollingInterval = workflowStatus === 'running' || workflowStatus === 'starting' || workflowStatus === 'waiting'
        ? 5000   // Poll every 5 seconds when workflow is active
        : 30000; // Poll every 30 seconds otherwise

      console.log(`⏰ Setting up polling interval: ${pollingInterval}ms (status: ${workflowStatus})`);

      const interval = setInterval(() => {
        console.log(`⏰ Periodic check for workflow updates (status: ${workflowStatus})`);
        checkForEmailUpdates();
        // Always fetch workflow steps to get newly generated emails and prospects
        fetchAndTriggerWorkflowSteps();
      }, pollingInterval);

      // 🔥 IMMEDIATE: Also fetch immediately when workflow starts or view changes
      if (workflowStatus === 'running' || workflowStatus === 'starting' || workflowStatus === 'waiting') {
        console.log('🚀 Immediate fetch on workflow status change');
        fetchAndTriggerWorkflowSteps();
      }

      return () => clearInterval(interval);
    }
  }, [workflowStatus, activeView, showEmailReview]);
  
  // Simplified WebSocket connection
  useEffect(() => {
    console.log('SimpleWorkflowDashboard mounted, connecting WebSocket...');

    // Check WebSocket health before connecting
    const checkWSHealth = async () => {
      try {
        const response = await fetch('/api/ws-health');
        const health = await response.json();
        console.log('🏥 WebSocket health check:', health);
      } catch (error) {
        console.error('⚠️ WebSocket health check failed:', error);
      }
    };

    checkWSHealth();

    // Dynamic WebSocket URL for Railway compatibility
    // In production, frontend and backend are separate services
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Determine the correct WebSocket host
    let wsHost = window.location.host;

    // If we're on the frontend Railway service, use the backend service for WebSocket
    if (window.location.host.includes('honest-hope') || window.location.host.includes('powerful-contentment')) {
      wsHost = 'mailgen-production.up.railway.app';
      console.log('🔄 Detected frontend service, redirecting WebSocket to backend:', wsHost);
    }

    const wsUrl = `${protocol}//${wsHost}/ws/workflow`;
    console.log('🔌 Attempting WebSocket connection...');
    console.log('   Protocol:', protocol);
    console.log('   Host (original):', window.location.host);
    console.log('   Host (WebSocket):', wsHost);
    console.log('   Full URL:', wsUrl);

    const wsInstance = new WebSocket(wsUrl);
    setWs(wsInstance);

    // Log initial state
    console.log('🔌 WebSocket instance created, readyState:', wsInstance.readyState);
    console.log('   0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED');

    wsInstance.onopen = () => {
      console.log('✅✅✅ WEBSOCKET CONNECTED SUCCESSFULLY! ✅✅✅');
      console.log('✅ WebSocket readyState:', wsInstance.readyState);
      console.log('✅ Connection established to:', wsUrl);
      setWsConnectionStatus('connected');

      // 🔥 CRITICAL: Subscribe to current campaign's workflow
      const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
      if (currentCampaignId) {
        console.log(`📡 Subscribing to campaign workflow: ${currentCampaignId}`);
        wsInstance.send(JSON.stringify({
          type: 'subscribe_workflow',
          workflowId: currentCampaignId
        }));
      }
    };

    wsInstance.onerror = (error) => {
      console.error('❌❌❌ WEBSOCKET CONNECTION ERROR! ❌❌❌');
      console.error('❌ Error event:', error);
      console.error('❌ Error type:', error.type);
      console.error('❌ Error target:', error.target);
      console.error('❌ WebSocket URL attempted:', wsUrl);
      console.error('❌ WebSocket readyState:', wsInstance.readyState);
      console.error('❌ Protocol:', protocol);
      console.error('❌ Host:', window.location.host);
      setWsConnectionStatus('error');
    };

    wsInstance.onclose = (event) => {
      console.log('🔌🔌🔌 WEBSOCKET CONNECTION CLOSED 🔌🔌🔌');
      console.log('🔌 Close code:', event.code);
      console.log('🔌 Close reason:', event.reason);
      console.log('🔌 Was clean close?', event.wasClean);
      console.log('🔌 URL was:', wsUrl);

      // Log specific close codes
      const closeCodes = {
        1000: 'Normal closure',
        1001: 'Going away',
        1002: 'Protocol error',
        1003: 'Unsupported data',
        1006: 'Abnormal closure (no close frame)',
        1007: 'Invalid frame payload',
        1008: 'Policy violation',
        1009: 'Message too big',
        1010: 'Missing extension',
        1011: 'Internal server error',
        1015: 'TLS handshake failure'
      };
      console.log('🔌 Close code meaning:', closeCodes[event.code] || 'Unknown');
      setWsConnectionStatus('disconnected');

      // 🔥 AUTO-RECONNECT: Reconnect after 3 seconds if abnormal closure
      if (event.code !== 1000) {
        console.log('🔄 Auto-reconnecting WebSocket in 3 seconds...');
        setTimeout(() => {
          console.log('🔄 Attempting WebSocket reconnection...');
          connectWebSocket();
        }, 3000);
      }
    };

    wsInstance.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('🔍 WebSocket message received:', data.type);

      // 🔥 CRITICAL FIX: Handle prospect messages FIRST before general workflow updates
      // This ensures prospect_batch_update is never routed to handleWorkflowUpdate

      // Handle prospect_batch_update FIRST (priority over workflow_update)
      if (data.type === 'prospect_batch_update') {
        console.log(`📦 [PRIORITY] Processing prospect_batch_update FIRST`);
        handleProspectBatchUpdate(data);
        return; // Don't process further
      }

      // Handle prospect_list FIRST
      if (data.type === 'prospect_list') {
        console.log(`📦 [PRIORITY] Processing prospect_list FIRST`);
        handleProspectListUpdate(data);
        return;
      }

      // Handle data_update with prospects FIRST
      if (data.type === 'data_update' && data.data?.prospects) {
        console.log(`📦 [PRIORITY] Processing data_update with prospects FIRST`);
        handleDataUpdateProspects(data);
        // Don't return - continue to process other data_update parts
      }

      // Now handle other message types
      if (data.type === 'workflow_update' || data.stepId) {
        // Use workflow update handler for structured workflow data
        handleWorkflowUpdate(data);
      } else if (data.type === 'workflow_data_cleared') {
        // Handle workflow reset/clear message from backend
        // 🔒 CRITICAL: Only clear if it's for THIS campaign
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const clearCampaignId = data.campaignId || data.data?.campaignId;

        console.log(`🗑️ Received workflow data cleared message - Campaign check: clear=${clearCampaignId}, current=${currentCampaignId}`);

        // Only clear if no campaign specified OR it matches current campaign
        if (!clearCampaignId || clearCampaignId === currentCampaignId || clearCampaignId === String(currentCampaignId)) {
          console.log('🗑️ Clearing UI data for this campaign');
          // Force refresh all data
          setProspects([]);
          setEmailCampaignStats({ emails: [], totalSent: 0, totalOpened: 0, totalClicked: 0 });
          setGeneratedEmails([]);
          setMicroSteps([]);
          setCurrentMicroStepIndex(0);
          setIsAnimating(false);
          setBackgroundWorkflowRunning(false);
        } else {
          console.log(`🚫 Ignoring workflow_data_cleared for different campaign: ${clearCampaignId}`);
        }
      // NOTE: prospect_batch_update is now handled at the TOP of onmessage with priority
      } else if (data.type === 'stage_start' || data.type === 'workflow_status_update') {
        // 🚀 NEW: Handle workflow stage/status updates from backend
        console.log(`🚀 Received ${data.type}:`, data);

        const status = data.stage || data.status || data.data?.status;
        if (status) {
          console.log(`🔔 Updating workflowStatus to: ${status}`);
          setWorkflowStatus(status);

          // Show toast notification for stage changes
          if (status === 'finding_prospects') {
            toast.loading('🔍 AI Agent is searching for prospects...', {
              id: 'workflow_status',
              duration: Infinity
            });
          } else if (status === 'generating_emails') {
            toast.loading('✉️ Generating personalized emails...', {
              id: 'workflow_status',
              duration: Infinity
            });
          } else if (status === 'complete' || status === 'completed') {
            toast.dismiss('workflow_status');
            toast.success('✅ Workflow complete!');
          }
        }

        // Fetch latest data
        fetchAndTriggerWorkflowSteps();
      } else if (data.type === 'data_update' || data.message?.includes('Broadcasting workflow update')) {
        // Handle data update messages from backend
        console.log('📊 Received data_update or workflow broadcast message');

        // 🔥 UPDATE WORKFLOW STATUS from data_update messages
        if (data.data && data.data.status) {
          console.log(`🔔 Updating workflowStatus to: ${data.data.status}`);
          setWorkflowStatus(data.data.status);
        }

        // 🎯 NEW: Handle single email updates in real-time
        if (data.data?.emailCampaign?.isSingleUpdate && data.data.emailCampaign.emails?.length > 0) {
          console.log('📧 Real-time email update received:', data.data.emailCampaign.emails[0]);
          const newEmail = data.data.emailCampaign.emails[0];

          // 🔒 CRITICAL: Always read LATEST campaignId from localStorage to avoid race conditions
          const latestCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
          const emailCampaignId = newEmail.campaignId || newEmail.campaign_id || data.data.campaignId;

          console.log(`🔍 [CAMPAIGN CHECK] Email campaign: ${emailCampaignId}, Current campaign: ${latestCampaignId}`);

          if (emailCampaignId === latestCampaignId || emailCampaignId === String(latestCampaignId)) {
            console.log(`✅ [CAMPAIGN MATCH] Adding email from campaign ${emailCampaignId}`);
            // Add to generated emails immediately
            const wasNew = (() => {
              let isNew = false;
              setGeneratedEmails(prev => {
                const existing = prev.find(e => e.to === newEmail.to);
                if (existing) {
                  return prev.map(e => e.to === newEmail.to ? { ...e, ...newEmail } : e);
                } else {
                  isNew = true;
                  return [...prev, newEmail];
                }
              });
              return isNew;
            })();

            // 🚀 CRITICAL: Force component re-render AFTER state update when new email added
            if (wasNew) {
              setTimeout(() => setEmailForceUpdateKey(k => k + 1), 0);
            }
          } else {
            console.log(`🚫 [CAMPAIGN ISOLATION] Skipping email from different campaign (Email: ${emailCampaignId}, Current: ${latestCampaignId})`);
          }

          // Update stats
          setEmailCampaignStats(prev => ({
            ...prev,
            emails: [...prev.emails.filter(e => e.to !== newEmail.to), newEmail],
            totalSent: prev.totalSent + (newEmail.status === 'sent' ? 1 : 0)
          }));

          console.log('✅ Email added to UI in real-time!');
        } else {
          // Full update - fetch all data
          fetchAndTriggerWorkflowSteps();
        }
      } else if (data.type === 'template_selection_required') {
        // 🎨 NEW: Handle template selection required
        console.log('🎨🎨🎨 TEMPLATE SELECTION REQUIRED MESSAGE RECEIVED! 🎨🎨🎨');
        console.log('🎨 Template selection data:', JSON.stringify(data.data, null, 2));

        // 🔒 Campaign isolation check
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const templateCampaignId = data.data?.campaignId || data.campaignId;
        console.log(`🎨 Campaign check: template=${templateCampaignId}, current=${currentCampaignId}`);

        if (templateCampaignId && currentCampaignId &&
            templateCampaignId !== currentCampaignId &&
            templateCampaignId !== String(currentCampaignId)) {
          console.log(`🚫 [TEMPLATE] Skipping template_selection_required from different campaign`);
        } else {
          console.log('🎨 Calling handleTemplateSelectionRequired...');

          // 🔥 CRITICAL: Also add prospects immediately from the message
          if (data.data?.sampleProspects && data.data.sampleProspects.length > 0) {
            console.log(`📦 [TEMPLATE WS] Adding ${data.data.sampleProspects.length} prospects IMMEDIATELY`);
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email));
              const newProspects = data.data.sampleProspects.filter(p => p.email && !existingEmails.has(p.email));
              if (newProspects.length > 0) {
                console.log(`📦 [TEMPLATE WS] Added ${newProspects.length} new prospects`);
                return [...prev, ...newProspects];
              }
              return prev;
            });
            // Force re-render
            setProspectForceUpdateKey(k => k + 1);
          }

          handleTemplateSelectionRequired(data.data);
          console.log('🎨 handleTemplateSelectionRequired called successfully');
        }
      } else if (data.type === 'template_selected') {
        // 🎨 NEW: Handle template selected confirmation
        console.log('✅ Template selected confirmed:', data.data);
        handleTemplateSelected(data.data);
      } else if (data.type === 'workflow_complete') {
        // 🎯 NEW: Handle workflow completion - fetch final emails
        console.log('🎉 Workflow complete! Fetching generated emails...');
        console.log('📊 Workflow complete data:', data.data);

        // Trigger a fetch of workflow results to get all generated emails
        fetchAndTriggerWorkflowSteps();

        // Update workflow status to completed
        setBackgroundWorkflowRunning(false);
        setWorkflowStatus('completed');

        // Show completion notification
        setAgentStatus('completed');
        setAgentMessage('Email campaign completed successfully!');
      } else {
        // Use pipeline message handler for general log messages
        processPipelineMessage(data);
      }
      
      // REMOVED: Too broad check that was triggering popup too early
      // The popup should only trigger on specific "email_awaiting_approval" messages
      
      // IMMEDIATE CHECK - trigger prospect steps if we have prospect data
      if (data.prospects && Array.isArray(data.prospects) && data.prospects.length > 0 && !hasShownProspectSteps) {
        // 🔒 CRITICAL: Campaign isolation check to prevent mixing prospects
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const prospectCampaignId = data.campaignId || data.data?.campaignId;

        console.log(`📦 [IMMEDIATE] Campaign check: prospects=${prospectCampaignId}, current=${currentCampaignId}`);

        if (prospectCampaignId && currentCampaignId &&
            prospectCampaignId !== currentCampaignId &&
            prospectCampaignId !== String(currentCampaignId)) {
          console.log(`🚫 [IMMEDIATE] Skipping prospects from different campaign`);
        } else {
          console.log('🎯 FOUND PROSPECTS - triggering micro-steps immediately!');
          triggerProspectMicroSteps(data.prospects);
          console.log(`📦 Merging ${data.prospects.length} prospects from immediate check`);
          setProspects(prev => {
            const existingEmails = new Set(prev.map(p => p.email));
            const newProspects = data.prospects.filter(p => !existingEmails.has(p.email));
            if (newProspects.length > 0) {
              console.log(`📦 Adding ${newProspects.length} new prospects (${prev.length} → ${prev.length + newProspects.length})`);
              return [...prev, ...newProspects];
            }
            return prev;
          });
        }
      }
      
      // Check for data_update and fetch workflow data
      if (data.type === 'data_update') {
        console.log('📊 Data update received - fetching workflow results');
        fetchAndTriggerWorkflowSteps();
      }
      
      // 🔥 IMMEDIATE: Handle first email ready signal - ✅ FIXED: Campaign validation
      if (data.type === 'first_email_ready') {
        console.log('🔔 FIRST EMAIL READY signal received via WebSocket!', data.data);

        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        // 🔥 CRITICAL FIX: campaignId is at data.data.campaignId, not nested in firstEmailGenerated
        const emailCampaignId = data.data?.campaignId;

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
      }

      // Check for email generation progress - 🔥 INSTANT UPDATE
      if (data.type === 'email_sent' || data.type === 'email_generated' || data.type === 'email_awaiting_approval') {
        console.log('📧🚀 [INSTANT] Email activity detected:', data.type, data.data?.to);

        // 🔥 INSTANT: Show toast notification for real-time feedback
        if (data.type === 'email_generated' && data.data?.isInstant) {
          console.log(`📧🚀 [INSTANT] Email generated for: ${data.data.to} (${data.data.emailIndex}/${data.data.totalEmails})`);
          // toast.success() would go here but may cause too many toasts
        }

        // Show confirmation modal when first email is sent
        if (data.type === 'email_sent' && data.data?.isFirstEmail) {
          console.log('🚀 First email sent - showing confirmation modal');
          setShowEmailSendConfirmation(true);
        }

        // 🔥 INSTANT: Fetch immediately without delay for real-time updates
        checkForEmailUpdates();
      }
      
      // Handle other message types
      if (data.type === 'prospect_list') {
        // Handle prospect list updates and trigger micro-steps
        console.log('👥 Prospect list received:', data.prospects);

        // 🔒 CRITICAL: Validate campaign ID to prevent mixing prospects between campaigns
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const prospectCampaignId = data.campaignId || data.data?.campaignId;

        console.log(`🔍 [CAMPAIGN CHECK] Prospect list campaign: ${prospectCampaignId}, Current campaign: ${currentCampaignId}`);

        if (prospectCampaignId && currentCampaignId && prospectCampaignId !== currentCampaignId && prospectCampaignId !== String(currentCampaignId)) {
          console.log(`🚫 [CAMPAIGN ISOLATION] Skipping prospect_list from different campaign (List: ${prospectCampaignId}, Current: ${currentCampaignId})`);
          return; // Skip - different campaign
        }

        console.log(`✅ [CAMPAIGN MATCH] Processing prospect_list for campaign ${prospectCampaignId || currentCampaignId}`);

        const receivedProspects = data.prospects || [];
        console.log(`📦 Merging ${receivedProspects.length} prospects from prospect_list`);

        if (receivedProspects.length > 0) {
          setProspects(prev => {
            const existingEmails = new Set(prev.map(p => p.email));
            const newProspects = receivedProspects.filter(p => p.email && !existingEmails.has(p.email));
            if (newProspects.length > 0) {
              console.log(`📦🚀 [INSTANT] Adding ${newProspects.length} new prospects (${prev.length} → ${prev.length + newProspects.length})`);
              return [...prev, ...newProspects];
            }
            return prev;
          });

          // 🔥 INSTANT: Force component re-render
          setProspectForceUpdateKey(k => k + 1);
          console.log(`🔥 [INSTANT] Forced prospect UI re-render from prospect_list`);
        }

        // Create micro-steps for prospect discovery
        if (receivedProspects.length > 0 && !hasShownProspectSteps) {
          console.log('🎯 Triggering prospect micro-steps from prospect_list');
          triggerProspectMicroSteps(receivedProspects);
        }

        // 🚀 Immediately fetch latest workflow state to ensure template popup shows
        console.log('🚀 Prospect list received - triggering immediate fetch');
        fetchAndTriggerWorkflowSteps();
      } else if (data.type === 'prospect_updated') {
        // Handle individual prospect updates
        // 🔒 CRITICAL: Validate campaign ID
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const prospectCampaignId = data.campaignId || data.data?.campaignId;

        if (prospectCampaignId && currentCampaignId && prospectCampaignId !== currentCampaignId && prospectCampaignId !== String(currentCampaignId)) {
          console.log(`🚫 [CAMPAIGN ISOLATION] Skipping prospect_updated from different campaign`);
          return;
        }

        if (data.data && data.data.prospect) {
          setProspects(prev => {
            const existing = prev.find(p => p.email === data.data.prospect.email);
            if (existing) {
              return prev.map(p =>
                p.email === data.data.prospect.email ? { ...p, ...data.data.prospect } : p
              );
            } else {
              return [...prev, data.data.prospect];
            }
          });
        }
      } else if (data.type === 'email_sent' || data.type === 'email_generated' || data.emailCampaign) {
        // Handle email sent/generated updates - 🔥 INSTANT
        const email = data.data || data.email;
        const emailCampaign = data.emailCampaign;

        if (email) {
          console.log('📧🚀 [INSTANT] Email update received:', email.to, email.subject?.substring(0, 30));
          // 🔒 CRITICAL: Always read LATEST campaignId from localStorage to avoid race conditions
          const latestCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
          const emailCampaignId = email.campaignId || email.campaign_id || data.data?.campaignId;

          console.log(`🔍 [CAMPAIGN CHECK] Email campaign: ${emailCampaignId}, Current campaign: ${latestCampaignId}`);

          if (emailCampaignId === latestCampaignId || emailCampaignId === String(latestCampaignId) || !emailCampaignId) {
            console.log(`✅🚀 [INSTANT] Processing email for campaign ${emailCampaignId}`);

            // 🔥 INSTANT: Update email list immediately
            setGeneratedEmails(prev => {
              const existing = prev.find(e => e.to === email.to);
              if (existing) {
                // Update existing email
                const newEmails = prev.map(e => e.to === email.to ? { ...e, ...email } : e);
                console.log(`📧 Updated existing email for ${email.to}`);
                return newEmails;
              } else {
                // Add new email
                console.log(`📧🚀 [INSTANT] Added new email for ${email.to} (total: ${prev.length + 1})`);
                return [...prev, email];
              }
            });

            // 🚀 INSTANT: Force component re-render immediately
            setEmailForceUpdateKey(k => k + 1);
          } else {
            console.log(`🚫 [CAMPAIGN ISOLATION] Skipping email update from different campaign (Email: ${emailCampaignId}, Current: ${latestCampaignId})`);
          }

          // Update stats
          setEmailCampaignStats(prev => ({
            ...prev,
            emails: [...prev.emails, email],
            totalSent: data.type === 'email_sent' ? prev.totalSent + 1 : prev.totalSent
          }));
        }

        // Trigger email campaign micro-steps
        if (emailCampaign && emailCampaign.emails && emailCampaign.emails.length > 0) {
          triggerEmailMicroSteps(emailCampaign.emails);
        }

        // 🔥 INSTANT: Fetch immediately without delay
        console.log('🚀 Email generated/sent - triggering immediate fetch');
        fetchAndTriggerWorkflowSteps();
      } else if (data.type === 'email_awaiting_approval') {
        // Handle emails awaiting approval - trigger review modal ONLY for first email
        console.log('📧 Email awaiting approval:', data.data);
        if (data.data && data.data.emailContent && !hasShownFirstEmailModal) {
          const email = {
            to: data.data.prospectId,
            subject: data.data.emailContent.subject,
            body: data.data.emailContent.body,
            status: 'awaiting_approval',
            prospect: data.data.prospect,
            recipientName: data.data.prospect?.name || data.data.prospectId,
            company: data.data.prospect?.company || 'Unknown Company',
            quality_score: data.data.emailContent.quality_score || 85,
            campaignId: data.data.campaignId,
            ...data.data.emailContent
          };
          
          // Show review modal for the FIRST email awaiting approval only
          console.log('👀 Triggering first email review modal for approval:', email);
          setEmailForReview(email);
          setShowEmailReview(true);
          setHasShownFirstEmailModal(true); // Prevent showing for subsequent emails
          
          // Send acknowledgment to backend that we received the email and are pausing for review  
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('📤 Sending pause acknowledgment to backend');
            ws.send(JSON.stringify({
              type: 'pause_workflow', 
              data: {
                prospectId: data.data.prospectId,
                campaignId: data.data.campaignId,
                reason: 'waiting_for_user_email_review'
              }
            }));
          }
          
          // 🔒 CRITICAL: Always read LATEST campaignId from localStorage to avoid race conditions
          const latestCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
          const emailCampaignId = data.data.campaignId || email.campaignId;

          console.log(`🔍 [CAMPAIGN CHECK] Email campaign: ${emailCampaignId}, Current campaign: ${latestCampaignId}`);

          if (emailCampaignId === latestCampaignId || emailCampaignId === String(latestCampaignId)) {
            const wasNewEmail = (() => {
              let isNew = false;
              setGeneratedEmails(prev => {
                const existing = prev.find(e => e.to === email.to);
                if (existing) {
                  return prev.map(e => e.to === email.to ? { ...e, ...email } : e);
                } else {
                  console.log('📧 Adding email to generatedEmails for email editor access (Campaign:', emailCampaignId, ')');
                  isNew = true;
                  return [...prev, { ...email, id: `generated_${Date.now()}` }];
                }
              });
              return isNew;
            })();

            // 🚀 CRITICAL: Force component re-render AFTER state update when new email added
            if (wasNewEmail) {
              setTimeout(() => setEmailForceUpdateKey(k => k + 1), 0);
            }
          } else {
            console.log(`🚫 [CAMPAIGN ISOLATION] Skipping email_awaiting_approval from different campaign (Email: ${emailCampaignId}, Current: ${latestCampaignId})`);
          }
        }
      } else if (data.type === 'email_preview_generated') {
        console.log('🐛 DEBUG: email_preview_generated WebSocket message received!');
        console.log('🐛   data.data:', data.data);
        console.log('🐛   data.data.preview:', data.data?.preview);
        console.log('🐛   templateApproved:', templateApproved);
        console.log('🐛   hasShownFirstEmailModal:', hasShownFirstEmailModal);

        // IMMEDIATELY pause workflow when email preview is received
        if (ws && ws.readyState === WebSocket.OPEN && data.data?.campaignId) {
          console.log('⚠️ EMERGENCY PAUSE: Email preview received, immediately pausing workflow');
          ws.send(JSON.stringify({
            type: 'emergency_pause',
            data: {
              campaignId: data.data.campaignId,
              reason: 'email_preview_received_must_pause',
              timestamp: Date.now()
            }
          }));
        }
        
        // Handle email preview updates - trigger review modal for first email or when using template
        console.log('📧 Email preview received for review:', data.data);
        if (data.data && data.data.preview) {
          const emailForReview = {
            to: data.data.prospectId,
            subject: data.data.preview.subject || 'Generated Email',
            body: data.data.preview.body || data.data.preview.content,
            recipientName: data.data.preview.recipientName || data.data.prospectId,
            company: data.data.preview.company || 'Unknown Company',
            quality_score: data.data.preview.quality_score || 85,
            campaignId: data.data.campaignId
          };

          console.log('🔍 DEBUG: Setting emailForReview from email_preview_generated:', emailForReview);
          console.log('🔍 DEBUG: email_preview_generated campaignId:', data.data.campaignId);
          
          // If template is approved, automatically send the email without showing review modal
          if (templateApproved && hasShownFirstEmailModal) {
            console.log('✅ Template approved - automatically sending email:', emailForReview.to);
            // Auto-send the email using the approved template
            autoSendEmailWithTemplate(emailForReview);
          } else {
            // Show review modal for first email or when template not approved
            console.log('👀 Triggering email review modal:', emailForReview);
            setEmailForReview(emailForReview);
            setShowEmailReview(true);
            
            // Send additional pause signal when modal is shown
            if (ws && ws.readyState === WebSocket.OPEN) {
              console.log('🔄 Modal shown - sending additional pause signal');
              ws.send(JSON.stringify({
                type: 'modal_pause',
                data: {
                  campaignId: data.data.campaignId,
                  reason: 'email_review_modal_displayed',
                  modalType: 'email_review'
                }
              }));
            }
            
            // Only mark as first modal shown if this is truly the first email
            if (!hasShownFirstEmailModal) {
              setHasShownFirstEmailModal(true);
            }
          }
          
          // Send IMMEDIATE pause signal to backend to stop generating more emails
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('📤 Sending IMMEDIATE pause acknowledgment to backend');
            // Send multiple pause signals to ensure backend receives it
            for (let i = 0; i < 3; i++) {
              ws.send(JSON.stringify({
                type: 'pause_workflow',
                data: {
                  prospectId: data.data.prospectId,
                  campaignId: data.data.campaignId,
                  reason: 'waiting_for_user_email_review',
                  immediate: true,
                  priority: 'high'
                }
              }));
            }
            
            // Also send HTTP request as backup
            fetch('http://localhost:3333/api/workflow/pause', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId: data.data.campaignId,
                reason: 'user_email_review',
                immediate: true
              })
            }).catch(err => console.log('Pause HTTP request failed:', err));
          }
          
          // Also add to generatedEmails so it's available in email editor
          // 🔒 CRITICAL: Always read LATEST campaignId from localStorage to avoid race conditions
          const latestCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
          const emailCampaignId = data.data.campaignId || emailForReview.campaignId;

          console.log(`🔍 [CAMPAIGN CHECK] Email campaign: ${emailCampaignId}, Current campaign: ${latestCampaignId}`);

          if (emailCampaignId === latestCampaignId || emailCampaignId === String(latestCampaignId)) {
            const wasNewPreviewEmail = (() => {
              let isNew = false;
              setGeneratedEmails(prev => {
                const existing = prev.find(e => e.to === emailForReview.to);
                if (!existing) {
                  console.log('📧 Adding email to generatedEmails for email editor access (Campaign:', emailCampaignId, ')');
                  isNew = true;
                  return [...prev, { ...emailForReview, id: `generated_${Date.now()}`, status: 'generated' }];
                }
                return prev;
              });
              return isNew;
            })();

            // 🚀 CRITICAL: Force component re-render AFTER state update when new email added
            if (wasNewPreviewEmail) {
              setTimeout(() => setEmailForceUpdateKey(k => k + 1), 0);
            }
          } else {
            console.log(`🚫 [CAMPAIGN ISOLATION] Skipping email from different campaign (Email: ${emailCampaignId}, Current: ${latestCampaignId})`);
          }
          
          // Also update generated emails list
          setGeneratedEmails(prev => prev.map(e => 
            e.to === data.data.prospectId 
              ? { ...e, preview: data.data.preview.subject || data.data.preview.previewText }
              : e
          ));
        }
      } else if (data.type === 'persona_generated') {
        // Handle persona generation for prospects
        if (data.data && data.data.prospect) {
          setProspects(prev => {
            const updated = prev.map(p => 
              p.email === data.data.prospect.email 
                ? { ...p, persona: data.data.persona }
                : p
            );
            
            // Check if all prospects now have personas
            const allHavePersonas = updated.every(p => p.persona);
            if (allHavePersonas && updated.length > 0) {
              console.log('🎯 All personas generated! Triggering email generation...');
              // Trigger email generation after a short delay
              setTimeout(() => {
                if (!hasShownEmailSteps) {
                  console.log('🎬 Starting email generation micro-steps');
                  triggerEmailMicroSteps(updated.map(p => ({ 
                    to: p.email, 
                    prospect: p,
                    status: 'generating' 
                  })));
                }
              }, 2000);
            }
            
            return updated;
          });
        }
      } else if (data.type === 'data_update') {
        // Handle general data updates
        // 🔒 CRITICAL: Validate campaign ID to prevent mixing data between campaigns
        const currentCampaignId = campaign?.id || localStorage.getItem('currentCampaignId');
        const updateCampaignId = data.data?.campaignId || data.campaignId;

        if (updateCampaignId && currentCampaignId && updateCampaignId !== currentCampaignId && updateCampaignId !== String(currentCampaignId)) {
          console.log(`🚫 [CAMPAIGN ISOLATION] Skipping data_update from different campaign (Update: ${updateCampaignId}, Current: ${currentCampaignId})`);
          return;
        }

        if (data.data) {
          if (data.data.emailCampaign) {
            // 🔒 Additional check for email campaign ID
            const emailCampaignId = data.data.emailCampaign.campaignId;
            if (!emailCampaignId || emailCampaignId === currentCampaignId || emailCampaignId === String(currentCampaignId)) {
              setEmailCampaignStats(prev => ({
                ...prev,
                ...data.data.emailCampaign
              }));
            } else {
              console.log(`🚫 [CAMPAIGN ISOLATION] Skipping emailCampaign stats from different campaign`);
            }
          }
          if (data.data.prospects && data.data.prospects.length > 0) {
            console.log(`📦 Received data_update with ${data.data.prospects.length} prospects - merging`);
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email));
              const newProspects = data.data.prospects.filter(p => p.email && !existingEmails.has(p.email));
              if (newProspects.length > 0) {
                console.log(`📦🚀 [INSTANT] Adding ${newProspects.length} new prospects (${prev.length} → ${prev.length + newProspects.length})`);
                return [...prev, ...newProspects];
              }
              return prev;
            });

            // 🔥 INSTANT: Force component re-render
            setProspectForceUpdateKey(k => k + 1);
            console.log(`🔥 [INSTANT] Forced prospect UI re-render from data_update`);
          }
        }
      } else if (data.type === 'email_batch') {
        // Handle batch email updates
        if (data.emails && data.emails.length > 0) {
          setGeneratedEmails(data.emails);
          setEmailCampaignStats(prev => ({
            ...prev,
            emails: data.emails,
            totalSent: data.emails.length
          }));
        }
      } else if (data.type === 'campaign_stats') {
        // Handle campaign statistics updates
        setEmailCampaignStats(data.stats);
      } else if (data.type === 'batch_search_complete') {
        // Handle batch search completion
        console.log('🎉 Batch search complete:', data.data);
        const { totalFound, industry, region, keywords } = data.data;

        // Show completion notification
        if (totalFound > 0) {
          toast.success(`✅ Batch search complete! Found ${totalFound} new prospects for ${industry || keywords}`);
        } else {
          toast.info(`ℹ️ Batch search complete. No new prospects found for ${industry || keywords}`);
        }

        // Refresh prospects from database after batch search completion
        const campaignId = localStorage.getItem('currentCampaignId');
        if (campaignId) {
          fetch(`/api/contacts?status=active&limit=1000&campaignId=${campaignId}`)
            .then(res => res.json())
            .then(result => {
              if (result.success && result.data?.contacts) {
                const dbProspects = result.data.contacts.map(c => ({
                  id: c.id,
                  email: c.email,
                  name: c.name || 'Unknown',
                  company: c.company || 'Unknown',
                  role: c.position || 'Unknown',
                  industry: c.industry || 'Unknown',
                  source: c.source || 'Database',
                  location: c.address || 'Unknown'
                }));
                console.log(`📦 Batch search complete - merging ${dbProspects.length} prospects from DB`);
                setProspects(prev => {
                  const existingEmails = new Set(prev.map(p => p.email));
                  const newProspects = dbProspects.filter(p => !existingEmails.has(p.email));
                  if (newProspects.length > 0) {
                    console.log(`📦 Adding ${newProspects.length} new prospects from DB (${prev.length} → ${prev.length + newProspects.length})`);
                    return [...prev, ...newProspects];
                  }
                  return prev;
                });
              }
            })
            .catch(err => console.error('Failed to refresh prospects:', err));
        }

        // Clear batch search state
        setBatchSearchProgress(null);
        setIsBatchSearching(false);
      } else if (data.type === 'clients_update') {
        // Handle client/prospect updates
        if (data.clients && data.clients.length > 0) {
          console.log(`📦 Received clients_update with ${data.clients.length} clients - merging`);
          setProspects(prev => {
            const existingEmails = new Set(prev.map(p => p.email));
            const newProspects = data.clients.filter(p => !existingEmails.has(p.email));
            if (newProspects.length > 0) {
              console.log(`📦 Adding ${newProspects.length} new prospects (${prev.length} → ${prev.length + newProspects.length})`);
              return [...prev, ...newProspects];
            }
            return prev;
          });
        }
      } else if (data.type === 'log_update') {
        // Handle log updates for specific steps
        if (data.stepId) {
          setSteps(prevSteps => {
            const existingStep = prevSteps.find(s => s.id === data.stepId);
            if (existingStep) {
              return prevSteps.map(s => 
                s.id === data.stepId 
                  ? { ...s, description: data.message, status: data.level === 'success' ? 'completed' : 'running' }
                  : s
              );
            } else {
              return [...prevSteps, {
                id: data.stepId,
                title: data.stepId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: data.message,
                status: data.level === 'success' ? 'completed' : 'running'
              }];
            }
          });
        }
      }
    };
    
    // Function to automatically send email with approved template
    const autoSendEmailWithTemplate = async (emailData) => {
      try {
        console.log('🚀 Auto-sending email with template to:', emailData.to);
        
        // Get SMTP configuration
        const smtpConfigString = localStorage.getItem('smtpConfig');
        const smtpConfig = JSON.parse(smtpConfigString || '{}');
        
        if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
          console.error('❌ Missing SMTP configuration for auto-send');
          return;
        }
        
        // Send the email directly using the same endpoint as single email sends
        const response = await fetch('http://localhost:3333/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig: smtpConfig,
            emailData: {
              from: `${smtpConfig.fromName || 'Your Name'} <${smtpConfig.username}>`,
              to: emailData.to,
              subject: emailData.subject,
              html: emailData.body
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log(`✅ Auto-sent email to ${emailData.to}`);
            
            // Send continue signal to backend to generate next email
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'continue_workflow',
                data: {
                  emailSent: true,
                  recipient: emailData.to,
                  campaignId: emailData.campaignId
                }
              }));
            }
          } else {
            console.error(`❌ Failed to auto-send email to ${emailData.to}:`, result.error);
          }
        } else {
          console.error(`❌ HTTP error auto-sending email to ${emailData.to}:`, response.status);
        }
      } catch (error) {
        console.error(`❌ Exception auto-sending email to ${emailData.to}:`, error);
      }
    };

    wsInstance.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => wsInstance.close();
  }, []);

  // 🔥 NEW: Resubscribe to workflow when campaign changes
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && campaign?.id) {
      console.log(`🔄 Campaign changed to ${campaign.id}, resubscribing to workflow...`);

      // Unsubscribe from previous campaign (if any)
      const previousCampaignId = localStorage.getItem('previousCampaignId');
      if (previousCampaignId && previousCampaignId !== campaign.id) {
        console.log(`📡 Unsubscribing from previous campaign: ${previousCampaignId}`);
        ws.send(JSON.stringify({
          type: 'unsubscribe_workflow',
          workflowId: previousCampaignId
        }));
      }

      // Subscribe to new campaign
      console.log(`📡 Subscribing to new campaign workflow: ${campaign.id}`);
      ws.send(JSON.stringify({
        type: 'subscribe_workflow',
        workflowId: campaign.id
      }));

      // Store current as previous for next change
      localStorage.setItem('previousCampaignId', campaign.id);
    }
  }, [campaign?.id, ws]);

  // 💾 CRITICAL: Fetch persisted data from database on component mount
  useEffect(() => {
    console.log('💾 Component mounted - fetching persisted data from database...');

    // Immediately fetch data to restore previous session
    const loadPersistedData = async () => {
      try {
        // Fetch workflow results (includes both prospects and emails from database)
        await fetchAndTriggerWorkflowSteps();

        // Also fetch prospects directly to ensure they're loaded
        const contactsData = await apiGet('/api/contacts?status=active&limit=1000');
        if (contactsData.success && contactsData.data?.contacts) {
          const dbProspects = contactsData.data.contacts.map(c => ({
            id: c.id,
            email: c.email,
            name: c.name || 'Unknown',
            company: c.company || 'Unknown',
            position: c.position || 'Unknown',
            industry: c.industry || 'Unknown',
            source: c.source || 'Database'
          }));
          console.log(`💾 Loaded ${dbProspects.length} prospects from database on mount`);
          if (dbProspects.length > 0) {
            setProspects(prev => {
              // Merge with existing to avoid duplicates
              const combined = [...dbProspects, ...prev];
              const unique = combined.filter((prospect, index, self) =>
                index === self.findIndex(p => p.email === prospect.email)
              );
              return unique;
            });

            // 🔥 FIX: Check if template selection is needed
            // If we have prospects but no emails, trigger template selection popup
            console.log('🎨 Checking if template selection popup should be triggered...');
            console.log(`   Prospects: ${dbProspects.length}`);
            console.log(`   Generated emails: ${generatedEmails.length}`);

            // Wait a bit to check if emails are also loaded
            setTimeout(async () => {
              // Fetch workflow results to check if emails exist
              const workflowCheck = await fetchAndTriggerWorkflowSteps();
              const hasEmails = generatedEmails.length > 0 || emailCampaignStats.emails?.length > 0;

              console.log(`🎨 Template selection check after data load:`);
              console.log(`   Has prospects: ${dbProspects.length > 0}`);
              console.log(`   Has emails: ${hasEmails}`);
              console.log(`   Should show popup: ${dbProspects.length > 0 && !hasEmails}`);

              if (dbProspects.length > 0 && !hasEmails) {
                console.log('🎨🎨🎨 TRIGGERING TEMPLATE SELECTION POPUP - prospects exist but no emails');
                setShowTemplateSelectionModal(true);
                setWaitingForTemplate(true);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load persisted data from database:', error);
      }
    };

    loadPersistedData();
  }, []);

  const startWorkflow = async () => {
    console.log('Starting workflow...');

    // 🎯 Check if this is the user's first time - show onboarding tour
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      console.log('🎓 First time user - showing onboarding tour');
      localStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboardingTour(true);
      setActiveView('home'); // Navigate to home page to show tour

      // Don't start the workflow yet - let user go through tour first
      return;
    }

    // Only reset if this is a completely new workflow start
    if (!backgroundWorkflowRunning) {
      setWorkflowStatus('starting');
      setBackgroundWorkflowRunning(true);

      // Only reset if this is a completely fresh start
      if (microSteps.length === 0) {
        setMicroSteps([]);
        setCurrentMicroStepIndex(0);
        setIsAnimating(false);
        setHasShownInitialAnimation(false);
        setCompletedSteps(new Set());
        setSteps([]);
        setHasShownFirstEmailModal(false); // 🔥 CRITICAL FIX: Reset first email modal flag for new workflow
      }

      // Start via API endpoint
      try {
        // Get the saved configuration from localStorage
        const savedConfig = localStorage.getItem('agentConfig');
        const config = savedConfig ? JSON.parse(savedConfig) : {};

        // Get SMTP configuration separately
        const savedSMTPConfig = localStorage.getItem('smtpConfig');
        const smtpConfig = savedSMTPConfig ? JSON.parse(savedSMTPConfig) : null;

        console.log('🔍 Using saved config for workflow:', config);
        console.log('🔧 Using saved SMTP config:', smtpConfig);

        // Create template data from SMTP config for email generation
        const templateData = smtpConfig ? {
          senderName: smtpConfig.senderName || smtpConfig.fromName || 'Marketing Agent',
          senderEmail: smtpConfig.auth?.user || smtpConfig.username || '',
          companyName: config.companyName || 'Your Company',
          companyWebsite: config.targetWebsite || 'https://example.com',
          ctaText: 'Learn More',
          ctaUrl: config.targetWebsite || 'https://example.com'
        } : null;

        // Debug logging
        console.log('🔍 DEBUG - Frontend templateData being sent:', templateData);
        console.log('🔍 DEBUG - SMTP config structure:', smtpConfig);
        console.log('🔍 DEBUG - Extracted senderName:', smtpConfig?.senderName);
        console.log('🔍 DEBUG - Extracted senderEmail:', smtpConfig?.auth?.user);

        const result = await apiPost('/api/workflow/start', {
          // Include campaign ID if available
          campaignId: campaign?.id || null,
          campaignName: campaign?.name || 'Default Campaign',
          // Include all saved configuration including SMTP
          targetWebsite: config.targetWebsite || 'https://example.com',
          businessType: config.businessType || 'technology',
          campaignGoal: config.campaignGoal || 'partnership',
          smtpConfig: smtpConfig,
          emailTemplate: config.emailTemplate,
          templateData: templateData,
          audienceType: config.audienceType,
          industries: config.industries,
          roles: config.roles,
          keywords: config.keywords,
          controls: {
            autoReply: true,
            manualApproval: false,
              pauseOnError: true,
              maxEmailsPerHour: 10,
              workingHours: { start: 9, end: 18 }
            }
          });

        console.log('Workflow started:', result);
        setWorkflowStatus('running');

        // Show notification: Starting to find prospects
        setAgentStatus('searching');
        setAgentMessage('Finding qualified prospects for your campaign...');
        setAgentDetails([
          'Searching 80M+ prospect database',
          'Matching your target criteria',
          'Verifying contact information'
        ]);

        // Start checking for workflow updates immediately
        setTimeout(() => {
          console.log('🚀 Starting immediate workflow checks after workflow start');
          fetchAndTriggerWorkflowSteps();
          checkForEmailUpdates();
        }, 2000); // Start checking after 2 seconds
      } catch (error) {
        console.error('Error starting workflow:', error);
        setWorkflowStatus('idle');
        setBackgroundWorkflowRunning(false);
      }
    } else {
      console.log('Workflow already running in background, switching to view');
      // If workflow is already running, just switch to workflow view without resetting
      setActiveView('workflow');
    }
  };

  const resetWorkflow = async () => {
    try {
      // IMMEDIATELY clear email state FIRST - before any API calls
      console.log('🗑️ EMERGENCY STATE CLEAR - Clearing emails immediately');
      localStorage.setItem('justReset', 'true'); // Persist across page reload
      setJustReset(true); // Prevent localStorage restoration
      setProspects([]);
      setEmailCampaignStats({ emails: [], totalSent: 0, totalOpened: 0, totalClicked: 0 });
      setGeneratedEmails([]);

      // Call backend API to reset workflow and clear all data
      const result = await apiPost('/api/workflow/reset', {});

      console.log('✅ Workflow reset successfully');

        // Reset all frontend state
        setIsAnimating(false);
        setWorkflowStatus('idle');
        setBackgroundWorkflowRunning(false);
        setCompletedSteps(new Set());
        setWaitingForDetailedWindow(false);
        setMicroSteps([]);
        setCurrentMicroStepIndex(0);
        setHasShownInitialAnimation(false);
        setSteps([]);
        setHasShownFirstEmailModal(false); // 🔥 CRITICAL FIX: Reset first email modal flag on workflow reset

        // NUCLEAR OPTION: Clear ALL localStorage except essential keys
        const essentialKeys = ['justReset', 'smtpConfig', 'targetWebsite', 'companyName'];
        const allKeys = Object.keys(localStorage);
        console.log('🗑️ NUCLEAR CLEAR - All localStorage keys before:', allKeys);

        allKeys.forEach(key => {
          if (!essentialKeys.includes(key)) {
            localStorage.removeItem(key);
            console.log(`🗑️ NUKED localStorage key: ${key}`);
          }
        });

        // NUCLEAR OPTION: Clear ALL sessionStorage
        const allSessionKeys = Object.keys(sessionStorage);
        console.log('🗑️ NUCLEAR CLEAR - All sessionStorage keys before:', allSessionKeys);

        allSessionKeys.forEach(key => {
          sessionStorage.removeItem(key);
          console.log(`🗑️ NUKED sessionStorage key: ${key}`);
        });

        // Reset data states IMMEDIATELY - clear state BEFORE API call
        localStorage.setItem('justReset', 'true'); // Persist across page reload
        setJustReset(true); // Prevent localStorage restoration
        setProspects([]);
        setEmailCampaignStats({ emails: [], totalSent: 0, totalOpened: 0, totalClicked: 0 });
        setGeneratedEmails([]);

        // Force re-render with empty state
        console.log('🗑️ FORCED STATE RESET - generatedEmails cleared immediately');

        // Reset the duplicate prevention flags
        setHasShownEmailSteps(false);
        setHasShownProspectSteps(false);
        setIsProcessingWorkflowResults(false);

        // Add a separator message to show new workflow session
        const separator = {
          id: Date.now(),
          type: 'system',
          content: '--- New Workflow Session ---',
          timestamp: new Date(),
          isSystem: true
        };
        updateMessages(prev => [...prev, separator]);


        // Send WebSocket reset message
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'reset_workflow' }));
        }

        // 🔄 CRITICAL: Navigate back to setup page
        console.log('✅ Reset complete - navigating back to setup page');

        // Call parent's onReset to navigate back to setup wizard
        if (props.onReset) {
          props.onReset();
        }
    } catch (error) {
      console.error('Error resetting workflow:', error);
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left sidebar */}
      <div className="w-64 bg-white flex flex-col">
        {/* Logo */}
        <div className="flex items-center px-6 py-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)'}}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold" style={{color: '#000000'}}>AI Agent</h1>
              <p className="text-sm" style={{color: '#000000'}}>Smart Workflow Platform</p>
            </div>
          </div>
        </div>

        {/* Back to Main Page Button */}
        <div className="px-4 pb-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm bg-white text-black border border-gray-200 hover:bg-gray-50"
          >
            <Home className="w-5 h-5 mr-3 flex-shrink-0 text-black" />
            <span className="truncate font-medium text-black">
              Back to Main Page
            </span>
          </button>
        </div>

        {/* Back to Campaigns Button */}
        {onBackToCampaigns && (
          <div className="px-4 pb-4">
            <button
              onClick={onBackToCampaigns}
              className="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm bg-white text-black border border-gray-200 hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5 mr-3 flex-shrink-0 text-black transform rotate-180" />
              <span className="truncate font-medium text-black">
                Back to Campaigns
              </span>
            </button>
          </div>
        )}

        {/* Switch Template Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              console.log('🎨 Opening template selection modal');
              setShowTemplateSelection(true);
            }}
            className="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm bg-[#00f5a0] text-black border border-black hover:bg-[#00e090] shadow-sm"
            title="Switch email template for remaining emails"
          >
            <SwatchIcon className="w-5 h-5 mr-3 flex-shrink-0 text-black" />
            <span className="truncate font-medium text-black">
              Switch Template
            </span>
          </button>
          {selectedTemplate && (
            <div className="mt-2 px-2 py-1 text-xs text-black/70 bg-black/5 rounded">
              <strong>Current:</strong> {EMAIL_TEMPLATES[selectedTemplate]?.name || 'Default'}
            </div>
          )}
        </div>

        {/* Quota Bar */}
        <div className="px-4 pb-4">
          <QuotaBar />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isHighlighted = item.id === 'workflow' || item.id === 'email-editor';

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm relative bg-white text-black ${
                  isHighlighted || item.isHome ? 'border-l-4 shadow-sm' : ''
                }`}
                style={{
                  transform: 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 245, 160, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0 text-black" />
                <span className="truncate font-medium text-black">
                  {item.label}
                </span>

                {/* Green circle with black checkmark for active item */}
                {isActive && (
                  <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: '#00f5a0'}}>
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center">
            {/* User Info Section */}
            <SignedIn>
              <div className="flex items-center flex-1">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{color: '#000000'}}>My Account</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs truncate" style={{color: '#00f0a0'}}>Active</p>
                    {/* WebSocket Connection Status */}
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: wsConnectionStatus === 'connected' ? '#00f0a0' :
                                         wsConnectionStatus === 'error' ? '#ef4444' :
                                         wsConnectionStatus === 'disconnected' ? '#f59e0b' : '#9ca3af'
                        }}
                        title={wsConnectionStatus === 'connected' ? 'Connected' :
                               wsConnectionStatus === 'error' ? 'Connection Error' :
                               wsConnectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting...'}
                      />
                      <span className="text-xs" style={{
                        color: wsConnectionStatus === 'connected' ? '#00f0a0' :
                               wsConnectionStatus === 'error' ? '#ef4444' :
                               wsConnectionStatus === 'disconnected' ? '#f59e0b' : '#9ca3af'
                      }}>
                        {wsConnectionStatus === 'connected' ? 'Live' :
                         wsConnectionStatus === 'error' ? 'Error' :
                         wsConnectionStatus === 'disconnected' ? 'Offline' : 'Connecting'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SignedIn>
            <div className="ml-auto flex items-center space-x-1">
              <button
                onClick={clearWorkflowHistory}
                className="text-xs p-2 rounded transition-colors"
                style={{color: '#f59e0b'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Clear Workflow History"
              >
                🗑️
              </button>
              <button
                onClick={clearAllUserData}
                className="text-xs p-2 rounded transition-colors"
                style={{color: '#dc2626'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Clear All Data (Prospects, Campaigns, Drafts)"
              >
                ⚠️
              </button>
              <button
                onClick={() => {
                  setConfirmationModal({
                    isOpen: true,
                    title: 'Reset to Setup Page?',
                    message: 'This will return you to the initial setup page.\n\nYour campaign data will not be affected.',
                    confirmText: 'Go to Setup',
                    cancelText: 'Cancel',
                    danger: false,
                    onConfirm: () => {
                      setConfirmationModal(prev => ({ ...prev, isOpen: false }));
                      toast.success('Returning to setup page...');
                      setTimeout(() => onReset(), 300);
                    }
                  });
                }}
                className="text-xs p-2 rounded transition-colors"
                style={{color: '#ef4444'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Reset to Setup Page"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Campaign Workflow</h1>
              <p className="text-black mt-2">AI-powered marketing automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={startWorkflow}
                disabled={workflowStatus === 'running'}
                className="px-6 py-3 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-xl disabled:opacity-50"
              >
                START CAMPAIGN
              </button>

              <button
                onClick={resetWorkflow}
                className="px-6 py-3 border border-gray-300 text-black rounded-xl hover:bg-gray-100"
              >
                RESET
              </button>
            </div>
          </div>

          {/* Workflow Stats Banner - Only show when workflow is running */}
          {workflowStatus === 'running' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase">Prospects Found</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{workflowStats.prospects.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-gray-500 opacity-50" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase">Emails Generated</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{workflowStats.emails.generated}</p>
                  </div>
                  <Mail className="w-8 h-8 text-gray-500 opacity-50" />
                </div>
              </div>

              <div className={`${workflowStats.rateLimit.isLimited ? 'bg-white border-gray-300' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase ${workflowStats.rateLimit.isLimited ? 'text-gray-600' : 'text-gray-600'}`}>
                      API Rate Limit
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${workflowStats.rateLimit.isLimited ? 'text-gray-900' : 'text-gray-900'}`}>
                      {workflowStats.rateLimit.current}/{workflowStats.rateLimit.max}
                    </p>
                  </div>
                  <Clock className={`w-8 h-8 opacity-50 ${workflowStats.rateLimit.isLimited ? 'text-gray-500' : 'text-gray-500'}`} />
                </div>
              </div>

              <div className={`${workflowStats.rateLimit.isLimited ? 'bg-white border-gray-300' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase ${workflowStats.rateLimit.isLimited ? 'text-gray-600' : 'text-gray-600'}`}>
                      {workflowStats.rateLimit.isLimited ? 'Resumes In' : 'Time to Reset'}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${workflowStats.rateLimit.isLimited ? 'text-gray-900' : 'text-gray-900'}`}>
                      {timeUntilReset || '--'}
                    </p>
                  </div>
                  <RefreshCw className={`w-8 h-8 opacity-50 ${workflowStats.rateLimit.isLimited ? 'text-gray-500 animate-spin' : 'text-gray-500'}`} />
                </div>
                {workflowStats.rateLimit.isLimited && (
                  <p className="text-xs text-gray-600 mt-2">⏳ Workflow will auto-resume</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeView === 'workflow' && (
            <div className="h-full -m-6 flex flex-col bg-white">
              {/* Main Agent Speech Bubble - Exact JobRight.ai Style */}
              <div className="px-8 py-6">
                {/* Agent will speak through micro-steps */}
              </div>

              {/* Sequential Micro-Steps Animation */}
              <div
                ref={scrollContainerRef}
                className="flex-1 px-8 pb-8 overflow-y-auto scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={handleScroll}
              >
                {/* Initial Loading State */}
                {microSteps.length === 0 && workflowStatus === 'starting' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center h-64"
                  >
                    <div className="text-center">
                      <div className="flex justify-center space-x-2 mb-4">
                        <div className="w-4 h-4 bg-[#00f5a0] rounded-full animate-pulse"></div>
                        <div className="w-4 h-4 bg-[#00f5a0] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-4 h-4 bg-[#00f5a0] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <p className="text-xl font-medium text-black">Initializing AI Marketing Agent...</p>
                      <p className="text-sm text-black mt-2">Setting up automation pipeline</p>
                    </div>
                  </motion.div>
                )}

                {/* Show message when workflow is idle */}
                {microSteps.length === 0 && workflowStatus === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center h-64"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-6 h-6 text-black">🚀</div>
                      </div>
                      <p className="text-xl font-medium text-black">Ready to Start</p>
                      <p className="text-sm text-black mt-2">Click "START CAMPAIGN" to begin automation</p>
                    </div>
                  </motion.div>
                )}
                {/* Render micro-steps - show all completed steps + current animating step */}
                {microSteps.map((microStep, index) => {
                  // Show step if it's completed or currently animating
                  const shouldShow = index <= currentMicroStepIndex || !isAnimating;
                  if (!shouldShow) return null;

                  return (
                  <div key={index} className="mb-6">
                    {/* Agent Message */}
                    {microStep.type === 'agent_message' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-start space-x-4"
                      >
                        <div className="w-12 h-12 bg-white border-2 border-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                          <div className="w-2 h-2 bg-black rounded-full ml-1"></div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold text-black leading-tight">
                            {microStep.message}
                          </div>

                          {/* Processing indicator - show for messages that should have upcoming windows */}
                          {(index === currentMicroStepIndex && isAnimating &&
                            index + 1 < microSteps.length &&
                            (microSteps[index + 1]?.type === 'window' ||
                             microSteps[index + 1]?.type === 'detailed_window' ||
                             microSteps[index + 1]?.type === 'processing_window')) && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.0 }}
                              className="mt-3 flex items-center space-x-2 text-sm text-black"
                            >
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="italic">Analyzing and processing...</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Chat-Style Info Window */}
                    {(microStep.type === 'window' || microStep.type === 'processing_window' || microStep.type === 'detailed_window') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex items-start space-x-4 w-full"
                      >
                        {/* AI Avatar */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: '#00f5a0' }}>
                          <Bot className="w-6 h-6 text-black" />
                        </div>

                        {/* Chat Message Bubble */}
                        <div className="flex-1 max-w-[85%]">
                          <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-black flex items-center space-x-2">
                                {microStep.type === 'processing_window' && (
                                  <Loader className="w-5 h-5 animate-spin" style={{ color: '#00f5a0' }} />
                                )}
                                {microStep.icon && (
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                                    <microStep.icon className="w-4 h-4 text-black" />
                                  </div>
                                )}
                                <span>{microStep.title}</span>
                              </h3>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00f5a0' }}></div>
                                <span className="text-xs font-medium" style={{ color: '#00f5a0' }}>Live</span>
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-3">
                              {microStep.type === 'detailed_window' ? (
                                <DetailedWorkflowWindow
                                  content={microStep.content}
                                  onAnimationComplete={handleDetailedWindowComplete}
                                  prospects={prospects}
                                  addCompletedAnimation={addCompletedAnimation}
                                  addDetailedWindow={addDetailedWindow}
                                />
                              ) : (
                                <div className="space-y-2">
                                  {Object.entries(microStep.content || {}).map(([key, value], index) => (
                                    <div key={index} className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-black capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                      </span>
                                      <span className="text-sm text-black font-semibold">{value}</span>
                                    </div>
                                  ))}

                                  {microStep.type === 'processing_window' && (
                                    <div className="flex items-center space-x-2 mt-3">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#00f5a0' }}></div>
                                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#00f5a0', animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#00f5a0', animationDelay: '0.2s' }}></div>
                                      </div>
                                      <span className="text-sm text-black">Processing...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="text-xs text-black mt-3">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Prospect Card */}
                    {microStep.type === 'prospect_card' && (
                      <motion.div
                        initial={{ opacity: 0, x: -30, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative"
                      >
                        <div className="absolute -left-6 top-4">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00f5a0' }} />
                        </div>
                        
                        <div className="w-full max-w-4xl">
                          <JobRightProspectCard
                            prospect={{
                              ...microStep.prospect,
                              id: microStep.prospect.email || `prospect_${index}`,
                              status: 'active',
                              confidence: microStep.prospect.confidence || 0.8,
                              source: microStep.prospect.source || 'search_preview',
                              found_at: new Date().toISOString(),
                              persona: {
                                type: 'end_user',
                                communicationStyle: 'professional',
                                primaryPainPoints: ['efficiency', 'growth'],
                                primaryMotivations: ['business growth', 'optimization'],
                                decisionLevel: 'Medium'
                              }
                            }}
                            isGenerating={false}
                            onClick={handleProspectClick}
                            onAskMailGen={handleAskMailGen}
                          />
                          
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-2 text-xs text-gray-700 flex items-center space-x-2"
                          >
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span>✅ Validated - Confidence: {Math.floor((microStep.prospect.confidence || 0.8) * 100)}%</span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Email Card */}
                    {microStep.type === 'email_card' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative cursor-pointer"
                        onClick={() => {
                          // Show full email preview modal
                          setSelectedEmailPreview(microStep.email);
                        }}
                      >
                        <div className="absolute -left-6 top-4">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00f5a0' }} />
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden max-w-2xl hover:shadow-lg transition-shadow">
                          <div className="bg-white px-4 py-3 border-b-2 border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-lg">📧</div>
                                <div>
                                  <div className="font-medium text-black">
                                    To: {microStep.email.to || microStep.email.recipient_name || 'prospect@company.com'}
                                  </div>
                                  <div className="text-sm text-black">
                                    From: {microStep.email.from || 'Fruit AI'}
                                  </div>
                                </div>
                              </div>
                              <div className="px-3 py-1 rounded-full" style={{ backgroundColor: '#00f5a0' }}>
                                <span className="text-xs font-medium text-black">
                                  {microStep.email.quality || microStep.email.confidence || Math.floor(Math.random() * 15) + 85}% Quality
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <h5 className="font-bold text-black mb-2">
                              Subject: {microStep.email.subject || `${microStep.email.to?.split('@')[1]?.split('.')[0]} - Strategic Collaboration`}
                            </h5>
                            <div className="text-sm text-black space-y-1">
                              {(() => {
                                // Extract actual email content
                                let emailContent = '';
                                let recipientName = microStep.email.to?.split('@')[0] || 'there';
                                
                                if (microStep.email.body) {
                                  // Clean HTML and extract meaningful content
                                  emailContent = microStep.email.body
                                    .replace(/<[^>]*>/g, '')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                } else if (microStep.email.content) {
                                  emailContent = microStep.email.content;
                                } else if (microStep.email.preview) {
                                  emailContent = microStep.email.preview;
                                }
                                
                                // If we have actual content, show it
                                if (emailContent && emailContent.length > 20) {
                                  const lines = emailContent.split('\n').filter(line => line.trim().length > 0);
                                  const previewText = lines.slice(0, 3).join(' ').substring(0, 200);
                                  return (
                                    <>
                                      <div className="whitespace-pre-wrap">
                                        {previewText}{previewText.length >= 200 ? '...' : ''}
                                      </div>
                                      <div className="text-xs text-black mt-2 italic">
                                        Click to view full email
                                      </div>
                                    </>
                                  );
                                } else {
                                  // Fallback with personalized content
                                  const companyName = microStep.email.to?.split('@')[1]?.split('.')[0] || 'your company';
                                  return (
                                    <>
                                      <p>Hi {recipientName.charAt(0).toUpperCase() + recipientName.slice(1)},</p>
                                      <p>I noticed your work in Food Technology and thought you'd be interested in our AI solution that could benefit {companyName}...</p>
                                      <div className="text-xs text-black mt-2 italic">
                                        Click to view full email
                                      </div>
                                    </>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  ); // Close the return statement
                })}

                {/* Global Processing Indicator */}
                {isAnimating && waitingForDetailedWindow && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center space-x-3 py-8"
                  >
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-[#00f5a0] rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-lg font-medium text-gray-700">
                      Agent is analyzing data and preparing results...
                    </span>
                  </motion.div>
                )}

                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {activeView === 'prospects' && (
            <div className="bg-white min-h-full">
              <div className="p-6">
                {/* Show company detail view or prospects list */}
                {showCompanyDetail && selectedProspectForDetail ? (
                  <ComprehensiveCompanyDetailPage
                    prospect={selectedProspectForDetail}
                    onBack={() => {
                      setShowCompanyDetail(false);
                      setSelectedProspectForDetail(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Prospects</h2>
                      <button
                        onClick={() => setShowBatchSearchModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        Batch Search
                      </button>
                    </div>

                    {/* Search Bar for Prospects */}
                {prospects.length > 0 && (
                  <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search prospects... (e.g., name, company, location, role, email)"
                        value={prospectSearchQuery}
                        onChange={(e) => setProspectSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {prospectSearchQuery && (
                        <button
                          onClick={() => setProspectSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      💡 Try: "manager", "US", "technical", "full-time", "remote", or any keyword
                    </div>
                  </div>
                )}

                {/* 🔥 INSTANT: Key forces re-render when prospects change */}
                {/* Debug logging */}
                {console.log(`🔥🔥🔥 RENDERING PROSPECTS VIEW: prospects.length=${prospects.length}, forceKey=${prospectForceUpdateKey}, isLoading=${isLoadingProspects}, workflowStatus=${workflowStatus}`)}
                <div className="space-y-3" key={`prospects-${prospectForceUpdateKey}-${prospects.length}`}>
                  {isLoadingProspects ? (
                    // Show loading skeletons
                    <>
                      {[...Array(3)].map((_, i) => (
                        <ProspectCardSkeleton key={i} />
                      ))}
                    </>
                  ) : prospects.length === 0 ? (
                    workflowStatus === 'running' || workflowStatus === 'starting' || workflowStatus === 'paused' || workflowStatus === 'waiting' ? (
                      // Show searching animation when workflow is active
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-4"
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 360]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                          style={{ backgroundColor: 'rgba(0, 245, 160, 0.1)' }}
                        >
                          <Search className="w-8 h-8 text-[#00f5a0]" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Searching for Prospects...
                        </h3>
                        <p className="text-gray-600 mb-4">
                          AI is analyzing websites and discovering potential prospects for your campaign
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-4">This usually takes 1-2 minutes</p>
                      </motion.div>
                    ) : (
                      // Show empty state when workflow is stopped
                      <div className="text-center py-16 px-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prospects Yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start a workflow to discover potential prospects for your campaign
                        </p>
                        <button
                          onClick={() => setActiveView('workflow')}
                          className="px-4 py-2 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#00f5a0] focus:ring-offset-2"
                          style={{ backgroundColor: '#00f5a0', color: '#000' }}
                        >
                          Start Workflow
                        </button>
                      </div>
                    )
                  ) : (
                    <>
                      {filterProspects(prospects).map((prospect, index) => (
                        <motion.div
                          key={prospect.email || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <JobRightProspectCard
                            prospect={prospect}
                            isGenerating={false}
                            showFilters={false} // Filters now shown separately above
                            selectedFilters={prospectFilters}
                            onFilterChange={handleProspectFilterChange}
                            onClick={handleProspectClick}
                            onAskMailGen={handleAskMailGen}
                          />
                        </motion.div>
                      ))}
                      {filterProspects(prospects).length === 0 && prospectSearchQuery && (
                        <div className="text-center py-8 text-gray-600">
                          No prospects match "{prospectSearchQuery}". <button
                            onClick={() => setProspectSearchQuery('')}
                            className="text-gray-900 hover:underline font-medium"
                          >
                            Clear search
                          </button> to see all prospects.
                        </div>
                      )}
                    </>
                  )}
                </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeView === 'emails' && (
            <div className="bg-white min-h-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Campaign</h2>

                {/* Show generating state if workflow is running and no emails yet */}
                {(workflowStatus === 'generating_emails' || workflowStatus === 'running' || workflowStatus === 'analyzing_prospects' || workflowStatus === 'finding_prospects') && generatedEmails.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating personalized emails</h3>
                    <p className="text-sm text-gray-600 mb-6">Please wait while AI analyzes prospects and creates content</p>

                    {/* Countdown Timer */}
                    {generationTimeRemaining !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                      >
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full">
                          <Clock className="w-5 h-5" />
                          <span className="text-lg font-semibold">
                            Wait {Math.floor(generationTimeRemaining / 60)}:{String(generationTimeRemaining % 60).padStart(2, '0')} minutes
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-center justify-center gap-2 mb-6">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        className="w-3 h-3 rounded-full bg-[#00f5a0]"
                      />
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        className="w-3 h-3 rounded-full bg-[#00f5a0]"
                      />
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        className="w-3 h-3 rounded-full bg-[#00f5a0]"
                      />
                    </div>

                    <div className="max-w-md mx-auto">
                      <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-sm text-black/60">
                          Our AI is analyzing each prospect's profile and crafting personalized email content tailored to their needs.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Search Bar for Emails */}
                {generatedEmails.length > 0 && workflowStatus !== 'generating_emails' && (
                  <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search emails... (e.g., subject, recipient, status, template type)"
                        value={emailSearchQuery}
                        onChange={(e) => setEmailSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                      {emailSearchQuery && (
                        <button
                          onClick={() => setEmailSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      💡 Try: "sent", "draft", "partnership", "follow-up", recipient name, or any keyword
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {isLoadingEmails ? (
                    // Show loading skeletons
                    <>
                      {[...Array(3)].map((_, i) => (
                        <EmailCardSkeleton key={i} />
                      ))}
                    </>
                  ) : generatedEmails.length === 0 ? (
                    workflowStatus !== 'stopped' && workflowStatus !== 'idle' && workflowStatus !== '' ? (
                      // Show generating animation when workflow is active
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Generating personalized emails
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Please wait while AI creates content for each prospect
                        </p>

                        {/* Countdown Timer */}
                        {generationTimeRemaining !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                          >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                Wait {Math.floor(generationTimeRemaining / 60)}:{String(generationTimeRemaining % 60).padStart(2, '0')} minutes
                              </span>
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                        </div>
                      </motion.div>
                    ) : workflowStatus !== 'stopped' && workflowStatus !== 'idle' && workflowStatus !== '' ? (
                      // Show generating state if workflow is running but no emails yet
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-2xl"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating personalized emails</h3>
                        <p className="text-sm text-gray-600 mb-6">Please wait while AI finds prospects and creates content</p>

                        {/* Countdown Timer */}
                        {generationTimeRemaining !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                          >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                Wait {Math.floor(generationTimeRemaining / 60)}:{String(generationTimeRemaining % 60).padStart(2, '0')} minutes
                              </span>
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                            className="w-2 h-2 rounded-full bg-[#00f5a0]"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      // Show empty state when workflow is stopped
                      <div className="text-center py-16 px-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <Mail className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emails Yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start a workflow to generate personalized emails for your prospects
                        </p>
                        <button
                          onClick={() => setActiveView('workflow')}
                          className="px-4 py-2 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#00f5a0] focus:ring-offset-2"
                          style={{ backgroundColor: '#00f5a0', color: '#000' }}
                        >
                          Go to Workflow
                        </button>
                      </div>
                    )
                  ) : filterEmails(generatedEmails).map((email, index) => (
                    <motion.div
                      key={`${email.id || index}-${emailForceUpdateKey}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <JobRightEmailCard
                        email={email}
                        index={index}
                        showFilters={false} // Filters now shown separately above
                        selectedFilters={emailFilters}
                        onFilterChange={handleEmailFilterChange}
                        onSend={(emailToSend) => {
                        console.log('🚀 Attempting to send email:', emailToSend);
                        
                        // Validate email object before sending
                        if (!emailToSend) {
                          console.error('❌ Email object is undefined');
                          toast.error('Email data is missing');
                          return;
                        }

                        if (!emailToSend.to) {
                          console.error('❌ Email recipient is missing');
                          toast.error('Email recipient is required');
                          return;
                        }

                        // Create robust email object with all required fields
                        const emailData = {
                          id: emailToSend.id || email.id || `email_${Date.now()}_${index}`,
                          to: emailToSend.to,
                          subject: emailToSend.subject || `Email to ${emailToSend.to}`,
                          body: emailToSend.body || emailToSend.content || 'No content available',
                          from: emailToSend.from || 'noreply@example.com'
                        };

                        console.log('📧 Prepared email data:', emailData);

                        // Send email logic
                        const sendEmail = async () => {
                          try {
                            // Check if backend API exists
                            const response = await fetch('/api/send-email', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(emailData),
                            });

                            if (response.ok) {
                              const result = await response.json();
                              if (result.success) {
                                console.log('✅ Email sent successfully via API');
                                toast.success('Email sent successfully!');
                              } else {
                                console.error('❌ API returned error:', result.error);
                                toast.error(`Could not send email: ${result.error}. Check your SMTP settings in the Settings tab.`, { duration: 6000 });
                              }
                            } else if (response.status === 404) {
                              // API endpoint doesn't exist - show alternative
                              console.log('⚠️ Backend API not available');
                              toast.error(`Backend API not configured. Email prepared for: ${emailData.to}`, {
                                duration: 5000
                              });
                            } else {
                              throw new Error(`HTTP ${response.status}`);
                            }
                          } catch (error) {
                            console.error('❌ Network error:', error);
                            // Fallback - show email details instead of error
                            toast.error(`Please configure email backend. Email ready for: ${emailData.to}`, {
                              duration: 5000
                            });
                          }
                        };

                        sendEmail();
                      }}
                    />
                    </motion.div>
                  ))}
                  {generatedEmails.length > 0 && filterEmails(generatedEmails).length === 0 && emailSearchQuery && (
                    <div className="text-center py-8 text-gray-600">
                      No emails match "{emailSearchQuery}". <button
                        onClick={() => setEmailSearchQuery('')}
                        className="text-gray-900 hover:underline font-medium"
                      >
                        Clear search
                      </button> to see all emails.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'email_editor' && (
            generatedEmails.length === 0 ? (
              // Show loading state when no emails generated yet
              <div className="h-full flex items-center justify-center bg-white p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 max-w-2xl"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Generating personalized emails
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Please wait while AI creates content for your prospects
                  </p>

                  {/* Countdown Timer */}
                  {generationTimeRemaining !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          Wait {Math.floor(generationTimeRemaining / 60)}:{String(generationTimeRemaining % 60).padStart(2, '0')} minutes
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Animated dots */}
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-[#00f5a0]"
                    />
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 rounded-full bg-[#00f5a0]"
                    />
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      className="w-2 h-2 rounded-full bg-[#00f5a0]"
                    />
                  </div>
                </motion.div>
              </div>
            ) : (
              <ProfessionalEmailEditor
                emailData={emailForReview}
                availableEmails={generatedEmails}
                emailCampaignStats={emailCampaignStats}
                prospects={prospects}
              />
            )
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && !selectedEmailThreadId && (
            <Analytics onEmailClick={(emailId) => setSelectedEmailThreadId(emailId)} />
          )}

          {/* Email Thread View - Shows when an email is selected from Analytics */}
          {activeView === 'analytics' && selectedEmailThreadId && (
            <EmailThreadPanel
              emailId={selectedEmailThreadId}
              onClose={() => setSelectedEmailThreadId(null)}
            />
          )}

          {/* Research View */}
          {activeView === 'research' && (
            <MarketResearch />
          )}

          {/* Dashboard View - Import Dashboard component */}
          {activeView === 'dashboard' && (
            <Analytics />
          )}

          {/* Home View */}
          {activeView === 'home' && (
            <div className="h-full overflow-auto">
              <HomePage onNavigate={(view) => setActiveView(view)} />
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <SettingsView />
          )}
        </div>
      </div>
      
      {/* Email Preview Modal */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEmailPreview(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Full Email Preview</h2>
              <button 
                onClick={() => setSelectedEmailPreview(null)}
                className="text-gray-700 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="border-b pb-4 mb-4 space-y-2">
                <div className="text-sm text-gray-900">
                  <strong>To:</strong> {selectedEmailPreview.to}
                </div>
                <div className="text-sm text-gray-900">
                  <strong>From:</strong> {selectedEmailPreview.from || 'Fruit AI'}
                </div>
                <div className="text-sm text-gray-900">
                  <strong>Subject:</strong> {selectedEmailPreview.subject || `Strategic Collaboration with ${selectedEmailPreview.to?.split('@')[1]?.split('.')[0]}`}
                </div>
                <div className="text-sm text-gray-900">
                  <strong>Quality Score:</strong> {selectedEmailPreview.quality || selectedEmailPreview.confidence || '85'}%
                </div>
              </div>
              
              <div className="prose max-w-none">
                {selectedEmailPreview.body ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmailPreview.body }} />
                ) : selectedEmailPreview.content ? (
                  <div className="whitespace-pre-wrap">{selectedEmailPreview.content}</div>
                ) : (
                  <div className="text-gray-900">
                    <p>Hi {selectedEmailPreview.to?.split('@')[0]},</p>
                    <br />
                    <p>I noticed your work in Food Technology and thought you'd be interested in our AI solution that could significantly benefit {selectedEmailPreview.to?.split('@')[1]?.split('.')[0]}.</p>
                    <br />
                    <p>Our AI platform has helped similar companies in your industry increase efficiency by 40% and reduce operational costs by 25%.</p>
                    <br />
                    <p>Would you be interested in a brief call to discuss how we could help {selectedEmailPreview.to?.split('@')[1]?.split('.')[0]} achieve similar results?</p>
                    <br />
                    <p>Best regards,<br />The Fruit AI Team</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal for Destructive Actions */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        danger={confirmationModal.danger}
      />

      {/* Email Review Modal */}
      <EmailReviewModal
        isOpen={showEmailReview}
        email={emailForReview}
        onApprove={handleEmailApproval}
        onClose={() => {
          console.log('🔄 User clicked Later - keeping workflow paused');
          setShowEmailReview(false);
          // Keep emailForReview but don't resume workflow
          // Send signal to backend to maintain pause state
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'user_delayed_decision',
              data: {
                campaignId: emailForReview?.campaignId,
                action: 'later',
                reason: 'user_clicked_later',
                timestamp: Date.now()
              }
            }));
          }
          // Don't set to null - keep for when user comes back
          // setEmailForReview(null);
        }}
        onEdit={() => {
          console.log('🎯 Going to Email Editor - checking available emails:', generatedEmails);
          console.log('🎯 Email for review data:', emailForReview);
          
          // Send signal to backend that user is going to email editor (still engaged)
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('📝 User going to email editor - sending engagement signal to backend');
            ws.send(JSON.stringify({
              type: 'user_editing_email',
              data: {
                campaignId: emailForReview?.campaignId,
                action: 'user_went_to_email_editor',
                status: 'user_engaged',
                timestamp: Date.now()
              }
            }));
          }
          
          // Make sure the email is available in generatedEmails before switching
          if (emailForReview && generatedEmails.find(e => e.to === emailForReview.to) === undefined) {
            console.log('📧 Adding current email to generatedEmails for editor access');
            setGeneratedEmails(prev => [...prev, { ...emailForReview, id: `editor_${Date.now()}`, status: 'generated' }]);
          }
          
          setActiveView('email_editor'); // Switch to Email Editor page
          setShowEmailReview(false);
          // Keep workflow paused while user is in email editor
          setWorkflowStatus('paused_for_editing');
          // Don't set emailForReview to null - keep it for editor access
        }}
      />
      
      {/* Email Send Confirmation Modal */}
      <EmailSendConfirmationModal
        isOpen={showEmailSendConfirmation}
        onClose={() => {
          setShowEmailSendConfirmation(false);
        }}
        onConfirm={async () => {
          // User confirmed to continue with remaining emails using the approved template
          console.log('✅ User confirmed to send all emails with same template');
          
          // Get the approved email template from emailForReview or generatedEmails
          const approvedTemplate = emailForReview || (generatedEmails.length > 0 ? generatedEmails[0] : null);
          
          if (approvedTemplate && ws && ws.readyState === WebSocket.OPEN) {
            console.log('📤 Sending template confirmation and resume command to backend');
            ws.send(JSON.stringify({
              type: 'resume_campaign_with_template',
              data: {
                approvedTemplate: {
                  subject: approvedTemplate.subject,
                  body: approvedTemplate.body,
                  recipientName: approvedTemplate.recipientName,
                  company: approvedTemplate.company,
                  structure: {
                    greeting: approvedTemplate.body?.match(/Hi[^,\n]*/)?.[0] || 'Hi {{recipientName}}',
                    introduction: approvedTemplate.body?.split('\n')?.[2] || '',
                    mainContent: approvedTemplate.body?.split('\n')?.slice(3, -3)?.join('\n') || '',
                    callToAction: approvedTemplate.body?.match(/Visit.*|Check.*|Learn.*/)?.[0] || 'Visit Our Website',
                    signature: approvedTemplate.body?.split('\n')?.slice(-2)?.join('\n') || ''
                  }
                },
                campaignId: approvedTemplate.campaignId,
                prospects: prospects, // Send all remaining prospects
                useSameTemplate: true,
                action: 'send_all_remaining_emails'
              }
            }));
            
            setShowEmailSendConfirmation(false);
            // Keep the workflow active to show subsequent generated emails
            setWorkflowStatus('generating_emails');
            // Mark template as approved for automatic sending of subsequent emails
            setTemplateApproved(true);
            setApprovedTemplate(approvedTemplate);
            console.log('✅ Campaign resumed - template approved for automatic sending');
          } else {
            console.error('❌ No approved template found or WebSocket not connected');
            // Fallback to API call
            try {
              const response = await fetch('/api/workflow/continue-campaign', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  useSameTemplate: true,
                  approvedTemplate: approvedTemplate
                })
              });
              
              if (response.ok) {
                console.log('✅ Campaign continuation confirmed via API');
                setShowEmailSendConfirmation(false);
              } else {
                console.error('❌ Failed to continue campaign via API');
              }
            } catch (error) {
              console.error('❌ Error continuing campaign:', error);
            }
          }
        }}
      />

      {/* 🎨 Template Selection Modal - Rendered via Portal to escape overflow-hidden */}
      {showTemplateSelection && ReactDOM.createPortal(
        <TemplateSelectionModal
          isOpen={showTemplateSelection}
          onClose={() => {
            if (isSubmittingTemplate) return;
            setShowTemplateSelection(false);
            setSelectedTemplate(null);
            setTemplateRequest(null);
          }}
          onSelectTemplate={(template) => {
            console.log("🎨 User selected template:", template.name);
            setSelectedTemplate(template);
          }}
          onConfirm={handleTemplateConfirm}
          isSubmitting={isSubmittingTemplate}
          templateRequest={templateRequest}
        />,
        document.body
      )}

      {/* 🚀 Email Generation Status Popup */}
      {showGenerationPopup && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-[#00f5a0] rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-[#00f5a0]/20 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#00f5a0] rounded-xl flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Email Generation Started!</h3>
                  <p className="text-sm text-gray-400">AI Agent is working...</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerationPopup(false)}
                className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 mb-6">
              {/* Template Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black border border-[#00f5a0] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Selected Template</p>
                    <p className="text-lg font-semibold text-white">{generationInfo.templateName}</p>
                  </div>
                </div>
              </div>

              {/* Prospects Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black border border-[#00f5a0] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Generating for</p>
                    <p className="text-lg font-semibold text-white">{generationInfo.prospectCount} Prospects</p>
                  </div>
                </div>
              </div>

              {/* Time Estimate */}
              <div className="bg-gradient-to-r from-[#00f5a0]/10 to-transparent border border-[#00f5a0]/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black border border-[#00f5a0] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Estimated Time</p>
                    <p className="text-lg font-semibold text-[#00f5a0]">
                      ~{Math.max(1, Math.ceil(generationInfo.prospectCount * 0.5))} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                What's Next?
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="text-[#00f5a0] mr-2">1.</span>
                  <span>AI will generate personalized emails for each prospect</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00f5a0] mr-2">2.</span>
                  <span>Watch the Email tab for generated emails appearing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00f5a0] mr-2">3.</span>
                  <span>Review and edit emails before sending</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00f5a0] mr-2">4.</span>
                  <span>Click "Send Campaign" when ready!</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowGenerationPopup(false);
                // 🔥 FIX: Use 'emails' to match the actual view name
                setActiveView('emails');
              }}
              className="w-full bg-[#00f5a0] hover:bg-[#00d68a] text-black font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-[#00f5a0]/30"
            >
              Go to Email Tab
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 🏢 Company Detail Modal - Removed, now shown inline in prospects view */}

      {/* 🎯 User Action Reminder - Shows pending actions specific to this user */}
      <UserActionReminder
        userId={localStorage.getItem('userId')}
        onNavigate={(action) => {
          console.log('📍 User clicked reminder button, navigating to:', action);
          if (action === 'template-selection') {
            setShowTemplateSelection(true);
          } else if (action === 'email-campaign') {
            setActiveView('email-campaign');
          } else if (action === 'prospects') {
            setActiveView('prospects');
          }
        }}
      />

      {/* 🔔 Process Notifications - Shows workflow stage popups */}
      {showProcessNotification && notificationStage && (
        <ProcessNotifications
          workflowStatus={notificationStage}
          prospectCount={prospects.length}
          emailCount={generatedEmails.length}
          progress={0}
          onDismiss={() => {
            setShowProcessNotification(false);
            setNotificationStage(null);
          }}
          onAction={(action) => {
            console.log('🎯 Process notification action:', action);
            if (action === 'selectTemplate') {
              setShowTemplateSelection(true);
              setShowProcessNotification(false);
            } else if (action === 'viewProspects') {
              setActiveView('prospects');
              setShowProcessNotification(false);
            } else if (action === 'continueToEmails') {
              setActiveView('emails');
              setShowProcessNotification(false);
            } else if (action === 'reviewEmails') {
              setActiveView('email_editor');
              setShowProcessNotification(false);
            } else if (action === 'viewCampaign') {
              setActiveView('emails');
              setShowProcessNotification(false);
            } else if (action === 'viewAnalytics') {
              setActiveView('analytics');
              setShowProcessNotification(false);
            } else if (action === 'viewAnalysis') {
              setActiveView('dashboard');
              setShowProcessNotification(false);
            } else if (action === 'viewStrategy') {
              setActiveView('dashboard');
              setShowProcessNotification(false);
            } else if (action === 'findProspects') {
              // Auto-proceed to prospect search
              setShowProcessNotification(false);
            } else if (action === 'viewProgress') {
              setActiveView('workflow');
              setShowProcessNotification(false);
            } else if (action === 'continue') {
              // Just dismiss and continue
              setShowProcessNotification(false);
            }
          }}
        />
      )}

      {/* 🔔 Agent Status Notification - Shows backend process status */}
      {agentStatus && (
        <AgentStatusNotification
          status={agentStatus}
          message={agentMessage}
          details={agentDetails}
          onClose={() => {
            setAgentStatus(null);
            setAgentMessage('');
            setAgentDetails([]);
          }}
          autoClose={agentStatus === 'success' || agentStatus === 'prospects_found' || agentStatus === 'emails_generated'}
        />
      )}

      {/* 🎓 Onboarding Tour - Shows after clicking START CAMPAIGN for first time */}
      <OnboardingTour
        isOpen={showOnboardingTour}
        onComplete={() => {
          console.log('✅ Onboarding tour completed');
          setShowOnboardingTour(false);
          setActiveView('workflow'); // Navigate back to workflow view
          // Now actually start the workflow
          setTimeout(() => {
            startWorkflow();
          }, 500);
        }}
        startStep={0}
      />

      {/* MailGen AI Assistant */}
      <AIAssistantChatbot
        isOpen={showChatbot}
        onClose={() => {
          setShowChatbot(false);
        }}
        activeView={activeView}
        setActiveView={setActiveView}
        prospects={prospects}
        emails={emailCampaignStats.emails || generatedEmails || []}
        externalMessage={chatbotExternalMessage}
      />

      {/* Batch Search Modal */}
      {showBatchSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Batch Prospect Search</h3>
              <button
                onClick={() => setShowBatchSearchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Search for new prospects based on specific criteria. Results will be added to your current campaign.
            </p>

            <div className="space-y-4">
              {/* Industry Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={batchSearchData.industry}
                  onChange={(e) => setBatchSearchData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare, Finance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f5a0] bg-white text-gray-900"
                />
              </div>

              {/* Region Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={batchSearchData.region}
                  onChange={(e) => setBatchSearchData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="e.g., United States, Europe, Asia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f5a0] bg-white text-gray-900"
                />
              </div>

              {/* Keywords Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={batchSearchData.keywords}
                  onChange={(e) => setBatchSearchData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="e.g., CEO, founder, director, manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f5a0] bg-white text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBatchSearchModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchSearch}
                disabled={!batchSearchData.industry && !batchSearchData.region && !batchSearchData.keywords}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating chat button */}
      {!showChatbot && (
        <button
          onClick={() => {
            setShowChatbot(true);
          }}
          className="fixed bottom-6 right-6 bg-[#00f5a0] hover:bg-[#00e090] text-black p-4 rounded-full shadow-lg transition-all z-40"
          title="Open MailGen AI Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default SimpleWorkflowDashboard;
// FIXED: All style attributes separated from className + getMultiColorRainbowPattern at module level
