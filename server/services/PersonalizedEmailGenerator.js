/**
 * PersonalizedEmailGenerator - AI-powered personalized email generation using Ollama
 * REWRITTEN: Clean version to fix syntax corruption
 */
const axios = require('axios');

class PersonalizedEmailGenerator {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.emailModel = 'qwen2.5:0.5b';
    this.templateRotationIndex = 0;

    console.log('📧 PersonalizedEmailGenerator initialized');
    console.log('🤖 AI Model:', this.emailModel);
  }

  /**
   * Generate a personalized email for a prospect
   */
  async generatePersonalizedEmail(prospect, businessAnalysis, marketingStrategy, campaignGoal = 'partnership', templateData = null) {
    console.log(`📧 Generating email for ${prospect.email}...`);

    try {
      const persona = prospect.persona || {};
      const senderName = prospect.templateData?.senderName || businessAnalysis?.senderInfo?.senderName || 'James Wilson';
      const companyName = businessAnalysis?.companyName || 'FruitAI';
      const prospectName = prospect.name || prospect.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'there';
      const prospectCompany = prospect.company || prospect.email.split('@')[1]?.split('.')[0] || 'your company';
      const websiteUrl = businessAnalysis?.targetWebsite || businessAnalysis?.website || 'https://yourcompany.com';

      // If user has custom template with HTML, use that directly
      if (templateData?.html) {
        console.log('📧 Using user-provided HTML template');
        return this.generateFromUserTemplate(prospect, businessAnalysis, templateData, senderName, companyName, prospectName, prospectCompany);
      }

      // Build prompt for Ollama
      const prompt = this.buildEmailPrompt(prospectName, prospectCompany, companyName, senderName, businessAnalysis, persona, campaignGoal);

      // Generate personalized content using Ollama
      let personalizedContent = await this.generateWithOllama(prompt);

      // Clean up the content
      personalizedContent = this.cleanEmailContent(personalizedContent, prospectName, senderName);

      // Generate HTML version
      const htmlContent = this.generateHTMLEmail(personalizedContent, companyName, senderName, websiteUrl);

      // Generate subject line
      const subject = this.generateSubject(prospectCompany, campaignGoal);

      return {
        success: true,
        email: {
          subject: subject,
          body: personalizedContent,
          html: htmlContent,
          template_used: 'ai_personalized',
          content_type: 'html',
          recipient_email: prospect.email,
          sender_name: senderName,
          sender_email: businessAnalysis?.senderInfo?.senderEmail || 'contact@company.com'
        }
      };
    } catch (error) {
      console.error('📧 Email generation error:', error.message);
      return this.generateFallbackEmail(prospect, businessAnalysis);
    }
  }

  /**
   * Build the Ollama prompt
   */
  buildEmailPrompt(prospectName, prospectCompany, companyName, senderName, businessAnalysis, persona, campaignGoal) {
    const industry = businessAnalysis?.industry || 'technology';
    const product = businessAnalysis?.mainProducts?.[0]?.title || 'AI-powered solutions';
    const role = persona.estimatedRole || 'Executive';

    return 'Write a professional business partnership email.\n\n' +
      'RECIPIENT:\n' +
      '- Name: ' + prospectName + '\n' +
      '- Company: ' + prospectCompany + '\n' +
      '- Role: ' + role + '\n\n' +
      'OUR COMPANY:\n' +
      '- Company: ' + companyName + '\n' +
      '- Sender: ' + senderName + '\n' +
      '- Industry: ' + industry + '\n' +
      '- Product: ' + product + '\n\n' +
      'Write a personalized email that:\n' +
      '1. Addresses ' + prospectName + ' personally\n' +
      '2. References ' + prospectCompany + ' business\n' +
      '3. Explains how ' + companyName + ' can help them\n' +
      '4. Includes 2-3 specific benefits\n' +
      '5. Has a clear call-to-action\n' +
      '6. Is 150-200 words\n\n' +
      'Write the complete email body only. No subject line. Use real names.';
  }

  /**
   * Generate content using Ollama
   */
  async generateWithOllama(prompt) {
    try {
      const response = await axios.post(this.ollamaUrl + '/api/generate', {
        model: this.emailModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      }, { timeout: 30000 });

      return response.data.response || '';
    } catch (error) {
      console.log('📧 Ollama failed, using fallback');
      throw error;
    }
  }

  /**
   * Clean up generated email content
   */
  cleanEmailContent(content, prospectName, senderName) {
    return content
      .replace(/^SUBJECT:.*$/mi, '')
      .replace(/^Subject:.*$/mi, '')
      .replace(/^\s*\n+/, '')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  }

  /**
   * Generate HTML email
   */
  generateHTMLEmail(content, companyName, senderName, websiteUrl) {
    const paragraphs = content.split('\n').filter(function(p) { return p.trim(); });
    const htmlParagraphs = paragraphs.map(function(p) {
      return '<p style="margin-bottom: 15px; line-height: 1.6;">' + p + '</p>';
    }).join('');

    return '<div style="font-family: Segoe UI, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #4338ca 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white;">' +
      '<h1 style="margin: 0; font-size: 24px;">' + companyName + '</h1>' +
      '</div>' +
      '<div style="padding: 30px; color: #333;">' +
      htmlParagraphs +
      '</div>' +
      '<div style="text-align: center; padding: 20px;">' +
      '<a href="' + websiteUrl + '" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #4338ca 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Learn More</a>' +
      '</div>' +
      '<div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666;">' +
      '<p style="margin: 0;">Best regards,<br><strong>' + senderName + '</strong><br>' + companyName + '</p>' +
      '</div>' +
      '</div>';
  }

  /**
   * Generate subject line
   */
  generateSubject(prospectCompany, campaignGoal) {
    var subjects = [
      'Partnership Opportunity - ' + prospectCompany,
      'Quick question for ' + prospectCompany,
      prospectCompany + ': Strategic collaboration?',
      'Idea for ' + prospectCompany,
      prospectCompany + ' + AI = Growth?'
    ];
    var index = this.templateRotationIndex++ % subjects.length;
    return subjects[index];
  }

  /**
   * Generate from user-provided template
   */
  generateFromUserTemplate(prospect, businessAnalysis, templateData, senderName, companyName, prospectName, prospectCompany) {
    var html = templateData.html || '';

    // Replace placeholders
    html = html.replace(/{name}/gi, prospectName);
    html = html.replace(/{company}/gi, prospectCompany);
    html = html.replace(/{senderName}/gi, senderName);
    html = html.replace(/{companyName}/gi, companyName);

    var subject = (templateData.subject || 'Partnership Opportunity')
      .replace(/{company}/gi, prospectCompany)
      .replace(/{name}/gi, prospectName);

    return {
      success: true,
      email: {
        subject: subject,
        body: html,
        html: html,
        template_used: 'user_template',
        content_type: 'html',
        customized: true,
        recipient_email: prospect.email,
        sender_name: senderName
      }
    };
  }

  /**
   * Generate email from user template (alias for compatibility)
   */
  generateEmailFromUserTemplate(prospect, businessAnalysis, marketingStrategy, templateData) {
    var senderName = prospect.templateData?.senderName || businessAnalysis?.senderInfo?.senderName || 'James Wilson';
    var companyName = businessAnalysis?.companyName || 'FruitAI';
    var prospectName = prospect.name || prospect.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'there';
    var prospectCompany = prospect.company || prospect.email.split('@')[1]?.split('.')[0] || 'your company';

    return this.generateFromUserTemplate(prospect, businessAnalysis, templateData, senderName, companyName, prospectName, prospectCompany);
  }

  /**
   * Generate fallback email when Ollama fails
   */
  generateFallbackEmail(prospect, businessAnalysis) {
    var prospectName = prospect.name || 'there';
    var prospectCompany = prospect.company || 'your company';
    var senderName = businessAnalysis?.senderInfo?.senderName || 'The Team';
    var companyName = businessAnalysis?.companyName || 'FruitAI';

    var body = 'Dear ' + prospectName + ',\n\n' +
      'I hope this message finds you well. I am reaching out from ' + companyName + ' because I believe we can help ' + prospectCompany + ' achieve remarkable results.\n\n' +
      'Our AI-powered platform has helped similar companies:\n' +
      '- Increase efficiency by 40%\n' +
      '- Reduce operational costs by 25%\n' +
      '- Improve customer satisfaction by 35%\n\n' +
      'I would love to schedule a brief 15-minute call to discuss how ' + companyName + ' can support ' + prospectCompany + ' growth.\n\n' +
      'Best regards,\n' +
      senderName + '\n' +
      companyName;

    return {
      success: true,
      email: {
        subject: 'Partnership Opportunity - ' + prospectCompany,
        body: body,
        html: this.generateHTMLEmail(body, companyName, senderName, 'https://yourcompany.com'),
        template_used: 'fallback',
        content_type: 'html',
        recipient_email: prospect.email,
        sender_name: senderName
      }
    };
  }

  /**
   * Batch generate emails for multiple prospects
   */
  async generateBatchPersonalizedEmails(prospects, businessAnalysis, marketingStrategy, campaignGoal) {
    console.log('📧 Generating ' + prospects.length + ' emails...');
    var results = [];
    var self = this;

    for (var i = 0; i < prospects.length; i++) {
      var prospect = prospects[i];
      console.log('📧 [' + (i + 1) + '/' + prospects.length + '] ' + prospect.email);

      try {
        var result = await self.generatePersonalizedEmail(prospect, businessAnalysis, marketingStrategy, campaignGoal);
        results.push({ prospect: prospect, success: result.success, email: result.email });

        // Small delay between emails
        await new Promise(function(resolve) { setTimeout(resolve, 1000); });
      } catch (error) {
        results.push({ prospect: prospect, success: false, error: error.message });
      }
    }

    var successCount = results.filter(function(r) { return r.success; }).length;
    console.log('📧 Complete: ' + successCount + '/' + prospects.length + ' successful');

    return {
      success: true,
      total_processed: prospects.length,
      successful_emails: successCount,
      failed_emails: prospects.length - successCount,
      results: results
    };
  }
}

module.exports = PersonalizedEmailGenerator;
