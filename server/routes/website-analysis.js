const express = require('express');
const router = express.Router();
const axios = require('axios');

// Import business analyzer
const SmartBusinessAnalyzer = require('../agents/SmartBusinessAnalyzer');

const businessAnalyzer = new SmartBusinessAnalyzer();

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_FAST_MODEL || 'qwen2.5:0.5b';

/**
 * POST /api/website-analysis/analyze
 * 分析网站并返回结构化数据供前端编辑
 */
router.post('/analyze', async (req, res) => {
  try {
    const { targetWebsite } = req.body;

    if (!targetWebsite) {
      return res.status(400).json({
        success: false,
        error: 'Target website is required'
      });
    }

    console.log(`🔍 Analyzing website: ${targetWebsite}`);

    // Step 1: Get basic analysis from SmartBusinessAnalyzer
    const basicAnalysis = await businessAnalyzer.analyzeTargetBusiness(targetWebsite, 'partnership');
    console.log(`✅ Basic analysis complete`);

    // Step 2: Extract additional metadata (logo, product type, benchmark brands)
    console.log(`🔍 Extracting additional metadata...`);
    const metadata = await extractAdditionalMetadata(targetWebsite, basicAnalysis);
    console.log(`✅ Metadata extracted - Logo: ${metadata.logo ? 'Yes' : 'No'}, Product type: ${metadata.productType || 'N/A'}, Brands: ${metadata.benchmarkBrands.length}`);

    // Step 3: Generate comprehensive analysis with Ollama (using JSON format enforcement)
    console.log(`⚡ Generating comprehensive analysis with Ollama...`);
    const startTime = Date.now();

    const comprehensiveAnalysis = await generateComprehensiveAnalysisWithOllama(basicAnalysis);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Analysis complete in ${elapsedTime}s - ${comprehensiveAnalysis.sellingPoints?.length || 0} selling points, ${comprehensiveAnalysis.targetAudiences?.length || 0} audiences`);

    // Use metadata description first, then Ollama, then basic valueProposition
    const businessIntro = metadata.description ||
                         comprehensiveAnalysis?.businessIntroduction ||
                         basicAnalysis.valueProposition;
    const sellingPoints = comprehensiveAnalysis?.sellingPoints || [
      'AI-powered scanning technology',
      'Instant freshness assessment',
      'Smart recommendations',
      'User-friendly interface',
      'Free to use',
      'Multi-language support',
      'Regular updates',
      'Lightweight application'
    ];
    const targetAudiences = comprehensiveAnalysis?.targetAudiences || [
      { title: 'Health-Conscious Shoppers', description: 'Individuals seeking fresh, quality produce' },
      { title: 'Busy Parents', description: 'Parents managing family nutrition efficiently' },
      { title: 'Fitness Enthusiasts', description: 'People maintaining healthy diets' },
      { title: 'Budget-Conscious Students', description: 'Students avoiding food waste' },
      { title: 'Food Professionals', description: 'Chefs and food service providers' }
    ];

    const formattedAnalysis = {
      // Basic information
      companyName: basicAnalysis.companyName || extractCompanyName(targetWebsite),
      logo: metadata.logo || '',
      website: targetWebsite,
      productType: metadata.productType || basicAnalysis.industry || '',
      benchmarkBrands: metadata.benchmarkBrands || [],

      // Business analysis
      industry: basicAnalysis.industry || '',
      valueProposition: basicAnalysis.valueProposition || '',
      businessIntroduction: businessIntro || '',

      // Marketing content
      sellingPoints: sellingPoints,
      targetAudiences: targetAudiences,

      // Metadata
      analysisMethod: 'ollama_enhanced',
      confidence: 'high',
      analyzedAt: new Date().toISOString()
    };

    console.log(`✅ Website analysis completed for: ${formattedAnalysis.companyName}`);

    res.json({
      success: true,
      analysis: formattedAnalysis
    });

  } catch (error) {
    console.error('❌ Website analysis failed:', error);
    
    // 提供默认分析作为fallback
    const fallbackAnalysis = {
      companyName: extractCompanyName(req.body.targetWebsite),
      logo: '',
      website: req.body.targetWebsite,
      productType: '',
      benchmarkBrands: [],
      industry: '',
      valueProposition: '',
      businessIntroduction: '',
      sellingPoints: [],
      targetAudiences: [],
      analysisMethod: 'fallback',
      confidence: 'low',
      analyzedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      analysis: fallbackAnalysis,
      warning: 'Analysis failed, providing template for manual completion'
    });
  }
});


/**
 * Call Ollama with EXTREME speed optimization
 */
async function callOllama(prompt) {
  try {
    console.log(`🔥 Calling Ollama (plain text - faster & more reliable)...`);
    const startTime = Date.now();

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      // NO format: "json" - plain text is more reliable!
      options: {
        temperature: 0.6,
        num_predict: 250,    // Shorter for simple format
        num_ctx: 512,
        top_k: 30,
        top_p: 0.85,
        repeat_penalty: 1.4,
        num_thread: 8
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⚡ Ollama responded in ${elapsed}s`);
    return response.data.response;
  } catch (error) {
    console.error('❌ Ollama error:', error.message);
    return null;
  }
}

/**
 * Generate comprehensive analysis with Ollama - SPEED OPTIMIZED
 */
async function generateComprehensiveAnalysisWithOllama(basicAnalysis) {
  const industry = basicAnalysis.industry || 'Technology';
  const companyName = basicAnalysis.companyName || 'Business';
  const valueProposition = basicAnalysis.valueProposition || 'innovative solutions';
  const mainProducts = basicAnalysis.mainProducts?.slice(0, 3) || [];
  const businessModel = basicAnalysis.businessModel || 'b2b';

  // TWO SEPARATE PROMPTS for better accuracy

  // Prompt 1: Target Audiences - SIMPLE FORMAT
  const audiencePrompt = `Product: ${companyName} - ${valueProposition}

List 5 target customers. For each, write ONE line in this exact format:
[Customer Type]: [One sentence describing who they are and why they need this]

Example:
Health-Conscious Grocery Shoppers: Individuals who prioritize fresh produce and need quick tools to assess fruit and vegetable quality while shopping.

Now write 5 similar customers for this product:`;

  // Prompt 2: Product Features - SIMPLE FORMAT
  const sellingPointsPrompt = `Product: ${companyName} - ${valueProposition}

List 5 specific product features. Write each as ONE complete sentence starting with a dash.

Example:
- Instant freshness assessment using AI technology to provide immediate feedback on produce quality
- User-friendly mobile interface requiring no sign-up for quick and hassle-free scanning

Now write 5 specific features for this product:`;

  console.log('🧠 Generating audiences with Ollama (Call 1/2)...');
  const audienceResponse = await callOllama(audiencePrompt);

  console.log('🧠 Generating selling points with Ollama (Call 2/2)...');
  const sellingPointsResponse = await callOllama(sellingPointsPrompt);

  let targetAudiences = [];
  let sellingPoints = [];

  // Parse audiences from first call
  if (audienceResponse) {
    try {
      console.log('📝 Parsing audience response...');
      console.log('📋 First 600 chars of audience response:');
      console.log(audienceResponse.substring(0, 600));

      // Parse audiences - ROBUST parser handling all Ollama variations
      const lines = audienceResponse.split('\n');
      targetAudiences = [];
      const seenTitles = new Set();

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        // Skip empty, examples, intro, just numbers, category headers
        if (!trimmed ||
            /^\d+$/.test(trimmed) ||
            /^\[[\w\s\-]+\]:?$/.test(trimmed) ||  // Skip [Category]: or [Category]
            trimmed.includes('Example') ||
            trimmed.includes('Now write') ||
            trimmed.toLowerCase().includes('certainly') ||
            trimmed.toLowerCase().includes('here is') ||
            trimmed.length < 20) {
          continue;
        }

        let title = '';
        let desc = '';

        // Format 1: "[Label]: Description" where previous line has title
        if (trimmed.match(/^\[[\w\s]+\]:\s*\w+/)) {
          const bracketEnd = trimmed.indexOf(']:');
          desc = trimmed.substring(bracketEnd + 2).trim().replace(/\*\*/g, '');

          // Look back for title line
          if (i > 0 && desc.length > 20) {
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
              const prevLine = lines[j].trim();
              if (prevLine &&
                  !prevLine.match(/^\[[\w\s\-]+\]:?$/) &&
                  prevLine.length > 5 &&
                  prevLine.length < 150) {
                // Extract title from line like "Title:" or "Title (note):"
                title = prevLine.split(':')[0].replace(/\([^)]*\)/g, '').trim();
                title = title.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
                break;
              }
            }
          }
        }
        // Format 2: "[Bracket content: description]" (entire thing in brackets)
        else if (trimmed.startsWith('[') && trimmed.endsWith(']') && trimmed.includes(':')) {
          const content = trimmed.substring(1, trimmed.length - 1);
          const colonIdx = content.indexOf(':');
          desc = content.substring(colonIdx + 1).trim();

          // Look back for title
          if (i > 0 && desc.length > 20) {
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
              const prevLine = lines[j].trim();
              if (prevLine &&
                  !prevLine.match(/^\[[\w\s\-]+\]:?$/) &&
                  prevLine.length > 5 &&
                  prevLine.length < 150) {
                title = prevLine.split(':')[0].replace(/\([^)]*\)/g, '').trim();
                title = title.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
                break;
              }
            }
          }
        }
        // Format 3: "Title (note): [Label]: Description"
        else if (trimmed.includes('[') && trimmed.includes(']:')) {
          const bracketEnd = trimmed.indexOf(']:');
          const afterBracket = trimmed.substring(bracketEnd + 2).trim();
          desc = afterBracket.includes(':') ? afterBracket.substring(afterBracket.indexOf(':') + 1).trim() : afterBracket;

          const beforeBracket = trimmed.substring(0, trimmed.indexOf('[')).trim();
          const parenMatch = beforeBracket.match(/^(.+?)\s*\(/);
          title = parenMatch ? parenMatch[1].trim() : beforeBracket.split(':')[0].trim();

          title = title.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
          desc = desc.replace(/\*\*/g, '').trim();
        }
        // Format 4: "Title: Description" OR "1. **Title**: Description"
        else if (trimmed.includes(':') && !trimmed.startsWith('-')) {
          const colonIndex = trimmed.indexOf(':');
          title = trimmed.substring(0, colonIndex).trim();
          desc = trimmed.substring(colonIndex + 1).trim();

          title = title.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
          desc = desc.replace(/\*\*/g, '').trim();

          // Skip if no description
          if (!desc || desc.length < 20) {
            continue;
          }
        }
        // Format 5: "3. Description" - extract title from first words
        else if (/^\d+\./.test(trimmed)) {
          desc = trimmed.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();

          const words = desc.split(' ');
          if (words.length >= 3) {
            title = words.slice(0, Math.min(4, words.length)).join(' ');
            if (title.toLowerCase().includes('who ') || title.toLowerCase().includes('looking ')) {
              title = words.slice(0, 2).join(' ');
            }
          }
        }

        if (title && desc && title.length > 5 && desc.length > 20 && !seenTitles.has(title)) {
          targetAudiences.push({ title, description: desc });
          seenTitles.add(title);
        }

        if (targetAudiences.length >= 5) break;
      }

      console.log(`✅ Parsed ${targetAudiences.length} unique audiences`);
    } catch (error) {
      console.error('❌ Audience parse error:', error.message);
    }
  }

  // Parse selling points from second call
  if (sellingPointsResponse) {
    try {
      console.log('📝 Parsing selling points response...');

      const lines = sellingPointsResponse.split('\n');
      const benefitCandidates = [];

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip examples and metadata
        if (trimmed.includes('Example') ||
            trimmed.includes('Now write') ||
            trimmed.includes('similar features') ||
            trimmed.length < 30) {
          continue;
        }

        // Accept both dash-prefixed AND plain sentences (Ollama doesn't always follow dash format)
        let benefit = trimmed;
        if (benefit.startsWith('-')) {
          benefit = benefit.replace(/^-\s*/, '').trim();
        }

        // Clean up formatting and numbering
        benefit = benefit.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\d+\.\s*/, '');

        // Valid if it's a substantive sentence
        if (benefit.length > 25 && benefit.includes(' ')) {
          benefitCandidates.push(benefit);
        }
      }

      sellingPoints = benefitCandidates.slice(0, 5);
      console.log(`✅ Parsed ${sellingPoints.length} selling points`);
    } catch (error) {
      console.error('❌ Selling points parse error:', error.message);
      console.error('📝 Response:', sellingPointsResponse?.substring(0, 300));
    }
  }

  // Use ONLY what Ollama generated - NO templates, NO fallback
  // If Ollama fails, show empty rather than generic content
  if (targetAudiences.length === 0) {
    console.log('⚠️  Ollama generated 0 audiences - will show empty');
  }

  if (sellingPoints.length === 0) {
    console.log('⚠️  Ollama generated 0 benefits - will show empty');
  }

  console.log(`🎯 Final result: ${targetAudiences.length} audiences, ${sellingPoints.length} benefits (Ollama ONLY)`);

  // Return minimal data - let the caller handle businessIntroduction
  return {
    businessIntroduction: valueProposition || '',  // Just use the raw value proposition
    sellingPoints: sellingPoints,
    targetAudiences: targetAudiences
  };
}

/**
 * Generate comprehensive analysis instantly based on basic analysis (FALLBACK)
 */
function generateComprehensiveAnalysis(basicAnalysis) {
  const industry = basicAnalysis.industry || 'Technology';
  const companyName = basicAnalysis.companyName || 'Business';
  const valueProposition = basicAnalysis.valueProposition || 'innovative solutions';

  // Extract key features from analysis if available
  const features = basicAnalysis.keyFeatures || [];
  const techStack = basicAnalysis.technologyStack || [];
  const mainProducts = basicAnalysis.mainProducts || [];

  // Generate business introduction
  const businessIntroduction = `${companyName} provides ${valueProposition}. This ${industry.toLowerCase()} solution helps businesses streamline operations, make data-driven decisions, and achieve measurable results through innovative technology.`;

  // Generate 8 selling points - more specific to the actual business
  const sellingPoints = [
    `Advanced ${industry.toLowerCase()} technology providing instant insights and actionable intelligence to drive business decisions`,
    `Automated workflow optimization that reduces manual effort by up to 70%, allowing teams to focus on high-value activities`,
    `Intuitive user interface designed for rapid adoption with minimal training, ensuring immediate productivity gains`,
    `Scalable architecture supporting everything from individual users to enterprise deployments with thousands of team members`,
    `Transparent and competitive pricing models with flexible plans that grow with your business needs`,
    `Seamless integration capabilities with existing tools and platforms through robust APIs and pre-built connectors`,
    `Continuous platform improvements driven by user feedback and industry best practices, ensuring long-term value`,
    `Enterprise-grade security and compliance features including data encryption, SOC 2 certification, and GDPR compliance`
  ];

  // Generate 10 target audiences based on industry and value proposition
  const audiences = generateIndustrySpecificAudiences(industry, companyName, valueProposition, basicAnalysis);

  return {
    businessIntroduction,
    sellingPoints,
    targetAudiences: audiences
  };
}

