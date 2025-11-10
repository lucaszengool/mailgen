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
      techStack: extractTechStack($)
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
  $('.team-member, .leadership, .executive, .team, .about-team, .our-team').each((i, el) => {
    if (i < 6) {
      const name = $(el).find('.name, .person-name, .member-name, h3, h4').first().text().trim();
      const title = $(el).find('.title, .position, .role, .job-title').first().text().trim();
      const photo = $(el).find('img').first().attr('src');
      if (name && title) {
        leadership.push({ name, title, photo: photo || null, linkedin: null });
      }
    }
  });
  return leadership;
}

// Extract funding information
function extractFundingInfo($) {
  const text = $.text().toLowerCase();
  const fundingMatch = text.match(/raised\s+\$?([\d\.]+)\s*(million|m|billion|b)/i);
  const seriesMatch = text.match(/series\s+([a-z])\s+funding/i);

  return {
    stage: seriesMatch ? `Series ${seriesMatch[1].toUpperCase()}` : 'Growth Stage',
    totalFunding: fundingMatch ? `$${fundingMatch[1]}${fundingMatch[2][0].toUpperCase()}` : 'Undisclosed',
    lastRound: seriesMatch ? `Series ${seriesMatch[1].toUpperCase()}` : 'Undisclosed',
    investors: [],
    yearlyFunding: []
  };
}

// Extract news and recent activities
function extractNews($) {
  const news = [];
  $('.news-item, .blog-post, .article, .press-release').each((i, el) => {
    if (i < 5) {
      const title = $(el).find('.title, h2, h3, h4').first().text().trim();
      const date = $(el).find('.date, time, .published').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      if (title) {
        news.push({
          source: 'Company Website',
          title,
          date: date || new Date().toISOString().split('T')[0],
          url: link || '#'
        });
      }
    }
  });
  return news;
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
