/**
 * Server-side Email Template Renderer
 * Simplified version - only adds clean signatures
 */
class ServerEmailTemplateRenderer {
  constructor() {
    this.templates = {
      professional_partnership: {
        name: 'Professional Partnership',
        color: '#10b981',
        components: ['header_banner', 'feature_grid', 'cta_button']
      },
      modern_tech: {
        name: 'Modern Tech',
        color: '#3b82f6',
        components: ['header_banner', 'feature_grid', 'cta_button']
      },
      enterprise_executive: {
        name: 'Enterprise Executive',
        color: '#7c3aed',
        components: ['header_banner', 'feature_grid', 'cta_button']
      }
    };

    // Simple defaults
    this.defaults = {
      subject: 'Partnership Opportunity with {company}',
      greeting: 'Hi {name},',
      signature: 'Best regards,\n\n{senderName}',
      customizations: {
        headerTitle: 'Transform Your Business with AI',
        mainHeading: 'Revolutionizing {company} with AI-Powered Solutions',
        buttonText: 'Schedule Your Free Demo',
        primaryColor: '#10b981',
        accentColor: '#047857',
        features: ['40% Cost Reduction', '10x Faster Processing', '100% Compliance', 'Global Scalability']
      }
    };
  }

  /**
   * Generate HTML email
   */
  generateHTML(templateId, customizations = {}, sampleData = {}) {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const merged = this.mergeCustomizations(templateId, customizations);
    const processedData = this.processVariables(merged, sampleData);
    return this.renderTemplate(templateId, processedData, template);
  }

  /**
   * Merge customizations with defaults
   */
  mergeCustomizations(templateId, customizations) {
    const template = this.templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      subject: customizations.subject || this.defaults.subject,
      greeting: customizations.greeting || this.defaults.greeting,
      signature: customizations.signature || this.defaults.signature,
      customizations: {
        ...this.defaults.customizations,
        primaryColor: customizations.primaryColor || customizations.customizations?.primaryColor || template.color,
        accentColor: customizations.accentColor || customizations.customizations?.accentColor || this.adjustColorBrightness(template.color, -20),
        ...customizations.customizations
      }
    };
  }

  /**
   * Process variables in text
   */
  processVariables(data, sampleData) {
    const processed = JSON.parse(JSON.stringify(data));

    const replaceInString = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/{name}/g, sampleData.name || 'Sarah')
        .replace(/{company}/g, sampleData.company || 'TechCorp')
        .replace(/{senderName}/g, sampleData.senderName || 'James Wilson')
        .replace(/{senderCompany}/g, sampleData.senderCompany || 'Your Company')
        .replace(/\\n/g, '\n');
    };

    const traverse = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = replaceInString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          traverse(obj[key]);
        }
      }
    };

    traverse(processed);
    return processed;
  }

  /**
   * Render template HTML
   */
  renderTemplate(templateId, data, template) {
    const { customizations } = data;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    ${this.renderTemplateContent(templateId, data, template)}
  </div>
</body>
</html>`;
  }

  /**
   * Render template content
   */
  renderTemplateContent(templateId, data, template) {
    return this.renderProfessionalPartnership(data, template);
  }

  /**
   * Render Professional Partnership template - CLEAN VERSION
   */
  renderProfessionalPartnership(data, template) {
    const { customizations } = data;

    return `
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <!-- Greeting -->
      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">${data.greeting}</p>

      <!-- Main Content (AI Generated) -->
      <div style="color: #555; line-height: 1.6; font-size: 16px;">
        ${data.body || '<p>Email content will be inserted here...</p>'}
      </div>

      <!-- Clean Signature -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <div style="color: #555; line-height: 1.5; white-space: pre-line;">${data.signature}</div>
      </div>
    </div>`;
  }

  /**
   * Utility function to adjust color brightness
   */
  adjustColorBrightness(hex, percent) {
    hex = hex.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }

  /**
   * Generate plain text version
   */
  generatePlainText(templateId, customizations = {}, sampleData = {}) {
    const merged = this.mergeCustomizations(templateId, customizations);
    const processedData = this.processVariables(merged, sampleData);

    let content = '';
    content += `${processedData.subject}\n\n`;
    content += `${processedData.greeting}\n\n`;
    content += `${processedData.body || ''}\n\n`;
    content += `${processedData.signature}`;

    return content;
  }
}

module.exports = ServerEmailTemplateRenderer;
