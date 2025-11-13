import React, { useState, useEffect } from 'react';
import TemplateSelectionService from '../services/TemplateSelectionService';
import TemplateSelectionModal from './TemplateSelectionModal';
import toast from 'react-hot-toast';

const TemplateSelectionHandler = () => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateRequest, setTemplateRequest] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('🎨 Template Selection Handler initialized');

    const listener = {
      onTemplateSelectionRequired: (data) => {
        console.log('🎨 Template selection required received:', data);
        setTemplateRequest(data);
        setShowTemplateModal(true);

        // Show notification to user
        toast.success(
          `Found ${data.prospectsFound} prospects! Please select an email template.`,
          { duration: 8000 }
        );
      },

      onTemplateSelected: (data) => {
        console.log('✅ Template selected confirmed:', data);
        setShowTemplateModal(false);
        setIsSubmitting(false);

        toast.success(
          `Template "${data.templateName}" applied! Generating emails...`,
          { duration: 5000 }
        );
      }
    };

    // Subscribe to template selection events
    const unsubscribe = TemplateSelectionService.subscribe(listener);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleTemplateSelect = (template) => {
    console.log('🎨 User selected template:', template.name);
    setSelectedTemplate(template);
  };

  const handleConfirm = async (templateWithCustomizations) => {
    // 🔥 FIX: Use template passed from modal (includes customizations)
    const template = templateWithCustomizations || selectedTemplate;

    if (!template || !templateRequest) {
      toast.error('Please select a template first');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🎨 Confirming template selection:', template.id);
      console.log('✨ Template has customizations:', !!template.customizations);
      console.log('📊 Customization keys:', template.customizations ? Object.keys(template.customizations) : []);

      // 🔥 FIX: Pass customizations and components to backend
      await TemplateSelectionService.selectTemplate(
        template.id,
        templateRequest.campaignId || 'default',
        templateRequest.workflowId || 'default',
        template,  // Pass entire template object (includes customizations)
        template.components || []
      );

      toast.success(`Using ${template.name} template for all emails!`);

      // The WebSocket will handle closing the modal via onTemplateSelected

    } catch (error) {
      console.error('❌ Failed to confirm template selection:', error);
      toast.error('Failed to apply template. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      toast.error('Please wait while applying the template...');
      return;
    }

    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setTemplateRequest(null);
  };

  return (
    <>
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={handleClose}
        onSelectTemplate={handleTemplateSelect}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
        templateRequest={templateRequest}
      />

      {/* Optional: Show template selection info */}
      {templateRequest && showTemplateModal && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg shadow-md max-w-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  Template Selection Required
                </h3>
                <div className="mt-2 text-sm">
                  <p>Found {templateRequest.prospectsFound} prospects</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Select a template to generate personalized emails
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateSelectionHandler;