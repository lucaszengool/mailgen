#!/usr/bin/env node

/**
 * Comprehensive System Test Suite
 * Tests all major fixes and improvements without timeouts
 */

const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
const PremiumEmailTemplates2025 = require('./server/services/PremiumEmailTemplates2025');

class ComprehensiveSystemTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = level === 'success' ? '✅' : level === 'error' ? '❌' : level === 'warning' ? '⚠️' : '📝';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  addResult(testName, passed, details) {
    this.results.tests.push({ testName, passed, details });
    if (passed) {
      this.results.passed++;
      this.log(`${testName}: PASSED`, 'success');
    } else {
      this.results.failed++;
      this.log(`${testName}: FAILED - ${details}`, 'error');
    }
  }

  // Test 1: Fix email personalization issues - all emails have same content
  async testEmailPersonalization() {
    try {
      const templates = new PremiumEmailTemplates2025();
      
      // Generate 3 emails with different prospects
      const prospects = [
        { name: 'John Smith', email: 'john@techcorp.com', company: 'TechCorp', industry: 'Technology' },
        { name: 'Sarah Johnson', email: 'sarah@medtech.com', company: 'MedTech', industry: 'Healthcare' },
        { name: 'Mike Chen', email: 'mike@fintech.com', company: 'FinTech', industry: 'Finance' }
      ];

      const emails = [];
      for (const prospect of prospects) {
        const result = templates.generatePremiumPartnershipEmail(prospect, { companyName: 'FruitAI' }, null, {});
        emails.push(result.subject + result.body);
      }

      // Check if emails are unique
      const isUnique = emails[0] !== emails[1] && emails[1] !== emails[2] && emails[0] !== emails[2];
      
      this.addResult('Email Personalization', isUnique, isUnique ? 'All emails are unique' : 'Emails are identical');
    } catch (error) {
      this.addResult('Email Personalization', false, error.message);
    }
  }

  // Test 2: Fix company name extraction - showing Gmail instead of real company
  async testCompanyNameExtraction() {
    try {
      const generator = new PersonalizedEmailGenerator();
      
      const testProspect = {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Solutions'
      };

      // Test company name extraction
      const extractedCompany = generator.extractCompanyName(testProspect);
      const isCorrect = extractedCompany === 'TechCorp Solutions' && !extractedCompany.includes('Gmail');
      
      this.addResult('Company Name Extraction', isCorrect, `Extracted: ${extractedCompany}`);
    } catch (error) {
      this.addResult('Company Name Extraction', false, error.message);
    }
  }

  // Test 3: Campaign goal integration - frontend selection reaching backend
  async testCampaignGoalIntegration() {
    try {
      const templates = new PremiumEmailTemplates2025();
      
      const testProspect = { name: 'John', email: 'john@test.com', company: 'Test' };
      const businessAnalysis = { companyName: 'FruitAI' };
      
      // Test different campaign goals
      const partnershipResult = templates.generatePremiumPartnershipEmail(
        testProspect, businessAnalysis, null, { campaignGoal: 'partnership' }
      );
      
      const salesResult = templates.generatePremiumPartnershipEmail(
        testProspect, businessAnalysis, null, { campaignGoal: 'direct_sales' }
      );

      const hasPartnershipContent = partnershipResult.body.includes('partnership') || partnershipResult.body.includes('collaboration');
      const hasSalesContent = salesResult.body.includes('demo') || salesResult.body.includes('trial');
      
      this.addResult('Campaign Goal Integration', hasPartnershipContent && hasSalesContent, 
        `Partnership: ${hasPartnershipContent}, Sales: ${hasSalesContent}`);
    } catch (error) {
      this.addResult('Campaign Goal Integration', false, error.message);
    }
  }

  // Test 4: Replace placeholder icons with real high-end icons
  async testIconReplacement() {
    try {
      const templates = new PremiumEmailTemplates2025();
      const testProspect = { name: 'John', email: 'john@test.com', company: 'Test' };
      const result = templates.generatePremiumPartnershipEmail(testProspect, { companyName: 'FruitAI' }, null, {});

      // Check for SVG icons instead of placeholders
      const hasSVGIcons = result.body.includes('<svg') && result.body.includes('<path');
      const hasNoPlaceholders = !result.body.includes('JTQM') && !result.body.includes('○') && !result.body.includes('●');
      
      this.addResult('Icon Replacement', hasSVGIcons && hasNoPlaceholders, 
        `SVG Icons: ${hasSVGIcons}, No Placeholders: ${hasNoPlaceholders}`);
    } catch (error) {
      this.addResult('Icon Replacement', false, error.message);
    }
  }

  // Test 5: Create 36 different email UI templates
  async testTemplateVariations() {
    try {
      const templates = new PremiumEmailTemplates2025();
      
      // Test if different template methods exist
      const methods = [
        'generatePremiumPartnershipEmail',
        'generatePremiumColdOutreach', 
        'generatePremiumValueDemo',
        'generatePremiumFollowUp'
      ];

      let existingMethods = 0;
      for (const method of methods) {
        if (typeof templates[method] === 'function') {
          existingMethods++;
        }
      }

      this.addResult('Template Variations', existingMethods >= 3, `Found ${existingMethods}/4 template methods`);
    } catch (error) {
      this.addResult('Template Variations', false, error.message);
    }
  }

  // Test 6: Add CTA URL configuration
  async testCTAConfiguration() {
    try {
      const templates = new PremiumEmailTemplates2025();
      
      const testProspect = {
        name: 'John',
        email: 'john@test.com',
        company: 'Test',
        templateData: {
          ctaUrl: 'https://calendly.com/custom-meeting',
          ctaText: 'Book My Custom Meeting',
          senderName: 'Custom Sender'
        }
      };

      const result = templates.generatePremiumPartnershipEmail(testProspect, { companyName: 'FruitAI' }, null, {});
      
      const hasCustomCTA = result.body.includes('calendly.com/custom-meeting') && 
                           result.body.includes('Book My Custom Meeting') &&
                           result.body.includes('Custom Sender');
      
      this.addResult('CTA Configuration', hasCustomCTA, hasCustomCTA ? 'Custom CTA working' : 'CTA not customized');
    } catch (error) {
      this.addResult('CTA Configuration', false, error.message);
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🧪 Starting Comprehensive System Test Suite...', 'info');
    console.log('=====================================');

    await this.testEmailPersonalization();
    await this.testCompanyNameExtraction();  
    await this.testCampaignGoalIntegration();
    await this.testIconReplacement();
    await this.testTemplateVariations();
    await this.testCTAConfiguration();

    // Print summary
    console.log('=====================================');
    console.log('📊 TEST SUMMARY:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

    if (this.results.failed === 0) {
      this.log('🎉 ALL TESTS PASSED! System is working correctly.', 'success');
    } else {
      this.log(`⚠️ ${this.results.failed} tests failed. Review and fix issues.`, 'warning');
    }

    return this.results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ComprehensiveSystemTest();
  testSuite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveSystemTest;