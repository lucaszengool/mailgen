/**
 * 🎯 Advanced Prospect Relevance Filter
 * Filters prospects based on website analysis to ensure high-quality, relevant leads
 */

class ProspectRelevanceFilter {
  constructor() {
    // Generic/system emails to filter out
    this.genericPrefixes = [
      'info', 'contact', 'hello', 'hi', 'support', 'help', 'admin',
      'sales', 'marketing', 'office', 'general', 'inquiry', 'service',
      'careers', 'jobs', 'hr', 'feedback', 'team', 'press', 'media',
      'noreply', 'no-reply', 'webmaster', 'postmaster', 'abuse',
      'billing', 'invoice', 'accounts', 'ir', 'supplieronboarding',
      'contactus', 'us.sales', 'support@', 'sales@', 'info@'
    ];

    // Industry-specific role mappings
    this.industryRoleMap = {
      'Food Technology': {
        relevant_roles: ['buyer', 'purchasing', 'procurement', 'chef', 'owner', 'manager', 'director', 'founder', 'ceo', 'operator'],
        relevant_titles: ['buyer', 'purchasing', 'procurement', 'chef', 'food', 'restaurant', 'culinary', 'owner', 'manager'],
        relevant_companies: ['restaurant', 'grocery', 'market', 'farm', 'food', 'distributor', 'retail']
      },
      'Technology': {
        relevant_roles: ['cto', 'cio', 'engineer', 'developer', 'it', 'technical', 'architect', 'director'],
        relevant_titles: ['technology', 'engineering', 'technical', 'it', 'software', 'development'],
        relevant_companies: ['tech', 'software', 'saas', 'digital', 'it', 'technology']
      },
      'Healthcare': {
        relevant_roles: ['doctor', 'physician', 'nurse', 'medical', 'clinical', 'health', 'administrator'],
        relevant_titles: ['medical', 'clinical', 'health', 'patient', 'care', 'nursing'],
        relevant_companies: ['hospital', 'clinic', 'medical', 'health', 'care', 'pharma']
      },
      'Retail': {
        relevant_roles: ['buyer', 'merchant', 'purchasing', 'store', 'retail', 'owner', 'manager'],
        relevant_titles: ['retail', 'store', 'merchandising', 'buying', 'purchasing'],
        relevant_companies: ['retail', 'store', 'shop', 'merchant', 'boutique']
      }
    };
  }

  /**
   * Filter prospects based on website analysis and target audiences
   */
  filterProspects(prospects, websiteAnalysis) {
    if (!prospects || prospects.length === 0) {
      return [];
    }

    console.log(`🎯 Filtering ${prospects.length} prospects based on website analysis...`);

    const productType = websiteAnalysis?.productServiceType || websiteAnalysis?.productType || '';
    const targetAudiences = websiteAnalysis?.targetAudiences || websiteAnalysis?.audiences || [];
    const sellingPoints = websiteAnalysis?.sellingPoints || [];

    console.log(`   📊 Product type: ${productType}`);
    console.log(`   👥 Target audiences: ${targetAudiences.length}`);

    const filteredProspects = prospects
      .map(prospect => {
        // Calculate relevance score
        const score = this.calculateRelevanceScore(prospect, {
          productType,
          targetAudiences,
          sellingPoints
        });

        return {
          ...prospect,
          relevance_score: score
        };
      })
      .filter(prospect => {
        // Filter out generic emails
        if (this.isGenericEmail(prospect.email)) {
          console.log(`   ❌ Filtered generic: ${prospect.email}`);
          return false;
        }

        // Filter out low relevance scores
        if (prospect.relevance_score < 40) {
          console.log(`   ❌ Low relevance (${prospect.relevance_score}): ${prospect.email}`);
          return false;
        }

        return true;
      })
      .sort((a, b) => b.relevance_score - a.relevance_score); // Sort by relevance

    console.log(`✅ Filtered to ${filteredProspects.length} relevant prospects`);
    console.log(`   📉 Removed ${prospects.length - filteredProspects.length} irrelevant/generic prospects`);

    return filteredProspects;
  }

  /**
   * Calculate relevance score (0-100) based on multiple factors
   */
  calculateRelevanceScore(prospect, analysis) {
    let score = 0;

    const email = prospect.email?.toLowerCase() || '';
    const name = prospect.name?.toLowerCase() || '';
    const company = prospect.company?.toLowerCase() || '';
    const role = prospect.role?.toLowerCase() || '';
    const title = prospect.title?.toLowerCase() || '';
    const industry = prospect.industry?.toLowerCase() || '';

    // 1. Email type score (30 points)
    if (this.isPersonalEmail(email)) {
      score += 30; // Personal emails are highly relevant
    } else if (this.isDepartmentEmail(email)) {
      score += 10; // Department emails are medium relevance
    }

    // 2. Industry/Product type match (25 points)
    const productType = analysis.productType?.toLowerCase() || '';
    const industryKeywords = this.extractIndustryKeywords(productType);

    if (this.matchesIndustry(prospect, industryKeywords, productType)) {
      score += 25;
    } else if (this.partialMatchesIndustry(prospect, industryKeywords)) {
      score += 10;
    }

    // 3. Target audience match (30 points)
    const targetAudiences = analysis.targetAudiences || [];
    if (this.matchesTargetAudience(prospect, targetAudiences)) {
      score += 30;
    } else if (this.partialMatchesAudience(prospect, targetAudiences)) {
      score += 15;
    }

    // 4. Role/Title relevance (15 points)
    if (this.hasRelevantRole(prospect, productType)) {
      score += 15;
    } else if (this.hasModeratelyRelevantRole(prospect, productType)) {
      score += 7;
    }

    return Math.min(100, score);
  }

