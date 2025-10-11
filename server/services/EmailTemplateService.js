/**
 * Email Template Learning Service
 * Records user edits to the first email and applies them as a template to subsequent emails
 */

class EmailTemplateService {
  constructor() {
    this.learnedTemplates = new Map();
    this.emailComponents = new Map();
  }

  getAllTemplates() {
    return Array.from(this.learnedTemplates.entries()).map(([campaignId, template]) => ({
      campaignId,
      templateId: template.id,
      createdAt: template.createdAt
    }));
  }
}

module.exports = EmailTemplateService;