/**
 * Generate industry-specific target audiences
 */
function generateIndustrySpecificAudiences(industry, companyName, valueProposition, basicAnalysis) {
  const lowerIndustry = industry.toLowerCase();
  const businessModel = basicAnalysis.businessModel || 'b2b';

  // Industry-specific audience templates
  const industryAudiences = {
    'marketing': [
      { title: 'Social Media Managers', description: 'Professionals managing brand presence across multiple social platforms who need efficient content creation and scheduling tools.' },
      { title: 'Influencer Marketing Agencies', description: 'Agencies managing influencer partnerships and campaigns requiring automation and analytics for ROI tracking.' },
      { title: 'E-commerce Brand Owners', description: 'Online retailers seeking to leverage influencer marketing to drive product sales and brand awareness.' },
      { title: 'Content Creators and Influencers', description: 'Individual creators looking to monetize their audience and manage brand partnerships effectively.' },
      { title: 'Digital Marketing Teams', description: 'In-house marketing teams responsible for multi-channel campaigns and influencer collaborations.' },
      { title: 'Startup Growth Marketers', description: 'Early-stage companies needing cost-effective marketing strategies to reach target audiences quickly.' },
      { title: 'Marketing Directors and CMOs', description: 'Senior marketing leaders seeking data-driven insights to optimize marketing spend and campaign performance.' },
      { title: 'PR and Communications Professionals', description: 'Teams managing brand reputation and media relations through strategic influencer partnerships.' },
      { title: 'Affiliate Marketing Managers', description: 'Professionals managing affiliate programs and influencer networks to drive conversions.' },
      { title: 'Brand Managers', description: 'Professionals responsible for brand positioning and awareness who use influencer marketing as a key channel.' }
    ],
    'ai': [
      { title: 'AI Product Managers', description: 'Leaders developing AI-powered products who need advanced tools to streamline development and deployment.' },
      { title: 'Machine Learning Engineers', description: 'Technical professionals building ML models who require efficient training and inference infrastructure.' },
      { title: 'Data Scientists', description: 'Analysts working with large datasets who need AI tools to extract insights and automate workflows.' },
      { title: 'Enterprise AI Teams', description: 'Large organizations implementing AI solutions across departments for automation and decision-making.' },
      { title: 'AI Startups and Founders', description: 'Early-stage AI companies needing scalable infrastructure and tools to bring products to market faster.' },
      { title: 'Research Scientists', description: 'Academic and industry researchers advancing AI capabilities through experimentation and model development.' },
      { title: 'Business Intelligence Teams', description: 'Professionals using AI for predictive analytics, forecasting, and strategic planning.' },
      { title: 'AI Consultants', description: 'Independent experts helping clients implement AI solutions and optimize existing systems.' },
      { title: 'DevOps and MLOps Engineers', description: 'Technical teams managing AI model deployment, monitoring, and lifecycle management.' },
      { title: 'Innovation Leaders', description: 'CTOs and innovation heads exploring AI to transform business operations and create competitive advantages.' }
    ],
    'saas': [
      { title: 'SaaS Founders and CEOs', description: 'Software company leaders seeking tools to improve product development, user acquisition, and retention.' },
      { title: 'Product Managers', description: 'Teams building and iterating on SaaS products who need user insights and feature prioritization tools.' },
      { title: 'Customer Success Teams', description: 'Professionals focused on onboarding, retention, and reducing churn through better user experiences.' },
      { title: 'SaaS Sales Teams', description: 'Sales professionals managing pipelines and closing deals with data-driven insights and automation.' },
      { title: 'Growth Marketers', description: 'Teams focused on user acquisition, activation, and viral growth strategies for SaaS products.' },
      { title: 'Engineering Teams', description: 'Developers building scalable SaaS applications who need infrastructure and deployment tools.' },
      { title: 'SaaS Investors and VCs', description: 'Investment professionals evaluating SaaS opportunities and portfolio company performance metrics.' },
      { title: 'Enterprise Buyers', description: 'Large organizations seeking SaaS solutions to replace legacy systems and improve operational efficiency.' },
      { title: 'SMB Decision Makers', description: 'Small business owners adopting SaaS tools to compete with larger enterprises at lower costs.' },
      { title: 'SaaS Consultants', description: 'Advisors helping clients select, implement, and optimize SaaS solutions for their business needs.' }
    ],
    'technology': [
      { title: 'Software Development Teams', description: 'Engineering teams building applications who need modern tools and infrastructure for faster delivery.' },
      { title: 'IT Directors and CIOs', description: 'Technology leaders responsible for infrastructure, security, and digital transformation initiatives.' },
      { title: 'DevOps Engineers', description: 'Professionals managing CI/CD pipelines, deployments, and infrastructure automation.' },
      { title: 'Tech Startups', description: 'Early-stage companies building innovative products who need scalable and cost-effective technology solutions.' },
      { title: 'Enterprise Architecture Teams', description: 'Large organizations managing complex technology stacks and integration requirements.' },
      { title: 'Cloud Engineers', description: 'Specialists managing cloud infrastructure, migrations, and optimization for performance and cost.' },
      { title: 'Security Teams', description: 'Cybersecurity professionals protecting systems, data, and applications from threats.' },
      { title: 'Technology Consultants', description: 'Advisors helping clients select and implement technology solutions aligned with business goals.' },
      { title: 'Product Development Teams', description: 'Cross-functional teams building digital products who need collaboration and development tools.' },
      { title: 'Innovation Labs', description: 'R&D teams experimenting with emerging technologies to create next-generation solutions.' }
    ]
  };

  // Check if we have industry-specific audiences
  for (const [key, audiences] of Object.entries(industryAudiences)) {
    if (lowerIndustry.includes(key)) {
      return audiences;
    }
  }

  // Default B2B audiences
  if (businessModel === 'b2b' || businessModel === 'both') {
    return [
      { title: 'Business Decision Makers', description: `C-suite executives and senior managers in ${industry} seeking solutions to drive growth and efficiency.` },
      { title: 'Department Heads', description: `Leaders managing teams who need ${valueProposition} to improve departmental outcomes.` },
      { title: 'Small Business Owners', description: `Entrepreneurs looking for affordable ${industry} solutions to compete with larger companies.` },
      { title: 'Enterprise Teams', description: `Large organizations requiring scalable ${industry} solutions for hundreds or thousands of users.` },
      { title: 'Operations Managers', description: `Professionals streamlining processes and workflows in ${industry} environments.` },
      { title: 'Consultants and Advisors', description: `Independent professionals helping clients implement ${industry} best practices and solutions.` },
      { title: 'Technology Teams', description: `IT and technical professionals integrating ${industry} tools with existing systems.` },
      { title: 'Startups', description: `Fast-growing companies in ${industry} needing flexible solutions that scale with their business.` },
      { title: 'Industry Specialists', description: `${industry} experts seeking advanced tools to deliver better results for their clients.` },
      { title: 'Innovation Leaders', description: `Forward-thinking professionals exploring cutting-edge ${industry} solutions for competitive advantage.` }
    ];
  }

  // Default B2C audiences
  return [
    { title: 'Individual Users', description: `People seeking ${valueProposition} for personal use and daily needs.` },
    { title: 'Professionals', description: `Working professionals using ${industry} solutions to enhance productivity and results.` },
    { title: 'Enthusiasts', description: `Passionate users who value ${industry} innovation and cutting-edge features.` },
    { title: 'Budget-Conscious Consumers', description: `Cost-aware individuals seeking affordable ${industry} alternatives without sacrificing quality.` },
    { title: 'Tech-Savvy Users', description: `Early adopters excited about new ${industry} technologies and capabilities.` },
    { title: 'Families', description: `Households using ${industry} solutions to manage shared needs and activities.` },
    { title: 'Students and Educators', description: `Academic users leveraging ${industry} tools for learning and teaching.` },
    { title: 'Creative Professionals', description: `Artists, designers, and creators using ${industry} solutions for their craft.` },
    { title: 'Community Leaders', description: `Organizers and activists using ${industry} tools to coordinate and engage communities.` },
    { title: 'Hobbyists', description: `Casual users exploring ${industry} solutions for personal projects and interests.` }
  ];
}

