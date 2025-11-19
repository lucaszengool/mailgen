/**
 * Template-Specific Ollama Prompt Service
 * Generates email content based on selected templates with proper paragraph structure
 */

const { EMAIL_TEMPLATES } = require('../data/emailTemplates');

class TemplatePromptService {

  /**
   * Generate template-specific prompt for Ollama
   * @param {string} templateId - The template identifier
   * @param {object} prospect - Prospect information
   * @param {string} businessDescription - Business description
   * @return {string} - Formatted prompt for Ollama
   */
  static generateTemplatePrompt(templateId, prospect, businessDescription = '') {
    const template = EMAIL_TEMPLATES[templateId];

    if (!template) {
      console.error(`❌ Template not found: ${templateId}`);
      return this.getDefaultPrompt(prospect, businessDescription);
    }

    console.log(`🎨 Generating prompt for template: ${template.name}`);

    // Get template-specific prompt
    let basePrompt = template.ollamaPrompt || '';

    // Replace placeholders with actual prospect data
    basePrompt = this.replacePlaceholders(basePrompt, prospect);

    // Add context and constraints
    const fullPrompt = this.buildFullPrompt(basePrompt, template, prospect, businessDescription);

    console.log(`✅ Generated ${template.structure.paragraphs} paragraph prompt for ${template.name}`);
    return fullPrompt;
  }

  /**
   * Replace placeholders in prompt with actual data
   */
  static replacePlaceholders(prompt, prospect) {
    return prompt
      .replace(/\{company\}/g, prospect.company || 'your company')
      .replace(/\{name\}/g, prospect.name || 'there')
      .replace(/\{title\}/g, prospect.title || 'team member')
      .replace(/\{industry\}/g, prospect.industry || 'your industry')
      .replace(/\{website\}/g, prospect.website || '');
  }

  /**
   * Build the complete prompt with context and formatting instructions
   */
  static buildFullPrompt(basePrompt, template, prospect, businessDescription) {
    return `
${businessDescription ? `BUSINESS CONTEXT: ${businessDescription}\n` : ''}
RECIPIENT: ${prospect.name || 'Prospect'} at ${prospect.company || 'Company'} (${prospect.title || 'Professional'})

EMAIL TEMPLATE: ${template.name}
REQUIRED STRUCTURE: Exactly ${template.structure.paragraphs} paragraphs
COMPONENTS: This email will include ${template.structure.components.join(', ')} components

INSTRUCTIONS:
${basePrompt}

FORMATTING REQUIREMENTS:
- Write exactly ${template.structure.paragraphs} paragraphs
- Each paragraph should be 2-4 sentences
- Use professional, engaging tone
- Make it relevant to ${prospect.company || 'the company'}
- Do NOT include any HTML, components, or markup
- Do NOT include subject line or greetings
- Just provide the paragraph content numbered as [PARAGRAPH 1], [PARAGRAPH 2], etc.

EXAMPLE OUTPUT FORMAT:
[PARAGRAPH 1]
Your first paragraph content here...

[PARAGRAPH 2]
Your second paragraph content here...

${template.structure.paragraphs > 2 ? '[PARAGRAPH 3]\nYour third paragraph content here...\n' : ''}
${template.structure.paragraphs > 3 ? '[PARAGRAPH 4]\nYour fourth paragraph content here...\n' : ''}
${template.structure.paragraphs > 4 ? '[PARAGRAPH 5]\nYour fifth paragraph content here...\n' : ''}

Now generate the ${template.structure.paragraphs} paragraphs for ${prospect.name || 'the recipient'}:
    `.trim();
  }

  /**
   * Parse Ollama response and extract paragraphs
   */
  static parseOllamaResponse(response, expectedParagraphs = 3) {
    console.log('📝 Parsing Ollama response for paragraphs...');

    const paragraphs = [];

    // Try to match [PARAGRAPH X] format first
    const paragraphMatches = response.match(/\[PARAGRAPH\s+\d+\]([\s\S]*?)(?=\[PARAGRAPH\s+\d+\]|$)/g);

    if (paragraphMatches && paragraphMatches.length > 0) {
      console.log(`✅ Found ${paragraphMatches.length} formatted paragraphs`);

      paragraphMatches.forEach((match, index) => {
        const content = match.replace(/\[PARAGRAPH\s+\d+\]\s*/i, '').trim();
        if (content) {
          paragraphs.push(content);
        }
      });
    } else {
      // Fallback: Split by double newlines or numbered lists
      console.log('⚠️ No formatted paragraphs found, attempting fallback parsing');

      // Try numbered list format (1., 2., 3.)
      const numberedMatches = response.match(/\d+\.\s+(.*?)(?=\d+\.|$)/gs);
      if (numberedMatches) {
        numberedMatches.forEach(match => {
          const content = match.replace(/^\d+\.\s*/, '').trim();
          if (content) paragraphs.push(content);
        });
      } else {
        // Last resort: split by double newlines
        const parts = response.split(/\n\s*\n/).filter(p => p.trim());
        paragraphs.push(...parts);
      }
    }

    // Ensure we have the expected number of paragraphs
    while (paragraphs.length < expectedParagraphs) {
      paragraphs.push("We believe there's great potential for collaboration between our companies.");
    }

    // Trim to expected number
    const finalParagraphs = paragraphs.slice(0, expectedParagraphs);

    console.log(`✅ Extracted ${finalParagraphs.length} paragraphs of ${expectedParagraphs} expected`);
    return finalParagraphs;
  }