  /**
   * Check if email is generic/system email
   */
  isGenericEmail(email) {
    if (!email) return true;

    const localPart = email.split('@')[0].toLowerCase();

    // Check against generic prefixes
    for (const prefix of this.genericPrefixes) {
      if (localPart === prefix || localPart.startsWith(prefix)) {
        return true;
      }
    }

    // Check for patterns like: sales.us@, us.sales@, etc.
    if (/^(us|uk|eu|ca|support|sales|info|contact|help)\./i.test(localPart) ||
        /\.(us|uk|eu|ca|support|sales|info|contact|help)$/i.test(localPart)) {
      return true;
    }

    return false;
  }

  /**
   * Check if email is a personal email (firstname.lastname@)
   */
  isPersonalEmail(email) {
    if (!email) return false;

    const localPart = email.split('@')[0];

    // Pattern: firstname.lastname or firstname_lastname
    if (/^[a-z]+[._-][a-z]+$/i.test(localPart)) {
      return true;
    }

    // Pattern: first initial + lastname (e.g., jsmith@)
    if (/^[a-z][a-z]{2,}$/i.test(localPart) && localPart.length >= 5) {
      return true;
    }

    return false;
  }

  /**
   * Check if email is a department email (procurement@, purchasing@, buying@)
   */
  isDepartmentEmail(email) {
    if (!email) return false;

    const localPart = email.split('@')[0].toLowerCase();
    const departmentKeywords = ['procurement', 'purchasing', 'buying', 'operations', 'management'];

    return departmentKeywords.some(keyword => localPart.includes(keyword));
  }

  /**
   * Extract industry keywords from product type
   */
  extractIndustryKeywords(productType) {
    const keywords = [];

    if (!productType) return keywords;

    const typeL = productType.toLowerCase();

    // Add direct product type
    keywords.push(...productType.split(/\s+/));

    // Add related keywords based on product type
    if (typeL.includes('food') || typeL.includes('culinary')) {
      keywords.push('restaurant', 'grocery', 'market', 'food', 'farm', 'distributor', 'retail', 'chef', 'culinary');
    }

    if (typeL.includes('technology') || typeL.includes('software')) {
      keywords.push('tech', 'software', 'saas', 'digital', 'it', 'technology', 'startup');
    }

    if (typeL.includes('health')) {
      keywords.push('hospital', 'clinic', 'medical', 'health', 'care', 'pharma');
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Check if prospect matches industry
   */
  matchesIndustry(prospect, industryKeywords, productType) {
    const company = prospect.company?.toLowerCase() || '';
    const industry = prospect.industry?.toLowerCase() || '';
    const role = prospect.role?.toLowerCase() || '';

    return industryKeywords.some(keyword => {
      const kw = keyword.toLowerCase();
      return company.includes(kw) || industry.includes(kw) || role.includes(kw);
    });
  }

  /**
   * Check if prospect partially matches industry
   */
  partialMatchesIndustry(prospect, industryKeywords) {
    const allText = `${prospect.company} ${prospect.industry} ${prospect.role} ${prospect.title}`.toLowerCase();

    // Check for at least one keyword match
    return industryKeywords.some(keyword => allText.includes(keyword.toLowerCase()));
  }

  /**
   * Check if prospect matches target audience
   */
  matchesTargetAudience(prospect, targetAudiences) {
    if (!targetAudiences || targetAudiences.length === 0) return false;

    const company = prospect.company?.toLowerCase() || '';
    const role = prospect.role?.toLowerCase() || '';
    const industry = prospect.industry?.toLowerCase() || '';

    return targetAudiences.some(audience => {
      const audienceText = typeof audience === 'string' ? audience : audience.name || audience.segment || '';
      const audienceL = audienceText.toLowerCase();

      // Check for strong matches
      return company.includes(audienceL) ||
             role.includes(audienceL) ||
             industry.includes(audienceL) ||
             audienceL.includes(company) ||
             audienceL.includes(role);
    });
  }

  /**
   * Check if prospect partially matches audience
   */
  partialMatchesAudience(prospect, targetAudiences) {
    if (!targetAudiences || targetAudiences.length === 0) return false;

    const allText = `${prospect.company} ${prospect.role} ${prospect.industry} ${prospect.title}`.toLowerCase();

    return targetAudiences.some(audience => {
      const audienceText = typeof audience === 'string' ? audience : audience.name || audience.segment || '';
      const words = audienceText.toLowerCase().split(/\s+/);

      // Check if any word from audience appears in prospect data
      return words.some(word => word.length > 3 && allText.includes(word));
    });
  }

  /**
   * Check if prospect has relevant role for the industry
   */
  hasRelevantRole(prospect, productType) {
    const role = prospect.role?.toLowerCase() || '';
    const title = prospect.title?.toLowerCase() || '';

    // Get industry-specific relevant roles
    const industryConfig = this.industryRoleMap[productType] || {};
    const relevantRoles = industryConfig.relevant_roles || [];

    return relevantRoles.some(relevantRole =>
      role.includes(relevantRole) || title.includes(relevantRole)
    );
  }

  /**
   * Check if prospect has moderately relevant role
   */
  hasModeratelyRelevantRole(prospect, productType) {
    const role = prospect.role?.toLowerCase() || '';
    const title = prospect.title?.toLowerCase() || '';

    const moderateRoles = ['manager', 'director', 'coordinator', 'specialist', 'lead', 'head'];

    return moderateRoles.some(moderateRole =>
      role.includes(moderateRole) || title.includes(moderateRole)
    );
  }
}

module.exports = ProspectRelevanceFilter;
