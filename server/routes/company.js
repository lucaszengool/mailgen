const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Get company information from domain (used by CompanyDetailPage)
router.get('/info', async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain parameter is required'
      });
    }

    console.log('🏢 Fetching company info for:', domain);

    // Clean up domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`;

    // Fetch company data
    const companyData = await fetchCompanyDataEnhanced(url);

    res.json({
      success: true,
      data: companyData
    });

  } catch (error) {
    console.error('❌ Failed to fetch company info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get detailed company information (legacy endpoint)
router.get('/details', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    console.log(`<� Fetching company details for URL: ${url}`);

    // For now, return mock data based on the URL
    // TODO: Integrate with real company data APIs (Clearbit, FullContact, etc.)
    const companyData = await fetchCompanyData(url);

    res.json({
      success: true,
      company: companyData
    });

  } catch (error) {
    console.error('L Error fetching company details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced company data fetching with more details
async function fetchCompanyDataEnhanced(url) {
  try {
    console.log('🔍 Scraping company data from:', url);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const domain = new URL(url).hostname.replace('www.', '');

    // Extract comprehensive company data
    const companyData = {
      name: extractCompanyName($, domain),
      description: extractDescription($),
      logo: extractLogo($, url),
      website: url,
      industry: extractIndustry($),
      founded: extractFounded($),
      location: extractLocation($),
      employees: extractEmployees($),
      social: extractSocialLinks($),
      verified: true,
      confidence: 90,
      emailSource: 'Company website analysis',
      products: extractProducts($),
      specialties: extractSpecialties($),
      funding: extractFundingInfo($),
      leadership: extractLeadership($),
      news: extractNews($),

      // New comprehensive sections
      keyClients: extractKeyClients($),
      companyValues: extractCompanyValues($),
      recentMilestones: extractMilestones($),
      socialMediaPresence: extractSocialMediaPresence($, domain),
      growthIndicators: extractGrowthIndicators($),
      targetMarket: extractTargetMarket($),
      techStack: extractTechStack($),

      // Additional analytics and metrics
      growthMetrics: generateGrowthMetrics($, domain),
      emailMarketingFit: generateEmailMarketingFit($, domain),
      valuePropositions: generateValuePropositions($, domain),
      targetPersonas: generateTargetPersonas($, domain),
      competitiveAdvantages: extractCompetitiveAdvantages($),
      marketPosition: analyzeMarketPosition($),
      contactInfo: extractContactInfo($)
    };

    console.log('✅ Company data extracted:', {
      name: companyData.name,
      hasLogo: !!companyData.logo,
      hasSocial: Object.keys(companyData.social).length > 0
    });

    return companyData;

  } catch (error) {
    console.error('❌ Failed to scrape company website:', error.message);

    // Return fallback data
    const domain = new URL(url).hostname.replace('www.', '');
    return {
      name: domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Company website at ${domain}`,
      logo: null,
      website: url,
      industry: 'Technology',
      founded: null,
      employees: null,
      location: null,
      social: {},
      verified: false,
      confidence: 60,
      emailSource: 'Domain analysis',
      products: [],
      specialties: [],
      funding: null,
      leadership: [],
      news: []
    };
  }
}

// Helper functions for data extraction
function extractCompanyName($, domain) {
  let name = $('meta[property="og:site_name"]').attr('content');
  if (!name) name = $('title').text().split('|')[0].split('-')[0].trim();
  if (!name) name = $('.company-name, .site-name, .brand-name').first().text().trim();
  if (!name) name = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return name;
}

function extractDescription($) {
  let description = $('meta[name="description"]').attr('content');
  if (!description) description = $('meta[property="og:description"]').attr('content');
  if (!description) description = $('.company-description, .about-text, .hero-text').first().text().trim();
  if (!description) description = 'A leading company in their industry.';
  return description.substring(0, 300);
}

function extractLogo($, baseUrl) {
  let logo = $('meta[property="og:image"]').attr('content');
  if (!logo) logo = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
  if (!logo) logo = $('.logo img, .site-logo img, .brand-logo img').first().attr('src');
  if (logo && !logo.startsWith('http')) {
    try {
      logo = new URL(logo, baseUrl).href;
    } catch (e) {
      logo = null;
    }
  }
  return logo;
}

function extractSocialLinks($) {
  const social = {};
  $('a[href*="twitter.com"], a[href*="x.com"]').each((i, el) => {
    if (!social.twitter) social.twitter = $(el).attr('href');
  });
  $('a[href*="linkedin.com"]').each((i, el) => {
    if (!social.linkedin) social.linkedin = $(el).attr('href');
  });
  $('a[href*="facebook.com"]').each((i, el) => {
    if (!social.facebook) social.facebook = $(el).attr('href');
  });
  return social;
}

function extractIndustry($) {
  const keywords = $.html().toLowerCase();
  if (keywords.includes('technology') || keywords.includes('software') || keywords.includes('ai')) return 'Technology';
  if (keywords.includes('marketing') || keywords.includes('advertising')) return 'Marketing';
  if (keywords.includes('finance') || keywords.includes('banking')) return 'Finance';
  if (keywords.includes('healthcare') || keywords.includes('medical')) return 'Healthcare';
  return 'Business Services';
}

function extractFounded($) {
  const text = $.text();
  const yearMatch = text.match(/founded\s+in\s+(\d{4})|established\s+(\d{4})|since\s+(\d{4})/i);
  return yearMatch ? (yearMatch[1] || yearMatch[2] || yearMatch[3]) : null;
}

function extractLocation($) {
  let location = $('.location, .address, .company-location').first().text().trim();
  if (!location) {
    const text = $.text();
    const locationMatch = text.match(/(?:based|located|headquartered)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{2})/i);
    if (locationMatch) location = locationMatch[1];
  }
  return location || null;
}

function extractEmployees($) {
  const text = $.text().toLowerCase();
  const empMatch = text.match(/(\d+[\+\-\s]*(?:employees|team members|people))/i);
  if (empMatch) {
    const num = parseInt(empMatch[1].match(/\d+/)[0]);
    if (num < 50) return '1-50';
    if (num < 200) return '51-200';
    if (num < 1000) return '201-1000';
    return '1000+';
  }
  return null;
}

function extractProducts($) {
  const products = [];
  $('.product, .service, .feature').each((i, el) => {
    if (i < 5) {
      const text = $(el).text().trim();
      if (text && text.length < 100) products.push(text);
    }
  });
  return products;
}

function extractSpecialties($) {
  const specialties = [];
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    const items = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    specialties.push(...items.slice(0, 5));
  }
  return specialties;
}

function extractLeadership($) {
  const leadership = [];

  // COMPREHENSIVE selector patterns based on real-world websites
  const leadershipSelectors = [
    '.team-member', '.leadership-member', '.team-item', '.member-card',
    '.executive', '.leadership', '.team', '.about-team', '.our-team',
    '[class*="team-"] [class*="member"]', '[class*="leadership"]',
    '.team-grid > div', '.team-section > div', '.management-team > div',
    '.founders .founder', '.executive-team > div', '[data-team-member]'
  ];

  // Try each selector pattern
  for (const selector of leadershipSelectors) {
    $(selector).each((i, el) => {
      if (leadership.length >= 8) return false; // Stop after 8 members

      const $el = $(el);

      // Multiple patterns for finding name
      let name = $el.find('.name, .person-name, .member-name, h3, h4, h5, [class*="name"]').first().text().trim();
      if (!name) name = $el.find('img').attr('alt');
      if (!name) name = $el.find('[itemprop="name"]').text().trim();

      // Multiple patterns for finding title/position
      let title = $el.find('.title, .position, .role, .job-title, [class*="title"], [class*="position"], [itemprop="jobTitle"]').first().text().trim();
      if (!title) title = $el.find('p, span').filter((i, p) => $(p).text().length < 80).first().text().trim();

      const photo = $el.find('img').first().attr('src');
      const linkedin = $el.find('a[href*="linkedin"]').attr('href');

      if (name && name.length > 2 && name.length < 60) {
        leadership.push({
          name,
          title: title || 'Team Member',
          photo: photo || null,
          linkedin: linkedin || null
        });
      }
    });
    if (leadership.length > 0) break;
  }

  // Try JSON-LD schema.org structured data
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).html());
      if (json.founder) {
        const founders = Array.isArray(json.founder) ? json.founder : [json.founder];
        founders.forEach(founder => {
          if (typeof founder === 'object' && founder.name) {
            leadership.push({
              name: founder.name,
              title: 'Founder & CEO',
              photo: founder.image || null,
              linkedin: founder.sameAs?.find(url => url.includes('linkedin')) || null
            });
          }
        });
      }
    } catch (e) {}
  });

  // Return null if no leadership found - NO FAKE DATA
  return leadership.length > 0 ? leadership : null;
}

// Extract funding information - IMPROVED with multiple patterns
function extractFundingInfo($) {
  const text = $.text();

  // Multiple patterns for finding funding amounts
  const fundingPatterns = [
    /raised\s+\$?([\d\.]+)\s*(million|m|billion|b|k)/i,
    /funding\s+of\s+\$?([\d\.]+)\s*(million|m|billion|b)/i,
    /secured\s+\$?([\d\.]+)\s*(million|m|billion|b)/i,
    /\$?([\d\.]+)\s*(million|m|billion|b)\s+in\s+funding/i,
    /total\s+funding[:\s]+\$?([\d\.]+)\s*(million|m|billion|b)/i
  ];

  let fundingMatch = null;
  for (const pattern of fundingPatterns) {
    fundingMatch = text.match(pattern);
    if (fundingMatch) break;
  }

  // Multiple patterns for finding funding series
  const seriesPatterns = [
    /series\s+([a-z])\s+funding/i,
    /series\s+([a-z])\s+round/i,
    /(seed|pre-seed)\s+round/i,
    /(seed|pre-seed)\s+funding/i
  ];

  let seriesMatch = null;
  for (const pattern of seriesPatterns) {
    seriesMatch = text.match(pattern);
    if (seriesMatch) break;
  }

  // Extract investor names
  const investors = [];
  const investorPatterns = [
    /invested\s+by\s+([A-Z][a-z\s&]+(?:Capital|Ventures|Partners|VC|Fund))/g,
    /led\s+by\s+([A-Z][a-z\s&]+(?:Capital|Ventures|Partners|VC))/g,
    /([A-Z][a-z\s&]+(?:Capital|Ventures|Partners))\s+invested/g
  ];

  for (const pattern of investorPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && investors.length < 5) {
        investors.push(match[1].trim());
      }
    }
  }

  // Try to extract yearly funding data from the page
  const yearlyFunding = [];
  const yearPattern = /(20\d{2})[:\s-]+\$?([\d\.]+)\s*(million|m|billion|b|k)/gi;
  let yearMatch;
  while ((yearMatch = yearPattern.exec(text)) !== null) {
    const year = yearMatch[1];
    let amount = parseFloat(yearMatch[2]);
    const unit = yearMatch[3].toLowerCase();

    // Convert to millions
    if (unit.startsWith('b')) amount *= 1000;
    if (unit.startsWith('k')) amount /= 1000;

    yearlyFunding.push({ year, amount });
  }

  // Only return funding data if we found REAL information
  if (!fundingMatch && !seriesMatch && investors.length === 0 && yearlyFunding.length === 0) {
    return null; // NO FAKE DATA
  }

  return {
    stage: seriesMatch ? `Series ${seriesMatch[1].toUpperCase()}` : null,
    totalFunding: fundingMatch ? `$${fundingMatch[1]}${fundingMatch[2][0].toUpperCase()}` : null,
    lastRound: (seriesMatch && fundingMatch) ? `Series ${seriesMatch[1].toUpperCase()} - $${fundingMatch[1]}${fundingMatch[2][0].toUpperCase()}` : null,
    investors: investors.length > 0 ? investors : null,
    yearlyFunding: yearlyFunding.length > 0 ? yearlyFunding : null
  };
}

// Extract news and recent activities - IMPROVED with multiple selectors
function extractNews($) {
  const news = [];

  // Multiple selector patterns for finding news/blog articles
  const newsSelectors = [
    '.news-item', '.blog-post', '.article', '.press-release',
    '[class*="news"]', '[class*="blog"]', '[class*="article"]',
    '.post', '[class*="press"]', '[data-news-item]',
    'article', '.entry', '[class*="story"]'
  ];

  for (const selector of newsSelectors) {
    $(selector).each((i, el) => {
      if (news.length >= 5) return false;

      const $el = $(el);

      // Try multiple patterns to find title
      let title = $el.find('.title, h2, h3, h4, h5, [class*="title"], [class*="heading"]').first().text().trim();
      if (!title) title = $el.find('a').first().text().trim();
      if (!title) title = $el.text().split('\n')[0].trim();

      // Try multiple patterns to find date
      let date = $el.find('.date, time, .published, [class*="date"], [datetime]').first().text().trim();
      if (!date) date = $el.find('time').attr('datetime');

      // Try to find URL
      let url = $el.find('a').first().attr('href');
      if (!url) url = $el.closest('a').attr('href');

      if (title && title.length > 10 && title.length < 200) {
        news.push({
          source: 'Company Website',
          title,
          date: date || null,
          url: url || null
        });
      }
    });
    if (news.length > 0) break;
  }

  // Try JSON-LD schema.org for articles
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).html());
      if (json['@type'] === 'Article' || json['@type'] === 'NewsArticle') {
        news.push({
          source: json.publisher?.name || 'Company Website',
          title: json.headline,
          date: json.datePublished || null,
          url: json.url || null
        });
      }
    } catch (e) {}
  });

  // Return null if no news found - NO FAKE DATA
  return news.length > 0 ? news : null;
}

// Extract key clients/partners
function extractKeyClients($) {
  const clients = [];
  $('.client, .partner, .customer, .logo-wall img, .clients img, .partners img').each((i, el) => {
    if (i < 8) {
      const name = $(el).attr('alt') || $(el).attr('title') || $(el).parent().text().trim();
      const logo = $(el).attr('src');
      if (name) {
        clients.push({ name, logo: logo || null });
      }
    }
  });
  return clients;
}

// Extract company values and culture
function extractCompanyValues($) {
  const values = [];
  $('.value, .core-value, .culture, .mission, .vision').each((i, el) => {
    if (i < 5) {
      const title = $(el).find('h3, h4, .title').first().text().trim();
      const description = $(el).find('p, .description').first().text().trim();
      if (title) {
        values.push({ title, description: description.substring(0, 150) });
      }
    }
  });

  // If no structured values found, look for mission/vision statements
  if (values.length === 0) {
    const missionText = $('.mission, [class*="mission"]').first().text().trim();
    if (missionText) {
      values.push({ title: 'Mission', description: missionText.substring(0, 200) });
    }
  }

  return values;
}

// Extract recent milestones and achievements
function extractMilestones($) {
  const milestones = [];
  $('.milestone, .achievement, .award, .accomplishment, .timeline-item').each((i, el) => {
    if (i < 6) {
      const title = $(el).find('h3, h4, .title').first().text().trim();
      const date = $(el).find('.date, time').first().text().trim();
      const description = $(el).find('p, .description').first().text().trim();
      if (title) {
        milestones.push({
          title,
          date: date || 'Recent',
          description: description.substring(0, 150)
        });
      }
    }
  });
  return milestones;
}

// Extract social media presence
function extractSocialMediaPresence($, domain) {
  const presence = {
    twitter: null,
    linkedin: null,
    facebook: null,
    instagram: null,
    youtube: null
  };

  // Extract social links
  $('a[href*="twitter.com"], a[href*="x.com"]').each((i, el) => {
    if (!presence.twitter) presence.twitter = $(el).attr('href');
  });
  $('a[href*="linkedin.com/company"]').each((i, el) => {
    if (!presence.linkedin) presence.linkedin = $(el).attr('href');
  });
  $('a[href*="facebook.com"]').each((i, el) => {
    if (!presence.facebook) presence.facebook = $(el).attr('href');
  });
  $('a[href*="instagram.com"]').each((i, el) => {
    if (!presence.instagram) presence.instagram = $(el).attr('href');
  });
  $('a[href*="youtube.com"]').each((i, el) => {
    if (!presence.youtube) presence.youtube = $(el).attr('href');
  });

  return presence;
}

// Extract growth indicators
function extractGrowthIndicators($) {
  const text = $.text();
  const indicators = {};

  // Look for growth percentages
  const growthMatch = text.match(/(\d+)%\s+(?:growth|increase)/gi);
  if (growthMatch) {
    indicators.growth = growthMatch[0];
  }

  // Look for customer/client numbers
  const customerMatch = text.match(/(\d+[\+k]*)\s+(?:customers|clients|users)/i);
  if (customerMatch) {
    indicators.customers = customerMatch[1];
  }

  // Look for countries/markets
  const marketMatch = text.match(/(\d+)\s+(?:countries|markets)/i);
  if (marketMatch) {
    indicators.markets = marketMatch[1];
  }

  return indicators;
}

// Extract target market information
function extractTargetMarket($) {
  const text = $.text().toLowerCase();
  const targetMarket = {
    industries: [],
    companySize: null,
    regions: []
  };

  // Detect target industries from common keywords
  const industries = {
    'enterprise': 'Enterprise',
    'smb': 'Small & Medium Business',
    'startup': 'Startups',
    'ecommerce': 'E-commerce',
    'saas': 'SaaS Companies',
    'retail': 'Retail',
    'healthcare': 'Healthcare',
    'finance': 'Financial Services'
  };

  Object.keys(industries).forEach(keyword => {
    if (text.includes(keyword)) {
      targetMarket.industries.push(industries[keyword]);
    }
  });

  return targetMarket;
}

// Extract technology stack
function extractTechStack($) {
  const techStack = [];
  const text = $.text();

  // Common technologies to look for
  const technologies = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'Ruby',
    'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
    'Salesforce', 'HubSpot', 'Zendesk', 'Intercom',
    'PostgreSQL', 'MongoDB', 'MySQL', 'Redis'
  ];

  technologies.forEach(tech => {
    if (text.includes(tech)) {
      techStack.push(tech);
    }
  });

  return techStack.slice(0, 8);
}

// Generate growth metrics with intelligent fallbacks
function generateGrowthMetrics($, domain) {
  const indicators = extractGrowthIndicators($);
  const text = $.text();

  // ONLY return REAL metrics found on website - NO FALLBACKS
  const revenueMatch = text.match(/revenue.*?(\d+)%/i);
  const employeeMatch = text.match(/(?:team|staff|employee).*?(?:grew|increased).*?(\d+)%/i);
  const customerMatch = text.match(/customer.*?(\d+)%/i);
  const marketMatch = text.match(/(\d+)\s+(?:countries|markets|regions)/i);

  return {
    revenueGrowth: indicators.growth || (revenueMatch ? revenueMatch[0] : null),
    employeeGrowth: employeeMatch ? employeeMatch[0] : null,
    customerGrowth: indicators.customers || (customerMatch ? customerMatch[0] : null),
    marketExpansion: indicators.markets ? `${indicators.markets} markets` : (marketMatch ? marketMatch[0] : null)
  };
}

// Generate email marketing fit analysis - ONLY based on REAL website content
function generateEmailMarketingFit($, domain) {
  const text = $.text().toLowerCase();

  // Extract REAL pain points from website content
  const realPainPoints = [];
  if (text.includes('lead generation') || text.includes('leads')) realPainPoints.push('Lead generation and qualification');
  if (text.includes('email') && (text.includes('campaign') || text.includes('marketing'))) realPainPoints.push('Email campaign automation');
  if (text.includes('roi') || text.includes('return on investment')) realPainPoints.push('Marketing ROI measurement');
  if (text.includes('customer engagement') || text.includes('retention')) realPainPoints.push('Customer engagement and retention');
  if (text.includes('sales') && text.includes('marketing')) realPainPoints.push('Sales and marketing alignment');

  // Only return data if we found relevant keywords on the site
  const hasMarketing = text.includes('marketing') || text.includes('sales');
  const hasCRM = text.includes('crm') || text.includes('customer');
  const hasEmail = text.includes('email');

  if (!hasMarketing && !hasCRM && !hasEmail) {
    return null; // NO FALLBACK DATA
  }

  const score = 70 + (hasMarketing ? 10 : 0) + (hasCRM ? 5 : 0) + (hasEmail ? 10 : 0);

  return {
    overallScore: Math.min(score, 95),
    industryAlignment: Math.min(score + 5, 98),
    budgetLevel: score > 85 ? 'High' : score > 70 ? 'Medium-High' : 'Medium',
    decisionMakingSpeed: score > 80 ? 'Fast' : 'Moderate',
    painPoints: realPainPoints.length > 0 ? realPainPoints : null
  };
}

// Generate value propositions - ONLY if relevant to website content
function generateValuePropositions($, domain) {
  const text = $.text().toLowerCase();
  const props = [];

  // Only add propositions that are RELEVANT to what the company actually does
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) {
    props.push('AI-powered prospect discovery and targeting');
  }
  if (text.includes('automation') || text.includes('automated')) {
    props.push('Automated email personalization at scale');
  }
  if (text.includes('analytics') || text.includes('insights') || text.includes('reporting')) {
    props.push('Real-time campaign analytics and insights');
  }
  if (text.includes('crm') || text.includes('integration') || text.includes('api')) {
    props.push('Seamless CRM and tool integration');
  }
  if (text.includes('email') || text.includes('outreach') || text.includes('response')) {
    props.push('Increase email response rates by 3-5x');
  }

  return props.length > 0 ? props : null; // Return null if no relevant propositions found
}

// Generate target personas - ONLY based on company website content
function generateTargetPersonas($, domain) {
  const text = $.text().toLowerCase();
  const personas = [];

  // Only add personas if we find relevant indicators on the website
  if (text.includes('marketing') || text.includes('campaign')) {
    personas.push({
      role: 'Marketing Director',
      painPoints: ['Campaign performance optimization', 'Lead quality improvement', 'Budget allocation'],
      interests: ['Marketing automation', 'Analytics & reporting', 'AI & machine learning']
    });
  }

  if (text.includes('sales') || text.includes('revenue')) {
    personas.push({
      role: 'Sales Manager',
      painPoints: ['Pipeline growth', 'Conversion rate optimization', 'Follow-up efficiency'],
      interests: ['CRM integration', 'Sales automation', 'Lead scoring']
    });
  }

  if (text.includes('business development') || text.includes('partnership')) {
    personas.push({
      role: 'Business Development Manager',
      painPoints: ['New market penetration', 'Partnership development', 'Revenue growth'],
      interests: ['Market intelligence', 'Prospect research', 'Outreach automation']
    });
  }

  // Add CEO persona ONLY for startups/small companies
  if (text.includes('startup') || text.includes('founder') || text.includes('entrepreneur')) {
    personas.push({
      role: 'CEO / Founder',
      painPoints: ['Revenue acceleration', 'Market expansion', 'Customer acquisition cost'],
      interests: ['ROI optimization', 'Scalable growth', 'Competitive advantage']
    });
  }

  return personas.length > 0 ? personas : null; // Return null if no personas found
}

// Extract competitive advantages
function extractCompetitiveAdvantages($) {
  const advantages = [];
  const text = $.text().toLowerCase();

  // Look for competitive advantage indicators
  if (text.includes('award') || text.includes('winner')) {
    advantages.push('Industry-recognized excellence');
  }
  if (text.includes('patent') || text.includes('proprietary')) {
    advantages.push('Proprietary technology and IP');
  }
  if (text.includes('certified') || text.includes('certification')) {
    advantages.push('Industry certifications and compliance');
  }
  if (text.includes('customer service') || text.includes('support')) {
    advantages.push('Superior customer support');
  }

  // Default advantages
  if (advantages.length === 0) {
    advantages.push(
      'Strong market presence',
      'Innovative solutions',
      'Customer-centric approach',
      'Proven track record'
    );
  }

  return advantages.slice(0, 5);
}

// Analyze market position
function analyzeMarketPosition($) {
  const text = $.text().toLowerCase();

  let position = 'Emerging Player';
  if (text.includes('leader') || text.includes('leading')) {
    position = 'Market Leader';
  } else if (text.includes('innovator') || text.includes('pioneer')) {
    position = 'Industry Innovator';
  } else if (text.includes('growing') || text.includes('expanding')) {
    position = 'Rising Star';
  }

  return {
    category: position,
    marketShare: text.includes('leader') ? 'Top 10%' : 'Growing',
    competitiveRating: text.includes('leader') ? 9 : 7
  };
}

// Extract contact information
function extractContactInfo($) {
  const info = {};

  // Extract email
  const emailMatch = $.html().match(/href="mailto:([^"]+)"/i);
  if (emailMatch) info.email = emailMatch[1];

  // Extract phone
  const phoneMatch = $.text().match(/(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/);
  if (phoneMatch) info.phone = phoneMatch[0];

  // Extract address
  $('.address, .location, [itemprop="address"]').each((i, el) => {
    if (!info.address) {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 200) {
        info.address = text;
      }
    }
  });

  return info;
}

async function fetchCompanyData(url) {
  try {
    // Extract domain from URL
    const domain = new URL(url).hostname.replace('www.', '');

    //  Attempt to scrape basic company info from the website
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Extract company information from meta tags and page content
    const companyName = $('meta[property="og:site_name"]').attr('content') ||
                       $('meta[name="application-name"]').attr('content') ||
                       $('title').text().split('|')[0].trim();

    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content') ||
                       '';

    const logo = $('meta[property="og:image"]').attr('content') ||
                $('link[rel="icon"]').attr('href') ||
                $('link[rel="apple-touch-icon"]').attr('href') ||
                '';

    // Return structured company data
    return {
      name: companyName,
      description: description,
      logo: logo.startsWith('http') ? logo : `https://${domain}${logo}`,
      website: url,
      domain: domain,
      // Additional fields that could be populated from APIs
      founded: null,
      location: null,
      employeeCount: null,
      rating: null,
      funding: null,
      leadership: [],
      news: [],
      socialLinks: {
        twitter: null,
        linkedin: null,
        facebook: null
      }
    };

  } catch (error) {
    console.error('Error scraping company data:', error.message);

    // Return minimal company data on error
    return {
      name: 'Unknown Company',
      description: 'Company information could not be retrieved at this time.',
      logo: null,
      website: url,
      domain: url,
      founded: null,
      location: null,
      employeeCount: null,
      rating: null,
      funding: null,
      leadership: [],
      news: [],
      socialLinks: {}
    };
  }
}

module.exports = router;