  /**
   * Insert generated paragraphs into template HTML
   */
  static insertParagraphsIntoTemplate(templateHtml, paragraphs, templateId) {
    console.log(`🔧 Inserting ${paragraphs.length} paragraphs into ${templateId} template`);

    let finalHtml = templateHtml;

    // Replace generated paragraph placeholders
    paragraphs.forEach((paragraph, index) => {
      const paragraphNumber = index + 1;
      const placeholder = `[GENERATED CONTENT ${paragraphNumber}:`;
      const endMarker = ']';

      // Find the placeholder and replace everything until the end marker
      const regex = new RegExp(
        `\\[GENERATED CONTENT ${paragraphNumber}:[^\\]]+\\]`,
        'gi'
      );

      finalHtml = finalHtml.replace(regex, paragraph);
    });

    // Also handle simple numbered placeholders
    paragraphs.forEach((paragraph, index) => {
      const paragraphNumber = index + 1;
      const simpleRegex = new RegExp(`\\[PARAGRAPH ${paragraphNumber}\\]`, 'gi');
      finalHtml = finalHtml.replace(simpleRegex, paragraph);
    });

    console.log('✅ Paragraphs inserted into template HTML');
    return finalHtml;
  }

  /**
   * Get default prompt if template not found
   */
  static getDefaultPrompt(prospect, businessDescription) {
    return `
${businessDescription ? `BUSINESS CONTEXT: ${businessDescription}\n` : ''}
RECIPIENT: ${prospect.name || 'Prospect'} at ${prospect.company || 'Company'}

Write a professional email with exactly 3 paragraphs:

[PARAGRAPH 1]
Introduction and why you're reaching out to ${prospect.company || 'their company'}

[PARAGRAPH 2]
Value proposition and how you can help ${prospect.company || 'their company'}

[PARAGRAPH 3]
Call to action and next steps

Keep it professional, concise, and personalized for ${prospect.name || 'the recipient'}.
    `.trim();
  }

  /**
   * Get all available templates
   */
  static getAllTemplates() {
    const templates = Object.entries(EMAIL_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      preview: template.preview,
      structure: template.structure,
      components: template.components || []
    }));

    // 🔥 Add custom template option for users who want to build from scratch
    templates.push({
      id: 'custom_template',
      name: 'Custom Template',
      description: 'Build your own template from scratch with drag & drop components',
      preview: 'Fully customizable - add your own components, styling, and content',
      structure: {
        paragraphs: 0,
        components: []
      },
      components: [],
      isCustomBuilt: true
    });

    return templates;
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId) {
    // 🔥 SPECIAL CASE: Allow 'custom_template' for user-built templates
    if (templateId === 'custom_template') {
      return {
        id: 'custom_template',
        name: 'Custom Template',
        description: 'Fully customizable template built by user',
        structure: {
          paragraphs: 0,
          components: []
        },
        html: '',
        isCustomBuilt: true
      };
    }

    return EMAIL_TEMPLATES[templateId] || null;
  }

  /**
   * Get template with user customizations (checks UserStorageService first)
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID (optional, for backward compatibility)
   * @returns {Promise<Object>} - Template with customizations or default
   */
  static async getTemplateWithCustomizations(templateId, userId = null, campaignId = null) {
    try {
      // 🔥 CRITICAL: Check UserStorageService for user-customized template FIRST
      if (userId) {
        const UserStorageService = require('./UserStorageService');
        const userStorage = new UserStorageService(userId);
        const savedTemplate = await userStorage.getSelectedTemplate();

        if (savedTemplate && savedTemplate.templateId === templateId && savedTemplate.customizations) {
          console.log(`✅ [TEMPLATE] Loaded customized template: ${templateId} for user: ${userId}`);

          // Get base template structure
          const baseTemplate = EMAIL_TEMPLATES[templateId];
          if (!baseTemplate) {
            console.warn(`⚠️ [TEMPLATE] Base template not found: ${templateId}`);
            return null;
          }

          // Merge base template with user customizations
          const customizedTemplate = {
            ...baseTemplate,
            // 🎯 CRITICAL: Override with user's edited HTML if provided
            html: savedTemplate.customizations.html || baseTemplate.html,
            subject: savedTemplate.customizations.subject || baseTemplate.subject,
            greeting: savedTemplate.customizations.greeting || baseTemplate.greeting,
            signature: savedTemplate.customizations.signature || baseTemplate.signature,
            components: savedTemplate.customizations.components || baseTemplate.components,
            customizations: savedTemplate.customizations.customizations || {},
            isCustomized: savedTemplate.customizations.isCustomized || false
          };

          console.log(`✨ [TEMPLATE] Using ${customizedTemplate.isCustomized ? 'CUSTOMIZED' : 'DEFAULT'} template with ${customizedTemplate.html ? 'edited HTML' : 'default HTML'}`);
          return customizedTemplate;
        }
      }

      // Fallback to default template if no customization found
      const defaultTemplate = EMAIL_TEMPLATES[templateId];
      if (defaultTemplate) {
        console.log(`📋 [TEMPLATE] Using default template: ${templateId}`);
        return defaultTemplate;
      }

      console.warn(`⚠️ [TEMPLATE] Template not found: ${templateId}`);
      return null;
    } catch (error) {
      console.error(`❌ [TEMPLATE] Error loading template ${templateId}:`, error.message);
      // Fallback to default on error
      return EMAIL_TEMPLATES[templateId] || null;
    }
  }
}

module.exports = TemplatePromptService;