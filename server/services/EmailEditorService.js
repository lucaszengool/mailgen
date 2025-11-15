/**
 * Professional Email Editor Service
 * Provides CRM-like email editing, preview, and learning capabilities
 */

const fs = require('fs').promises;
const path = require('path');

class EmailEditorService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../data/email-templates');
    this.userEditsPath = path.join(__dirname, '../data/user-edits');
    this.learningDataPath = path.join(__dirname, '../data/email-learning');

    // Initialize storage directories
    this.initializeStorage();

    // Track user modifications for learning
    this.userModifications = new Map();

    // CRITICAL FIX: Use Redis for persistent storage instead of memory
    const redis = require('redis');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = redis.createClient({
      url: redisUrl,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    });

    // Connect to Redis
    this.redisClient.connect().catch(err => {
      console.error('Failed to connect to Redis:', err);
    });

    // Store emails pending approval in Redis for persistence
    this.pendingApprovalEmails = []; // Keep for compatibility

    // Email components library
    this.components = this.initializeComponents();
    
    console.log('📧 Email Editor Service initialized');
    console.log('   ✏️ Rich text editing enabled');
    console.log('   🎨 Drag-and-drop components ready');
    console.log('   🧠 Learning system active');
    console.log('   💾 Template versioning enabled');
  }

  async initializeStorage() {
    try {
      await fs.mkdir(this.templatesPath, { recursive: true });
      await fs.mkdir(this.userEditsPath, { recursive: true });
      await fs.mkdir(this.learningDataPath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  /**
   * Initialize draggable email components
   */
  initializeComponents() {
    return {
      header: {
        id: 'header',
        name: 'Header Section',
        icon: '📰',
        defaultContent: {
          type: 'header',
          styles: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 30px',
            textAlign: 'center',
            color: 'white'
          },
          content: {
            logo: { src: '', alt: 'Company Logo', width: 150 },
            title: { text: 'Your Company', fontSize: '32px', fontWeight: 'bold' },
            subtitle: { text: 'Tagline here', fontSize: '16px', opacity: 0.9 }
          }
        }
      },
      
      hero: {
        id: 'hero',
        name: 'Hero Banner',
        icon: '🖼️',
        defaultContent: {
          type: 'hero',
          styles: {
            background: '#ffffff',
            padding: '50px 40px',
            textAlign: 'center'
          },
          content: {
            image: { src: '', alt: 'Hero Image', width: '100%', maxWidth: '600px' },
            headline: { text: 'Main Headline', fontSize: '36px', color: '#1e293b' },
            subheadline: { text: 'Supporting text', fontSize: '18px', color: '#64748b' }
          }
        }
      },
      
      textBlock: {
        id: 'textBlock',
        name: 'Text Block',
        icon: '📝',
        defaultContent: {
          type: 'textBlock',
          styles: {
            padding: '30px 40px',
            background: '#ffffff'
          },
          content: {
            text: 'Your content here...',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#374151'
          }
        }
      },
      
      button: {
        id: 'button',
        name: 'Call-to-Action Button',
        icon: '🔘',
        defaultContent: {
          type: 'button',
          styles: {
            textAlign: 'center',
            padding: '30px 0'
          },
          content: {
            text: 'Click Here',
            url: '#',
            style: {
              display: 'inline-block',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }
          }
        }
      },
      
      features: {
        id: 'features',
        name: 'Features Grid',
        icon: '⭐',
        defaultContent: {
          type: 'features',
          styles: {
            padding: '40px',
            background: '#f9fafb'
          },
          content: {
            title: 'Key Features',
            items: [
              { icon: '✅', title: 'Feature 1', description: 'Description here' },
              { icon: '✅', title: 'Feature 2', description: 'Description here' },
              { icon: '✅', title: 'Feature 3', description: 'Description here' }
            ]
          }
        }
      },
      
      socialLinks: {
        id: 'socialLinks',
        name: 'Social Media Links',
        icon: '🔗',
        defaultContent: {
          type: 'socialLinks',
          styles: {
            textAlign: 'center',
            padding: '30px',
            background: '#1e293b'
          },
          content: {
            links: [
              { platform: 'facebook', url: '#', icon: '📘' },
              { platform: 'twitter', url: '#', icon: '🐦' },
              { platform: 'linkedin', url: '#', icon: '💼' },
              { platform: 'instagram', url: '#', icon: '📷' }
            ]
          }
        }
      },
      
      divider: {
        id: 'divider',
        name: 'Divider',
        icon: '➖',
        defaultContent: {
          type: 'divider',
          styles: {
            padding: '20px 40px'
          },
          content: {
            style: {
              borderTop: '1px solid #e5e7eb',
              width: '100%'
            }
          }
        }
      },
      
      testimonial: {
        id: 'testimonial',
        name: 'Testimonial',
        icon: '💬',
        defaultContent: {
          type: 'testimonial',
          styles: {
            padding: '40px',
            background: '#f3f4f6',
            borderLeft: '4px solid #3b82f6'
          },
          content: {
            quote: 'This is an amazing product!',
            author: 'John Doe',
            position: 'CEO, Company'
          }
        }
      },
      
      metrics: {
        id: 'metrics',
        name: 'Metrics/Stats',
        icon: '📊',
        defaultContent: {
          type: 'metrics',
          styles: {
            padding: '40px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            textAlign: 'center'
          },
          content: {
            title: 'Our Impact',
            stats: [
              { value: '99%', label: 'Customer Satisfaction' },
              { value: '10M+', label: 'Users Worldwide' },
              { value: '24/7', label: 'Support Available' }
            ]
          }
        }
      },
      
      video: {
        id: 'video',
        name: 'Video Embed',
        icon: '🎥',
        defaultContent: {
          type: 'video',
          styles: {
            padding: '40px',
            textAlign: 'center'
          },
          content: {
            thumbnail: '',
            playUrl: '#',
            title: 'Watch Our Video',
            duration: '2:30'
          }
        }
      }
    };
  }

  /**
   * Generate email preview with editable components
   */
  async generateEmailPreview(emailData) {
    const {
      subject, body, template, recipientName, recipientCompany, senderName, companyName,
      originalComponents, originalTemplateData, preserveOriginalStructure
    } = emailData;

    // Parse existing email or create new structure
    const emailStructure = {
      id: `email_${Date.now()}`,
      subject: subject || 'Email Subject',
      preheader: body?.substring(0, 100) || 'Email preview text...',
      components: [],
      metadata: {
        recipientName,
        recipientCompany,
        senderName,
        companyName,
        template: template || 'default',
        createdAt: new Date().toISOString()
      }
    };

    // ✨ CRITICAL FIX: Use original components if provided and preserve structure flag is set
    if (preserveOriginalStructure && originalComponents && originalComponents.length > 0) {
      console.log(`🎯 Using original template components (${originalComponents.length}) to preserve structure`);
      emailStructure.components = originalComponents.map((comp, index) => ({
        id: comp.id || `preserved_${index}_${Date.now()}`,
        type: comp.type || 'textBlock',
        position: comp.position || index,
        content: comp.content || { text: `Component ${index + 1}` },
        styles: comp.styles || {},
        metadata: comp.metadata || {}
      }));
    } else if (template && body) {
      // Convert existing email content to component structure
      emailStructure.components = await this.convertToComponents(body, template);
    } else {
      // Default component structure
      emailStructure.components = [
        this.components.header.defaultContent,
        this.components.textBlock.defaultContent,
        this.components.button.defaultContent,
        this.components.divider.defaultContent
      ];
    }

    return {
      success: true,
      preview: emailStructure,
      editableHtml: this.generateEditableHTML(emailStructure),
      components: Object.values(this.components).map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon
      }))
    };
  }

  /**
   * Convert existing email content to editable components
   */
  async convertToComponents(content, templateType) {
    const components = [];
    
    // Add header based on template type
    const headerComponent = { ...this.components.header.defaultContent };
    headerComponent.content.title.text = '{{companyName}}';
    components.push(headerComponent);

    // Parse content into text blocks and detect CTAs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      // Check if it's a CTA pattern
      if (paragraph.includes('schedule') || paragraph.includes('click') || paragraph.includes('learn more')) {
        const buttonComponent = { ...this.components.button.defaultContent };
        buttonComponent.content.text = 'Schedule Meeting';
        buttonComponent.content.url = '{{websiteUrl}}';
        components.push(buttonComponent);
      } else {
        const textComponent = { ...this.components.textBlock.defaultContent };
        textComponent.content.text = paragraph;
        components.push(textComponent);
      }
    }

    // Add footer/signature
    components.push(this.components.divider.defaultContent);
    
    return components;
  }

  /**
   * Generate editable HTML from component structure
   */
  generateEditableHTML(emailStructure) {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .email-container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; }
    .component-wrapper { position: relative; }
    .component-wrapper:hover { outline: 2px dashed #3b82f6; }
    .component-controls { position: absolute; top: 5px; right: 5px; display: none; }
    .component-wrapper:hover .component-controls { display: block; }
    .edit-btn { background: #3b82f6; color: white; border: none; padding: 5px 10px; cursor: pointer; margin: 2px; }
    [contenteditable="true"] { outline: none; }
    [contenteditable="true"]:focus { background: rgba(59, 130, 246, 0.1); }
  </style>
</head>
<body>
  <div class="email-container">`;

    // Render each component
    emailStructure.components.forEach((component, index) => {
      html += this.renderComponent(component, index);
    });

    html += `
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Render individual component as editable HTML
   */
  renderComponent(component, index) {
    let html = `<div class="component-wrapper" data-component-index="${index}" data-component-type="${component.type}">
      <div class="component-controls">
        <button class="edit-btn" onclick="editComponent(${index})">✏️</button>
        <button class="edit-btn" onclick="moveComponent(${index}, 'up')">⬆️</button>
        <button class="edit-btn" onclick="moveComponent(${index}, 'down')">⬇️</button>
        <button class="edit-btn" onclick="deleteComponent(${index})">🗑️</button>
      </div>`;

    switch (component.type) {
      case 'header':
        html += `
          <div style="${this.styleObjToString(component.styles)}">
            <h1 contenteditable="true" data-field="title">${component.content.title.text}</h1>
            <p contenteditable="true" data-field="subtitle">${component.content.subtitle.text}</p>
          </div>`;
        break;

      case 'textBlock':
        html += `
          <div style="${this.styleObjToString(component.styles)}">
            <div contenteditable="true" data-field="text" style="color: ${component.content.color}; font-size: ${component.content.fontSize}; line-height: ${component.content.lineHeight};">
              ${component.content.text}
            </div>
          </div>`;
        break;

      case 'button':
        html += `
          <div style="${this.styleObjToString(component.styles)}">
            <a href="${component.content.url}" contenteditable="true" data-field="text" style="${this.styleObjToString(component.content.style)}">
              ${component.content.text}
            </a>
          </div>`;
        break;

      case 'features':
        html += `
          <div style="${this.styleObjToString(component.styles)}">
            <h2 contenteditable="true" data-field="title">${component.content.title}</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
              ${component.content.items.map((item, i) => `
                <div>
                  <div style="font-size: 24px;">${item.icon}</div>
                  <h3 contenteditable="true" data-field="feature-title-${i}">${item.title}</h3>
                  <p contenteditable="true" data-field="feature-desc-${i}">${item.description}</p>
                </div>
              `).join('')}
            </div>
          </div>`;
        break;

      case 'divider':
        html += `<div style="${this.styleObjToString(component.styles)}"><hr style="${this.styleObjToString(component.content.style)}"></div>`;
        break;

      default:
        html += `<div>Unknown component type: ${component.type}</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Convert style object to CSS string
   */
  styleObjToString(styleObj) {
    return Object.entries(styleObj || {})
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
      .join('; ');
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Save user edits and track changes
   */
  async saveUserEdits(emailId, originalStructure, editedStructure, userId) {
    const changes = this.detectChanges(originalStructure, editedStructure);
    
    // Save the edited version
    const editedVersion = {
      id: emailId,
      userId,
      originalTemplate: originalStructure.metadata.template,
      editedAt: new Date().toISOString(),
      structure: editedStructure,
      changes: changes
    };

    const filePath = path.join(this.userEditsPath, `${emailId}_edited.json`);
    await fs.writeFile(filePath, JSON.stringify(editedVersion, null, 2));

    // Learn from changes
    await this.learnFromChanges(changes, originalStructure.metadata.template);

    return {
      success: true,
      saved: true,
      changesDetected: changes.length,
      learningSaved: true
    };
  }

  /**
   * Detect changes between original and edited structures
   */
  detectChanges(original, edited) {
    const changes = [];

    // Safety check for undefined structures
    if (!original || !edited) {
      console.warn('⚠️ detectChanges called with undefined structure');
      return changes;
    }

    // Ensure components arrays exist
    const originalComponents = original.components || [];
    const editedComponents = edited.components || [];

    // Check component additions/removals
    if (originalComponents.length !== editedComponents.length) {
      changes.push({
        type: 'structure',
        action: editedComponents.length > originalComponents.length ? 'added_components' : 'removed_components',
        count: Math.abs(editedComponents.length - originalComponents.length)
      });
    }

    // Check component modifications
    editedComponents.forEach((component, index) => {
      const originalComponent = originalComponents[index];
      if (originalComponent) {
        const componentChanges = this.detectComponentChanges(originalComponent, component);
        if (componentChanges.length > 0) {
          changes.push({
            type: 'component',
            componentType: component.type,
            index: index,
            modifications: componentChanges
          });
        }
      }
    });

    // Check subject and preheader changes
    if (original && edited && original.subject !== edited.subject) {
      changes.push({
        type: 'metadata',
        field: 'subject',
        oldValue: original.subject,
        newValue: edited.subject
      });
    }

    return changes;
  }

  /**
   * Detect changes within a component
   */
  detectComponentChanges(original, edited) {
    const changes = [];
    
    // Deep comparison of component content
    const compareObjects = (obj1, obj2, path = '') => {
      for (const key in obj2) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
          if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            compareObjects(obj1[key], obj2[key], currentPath);
          } else {
            changes.push({
              path: currentPath,
              oldValue: obj1[key],
              newValue: obj2[key]
            });
          }
        } else if (obj1[key] !== obj2[key]) {
          changes.push({
            path: currentPath,
            oldValue: obj1[key],
            newValue: obj2[key]
          });
        }
      }
    };

    compareObjects(original, edited);
    return changes;
  }

  /**
   * Learn from user changes to improve future emails
   */
  async learnFromChanges(changes, templateType) {
    const learningFile = path.join(this.learningDataPath, `${templateType}_learning.json`);
    
    let learningData = {};
    try {
      const existing = await fs.readFile(learningFile, 'utf8');
      learningData = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist yet
    }

    // Initialize learning data structure
    if (!learningData.patterns) learningData.patterns = [];
    if (!learningData.preferences) learningData.preferences = {};
    if (!learningData.statistics) learningData.statistics = { totalEdits: 0 };

    // Record changes as patterns
    changes.forEach(change => {
      // Track text style preferences
      if (change.type === 'component' && change.modifications) {
        change.modifications.forEach(mod => {
          if (mod.path.includes('fontSize') || mod.path.includes('color') || mod.path.includes('padding')) {
            if (!learningData.preferences[mod.path]) {
              learningData.preferences[mod.path] = [];
            }
            learningData.preferences[mod.path].push({
              value: mod.newValue,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      // Track structural preferences
      if (change.type === 'structure') {
        learningData.patterns.push({
          action: change.action,
          timestamp: new Date().toISOString()
        });
      }
    });

    learningData.statistics.totalEdits++;
    learningData.lastUpdated = new Date().toISOString();

    await fs.writeFile(learningFile, JSON.stringify(learningData, null, 2));
  }

  /**
   * Apply learned preferences to new emails
   */
  async applyLearnedPreferences(emailStructure, templateType) {
    const learningFile = path.join(this.learningDataPath, `${templateType}_learning.json`);
    
    try {
      const learningData = JSON.parse(await fs.readFile(learningFile, 'utf8'));
      
      // Apply most common preferences
      for (const [path, values] of Object.entries(learningData.preferences)) {
        if (values.length > 0) {
          // Get most recent preference
          const mostRecent = values[values.length - 1].value;
          
          // Apply to email structure
          const pathParts = path.split('.');
          let target = emailStructure;
          
          for (let i = 0; i < pathParts.length - 1; i++) {
            if (target[pathParts[i]]) {
              target = target[pathParts[i]];
            }
          }
          
          if (target) {
            target[pathParts[pathParts.length - 1]] = mostRecent;
          }
        }
      }
      
      return emailStructure;
    } catch (error) {
      // No learning data available yet
      return emailStructure;
    }
  }

  /**
   * Export email as final HTML
   */
  exportFinalHTML(emailStructure) {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif;">`;

    emailStructure.components.forEach(component => {
      html += this.renderFinalComponent(component);
    });

    html += `
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Render component for final email (no edit controls)
   */
  renderFinalComponent(component) {
    let html = '';

    switch (component.type) {
      case 'header':
        html = `<div style="${this.styleObjToString(component.styles)}">
          <h1 style="${this.styleObjToString(component.content.title)}">${component.content.title.text}</h1>
          <p style="${this.styleObjToString(component.content.subtitle)}">${component.content.subtitle.text}</p>
        </div>`;
        break;

      case 'textBlock':
        html = `<div style="${this.styleObjToString(component.styles)}">
          <div style="color: ${component.content.color}; font-size: ${component.content.fontSize}; line-height: ${component.content.lineHeight};">
            ${component.content.text}
          </div>
        </div>`;
        break;

      case 'button':
        html = `<div style="${this.styleObjToString(component.styles)}">
          <a href="${component.content.url}" style="${this.styleObjToString(component.content.style)}">
            ${component.content.text}
          </a>
        </div>`;
        break;

      // Add other component types as needed

      default:
        html = `<div>${component.content.text || ''}</div>`;
    }

    return html;
  }

  /**
   * Get learning statistics
   */
  async getLearningStats() {
    const stats = {
      totalTemplates: 0,
      totalEdits: 0,
      learnedPreferences: {},
      popularComponents: []
    };

    try {
      const files = await fs.readdir(this.learningDataPath);
      
      for (const file of files) {
        if (file.endsWith('_learning.json')) {
          const data = JSON.parse(await fs.readFile(path.join(this.learningDataPath, file), 'utf8'));
          stats.totalTemplates++;
          stats.totalEdits += data.statistics?.totalEdits || 0;
          
          // Aggregate preferences
          for (const [key, values] of Object.entries(data.preferences || {})) {
            if (!stats.learnedPreferences[key]) {
              stats.learnedPreferences[key] = 0;
            }
            stats.learnedPreferences[key] += values.length;
          }
        }
      }
    } catch (error) {
      console.error('Error getting learning stats:', error);
    }

    return stats;
  }
  /**
   * Store an email for approval
   */
  async storePendingApprovalEmail(emailData) {
    try {
      const pendingEmail = {
        ...emailData,
        id: emailData.id || `pending_${Date.now()}`,
        storedAt: new Date().toISOString(),
        status: 'pending_approval',
        // 🔥 CRITICAL FIX: Ensure campaignId is preserved (normalize field names)
        campaignId: emailData.campaignId || emailData.campaign_id
      };

      // CRITICAL FIX: Store in Redis for persistence across server restarts
      const redisKey = `pending_email:${pendingEmail.id}`;
      await this.redisClient.set(redisKey, JSON.stringify(pendingEmail), 'EX', 3600); // Expire in 1 hour

      // Also store a list of pending email IDs
      await this.redisClient.lPush('pending_email_ids', pendingEmail.id);
      await this.redisClient.lTrim('pending_email_ids', 0, 9); // Keep only last 10

      // Keep in memory for immediate access
      this.pendingApprovalEmails.push(pendingEmail);
      if (this.pendingApprovalEmails.length > 10) {
        this.pendingApprovalEmails.shift();
      }

      console.log(`📧 Stored pending approval email in Redis: ${pendingEmail.id}`);
      console.log(`   - Campaign ID: ${pendingEmail.campaignId || pendingEmail.campaign_id || 'MISSING'}`); // 🔥 CRITICAL: Log campaignId
      console.log(`   - Template: ${pendingEmail.template}`);
      console.log(`   - HTML length: ${pendingEmail.html?.length || 0}`);
      console.log(`   - Subject: ${pendingEmail.subject}`);

      return pendingEmail;
    } catch (error) {
      console.error('Failed to store pending email:', error);
      return null;
    }
  }

  /**
   * Get all emails pending approval
   * @param {string} campaignId - Optional campaign ID to filter emails
   */
  async getPendingApprovalEmails(campaignId = null) {
    try {
      // First check memory for immediate access
      if (this.pendingApprovalEmails.length > 0) {
        console.log(`📧 Found ${this.pendingApprovalEmails.length} pending emails in memory`);

        // 🔥 CRITICAL FIX: Filter by campaignId if provided
        if (campaignId) {
          const filteredEmails = this.pendingApprovalEmails.filter(email =>
            email.campaignId === campaignId
          );
          console.log(`📧 Filtered to ${filteredEmails.length} emails for campaign: ${campaignId}`);
          return filteredEmails;
        }

        return this.pendingApprovalEmails;
      }

      // If memory is empty, check Redis
      console.log('📧 Memory empty, checking Redis for pending emails...');
      const pendingIds = await this.redisClient.lrange('pending_email_ids', 0, -1);

      if (pendingIds && pendingIds.length > 0) {
        console.log(`📧 Found ${pendingIds.length} pending email IDs in Redis`);
        const pendingEmails = [];

        for (const id of pendingIds) {
          try {
            const emailData = await this.redisClient.get(`pending_email:${id}`);
            if (emailData) {
              const email = JSON.parse(emailData);

              // 🔥 CRITICAL FIX: Filter by campaignId if provided
              if (!campaignId || email.campaignId === campaignId) {
                pendingEmails.push(email);
                console.log(`   ✅ Loaded email ${id} from Redis - Campaign: ${email.campaignId}, Template: ${email.template}`);
              }
            }
          } catch (parseError) {
            console.error(`Failed to parse email ${id}:`, parseError);
          }
        }

        // Update memory cache (with all emails, filtering happens on return)
        this.pendingApprovalEmails = pendingEmails;
        return pendingEmails;
      }

      console.log('📧 No pending emails found in Redis or memory');
      return [];
    } catch (error) {
      console.error('Failed to get pending emails from Redis:', error);
      // Fallback to memory
      if (campaignId) {
        return this.pendingApprovalEmails.filter(email => email.campaignId === campaignId);
      }
      return this.pendingApprovalEmails;
    }
  }

  /**
   * Get a specific pending email by ID
   */
  getPendingEmailById(emailId) {
    return this.pendingApprovalEmails.find(email => email.id === emailId);
  }

  /**
   * Remove an email from pending after approval/send
   */
  removePendingEmail(emailId) {
    const index = this.pendingApprovalEmails.findIndex(email => email.id === emailId);
    if (index > -1) {
      this.pendingApprovalEmails.splice(index, 1);
      console.log(`✅ Removed pending email: ${emailId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all pending emails
   */
  clearPendingEmails() {
    this.pendingApprovalEmails = [];
    console.log('🗑️ Cleared all pending approval emails');
  }
}

module.exports = EmailEditorService;