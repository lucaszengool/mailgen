import React, { useState } from 'react';
import { X, Check, Eye, Edit3, Zap, ChevronLeft } from 'lucide-react';
import { EMAIL_TEMPLATES } from '../data/emailTemplatesConsistent.js';
import EmailTemplateRenderer from './EmailTemplateRenderer.jsx';

const TemplateSelectionModal = ({ isOpen, onClose, onSelectTemplate, onConfirm, isSubmitting = false, templateRequest = null }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [customTemplateData, setCustomTemplateData] = useState({});

  if (!isOpen) return null;

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setIsPreviewMode(false);
  };

  const handlePreview = (templateId, event) => {
    event.stopPropagation();
    setHoveredTemplate(templateId);
    setIsPreviewMode(true);
    setSelectedTemplate(templateId);
  };

  const handleCustomize = (templateId, event) => {
    event.stopPropagation();
    setSelectedTemplate(templateId);
    setIsCustomizeMode(true);
    // Initialize with default template data
    const template = EMAIL_TEMPLATES[templateId];

    // 🖼️ GET LOGO from multiple possible sources
    const scrapedLogo = templateRequest?.websiteAnalysis?.logo ||  // From WebsiteAnalysisStep
                        templateRequest?.businessAnalysis?.companyInfo?.logo ||
                        templateRequest?.businessAnalysis?.company_logo ||
                        templateRequest?.businessAnalysis?.logo ||
                        templateRequest?.companyLogo ||
                        '';

    console.log('🖼️ Initializing customization with logo:', scrapedLogo || 'None found');
    console.log('🔍 Full template request object:', templateRequest);
    console.log('🔍 Template request data:', {
      websiteAnalysisLogo: templateRequest?.websiteAnalysis?.logo,
      websiteAnalysisExists: !!templateRequest?.websiteAnalysis,
      websiteAnalysisKeys: templateRequest?.websiteAnalysis ? Object.keys(templateRequest.websiteAnalysis) : [],
      hasBusinessAnalysis: !!templateRequest?.businessAnalysis,
      companyInfoLogo: templateRequest?.businessAnalysis?.companyInfo?.logo,
      companyLogo: templateRequest?.businessAnalysis?.company_logo,
      directLogo: templateRequest?.businessAnalysis?.logo,
      fallbackLogo: templateRequest?.companyLogo
    });

    setCustomTemplateData({
      templateId,
      name: template.name,
      subject: template.subject || (
        templateId === 'modern_tech' ? 'Transform Your Business with AI-Powered Solutions' :
        templateId === 'professional_partnership' ? 'Partnership Opportunity with {company}' :
        templateId === 'executive_outreach' ? 'Strategic Partnership Proposal for {company}' :
        templateId === 'product_launch' ? '🚀 Exclusive Early Access: Revolutionary New Platform' :
        templateId === 'consultative_sales' ? 'Strategic Assessment Opportunity for {company}' :
        templateId === 'event_invitation' ? 'You\'re Invited: Future of Business Summit' :
        'Partnership Opportunity with {company}'
      ),
      greeting: 'Hi {name},',
      companyPlaceholder: '{company}',
      senderName: '{senderName}',
      cta: 'Schedule Your Free Demo →',
      signature: 'Best regards,\n{senderName}\n{company}',
      customizations: {
        logo: scrapedLogo,  // 🖼️ PRE-POPULATE WITH SCRAPED LOGO
        headerTitle: template.name === 'Modern Tech' ? 'Transform Your Business with AI' : 'Partnership Opportunity',
        mainHeading: `Revolutionizing {company} with AI-Powered Solutions`,
        primaryColor: '#10b981', // green-500
        accentColor: '#047857', // green-700
        buttonText: 'Schedule Your Free Demo',
        testimonialText: '"This solution transformed our operations. We saw remarkable results in just weeks."',
        testimonialAuthor: 'CEO, Industry Leader',
        statsTitle: 'Why Industry Leaders Choose Us',
        textColor: '#000000',  // 🎨 DEFAULT TEXT COLOR
        features: [
          '40% Cost Reduction',
          '10x Faster Processing',
          '100% Compliance',
          'Global Scalability'
        ],
        customMedia: []  // 📸 Array of { id, url, position: 'top'|'middle'|'bottom', width }
      }
    });
  };

  const handleInlineEdit = (field, value) => {
    setCustomTemplateData(prev => {
      if (field.includes('.')) {
        // Handle nested fields like customizations.headerTitle
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const renderTemplateSpecificFields = (templateId) => {
    const template = EMAIL_TEMPLATES[templateId];
    const components = template?.structure?.components || [];

    // Modern Tech: header_banner, feature_grid, cta_button, social_proof
    if (templateId === 'modern_tech') {
      return (
        <>
          {/* Header Banner Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Banner Title
            </label>
            <input
              type="text"
              value={customTemplateData.customizations?.headerTitle ?? 'Transform Your Business with AI'}
              onChange={(e) => setCustomTemplateData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, headerTitle: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Header banner title..."
            />
          </div>

          {/* Feature Grid Items */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Feature Grid (4 Items)</h5>
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="mb-4 p-3 bg-white rounded border border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Feature {idx + 1} Title
                </label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`feature${idx + 1}Title`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`feature${idx + 1}Title`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                  placeholder={`Feature ${idx + 1} title`}
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Feature {idx + 1} Description
                </label>
                <textarea
                  value={customTemplateData.customizations?.[`feature${idx + 1}Description`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`feature${idx + 1}Description`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  rows="2"
                  placeholder={`Feature ${idx + 1} description`}
                />
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Proof Text
            </label>
            <input
              type="text"
              value={customTemplateData.customizations?.socialProofText ?? 'Trusted by 500+ companies'}
              onChange={(e) => setCustomTemplateData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, socialProofText: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Social proof text..."
            />
          </div>

          {/* Button Configuration */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">CTA Button</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.buttonText ?? 'Schedule Your Free Demo'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Button text..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                value={customTemplateData.customizations?.buttonUrl ?? 'https://calendly.com/meeting'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonUrl: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="https://..."
              />
            </div>
          </div>
        </>
      );
    }

    // Professional Partnership: logo, cta_button, testimonial
    if (templateId === 'professional_partnership') {
      return (
        <>
          {/* Logo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            {customTemplateData.customizations?.logo ? (
              <div className="mb-3 flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <img
                    src={customTemplateData.customizations.logo}
                    alt="Logo preview"
                    className="h-16 w-auto max-w-[200px] object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="text-xs text-gray-500">
                    {customTemplateData.customizations.logo.startsWith('data:') ? 'Uploaded' : 'From URL'}
                  </div>
                </div>
                <button
                  onClick={() => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, logo: '' }
                  }))}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mb-3 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <p className="text-sm text-gray-500">No logo set. Upload or enter URL below.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="flex-shrink-0 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 cursor-pointer transition-colors text-sm font-medium">
                <input
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCustomTemplateData(prev => ({
                          ...prev,
                          customizations: { ...prev.customizations, logo: reader.result }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                Upload
              </label>
              <input
                type="text"
                value={customTemplateData.customizations?.logo ?? ''}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, logo: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Or enter logo URL..."
              />
            </div>
          </div>

          {/* Header Title (subtitle under logo) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Title (under logo)
            </label>
            <input
              type="text"
              value={customTemplateData.customizations?.headerTitle ?? 'Partnership Opportunity'}
              onChange={(e) => setCustomTemplateData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, headerTitle: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Header title..."
            />
          </div>

          {/* Testimonial */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Testimonial</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Testimonial Text</label>
              <textarea
                value={customTemplateData.customizations?.testimonialText ?? '"This solution transformed our operations."'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, testimonialText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                rows="3"
                placeholder="Customer testimonial..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Testimonial Author</label>
              <input
                type="text"
                value={customTemplateData.customizations?.testimonialAuthor ?? 'CEO, Industry Leader'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, testimonialAuthor: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Author name and title..."
              />
            </div>
          </div>

          {/* Button Configuration */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">CTA Button</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.buttonText ?? 'Schedule Meeting'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Button text..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                value={customTemplateData.customizations?.buttonUrl ?? 'https://calendly.com/meeting'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonUrl: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="https://..."
              />
            </div>
          </div>
        </>
      );
    }

    // Executive Outreach: executive_header, stats_showcase, testimonial
    if (templateId === 'executive_outreach') {
      return (
        <>
          {/* Executive Header */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Executive Header</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Header Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.headerTitle ?? 'Executive Partnership Proposal'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, headerTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Header title..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Header Subtitle</label>
              <input
                type="text"
                value={customTemplateData.customizations?.headerSubtitle ?? 'Confidential - Strategic Initiative'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, headerSubtitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Header subtitle..."
              />
            </div>
          </div>

          {/* Stats Showcase */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Stats Showcase (3 Stats)</h5>
            {[1, 2, 3].map((num) => (
              <div key={num} className="mb-3 p-2 bg-white rounded border border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">Stat {num} Value</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`stat${num}Value`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`stat${num}Value`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder={`e.g., ${num === 1 ? '500+' : num === 2 ? '99.9%' : '24/7'}`}
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Stat {num} Label</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`stat${num}Label`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`stat${num}Label`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder={`e.g., ${num === 1 ? 'Clients' : num === 2 ? 'Uptime' : 'Support'}`}
                />
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Testimonial</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Testimonial Text</label>
              <textarea
                value={customTemplateData.customizations?.testimonialText ?? '"This solution transformed our operations."'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, testimonialText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                rows="3"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Author Name</label>
              <input
                type="text"
                value={customTemplateData.customizations?.testimonialAuthor ?? 'Michael Chen'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, testimonialAuthor: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Author Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.testimonialTitle ?? 'VP of Operations'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, testimonialTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Button Configuration */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">CTA Button</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.buttonText ?? 'Schedule Executive Briefing'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                value={customTemplateData.customizations?.buttonUrl ?? 'https://calendly.com/meeting'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonUrl: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </>
      );
    }

    // Product Launch: product_hero, feature_highlights, countdown_timer, cta_button
    if (templateId === 'product_launch') {
      return (
        <>
          {/* Product Hero */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Product Hero</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Hero Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.heroTitle ?? 'Introducing Our New Product'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, heroTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hero Subtitle</label>
              <input
                type="text"
                value={customTemplateData.customizations?.heroSubtitle ?? 'Revolutionary solution for your business'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, heroSubtitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Feature Highlights (4 Features)</h5>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="mb-3 p-2 bg-white rounded border border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">Feature {num} Emoji</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`feature${num}Emoji`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`feature${num}Emoji`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder="e.g., ⚡"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Feature {num} Title</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`feature${num}Title`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`feature${num}Title`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Feature {num} Description</label>
                <textarea
                  value={customTemplateData.customizations?.[`feature${num}Description`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`feature${num}Description`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  rows="2"
                />
              </div>
            ))}
          </div>

          {/* Countdown Timer */}
          <div className="mb-6 p-4 bg-red-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Countdown Timer</h5>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Days</label>
                <input
                  type="number"
                  value={customTemplateData.customizations?.countdownDays ?? '7'}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, countdownDays: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                <input
                  type="number"
                  value={customTemplateData.customizations?.countdownHours ?? '12'}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, countdownHours: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Timer Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.countdownTitle ?? 'Launch Countdown'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, countdownTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Timer Subtext</label>
              <input
                type="text"
                value={customTemplateData.customizations?.countdownSubtext ?? 'Limited time offer'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, countdownSubtext: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Button Configuration */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">CTA Button</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.buttonText ?? 'Get Early Access'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                value={customTemplateData.customizations?.buttonUrl ?? 'https://your-website.com/launch'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonUrl: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </>
      );
    }

    // Consultative Sales: expert_header, case_study, methodology, cta_consultation
    if (templateId === 'consultative_sales') {
      return (
        <>
          {/* Expert Header */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Expert Header</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Header Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.headerTitle ?? 'Expert Consultation'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, headerTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Header Subtitle</label>
              <input
                type="text"
                value={customTemplateData.customizations?.headerSubtitle ?? 'Strategic solutions for your business'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, headerSubtitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Methodology */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Methodology (3 Steps)</h5>
            {[1, 2, 3].map((num) => (
              <div key={num} className="mb-3 p-2 bg-white rounded border border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">Step {num} Title</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`step${num}Title`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`step${num}Title`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder={`Step ${num} title`}
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Step {num} Description</label>
                <textarea
                  value={customTemplateData.customizations?.[`step${num}Description`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`step${num}Description`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  rows="2"
                  placeholder={`Step ${num} description`}
                />
              </div>
            ))}
          </div>

          {/* Case Study */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Case Study</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Case Study Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.caseStudyTitle ?? 'Success Story'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, caseStudyTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Case Study Text</label>
              <textarea
                value={customTemplateData.customizations?.caseStudyText ?? 'Company X achieved 40% growth...'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, caseStudyText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={customTemplateData.customizations?.caseStudyCompany ?? 'Company X'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, caseStudyCompany: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* CTA Consultation */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Consultation CTA</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">CTA Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.ctaTitle ?? 'Schedule Your Free Consultation'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, ctaTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">CTA Subtitle</label>
              <input
                type="text"
                value={customTemplateData.customizations?.ctaSubtitle ?? 'Expert guidance tailored to your needs'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, ctaSubtitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.buttonText ?? 'Book Consultation'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                value={customTemplateData.customizations?.buttonUrl ?? 'https://calendly.com/consultation'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonUrl: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </>
      );
    }

    // Event Invitation: event_hero, agenda_timeline, speaker_showcase, registration_cta
    if (templateId === 'event_invitation') {
      return (
        <>
          {/* Event Hero */}
          <div className="mb-6 p-4 bg-pink-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Event Hero</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Event Title</label>
              <input
                type="text"
                value={customTemplateData.customizations?.eventTitle ?? 'Annual Summit 2024'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, eventTitle: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Event Date</label>
              <input
                type="text"
                value={customTemplateData.customizations?.eventDate ?? 'March 15-17, 2024'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, eventDate: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Agenda Timeline */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Agenda Timeline (3 Items)</h5>
            {[1, 2, 3].map((num) => (
              <div key={num} className="mb-3 p-2 bg-white rounded border border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">Time Slot {num}</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`agenda${num}Time`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`agenda${num}Time`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder="e.g., 9:00 AM"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Item {num} Title</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`agenda${num}Title`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`agenda${num}Title`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder="Session title"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Item {num} Description</label>
                <textarea
                  value={customTemplateData.customizations?.[`agenda${num}Description`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`agenda${num}Description`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  rows="2"
                  placeholder="Session description"
                />
              </div>
            ))}
          </div>

          {/* Speaker Showcase */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Speaker Showcase (2 Speakers)</h5>
            {[1, 2].map((num) => (
              <div key={num} className="mb-3 p-2 bg-white rounded border border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">Speaker {num} Name</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`speaker${num}Name`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`speaker${num}Name`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder="Speaker name"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Speaker {num} Title</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`speaker${num}Title`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`speaker${num}Title`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                  placeholder="Title & Company"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Speaker {num} Badge</label>
                <input
                  type="text"
                  value={customTemplateData.customizations?.[`speaker${num}Badge`] ?? ''}
                  onChange={(e) => setCustomTemplateData(prev => ({
                    ...prev,
                    customizations: { ...prev.customizations, [`speaker${num}Badge`]: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="e.g., Keynote Speaker"
                />
              </div>
            ))}
          </div>

          {/* Registration CTA */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-4">Registration CTA</h5>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">CTA Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.registrationCta ?? 'Reserve your spot today'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, registrationCta: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={customTemplateData.customizations?.buttonText ?? 'Register Now'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonText: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                value={customTemplateData.customizations?.buttonUrl ?? 'https://your-website.com/register'}
                onChange={(e) => setCustomTemplateData(prev => ({
                  ...prev,
                  customizations: { ...prev.customizations, buttonUrl: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </>
      );
    }

    // Default: return generic fields for unknown templates
    return (
      <>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Title
          </label>
          <input
            type="text"
            value={customTemplateData.customizations?.headerTitle ?? 'Transform Your Business'}
            onChange={(e) => setCustomTemplateData(prev => ({
              ...prev,
              customizations: { ...prev.customizations, headerTitle: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-semibold text-gray-700 mb-4">Button Configuration</h5>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
            <input
              type="text"
              value={customTemplateData.customizations?.buttonText ?? 'Learn More'}
              onChange={(e) => setCustomTemplateData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, buttonText: e.target.value }
              }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Button URL</label>
            <input
              type="url"
              value={customTemplateData.customizations?.buttonUrl ?? 'https://your-website.com'}
              onChange={(e) => setCustomTemplateData(prev => ({
                ...prev,
                customizations: { ...prev.customizations, buttonUrl: e.target.value }
              }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </>
    );
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      const template = EMAIL_TEMPLATES[selectedTemplate];
      // If template was customized, merge custom data
      const finalTemplate = isCustomizeMode && Object.keys(customTemplateData).length > 0
        ? { ...template, ...customTemplateData }
        : template;
      onSelectTemplate(finalTemplate);
      // 🔥 FIX: Pass template directly to avoid React state race condition
      onConfirm(finalTemplate);
      onClose();
    }
  };

  const renderTemplatePreview = (template) => {
    // Create a mini preview version of the HTML with consistent colors
    return (
      <div style={{
        fontSize: '10px',
        lineHeight: '1.2',
        color: '#343a40',
        backgroundColor: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        padding: '8px',
        height: '120px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: selectedTemplate === template.id ? '#28a745' : '#343a40',
          color: 'white',
          padding: '4px 6px',
          marginBottom: '4px',
          borderRadius: '2px',
          fontSize: '8px',
          textAlign: 'center'
        }}>
          {template.components?.includes('logo') && ' '}
          {template.components?.includes('header_banner') && ' '}
          {template.components?.includes('executive_header') && ' '}
          {template.components?.includes('product_hero') && ' '}
          {template.components?.includes('expert_header') && ' '}
          {template.components?.includes('event_hero') && ' '}
          HEADER
        </div>

        <div style={{ padding: '2px 4px', marginBottom: '3px' }}>
          <div style={{ height: '2px', backgroundColor: '#dee2e6', marginBottom: '2px' }}></div>
          <div style={{ height: '2px', backgroundColor: '#f8f9fa', marginBottom: '2px' }}></div>
          <div style={{ height: '2px', backgroundColor: '#dee2e6' }}></div>
        </div>

        {template.components?.includes('cta_button') && (
          <div style={{
            backgroundColor: '#28a745',
            height: '8px',
            margin: '3px 0',
            borderRadius: '2px'
          }}></div>
        )}

        {template.components?.includes('feature_grid') && (
          <div style={{
            display: 'flex',
            gap: '2px',
            marginBottom: '3px'
          }}>
            <div style={{ backgroundColor: '#28a745', height: '6px', flex: 1, borderRadius: '1px' }}></div>
            <div style={{ backgroundColor: '#28a745', height: '6px', flex: 1, borderRadius: '1px' }}></div>
          </div>
        )}

        <div style={{ padding: '2px 4px', marginBottom: '3px' }}>
          <div style={{ height: '1px', backgroundColor: '#dee2e6', marginBottom: '2px' }}></div>
          <div style={{ height: '1px', backgroundColor: '#f8f9fa', marginBottom: '2px' }}></div>
        </div>

        {template.components?.includes('testimonial') && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderLeft: '2px solid #28a745',
            height: '6px',
            margin: '2px 0'
          }}></div>
        )}

        {template.components?.includes('stats_showcase') && (
          <div style={{
            display: 'flex',
            gap: '1px',
            marginBottom: '2px'
          }}>
            <div style={{ backgroundColor: '#f8f9fa', height: '4px', flex: 1 }}></div>
            <div style={{ backgroundColor: '#f8f9fa', height: '4px', flex: 1 }}></div>
            <div style={{ backgroundColor: '#f8f9fa', height: '4px', flex: 1 }}></div>
          </div>
        )}

        <div style={{
          backgroundColor: '#f8f9fa',
          height: '4px',
          marginTop: 'auto',
          borderRadius: '0 0 2px 2px'
        }}></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Choose Email Template</h2>
            <p className="text-gray-600 mt-1">
              {templateRequest ?
                `Select a template for ${templateRequest.prospectsFound} prospects found. You can customize components and switch templates anytime.` :
                'Select a template for all emails in this campaign. You can customize components and switch templates anytime.'
              }
            </p>
            {templateRequest && templateRequest.sampleProspects && (
              <div className="mt-2 text-sm text-gray-500">
                Sample prospects: {templateRequest.sampleProspects.map(p => p.company).join(', ')}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
              <div
                key={key}
                className={`relative cursor-pointer transition-all duration-300 ${
                  selectedTemplate === key
                    ? 'ring-2 ring-green-500 shadow-lg transform scale-105'
                    : 'hover:shadow-md hover:scale-102'
                } bg-white border border-gray-200 rounded-lg overflow-hidden`}
                onClick={() => handleTemplateSelect(key)}
              >
                {/* Template Preview */}
                <div className="p-4 bg-gray-50">
                  {renderTemplatePreview(template)}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">{template.name}</h3>
                    {selectedTemplate === key && (
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>

                  {/* Template Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{template.structure.paragraphs} paragraphs</span>
                    <span>{template.structure.components.length} components</span>
                  </div>

                  {/* Components Preview */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.structure.components.slice(0, 3).map((component, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {component.replace('_', ' ')}
                      </span>
                    ))}
                    {template.structure.components.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{template.structure.components.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handlePreview(key, e)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={14} />
                      Preview
                    </button>
                    {selectedTemplate === key && (
                      <button
                        onClick={(e) => handleCustomize(key, e)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        <Edit3 size={14} />
                        Customize
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedTemplate ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Selected: <strong>{EMAIL_TEMPLATES[selectedTemplate]?.name}</strong></span>
              </div>
            ) : (
              'Select a template to continue'
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTemplate || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
                selectedTemplate && !isSubmitting
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap size={16} />
              {isSubmitting ? 'Applying Template...' : 'Use This Template'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {selectedTemplate && !isPreviewMode && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <Check size={16} />
              Template selected! All emails will use this design.
            </div>
          </div>
        )}

        {/* Full Preview Modal Overlay */}
        {isPreviewMode && selectedTemplate && (
          <div className="absolute inset-0 bg-white rounded-xl flex flex-col z-50">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPreviewMode(false);
                    setHoveredTemplate(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-xl font-semibold">
                  {EMAIL_TEMPLATES[selectedTemplate]?.name} - Full Preview
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewMode(false);
                  const template = EMAIL_TEMPLATES[selectedTemplate];
                  if (onSelectTemplate) {
                    onSelectTemplate(template);
                  }
                  if (onConfirm) {
                    // 🔥 FIX: Pass template directly to avoid React state race condition
                    onConfirm(template);
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Zap size={16} />
                Use This Template
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-8">
                  {/* Email Subject */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Subject Line:</label>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-gray-800">
                        Revolutionizing [Company Name] with AI-Powered Solutions
                      </p>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Email Content Preview:</label>
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <div className="space-y-4">
                        {/* Header Banner for templates that have it */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('header_banner') && (
                          <div className="-m-6 mb-6">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-t-lg">
                              <h2 className="text-2xl font-bold mb-2">Transform Your Business with AI</h2>
                              <p className="text-green-100">Cutting-edge solutions tailored for your industry</p>
                            </div>
                          </div>
                        )}

                        {/* Executive Header for executive templates */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('executive_header') && (
                          <div className="border-b-2 border-green-500 pb-4 mb-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">Executive Partnership Proposal</h3>
                                <p className="text-sm text-gray-600">Confidential • Strategic Initiative</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Priority: High</p>
                                <p className="text-xs text-gray-400">Response Time: 24-48 hrs</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Greeting */}
                        <div>
                          <p className="text-gray-700">Dear Sarah Johnson,</p>
                        </div>

                        {/* Opening Paragraph */}
                        <div>
                          <p className="text-gray-700 leading-relaxed">
                            I noticed that TechCorp Industries has been pioneering innovative solutions in the Food Technology sector.
                            Your recent expansion into AI-driven quality control particularly caught my attention, as it aligns perfectly
                            with our expertise in advanced machine learning applications.
                          </p>
                        </div>

                        {/* Product Hero for product launch templates */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('product_hero') && (
                          <div className="my-6 p-6 bg-gradient-to-br from-gray-50 to-green-50 rounded-lg border border-gray-200">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl"></span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">Introducing FoodAI Pro 2.0</h3>
                              <p className="text-gray-600">Revolutionary AI-Powered Food Safety Analysis</p>
                              <div className="mt-4 flex justify-center gap-4">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">99.9% Accuracy</span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Real-time Analysis</span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">FDA Compliant</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Feature Grid */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('feature_grid') && (
                          <div className="my-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Benefits for TechCorp:</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-600 text-sm"></span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 mb-1">40% Cost Reduction</div>
                                    <p className="text-sm text-gray-600">Automate quality control processes</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-600 text-sm"></span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 mb-1">10x Faster Analysis</div>
                                    <p className="text-sm text-gray-600">Real-time contamination detection</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-600 text-sm"></span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 mb-1">100% Compliance</div>
                                    <p className="text-sm text-gray-600">Meet all FDA & USDA standards</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-600 text-sm"></span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 mb-1">Global Scalability</div>
                                    <p className="text-sm text-gray-600">Deploy across all facilities</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Case Study for consultative templates */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('case_study') && (
                          <div className="my-6 p-5 bg-white border-2 border-green-200 rounded-lg">
                            <div className="flex items-start gap-2 mb-3">
                              <span className="text-green-600 text-lg"></span>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">Success Story: GlobalFoods Inc.</h4>
                                <p className="text-sm text-gray-600 mt-2">
                                  Similar to TechCorp, GlobalFoods faced challenges with manual quality control processes.
                                  After implementing our solution:
                                </p>
                                <ul className="mt-3 space-y-2">
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1"></span>
                                    <span className="text-sm text-gray-700">Reduced inspection time from 4 hours to 15 minutes</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1"></span>
                                    <span className="text-sm text-gray-700">Prevented 3 major contamination incidents</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1"></span>
                                    <span className="text-sm text-gray-700">ROI achieved in just 6 months</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stats Showcase */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('stats_showcase') && (
                          <div className="my-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Why Industry Leaders Choose Us</h4>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">500+</div>
                                <div className="text-xs text-gray-600">Enterprise Clients</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">99.9%</div>
                                <div className="text-xs text-gray-600">Uptime SLA</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">24/7</div>
                                <div className="text-xs text-gray-600">Expert Support</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">45%</div>
                                <div className="text-xs text-gray-600">Avg. Cost Savings</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Main Content Paragraphs */}
                        <div className="space-y-3">
                          <p className="text-gray-700 leading-relaxed">
                            Our AI-powered food safety platform has already helped 50+ companies in your industry achieve
                            unprecedented levels of quality control efficiency. Given TechCorp's commitment to innovation,
                            I believe we could deliver even more impressive results for your operations.
                          </p>

                          {EMAIL_TEMPLATES[selectedTemplate]?.structure?.paragraphs >= 3 && (
                            <p className="text-gray-700 leading-relaxed">
                              What sets us apart is our proprietary machine learning algorithm that continuously learns from
                              your specific production patterns, becoming more accurate over time. This means the system adapts
                              to TechCorp's unique requirements rather than forcing you into a one-size-fits-all solution.
                            </p>
                          )}

                          {EMAIL_TEMPLATES[selectedTemplate]?.structure?.paragraphs >= 4 && (
                            <p className="text-gray-700 leading-relaxed">
                              I've prepared a customized ROI analysis specifically for TechCorp, showing how our solution
                              could save you approximately $2.3M annually while improving product quality scores by 35%.
                              This analysis is based on similar implementations with companies of your scale and complexity.
                            </p>
                          )}
                        </div>

                        {/* Testimonial */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('testimonial') && (
                          <div className="my-6">
                            <div className="bg-gray-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                              <p className="text-gray-700 italic mb-3">
                                "FoodAI Pro transformed our quality control process. We've reduced contamination incidents by 89%
                                and saved over $3M in the first year alone. It's not just a tool; it's a competitive advantage."
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">Michael Chen</p>
                                  <p className="text-xs text-gray-600">VP of Operations, FreshTech Foods</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CTA Button */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('cta_button') && (
                          <div className="my-6 text-center">
                            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 transform hover:scale-105">
                              Schedule Your Personalized Demo →
                            </button>
                            <p className="text-xs text-gray-500 mt-2">Takes only 15 minutes • See ROI instantly</p>
                          </div>
                        )}

                        {/* Event Components for event templates */}
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.includes('event_hero') && (
                          <div className="my-6 p-6 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                            <div className="text-center">
                              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mb-3">
                                <span></span> Limited Seats Available
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">FoodTech Innovation Summit 2024</h3>
                              <p className="text-gray-600 mb-4">Join 200+ industry leaders transforming food safety with AI</p>
                              <div className="flex justify-center gap-6 text-sm">
                                <div><span className="font-semibold"></span> San Francisco, CA</div>
                                <div><span className="font-semibold"></span> March 15-17, 2024</div>
                                <div><span className="font-semibold"></span> VIP Pass Included</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Closing Paragraph */}
                        <div className="space-y-3">
                          <p className="text-gray-700 leading-relaxed">
                            I'd love to show you exactly how our platform can address TechCorp's specific challenges.
                            Would you have 15 minutes this week for a brief call? I can demonstrate the ROI calculator
                            and show you a live demo tailored to your production environment.
                          </p>

                          <p className="text-gray-700">
                            Looking forward to partnering with TechCorp in revolutionizing food safety.
                          </p>
                        </div>

                        {/* Signature */}
                        <div className="mt-6 pt-4">
                          <p className="text-gray-700">
                            Best regards,
                          </p>
                          <div className="mt-3">
                            <p className="font-semibold text-gray-900">James Wilson</p>
                            <p className="text-sm text-gray-600">Strategic Account Executive</p>
                            <p className="text-sm text-gray-600">FoodAI Technologies</p>
                            <div className="mt-2 text-sm text-gray-500">
                              <p> james.wilson@foodai.com</p>
                              <p> +1 (555) 123-4567</p>
                              <p> www.foodai.com/demo</p>
                            </div>
                          </div>
                        </div>

                        {/* PS Section */}
                        <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">P.S.</span> I noticed TechCorp is exhibiting at the FoodTech Expo next month.
                            I'll be there too - perhaps we could meet in person? I'll have our latest hardware demo unit with me.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-green-600">
                        {EMAIL_TEMPLATES[selectedTemplate]?.conversionRate}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Avg. Response Rate</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.paragraphs}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Paragraphs</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-purple-600">
                        {EMAIL_TEMPLATES[selectedTemplate]?.structure?.components?.length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Components</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customize Modal Overlay */}
        {isCustomizeMode && selectedTemplate && (
          <div className="absolute inset-0 bg-white rounded-xl flex flex-col z-50">
            {/* Customize Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCustomizeMode(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-xl font-semibold">
                  Customize {EMAIL_TEMPLATES[selectedTemplate]?.name}
                </h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCustomizeMode(false);
                  if (onSelectTemplate) {
                    const template = EMAIL_TEMPLATES[selectedTemplate];
                    const finalTemplate = Object.keys(customTemplateData).length > 0
                      ? { ...template, ...customTemplateData }
                      : template;
                    onSelectTemplate(finalTemplate);
                  }
                  if (onConfirm) {
                    // 🔥 FIX: Pass template directly to avoid React state race condition
                    const template = EMAIL_TEMPLATES[selectedTemplate];
                    const finalTemplate = Object.keys(customTemplateData).length > 0
                      ? { ...template, ...customTemplateData }
                      : template;
                    onConfirm(finalTemplate);
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Zap size={16} />
                Use Customized Template
              </button>
            </div>

            {/* Customize Content */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 h-full">
                {/* Left Panel - Controls */}
                <div className="overflow-y-auto p-6 border-r border-gray-200">
                  <h4 className="text-lg font-semibold mb-6">Template Properties</h4>

                  {/* Email Subject */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      value={customTemplateData.subject || EMAIL_TEMPLATES[selectedTemplate]?.subject || 'Partnership Opportunity with {company}'}
                      onChange={(e) => setCustomTemplateData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter email subject..."
                    />
                  </div>

                  {/* Greeting */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Greeting
                    </label>
                    <input
                      type="text"
                      value={customTemplateData.greeting || 'Hi {name},'}
                      onChange={(e) => setCustomTemplateData(prev => ({ ...prev, greeting: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Hi {name},"
                    />
                  </div>

                  {/* Color Scheme */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="space-y-3">
                      {/* Color Picker Input */}
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={customTemplateData.customizations?.primaryColor ?? '#10b981'}
                          onChange={(e) => setCustomTemplateData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              primaryColor: e.target.value
                            }
                          }))}
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customTemplateData.customizations?.primaryColor ?? '#10b981'}
                          onChange={(e) => setCustomTemplateData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              primaryColor: e.target.value
                            }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="#10b981"
                        />
                      </div>
                      {/* Preset Colors */}
                      <div className="flex gap-2">
                        {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280', '#000000', '#ffffff'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setCustomTemplateData(prev => ({
                              ...prev,
                              customizations: {
                                ...prev.customizations,
                                primaryColor: color
                              }
                            }))}
                            className={`w-6 h-6 rounded-full border-2 ${
                              customTemplateData.customizations?.primaryColor === color
                                ? 'border-gray-800'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Template-Specific Fields */}
                  {renderTemplateSpecificFields(selectedTemplate)}

                  {/* Signature */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Signature
                    </label>
                    <textarea
                      value={customTemplateData.signature || 'Best regards,\\n{senderName}\\n{company}'}
                      onChange={(e) => setCustomTemplateData(prev => ({ ...prev, signature: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows="3"
                      placeholder="Email signature..."
                    />
                  </div>

                  {/* Custom Media Upload & Positioning */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Custom Media Gallery
                    </h5>
                    <p className="text-xs text-gray-600 mb-3">Upload images and drag to position them in your email</p>

                    {/* Upload Button */}
                    <label className="block mb-4">
                      <div className="flex items-center justify-center w-full px-4 py-3 bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-green-500 transition-all">
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-semibold text-green-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            files.forEach(file => {
                              if (file.size > 5 * 1024 * 1024) {
                                alert('File size must be less than 5MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCustomTemplateData(prev => ({
                                  ...prev,
                                  customizations: {
                                    ...prev.customizations,
                                    customMedia: [
                                      ...(prev.customizations?.customMedia || []),
                                      {
                                        id: Date.now() + Math.random(),
                                        url: reader.result,
                                        position: 'middle',
                                        width: '400px',
                                        alignment: 'center'
                                      }
                                    ]
                                  }
                                }));
                              };
                              reader.readAsDataURL(file);
                            });
                          }}
                        />
                      </div>
                    </label>

                    {/* Uploaded Media List with Positioning */}
                    {customTemplateData.customizations?.customMedia?.length > 0 && (
                      <div className="space-y-3">
                        {customTemplateData.customizations.customMedia.map((media, index) => (
                          <div
                            key={media.id}
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('mediaIndex', index.toString());
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedIndex = parseInt(e.dataTransfer.getData('mediaIndex'));
                              if (draggedIndex === index) return;

                              const newMedia = [...customTemplateData.customizations.customMedia];
                              const [draggedItem] = newMedia.splice(draggedIndex, 1);
                              newMedia.splice(index, 0, draggedItem);

                              setCustomTemplateData(prev => ({
                                ...prev,
                                customizations: {
                                  ...prev.customizations,
                                  customMedia: newMedia
                                }
                              }));
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Drag Handle */}
                              <div className="cursor-move text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"></path>
                                </svg>
                              </div>

                              {/* Preview */}
                              <img
                                src={media.url}
                                alt={`Media ${index + 1}`}
                                className="h-16 w-16 object-cover rounded"
                              />

                              {/* Controls */}
                              <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                  <select
                                    value={media.position}
                                    onChange={(e) => {
                                      const newMedia = [...customTemplateData.customizations.customMedia];
                                      newMedia[index].position = e.target.value;
                                      setCustomTemplateData(prev => ({
                                        ...prev,
                                        customizations: {
                                          ...prev.customizations,
                                          customMedia: newMedia
                                        }
                                      }));
                                    }}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="top">Top</option>
                                    <option value="middle">Middle</option>
                                    <option value="bottom">Bottom</option>
                                  </select>

                                  <select
                                    value={media.width}
                                    onChange={(e) => {
                                      const newMedia = [...customTemplateData.customizations.customMedia];
                                      newMedia[index].width = e.target.value;
                                      setCustomTemplateData(prev => ({
                                        ...prev,
                                        customizations: {
                                          ...prev.customizations,
                                          customMedia: newMedia
                                        }
                                      }));
                                    }}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="200px">Small</option>
                                    <option value="400px">Medium</option>
                                    <option value="600px">Large</option>
                                    <option value="100%">Full Width</option>
                                  </select>

                                  <select
                                    value={media.alignment}
                                    onChange={(e) => {
                                      const newMedia = [...customTemplateData.customizations.customMedia];
                                      newMedia[index].alignment = e.target.value;
                                      setCustomTemplateData(prev => ({
                                        ...prev,
                                        customizations: {
                                          ...prev.customizations,
                                          customMedia: newMedia
                                        }
                                      }));
                                    }}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Drag to reorder • Position: {media.position}
                                </div>
                              </div>

                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  const newMedia = customTemplateData.customizations.customMedia.filter((_, i) => i !== index);
                                  setCustomTemplateData(prev => ({
                                    ...prev,
                                    customizations: {
                                      ...prev.customizations,
                                      customMedia: newMedia
                                    }
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Styling Controls */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-700 mb-4">Text Styling</h5>

                    {/* Text Size */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Size
                      </label>
                      <select
                        value={customTemplateData.customizations?.textSize ?? '16px'}
                        onChange={(e) => setCustomTemplateData(prev => ({
                          ...prev,
                          customizations: {
                            ...prev.customizations,
                            textSize: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="12px">Small (12px)</option>
                        <option value="14px">Normal (14px)</option>
                        <option value="16px">Medium (16px)</option>
                        <option value="18px">Large (18px)</option>
                        <option value="20px">Extra Large (20px)</option>
                        <option value="24px">Huge (24px)</option>
                      </select>
                    </div>

                    {/* Text Style */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Style
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCustomTemplateData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              fontWeight: prev.customizations?.fontWeight === 'bold' ? 'normal' : 'bold'
                            }
                          }))}
                          className={`px-3 py-1 text-sm border rounded ${
                            customTemplateData.customizations?.fontWeight === 'bold'
                              ? 'bg-gray-700 text-white border-gray-700'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          <strong>Bold</strong>
                        </button>
                        <button
                          onClick={() => setCustomTemplateData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              fontStyle: prev.customizations?.fontStyle === 'italic' ? 'normal' : 'italic'
                            }
                          }))}
                          className={`px-3 py-1 text-sm border rounded ${
                            customTemplateData.customizations?.fontStyle === 'italic'
                              ? 'bg-gray-700 text-white border-gray-700'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          <em>Italic</em>
                        </button>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={customTemplateData.customizations?.textColor ?? '#000000'}
                          onChange={(e) => setCustomTemplateData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              textColor: e.target.value
                            }
                          }))}
                          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customTemplateData.customizations?.textColor ?? '#000000'}
                          onChange={(e) => setCustomTemplateData(prev => ({
                            ...prev,
                            customizations: {
                              ...prev.customizations,
                              textColor: e.target.value
                            }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="#000000"
                        />
                      </div>
                      {/* Preset Text Colors */}
                      <div className="flex gap-2 mt-2">
                        {['#000000', '#333333', '#666666', '#999999', '#ffffff', '#ff0000', '#00ff00', '#0000ff'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setCustomTemplateData(prev => ({
                              ...prev,
                              customizations: {
                                ...prev.customizations,
                                textColor: color
                              }
                            }))}
                            className={`w-5 h-5 rounded border-2 ${
                              customTemplateData.customizations?.textColor === color
                                ? 'border-gray-800'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Live Preview */}
                <div className="overflow-y-auto p-6 bg-white">
                  <h4 className="text-lg font-semibold mb-6">Live Preview</h4>

                  <EmailTemplateRenderer
                    templateId={selectedTemplate}
                    customizations={customTemplateData}
                    isEditable={true}
                    onEdit={handleInlineEdit}
                    sampleData={{
                      name: 'Sarah',
                      company: 'TechCorp',
                      senderName: 'James Wilson',
                      senderCompany: 'Your Company'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelectionModal;