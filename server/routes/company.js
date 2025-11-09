const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Get detailed company information
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