/**
 * 从URL提取公司名称
 */
function extractCompanyName(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch (error) {
    return 'Company';
  }
}

/**
 * 从网站提取额外元数据（logo, 产品类型等）
 */
async function extractAdditionalMetadata(url, basicAnalysis) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const cheerio = require('cheerio');
    const $ = cheerio.load(response.data);

    // Extract logo (prefer SVG)
    let logo = '';

    // Try SVG logo first
    $('img[src$=".svg"], link[rel="icon"][href$=".svg"]').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('href');
      if (src && !logo) {
        logo = src.startsWith('http') ? src : new URL(src, url).href;
      }
    });

    // Try og:image or brand logo
    if (!logo) {
      logo = $('meta[property="og:image"]').attr('content') ||
             $('meta[name="twitter:image"]').attr('content') ||
             $('link[rel="icon"]').attr('href') ||
             $('link[rel="apple-touch-icon"]').attr('href') || '';

      if (logo && !logo.startsWith('http')) {
        logo = new URL(logo, url).href;
      }
    }

    // Extract product/service type from meta or content
    let productType = basicAnalysis.industry || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const ogType = $('meta[property="og:type"]').attr('content') || '';

    // Try to infer product type from description
    if (!productType && description) {
      const keywords = ['SaaS', 'AI', 'platform', 'tool', 'service', 'app', 'software', 'solution'];
      for (const keyword of keywords) {
        if (description.toLowerCase().includes(keyword.toLowerCase())) {
          productType = keyword === 'AI' ? 'AI/Machine Learning' : keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
    }

    // Extract benchmark brands (competitors or partners mentioned)
    const benchmarkBrands = [];
    const bodyText = $('body').text();
    const brandKeywords = ['partner', 'integration', 'works with', 'similar to', 'competitor', 'like'];

    // Common tech brands to look for
    const knownBrands = [
      'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Facebook', 'Instagram',
      'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Salesforce', 'HubSpot',
      'Shopify', 'Stripe', 'PayPal', 'Slack', 'Zoom', 'Notion', 'Asana'
    ];

    for (const brand of knownBrands) {
      if (bodyText.includes(brand) && !benchmarkBrands.includes(brand)) {
        benchmarkBrands.push(brand);
        if (benchmarkBrands.length >= 5) break;
      }
    }

    return {
      logo: logo || '',
      productType: productType || '',
      benchmarkBrands: benchmarkBrands.slice(0, 5),
      description: description || basicAnalysis.valueProposition || ''
    };
  } catch (error) {
    console.log(`⚠️ Failed to extract metadata: ${error.message}`);
    return {
      logo: '',
      productType: basicAnalysis.industry || '',
      benchmarkBrands: [],
      description: basicAnalysis.valueProposition || ''
    };
  }
}

module.exports = router;