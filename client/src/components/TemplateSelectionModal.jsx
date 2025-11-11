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
  const [draggedMedia, setDraggedMedia] = useState(null);
  const [dropZoneActive, setDropZoneActive] = useState(null);

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
        customMedia: [],  // 📸 Array of { id, url, insertAfter: 'component-id' | 'start' | 'end', width, alignment }
        customComponents: []  // 🧩 For custom_template: Array of { id, type: 'logo'|'greeting'|'paragraph'|'cta'|'testimonial', properties: {} }
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

  // 🧩 Helper: Get default properties for component type
  const getDefaultPropertiesForComponent = (type) => {
    switch (type) {
      case 'logo':
        return { logoUrl: '', subtitle: 'Your Company Name' };
      case 'greeting':
        return { text: 'Hi {name},' };
      case 'paragraph':
        return { text: 'Enter your text here...', alignment: 'left' };
      case 'cta':
        return { text: 'Get Started', url: 'https://your-website.com', color: '#10b981' };
      case 'testimonial':
        return { quote: '"This product changed our business forever."', author: 'Jane Doe, CEO at Company' };
      case 'features':
        return {
          feature1Title: 'Feature 1', feature1Description: 'Description',
          feature2Title: 'Feature 2', feature2Description: 'Description',
          feature3Title: 'Feature 3', feature3Description: 'Description',
          feature4Title: 'Feature 4', feature4Description: 'Description'
        };
      case 'stats':
        return {
          stat1Value: '500+', stat1Label: 'Happy Clients',
          stat2Value: '99.9%', stat2Label: 'Uptime',
          stat3Value: '24/7', stat3Label: 'Support'
        };
      case 'countdown':
        return { eventDate: '2025-12-31', eventName: 'Special Event' };
      case 'banner':
        return { title: 'Welcome!', subtitle: 'Discover our amazing products', color: '#10b981' };
      default:
        return {};
    }
  };

  // 🧩 Helper: Render property editor for component
  const renderComponentPropertiesEditor = (component, index) => {
    const updateProperty = (key, value) => {
      const newComponents = [...customTemplateData.customizations.customComponents];
      newComponents[index].properties[key] = value;
      setCustomTemplateData(prev => ({
        ...prev,
        customizations: { ...prev.customizations, customComponents: newComponents }
      }));
    };

    switch (component.type) {
      case 'logo':
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Logo URL</label>
            <input
              type="text"
              value={component.properties.logoUrl || ''}
              onChange={(e) => updateProperty('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <label className="block text-xs font-medium text-gray-600">Subtitle</label>
            <input
              type="text"
              value={component.properties.subtitle || ''}
              onChange={(e) => updateProperty('subtitle', e.target.value)}
              placeholder="Your Company Name"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        );

      case 'greeting':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Greeting Text</label>
            <input
              type="text"
              value={component.properties.text || ''}
              onChange={(e) => updateProperty('text', e.target.value)}
              placeholder="Hi {name},"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        );

      case 'paragraph':
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Text Content</label>
            <textarea
              value={component.properties.text || ''}
              onChange={(e) => updateProperty('text', e.target.value)}
              placeholder="Enter your text here..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              rows="3"
            />
            <label className="block text-xs font-medium text-gray-600">Alignment</label>
            <select
              value={component.properties.alignment || 'left'}
              onChange={(e) => updateProperty('alignment', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Button Text</label>
            <input
              type="text"
              value={component.properties.text || ''}
              onChange={(e) => updateProperty('text', e.target.value)}
              placeholder="Get Started"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <label className="block text-xs font-medium text-gray-600">Button URL</label>
            <input
              type="text"
              value={component.properties.url || ''}
              onChange={(e) => updateProperty('url', e.target.value)}
              placeholder="https://your-website.com"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <label className="block text-xs font-medium text-gray-600">Button Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={component.properties.color || '#10b981'}
                onChange={(e) => updateProperty('color', e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={component.properties.color || '#10b981'}
                onChange={(e) => updateProperty('color', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Quote</label>
            <textarea
              value={component.properties.quote || ''}
              onChange={(e) => updateProperty('quote', e.target.value)}
              placeholder='"This product changed our business forever."'
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              rows="2"
            />
            <label className="block text-xs font-medium text-gray-600">Author</label>
            <input
              type="text"
              value={component.properties.author || ''}
              onChange={(e) => updateProperty('author', e.target.value)}
              placeholder="Jane Doe, CEO at Company"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        );

      case 'features':
        return (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="p-2 bg-gray-50 rounded">
                <label className="block text-xs font-medium text-gray-600 mb-1">Feature {num} Title</label>
                <input
                  type="text"
                  value={component.properties[`feature${num}Title`] || ''}
                  onChange={(e) => updateProperty(`feature${num}Title`, e.target.value)}
                  placeholder={`Feature ${num}`}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-1"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={component.properties[`feature${num}Description`] || ''}
                  onChange={(e) => updateProperty(`feature${num}Description`, e.target.value)}
                  placeholder="Description"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-3">
            {[1, 2, 3].map(num => (
              <div key={num} className="p-2 bg-gray-50 rounded">
                <label className="block text-xs font-medium text-gray-600 mb-1">Stat {num} Value</label>
                <input
                  type="text"
                  value={component.properties[`stat${num}Value`] || ''}
                  onChange={(e) => updateProperty(`stat${num}Value`, e.target.value)}
                  placeholder={num === 1 ? '500+' : num === 2 ? '99.9%' : '24/7'}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-1"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={component.properties[`stat${num}Label`] || ''}
                  onChange={(e) => updateProperty(`stat${num}Label`, e.target.value)}
                  placeholder={num === 1 ? 'Happy Clients' : num === 2 ? 'Uptime' : 'Support'}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Event Date</label>
            <input
              type="date"
              value={component.properties.eventDate || ''}
              onChange={(e) => updateProperty('eventDate', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <label className="block text-xs font-medium text-gray-600">Event Name</label>
            <input
              type="text"
              value={component.properties.eventName || ''}
              onChange={(e) => updateProperty('eventName', e.target.value)}
              placeholder="Special Event"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        );

      case 'banner':
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Title</label>
            <input
              type="text"
              value={component.properties.title || ''}
              onChange={(e) => updateProperty('title', e.target.value)}
              placeholder="Welcome!"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <label className="block text-xs font-medium text-gray-600">Subtitle</label>
            <input
              type="text"
              value={component.properties.subtitle || ''}
              onChange={(e) => updateProperty('subtitle', e.target.value)}
              placeholder="Discover our amazing products"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <label className="block text-xs font-medium text-gray-600">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={component.properties.color || '#10b981'}
                onChange={(e) => updateProperty('color', e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={component.properties.color || '#10b981'}
                onChange={(e) => updateProperty('color', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
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
    const isSelected = selectedTemplate === template.id;
    const accentColor = '#00f5a0'; // Always use brand green

    // Common wrapper style for all previews - REDUCED SIZE
    const previewWrapper = {
      width: '100%',
      height: '340px',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: 'white',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '8px'
    };

    const emailContainer = {
      transform: 'scale(0.45)',
      transformOrigin: 'top center',
      width: '600px',
      fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
      backgroundColor: 'white',
      boxShadow: isSelected
        ? '0 25px 70px rgba(0,245,160,0.3), 0 10px 25px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
        : '0 15px 50px rgba(0,245,160,0.18), 0 5px 15px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
      border: `3px solid ${isSelected ? accentColor : 'rgba(0,245,160,0.35)'}`,
      borderRadius: '20px',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(20px)'
    };

    // Professional Partnership - Live Preview (ENHANCED)
    if (template.id === 'professional_partnership') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ textAlign: 'center', padding: '32px 40px', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 50%, rgba(0,245,160,0.85) 100%)`, borderBottom: `4px solid ${accentColor}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
              <div style={{ width: '160px', height: '52px', backgroundColor: 'white', margin: '0 auto', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontWeight: '900', fontSize: '20px', letterSpacing: '1px', boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)', position: 'relative', border: '2px solid rgba(0,245,160,0.2)' }}>COMPANY</div>
              <p style={{ margin: '18px 0 0', color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '0.3px', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>Building Strategic Partnerships</p>
            </div>
            <div style={{ padding: '50px 40px', background: 'linear-gradient(to bottom, white 0%, rgba(248,250,252,1) 100%)' }}>
              <h2 style={{ color: '#0f172a', margin: '0 0 28px', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: '1.2' }}>Hello John!</h2>
              <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#475569', margin: '0 0 28px', fontWeight: '500' }}>
                I noticed your company's innovative work in transforming the industry landscape...
              </p>
              <div style={{ textAlign: 'center', margin: '42px 0' }}>
                <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 100%)`, color: '#0f172a', padding: '18px 42px', borderRadius: '14px', fontWeight: '800', fontSize: '18px', boxShadow: `0 12px 32px rgba(0,245,160,0.45), 0 4px 12px rgba(0,245,160,0.25)`, letterSpacing: '0.3px', border: '2px solid rgba(255,255,255,0.3)' }}>
                  Schedule Meeting
                </div>
              </div>
              <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#475569', margin: '28px 0', fontWeight: '500' }}>
                We'd love to explore strategic partnership opportunities that drive mutual growth...
              </p>
              <div style={{ background: `linear-gradient(120deg, rgba(0,245,160,0.12) 0%, rgba(0,217,145,0.08) 50%, white 100%)`, borderLeft: `6px solid ${accentColor}`, padding: '24px 28px', margin: '35px 0', borderRadius: '0 16px 16px 0', boxShadow: '0 6px 20px rgba(0,245,160,0.15), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                <p style={{ margin: '0', fontStyle: 'italic', color: '#1e293b', fontSize: '17px', fontWeight: '600', lineHeight: '1.6' }}>
                  "Great results from our partnership exceeded all expectations" <span style={{ color: '#64748b', fontWeight: '500', display: 'block', marginTop: '8px', fontSize: '15px' }}>— CEO, Fortune 500 Company</span>
                </p>
              </div>
            </div>
            <div style={{ padding: '28px 40px', background: `linear-gradient(to bottom, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)`, borderTop: `3px solid ${accentColor}` }}>
              <p style={{ margin: '0', color: '#64748b', fontSize: '16px', lineHeight: '1.7', fontWeight: '500' }}>
                Best regards,<br/><strong style={{ color: '#0f172a', fontSize: '17px', fontWeight: '700' }}>James Anderson</strong><br/><span style={{ color: '#94a3b8', fontSize: '14px' }}>Strategic Partnerships Director</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Modern Tech - Live Preview (ENHANCED)
    if (template.id === 'modern_tech') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 50%, #00c785 100%)`, padding: '50px 40px', textAlign: 'center', borderBottom: `4px solid ${accentColor}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
              <h1 style={{ margin: '0 0 14px', fontSize: '36px', fontWeight: '900', color: 'white', textShadow: '0 4px 16px rgba(0,0,0,0.2)', letterSpacing: '-1px', position: 'relative' }}>Transform Your Business</h1>
              <p style={{ margin: '0', fontSize: '18px', color: 'rgba(255,255,255,0.95)', fontWeight: '700', letterSpacing: '0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>Next-Generation AI Solutions</p>
            </div>
            <div style={{ padding: '45px 40px', background: 'linear-gradient(to bottom, white 0%, rgba(250,251,252,1) 100%)' }}>
              <p style={{ fontSize: '19px', lineHeight: '1.85', color: '#334155', margin: '0 0 32px', fontWeight: '500' }}>
                Harness the power of cutting-edge AI to revolutionize your operations and accelerate growth...
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '35px 0', padding: '35px 30px', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 50%, #00c785 100%)`, borderRadius: '18px', color: '#0f172a', boxShadow: `0 16px 48px rgba(0,245,160,0.35), 0 4px 12px rgba(0,245,160,0.2)`, border: '3px solid rgba(255,255,255,0.3)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', fontWeight: '900', marginBottom: '12px', textShadow: '0 2px 8px rgba(0,0,0,0.15)', letterSpacing: '-1px' }}>10x</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '0.5px' }}>Faster Results</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', fontWeight: '900', marginBottom: '12px', textShadow: '0 2px 8px rgba(0,0,0,0.15)', letterSpacing: '-1px' }}>40%</div>
                  <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '0.5px' }}>Cost Savings</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '38px 0 0' }}>
                <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 100%)`, color: '#0f172a', padding: '20px 48px', borderRadius: '16px', fontWeight: '800', fontSize: '19px', boxShadow: `0 14px 36px rgba(0,245,160,0.45), 0 4px 12px rgba(0,245,160,0.25)`, letterSpacing: '0.3px', border: '2px solid rgba(255,255,255,0.4)' }}>
                  Start Free Trial →
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Executive Outreach - Live Preview (ENHANCED)
    if (template.id === 'executive_outreach') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ borderBottom: `5px solid ${accentColor}`, paddingBottom: '24px', padding: '38px 40px 24px', background: `linear-gradient(to bottom, white 0%, rgba(248,250,252,1) 100%)`, boxShadow: 'inset 0 -1px 0 rgba(0,245,160,0.1)' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.7px', lineHeight: '1.2' }}>Strategic Partnership Proposal</div>
            </div>
            <div style={{ padding: '45px 40px', background: 'linear-gradient(to bottom, white 0%, rgba(250,251,252,1) 100%)' }}>
              <p style={{ fontSize: '18px', color: '#64748b', margin: '0 0 24px', fontWeight: '600' }}>Dear Mr. Johnson,</p>
              <p style={{ fontSize: '19px', lineHeight: '1.85', color: '#334155', margin: '0 0 32px', fontWeight: '500' }}>
                Our comprehensive analysis reveals significant synergies between our organizations, presenting unprecedented opportunities for strategic collaboration...
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', margin: '35px 0', padding: '30px 25px', background: `linear-gradient(135deg, rgba(0,245,160,0.15) 0%, rgba(0,217,145,0.08) 100%)`, borderRadius: '16px', border: `3px solid rgba(0,245,160,0.35)`, boxShadow: '0 8px 24px rgba(0,245,160,0.18)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '34px', fontWeight: '900', color: '#00f5a0', marginBottom: '10px', textShadow: '0 3px 12px rgba(0,245,160,0.25)', letterSpacing: '-1px' }}>$2.5M</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', letterSpacing: '0.3px' }}>Revenue</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '34px', fontWeight: '900', color: '#00f5a0', marginBottom: '10px', textShadow: '0 3px 12px rgba(0,245,160,0.25)', letterSpacing: '-1px' }}>150%</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', letterSpacing: '0.3px' }}>Growth</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '34px', fontWeight: '900', color: '#00f5a0', marginBottom: '10px', textShadow: '0 3px 12px rgba(0,245,160,0.25)', letterSpacing: '-1px' }}>45K</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', letterSpacing: '0.3px' }}>Users</div>
                </div>
              </div>
              <div style={{ background: `linear-gradient(120deg, rgba(0,245,160,0.12) 0%, rgba(0,217,145,0.06) 50%, white 100%)`, borderLeft: `6px solid ${accentColor}`, padding: '24px 28px', margin: '35px 0', borderRadius: '0 16px 16px 0', boxShadow: '0 6px 20px rgba(0,245,160,0.18), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                <p style={{ margin: '0', fontStyle: 'italic', color: '#1e293b', fontSize: '17px', fontWeight: '600', lineHeight: '1.7' }}>
                  "Strategic vision aligned perfectly with our long-term objectives" <span style={{ color: '#64748b', fontWeight: '500', display: 'block', marginTop: '8px', fontSize: '15px' }}>— Board Member, Global Fortune 100</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Product Launch - Live Preview (ENHANCED)
    if (template.id === 'product_launch') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 50%, #00c785 100%)`, padding: '55px 40px', textAlign: 'center', color: 'white', boxShadow: 'inset 0 -2px 20px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
              <div style={{ fontSize: '48px', marginBottom: '18px', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))', position: 'relative' }}>🚀</div>
              <h1 style={{ margin: '0 0 14px', fontSize: '36px', fontWeight: '900', textShadow: '0 4px 16px rgba(0,0,0,0.2)', letterSpacing: '-1px', position: 'relative' }}>Exclusive Launch</h1>
              <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>Be the first to experience innovation</p>
            </div>
            <div style={{ padding: '45px 40px', background: 'linear-gradient(to bottom, white 0%, rgba(250,251,252,1) 100%)' }}>
              <p style={{ fontSize: '19px', lineHeight: '1.85', color: '#334155', margin: '0 0 32px', fontWeight: '500' }}>
                Revolutionary new platform launching next week with unprecedented capabilities to transform your workflow...
              </p>
              <div style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 50%, #00c785 100%)`, borderRadius: '18px', padding: '35px 30px', color: '#0f172a', textAlign: 'center', margin: '35px 0', boxShadow: `0 18px 48px rgba(0,245,160,0.4), 0 6px 16px rgba(0,245,160,0.2)`, border: '3px solid rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: '17px', marginBottom: '14px', fontWeight: '800', letterSpacing: '1.5px', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>LIMITED SPOTS</div>
                <div style={{ fontSize: '52px', fontWeight: '900', letterSpacing: '-2px', textShadow: '0 3px 12px rgba(0,0,0,0.15)' }}>50 Only</div>
              </div>
              <div style={{ textAlign: 'center', margin: '38px 0 0' }}>
                <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 100%)`, color: '#0f172a', padding: '20px 48px', borderRadius: '16px', fontWeight: '800', fontSize: '19px', boxShadow: `0 14px 36px rgba(0,245,160,0.45), 0 4px 12px rgba(0,245,160,0.25)`, letterSpacing: '0.3px', border: '2px solid rgba(255,255,255,0.4)' }}>
                  Get Early Access →
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Consultative Sales - Live Preview (ENHANCED)
    if (template.id === 'consultative_sales') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ padding: '38px 40px', borderBottom: `5px solid ${accentColor}`, background: `linear-gradient(to bottom, white 0%, rgba(248,250,252,1) 100%)`, boxShadow: 'inset 0 -1px 0 rgba(0,245,160,0.1)' }}>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.6px' }}>Strategic Assessment Invitation</div>
            </div>
            <div style={{ padding: '45px 40px', background: 'linear-gradient(to bottom, white 0%, rgba(250,251,252,1) 100%)' }}>
              <p style={{ fontSize: '19px', lineHeight: '1.85', color: '#334155', margin: '0 0 32px', fontWeight: '500' }}>
                Complimentary comprehensive business review designed specifically for {'{company}'}...
              </p>
              <div style={{ background: `linear-gradient(135deg, rgba(0,245,160,0.18) 0%, rgba(0,217,145,0.10) 100%)`, borderRadius: '16px', padding: '30px 28px', margin: '35px 0', border: `3px solid rgba(0,245,160,0.45)`, boxShadow: '0 8px 24px rgba(0,245,160,0.2)' }}>
                <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '18px', fontSize: '18px', letterSpacing: '0.3px' }}>What You'll Discover:</div>
                <div style={{ fontSize: '17px', color: '#1e293b', lineHeight: '2.1', fontWeight: '600' }}>
                  ✓ Hidden growth opportunities and untapped revenue streams<br/>
                  ✓ Cost optimization strategies with immediate ROI<br/>
                  ✓ Competitive industry benchmarking and insights
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '38px 0 0' }}>
                <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 100%)`, color: '#0f172a', padding: '20px 48px', borderRadius: '16px', fontWeight: '800', fontSize: '19px', boxShadow: `0 14px 36px rgba(0,245,160,0.45), 0 4px 12px rgba(0,245,160,0.25)`, letterSpacing: '0.3px', border: '2px solid rgba(255,255,255,0.4)' }}>
                  Schedule Assessment →
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Event Invitation - Live Preview (ENHANCED)
    if (template.id === 'event_invitation') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 50%, #00c785 100%)`, padding: '55px 40px', textAlign: 'center', color: 'white', boxShadow: 'inset 0 -2px 20px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40%', right: '-15%', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
              <div style={{ fontSize: '48px', marginBottom: '18px', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))', position: 'relative' }}>🎯</div>
              <h1 style={{ margin: '0 0 14px', fontSize: '34px', fontWeight: '900', textShadow: '0 4px 16px rgba(0,0,0,0.2)', letterSpacing: '-0.8px', position: 'relative' }}>You're Invited!</h1>
              <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>Annual Innovation Summit 2025</p>
            </div>
            <div style={{ padding: '45px 40px', background: 'linear-gradient(to bottom, white 0%, rgba(250,251,252,1) 100%)' }}>
              <div style={{ background: `linear-gradient(135deg, rgba(0,245,160,0.18) 0%, rgba(0,217,145,0.10) 100%)`, borderRadius: '16px', padding: '30px 28px', margin: '32px 0', textAlign: 'center', border: `3px solid rgba(0,245,160,0.45)`, boxShadow: '0 8px 24px rgba(0,245,160,0.2)' }}>
                <div style={{ fontSize: '18px', color: '#0f172a', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.3px' }}>📅 March 15-17, 2025</div>
                <div style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800', letterSpacing: '0.3px' }}>📍 San Francisco, CA</div>
              </div>
              <p style={{ fontSize: '19px', lineHeight: '1.85', color: '#334155', margin: '32px 0', fontWeight: '500', textAlign: 'center' }}>
                Join 500+ industry leaders for three days of transformative insights, networking, and innovation...
              </p>
              <div style={{ textAlign: 'center', margin: '38px 0 0' }}>
                <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${accentColor} 0%, #00d991 100%)`, color: '#0f172a', padding: '20px 48px', borderRadius: '16px', fontWeight: '800', fontSize: '19px', boxShadow: `0 14px 36px rgba(0,245,160,0.45), 0 4px 12px rgba(0,245,160,0.25)`, letterSpacing: '0.3px', border: '2px solid rgba(255,255,255,0.4)' }}>
                  Register Now →
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Custom Template - Live Preview
    if (template.id === 'custom_template') {
      return (
        <div style={previewWrapper}>
          <div style={emailContainer}>
            <div style={{ padding: '40px 35px', textAlign: 'center', background: `linear-gradient(135deg, ${accentColor} 0%, rgba(0,245,160,0.8) 100%)`, color: 'white' }}>
              <div style={{ fontSize: '30px', fontWeight: '800', marginBottom: '12px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Build Your Own</div>
              <p style={{ fontSize: '16px', margin: '0', fontWeight: '500' }}>Fully customizable template</p>
            </div>
            <div style={{ padding: '35px', background: 'white' }}>
              <div style={{ background: `linear-gradient(to right, rgba(0,245,160,0.1) 0%, white 100%)`, borderRadius: '10px', padding: '22px', marginBottom: '18px', borderLeft: `5px solid ${accentColor}`, boxShadow: '0 4px 15px rgba(0,245,160,0.1)' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>Drag & drop components</div>
              </div>
              <div style={{ background: `linear-gradient(to right, rgba(0,245,160,0.1) 0%, white 100%)`, borderRadius: '10px', padding: '22px', marginBottom: '18px', borderLeft: `5px solid ${accentColor}`, boxShadow: '0 4px 15px rgba(0,245,160,0.1)' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>Add your branding</div>
              </div>
              <div style={{ background: `linear-gradient(to right, rgba(0,245,160,0.1) 0%, white 100%)`, borderRadius: '10px', padding: '22px', borderLeft: `5px solid ${accentColor}`, boxShadow: '0 4px 15px rgba(0,245,160,0.1)' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>Personalize everything</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default fallback
    return (
      <div style={previewWrapper}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Preview Not Available</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      {/* MUCH WIDER MODAL - ALMOST FULL SCREEN */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Email Template</h2>
            <p className="text-gray-700 text-base font-medium">
              {templateRequest ?
                `⚡ Found ${templateRequest.prospectsFound} prospects! Select a template to start generating personalized emails.` :
                '⚡ Select a template to continue. (Template selection is required to start email generation)'
              }
            </p>
            {templateRequest && templateRequest.sampleProspects && (
              <div className="mt-2 text-sm text-gray-600">
                Sample prospects: {templateRequest.sampleProspects.map(p => p.company).join(', ')}
              </div>
            )}
          </div>
          {/* ❌ X button REMOVED - Template selection is REQUIRED to continue workflow */}
        </div>

        {/* Content - MUCH LARGER PREVIEW CARDS */}
        <div className="p-8 overflow-y-auto max-h-[75vh]">
          {/* 2 COLUMNS INSTEAD OF 3 - WIDER CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => {
              return (
                <div
                  key={key}
                  className={`group relative cursor-pointer transition-all duration-300 rounded-xl overflow-hidden bg-white ${
                    selectedTemplate === key
                      ? 'ring-2 ring-black shadow-2xl'
                      : 'hover:shadow-xl border border-gray-200'
                  }`}
                  onClick={() => handleTemplateSelect(key)}
                >
                  {/* Selection Badge */}
                  {selectedTemplate === key && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-black text-white rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <Check size={14} />
                        Selected
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Template Name Only */}
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 text-base">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{template.description || 'Professional email template'}</p>
                    </div>

                    {/* VISUAL EMAIL PREVIEW - Actual UI Components */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-inner overflow-hidden">
                      {/* Template specific VISUAL preview content */}
                      {key === 'professional_partnership' && (
                        <div className="p-6 space-y-4">
                          {/* Email Header Bar */}
                          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                              <div>
                                <div className="h-2 w-20 bg-gray-300 rounded"></div>
                                <div className="h-1.5 w-32 bg-gray-200 rounded mt-1"></div>
                              </div>
                            </div>
                          </div>

                          {/* Email Body */}
                          <div className="space-y-3">
                            <div className="h-3 w-3/4 bg-gray-800 rounded"></div>
                            <div className="space-y-1.5">
                              <div className="h-2 w-full bg-gray-200 rounded"></div>
                              <div className="h-2 w-full bg-gray-200 rounded"></div>
                              <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                            </div>

                            {/* Partnership CTA */}
                            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                              <div className="h-2 w-32 bg-gray-400 rounded mb-2"></div>
                              <div className="h-2 w-full bg-gray-300 rounded"></div>
                            </div>

                            {/* Button */}
                            <div className="bg-black text-white rounded-md py-2 px-4 text-center">
                              <div className="h-2 w-24 bg-white rounded mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {key === 'modern_tech' && (
                        <div className="space-y-0">
                          {/* Tech Header Banner */}
                          <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-white">
                            <div className="h-3 w-48 bg-white rounded mb-2"></div>
                            <div className="h-2 w-64 bg-gray-400 rounded"></div>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-4">
                            <div className="space-y-2">
                              <div className="h-2 w-full bg-gray-200 rounded"></div>
                              <div className="h-2 w-full bg-gray-200 rounded"></div>
                              <div className="h-2 w-4/5 bg-gray-200 rounded"></div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="h-4 w-12 bg-black rounded mb-1"></div>
                                <div className="h-2 w-16 bg-gray-300 rounded"></div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="h-4 w-12 bg-black rounded mb-1"></div>
                                <div className="h-2 w-16 bg-gray-300 rounded"></div>
                              </div>
                            </div>

                            {/* CTA Button */}
                            <div className="bg-black rounded-lg py-3 text-center">
                              <div className="h-2 w-28 bg-white rounded mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {key === 'executive_outreach' && (
                        <div className="p-6 space-y-4">
                          {/* Executive Header */}
                          <div className="border-l-4 border-black pl-4 py-2">
                            <div className="h-3 w-48 bg-gray-900 rounded mb-1"></div>
                            <div className="h-2 w-32 bg-gray-400 rounded"></div>
                          </div>

                          {/* Body */}
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                          </div>

                          {/* Metrics Cards */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 rounded p-2 text-center border border-gray-200">
                              <div className="h-3 w-12 bg-black rounded mx-auto mb-1"></div>
                              <div className="h-1.5 w-10 bg-gray-300 rounded mx-auto"></div>
                            </div>
                            <div className="bg-gray-50 rounded p-2 text-center border border-gray-200">
                              <div className="h-3 w-12 bg-black rounded mx-auto mb-1"></div>
                              <div className="h-1.5 w-10 bg-gray-300 rounded mx-auto"></div>
                            </div>
                            <div className="bg-gray-50 rounded p-2 text-center border border-gray-200">
                              <div className="h-3 w-12 bg-black rounded mx-auto mb-1"></div>
                              <div className="h-1.5 w-10 bg-gray-300 rounded mx-auto"></div>
                            </div>
                          </div>

                          {/* Quote */}
                          <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-black">
                            <div className="h-1.5 w-full bg-gray-300 rounded mb-1"></div>
                            <div className="h-1.5 w-4/5 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      )}

                      {key === 'product_launch' && (
                        <div className="p-6 space-y-4">
                          {/* Launch Badge */}
                          <div className="text-center py-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-black rounded-full mx-auto mb-2"></div>
                            <div className="h-3 w-32 bg-black rounded mx-auto mb-1"></div>
                            <div className="h-2 w-48 bg-gray-400 rounded mx-auto"></div>
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                          </div>

                          {/* Limited Badge */}
                          <div className="bg-black text-white rounded-lg py-2 px-4 inline-flex mx-auto">
                            <div className="h-2 w-32 bg-white rounded"></div>
                          </div>

                          {/* CTA */}
                          <div className="border-2 border-black rounded-lg py-3 text-center">
                            <div className="h-2 w-28 bg-black rounded mx-auto"></div>
                          </div>
                        </div>
                      )}

                      {key === 'consultative_sales' && (
                        <div className="p-6 space-y-4">
                          {/* Header */}
                          <div className="space-y-2">
                            <div className="h-3 w-40 bg-gray-900 rounded"></div>
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                          </div>

                          {/* Checklist */}
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 bg-black rounded-sm flex-shrink-0 mt-0.5"></div>
                              <div className="flex-1">
                                <div className="h-2 w-full bg-gray-300 rounded"></div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 bg-black rounded-sm flex-shrink-0 mt-0.5"></div>
                              <div className="flex-1">
                                <div className="h-2 w-5/6 bg-gray-300 rounded"></div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 bg-black rounded-sm flex-shrink-0 mt-0.5"></div>
                              <div className="flex-1">
                                <div className="h-2 w-4/5 bg-gray-300 rounded"></div>
                              </div>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <div className="bg-black rounded-lg py-3 text-center mt-4">
                            <div className="h-2 w-32 bg-white rounded mx-auto"></div>
                          </div>
                        </div>
                      )}

                      {key === 'event_invitation' && (
                        <div className="p-6 space-y-4">
                          {/* Event Badge */}
                          <div className="text-center py-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-full mx-auto mb-3"></div>
                            <div className="h-3 w-40 bg-black rounded mx-auto mb-2"></div>
                            <div className="h-2 w-48 bg-gray-400 rounded mx-auto"></div>
                          </div>

                          {/* Event Details */}
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-400 rounded"></div>
                              <div className="h-2 w-32 bg-gray-400 rounded"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-400 rounded"></div>
                              <div className="h-2 w-28 bg-gray-400 rounded"></div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="space-y-1.5">
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                            <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                          </div>

                          {/* Register Button */}
                          <div className="bg-black rounded-lg py-3 text-center">
                            <div className="h-2 w-24 bg-white rounded mx-auto"></div>
                          </div>
                        </div>
                      )}

                      {key === 'custom' && (
                        <div className="p-6 space-y-4">
                          {/* Drag and Drop Hint */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-3"></div>
                            <div className="h-2 w-32 bg-gray-300 rounded mx-auto mb-2"></div>
                            <div className="h-1.5 w-48 bg-gray-200 rounded mx-auto"></div>
                          </div>

                          {/* Component Options */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 rounded p-2 border border-gray-200 text-center">
                              <div className="w-6 h-6 bg-gray-300 rounded mx-auto mb-1"></div>
                              <div className="h-1.5 w-12 bg-gray-300 rounded mx-auto"></div>
                            </div>
                            <div className="bg-gray-50 rounded p-2 border border-gray-200 text-center">
                              <div className="w-6 h-6 bg-gray-300 rounded mx-auto mb-1"></div>
                              <div className="h-1.5 w-12 bg-gray-300 rounded mx-auto"></div>
                            </div>
                            <div className="bg-gray-50 rounded p-2 border border-gray-200 text-center">
                              <div className="w-6 h-6 bg-gray-300 rounded mx-auto mb-1"></div>
                              <div className="h-1.5 w-12 bg-gray-300 rounded mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handlePreview(key, e)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      {selectedTemplate === key && (
                        <button
                          onClick={(e) => handleCustomize(key, e)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all"
                        >
                          <Edit3 size={16} />
                          Customize
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

          <div className="flex justify-center gap-3">
            {/* Back/Cancel button - allows user to go back without selecting */}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              {isSubmitting ? 'Please wait...' : 'Go Back'}
            </button>

            <button
              onClick={handleConfirm}
              disabled={!selectedTemplate || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-md font-medium transition-colors ${
                selectedTemplate && !isSubmitting
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap size={16} />
              {isSubmitting ? 'Applying Template...' : 'Use This Template & Start Generating Emails'}
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
                  <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
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
                                        insertAfter: 'end',  // Default to end of email
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
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('mediaIndex', index.toString());
                              e.dataTransfer.setData('mediaId', media.id.toString());
                              setDraggedMedia(media);
                            }}
                            onDragEnd={() => {
                              setDraggedMedia(null);
                              setDropZoneActive(null);
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
                                    value={media.insertAfter || 'end'}
                                    onChange={(e) => {
                                      const newMedia = [...customTemplateData.customizations.customMedia];
                                      newMedia[index].insertAfter = e.target.value;
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
                                    <option value="start">Before Email</option>
                                    <option value="logo">After Logo</option>
                                    <option value="greeting">After Greeting</option>
                                    <option value="paragraph-1">After Para 1</option>
                                    <option value="paragraph-2">After Para 2</option>
                                    <option value="paragraph-3">After Para 3</option>
                                    <option value="cta">After CTA Button</option>
                                    <option value="testimonial">After Testimonial</option>
                                    <option value="signature">After Signature</option>
                                    <option value="end">End of Email</option>
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
                                  Drag to reorder • Insert after: {media.insertAfter || 'end'}
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

                  {/* 🧩 Component Builder (Custom Template Only) */}
                  <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Component Builder
                    </h5>
                    <p className="text-xs text-gray-600 mb-3">Drag components into your email to build your custom template</p>

                    {/* Component Library */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Available Components</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { type: 'logo', icon: '🏢', label: 'Logo Header' },
                          { type: 'greeting', icon: '👋', label: 'Greeting' },
                          { type: 'paragraph', icon: '📝', label: 'Text Block' },
                          { type: 'cta', icon: '🔘', label: 'CTA Button' },
                          { type: 'testimonial', icon: '💬', label: 'Testimonial' },
                          { type: 'features', icon: '⭐', label: 'Feature Grid' },
                          { type: 'stats', icon: '📊', label: 'Stats' },
                          { type: 'countdown', icon: '⏱️', label: 'Countdown' },
                          { type: 'banner', icon: '🎨', label: 'Header Banner' }
                        ].map(comp => (
                          <button
                            key={comp.type}
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData('componentType', comp.type);
                            }}
                            onClick={() => {
                              // Add component on click
                              const newComponent = {
                                id: Date.now() + Math.random(),
                                type: comp.type,
                                properties: getDefaultPropertiesForComponent(comp.type)
                              };
                              setCustomTemplateData(prev => ({
                                ...prev,
                                customizations: {
                                  ...prev.customizations,
                                  customComponents: [...(prev.customizations?.customComponents || []), newComponent]
                                }
                              }));
                            }}
                            className="p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all cursor-grab active:cursor-grabbing text-center"
                          >
                            <div className="text-2xl mb-1">{comp.icon}</div>
                            <div className="text-xs font-medium text-gray-700">{comp.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Added Components List */}
                    {customTemplateData.customizations?.customComponents?.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Your Components ({customTemplateData.customizations.customComponents.length})
                        </label>
                        {customTemplateData.customizations.customComponents.map((component, index) => (
                          <div
                            key={component.id}
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">
                                {component.type === 'logo' ? '🏢' :
                                 component.type === 'greeting' ? '👋' :
                                 component.type === 'paragraph' ? '📝' :
                                 component.type === 'cta' ? '🔘' :
                                 component.type === 'testimonial' ? '💬' :
                                 component.type === 'features' ? '⭐' :
                                 component.type === 'stats' ? '📊' :
                                 component.type === 'countdown' ? '⏱️' :
                                 component.type === 'banner' ? '🎨' : '🧩'}
                              </span>
                              <span className="text-sm font-medium text-gray-700 flex-1">
                                {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
                              </span>

                              {/* Move Up/Down Buttons */}
                              <div className="flex gap-1">
                                {index > 0 && (
                                  <button
                                    onClick={() => {
                                      const newComponents = [...customTemplateData.customizations.customComponents];
                                      [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
                                      setCustomTemplateData(prev => ({
                                        ...prev,
                                        customizations: { ...prev.customizations, customComponents: newComponents }
                                      }));
                                    }}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Move up"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                )}
                                {index < customTemplateData.customizations.customComponents.length - 1 && (
                                  <button
                                    onClick={() => {
                                      const newComponents = [...customTemplateData.customizations.customComponents];
                                      [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
                                      setCustomTemplateData(prev => ({
                                        ...prev,
                                        customizations: { ...prev.customizations, customComponents: newComponents }
                                      }));
                                    }}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Move down"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}

                                {/* Delete Button */}
                                <button
                                  onClick={() => {
                                    const newComponents = customTemplateData.customizations.customComponents.filter((_, i) => i !== index);
                                    setCustomTemplateData(prev => ({
                                      ...prev,
                                      customizations: { ...prev.customizations, customComponents: newComponents }
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Component Properties Editor */}
                            {renderComponentPropertiesEditor(component, index)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Styling Controls */}
                  <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
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

                {/* Right Panel - Live Preview with Drop Zones */}
                <div className="overflow-y-auto p-6 bg-white">
                  <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    Live Preview
                    {draggedMedia && (
                      <span className="text-xs text-green-600 font-normal">
                        (Drop between components)
                      </span>
                    )}
                  </h4>

                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    {/* Subject Line */}
                    <div className="mb-4 pb-4 border-b border-gray-300">
                      <div className="text-xs text-gray-500 mb-1">Subject:</div>
                      <div className="font-semibold text-gray-900">
                        {customTemplateData.subject || 'Email Subject'}
                      </div>
                    </div>


                    {/* Component-by-Component rendering with drop zones */}
                    {(() => {
                      const renderDropZone = (insertPoint, label) => (
                        <div
                          key={`drop-${insertPoint}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDropZoneActive(insertPoint);
                          }}
                          onDragLeave={() => setDropZoneActive(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            const mediaIndex = parseInt(e.dataTransfer.getData('mediaIndex'));
                            if (draggedMedia) {
                              const newMedia = [...(customTemplateData.customizations?.customMedia || [])];
                              newMedia[mediaIndex] = { ...newMedia[mediaIndex], insertAfter: insertPoint };
                              setCustomTemplateData(prev => ({
                                ...prev,
                                customizations: { ...prev.customizations, customMedia: newMedia }
                              }));
                            }
                            setDropZoneActive(null);
                            setDraggedMedia(null);
                          }}
                          className={`transition-all ${
                            dropZoneActive === insertPoint
                              ? 'h-16 bg-green-100 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center my-2'
                              : draggedMedia
                              ? 'h-8 bg-green-50 border border-dashed border-green-300 rounded flex items-center justify-center opacity-50 hover:opacity-100 my-1'
                              : 'h-0'
                          }`}
                        >
                          {draggedMedia && (
                            <div className="text-xs text-green-600 font-medium">
                              {dropZoneActive === insertPoint ? `⬇ Drop here (${label})` : label}
                            </div>
                          )}
                        </div>
                      );

                      return (
                        <>
                          {renderDropZone('start', 'Before Email')}
                          {renderDropZone('logo', 'After Logo')}
                          {renderDropZone('greeting', 'After Greeting')}
                          {renderDropZone('paragraph-1', 'After Para 1')}
                          {renderDropZone('paragraph-2', 'After Para 2')}
                          {renderDropZone('paragraph-3', 'After Para 3')}
                          {renderDropZone('cta', 'After CTA')}
                          {renderDropZone('testimonial', 'After Testimonial')}
                          {renderDropZone('signature', 'After Signature')}
                          {renderDropZone('end', 'End of Email')}

                          {/* Render Email Template - images now rendered inside */}
                          <div className="email-body-content">
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
                        </>
                      );
                    })()}

                    <div className="text-xs text-gray-500 mt-4 p-3 bg-white rounded border border-gray-200">
                      Click on any text to edit it directly. Your changes will be applied to all generated emails.
                    </div>
                  </div>
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