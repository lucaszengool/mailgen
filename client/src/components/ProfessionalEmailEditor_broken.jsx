import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusIcon, 
  TrashIcon,
  PhotoIcon,
  LinkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfessionalEmailEditor({ 
  emailData, 
  availableEmails = [],
  onSave, 
  onSend, 
  onClose,
  onRefresh,
  campaignId,
  prospectId 
}) {
  const [emailComponents, setEmailComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingEmails, setPendingEmails] = useState([]);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper function to replace template variables in email content
  const replaceTemplateVariables = (content, emailData) => {
    if (!content || typeof content !== 'string') return content;
    
    const variables = {
      '{{companyName}}': emailData?.recipient_company || emailData?.company || 'Your Company',
      '{{recipientName}}': emailData?.recipient_name || emailData?.name || 'there',
      '{{senderName}}': emailData?.sender_name || 'AI Marketing',
      '{{websiteUrl}}': emailData?.website_url || 'https://example.com',
      '{{campaignId}}': emailData?.campaign_id || 'default'
    };

    let result = content;
    Object.entries(variables).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return result;
  };

  // Fetch pending approval emails from API
  const fetchPendingEmails = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Fetching pending approval emails...');
      
      // Try to fetch from workflow API first
      const response = await fetch('/api/workflow/pending-emails');
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Received pending emails:', data);
        
        if (data.success && data.emails) {
          setPendingEmails(data.emails);
          return data.emails;
        }
      }
      
      // Fallback to workflow results
      const workflowResponse = await fetch('/api/workflow/results');
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        console.log('📧 Workflow results:', workflowData);
        
        if (workflowData.success && workflowData.data.emailCampaign) {
          const emails = workflowData.data.emailCampaign.emails || [];
          setPendingEmails(emails);
          return emails;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching pending emails:', error);
    } finally {
      setRefreshing(false);
    }
    
    return [];
  };

  // Load email data when component mounts or data changes
  useEffect(() => {
    console.log('📧 ProfessionalEmailEditor received email data:', emailData);
    console.log('📧 Available emails:', availableEmails);
    console.log('📧 All props:', { emailData, availableEmails, campaignId, prospectId });
    
    // First try to load from props
    let emailToLoad = null;
    
    if (emailData) {
      emailToLoad = emailData;
    } else if (availableEmails && availableEmails.length > 0) {
      emailToLoad = availableEmails[0];
    }
    
    if (emailToLoad) {
      switchToEmail(0); // Load first email by default
    } else {
      // If no email data from props, try to fetch pending emails
      fetchPendingEmails().then(emails => {
        if (emails && emails.length > 0) {
          switchToEmail(0); // Load first email when fetched
        }
      });
    }
  }, [emailData, availableEmails]);

  const parseEmailToComponents = (htmlContent, emailData = null) => {
    console.log('🔄 Parsing email HTML to components:', htmlContent?.substring(0, 100) + '...');
    
    if (!htmlContent) return;

    // Replace template variables first
    let processedContent = htmlContent;
    if (emailData) {
      processedContent = replaceTemplateVariables(htmlContent, emailData);
    }

    // Clean the HTML content to prevent compression issues
    processedContent = processedContent
      .replace(new RegExp('transform:\\s*[^;]+;?', 'gi'), '') // Remove transform CSS
      .replace(new RegExp('scale\\([^)]+\\)', 'gi'), '') // Remove scale functions  
      .replace(new RegExp('width:\\s*\\d+px', 'gi'), 'width: 100%') // Make responsive
      .replace(new RegExp('max-width:\\s*\\d+px', 'gi'), 'max-width: 100%') // Make responsive
      .replace(new RegExp('height:\\s*\\d+px', 'gi'), 'min-height: auto') // Remove fixed heights

    // Simple HTML parsing - convert HTML content into editable components
    const components = [];
    
    // Create a rich text component with the processed content
    components.push({
      id: 'parsed_content_' + Date.now(),
      type: 'text_rich',
      content: {
        text: processedContent,
        fontSize: '16px',
        textColor: '#374151',
        alignment: 'left',
        padding: '20px'
      }
    });

    // Add a CTA button if we detect links in the content
    if (processedContent.includes('href=') || processedContent.includes('button') || processedContent.includes('cta')) {
      components.push({
        id: 'cta_' + Date.now(),
        type: 'cta_primary',
        content: {
          text: 'Learn More',
          url: 'https://example.com',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: '8px',
          fontSize: '18px',
          padding: '16px 32px',
          alignment: 'center'
        }
      });
    }

    console.log('✅ Generated components from email:', components.length);
    console.log('✅ Template variables replaced');
    setEmailComponents(components);
  };

  // Handle drag and drop functionality
  const handleDragStart = (e, componentType) => {
    setIsDragging(true);
    e.dataTransfer.setData('componentType', componentType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    const componentIndex = e.dataTransfer.getData('componentIndex');
    
    if (componentType) {
      // Adding new component
      addComponentAtIndex(componentType, dropIndex);
    } else if (componentIndex) {
      // Reordering existing component
      const fromIndex = parseInt(componentIndex);
      let toIndex = dropIndex;
      
      // Adjust drop index if moving component down
      if (fromIndex < toIndex) {
        toIndex = toIndex - 1;
      }
      
      if (fromIndex !== toIndex) {
        moveComponent(fromIndex, toIndex);
      }
    }
    
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const addComponentAtIndex = (componentType, index) => {
    let defaultContent = getDefaultContent(componentType);

    const newComponent = {
      id: componentType + '_' + Date.now(),
      type: componentType,
      content: defaultContent
    };

    // Insert component at specific index
    const newComponents = [...emailComponents];
    if (index !== undefined && index >= 0) {
      newComponents.splice(index, 0, newComponent);
    } else {
      newComponents.push(newComponent);
    }
    
    setEmailComponents(newComponents);
    toast.success('Component added!');
  };

  const moveComponent = (fromIndex, toIndex) => {
    const newComponents = [...emailComponents];
    const [movedComponent] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, movedComponent);
    setEmailComponents(newComponents);
  };

  const addComponent = (componentType) => {
    addComponentAtIndex(componentType);
  };

  const getDefaultContent = (componentType) => {
    let defaultContent = {};
    
    switch (componentType) {
      case 'hero':
        defaultContent = { 
          title: 'Welcome to Our Newsletter', 
          subtitle: 'Stay updated with the latest news and offers', 
          ctaText: 'Get Started',
          ctaUrl: 'https://example.com',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textColor: '#ffffff',
          alignment: 'center'
        };
        break;
      case 'text_rich':
        defaultContent = { 
          text: '<p>Add your <strong>rich text</strong> content here. You can include <em>formatting</em>, <a href="#">links</a>, and more.</p>', 
          fontSize: '16px', 
          textColor: '#374151', 
          alignment: 'left',
          padding: '20px'
        };
        break;
      case 'product_showcase':
        defaultContent = {
          image: 'https://via.placeholder.com/300x200',
          title: 'Featured Product',
          description: 'Discover our latest offering with amazing features and benefits.',
          price: '$99.99',
          ctaText: 'Shop Now',
          ctaUrl: 'https://example.com/product',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb'
        };
        break;
      case 'cta_primary':
        defaultContent = { 
          text: 'Start Your Free Trial', 
          url: 'https://example.com/signup', 
          backgroundColor: '#3b82f6', 
          textColor: '#ffffff',
          borderRadius: '8px',
          fontSize: '18px',
          padding: '16px 32px',
          alignment: 'center'
        };
        break;
      case 'button_group':
        defaultContent = {
          buttons: [
            { text: 'Learn More', url: '#', backgroundColor: '#6b7280', textColor: '#ffffff' },
            { text: 'Contact Sales', url: '#', backgroundColor: '#3b82f6', textColor: '#ffffff' }
          ],
          alignment: 'center',
          spacing: '12px'
        };
        break;
      case 'social_proof':
        defaultContent = {
          type: 'testimonial',
          content: 'This product has transformed our business operations completely.',
          author: 'John Smith',
          company: 'Tech Corp',
          avatar: 'https://via.placeholder.com/60x60',
          rating: 5,
          backgroundColor: '#f9fafb'
        };
        break;
      case 'spacer':
        defaultContent = { height: '40px', backgroundColor: 'transparent' };
        break;
      case 'divider_fancy':
        defaultContent = { 
          style: 'gradient', 
          color: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', 
          thickness: '2px',
          width: '60%',
          alignment: 'center'
        };
        break;
      case 'footer_professional':
        defaultContent = { 
          companyName: 'Your Company Inc.',
          address: '123 Business Avenue, Suite 100, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'contact@yourcompany.com',
          unsubscribeText: 'Unsubscribe from our emails',
          socialLinks: [
            { platform: 'LinkedIn', url: 'https://linkedin.com/company/yourcompany' },
            { platform: 'Twitter', url: 'https://twitter.com/yourcompany' },
            { platform: 'Facebook', url: 'https://facebook.com/yourcompany' }
          ],
          backgroundColor: '#f3f4f6',
          textColor: '#6b7280'
        };
        break;
      default:
        defaultContent = { text: 'Sample content' };
    }
    
    return defaultContent;
  };

  const updateComponent = (componentId, updates) => {
    setEmailComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { ...comp, content: { ...comp.content, ...updates } }
          : comp
      )
    );
  };

  const removeComponent = (componentId) => {
    setEmailComponents(prev => prev.filter(comp => comp.id !== componentId));
    toast.success('Component removed');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const emailStructure = {
        subject,
        preheader,
        components: emailComponents
      };
      onSave?.(emailStructure);
      toast.success('Email saved successfully!');
    } catch (error) {
      toast.error('Save failed');
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }

    setLoading(true);
    try {
      await handleSave(); // Save first
      
      const finalEmail = {
        subject,
        preheader,
        components: emailComponents,
        changes
      };

      // Try to approve and continue workflow
      const response = await fetch('/api/workflow/approve-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: finalEmail,
          campaignId,
          prospectId,
          action: 'approve_and_send'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('✅ Email approved! Campaign continuing...');
          onSend?.(finalEmail);
        } else {
          throw new Error(result.error || 'Failed to approve email');
        }
      } else {
        // Fallback to original onSend
        onSend?.(finalEmail);
        toast.success('Email campaign started!');
      }
    } catch (error) {
      toast.error(`Failed to start campaign: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSendAll = async () => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }

    setLoading(true);
    try {
      await handleSave();
      
      const finalEmail = {
        subject,
        preheader,
        components: emailComponents,
        changes
      };

      // Send to all pending emails
      const response = await fetch('/api/workflow/approve-all-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: finalEmail,
          campaignId,
          action: 'approve_and_send_all'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('✅ All emails approved! Campaign continuing...');
          onSend?.(finalEmail);
        } else {
          throw new Error(result.error || 'Failed to approve all emails');
        }
      } else {
        onSend?.(finalEmail);
        toast.success('All emails sent!');
      }
    } catch (error) {
      toast.error(`Failed to send all emails: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSendSingle = async (email) => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }

    setLoading(true);
    try {
      const finalEmail = {
        ...email,
        subject,
        preheader,
        components: emailComponents,
        changes
      };

      // Try to send specific email
      const response = await fetch('/api/workflow/send-single-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: finalEmail,
          campaignId,
          prospectId: email.id || email.email,
          action: 'send_single'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`✅ Email sent to ${email.recipient_name || email.name}!`);
          // Update the email status in the list
          const updatedEmails = availableEmails.map(e => 
            (e.id === email.id || e.email === email.email) 
              ? { ...e, sent: true, status: 'sent', sent_at: new Date().toISOString() }
              : e
          );
          // This would normally be handled by the parent component
          // setAvailableEmails(updatedEmails);
        } else {
          throw new Error(result.error || 'Failed to send email');
        }
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast.error(`Failed to send email: ${error.message}`);
    }
    setLoading(false);
  };

  const switchToEmail = (emailIndex) => {
    setCurrentEmailIndex(emailIndex);
    const email = availableEmails[emailIndex];
    if (email) {
      setSubject(email.subject || '');
      setPreheader(email.preheader || '');
      
      if (email.body || email.html || email.content) {
        parseEmailToComponents(email.body || email.html || email.content, email);
      }
    }
  };

  const renderPropertiesPanel = () => {
    if (!selectedComponent) return null;

    const component = emailComponents.find(c => c.id === selectedComponent);
    if (!component) return null;

    const updateContent = (updates) => {
      updateComponent(selectedComponent, updates);
    };

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <button
              onClick={() => setSelectedComponent(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-blue-600 font-medium mt-1">
            {component.type.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* HERO PROPERTIES */}
          {component.type === 'hero' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Main Title</label>
                    <input
                      type="text"
                      value={component.content.title}
                      onChange={(e) => updateContent({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                    <textarea
                      value={component.content.subtitle}
                      onChange={(e) => updateContent({ subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.ctaText}
                      onChange={(e) => updateContent({ ctaText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.ctaUrl}
                      onChange={(e) => updateContent({ ctaUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
                    <select
                      value={component.content.backgroundColor.includes('gradient') ? 'gradient' : 'solid'}
                      onChange={(e) => updateContent({ 
                        backgroundColor: e.target.value === 'gradient' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#3b82f6'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="solid">Solid Color</option>
                      <option value="gradient">Gradient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
                    <select
                      value={component.content.alignment}
                      onChange={(e) => updateContent({ alignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RICH TEXT PROPERTIES */}
          {component.type === 'text_rich' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Typography</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                    <select
                      value={component.content.fontSize}
                      onChange={(e) => updateContent({ fontSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="12px">Small (12px)</option>
                      <option value="14px">Normal (14px)</option>
                      <option value="16px">Medium (16px)</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">X-Large (20px)</option>
                      <option value="24px">XX-Large (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
                    <select
                      value={component.content.alignment}
                      onChange={(e) => updateContent({ alignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Spacing</label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
                  <select
                    value={component.content.padding}
                    onChange={(e) => updateContent({ padding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="10px">Small (10px)</option>
                    <option value="20px">Medium (20px)</option>
                    <option value="30px">Large (30px)</option>
                    <option value="40px">X-Large (40px)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* PRIMARY CTA PROPERTIES */}
          {component.type === 'cta_primary' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.text}
                      onChange={(e) => updateContent({ text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.url}
                      onChange={(e) => updateContent({ url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Style</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={component.content.backgroundColor}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                    <select
                      value={component.content.fontSize}
                      onChange={(e) => updateContent({ fontSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="14px">Small (14px)</option>
                      <option value="16px">Medium (16px)</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">X-Large (20px)</option>
                      <option value="24px">XX-Large (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                    <select
                      value={component.content.borderRadius}
                      onChange={(e) => updateContent({ borderRadius: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="0px">Square</option>
                      <option value="4px">Slightly Rounded</option>
                      <option value="8px">Rounded</option>
                      <option value="16px">Very Rounded</option>
                      <option value="32px">Pill Shape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Size</label>
                    <select
                      value={component.content.padding}
                      onChange={(e) => updateContent({ padding: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="8px 16px">Small</option>
                      <option value="12px 24px">Medium</option>
                      <option value="16px 32px">Large</option>
                      <option value="20px 40px">X-Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
                    <select
                      value={component.content.alignment}
                      onChange={(e) => updateContent({ alignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SPACER PROPERTIES */}
          {component.type === 'spacer' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Spacing</label>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                <select
                  value={component.content.height}
                  onChange={(e) => updateContent({ height: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10px">10px</option>
                  <option value="20px">20px</option>
                  <option value="30px">30px</option>
                  <option value="40px">40px</option>
                  <option value="60px">60px</option>
                  <option value="80px">80px</option>
                  <option value="100px">100px</option>
                </select>
              </div>
            </div>
          )}

          {/* PRODUCT SHOWCASE PROPERTIES */}
          {component.type === 'product_showcase' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Image URL</label>
                    <input
                      type="url"
                      value={component.content.image}
                      onChange={(e) => updateContent({ image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Title</label>
                    <input
                      type="text"
                      value={component.content.title}
                      onChange={(e) => updateContent({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      value={component.content.description}
                      onChange={(e) => updateContent({ description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                    <input
                      type="text"
                      value={component.content.price}
                      onChange={(e) => updateContent({ price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.ctaText}
                      onChange={(e) => updateContent({ ctaText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.ctaUrl}
                      onChange={(e) => updateContent({ ctaUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={component.content.backgroundColor}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                    <input
                      type="color"
                      value={component.content.borderColor}
                      onChange={(e) => updateContent({ borderColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SOCIAL PROOF PROPERTIES */}
          {component.type === 'social_proof' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Testimonial</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Testimonial Text</label>
                    <textarea
                      value={component.content.content}
                      onChange={(e) => updateContent({ content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={component.content.author}
                      onChange={(e) => updateContent({ author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={component.content.company}
                      onChange={(e) => updateContent({ company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Avatar URL</label>
                    <input
                      type="url"
                      value={component.content.avatar}
                      onChange={(e) => updateContent({ avatar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rating (1-5)</label>
                    <select
                      value={component.content.rating}
                      onChange={(e) => updateContent({ rating: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={component.content.backgroundColor}
                    onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex bg-gray-50">
      {/* Email List Panel */}
      {(availableEmails && availableEmails.length > 0) && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Email Campaign</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {availableEmails.length} Generated
                </span>
              </div>
            </div>
            <p className="text-sm text-emerald-600 mt-1">Ready for editing & sending</p>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {availableEmails.map((email, index) => {
                const isCurrentlyEditing = currentEmailIndex === index;
                const status = email.status || (email.sent ? 'sent' : 'pending');
                
                return (
                  <div
                    key={email.id || index}
                    onClick={() => setCurrentEmailIndex(index)}
                    className={isCurrentlyEditing 
                      ? 'p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-blue-50 border-r-4 border-blue-500' 
                      : 'p-4 cursor-pointer hover:bg-gray-50 transition-colors'
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {email.recipient_name || email.name || `Recipient ${index + 1}`}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            status === 'sent' ? 'bg-green-100 text-green-800' :
                            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {status === 'sent' ? '✓ Sent' :
                             status === 'pending' ? '⏳ Pending' :
                             status === 'failed' ? '✗ Failed' :
                             '📧 Ready'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 font-mono mb-1">
                          {email.to || email.email || 'No email address'}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {email.recipient_company || email.company || 'No company'}
                        </p>
                        {email.sent_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Sent: {new Date(email.sent_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        {isCurrentlyEditing && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        {status === 'sent' && email.opened && (
                          <div className="text-xs text-green-600 font-medium">📖 Opened</div>
                        )}
                        {status === 'sent' && email.clicked && (
                          <div className="text-xs text-purple-600 font-medium">🔗 Clicked</div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 flex items-center space-x-2">
                      {status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Send this specific email
                            handleSendSingle(email);
                          }}
                          className="inline-flex items-center px-2.5 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                        >
                          <PlayIcon className="h-3 w-3 mr-1" />
                          Send Now
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentEmailIndex(index);
                        }}
                        className={`inline-flex items-center px-2.5 py-1 text-xs rounded-md transition-colors ${
                          isCurrentlyEditing 
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        {isCurrentlyEditing ? 'Editing' : 'Edit'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Campaign Status</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-600">
                  {availableEmails.filter(e => e.sent || e.status === 'sent').length} Sent
                </span>
                <span className="text-xs text-yellow-600">
                  {availableEmails.filter(e => !e.sent && e.status !== 'sent').length} Pending
                </span>
              </div>
            </div>
            <button
              onClick={() => fetchPendingEmails()}
              disabled={refreshing}
              className="w-full flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Component Library Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Email Editor</h2>
          {availableEmails && availableEmails.length > 0 ? (
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-blue-600">
                  Editing: {availableEmails[currentEmailIndex]?.recipient_name || availableEmails[currentEmailIndex]?.name || `Email ${currentEmailIndex + 1}`}
                </span>
                <span className="text-xs text-gray-500">
                  ({currentEmailIndex + 1} of {availableEmails.length})
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {availableEmails[currentEmailIndex]?.recipient_company || availableEmails[currentEmailIndex]?.company || 'No company'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Drag components to build your email</p>
          )}
        </div>

        {/* Email Status & Info */}
        {(availableEmails && availableEmails.length > 0) && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Email Generated</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Ready for editing and sending</p>
          </div>
        )}

        {/* Subject Line */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={availableEmails && availableEmails.length > 0 ? "Edit your subject line..." : "Email subject..."}
          />
          {subject && (
            <p className="text-xs text-gray-500 mt-1">✅ Subject loaded</p>
          )}
        </div>

        {/* Professional CRM Components */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Components</h3>
          
          {/* Content Components */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Content</h4>
            <div className="space-y-1">
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'hero')}
                onClick={() => addComponent('hero')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Hero Section</div>
                  <div className="text-xs text-gray-500">Large header with CTA</div>
                </div>
              </button>

              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'text_rich')}
                onClick={() => addComponent('text_rich')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-md flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Rich Text</div>
                  <div className="text-xs text-gray-500">Formatted text content</div>
                </div>
              </button>

              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'product_showcase')}
                onClick={() => addComponent('product_showcase')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-md flex items-center justify-center mr-3">
                  <PhotoIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Product Card</div>
                  <div className="text-xs text-gray-500">Image, title, description, CTA</div>
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Components */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Interactive</h4>
            <div className="space-y-1">
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'cta_primary')}
                onClick={() => addComponent('cta_primary')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-md flex items-center justify-center mr-3">
                  <LinkIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Primary CTA</div>
                  <div className="text-xs text-gray-500">Main action button</div>
                </div>
              </button>

              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'button_group')}
                onClick={() => addComponent('button_group')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-md flex items-center justify-center mr-3">
                  <LinkIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Button Group</div>
                  <div className="text-xs text-gray-500">Multiple action buttons</div>
                </div>
              </button>

              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'social_proof')}
                onClick={() => addComponent('social_proof')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-md flex items-center justify-center mr-3">
                  <ChartBarIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Social Proof</div>
                  <div className="text-xs text-gray-500">Testimonials, reviews, logos</div>
                </div>
              </button>
            </div>
          </div>

          {/* Layout Components */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Layout</h4>
            <div className="space-y-1">
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'spacer')}
                onClick={() => addComponent('spacer')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-md flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Spacer</div>
                  <div className="text-xs text-gray-500">Adjustable white space</div>
                </div>
              </button>

              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'divider_fancy')}
                onClick={() => addComponent('divider_fancy')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-md flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Divider</div>
                  <div className="text-xs text-gray-500">Styled section separator</div>
                </div>
              </button>

              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'footer_professional')}
                onClick={() => addComponent('footer_professional')}
                className="w-full flex items-center p-2.5 text-left border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-gray-700 rounded-md flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Footer</div>
                  <div className="text-xs text-gray-500">Contact info & unsubscribe</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {previewMode ? <PencilIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Email
          </button>

          {/* Workflow Control Buttons */}
          {(availableEmails && availableEmails.length > 0) || (pendingEmails && pendingEmails.length > 0) ? (
            <>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2 text-center">
                  📧 Campaign Controls
                </p>
                
                <button
                  onClick={() => handleSendSingle(availableEmails[currentEmailIndex])}
                  disabled={loading || !subject.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors mb-2"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Send to {availableEmails[currentEmailIndex]?.recipient_name?.split(' ')[0] || 'Current'}
                </button>
                
                <button
                  onClick={handleSendAll}
                  disabled={loading || !subject.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Send All & Continue
                </button>
                
                {(pendingEmails.length > 1 || (availableEmails && availableEmails.length > 1)) && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {pendingEmails.length || availableEmails?.length || 0} emails waiting
                  </p>
                )}
              </div>

              <button
                onClick={() => fetchPendingEmails()}
                disabled={refreshing}
                className="w-full flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Emails
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-4">
          <div className="w-full bg-white shadow-lg rounded-lg overflow-hidden" style={{ maxWidth: 'none' }}>
            {/* Preview */}
            <div className="p-4 border-b bg-blue-50">
              <div className="font-semibold text-gray-900">{subject || 'Subject line'}</div>
            </div>

            {/* Content */}
            <div className="min-h-96 p-8">
              {emailComponents.length > 0 ? (
                <div>
                  {/* Top Drop Zone */}
                  {isDragging && (
                    <div 
                      className={dragOverIndex === 0 
                        ? 'h-16 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center mb-4'
                        : 'h-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg opacity-50 mb-2'
                      }
                      onDragOver={(e) => handleDragOver(e, 0)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 0)}
                    >
                      {dragOverIndex === 0 && (
                        <span className="text-blue-600 font-medium text-sm">Drop component here</span>
                      )}
                    </div>
                  )}
                  
                  {emailComponents.map((component, index) => (
                    <div key={`component-${component.id}`}>
                      <div 
                        className="mb-6 relative group border-2 border-transparent hover:border-blue-200 rounded-lg transition-all duration-200"
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          transform: 'none',
                          scale: 'none'
                        }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('componentIndex', index.toString());
                          e.dataTransfer.setData('componentId', component.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setIsDragging(true);
                        }}
                        onDragEnd={() => {
                          setIsDragging(false);
                          setDragOverIndex(null);
                        }}
                      >
                    {/* Component Controls */}
                    <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <div className="flex items-center space-x-2 bg-white shadow-lg rounded-md px-3 py-1 border border-gray-200">
                        <span className="text-xs font-medium text-gray-600">{component.type.replace('_', ' ').toUpperCase()}</span>
                        <button
                          onClick={() => setSelectedComponent(component.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit component"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeComponent(component.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete component"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* HERO COMPONENT */}
                    {component.type === 'hero' && (
                      <div 
                        className="text-center py-16 px-8 rounded-lg"
                        style={{ 
                          background: component.content.backgroundColor,
                          color: component.content.textColor,
                          textAlign: component.content.alignment
                        }}
                      >
                        <h1 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { title: e.target.textContent })}
                          className="text-4xl font-bold mb-4 outline-none cursor-text"
                        >
                          {component.content.title}
                        </h1>
                        <p 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { subtitle: e.target.textContent })}
                          className="text-xl mb-8 opacity-90 outline-none cursor-text"
                        >
                          {component.content.subtitle}
                        </p>
                        <a 
                          href={component.content.ctaUrl}
                          className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { ctaText: e.target.textContent })}
                          style={{ outline: 'none' }}
                        >
                          {component.content.ctaText}
                        </a>
                      </div>
                    )}

                    {/* RICH TEXT COMPONENT */}
                    {component.type === 'text_rich' && (
                      <div 
                        className="prose max-w-none"
                        style={{ padding: component.content.padding }}
                      >
                        <div
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { text: e.target.innerHTML })}
                          className="outline-none cursor-text"
                          style={{ 
                            fontSize: component.content.fontSize,
                            color: component.content.textColor,
                            textAlign: component.content.alignment,
                            transform: 'none',
                            scale: 'none',
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                            minHeight: 'auto',
                            lineHeight: '1.6'
                          }}
                        >
                          <div dangerouslySetInnerHTML={{ 
                            __html: component.content.text
                              ?.replace(/transform:\s*[^;]+;?/gi, '')
                              ?.replace(/scale\([^)]+\)/gi, '')
                              ?.replace(/width:\s*\d+px/gi, 'width: 100%')
                              ?.replace(/max-width:\s*\d+px/gi, 'max-width: 100%')
                              ?.replace(/height:\s*\d+px/gi, 'min-height: auto')
                          }} />
                        </div>
                      </div>
                    )}

                    {/* PRODUCT SHOWCASE */}
                    {component.type === 'product_showcase' && (
                      <div 
                        className="border rounded-lg p-6 text-center"
                        style={{ 
                          backgroundColor: component.content.backgroundColor,
                          borderColor: component.content.borderColor
                        }}
                      >
                        <img 
                          src={component.content.image} 
                          alt={component.content.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <h3 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { title: e.target.textContent })}
                          className="text-2xl font-bold mb-2 outline-none cursor-text"
                        >
                          {component.content.title}
                        </h3>
                        <p 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { description: e.target.textContent })}
                          className="text-gray-600 mb-4 outline-none cursor-text"
                        >
                          {component.content.description}
                        </p>
                        <div className="flex justify-center items-center space-x-4">
                          <span 
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => updateComponent(component.id, { price: e.target.textContent })}
                            className="text-2xl font-bold text-green-600 outline-none cursor-text"
                          >
                            {component.content.price}
                          </span>
                          <a 
                            href={component.content.ctaUrl}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => updateComponent(component.id, { ctaText: e.target.textContent })}
                            style={{ outline: 'none' }}
                          >
                            {component.content.ctaText}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* PRIMARY CTA */}
                    {component.type === 'cta_primary' && (
                      <div className="text-center" style={{ textAlign: component.content.alignment }}>
                        <a
                          href={component.content.url}
                          className="inline-block font-semibold transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: component.content.backgroundColor,
                            color: component.content.textColor,
                            borderRadius: component.content.borderRadius,
                            fontSize: component.content.fontSize,
                            padding: component.content.padding,
                            textDecoration: 'none',
                            outline: 'none'
                          }}
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { text: e.target.textContent })}
                        >
                          {component.content.text}
                        </a>
                      </div>
                    )}

                    {/* BUTTON GROUP */}
                    {component.type === 'button_group' && (
                      <div className="text-center" style={{ textAlign: component.content.alignment }}>
                        <div className="inline-flex space-x-4">
                          {component.content.buttons.map((button, idx) => (
                            <a
                              key={idx}
                              href={button.url}
                              className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                              style={{
                                backgroundColor: button.backgroundColor,
                                color: button.textColor,
                                textDecoration: 'none'
                              }}
                            >
                              {button.text}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SOCIAL PROOF */}
                    {component.type === 'social_proof' && (
                      <div 
                        className="p-6 rounded-lg"
                        style={{ backgroundColor: component.content.backgroundColor }}
                      >
                        <div className="flex items-center space-x-4">
                          <img 
                            src={component.content.avatar} 
                            alt={component.content.author}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex mb-2">
                              {[...Array(component.content.rating)].map((_, i) => (
                                <span key={i} className="text-yellow-400">★</span>
                              ))}
                            </div>
                            <p 
                              contentEditable
                              suppressContentEditableWarning={true}
                              onBlur={(e) => updateComponent(component.id, { content: e.target.textContent })}
                              className="italic text-gray-700 mb-2 outline-none cursor-text"
                            >
                              "{component.content.content}"
                            </p>
                            <p className="text-sm text-gray-600">
                              <span 
                                contentEditable
                                suppressContentEditableWarning={true}
                                onBlur={(e) => updateComponent(component.id, { author: e.target.textContent })}
                                className="font-semibold outline-none cursor-text"
                              >
                                {component.content.author}
                              </span>
                              , {component.content.company}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SPACER */}
                    {component.type === 'spacer' && (
                      <div 
                        className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
                        style={{ 
                          height: component.content.height,
                          backgroundColor: component.content.backgroundColor
                        }}
                      >
                        <span className="text-gray-400 text-sm">Spacer ({component.content.height})</span>
                      </div>
                    )}

                    {/* FANCY DIVIDER */}
                    {component.type === 'divider_fancy' && (
                      <div className="py-8 flex justify-center">
                        <div 
                          className="h-1 rounded-full"
                          style={{
                            background: component.content.color,
                            width: component.content.width,
                            height: component.content.thickness
                          }}
                        />
                      </div>
                    )}

                    {/* PROFESSIONAL FOOTER */}
                    {component.type === 'footer_professional' && (
                      <div 
                        className="p-8 rounded-lg text-center"
                        style={{ 
                          backgroundColor: component.content.backgroundColor,
                          color: component.content.textColor
                        }}
                      >
                        <h3 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { companyName: e.target.textContent })}
                          className="text-lg font-bold mb-4 outline-none cursor-text"
                        >
                          {component.content.companyName}
                        </h3>
                        <div className="space-y-2 text-sm mb-6">
                          <p 
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => updateComponent(component.id, { address: e.target.textContent })}
                            className="outline-none cursor-text"
                          >
                            {component.content.address}
                          </p>
                          <p>
                            <span 
                              contentEditable
                              suppressContentEditableWarning={true}
                              onBlur={(e) => updateComponent(component.id, { phone: e.target.textContent })}
                              className="outline-none cursor-text"
                            >
                              {component.content.phone}
                            </span>
                            {' | '}
                            <span 
                              contentEditable
                              suppressContentEditableWarning={true}
                              onBlur={(e) => updateComponent(component.id, { email: e.target.textContent })}
                              className="outline-none cursor-text"
                            >
                              {component.content.email}
                            </span>
                          </p>
                        </div>
                        <div className="flex justify-center space-x-4 mb-6">
                          {component.content.socialLinks.map((link, idx) => (
                            <a key={idx} href={link.url} className="text-blue-600 hover:text-blue-800 font-medium">
                              {link.platform}
                            </a>
                          ))}
                        </div>
                        <p className="text-xs">
                          <a 
                            href="#" 
                            className="hover:underline"
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => updateComponent(component.id, { unsubscribeText: e.target.textContent })}
                            style={{ outline: 'none' }}
                          >
                            {component.content.unsubscribeText}
                          </a>
                        </p>
                      </div>
                    )}
                      </div>

                      {/* Drop Zone After Each Component */}
                      {isDragging && (
                        <div 
                          className={dragOverIndex === index + 1 
                            ? 'h-16 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center mb-4'
                            : 'h-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg opacity-50 mb-2'
                          }
                          onDragOver={(e) => handleDragOver(e, index + 1)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index + 1)}
                        >
                          {dragOverIndex === index + 1 && (
                            <span className="text-blue-600 font-medium text-sm">Drop component here</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Start building your email</p>
                    <p className="text-sm">Add components from the sidebar to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedComponent && (
        <div style={{ flexShrink: 0 }}>
          {renderPropertiesPanel()}
        </div>
      )}
    </div>
  );
}