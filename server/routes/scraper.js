const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// 分析企业网站
router.post('/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的网站URL'
      });
    }

    // 规范化URL
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    console.log('分析网站:', targetUrl);

    const response = await axios.get(targetUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    const $ = cheerio.load(response.data);

    // 提取基本信息
    const companyInfo = {
      url: targetUrl,
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      
      // 公司名称（多种方式尝试获取）
      companyName: $('title').text().split(/[-_|]/)[0].trim() || 
                   $('.company-name, .logo-text, h1').first().text().trim() ||
                   $('meta[property="og:site_name"]').attr('content') || '',

      // 联系信息
      email: extractEmails(response.data),
      phone: extractPhones(response.data),
      address: $('.address, .contact-address').text().trim(),

      // 业务信息
      services: extractServices($),
      products: extractProducts($),
      aboutText: $('.about, .company-intro, .about-us').text().trim(),

      // 社交媒体
      social: {
        wechat: $('a[href*="wechat"], a[href*="weixin"]').attr('href') || '',
        weibo: $('a[href*="weibo"]').attr('href') || '',
        linkedin: $('a[href*="linkedin"]').attr('href') || '',
        facebook: $('a[href*="facebook"]').attr('href') || ''
      },

      // 技术栈和特征
      technologies: extractTechnologies($),
      industry: detectIndustry($),
      
      // 页面结构
      navigationMenu: extractNavigation($),
      
      // SEO和元数据
      lang: $('html').attr('lang') || 'zh-CN',
      charset: $('meta[charset]').attr('charset') || 'UTF-8',
      
      // 分析时间
      analyzedAt: new Date().toISOString()
    };

    // 使用Ollama进一步分析
    try {
      const analysisPrompt = `请分析以下企业网站信息，并提供营销洞察：

网站标题: ${companyInfo.title}
公司名称: ${companyInfo.companyName}
描述: ${companyInfo.description}
服务/产品: ${companyInfo.services.concat(companyInfo.products).join(', ')}
行业: ${companyInfo.industry}
关于我们: ${companyInfo.aboutText.substring(0, 500)}

请提供：
1. 公司主营业务分析
2. 目标客户群体推测
3. 竞争优势识别
4. 营销切入点建议
5. 邮件营销策略建议

请用中文回答，简洁明了。`;

      const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen2.5:7b',
        prompt: analysisPrompt,
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.8
        }
      });

      companyInfo.aiAnalysis = ollamaResponse.data.response;
    } catch (aiError) {
      console.log('AI分析失败，跳过:', aiError.message);
      companyInfo.aiAnalysis = '暂时无法进行AI分析';
    }

    res.json({
      success: true,
      data: companyInfo
    });

  } catch (error) {
    console.error('网站分析错误:', error.message);
    
    let errorMessage = '网站分析失败';
    if (error.code === 'ENOTFOUND') {
      errorMessage = '无法访问该网站，请检查URL是否正确';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '网站访问超时，请稍后重试';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// 搜索中国企业邮箱
router.post('/search-chinese-emails', async (req, res) => {
  try {
    const { industry, location, keywords } = req.body;
    
    const ChineseCompanySearcher = require('../utils/chinese-companies');
    const searcher = new ChineseCompanySearcher();
    
    let searchResults;
    if (industry) {
      searchResults = await searcher.searchByIndustry(industry, location, 50);
    } else if (keywords) {
      searchResults = await searcher.searchCompanies(keywords);
    } else {
      return res.status(400).json({
        success: false,
        error: '请提供行业或关键词'
      });
    }
    
    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('搜索企业邮箱错误:', error.message);
    res.status(500).json({
      success: false,
      error: '搜索失败'
    });
  }
});

// 根据域名搜索企业信息
router.post('/search-by-domain', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: '请提供域名'
      });
    }

    const ChineseCompanySearcher = require('../utils/chinese-companies');
    const searcher = new ChineseCompanySearcher();
    const companyInfo = await searcher.searchByDomain(domain);
    
    res.json({
      success: true,
      data: companyInfo
    });

  } catch (error) {
    console.error('域名搜索错误:', error.message);
    res.status(500).json({
      success: false,
      error: '域名搜索失败'
    });
  }
});

// 批量验证邮箱
router.post('/validate-emails', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的邮箱列表'
      });
    }

    const ChineseCompanySearcher = require('../utils/chinese-companies');
    const searcher = new ChineseCompanySearcher();
    const validationResults = await searcher.validateEmails(emails);
    
    res.json({
      success: true,
      data: {
        total: emails.length,
        valid: validationResults.filter(r => r.valid).length,
        exists: validationResults.filter(r => r.exists).length,
        results: validationResults
      }
    });

  } catch (error) {
    console.error('邮箱验证错误:', error.message);
    res.status(500).json({
      success: false,
      error: '邮箱验证失败'
    });
  }
});

// 辅助函数
function extractEmails(html) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = html.match(emailRegex) || [];
  return [...new Set(matches)]; // 去重
}

function extractPhones(html) {
  const phoneRegex = /(\+86[-\s]?)?1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|400-?\d{3}-?\d{4}/g;
  const matches = html.match(phoneRegex) || [];
  return [...new Set(matches)];
}

function extractServices($) {
  const services = [];
  $('.service, .services li, .product, .solution').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 100) {
      services.push(text);
    }
  });
  return services.slice(0, 10); // 最多10个
}

function extractProducts($) {
  const products = [];
  $('.product-item, .product-list li, .category').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 100) {
      products.push(text);
    }
  });
  return products.slice(0, 10);
}

function extractTechnologies($) {
  const techs = [];
  $('script').each((i, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('jquery')) techs.push('jQuery');
    if (src.includes('react')) techs.push('React');
    if (src.includes('vue')) techs.push('Vue.js');
    if (src.includes('angular')) techs.push('Angular');
  });
  return [...new Set(techs)];
}

function detectIndustry($) {
  const text = $('body').text().toLowerCase();
  const industries = {
    '科技': ['科技', '软件', '互联网', 'IT', '人工智能', 'AI'],
    '制造业': ['制造', '生产', '工厂', '设备'],
    '金融': ['银行', '金融', '投资', '保险'],
    '医疗': ['医疗', '健康', '医院', '药品'],
    '教育': ['教育', '培训', '学校', '课程'],
    '电商': ['电商', '购物', '商城', '零售']
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return industry;
    }
  }
  return '其他';
}

function extractNavigation($) {
  const navItems = [];
  $('nav a, .nav a, .menu a, header a').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 20) {
      navItems.push(text);
    }
  });
  return navItems.slice(0, 10);
}


module.exports = router;