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
      funding: null, // Would integrate with Crunchbase API
      leadership: extractLeadership($),
      news: []
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
  $('.team-member, .leadership, .executive').each((i, el) => {
    if (i < 4) {
      const name = $(el).find('.name, .person-name, h3, h4').first().text().trim();
      const title = $(el).find('.title, .position, .role').first().text().trim();
      const photo = $(el).find('img').first().attr('src');
      if (name && title) {
        leadership.push({ name, title, photo: photo || null, linkedin: null });
      }
    }
  });
  return leadership;
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
