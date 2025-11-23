/**
 * Auto Email Generator Service
 *
 * Automatically generates emails for prospects that don't have one yet
 */

const database = require('../models/database');

class AutoEmailGenerator {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 30000; // Check every 30 seconds
    this.intervalId = null;
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
   */
  async checkAndGenerateEmails() {
    try {
      // Get all contacts from database
      const contacts = await database.getAllContacts();

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
      const PersonalizedEmailGenerator = require('./PersonalizedEmailGenerator');

      for (const prospect of prospects) {
        try {
          // Generate personalized email
          const emailData = await PersonalizedEmailGenerator.generatePersonalizedEmail({
            prospectName: prospect.name || 'there',
            prospectEmail: prospect.email,
            companyName: prospect.company || 'your company',
            industry: prospect.industry || 'technology',
            estimatedRole: prospect.position || 'professional',
            specificPainPoints: ['efficiency', 'growth'],
            ourCompany: 'Our Company',
            ourProduct: 'our solution',
            senderName: 'The Team',
            website: '',
            emailGoal: 'initial_contact',
            templateId: prospect.templateId || 'professional'
          });

          if (emailData && emailData.body) {
            // Save to database
            await database.updateContact(prospect.email, {
              personalizedEmail: emailData.body,
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
