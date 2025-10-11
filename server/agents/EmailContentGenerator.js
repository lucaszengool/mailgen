/**
 * Email Content Generator
 * 生成个性化邮件内容的AI助手
 * Enhanced with LinkedIn persona-based personalization
 */

const AIEmailGenerator = require('./AIEmailGenerator');

class EmailContentGenerator {
  constructor() {
    // Initialize AI Email Generator for persona-based emails
    this.aiEmailGenerator = new AIEmailGenerator();
    
    this.templates = {
      initial_outreach: {
        subject_templates: [
          'Partnership opportunity with {company_name}',
          'Exploring collaboration with {prospect_name}',
          'Strategic partnership proposal for {company_name}',
          'Business development opportunity'
        ],
        body_templates: [
          `Hi {prospect_name},

I hope this email finds you well. I'm reaching out from {company_name} regarding a potential partnership opportunity.

{value_proposition}

I believe there could be significant synergy between our companies. Would you be open to a brief conversation to explore how we might work together?

Best regards,
{sender_name}`,

          `Dear {prospect_name},

I wanted to connect with you about an exciting collaboration opportunity between {company_name} and {prospect_company}.

{value_proposition}

I'd love to discuss how we can create mutual value. Are you available for a 15-minute call next week?

Looking forward to hearing from you,
{sender_name}`
        ]
      },

      follow_up: {
        subject_templates: [
          'Following up on our partnership discussion',
          'Quick follow-up: {company_name} collaboration',
          'Checking in on potential partnership'
        ],
        body_templates: [
          `Hi {prospect_name},

I wanted to follow up on my previous email about our partnership opportunity. I understand you're busy, but I believe this collaboration could bring significant value to {prospect_company}.

{value_proposition}

Would you be available for a brief call to discuss this further?

Best regards,
{sender_name}`
        ]
      },

      value_focused: {
        subject_templates: [
          'Specific benefits for {prospect_company}',
          'How {company_name} can help {prospect_company}',
          'Value proposition for {prospect_company}'
        ],
        body_templates: [
          `Hi {prospect_name},

I'll be direct about the value {company_name} can provide to {prospect_company}:

{value_proposition}

This could result in:
- {benefit_1}
- {benefit_2}
- {benefit_3}

Are you interested in a 15-minute conversation to explore this further?

Best regards,
{sender_name}`
        ]
      }
    };

    console.log('📧 Email Content Generator initialized');
  }

  /**
   * 生成个性化邮件内容 - Enhanced with LinkedIn personas
   */
  async generateEmailContent(prospect, strategy, emailType = 'initial_outreach') {
    try {
      // Try persona-based email generation first for LinkedIn prospects
      if (prospect.persona || prospect.linkedinProfile) {
        console.log(`🎯 Using persona-based email generation for ${prospect.name}`);
        
        const productInfo = {
          companyName: strategy?.company_name || 'Our Company',
          productName: strategy?.product_name || 'Our Solution',
          valueProposition: strategy?.value_proposition || 'We help businesses grow',
          senderName: 'Your Partner'
        };

        const personaEmail = await this.aiEmailGenerator.generatePersonalizedEmailWithPersona(
          prospect, 
          emailType, 
          productInfo
        );

        if (personaEmail && personaEmail.subject && personaEmail.body) {
          return {
            subject: personaEmail.subject,
            body: personaEmail.body,
            type: emailType,
            personalization: 'high_linkedin_persona',
            personaUsed: true,
            linkedinProfile: prospect.linkedinProfile,
            confidenceScore: personaEmail.confidenceScore,
            template: 'ai_generated_persona'
          };
        }
      }

      // Fallback to template-based generation
      console.log(`📝 Using template-based email generation for ${prospect.name}`);
      const template = this.templates[emailType] || this.templates.initial_outreach;
      
      const subject = this.generateSubject(prospect, strategy, template);
      const body = this.generateBody(prospect, strategy, template);

      return {
        subject,
        body,
        type: emailType,
        personalization: this.getPersonalizationLevel(prospect),
        personaUsed: false,
        template: template
      };
    } catch (error) {
      console.error('❌ Email generation error:', error.message);
      return this.getFallbackEmail(prospect, strategy);
    }
  }

