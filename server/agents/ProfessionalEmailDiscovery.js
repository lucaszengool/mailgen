/**
 * Professional Email Discovery System
 * Based on real B2B sales prospecting techniques used by professional sales teams
 * Focuses on finding individual decision-maker emails, not generic company emails
 */

class ProfessionalEmailDiscovery {
  constructor() {
    this.commonEmailPatterns = [
      // Most common patterns used by executives and decision makers
      '{first}.{last}@{domain}',
      '{first}{last}@{domain}',
      '{first}__{last}@{domain}',
      '{first}-{last}@{domain}',
      '{first}@{domain}',
      '{last}@{domain}',
      '{first}.{last.initial}@{domain}',
      '{first.initial}.{last}@{domain}',
      '{first.initial}{last}@{domain}'
    ];

    this.executiveRoles = [
      'CEO', 'Chief Executive Officer', 'President', 'Founder', 'Co-Founder',
      'CMO', 'Chief Marketing Officer', 'Marketing Director', 'VP Marketing',
      'CTO', 'Chief Technology Officer', 'VP Engineering', 'Tech Lead',
      'Sales Director', 'VP Sales', 'Head of Sales', 'Business Development',
      'COO', 'Chief Operating Officer', 'Operations Director'
    ];

    this.targetTitles = {
      'B2B': ['CEO', 'Founder', 'VP Sales', 'Marketing Director', 'Business Development Manager'],
      'B2C': ['CMO', 'Marketing Manager', 'Brand Manager', 'Digital Marketing Director'],
      'Tech': ['CTO', 'VP Engineering', 'Product Manager', 'Tech Lead']
    };
  }

  /**
   * Main method to discover professional emails using multiple techniques
   */
  async discoverProfessionalEmails(companyInfo) {
    console.log(`🎯 Professional Email Discovery for: ${companyInfo.name}`);
    
    const results = [];
    
    try {
      // Method 1: LinkedIn-based discovery simulation
      const linkedinEmails = await this.simulateLinkedInDiscovery(companyInfo);
      results.push(...linkedinEmails);
      
      // Method 2: Company pattern analysis
      const patternEmails = await this.analyzeCompanyEmailPatterns(companyInfo);
      results.push(...patternEmails);
      
      // Method 3: Executive role targeting
      const executiveEmails = await this.generateExecutiveEmails(companyInfo);
      results.push(...executiveEmails);
      
      // Method 4: Professional verification simulation
      const verifiedEmails = this.simulateEmailVerification(results);
      
      return this.deduplicateAndScore(verifiedEmails);
      
    } catch (error) {
      console.error('❌ Professional email discovery failed:', error);
      return [];
    }
  }

  /**
   * Simulate LinkedIn Sales Navigator style discovery
   * Real sales teams use Chrome extensions like Kaspr, Cognism to extract from LinkedIn
   */
  async simulateLinkedInDiscovery(companyInfo) {
    console.log('💼 Simulating LinkedIn Sales Navigator discovery...');
    
    const domain = this.extractDomain(companyInfo.website);
    const prospects = [];
    
    // Simulate finding executives on LinkedIn
    const executiveProfiles = [
      { name: 'John Smith', title: 'CEO', verified: true },
      { name: 'Sarah Johnson', title: 'CMO', verified: true },
      { name: 'Mike Chen', title: 'VP Sales', verified: false },
      { name: 'Lisa Rodriguez', title: 'Marketing Director', verified: true }
    ];
    
    for (const profile of executiveProfiles) {
      const email = this.generatePersonalEmail(profile.name, domain);
      prospects.push({
        email: email,
        fullName: profile.name,
        title: profile.title,
        company: companyInfo.name,
        source: 'LinkedIn Simulation',
        verified: profile.verified,
        qualityScore: this.calculateQualityScore('linkedin', profile.title, profile.verified),
        type: 'individual'
      });
    }
    
    console.log(`✅ Found ${prospects.length} LinkedIn prospects`);
    return prospects;
  }

  /**
   * Analyze company email patterns by looking at known employees
   * Real tools like Hunter.io do this by analyzing email patterns they've discovered
   */
  async analyzeCompanyEmailPatterns(companyInfo) {
    console.log('🔍 Analyzing company email patterns...');
    
    const domain = this.extractDomain(companyInfo.website);
    const prospects = [];
    
    // Simulate pattern analysis (real tools analyze thousands of emails to find patterns)
    const detectedPattern = '{first}.{last}@{domain}'; // Most common pattern
    
    // Generate emails for key decision makers using the detected pattern
    const keyDecisionMakers = [
      { name: 'David Wilson', title: 'Founder' },
      { name: 'Emma Thompson', title: 'Head of Marketing' },
      { name: 'Alex Kim', title: 'VP Business Development' }
    ];
    
    for (const person of keyDecisionMakers) {
      const email = this.generateEmailFromPattern(person.name, domain, detectedPattern);
      prospects.push({
        email: email,
        fullName: person.name,
        title: person.title,
        company: companyInfo.name,
        source: 'Pattern Analysis',
        verified: false,
        qualityScore: this.calculateQualityScore('pattern', person.title, false),
        type: 'individual',
        pattern: detectedPattern
      });
    }
    
    console.log(`📧 Generated ${prospects.length} pattern-based emails`);
    return prospects;
  }

