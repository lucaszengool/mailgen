/**
 * Template Selection Service
 * Handles WebSocket communication and template selection workflow
 */

import { EMAIL_TEMPLATES } from '../data/emailTemplatesConsistent.js';

class TemplateSelectionService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize WebSocket connection
   */
  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      console.log('🔗 Connecting to WebSocket for template selection:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Template Selection WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('⚠️ Template Selection WebSocket disconnected');
        this.isConnected = false;

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, 2000 * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    console.log('📨 Template Selection WebSocket message:', message);

    switch (message.type) {
      case 'template_selection_required':
        this.handleTemplateSelectionRequired(message.data);
        break;

      case 'template_selected':
        this.handleTemplateSelected(message.data);
        break;

      default:
        // Ignore other message types
        break;
    }
  }

  /**
   * Handle template selection required event
   */
  handleTemplateSelectionRequired(data) {
    console.log('🎨 Template selection required:', data);

    // Notify all listeners
    this.listeners.forEach(listener => {
      if (typeof listener.onTemplateSelectionRequired === 'function') {
        listener.onTemplateSelectionRequired(data);
      }
    });

    // Store data for later use
    this.lastTemplateRequest = data;
  }

  /**
   * Handle template selected event
   */
  handleTemplateSelected(data) {
    console.log('✅ Template selected:', data);

    // Notify all listeners
    this.listeners.forEach(listener => {
      if (typeof listener.onTemplateSelected === 'function') {
        listener.onTemplateSelected(data);
      }
    });
  }

  /**
   * Subscribe to template selection events
   */
  subscribe(listener) {
    this.listeners.add(listener);

    // If WebSocket is not connected, connect now
    if (!this.isConnected && !this.ws) {
      this.connect();
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get the correct API base URL
   */
  getApiBaseUrl() {
    // Check if we're on Railway frontend service
    const currentHost = window.location.host;

    if (currentHost.includes('honest-hope') || currentHost.includes('powerful-contentment')) {
      // Frontend Railway service - use backend service URL
      return 'https://mailgen-production.up.railway.app';
    }

    // Local development or same host
    return window.location.origin;
  }

  /**
   * Send template selection to server
   */
  async selectTemplate(templateId, campaignId, workflowId, customizations = null, components = null) {
    try {
      console.log('🚀🚀🚀 ========================================');
      console.log('🚀 TEMPLATE SELECTION SERVICE - STARTING API CALL');
      console.log(`🎨 Selecting template: ${templateId} for campaign: ${campaignId || workflowId}`);

      if (customizations && Object.keys(customizations).length > 0) {
        console.log(`✨ Including ${Object.keys(customizations).length} customizations`);
        console.log('🎨 Customizations preview:', {
          hasCustomizations: customizations.customizations ? Object.keys(customizations.customizations) : [],
          hasSubject: !!customizations.subject,
          hasGreeting: !!customizations.greeting,
          hasSignature: !!customizations.signature
        });
      }

      if (components && components.length > 0) {
        console.log(`🧩 Including ${components.length} template components`);
      }

      const requestBody = {
        templateId,
        campaignId,
        workflowId,
        // Mark as customized if we have customizations
        isCustomized: !!(customizations && Object.keys(customizations).length > 0),
        // Include all customization data
        ...(customizations || {}),
        // Include components if provided
        components: components || []
      };

      // Get correct API base URL (handles Railway multi-service setup)
      const apiBaseUrl = this.getApiBaseUrl();
      const fullUrl = `${apiBaseUrl}/api/template/select`;

      console.log('📤 Request URL: /api/template/select');
      console.log('📤 Request body keys:', Object.keys(requestBody));
      console.log('📤 Full URL will be:', fullUrl);
      console.log('🔗 Current host:', window.location.host);
      console.log('🔗 API base:', apiBaseUrl);
      console.log('🚀 Making fetch request NOW...');

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        // Include credentials for cross-origin requests
        credentials: 'include'
      });

      console.log('📥 Response received! Status:', response.status);
      console.log('📥 Response OK?:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Template selection response:', result);
      console.log('✅✅✅ TEMPLATE SELECTION API CALL COMPLETED SUCCESSFULLY');
      console.log('🚀🚀🚀 ========================================');

      // Show success notification
      console.log('🎯 Template selected successfully! Email generation should start now...');

      return result;

    } catch (error) {
      console.error('❌❌❌ ========================================');
      console.error('❌ TEMPLATE SELECTION API CALL FAILED!');
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌❌❌ ========================================');
      throw error;
    }
  }

  /**
   * Get all available templates
   */
  async getAvailableTemplates() {
    try {
      const apiBaseUrl = this.getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/template/templates`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.templates || Object.values(EMAIL_TEMPLATES);

    } catch (error) {
      console.error('❌ Failed to fetch templates:', error);
      // Fallback to local templates
      return Object.entries(EMAIL_TEMPLATES).map(([id, template]) => ({
        id,
        name: template.name,
        description: template.description,
        preview: template.preview,
        structure: template.structure
      }));
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    try {
      const apiBaseUrl = this.getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/template/templates/${templateId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.template;

    } catch (error) {
      console.error('❌ Failed to fetch template:', error);
      // Fallback to local template
      return EMAIL_TEMPLATES[templateId] || null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }
}

// Export singleton instance
export default new TemplateSelectionService();