  /**
   * 生成邮件主题
   */
  generateSubject(prospect, strategy, template) {
    const subjects = template.subject_templates;
    const selectedSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    return this.replacePlaceholders(selectedSubject, prospect, strategy);
  }

  /**
   * 生成邮件正文
   */
  generateBody(prospect, strategy, template) {
    const bodies = template.body_templates;
    const selectedBody = bodies[Math.floor(Math.random() * bodies.length)];
    
    return this.replacePlaceholders(selectedBody, prospect, strategy);
  }

  /**
   * 替换模板占位符
   */
  replacePlaceholders(template, prospect, strategy) {
    return template
      .replace(/{prospect_name}/g, prospect.name || 'there')
      .replace(/{prospect_company}/g, prospect.company || 'your company')
      .replace(/{company_name}/g, strategy.company_name || 'our company')
      .replace(/{sender_name}/g, strategy.sender_name || 'Our Team')
      .replace(/{value_proposition}/g, this.getValueProposition(strategy))
      .replace(/{benefit_1}/g, this.getBenefit(strategy, 1))
      .replace(/{benefit_2}/g, this.getBenefit(strategy, 2))
      .replace(/{benefit_3}/g, this.getBenefit(strategy, 3));
  }

  /**
   * 获取价值主张
   */
  getValueProposition(strategy) {
    if (strategy.description) {
      return strategy.description;
    }
    
    return `Our innovative solutions in ${strategy.industry || 'technology'} can help streamline your operations and drive growth.`;
  }

  /**
   * 获取具体收益
   */
  getBenefit(strategy, index) {
    const benefits = [
      'Increased operational efficiency',
      'Cost reduction through automation',
      'Enhanced customer experience',
      'Improved data insights',
      'Scalable growth solutions'
    ];
    
    return benefits[index - 1] || benefits[0];
  }

  /**
   * 获取个性化程度
   */
  getPersonalizationLevel(prospect) {
    let level = 0;
    
    if (prospect.name) level += 25;
    if (prospect.company) level += 25;
    if (prospect.title) level += 25;
    if (prospect.industry) level += 25;
    
    return level;
  }

  /**
   * 获取备用邮件模板
   */
  getFallbackEmail(prospect, strategy) {
    return {
      subject: `Business opportunity for ${prospect.company || 'your company'}`,
      body: `Hi ${prospect.name || 'there'},

I hope this email finds you well. I'm reaching out regarding a potential business opportunity that could benefit ${prospect.company || 'your company'}.

${strategy.description || 'We offer innovative solutions that can help drive your business forward.'}

Would you be interested in a brief conversation to explore this further?

Best regards,
${strategy.company_name || 'Our Team'}`,
      type: 'fallback',
      personalization: this.getPersonalizationLevel(prospect),
      template: 'fallback'
    };
  }

  /**
   * 批量生成邮件内容
   */
  generateBulkEmails(prospects, strategy, emailTypes = ['initial_outreach']) {
    return prospects.map(prospect => {
      const emailType = emailTypes[Math.floor(Math.random() * emailTypes.length)];
      return {
        prospect,
        email_content: this.generateEmailContent(prospect, strategy, emailType),
        scheduled_date: new Date().toISOString()
      };
    });
  }

  /**
   * A/B测试邮件变体
   */
  generateEmailVariants(prospect, strategy, variantCount = 2) {
    const variants = [];
    const types = Object.keys(this.templates);
    
    for (let i = 0; i < variantCount; i++) {
      const type = types[i % types.length];
      variants.push({
        variant: `variant_${i + 1}`,
        content: this.generateEmailContent(prospect, strategy, type)
      });
    }
    
    return variants;
  }
}

module.exports = EmailContentGenerator;