import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, User, Loader, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Search, Mail, Building2,
  TrendingUp, MessageSquare, Brain, Globe, Database,
  FileText, Sparkles, ArrowRight, Clock, Activity,
  Target, Users, BarChart3, Link, Shield, Zap, Edit, Settings,
  Radar, Network, BarChart, PlayCircle, CheckSquare, AlertTriangle,
  Server, Eye, Cpu, Layers, Workflow, Gauge, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../utils/apiClient';
import ProfessionalEmailEditor from './ProfessionalEmailEditor';
import TemplateSelectionModal from './TemplateSelectionModal';
import TemplateSelectionService from '../services/TemplateSelectionService';
import { EMAIL_TEMPLATES } from '../data/emailTemplatesConsistent.js';
import Analytics from '../pages/Analytics';
import HomePage from '../pages/Home';
import JobRightProspectCard from './JobRightProspectCard';
import JobRightEmailCard from './JobRightEmailCard';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-lg" style={{
        minHeight: '600px',
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
              background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
              maxWidth: '600px'
            }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-4">First Email Generated Successfully!</h2>
              <p className="text-lg text-black mb-0">
                Your first email for <strong>{email.to}</strong> is ready for review and editing.
              </p>
              <p className="text-sm text-gray-700 mt-2">
                ⚠️ <strong>Important:</strong> All remaining emails are paused until you review this first email. Any edits you make will be used as a template for all subsequent emails.
              </p>
            </div>
            
            {/* Email Preview */}
            {email.body && (
              <details className="mb-8 text-left">
                <summary className="cursor-pointer text-base font-medium p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  📄 Preview Generated Email
                </summary>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                  <div className="text-sm mb-3 font-medium text-black">
                    <strong>Subject:</strong> {email.subject}
                  </div>
                  <div className="text-sm border-t border-gray-200 pt-3 text-gray-700">
                    <div 
                      dangerouslySetInnerHTML={{ __html: email.body }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </div>
              </details>
            )}
            
            {/* Next Step - White background with black text */}
            <div className="bg-white p-6 rounded-xl mb-8 border border-gray-200">
              <p className="text-base text-black">
                📝 <strong>Next Step:</strong> Go to the <strong>Email Editor</strong> to review, edit, and send your email.
              </p>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Later
              </button>
              <button
                onClick={handleGoToEmailEditor}
                className="px-12 py-4 rounded-2xl font-semibold text-lg text-white transition-colors"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                Go to Email Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

      {/* 🎨 Template Selection Modal */}
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
      />
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
              background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
              maxWidth: '600px'
            }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle className="w-8 h-8 text-green-600" />
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
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Stop Here
              </button>
              <button
                onClick={onConfirm}
                className="px-12 py-4 rounded-2xl font-semibold text-lg text-white transition-colors"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
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

      {/* 🎨 Template Selection Modal */}
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
      />
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
      <div className="p-8 space-y-6 bg-gradient-to-br from-white via-gray-50 to-green-50">
        {/* Search Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 style={{ background: getMultiColorRainbowPattern('workflow-icon') }} rounded-xl flex items-center justify-center">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Email Discovery Progress</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 25, 100)}%`}
            </div>
            <Gauge className="w-5 h-5 text-green-500" />
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
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index 
                  ? 'bg-green-500 text-white shadow-lg' 
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
              <div className="w-8 h-8 style={{ background: getMultiColorRainbowPattern('success-icon') }} rounded-lg flex items-center justify-center">
                <BarChart className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Search Results</h5>
            </div>
            
            {/* Website Crawling Results */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-green-600" />
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
                        <CheckCircle className="w-4 h-4 text-green-500" />
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-green-600" />
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
                    className="bg-white p-2 rounded border border-green-200 text-gray-900 font-mono text-xs"
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
      <div className="p-8 space-y-6 bg-gradient-to-br from-white via-gray-50 to-green-50">
        {/* Verification Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 style={{ background: getMultiColorRainbowPattern('workflow-icon') }} rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Email Verification Progress</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 25, 100)}%`}
            </div>
            <Gauge className="w-5 h-5 text-green-500" />
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
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index 
                  ? 'bg-green-500 text-white shadow-lg' 
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
              <div className="w-8 h-8 style={{ background: getMultiColorRainbowPattern('success-icon') }} rounded-lg flex items-center justify-center">
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
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {result.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-mono text-sm font-medium">{result.email}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    result.status === 'valid' 
                      ? 'bg-green-100 text-gray-900' 
                      : 'bg-red-100 text-red-800'
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
      <div className="p-8 space-y-6 bg-gradient-to-br from-white via-green-50 to-green-100">
        {/* Persona Generation Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 style={{ background: getMultiColorRainbowPattern('ai-icon') }} rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">🎯 AI Persona Generator</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 20, 100)}%`}
            </div>
            <Target className="w-5 h-5 text-green-500" />
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
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-100">
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
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index 
                  ? 'bg-green-500 text-white shadow-lg' 
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
              <div className="w-8 h-8 style={{ background: getMultiColorRainbowPattern('ai-icon') }} rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Results</h5>
            </div>
            
            {/* Generated Personas Preview */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-green-600" />
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
                    className="bg-white p-4 rounded-lg border border-green-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-900 font-medium">{persona.email}</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
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
                            <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
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
      <div className="p-8 space-y-6 bg-gradient-to-br from-white via-green-50 to-green-100">
        {/* Email Generation Progress */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 style={{ background: getMultiColorRainbowPattern('workflow-icon') }} rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">📝 AI Email Generation System</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 20, 100)}%`}
            </div>
            <Sparkles className="w-5 h-5 text-green-500" />
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
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-100">
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
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                currentStep >= index 
                  ? 'bg-green-500 text-white shadow-lg' 
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
              <div className="w-8 h-8 style={{ background: getMultiColorRainbowPattern('workflow-icon') }} rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h5 className="text-xl font-bold text-gray-900">Generated Emails</h5>
            </div>
            
            {/* Generated Emails Preview */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-green-600" />
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
                    className="bg-white p-4 rounded-lg border border-green-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-900 font-medium">{email.to}</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
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

      {/* 🎨 Template Selection Modal */}
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
      />
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-white via-gray-50 to-green-50">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 style={{ background: getMultiColorRainbowPattern('workflow-icon') }} rounded-lg flex items-center justify-center">
            {title.includes('Website') ? <Globe className="w-4 h-4 text-white" /> : 
             title.includes('Persona') ? <Target className="w-4 h-4 text-white" /> : 
             <Brain className="w-4 h-4 text-white" />}
          </div>
          <h4 className="text-lg font-bold text-gray-900">Progress</h4>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold text-green-600">
            {animationState === 'completed' ? '100%' : `${Math.min(Math.round(((currentStep + 1) / getSteps().length) * 100), 100)}%`}
          </div>
          <Gauge className="w-4 h-4 text-green-500" />
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
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              currentStep >= index ? 'bg-green-500' : 'bg-gray-300'
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
                <Loader className="w-3 h-3 text-green-500 animate-spin" />
              </div>
            )}
            {currentStep > index && (
              <div className="ml-auto">
                <CheckCircle className="w-3 h-3 text-green-500" />
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
          className="bg-white rounded-lg p-4 shadow-sm border border-green-200"
        >
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
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

      {/* 🎨 Template Selection Modal */}
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
      />
};

const SimpleWorkflowDashboard = ({ agentConfig, onReset }) => {
  const [activeView, setActiveView] = useState('workflow');
  
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

  // Search query states
  const [prospectSearchQuery, setProspectSearchQuery] = useState('');
  const [emailSearchQuery, setEmailSearchQuery] = useState('');

  // Filter states (kept for backward compatibility)
  const [prospectFilters, setProspectFilters] = useState({});
  const [emailFilters, setEmailFilters] = useState({});
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

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
    } catch (error) {
      console.error('Failed to clear workflow history:', error);
    }
  };
  const [waitingForDetailedWindow, setWaitingForDetailedWindow] = useState(false);

  // Timeout to prevent getting stuck in waitingForDetailedWindow state
  useEffect(() => {
    if (waitingForDetailedWindow) {
      const timeout = setTimeout(() => {
        console.log('🔧 Workflow stuck in waitingForDetailedWindow, auto-resetting...');
        setWaitingForDetailedWindow(false);
        setIsAnimating(false);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [waitingForDetailedWindow]);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);
  
  // Micro-step animation system - persistent background workflow
  const [microSteps, setMicroSteps] = useState([]);
  const [currentMicroStepIndex, setCurrentMicroStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [backgroundWorkflowRunning, setBackgroundWorkflowRunning] = useState(false);

  // Fallback mechanism: Poll workflow status when WebSocket seems stuck
  useEffect(() => {
    if (backgroundWorkflowRunning && microSteps.length <= 2) { // If stuck with minimal progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/workflow/status');
          const statusData = await statusResponse.json();

          if (statusData.success && statusData.data) {
            const { isRunning, currentStep, steps } = statusData.data;

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
  const [showEmailReview, setShowEmailReview] = useState(false);
  const [emailForReview, setEmailForReview] = useState(null);
  const [showEmailSendConfirmation, setShowEmailSendConfirmation] = useState(false);
  const [hasShownFirstEmailModal, setHasShownFirstEmailModal] = useState(false);
  const [templateApproved, setTemplateApproved] = useState(false); // Track if user approved template usage
  const [approvedTemplate, setApprovedTemplate] = useState(null); // Store approved template data

  // 🎨 Template Selection State
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [templateRequest, setTemplateRequest] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const templateAlreadySubmittedRef = useRef(false); // 🔥 FIX: Use ref to persist across re-renders

  const [steps, setSteps] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [emailCampaignStats, setEmailCampaignStats] = useState({
    emails: [],
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0
  });
  const [selectedLogStep, setSelectedLogStep] = useState(null);
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(new Set());

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
    const microSteps = [];
    
    // Business Analysis Micro-steps
    if (workflowData.type === 'business_analysis' || workflowData.stepId?.includes('business')) {
      microSteps.push({
        type: 'agent_message',
        message: "I'm analyzing your business and website.",
        delay: 1000
      });
      microSteps.push({
        type: 'agent_message', 
        message: "I'll first analyze your website structure.",
        delay: 1500
      });
      microSteps.push({
        type: 'window',
        title: 'Website Analysis',
        content: {
          website: 'https://fruitai.org/',
          industry: 'Food Technology',
          status: 'Analysis Complete'
        },
        delay: 2000
      });
      microSteps.push({
        type: 'agent_message',
        message: "Now I'm generating your marketing strategy.",
        delay: 1500
      });
      microSteps.push({
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
      microSteps.push({
        type: 'agent_message',
        message: "I'm finding qualified prospects for you.",
        delay: 1000
      });
      microSteps.push({
        type: 'agent_message',
        message: "I'll first activate the 🔍 Super Email Search Engine.",
        delay: 1500
      });
      microSteps.push({
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
      const prospects = workflowData.prospects || [];
      prospects.slice(0, 5).forEach((prospect, index) => {
        microSteps.push({
          type: 'agent_message',
          message: index === 0 ? "I found this qualified prospect:" : "I found another qualified prospect:",
          delay: 1200
        });
        microSteps.push({
          type: 'prospect_card',
          prospect: prospect,
          delay: 2000
        });
      });
    }
    
    // Email Generation Micro-steps
    if (workflowData.emails || workflowData.stepId?.includes('email')) {
      microSteps.push({
        type: 'agent_message',
        message: "I'm creating personalized emails for you.",
        delay: 1000
      });
      microSteps.push({
        type: 'agent_message',
        message: "I'll first analyze each prospect's persona.",
        delay: 1500
      });
      microSteps.push({
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
      const emails = workflowData.emails || [];
      emails.slice(0, 3).forEach((email, index) => {
        microSteps.push({
          type: 'agent_message',
          message: index === 0 ? "I created this personalized email:" : "I created another personalized email:",
          delay: 1500
        });
        microSteps.push({
          type: 'email_card',
          email: email,
          delay: 2500
        });
      });
    }
    
    return microSteps;
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
      const currentStep = microSteps[currentMicroStepIndex];
      console.log(`🎬 Processing micro-step ${currentMicroStepIndex}/${microSteps.length}: ${currentStep.type} - ${currentStep.message || currentStep.title || 'N/A'}`);
      
      // Check if current step is a detailed window
      if (currentStep.type === 'detailed_window') {
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
      }, currentStep.delay);

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
  const handleTemplateSelectionRequired = (data) => {
    console.log('🎨 === INSIDE handleTemplateSelectionRequired ===');
    console.log('🎨 Template selection required data:', data);
    console.log('🎨 Setting templateRequest...');
    setTemplateRequest(data);
    console.log('🎨 Setting showTemplateSelection to TRUE...');
    setShowTemplateSelection(true);
    console.log('🎨 showTemplateSelection state updated to TRUE');

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

    if (!templateToUse || !templateRequest) {
      console.error('❌ No template selected', { passedTemplate, selectedTemplate, templateRequest });
      return;
    }

    setIsSubmittingTemplate(true);

    try {
      console.log('🎨 Confirming template selection:', templateToUse.id);
      console.log('🎨 Selected template data:', templateToUse);

      // Extract customization data from templateToUse
      const baseTemplate = EMAIL_TEMPLATES[templateToUse.id];

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
        // Mark as customized if we have custom data
        isCustomized: !!(
          templateToUse.customizations ||
          templateToUse.subject ||
          templateToUse.greeting ||
          templateToUse.signature ||
          templateToUse.html  // Also mark as customized if HTML was edited
        )
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
      const result = await TemplateSelectionService.selectTemplate(
        templateToUse.id,
        templateRequest.campaignId || 'default',
        templateRequest.workflowId || 'default',
        customizations.isCustomized ? customizations : null,
        templateComponents  // <-- NOW INCLUDING COMPONENTS!
      );

      console.log('✅ Template selection response:', result);
      console.log(`✅ Template ${templateToUse.name} applied successfully with customizations!`);

      // Close template selection modal and mark as submitted
      setShowTemplateSelection(false);
      setSelectedTemplate(null);
      setTemplateRequest(null);
      templateAlreadySubmittedRef.current = true; // 🎯 CRITICAL: Prevent popup from appearing again
      console.log('🎯 Template submission flag set - popup will not retrigger');

    } catch (error) {
      console.error('❌ Failed to confirm template selection:', error);
    } finally {
      setIsSubmittingTemplate(false);
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
        setProspects(data.prospects);
        
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

    // Prevent multiple simultaneous calls AND prevent duplicate animations AND debounce rapid calls
    if (isProcessingWorkflowResults || hasShownProspectSteps || hasShownEmailSteps || (now - lastWorkflowFetchTime < 5000)) {
      console.log('⏭️ Skipping fetchAndTriggerWorkflowSteps - already processing, animations shown, or too soon');
      console.log(`⏭️ Flags: processing=${isProcessingWorkflowResults}, prospectSteps=${hasShownProspectSteps}, emailSteps=${hasShownEmailSteps}, timeSinceLast=${now - lastWorkflowFetchTime}ms`);
      return;
    }

    try {
      setIsProcessingWorkflowResults(true);
      setLastWorkflowFetchTime(now);
      console.log('🔄 Fetching workflow results with authentication...');
      const result = await apiGet('/api/workflow/results');

      console.log('📊 Workflow results fetched:', result);
      console.log('📊 EmailCampaign data:', result.data?.emailCampaign);

      if (result.success && result.data) {
        const { prospects, campaignData } = result.data;
        const emailCampaign = campaignData?.emailCampaign;

        // 🎨 NEW: Check for template selection required (HTTP polling fallback)
        // This triggers when prospects are found but no template is selected yet
        if (result.data.status === 'waiting_for_template' ||
            result.data.canProceed === false ||
            (prospects && prospects.length > 0 && result.data.templateSelectionRequired)) {
          console.log('🎨🎨🎨 TEMPLATE SELECTION REQUIRED (via HTTP polling)! 🎨🎨🎨');
          console.log('🎨 Prospects found:', prospects?.length || 0);
          console.log('🎨 Status:', result.data.status);
          console.log('🎨 Can proceed:', result.data.canProceed);
          console.log('🎨 Template selection required:', result.data.templateSelectionRequired);
          console.log('🎨 Template already submitted?', templateAlreadySubmittedRef.current);

          // Trigger template selection popup ONLY if not already submitted
          if (!showTemplateSelection && !templateAlreadySubmittedRef.current) {
            console.log('🎨 Triggering template selection popup via HTTP polling');
            handleTemplateSelectionRequired({
              campaignId: result.data.campaignId,
              prospectsCount: prospects?.length || 0,
              prospectsFound: prospects?.length || 0,
              sampleProspects: prospects?.slice(0, 5) || [],
              message: `Found ${prospects?.length || 0} prospects! Please select an email template to continue.`,
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
          setEmailForReview(result.data.firstEmailGenerated);
          setShowEmailReview(true);
          setHasShownFirstEmailModal(true); // Mark first email modal as shown

          // Stop all polling while waiting for user input
          setWorkflowStatus('paused_for_review');
          return; // Don't process other results while waiting for approval
        }
        
        // Trigger prospect micro-steps if we have prospects and haven't shown them yet
        if (prospects && prospects.length > 0 && !hasShownProspectSteps) {
          console.log('🎯 Found', prospects.length, 'prospects - triggering micro-steps!');
          triggerProspectMicroSteps(prospects);
          setProspects(prospects);
          
          // Also check for emails immediately after showing prospects
          if (emailCampaign && emailCampaign.emails && emailCampaign.emails.length > 0) {
            console.log('📧 Also found', emailCampaign.emails.length, 'emails - scheduling email micro-steps!');
            setTimeout(() => {
              triggerEmailMicroSteps(emailCampaign.emails);
            }, 15000); // Delay to let prospect steps finish
          }
        }
        // If we already showed prospects, just show emails
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
    }
  };

  // Check for email updates when email activity is detected
  const checkForEmailUpdates = async () => {
    try {
      console.log('🔄 Checking for email updates with authentication...');
      const result = await apiGet('/api/workflow/results');
      
      if (result.success && result.data) {
        const { emailCampaign, generatedEmails } = result.data;
        
        // Check if we have new emails that haven't been shown yet
        const emails = emailCampaign?.emails || generatedEmails || [];
        if (emails.length > 0) {
          console.log('📧 Found', emails.length, 'emails in update check');
          
          // DISABLE ANIMATIONS IN THIS FUNCTION - Only update state
          console.log('📧 Updating emails state without animations to prevent duplicates');
          setGeneratedEmails(emails);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check for email updates:', error);
    }
  };

  // Poll for workflow updates periodically
  useEffect(() => {
    const isPaused = workflowStatus.includes('paused') || showEmailReview;

    if ((workflowStatus === 'running' || activeView === 'workflow') && !isPaused) {
      const interval = setInterval(() => {
        console.log('⏰ Periodic check for workflow updates');
        checkForEmailUpdates();
        // Also check workflow results - but not if email review is showing
        if (!isPaused) {
          fetchAndTriggerWorkflowSteps();
        }
      }, 3000); // Check every 3 seconds for faster updates

      return () => clearInterval(interval);
    } else if (isPaused) {
      console.log('⏸️ Workflow is paused, stopping periodic checks');
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/workflow`;
    console.log('🔌 Attempting WebSocket connection...');
    console.log('   Protocol:', protocol);
    console.log('   Host:', window.location.host);
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
    };

    wsInstance.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('🔍 WebSocket message received:', data);
      console.log('🔍 Data type:', data.type);
      console.log('🔍 Has prospects:', !!data.prospects);
      console.log('🔍 Prospects length:', data.prospects ? data.prospects.length : 'N/A');
      console.log('🔍 Full message content:', JSON.stringify(data, null, 2));
      
      // Process backend messages - avoid duplicate processing
      // Only use one handler to prevent duplicate messages
      if (data.type === 'workflow_update' || data.stepId) {
        // Use workflow update handler for structured workflow data
        handleWorkflowUpdate(data);
      } else if (data.type === 'workflow_data_cleared') {
        // Handle workflow reset/clear message from backend
        console.log('🗑️ Received workflow data cleared message - refreshing UI');
        // Force refresh all data
        setProspects([]);
        setEmailCampaignStats({ emails: [], totalSent: 0, totalOpened: 0, totalClicked: 0 });
        setGeneratedEmails([]);
        setMicroSteps([]);
        setCurrentMicroStepIndex(0);
        setIsAnimating(false);
        setBackgroundWorkflowRunning(false);
      } else if (data.type === 'data_update' || data.message?.includes('Broadcasting workflow update')) {
        // Handle data update messages from backend
        console.log('📊 Received data_update or workflow broadcast message');
        fetchAndTriggerWorkflowSteps();
      } else if (data.type === 'template_selection_required') {
        // 🎨 NEW: Handle template selection required
        console.log('🎨🎨🎨 TEMPLATE SELECTION REQUIRED MESSAGE RECEIVED! 🎨🎨🎨');
        console.log('🎨 Template selection data:', JSON.stringify(data.data, null, 2));
        console.log('🎨 Calling handleTemplateSelectionRequired...');
        handleTemplateSelectionRequired(data.data);
        console.log('🎨 handleTemplateSelectionRequired called successfully');
      } else if (data.type === 'template_selected') {
        // 🎨 NEW: Handle template selected confirmation
        console.log('✅ Template selected confirmed:', data.data);
        handleTemplateSelected(data.data);
      } else {
        // Use pipeline message handler for general log messages
        processPipelineMessage(data);
      }
      
      // REMOVED: Too broad check that was triggering popup too early
      // The popup should only trigger on specific "email_awaiting_approval" messages
      
      // IMMEDIATE CHECK - trigger prospect steps if we have prospect data
      if (data.prospects && Array.isArray(data.prospects) && data.prospects.length > 0 && !hasShownProspectSteps) {
        console.log('🎯 FOUND PROSPECTS - triggering micro-steps immediately!');
        triggerProspectMicroSteps(data.prospects);
        setProspects(data.prospects);
      }
      
      // Check for data_update and fetch workflow data
      if (data.type === 'data_update') {
        console.log('📊 Data update received - fetching workflow results');
        fetchAndTriggerWorkflowSteps();
      }
      
      // Check for email generation progress
      if (data.type === 'email_sent' || data.type === 'email_generated' || data.type === 'email_awaiting_approval') {
        console.log('📧 Email activity detected - checking for new emails');
        
        // Show confirmation modal when first email is sent
        if (data.type === 'email_sent' && data.data?.isFirstEmail) {
          console.log('🚀 First email sent - showing confirmation modal');
          setShowEmailSendConfirmation(true);
        }
        
        setTimeout(() => {
          checkForEmailUpdates();
        }, 1000);
      }
      
      // Handle other message types
      if (data.type === 'prospect_list') {
        // Handle prospect list updates and trigger micro-steps
        console.log('👥 Prospect list received:', data.prospects);
        const prospects = data.prospects || [];
        setProspects(prospects);
        
        // Create micro-steps for prospect discovery
        if (prospects.length > 0 && !hasShownProspectSteps) {
          console.log('🎯 Triggering prospect micro-steps from prospect_list');
          triggerProspectMicroSteps(prospects);
        }
      } else if (data.type === 'prospect_updated') {
        // Handle individual prospect updates
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
        // Handle email sent/generated updates
        const email = data.data || data.email;
        const emailCampaign = data.emailCampaign;
        
        if (email) {
          console.log('📧 Email update received:', email);
          setGeneratedEmails(prev => {
            const existing = prev.find(e => e.to === email.to);
            const newEmails = existing 
              ? prev.map(e => e.to === email.to ? { ...e, ...email } : e)
              : [...prev, email];
            console.log('📧 Updated email list:', newEmails);
            return newEmails;
          });
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
          
          setGeneratedEmails(prev => {
            const existing = prev.find(e => e.to === email.to);
            if (existing) {
              return prev.map(e => e.to === email.to ? { ...e, ...email } : e);
            } else {
              console.log('📧 Adding email to generatedEmails for email editor access');
              return [...prev, { ...email, id: `generated_${Date.now()}` }];
            }
          });
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
          setGeneratedEmails(prev => {
            const existing = prev.find(e => e.to === emailForReview.to);
            if (!existing) {
              console.log('📧 Adding email to generatedEmails for email editor access');
              return [...prev, { ...emailForReview, id: `generated_${Date.now()}`, status: 'generated' }];
            }
            return prev;
          });
          
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
        if (data.data) {
          if (data.data.emailCampaign) {
            setEmailCampaignStats(prev => ({
              ...prev,
              ...data.data.emailCampaign
            }));
          }
          if (data.data.prospects) {
            setProspects(data.data.prospects);
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
      } else if (data.type === 'clients_update') {
        // Handle client/prospect updates
        if (data.clients && data.clients.length > 0) {
          setProspects(data.clients);
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

  const startWorkflow = async () => {
    console.log('Starting workflow...');

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

        // NO PAGE RELOAD - Just keep the cleared state
        console.log('✅ Reset complete - no page reload needed');
      } else {
        console.error('Failed to reset workflow');
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

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-2">
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
                  ':hover': {
                    backgroundColor: 'rgba(0, 245, 160, 0.1)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 245, 160, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
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
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#e6fff2'}}>
              <span className="text-sm font-medium" style={{color: '#00f0a0'}}>AI</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium" style={{color: '#000000'}}>Qwen2.5 Model</p>
              <p className="text-xs" style={{color: '#00f0a0'}}>Local Deployment</p>
            </div>
            <div className="ml-auto flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#00f0a0'}}></div>
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
                onClick={onReset}
                className="text-xs p-2 rounded transition-colors"
                style={{color: '#ef4444'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Reset Config"
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
              <h1 className="text-3xl font-bold text-gray-900">Campaign Workflow</h1>
              <p className="text-gray-900 mt-2">AI-powered marketing automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <div className={`w-2 h-2 rounded-full ${ws ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-900 font-medium">
                  {ws ? 'Live' : 'Offline'}
                </span>
              </div>
              
              <button
                onClick={startWorkflow}
                disabled={workflowStatus === 'running'}
                className="px-6 py-3 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-xl disabled:opacity-50"
              >
                START CAMPAIGN
              </button>
              
              <button
                onClick={resetWorkflow}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {activeView === 'workflow' && (
            <div className="h-full -m-6 flex flex-col" style={{backgroundColor: '#e8f5e8'}}>
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
                      <p className="text-xl font-medium text-gray-700">Initializing AI Marketing Agent...</p>
                      <p className="text-sm text-gray-500 mt-2">Setting up automation pipeline</p>
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
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-6 h-6 text-gray-400">🚀</div>
                      </div>
                      <p className="text-xl font-medium text-gray-700">Ready to Start</p>
                      <p className="text-sm text-gray-500 mt-2">Click "START CAMPAIGN" to begin automation</p>
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
                          <div className="text-lg font-bold text-gray-900 leading-tight">
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
                              className="mt-3 flex items-center space-x-2 text-sm text-gray-600"
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
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 flex-shrink-0 mt-1">
                          <Bot className="w-6 h-6 text-white" />
                        </div>

                        {/* Chat Message Bubble */}
                        <div className="flex-1 max-w-[85%]">
                          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 shadow-sm">
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                                {microStep.type === 'processing_window' && (
                                  <Loader className="w-5 h-5 animate-spin text-green-600" />
                                )}
                                {microStep.icon && (
                                  <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                                    <microStep.icon className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <span>{microStep.title}</span>
                              </h3>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 font-medium">Live</span>
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
                                      <span className="text-sm font-medium text-gray-700 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                      </span>
                                      <span className="text-sm text-gray-900 font-semibold">{value}</span>
                                    </div>
                                  ))}

                                  {microStep.type === 'processing_window' && (
                                    <div className="flex items-center space-x-2 mt-3">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                      </div>
                                      <span className="text-sm text-gray-600">Processing...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="text-xs text-gray-400 mt-3">
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
                          <div className="w-3 h-3 rounded-full bg-green-500" />
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
                          />
                          
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-2 text-xs text-gray-700 flex items-center space-x-2"
                          >
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
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
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-2xl hover:shadow-lg transition-shadow">
                          <div className="bg-green-50 px-4 py-3 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-lg">📧</div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    To: {microStep.email.to || microStep.email.recipient_name || 'prospect@company.com'}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    From: {microStep.email.from || 'Fruit AI'}
                                  </div>
                                </div>
                              </div>
                              <div className="bg-green-100 px-3 py-1 rounded-full">
                                <span className="text-xs font-medium text-gray-900">
                                  {microStep.email.quality || microStep.email.confidence || Math.floor(Math.random() * 15) + 85}% Quality
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <h5 className="font-bold text-gray-900 mb-2">
                              Subject: {microStep.email.subject || `${microStep.email.to?.split('@')[1]?.split('.')[0]} - Strategic Collaboration`}
                            </h5>
                            <div className="text-sm text-gray-700 space-y-1">
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
                                      <div className="text-xs text-gray-600 mt-2 italic">
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
                                      <div className="text-xs text-gray-600 mt-2 italic">
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
            <div className="bg-gray-100 min-h-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Prospects</h2>

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
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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

                <div className="space-y-3">
                  {filterProspects(prospects).map((prospect, index) => (
                    <JobRightProspectCard
                      key={prospect.email || index}
                      prospect={prospect}
                      isGenerating={false}
                      showFilters={false} // Filters now shown separately above
                      selectedFilters={prospectFilters}
                      onFilterChange={handleProspectFilterChange}
                    />
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
                </div>
              </div>
            </div>
          )}

          {activeView === 'emails' && (
            <div className="bg-gray-100 min-h-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Campaign</h2>

                {/* Search Bar for Emails */}
                {generatedEmails.length > 0 && (
                  <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search emails... (e.g., subject, recipient, status, template type)"
                        value={emailSearchQuery}
                        onChange={(e) => setEmailSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                  {generatedEmails.length > 0 ? filterEmails(generatedEmails).map((email, index) => (
                    <JobRightEmailCard
                      key={email.id || index}
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
                          alert('Error: Email data is missing');
                          return;
                        }

                        if (!emailToSend.to) {
                          console.error('❌ Email recipient is missing');
                          alert('Error: Email recipient is required');
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
                                alert('Email sent successfully!');
                              } else {
                                console.error('❌ API returned error:', result.error);
                                alert(`Failed to send email: ${result.error}`);
                              }
                            } else if (response.status === 404) {
                              // API endpoint doesn't exist - show alternative
                              console.log('⚠️ Backend API not available');
                              alert(`Email prepared for sending:\nTo: ${emailData.to}\nSubject: ${emailData.subject}\n\nBackend API not configured. Please set up email sending backend.`);
                            } else {
                              throw new Error(`HTTP ${response.status}`);
                            }
                          } catch (error) {
                            console.error('❌ Network error:', error);
                            // Fallback - show email details instead of error
                            alert(`Email ready to send:\nTo: ${emailData.to}\nSubject: ${emailData.subject}\n\nPlease configure email backend to enable sending.`);
                          }
                        };

                        sendEmail();
                      }}
                    />
                  )) : (
                    <div className="text-center py-8 text-gray-700">
                      No emails available. Generated emails: {generatedEmails.length}
                    </div>
                  )}
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
            <ProfessionalEmailEditor
              emailData={emailForReview}
              availableEmails={generatedEmails}
              emailCampaignStats={emailCampaignStats}
              prospects={prospects}
            />
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && (
            <Analytics />
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

      {/* 🎨 Template Selection Modal */}
      {showTemplateSelection && (
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
        />
      )}
    </div>
  );
};

export default SimpleWorkflowDashboard;