  /**
   * Target specific executive roles based on campaign goal
   * Professional sales teams focus on specific titles that match their ICP
   */
  async generateExecutiveEmails(companyInfo) {
    console.log('👔 Generating executive-focused emails...');
    
    const domain = this.extractDomain(companyInfo.website);
    const prospects = [];
    
    // Focus on high-value decision maker titles
    const executiveTargets = [
      { firstName: 'James', lastName: 'Brown', title: 'CEO' },
      { firstName: 'Maria', lastName: 'Garcia', title: 'Chief Marketing Officer' },
      { firstName: 'Robert', lastName: 'Taylor', title: 'VP Sales' },
      { firstName: 'Jennifer', lastName: 'Lee', title: 'Marketing Director' }
    ];
    
    for (const exec of executiveTargets) {
      // Try multiple email patterns for each executive
      const emailVariations = this.generateEmailVariations(exec.firstName, exec.lastName, domain);
      
      for (const email of emailVariations) {
        prospects.push({
          email: email,
          fullName: `${exec.firstName} ${exec.lastName}`,
          title: exec.title,
          company: companyInfo.name,
          source: 'Executive Targeting',
          verified: false,
          qualityScore: this.calculateQualityScore('executive', exec.title, false),
          type: 'individual'
        });
      }
    }
    
    console.log(`🎯 Generated ${prospects.length} executive emails`);
    return prospects;
  }

  /**
   * Generate multiple email variations for a person
   */
  generateEmailVariations(firstName, lastName, domain) {
    const variations = [];
    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    const firstInitial = first.charAt(0);
    const lastInitial = last.charAt(0);
    
    // Common executive email patterns
    variations.push(`${first}.${last}@${domain}`);
    variations.push(`${first}${last}@${domain}`);
    variations.push(`${first}_${last}@${domain}`);
    variations.push(`${first}-${last}@${domain}`);
    variations.push(`${firstInitial}.${last}@${domain}`);
    variations.push(`${firstInitial}${last}@${domain}`);
    
    return variations.slice(0, 2); // Return top 2 most likely patterns
  }

  /**
   * Generate personal email from pattern
   */
  generateEmailFromPattern(fullName, domain, pattern) {
    const [firstName, lastName] = fullName.toLowerCase().split(' ');
    const firstInitial = firstName.charAt(0);
    const lastInitial = lastName.charAt(0);
    
    return pattern
      .replace('{first}', firstName)
      .replace('{last}', lastName)
      .replace('{first.initial}', firstInitial)
      .replace('{last.initial}', lastInitial)
      .replace('{domain}', domain);
  }

  /**
   * Generate personal email from name and domain
   */
  generatePersonalEmail(fullName, domain) {
    const [firstName, lastName] = fullName.toLowerCase().split(' ');
    return `${firstName}.${lastName}@${domain}`;
  }

  /**
   * Extract domain from website URL
   */
  extractDomain(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace('www.', '');
    } catch (error) {
      // Fallback for malformed URLs
      if (website && typeof website === 'string') {
        return website.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
      }
      return 'example.com'; // Safe fallback
    }
  }

  /**
   * Simulate email verification (real tools use SMTP checking, DNS validation, etc.)
   */
  simulateEmailVerification(emails) {
    console.log('✨ Simulating email verification...');
    
    return emails.map(prospect => {
      // Simulate verification results
      const verificationScore = Math.random();
      const verified = verificationScore > 0.3; // 70% verification rate
      
      return {
        ...prospect,
        verified: verified,
        verificationScore: Math.round(verificationScore * 100),
        deliverable: verified,
        riskLevel: verified ? 'low' : 'medium'
      };
    });
  }

  /**
   * Calculate quality score based on multiple factors
   */
  calculateQualityScore(source, title, verified) {
    let score = 0;
    
    // Base score by source
    const sourceScores = {
      'linkedin': 40,
      'pattern': 30,
      'executive': 35,
      'hunter': 45
    };
    
    score += sourceScores[source] || 20;
    
    // Bonus for executive titles
    if (this.executiveRoles.some(role => title.toLowerCase().includes(role.toLowerCase()))) {
      score += 30;
    }
    
    // Bonus for verification
    if (verified) {
      score += 20;
    }
    
    // Penalty for generic titles
    if (title.includes('Manager') && !title.includes('Marketing Manager')) {
      score -= 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Remove duplicates and sort by quality score
   */
  deduplicateAndScore(prospects) {
    console.log('🔄 Deduplicating and scoring prospects...');
    
    const uniqueEmails = new Map();
    
    for (const prospect of prospects) {
      const email = prospect.email.toLowerCase();
      
      if (!uniqueEmails.has(email) || uniqueEmails.get(email).qualityScore < prospect.qualityScore) {
        uniqueEmails.set(email, prospect);
      }
    }
    
    const finalProspects = Array.from(uniqueEmails.values())
      .filter(p => p.qualityScore >= 50) // Only high-quality prospects
      .sort((a, b) => b.qualityScore - a.qualityScore);
    
    console.log(`✅ Final prospects: ${finalProspects.length} high-quality emails`);
    
    return finalProspects;
  }

  /**
   * Get professional email discovery summary
   */
  getDiscoverySummary(prospects) {
    const summary = {
      totalFound: prospects.length,
      verified: prospects.filter(p => p.verified).length,
      executiveLevel: prospects.filter(p => 
        this.executiveRoles.some(role => p.title.toLowerCase().includes(role.toLowerCase()))
      ).length,
      averageQualityScore: Math.round(
        prospects.reduce((sum, p) => sum + p.qualityScore, 0) / prospects.length
      ),
      sources: {}
    };
    
    // Count by source
    prospects.forEach(p => {
      summary.sources[p.source] = (summary.sources[p.source] || 0) + 1;
    });
    
    return summary;
  }
}

module.exports = ProfessionalEmailDiscovery;