class SenderNameGenerator {
  static generateSenderInfo(targetWebsite, campaignGoal = 'partnership') {
    // Extract company name from URL
    const companyName = this.extractCompanyName(targetWebsite);
    
    // Generate appropriate sender name based on campaign goal
    const senderName = this.generateSenderName(companyName, campaignGoal);
    
    // Generate sender title/department
    const senderTitle = this.generateSenderTitle(campaignGoal);
    
    return {
      senderName: senderName,
      senderTitle: senderTitle,
      companyName: companyName,
      fullSenderName: `${senderName} from ${companyName}`
    };
  }

  static extractCompanyName(url) {
    try {
      // Remove protocol and www
      let domain = url.replace(/https?:\/\//i, '').replace(/^www\./i, '');
      
      // Remove path and parameters
      domain = domain.split('/')[0].split('?')[0];
      
      // Extract main domain name
      const parts = domain.split('.');
      let mainDomain = parts[0];
      
      // Special handling for known cases
      if (mainDomain.toLowerCase().includes('petpo')) {
        return 'PETPO';
      }
      
      // Convert to proper case
      return this.toProperCase(mainDomain);
      
    } catch (error) {
      return 'Partnership Team';
    }
  }

  static generateSenderName(companyName, campaignGoal) {
    // Generate realistic business names based on campaign goal
    const goalMappings = {
      'partnership': [
        `${companyName} Partnerships`,
        `${companyName} Business Development`,
        `${companyName} Strategic Alliances`,
        `${companyName} Partnership Team`
      ],
      'promote product': [
        `${companyName} Solutions`,
        `${companyName} Business Team`, 
        `${companyName} Growth Team`,
        `${companyName} Product Partnerships`
      ],
      'collaboration': [
        `${companyName} Collaboration Team`,
        `${companyName} Strategic Partners`,
        `${companyName} Business Development`
      ],
      'sales': [
        `${companyName} Business Solutions`,
        `${companyName} Enterprise Team`,
        `${companyName} Client Success`
      ]
    };

    const matchedGoal = Object.keys(goalMappings).find(goal => 
      campaignGoal.toLowerCase().includes(goal)
    );

    if (matchedGoal && goalMappings[matchedGoal]) {
      const options = goalMappings[matchedGoal];
      return options[Math.floor(Math.random() * options.length)];
    }

    // Default fallback
    return `${companyName} Partnership Team`;
  }

  static generateSenderTitle(campaignGoal) {
    const titleMappings = {
      'partnership': [
        'Partnership Development',
        'Strategic Partnerships',
        'Business Development',
        'Partner Relations'
      ],
      'promote product': [
        'Business Development',
        'Growth Partnerships',
        'Product Solutions',
        'Strategic Growth'
      ],
      'collaboration': [
        'Strategic Alliances',
        'Collaboration Team',
        'Business Partnerships'
      ],
      'sales': [
        'Business Solutions',
        'Enterprise Partnerships',
        'Client Development'
      ]
    };

    const matchedGoal = Object.keys(titleMappings).find(goal => 
      campaignGoal.toLowerCase().includes(goal)
    );

    if (matchedGoal && titleMappings[matchedGoal]) {
      const options = titleMappings[matchedGoal];
      return options[Math.floor(Math.random() * options.length)];
    }

    return 'Partnership Development';
  }

  static toProperCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Generate complete email signature
  static generateEmailSignature(senderInfo, targetWebsite) {
    return `
      <p>Best regards,<br>
      <strong>${senderInfo.senderTitle} Team</strong><br>
      ${senderInfo.companyName}<br>
      <a href="${targetWebsite}">${targetWebsite}</a></p>
    `;
  }

  // Generate sender for specific prospect
  static generatePersonalizedSender(targetWebsite, campaignGoal, prospectIndustry = null) {
    const senderInfo = this.generateSenderInfo(targetWebsite, campaignGoal);
    
    // Add industry-specific personalization
    if (prospectIndustry) {
      const industrySpecific = this.getIndustrySpecificSender(senderInfo.companyName, prospectIndustry);
      if (industrySpecific) {
        senderInfo.senderName = industrySpecific;
      }
    }

    return senderInfo;
  }

  static getIndustrySpecificSender(companyName, industry) {
    const industryMappings = {
      'veterinary': `${companyName} Veterinary Solutions`,
      'pet care': `${companyName} Pet Care Partnerships`, 
      'retail': `${companyName} Retail Solutions`,
      'photography': `${companyName} Creative Partners`,
      'grooming': `${companyName} Service Partners`,
      'healthcare': `${companyName} Healthcare Solutions`,
      'technology': `${companyName} Tech Partnerships`
    };

    const matchedIndustry = Object.keys(industryMappings).find(key => 
      industry.toLowerCase().includes(key)
    );

    return matchedIndustry ? industryMappings[matchedIndustry] : null;
  }
}

module.exports = SenderNameGenerator;