const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const MarketingResearchAgent = require('./MarketingResearchAgent');
const ProspectSearchAgent = require('./ProspectSearchAgent');
const ProfessionalEmailFinder = require('./ProfessionalEmailFinder');
const RealEmailFinder = require('./RealEmailFinder');
const MacMailIntegration = require('../integrations/MacMailIntegration');

class EmailAutomationAgent {
  constructor() {
    this.isRunning = false;
    this.prospectingInterval = 60 * 60 * 1000; // 1小时
    this.researchAgent = new MarketingResearchAgent();
    this.prospectSearchAgent = new ProspectSearchAgent();
    this.professionalEmailFinder = new ProfessionalEmailFinder();
    this.realEmailFinder = new RealEmailFinder();
    this.prospects = [];
    this.emailTemplates = {};
    this.ollamaUrl = 'http://localhost:11434';
    this.autoReplyEnabled = true;
    this.macMail = new MacMailIntegration();
    this.useRealEmail = true; // 使用真实邮件发送
    
    this.prospectsPath = path.join(__dirname, '../data/prospects.json');
    this.templatesPath = path.join(__dirname, '../data/email_templates.json');
    
    this.loadProspects();
    this.loadEmailTemplates();
    this.initializeDefaultTemplates();
  }

  // 启动自动化邮件系统
  async startAutomation(targetWebsite, companyInfo) {
    this.targetWebsite = targetWebsite;
    this.companyInfo = companyInfo;
    this.isRunning = true;
    
    console.log(`🚀 启动自动化邮件系统，目标网站: ${targetWebsite}`);
    
    // 启动市场调研
    this.researchAgent.startResearch(targetWebsite);
    
    // 立即执行一次潜客搜索
    await this.performProspecting();
    
    // 设置定期潜客搜索
    this.prospectingTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.performProspecting();
      }
    }, this.prospectingInterval);
  }

  // 停止自动化系统
  stopAutomation() {
    this.isRunning = false;
    this.researchAgent.stopResearch();
    
    if (this.prospectingTimer) {
      clearInterval(this.prospectingTimer);
    }
    
    console.log('🛑 停止自动化邮件系统');
  }

  // 执行潜客搜索
  async performProspecting() {
    try {
      console.log(`🔍 执行潜客搜索: ${new Date().toISOString()}`);
      
      // 获取最新市场调研洞察
      const marketInsights = this.researchAgent.getLatestInsightsForEmail();
      
      // 基于市场洞察搜索潜在客户
      const newProspects = await this.searchProspects(marketInsights);
      
      // 为每个新潜客生成个性化邮件
      for (const prospect of newProspects) {
        if (prospect.email && !this.isDuplicateProspect(prospect)) {
          const personalizedEmail = await this.generatePersonalizedEmail(prospect, marketInsights);
          prospect.emailContent = personalizedEmail;
          prospect.status = 'ready_to_send';
          prospect.createdAt = new Date().toISOString();
          
          this.prospects.push(prospect);
        }
      }
      
      // 自动发送邮件（可选）
      if (this.autoSendEnabled) {
        await this.sendPendingEmails();
      }
      
      // 保存潜客数据
      this.saveProspects();
      
      console.log(`✅ 潜客搜索完成，新增 ${newProspects.length} 个潜在客户`);
      
    } catch (error) {
      console.error('❌ 潜客搜索失败:', error.message);
    }
  }

  // 搜索潜在客户
  async searchProspects(marketInsights) {
    try {
      console.log('🔍 开始专业级邮箱搜索...');
      
      // 基于目标网站分析潜在客户
      const targetAnalysis = await this.analyzeTargetWebsite();
      
      // 构建专业搜索标准
      const searchCriteria = {
        industry: targetAnalysis.industry || 'technology',
        targetTitles: [
          'CEO', 'Founder', 'Co-founder', 'President',
          'Marketing Director', 'Sales Manager', 
          'Business Development Manager', 'Head of Marketing'
        ],
        companySize: 'SME',
        keywords: this.generateSearchKeywords(marketInsights, targetAnalysis),
        targetDomains: this.extractDomainsFromAnalysis(targetAnalysis)
      };
      
      console.log('📋 专业搜索标准:', JSON.stringify(searchCriteria, null, 2));
      
      // 优先使用真实邮箱搜索引擎
      console.log('🎯 使用真实邮箱搜索引擎...');
      
      const companyInfo = {
        name: targetAnalysis.companyName || 'Target Company',
        website: this.targetWebsite,
        domain: new URL(this.targetWebsite).hostname.replace('www.', ''),
        industry: targetAnalysis.industry || 'technology'
      };
      
      const realEmailResults = await this.realEmailFinder.findRealBusinessEmails(companyInfo);
      
      if (realEmailResults.emails && realEmailResults.emails.length > 0) {
        console.log(`✅ 真实邮箱搜索成功，发现 ${realEmailResults.emails.length} 个真实联系人`);
        return this.formatRealEmailResults(realEmailResults.emails);
      }
      
      // 回退到专业搜索
      console.log('🔄 回退到专业搜索引擎...');
      const professionalResults = await this.professionalEmailFinder.findProspectEmails(searchCriteria);
      
      if (professionalResults.success && professionalResults.prospects.length > 0) {
        console.log(`✅ 专业搜索成功，发现 ${professionalResults.prospects.length} 个高质量联系人`);
        return this.formatProfessionalResults(professionalResults.prospects);
      }
      
      // 回退到原有的搜索方法
      console.log('🔄 回退到ProspectSearchAgent...');
      const strategy = {
        target_audience: {
          type: targetAnalysis.targetAudience?.includes('企业') || targetAnalysis.targetAudience?.includes('B2B') ? 'tob' : 'toc',
          search_keywords: searchCriteria.keywords,
          search_keyword_groups: {
            primary_keywords: [targetAnalysis.industry, 'business', 'company'],
            industry_keywords: [targetAnalysis.industry, 'professional', 'service'],
            solution_keywords: targetAnalysis.services || ['solution', 'service'],
            technology_keywords: ['digital', 'tech', 'online'],
            audience_keywords: targetAnalysis.targetAudience || ['customer', 'client']
          }
        }
      };
      
      const prospects = await this.prospectSearchAgent.searchProspects(
        strategy, 
        targetAnalysis.industry || 'general',
        strategy.target_audience.type
      );
      
      console.log(`✅ 回退搜索完成，发现 ${prospects.length} 个潜在客户`);
      return prospects.slice(0, 20);
      
    } catch (error) {
      console.error('❌ 所有搜索方法失败:', error.message);
      
      // 最终回退到基础搜索
      console.log('🔄 启用最终回退搜索...');
      return await this.fallbackSearch(marketInsights);
    }
  }
  
  // 格式化真实邮箱搜索结果
  formatRealEmailResults(realEmails) {
    return realEmails.map(emailObj => ({
      company: emailObj.company || 'Professional Organization',
      email: emailObj.email,
      name: emailObj.firstName && emailObj.lastName 
        ? `${emailObj.firstName} ${emailObj.lastName}`
        : emailObj.firstName || emailObj.title || 'Business Contact',
      industry: 'technology',
      status: 'discovered_real',
      source: `real_${emailObj.source.toLowerCase().replace(/\s+/g, '_')}`,
      role: emailObj.title || 'Business Contact',
      confidence: emailObj.finalScore || emailObj.qualityScore || emailObj.verificationScore || 85,
      verified: emailObj.verified || false,
      linkedin_url: emailObj.linkedin_url,
      company_domain: emailObj.email.split('@')[1],
      quality_score: emailObj.finalScore || emailObj.qualityScore || 85,
      deliverable: emailObj.deliverable || emailObj.verified
    }));
  }
  
  // 格式化专业搜索结果
  formatProfessionalResults(professionalProspects) {
    return professionalProspects.map(prospect => ({
      company: prospect.company || 'Professional Organization',
      email: prospect.email,
      name: prospect.first_name && prospect.last_name 
        ? `${prospect.first_name} ${prospect.last_name}`
        : prospect.first_name || 'Business Contact',
      industry: 'technology', // 可以根据公司域名进一步分析
      status: 'discovered',
      source: `professional_${prospect.source}`,
      role: prospect.position || 'Business Contact',
      confidence: prospect.qualityScore || prospect.confidence || 75,
      verified: prospect.verified || false,
      linkedin_url: prospect.linkedin_url,
      company_domain: prospect.company_domain
    }));
  }
  
  // 从分析结果中提取域名
  extractDomainsFromAnalysis(analysis) {
    const domains = [];
    
    // 从竞争对手中提取域名
    if (analysis.competitors && Array.isArray(analysis.competitors)) {
      analysis.competitors.forEach(competitor => {
        if (typeof competitor === 'string') {
          // 简单的域名推断，实际中可能需要更复杂的逻辑
          const domain = competitor.toLowerCase().replace(/\s+/g, '') + '.com';
          domains.push(domain);
        }
      });
    }
    
    // 添加一些通用的行业域名
    if (analysis.industry) {
      const industryDomains = this.getIndustryDomains(analysis.industry);
      domains.push(...industryDomains);
    }
    
    return [...new Set(domains)]; // 去重
  }
  
  // 获取行业相关域名
  getIndustryDomains(industry) {
    const industryMaps = {
      'technology': ['tech.com', 'saas.com', 'ai.com', 'startup.io'],
      'healthcare': ['health.com', 'medical.com', 'healthcare.org'],
      'finance': ['fintech.com', 'finance.com', 'banking.com'],
      'education': ['edu.com', 'learning.com', 'education.org']
    };
    
    return industryMaps[industry.toLowerCase()] || [];
  }
  
  // 回退搜索方法
  async fallbackSearch(marketInsights) {
    const prospects = [];
    
    // 基于目标网站分析潜在客户
    const targetAnalysis = await this.analyzeTargetWebsite();
    
    // 生成潜客搜索关键词
    const searchKeywords = this.generateSearchKeywords(marketInsights, targetAnalysis);
    
    // 基础关键词搜索
    for (const keyword of searchKeywords.slice(0, 3)) {
      const keywordProspects = await this.searchByKeyword(keyword);
      prospects.push(...keywordProspects);
    }
    
    return prospects.slice(0, 10); // 限制每次最多10个新潜客
  }

  // 分析目标网站
  async analyzeTargetWebsite() {
    try {
      const response = await axios.get(this.targetWebsite, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      return {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        industry: this.detectIndustry($),
        services: this.extractServices($),
        targetAudience: this.inferTargetAudience($),
        competitors: this.identifyCompetitors($)
      };
      
    } catch (error) {
      console.error('分析目标网站失败:', error.message);
      return {
        title: '未知网站',
        industry: 'general',
        services: ['产品/服务'],
        targetAudience: ['潜在客户']
      };
    }
  }

  // 检测行业
  detectIndustry($) {
    const content = $('body').text().toLowerCase();
    const industries = {
      '宠物': ['pet', 'dog', 'cat', 'animal', 'veterinary', '宠物', '动物'],
      '科技': ['technology', 'software', 'tech', 'digital', 'ai', '科技', '软件'],
      '医疗': ['health', 'medical', 'healthcare', 'clinic', '医疗', '健康'],
      '教育': ['education', 'school', 'university', 'learning', '教育', '学习'],
      '金融': ['finance', 'banking', 'investment', 'insurance', '金融', '银行'],
      '零售': ['retail', 'shopping', 'store', 'ecommerce', '零售', '购物']
    };
    
    for (const [industry, keywords] of Object.entries(industries)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          return industry;
        }
      }
    }
    
    return '通用';
  }

  // 提取服务
  extractServices($) {
    const services = [];
    $('.service, .services li, .product, .solution').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100) {
        services.push(text);
      }
    });
    return services.slice(0, 10);
  }

  // 推断目标受众
  inferTargetAudience($) {
    const content = $('body').text().toLowerCase();
    const audiences = [];
    
    const audiencePatterns = {
      '企业主': ['business owner', 'entrepreneur', 'ceo', '企业主', '创业者'],
      '营销专员': ['marketing', 'marketer', 'promotion', '营销', '推广'],
      '技术开发者': ['developer', 'programmer', 'engineer', '开发', '程序员'],
      '宠物主人': ['pet owner', 'dog owner', 'cat owner', '宠物主', '爱宠人士']
    };
    
    for (const [audience, keywords] of Object.entries(audiencePatterns)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          audiences.push(audience);
          break;
        }
      }
    }
    
    return audiences.length > 0 ? audiences : ['潜在客户'];
  }

  // 识别竞争对手
  identifyCompetitors($) {
    const competitors = [];
    $('a[href*="competitor"], a[href*="partner"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('http')) {
        competitors.push(href);
      }
    });
    return competitors.slice(0, 5);
  }

  // 生成搜索关键词
  generateSearchKeywords(marketInsights, targetAnalysis) {
    const keywords = [];
    
    // 基于行业
    if (targetAnalysis.industry) {
      keywords.push(`${targetAnalysis.industry} CEO`);
      keywords.push(`${targetAnalysis.industry} 营销总监`);
      keywords.push(`${targetAnalysis.industry} 业务负责人`);
    }
    
    // 基于市场趋势
    if (marketInsights?.marketTrends?.emergingKeywords) {
      keywords.push(...marketInsights.marketTrends.emergingKeywords.map(k => `${k} 专家`));
    }
    
    // 基于痛点
    if (marketInsights?.painPoints) {
      keywords.push(...marketInsights.painPoints.map(p => `${p} 解决方案`));
    }
    
    // 默认关键词
    keywords.push('业务发展经理', '市场营销专员', '产品经理', '创始人', 'CTO');
    
    return [...new Set(keywords)]; // 去重
  }

  // 按关键词搜索
  async searchByKeyword(keyword) {
    // 模拟搜索结果（实际应用中集成真实搜索API）
    const mockProspects = [
      {
        name: '张明',
        email: 'zhang.ming@example.com',
        company: '创新科技有限公司',
        position: 'CEO',
        industry: '科技',
        linkedinUrl: 'https://linkedin.com/in/zhangming',
        source: `搜索关键词: ${keyword}`,
        score: Math.floor(Math.random() * 100) + 1,
        interests: ['产品创新', '市场拓展', '团队管理'],
        painPoints: ['获客成本高', '市场竞争激烈', '品牌知名度低']
      },
      {
        name: '李小华',
        email: 'li.xiaohua@company.com',
        company: '宠物生活馆',
        position: '营销总监',
        industry: '宠物',
        linkedinUrl: 'https://linkedin.com/in/lixiaohua',
        source: `搜索关键词: ${keyword}`,
        score: Math.floor(Math.random() * 100) + 1,
        interests: ['数字营销', '客户体验', '品牌建设'],
        painPoints: ['线上获客难', '客户留存低', '营销效果难衡量']
      }
    ];
    
    // 随机返回1-3个潜客
    const count = Math.floor(Math.random() * 3) + 1;
    return mockProspects.slice(0, count).map(p => ({
      ...p,
      id: `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      searchKeyword: keyword
    }));
  }

  // 检查是否重复潜客
  isDuplicateProspect(prospect) {
    return this.prospects.some(p => 
      p.email === prospect.email || 
      (p.name === prospect.name && p.company === prospect.company)
    );
  }

  // 生成个性化邮件
  async generatePersonalizedEmail(prospect, marketInsights) {
    try {
      const context = {
        prospectName: prospect.name,
        prospectCompany: prospect.company,
        prospectPosition: prospect.position,
        prospectIndustry: prospect.industry,
        prospectPainPoints: prospect.painPoints || [],
        prospectInterests: prospect.interests || [],
        companyInfo: this.companyInfo,
        marketInsights: marketInsights,
        targetWebsite: this.targetWebsite
      };
      
      // 选择合适的模板
      const templateType = this.selectEmailTemplate(prospect, marketInsights);
      const template = this.emailTemplates[templateType];
      
      // 使用AI生成个性化内容
      const personalizedContent = await this.generateAIContent(template, context);
      
      return {
        subject: personalizedContent.subject,
        body: personalizedContent.body,
        template: templateType,
        generatedAt: new Date().toISOString(),
        context: context
      };
      
    } catch (error) {
      console.error('生成个性化邮件失败:', error.message);
      return this.getFallbackEmail(prospect);
    }
  }

  // 选择邮件模板
  selectEmailTemplate(prospect, marketInsights) {
    // 基于潜客信息和市场洞察选择最合适的模板
    if (prospect.position?.includes('CEO') || prospect.position?.includes('创始人')) {
      return 'executive_outreach';
    }
    
    if (prospect.position?.includes('营销') || prospect.position?.includes('市场')) {
      return 'marketing_professional';
    }
    
    if (prospect.painPoints?.some(p => p.includes('获客') || p.includes('营销'))) {
      return 'lead_generation_solution';
    }
    
    return 'general_business_outreach';
  }

  // 使用AI生成内容
  async generateAIContent(template, context) {
    try {
      const prompt = `作为专业的邮件营销专家，基于以下信息生成个性化的商务邮件：

潜在客户信息：
- 姓名：${context.prospectName}
- 公司：${context.prospectCompany}
- 职位：${context.prospectPosition}
- 行业：${context.prospectIndustry}
- 痛点：${context.prospectPainPoints.join(', ')}
- 兴趣：${context.prospectInterests.join(', ')}

我们公司信息：
${JSON.stringify(context.companyInfo, null, 2)}

市场洞察：
${JSON.stringify(context.marketInsights?.keyMessages || [], null, 2)}

邮件模板框架：
${template.structure}

要求：
1. 主题行要吸引人，控制在30字以内
2. 邮件内容要专业、简洁、有针对性
3. 必须包含明确的价值主张
4. 避免过于推销，要建立信任
5. 包含明确的行动号召
6. 使用中文

请返回JSON格式：
{
  "subject": "邮件主题",
  "body": "邮件正文内容"
}`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      });

      // 尝试解析AI返回的JSON
      try {
        const aiContent = JSON.parse(response.data.response);
        return aiContent;
      } catch (parseError) {
        // 如果解析失败，手动提取内容
        const content = response.data.response;
        const subject = this.extractSubject(content) || template.defaultSubject.replace('{company}', context.prospectCompany);
        const body = this.extractBody(content) || this.getFallbackEmailBody(context);
        
        return { subject, body };
      }
      
    } catch (error) {
      console.error('AI生成邮件内容失败:', error.message);
      return {
        subject: template.defaultSubject.replace('{company}', context.prospectCompany),
        body: template.defaultBody
          .replace('{name}', context.prospectName)
          .replace('{company}', context.prospectCompany)
          .replace('{position}', context.prospectPosition)
      };
    }
  }

  // 提取主题
  extractSubject(content) {
    const subjectMatch = content.match(/"subject":\s*"([^"]+)"/);
    return subjectMatch ? subjectMatch[1] : null;
  }

  // 提取正文
  extractBody(content) {
    const bodyMatch = content.match(/"body":\s*"([^"]+)"/);
    return bodyMatch ? bodyMatch[1].replace(/\\n/g, '\n') : null;
  }

  // 获取后备邮件
  getFallbackEmail(prospect) {
    return {
      subject: `关于${prospect.company}的业务合作机会`,
      body: `尊敬的${prospect.name}，

我注意到您在${prospect.company}担任${prospect.position}，相信您一定在${prospect.industry}领域有着丰富的经验。

我们是一家专注于帮助企业提升营销效果的公司，已经帮助众多${prospect.industry}企业实现了业务增长。

如果您有5分钟时间，我很乐意与您分享一些可能对${prospect.company}有帮助的想法。

期待您的回复。

此致
敬礼`,
      template: 'fallback',
      generatedAt: new Date().toISOString()
    };
  }

  // 后备邮件正文
  getFallbackEmailBody(context) {
    return `尊敬的${context.prospectName}，

我注意到您在${context.prospectCompany}担任${context.prospectPosition}，相信您一定在业务发展方面有着独到的见解。

基于我们对${context.prospectIndustry}行业的研究，我们发现许多企业都面临着相似的挑战。我们的解决方案已经帮助多家企业成功突破了这些瓶颈。

如果您有兴趣了解更多，我很乐意安排一次简短的通话，分享一些可能对${context.prospectCompany}有价值的洞察。

期待您的回复。

此致
敬礼`;
  }

  // 发送待发送邮件
  async sendPendingEmails() {
    const pendingEmails = this.prospects.filter(p => p.status === 'ready_to_send');
    
    for (const prospect of pendingEmails.slice(0, 10)) { // 每次最多发送10封
      try {
        await this.sendEmail(prospect);
        prospect.status = 'sent';
        prospect.sentAt = new Date().toISOString();
      } catch (error) {
        console.error(`发送邮件失败 (${prospect.email}):`, error.message);
        prospect.status = 'failed';
        prospect.error = error.message;
      }
    }
    
    this.saveProspects();
  }

  // 发送单封邮件
  async sendEmail(prospect) {
    try {
      if (this.useRealEmail && this.macMail.isAvailable) {
        // 使用Mac邮件应用发送真实邮件
        const result = await this.macMail.sendEmail({
          to: prospect.email,
          subject: prospect.emailContent.subject,
          body: prospect.emailContent.body,
          htmlBody: this.formatEmailAsHtml(prospect.emailContent.body)
        });
        
        console.log(`📧 真实邮件发送成功到: ${prospect.email}`);
        return result;
        
      } else {
        // 模拟发送（开发/测试模式）
        console.log(`📧 模拟发送邮件到: ${prospect.email}`);
        console.log(`主题: ${prospect.emailContent.subject}`);
        console.log(`内容预览: ${prospect.emailContent.body.substring(0, 100)}...`);
        
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          to: prospect.email,
          subject: prospect.emailContent.subject,
          sentAt: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error(`❌ 邮件发送失败 (${prospect.email}):`, error.message);
      throw error;
    }
  }

  // 格式化邮件为HTML
  formatEmailAsHtml(content) {
    if (!content) return '';
    
    return content
      .replace(/\n/g, '<br>')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/  /g, '&nbsp;&nbsp;')
      .replace(/\n\n/g, '<br><br>');
  }

  // 处理邮件回复
  async handleEmailReply(fromEmail, subject, content) {
    if (!this.autoReplyEnabled) return;
    
    try {
      // 查找对应的潜客
      const prospect = this.prospects.find(p => p.email === fromEmail);
      if (!prospect) return;
      
      // 分析回复内容
      const replyAnalysis = await this.analyzeReply(content);
      
      // 生成自动回复
      const autoReply = await this.generateAutoReply(prospect, replyAnalysis);
      
      // 发送自动回复
      await this.sendAutoReply(prospect, autoReply);
      
      // 更新潜客状态
      prospect.status = 'engaged';
      prospect.lastReply = {
        content: content,
        analysis: replyAnalysis,
        repliedAt: new Date().toISOString()
      };
      
      this.saveProspects();
      
    } catch (error) {
      console.error('处理邮件回复失败:', error.message);
    }
  }

  // 分析回复内容
  async analyzeReply(content) {
    try {
      const prompt = `分析以下邮件回复的意图和情感：

邮件内容：
${content}

请判断：
1. 回复意图（感兴趣/不感兴趣/需要更多信息/其他）
2. 情感倾向（积极/消极/中性）
3. 关键信息提取
4. 建议的后续行动

请用JSON格式返回：
{
  "intent": "意图分类",
  "sentiment": "情感分析",
  "keyInfo": ["关键信息1", "关键信息2"],
  "nextAction": "建议行动"
}`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false
      });

      try {
        return JSON.parse(response.data.response);
      } catch {
        return {
          intent: '需要更多信息',
          sentiment: '中性',
          keyInfo: [],
          nextAction: '提供更多详细信息'
        };
      }
      
    } catch (error) {
      console.error('分析回复失败:', error.message);
      return null;
    }
  }

  // 生成自动回复
  async generateAutoReply(prospect, replyAnalysis) {
    try {
      const prompt = `基于客户回复生成专业的自动回复邮件：

客户信息：
- 姓名：${prospect.name}
- 公司：${prospect.company}
- 职位：${prospect.position}

原始邮件主题：${prospect.emailContent.subject}

客户回复分析：
${JSON.stringify(replyAnalysis, null, 2)}

要求：
1. 根据客户的回复意图调整回复策略
2. 保持专业和热情的语调
3. 提供有价值的信息
4. 包含明确的下一步建议
5. 使用中文

请返回邮件内容（不需要JSON格式，直接返回邮件正文）：`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false
      });

      return response.data.response;
      
    } catch (error) {
      console.error('生成自动回复失败:', error.message);
      return `感谢您的回复！我会尽快为您提供更详细的信息。`;
    }
  }

  // 发送自动回复
  async sendAutoReply(prospect, replyContent) {
    console.log(`🔄 发送自动回复到: ${prospect.email}`);
    console.log(`回复内容: ${replyContent}`);
    
    // TODO: 实际发送自动回复邮件
  }

  // 初始化默认模板
  initializeDefaultTemplates() {
    if (Object.keys(this.emailTemplates).length === 0) {
      this.emailTemplates = {
        executive_outreach: {
          name: '高管外展',
          structure: '问候 → 价值主张 → 社会证明 → 行动号召',
          defaultSubject: '关于{company}业务增长的想法',
          defaultBody: '尊敬的{name}，\n\n作为{company}的{position}，相信您一定关注企业的持续发展...'
        },
        marketing_professional: {
          name: '营销专员',
          structure: '行业洞察 → 解决方案介绍 → 案例分享 → 合作邀请',
          defaultSubject: '提升{company}营销ROI的策略分享',
          defaultBody: '您好{name}，\n\n我注意到{company}在营销方面的努力，想与您分享一些有价值的洞察...'
        },
        lead_generation_solution: {
          name: '获客解决方案',
          structure: '痛点共鸣 → 解决方案 → 效果承诺 → 免费试用',
          defaultSubject: '解决{company}获客难题的实用方案',
          defaultBody: '{name}您好，\n\n了解到许多{industry}企业都面临获客成本高的挑战...'
        },
        general_business_outreach: {
          name: '通用商务外展',
          structure: '自我介绍 → 共同价值 → 合作建议 → 下一步',
          defaultSubject: '探讨{company}的合作机会',
          defaultBody: '尊敬的{name}，\n\n我是专注于帮助企业发展的顾问，希望有机会与{company}合作...'
        }
      };
      
      this.saveEmailTemplates();
    }
  }

  // 加载潜客数据
  loadProspects() {
    try {
      if (fs.existsSync(this.prospectsPath)) {
        const data = fs.readFileSync(this.prospectsPath, 'utf8');
        const parsed = JSON.parse(data);
        // 确保加载的数据是数组，如果不是则初始化为空数组
        this.prospects = Array.isArray(parsed) ? parsed : [];
      } else {
        this.prospects = [];
      }
    } catch (error) {
      console.error('加载潜客数据失败:', error.message);
      this.prospects = [];
    }
  }

  // 保存潜客数据
  saveProspects() {
    try {
      const dir = path.dirname(this.prospectsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.prospectsPath, JSON.stringify(this.prospects, null, 2));
    } catch (error) {
      console.error('保存潜客数据失败:', error.message);
    }
  }

  // 加载邮件模板
  loadEmailTemplates() {
    try {
      if (fs.existsSync(this.templatesPath)) {
        const data = fs.readFileSync(this.templatesPath, 'utf8');
        this.emailTemplates = JSON.parse(data);
      }
    } catch (error) {
      console.error('加载邮件模板失败:', error.message);
      this.emailTemplates = {};
    }
  }

  // 保存邮件模板
  saveEmailTemplates() {
    try {
      const dir = path.dirname(this.templatesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.templatesPath, JSON.stringify(this.emailTemplates, null, 2));
    } catch (error) {
      console.error('保存邮件模板失败:', error.message);
    }
  }

  // 获取系统状态
  async getSystemStatus() {
    const macMailStatus = await this.macMail.getMailAppStatus();
    
    // 确保prospects是一个数组
    if (!Array.isArray(this.prospects)) {
      this.prospects = [];
    }
    
    return {
      isRunning: this.isRunning,
      targetWebsite: this.targetWebsite,
      totalProspects: this.prospects.length,
      readyToSend: this.prospects.filter(p => p.status === 'ready_to_send').length,
      sent: this.prospects.filter(p => p.status === 'sent').length,
      engaged: this.prospects.filter(p => p.status === 'engaged').length,
      autoReplyEnabled: this.autoReplyEnabled,
      useRealEmail: this.useRealEmail,
      macMailIntegration: macMailStatus,
      researchAgentStatus: this.researchAgent.getRealtimeData(),
      recentProspects: this.prospects.slice(-10).map(p => ({
        name: p.name,
        company: p.company,
        email: p.email,
        status: p.status,
        createdAt: p.createdAt
      }))
    };
  }

  // 测试Mac邮件集成
  async testMacMailIntegration() {
    try {
      const testResult = await this.macMail.testSend();
      return {
        success: true,
        message: 'Mac邮件集成测试成功',
        details: testResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'Mac邮件集成测试失败: ' + error.message,
        error: error.message
      };
    }
  }

  // 获取Mac邮件集成信息
  getMacMailIntegrationInfo() {
    return this.macMail.getIntegrationInfo();
  }

  // 切换邮件发送模式
  toggleEmailMode(useReal = true) {
    this.useRealEmail = useReal;
    console.log(`📧 邮件发送模式已切换为: ${useReal ? '真实发送' : '模拟发送'}`);
    return {
      useRealEmail: this.useRealEmail,
      macMailAvailable: this.macMail.isAvailable
    };
  }

  // 获取邮件内容和进度（用于监控仪表板）
  getEmailContentAndProgress() {
    const emailsByStatus = {
      ready_to_send: this.prospects.filter(p => p.status === 'ready_to_send').length,
      sent: this.prospects.filter(p => p.status === 'sent').length,
      engaged: this.prospects.filter(p => p.status === 'engaged').length,
      failed: this.prospects.filter(p => p.status === 'failed').length
    };
    
    const recentEmails = this.prospects
      .filter(p => p.emailContent)
      .slice(-20)
      .map(p => ({
        id: p.id,
        recipient: p.email,
        recipientName: p.name,
        company: p.company,
        subject: p.emailContent.subject,
        preview: p.emailContent.body.substring(0, 150) + '...',
        status: p.status,
        template: p.emailContent.template,
        createdAt: p.createdAt,
        sentAt: p.sentAt
      }));
    
    return {
      statistics: emailsByStatus,
      totalProspects: this.prospects.length,
      conversionRate: this.prospects.length > 0 ? 
        (emailsByStatus.engaged / this.prospects.length * 100).toFixed(1) : 0,
      recentEmails: recentEmails,
      isRunning: this.isRunning,
      lastActivity: this.prospects.length > 0 ? 
        Math.max(...this.prospects.map(p => new Date(p.createdAt || 0).getTime())) : null
    };
  }

  // 手动添加潜客
  addManualProspect(prospectData) {
    const prospect = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...prospectData,
      source: 'manual_input',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.prospects.push(prospect);
    this.saveProspects();
    
    return prospect;
  }

  // 生成潜客的个性化邮件
  async generateEmailForProspect(prospectId) {
    const prospect = this.prospects.find(p => p.id === prospectId);
    if (!prospect) {
      throw new Error('潜客不存在');
    }
    
    const marketInsights = this.researchAgent.getLatestInsightsForEmail();
    const emailContent = await this.generatePersonalizedEmail(prospect, marketInsights);
    
    prospect.emailContent = emailContent;
    prospect.status = 'ready_to_send';
    this.saveProspects();
    
    return emailContent;
  }
}

module.exports = EmailAutomationAgent;