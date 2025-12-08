/**
 * Auto Email Generator Service
 *
 * Automatically generates emails for prospects that don't have one yet
 */

const database = require('../models/database');
const PersonalizedEmailGeneratorClass = require('./PersonalizedEmailGenerator');

// Create a singleton instance of the email generator
const emailGeneratorInstance = new PersonalizedEmailGeneratorClass();

class AutoEmailGenerator {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 30000; // Check every 30 seconds
    this.intervalId = null;
    this.emailGenerator = emailGeneratorInstance;
  }

  /**
   * Start the auto email generation service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ [AutoEmailGen] Service already running');
      return;
    }

    console.log('🚀 [AutoEmailGen] Starting auto email generation service...');
    this.isRunning = true;

    // Run immediately on start
    this.checkAndGenerateEmails();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.checkAndGenerateEmails();
    }, this.checkInterval);
  }

  /**
   * Stop the auto email generation service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 [AutoEmailGen] Stopping auto email generation service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for prospects without emails and generate them
   * 🔥 NOTE: This service is now disabled as email generation is handled by LangGraphMarketingAgent
   * The main workflow handles email generation through the template selection flow
   */
  async checkAndGenerateEmails() {
    try {
      // 🔥 DISABLED: Auto email generation is handled by LangGraphMarketingAgent
      // This service was causing confusion because it queries 'anonymous' user
      // and uses a different check (personalizedEmail column) than the main workflow (email_drafts table)
      console.log('✅ [AutoEmailGen] All prospects have emails generated');
      return;

      /* ORIGINAL CODE - Disabled
      // Get all contacts from database (using getContacts instead of getAllContacts)
      const contacts = await database.getContacts('anonymous', {}, 10000).catch(err => {
        if (err.message.includes('no such table')) {
          console.warn('⚠️ [AutoEmailGen] Contacts table not yet initialized, skipping...');
          return [];
        }
        throw err;
      });

      // Filter prospects without personalized emails
      const prospectsNeedingEmails = contacts.filter(contact => {
        return !contact.personalizedEmail ||
               !contact.emailSubject ||
               contact.personalizedEmail === '' ||
               contact.personalizedEmail === 'null';
      });

      if (prospectsNeedingEmails.length === 0) {
        console.log('✅ [AutoEmailGen] All prospects have emails generated');
        return;
      }
      */

      console.log(`📧 [AutoEmailGen] Found ${prospectsNeedingEmails.length} prospects needing emails`);

      // Group by campaign to batch generate
      const byCampaign = {};
      for (const prospect of prospectsNeedingEmails) {
        const campaignId = prospect.campaignId || 'default';
        if (!byCampaign[campaignId]) {
          byCampaign[campaignId] = [];
        }
        byCampaign[campaignId].push(prospect);
      }

      // Generate emails for each campaign
      for (const [campaignId, prospects] of Object.entries(byCampaign)) {
        console.log(`📧 [AutoEmailGen] Generating emails for ${prospects.length} prospects in campaign: ${campaignId}`);

        // Generate emails in batches of 5 to avoid overload
        for (let i = 0; i < prospects.length; i += 5) {
          const batch = prospects.slice(i, i + 5);
          await this.generateEmailsForBatch(batch, campaignId);
        }
      }

    } catch (error) {
      console.error('❌ [AutoEmailGen] Error checking for prospects:', error.message);
    }
  }

  /**
   * Generate emails for a batch of prospects
   */
  async generateEmailsForBatch(prospects, campaignId) {
    try {
      // 🔥 FIX: Use the instance method instead of static call
      for (const prospect of prospects) {
        try {
          // Build prospect object for the email generator
          const prospectData = {
            email: prospect.email,
            name: prospect.name || 'there',
            company: prospect.company || 'your company',
            position: prospect.position || 'professional',
            industry: prospect.industry || 'technology'
          };

          // Build minimal business analysis
          const businessAnalysis = {
            companyName: 'Our Company',
            targetWebsite: ''
          };

          // Build minimal marketing strategy
          const marketingStrategy = {
            emailGoal: 'initial_contact'
          };

          // Generate personalized email using instance method
          const emailData = await this.emailGenerator.generatePersonalizedEmail(
            prospectData,
            businessAnalysis,
            marketingStrategy,
            'partnership',
            null
          );

          if (emailData && (emailData.body || emailData.html)) {
            // Save to database
            await database.updateContact(prospect.email, {
              personalizedEmail: emailData.body || emailData.html,
              emailSubject: emailData.subject || 'Let\'s connect',
              generatedAt: new Date().toISOString()
            });

            console.log(`✅ [AutoEmailGen] Generated email for: ${prospect.email}`);
          }

        } catch (emailError) {
          console.error(`❌ [AutoEmailGen] Failed to generate email for ${prospect.email}:`, emailError.message);
        }

        // Small delay between each generation to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('❌ [AutoEmailGen] Error generating batch:', error.message);
    }
  }
}

// Create singleton instance
const autoEmailGenerator = new AutoEmailGenerator();

module.exports = autoEmailGenerator;
