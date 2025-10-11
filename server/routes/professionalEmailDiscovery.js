/**
 * Professional Email Discovery API Routes
 * Provides endpoints for discovering high-quality professional emails
 */

const express = require('express');
const router = express.Router();
const ProfessionalEmailDiscovery = require('../agents/ProfessionalEmailDiscovery');

const emailDiscovery = new ProfessionalEmailDiscovery();

/**
 * POST /api/professional-email-discovery
 * Discover professional emails for a company
 */
router.post('/', async (req, res) => {
  try {
    const { companyInfo, searchCriteria } = req.body;
    
    // Validate input
    if (!companyInfo || !companyInfo.name || !companyInfo.website) {
      return res.status(400).json({
        success: false,
        error: 'Company info with name and website is required'
      });
    }
    
    console.log(`🎯 Starting professional email discovery for: ${companyInfo.name}`);
    
    // Discover professional emails
    const prospects = await emailDiscovery.discoverProfessionalEmails(companyInfo);
    
    // Get discovery summary
    const summary = emailDiscovery.getDiscoverySummary(prospects);
    
    console.log(`✅ Email discovery completed: ${prospects.length} prospects found`);
    
    res.json({
      success: true,
      data: {
        prospects: prospects,
        summary: summary,
        companyInfo: companyInfo,
        searchCriteria: searchCriteria,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Professional email discovery failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to discover professional emails'
    });
  }
});

/**
 * GET /api/professional-email-discovery/sources
 * Get available email discovery sources and methods
 */
router.get('/sources', (req, res) => {
  res.json({
    success: true,
    data: {
      sources: [
        {
          name: 'LinkedIn Simulation',
          description: 'Simulates LinkedIn Sales Navigator discovery',
          quality: 'high',
          verificationRate: 70
        },
        {
          name: 'Pattern Analysis', 
          description: 'Analyzes company email patterns',
          quality: 'medium',
          verificationRate: 50
        },
        {
          name: 'Executive Targeting',
          description: 'Targets specific executive roles',
          quality: 'high',
          verificationRate: 60
        }
      ],
      methods: [
        'Role-based targeting',
        'Email pattern analysis',
        'Professional verification',
        'Quality scoring'
      ]
    }
  });
});

/**
 * POST /api/professional-email-discovery/verify
 * Verify a list of email addresses
 */
router.post('/verify', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        error: 'Email list is required'
      });
    }
    
    console.log(`🔍 Verifying ${emails.length} email addresses`);
    
    // Simulate email verification
    const verifiedEmails = emailDiscovery.simulateEmailVerification(
      emails.map(email => ({ email, verified: false }))
    );
    
    console.log(`✅ Email verification completed`);
    
    res.json({
      success: true,
      data: {
        verified: verifiedEmails,
        totalSubmitted: emails.length,
        totalVerified: verifiedEmails.filter(e => e.verified).length,
        verificationRate: Math.round(
          (verifiedEmails.filter(e => e.verified).length / emails.length) * 100
        )
      }
    });
    
  } catch (error) {
    console.error('❌ Email verification failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to verify emails'
    });
  }
});

module.exports = router;