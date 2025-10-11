const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const RealAIEngine = require('./RealAIEngine');
const EmailSequenceManager = require('./EmailSequenceManager');

class AILeadDiscoveryAgent {
  constructor() {
    this.knowledgeBasePath = path.join(__dirname, '../data/knowledge-base.json');
    this.leadsPath = path.join(__dirname, '../data/leads.json');
    this.sequencesPath = path.join(__dirname, '../data/email-sequences.json');
    this.knowledgeBase = this.loadKnowledgeBase();
    this.leads = this.loadLeads();
    this.realAI = new RealAIEngine();
    this.sequenceManager = new EmailSequenceManager();
    this.activeSequences = this.loadActiveSequences();
    
    // 初始化目录
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dataDir = path.dirname(this.knowledgeBasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadKnowledgeBase() {
    try {
      if (fs.existsSync(this.knowledgeBasePath)) {
        return JSON.parse(fs.readFileSync(this.knowledgeBasePath, 'utf8'));
      }
    } catch (error) {
      console.warn('加载知识库失败:', error.message);
    }
    return {
      websites: {},
      industries: {},
      competitors: {},
      contacts: {},
      lastUpdated: new Date().toISOString()
    };
  }

  loadLeads() {
    try {
      if (fs.existsSync(this.leadsPath)) {
        return JSON.parse(fs.readFileSync(this.leadsPath, 'utf8'));
      }
    } catch (error) {
      console.warn('加载潜在客户失败:', error.message);
    }
    return [];
  }

  saveKnowledgeBase() {
    try {
      this.knowledgeBase.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.knowledgeBasePath, JSON.stringify(this.knowledgeBase, null, 2));
    } catch (error) {
      console.error('保存知识库失败:', error.message);
    }
  }

  saveLeads() {
    try {
      fs.writeFileSync(this.leadsPath, JSON.stringify(this.leads, null, 2));
    } catch (error) {
      console.error('保存潜在客户失败:', error.message);
    }
  }

  // 真实AI驱动的网站分析
  async analyzeWebsite(url) {
    console.log(`🔍 真实AI分析网站: ${url}`);
    
    try {
      // 获取网站内容
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // 提取完整的网站内容供AI分析
      const fullContent = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        headings: [],
        bodyText: $('body').text().trim(),
        rawHtml: response.data
      };

      // 提取标题
      $('h1, h2, h3').each((i, elem) => {
        if (i < 10) { // 限制数量
          fullContent.headings.push($(elem).text().trim());
        }
      });

      // 使用真实AI进行深度分析
      console.log(`🤖 调用真实AI引擎分析网站内容...`);
      const aiAnalysis = await this.realAI.analyzeWebsite(url, fullContent.bodyText);
      
      // 合并AI分析结果和基础提取信息
      const websiteInfo = {
        ...aiAnalysis,
        title: fullContent.title,
        description: fullContent.description,
        keywords: fullContent.keywords,
        headings: fullContent.headings,
        analysisTimestamp: new Date().toISOString(),
        aiAnalysisComplete: true
      };

      // 保存到知识库
      this.knowledgeBase.websites[url] = websiteInfo;
      this.saveKnowledgeBase();

      console.log(`✅ 真实AI网站分析完成: ${websiteInfo.businessType} / ${websiteInfo.industry}`);
      return websiteInfo;

    } catch (error) {
      console.error(`网站分析失败 ${url}:`, error.message);
      return null;
    }
  }

  // AI推理业务类型
  inferBusinessType(websiteInfo) {
    const content = (websiteInfo.title + ' ' + websiteInfo.description + ' ' + 
                    websiteInfo.headings.join(' ')).toLowerCase();

    const businessTypes = {
      'e-commerce': ['shop', 'store', 'buy', 'cart', 'product', 'marketplace', 'retail'],
      'saas': ['software', 'app', 'platform', 'tool', 'service', 'subscription', 'api'],
      'agency': ['agency', 'marketing', 'design', 'consulting', 'creative', 'digital'],
      'startup': ['startup', 'innovation', 'venture', 'entrepreneur', 'disrupt'],
      'enterprise': ['enterprise', 'corporation', 'business', 'company', 'industrial'],
      'healthcare': ['health', 'medical', 'clinic', 'hospital', 'doctor', 'patient'],
      'education': ['education', 'school', 'university', 'course', 'learning', 'training'],
      'finance': ['finance', 'bank', 'investment', 'loan', 'insurance', 'trading']
    };

    let bestMatch = 'unknown';
    let maxScore = 0;

    for (const [type, keywords] of Object.entries(businessTypes)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (content.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = type;
      }
    }

    return maxScore > 0 ? bestMatch : 'unknown';
  }

  // AI推理行业
  inferIndustry(websiteInfo) {
    const content = (websiteInfo.title + ' ' + websiteInfo.description + ' ' + 
                    websiteInfo.headings.join(' ')).toLowerCase();

    const industries = {
      'technology': ['tech', 'software', 'ai', 'machine learning', 'cloud', 'data'],
      'retail': ['retail', 'fashion', 'clothing', 'accessories', 'beauty'],
      'healthcare': ['healthcare', 'medical', 'pharmaceutical', 'wellness'],
      'finance': ['finance', 'fintech', 'banking', 'investment', 'crypto'],
      'education': ['education', 'edtech', 'learning', 'training'],
      'real-estate': ['real estate', 'property', 'housing', 'construction'],
      'food': ['food', 'restaurant', 'catering', 'nutrition'],
      'travel': ['travel', 'tourism', 'hotel', 'airline', 'vacation'],
      'automotive': ['automotive', 'car', 'vehicle', 'transportation'],
      'entertainment': ['entertainment', 'gaming', 'media', 'music', 'sports']
    };

    let bestMatch = 'other';
    let maxScore = 0;

    for (const [industry, keywords] of Object.entries(industries)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (content.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = industry;
      }
    }

    return maxScore > 0 ? bestMatch : 'other';
  }

  // 验证商业邮箱
  isValidBusinessEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // 基本邮箱格式验证
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    // 排除个人邮箱域名
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'icloud.com', 'aol.com', '163.com', 'qq.com', '126.com'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    return !personalDomains.includes(domain);
  }

  // 专业级智能潜在客户发掘和序列化营销
  async discoverLeads(targetWebsite, campaignGoal = 'general_outreach') {
    console.log(`🤖 专业级AI开始发掘潜在客户: ${targetWebsite}`);
    console.log(`🎯 营销目标: ${campaignGoal}`);

    // 使用专业级AI分析目标网站
    const websiteAnalysis = await this.analyzeWebsite(targetWebsite);
    if (!websiteAnalysis) {
      console.error('❌ 网站分析失败，无法发掘潜在客户');
      return [];
    }

    // 使用专业级AI生成高质量潜在客户
    console.log(`🤖 专业级AI生成高质量潜在客户...`);
    const newLeads = await this.realAI.generateRealLeads(websiteAnalysis, campaignGoal);

    if (newLeads.length === 0) {
      console.log(`⚠️ 从网站未提取到有效联系信息，生成相关行业潜在客户...`);
      const syntheticLeads = this.generateSyntheticLeads(websiteAnalysis, campaignGoal, 3);
      newLeads.push(...syntheticLeads);
    }

    // 为每个潜在客户设置邮件营销序列
    for (const lead of newLeads) {
      await this.setupEmailSequenceForLead(lead, websiteAnalysis);
    }

    // 保存新的潜在客户
    this.leads.push(...newLeads);
    this.saveLeads();

    console.log(`✅ 专业级AI发现 ${newLeads.length} 个高质量潜在客户`);
    newLeads.forEach(lead => {
      console.log(`   📧 ${lead.name} (${lead.email}) - ${lead.company} - ${lead.source} - 序列: ${lead.sequenceConfig?.recommendedSequence}`);
    });
    
    return newLeads;
  }

  // 创建客户档案
  createLeadProfile(email, websiteAnalysis, campaignGoal) {
    const domain = email.split('@')[1];
    const username = email.split('@')[0];
    
    // AI推理姓名
    const inferredName = this.inferNameFromEmail(username);
    
    // AI推理职位
    const inferredRole = this.inferRoleFromEmail(username, websiteAnalysis.businessType);

    // AI推理公司信息
    const companyName = this.inferCompanyFromDomain(domain, websiteAnalysis.title);

    const lead = {
      id: this.generateLeadId(),
      name: inferredName,
      email: email,
      company: companyName,
      role: inferredRole,
      industry: websiteAnalysis.industry,
      businessType: websiteAnalysis.businessType,
      website: websiteAnalysis.title ? domain : null,
      phone: websiteAnalysis.phones.length > 0 ? websiteAnalysis.phones[0] : null,
      source: 'ai_discovery',
      campaignGoal: campaignGoal,
      priority: this.calculatePriority(email, websiteAnalysis, campaignGoal),
      status: 'ready_to_send',
      notes: this.generateNotes(websiteAnalysis, campaignGoal),
      personalizedInsights: this.generatePersonalizedInsights(websiteAnalysis, campaignGoal),
      createdAt: new Date().toISOString(),
      lastContactedAt: null,
      responseStatus: 'pending'
    };

    return lead;
  }

  // AI推理姓名
  inferNameFromEmail(username) {
    // 常见的用户名模式
    if (username.includes('.')) {
      const parts = username.split('.');
      if (parts.length === 2) {
        return parts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
      }
    }

    // 如果是通用邮箱，生成合理的姓名
    const genericEmails = ['info', 'contact', 'hello', 'support', 'admin', 'sales'];
    if (genericEmails.includes(username.toLowerCase())) {
      return 'Business Contact';
    }

    // 尝试从用户名中提取姓名
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  // AI推理职位
  inferRoleFromEmail(username, businessType) {
    const lowerUsername = username.toLowerCase();
    
    const roleKeywords = {
      'CEO': ['ceo', 'founder', 'president'],
      'CTO': ['cto', 'tech', 'technical'],
      'CMO': ['cmo', 'marketing', 'growth'],
      'Sales Manager': ['sales', 'business'],
      'Project Manager': ['pm', 'project', 'manager'],
      'Developer': ['dev', 'developer', 'engineer'],
      'Designer': ['design', 'creative', 'ui', 'ux']
    };

    for (const [role, keywords] of Object.entries(roleKeywords)) {
      if (keywords.some(keyword => lowerUsername.includes(keyword))) {
        return role;
      }
    }

    // 基于业务类型推理默认职位
    const businessTypeRoles = {
      'saas': 'Product Manager',
      'e-commerce': 'E-commerce Manager',
      'agency': 'Account Manager',
      'startup': 'Founder',
      'enterprise': 'Business Development'
    };

    return businessTypeRoles[businessType] || 'Business Contact';
  }

  // AI推理公司名称
  inferCompanyFromDomain(domain, websiteTitle) {
    if (websiteTitle) {
      // 从网站标题中提取公司名
      const titleWords = websiteTitle.split(/[-|–—]|:|\s+/);
      if (titleWords.length > 0) {
        return titleWords[0].trim();
      }
    }

    // 从域名中提取公司名
    const domainParts = domain.split('.');
    if (domainParts.length > 0) {
      const companyName = domainParts[0];
      return companyName.charAt(0).toUpperCase() + companyName.slice(1);
    }

    return domain;
  }

  // 生成合成潜在客户（当无法从网站提取真实联系信息时）
  generateSyntheticLeads(websiteAnalysis, campaignGoal, count = 3) {
    const syntheticLeads = [];
    
    // 根据网站分析生成合理的潜在客户
    const companyName = this.realAI.extractCompanyFromUrl(websiteAnalysis.url);
    const industry = websiteAnalysis.industry || 'business';
    
    const syntheticContacts = [
      {
        name: 'Business Development',
        email: `bd@${new URL(websiteAnalysis.url).hostname}`,
        role: 'Business Development Manager'
      },
      {
        name: 'Contact Team',
        email: `contact@${new URL(websiteAnalysis.url).hostname}`,
        role: 'Contact'
      },
      {
        name: 'Info Team',
        email: `info@${new URL(websiteAnalysis.url).hostname}`,
        role: 'Information Contact'
      }
    ];
    
    for (let i = 0; i < Math.min(count, syntheticContacts.length); i++) {
      const contact = syntheticContacts[i];
      const lead = {
        id: this.generateLeadId(),
        name: contact.name,
        email: contact.email,
        company: companyName,
        role: contact.role,
        industry: industry,
        businessType: websiteAnalysis.businessType || 'business',
        website: websiteAnalysis.url,
        phone: null,
        source: 'ai_synthetic',
        campaignGoal: campaignGoal,
        priority: 'medium',
        status: 'ready_to_send',
        notes: `基于${websiteAnalysis.url}网站分析生成的潜在联系人`,
        personalizedInsights: {
          painPoints: websiteAnalysis.painPoints || ['运营效率'],
          opportunities: websiteAnalysis.marketingOpportunities || ['业务增长'],
          businessModel: websiteAnalysis.businessModel || 'traditional',
          interests: websiteAnalysis.targetAudience?.psychographics?.interests || ['专业服务']
        },
        createdAt: new Date().toISOString(),
        lastContactedAt: null,
        responseStatus: 'pending'
      };
      
      syntheticLeads.push(lead);
    }
    
    return syntheticLeads;
  }

  // 获取行业档案模板
  getIndustryProfiles(industry) {
    const profiles = {
      'technology': [
        { name: 'Alex Chen', email: 'alex.chen@techcorp.com', company: 'TechCorp Solutions', role: 'CTO', businessType: 'saas', website: 'techcorp.com', phone: '+1-555-0101' },
        { name: 'Sarah Johnson', email: 'sarah@innovatetech.io', company: 'InnovateTech', role: 'Product Manager', businessType: 'saas', website: 'innovatetech.io', phone: '+1-555-0102' },
        { name: 'Michael Zhang', email: 'm.zhang@cloudify.com', company: 'Cloudify Systems', role: 'VP Engineering', businessType: 'saas', website: 'cloudify.com', phone: '+1-555-0103' }
      ],
      'retail': [
        { name: 'Emma Wilson', email: 'emma@fashionbrand.com', company: 'Fashion Brand Co', role: 'E-commerce Director', businessType: 'e-commerce', website: 'fashionbrand.com', phone: '+1-555-0201' },
        { name: 'David Lee', email: 'david.lee@retailpro.com', company: 'RetailPro', role: 'Operations Manager', businessType: 'e-commerce', website: 'retailpro.com', phone: '+1-555-0202' }
      ],
      'healthcare': [
        { name: 'Dr. Lisa Martinez', email: 'l.martinez@healthtech.com', company: 'HealthTech Solutions', role: 'Chief Medical Officer', businessType: 'healthcare', website: 'healthtech.com', phone: '+1-555-0301' },
        { name: 'James Rodriguez', email: 'james@medicalai.com', company: 'Medical AI Corp', role: 'Business Development', businessType: 'healthcare', website: 'medicalai.com', phone: '+1-555-0302' }
      ]
    };

    return profiles[industry] || profiles['technology']; // 默认使用技术行业
  }

  // 计算优先级
  calculatePriority(email, websiteAnalysis, campaignGoal) {
    let score = 0;

    // 基于邮箱类型
    if (this.isValidBusinessEmail(email)) score += 2;
    
    // 基于业务类型
    const highValueBusinessTypes = ['saas', 'enterprise', 'startup'];
    if (highValueBusinessTypes.includes(websiteAnalysis.businessType)) score += 2;

    // 基于行业
    const highValueIndustries = ['technology', 'finance', 'healthcare'];
    if (highValueIndustries.includes(websiteAnalysis.industry)) score += 1;

    // 基于营销目标
    if (campaignGoal === 'product_demo' || campaignGoal === 'sales') score += 1;

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  // 生成客户备注
  generateNotes(websiteAnalysis, campaignGoal) {
    const notes = [];
    
    notes.push(`网站类型: ${websiteAnalysis.businessType}`);
    notes.push(`行业: ${websiteAnalysis.industry}`);
    notes.push(`营销目标: ${campaignGoal}`);
    
    if (websiteAnalysis.headings.length > 0) {
      notes.push(`主要业务: ${websiteAnalysis.headings[0]}`);
    }

    return notes.join(' | ');
  }

  // 生成个性化洞察
  generatePersonalizedInsights(websiteAnalysis, campaignGoal) {
    const insights = {
      businessType: websiteAnalysis.businessType,
      industry: websiteAnalysis.industry,
      mainServices: websiteAnalysis.headings.slice(0, 3),
      painPoints: this.identifyPainPoints(websiteAnalysis),
      opportunities: this.identifyOpportunities(websiteAnalysis, campaignGoal),
      approach: this.suggestApproach(websiteAnalysis, campaignGoal)
    };

    return insights;
  }

  // 识别痛点
  identifyPainPoints(websiteAnalysis) {
    const painPointsMap = {
      'saas': ['客户获取成本', '用户留存率', '产品市场适配'],
      'e-commerce': ['转化率', '购物车放弃', '客户获取'],
      'agency': ['客户满意度', '项目管理', '人才招聘'],
      'startup': ['资金募集', '市场验证', '团队建设']
    };

    return painPointsMap[websiteAnalysis.businessType] || ['运营效率', '成本控制', '市场竞争'];
  }

  // 识别机会
  identifyOpportunities(websiteAnalysis, campaignGoal) {
    const opportunitiesMap = {
      'product_demo': ['展示产品价值', '解决具体需求', '提供试用体验'],
      'sales': ['增加收入', '降低成本', '提高效率'],
      'partnership': ['业务合作', '资源整合', '市场扩展'],
      'general_outreach': ['业务增长', '技术升级', '流程优化']
    };

    return opportunitiesMap[campaignGoal] || ['业务发展', '技术创新', '市场机会'];
  }

  // 建议接触方式
  suggestApproach(websiteAnalysis, campaignGoal) {
    const approaches = {
      'saas': '强调产品的技术优势和ROI',
      'e-commerce': '关注转化率提升和销售增长',
      'agency': '展示案例和专业服务能力',
      'startup': '提供成长阶段的专业支持'
    };

    return approaches[websiteAnalysis.businessType] || '提供个性化的业务解决方案';
  }

  generateLeadId() {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 获取所有潜在客户
  getAllLeads() {
    return this.leads;
  }

  // 获取准备发送的客户
  getReadyToSendLeads() {
    return this.leads.filter(lead => lead.status === 'ready_to_send');
  }

  // 更新客户状态
  updateLeadStatus(leadId, status, notes = '') {
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.status = status;
      if (notes) lead.notes += ` | ${notes}`;
      lead.updatedAt = new Date().toISOString();
      this.saveLeads();
      return true;
    }
    return false;
  }

  // 获取知识库统计
  getKnowledgeBaseStats() {
    return {
      totalWebsites: Object.keys(this.knowledgeBase.websites).length,
      totalContacts: Object.keys(this.knowledgeBase.contacts).length,
      industries: Object.keys(this.knowledgeBase.industries).length,
      lastUpdated: this.knowledgeBase.lastUpdated
    };
  }

  // 加载活跃邮件序列
  loadActiveSequences() {
    try {
      if (fs.existsSync(this.sequencesPath)) {
        return JSON.parse(fs.readFileSync(this.sequencesPath, 'utf8'));
      }
    } catch (error) {
      console.warn('加载邮件序列失败:', error.message);
    }
    return [];
  }

  // 保存活跃邮件序列
  saveActiveSequences() {
    try {
      fs.writeFileSync(this.sequencesPath, JSON.stringify(this.activeSequences, null, 2));
    } catch (error) {
      console.error('保存邮件序列失败:', error.message);
    }
  }

  // 为潜在客户设置邮件序列
  async setupEmailSequenceForLead(lead, websiteAnalysis) {
    console.log(`🔧 为客户 ${lead.email} 设置邮件序列`);
    
    // 选择合适的序列类型
    const sequenceType = lead.sequenceConfig?.recommendedSequence || 'cold_outreach';
    const sequence = this.sequenceManager.sequenceTemplates[sequenceType];
    
    if (!sequence) {
      console.warn(`序列类型 ${sequenceType} 不存在，使用默认序列`);
      return;
    }

    // 创建序列实例
    const sequenceInstance = {
      id: this.generateSequenceId(),
      leadId: lead.id,
      sequenceType: sequenceType,
      currentEmailIndex: 0,
      status: 'active',
      startedAt: new Date().toISOString(),
      nextSendTime: new Date().toISOString(), // 立即发送第一封
      
      // 个性化配置
      personalization: {
        prospectName: lead.name,
        companyName: lead.company,
        industry: lead.industry,
        painPoint: lead.personalizedInsights?.painPoints?.[0] || 'operational efficiency',
        solutionBenefit: this.identifySolutionBenefit(lead.industry),
      },
      
      // 序列进度跟踪
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsReplied: 0,
      
      // 性能指标
      metrics: {
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0
      }
    };

    // 添加到活跃序列
    this.activeSequences.push(sequenceInstance);
    this.saveActiveSequences();

    console.log(`✅ 邮件序列设置完成: ${sequenceType} for ${lead.email}`);
    return sequenceInstance;
  }

  // 生成序列ID
  generateSequenceId() {
    return 'seq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  // 识别解决方案收益
  identifySolutionBenefit(industry) {
    const benefits = {
      'pet-care': 'improve pet health outcomes',
      'technology': 'accelerate development cycles',
      'healthcare': 'enhance patient care quality',
      'finance': 'reduce compliance risks',
      'education': 'improve learning outcomes',
      'retail': 'increase conversion rates'
    };
    return benefits[industry] || 'streamline operations';
  }

  // 处理邮件互动事件
  async handleEmailInteraction(leadId, interactionType, emailIndex, metadata = {}) {
    console.log(`📧 处理邮件互动: ${leadId} - ${interactionType}`);
    
    // 找到对应的序列
    const sequence = this.activeSequences.find(s => s.leadId === leadId);
    if (!sequence) {
      console.warn(`未找到客户 ${leadId} 的邮件序列`);
      return;
    }

    // 更新序列指标
    switch (interactionType) {
      case 'email_sent':
        sequence.emailsSent++;
        break;
      case 'email_opened':
        sequence.emailsOpened++;
        break;
      case 'email_clicked':
        sequence.emailsClicked++;
        break;
      case 'email_replied':
        sequence.emailsReplied++;
        sequence.status = 'paused'; // 暂停序列，等待人工跟进
        break;
      case 'unsubscribe':
        sequence.status = 'stopped';
        break;
    }

    // 使用序列管理器处理互动
    const action = this.sequenceManager.handleInteraction(
      leadId, 
      interactionType, 
      sequence.id, 
      emailIndex
    );

    if (action) {
      await this.executeSequenceAction(sequence, action);
    }

    // 更新指标
    this.updateSequenceMetrics(sequence);
    this.saveActiveSequences();
  }

  // 执行序列动作
  async executeSequenceAction(sequence, action) {
    switch (action.action) {
      case 'pause':
        sequence.status = 'paused';
        console.log(`⏸️ 序列 ${sequence.id} 已暂停: ${action.reason}`);
        break;
        
      case 'stop':
        sequence.status = 'stopped';
        console.log(`⏹️ 序列 ${sequence.id} 已停止: ${action.reason}`);
        break;
        
      case 'immediate_follow_up':
        // 安排立即发送跟进邮件
        sequence.nextSendTime = new Date(Date.now() + action.delay * 24 * 60 * 60 * 1000).toISOString();
        console.log(`⚡ 序列 ${sequence.id} 安排快速跟进`);
        break;
        
      case 'switch_sequence':
        // 切换到新的序列类型
        sequence.sequenceType = action.newSequence;
        sequence.currentEmailIndex = 0;
        console.log(`🔄 序列 ${sequence.id} 切换到 ${action.newSequence}`);
        break;
    }
  }

  // 更新序列指标
  updateSequenceMetrics(sequence) {
    if (sequence.emailsSent > 0) {
      sequence.metrics.deliveryRate = (sequence.emailsSent / sequence.emailsSent * 100).toFixed(2);
      sequence.metrics.openRate = (sequence.emailsOpened / sequence.emailsSent * 100).toFixed(2);
      sequence.metrics.clickRate = (sequence.emailsClicked / sequence.emailsSent * 100).toFixed(2);
      sequence.metrics.replyRate = (sequence.emailsReplied / sequence.emailsSent * 100).toFixed(2);
    }
  }

  // 获取准备发送的邮件
  getEmailsReadyToSend() {
    const now = new Date();
    return this.activeSequences.filter(sequence => {
      return sequence.status === 'active' && 
             new Date(sequence.nextSendTime) <= now &&
             sequence.currentEmailIndex < this.getSequenceLength(sequence.sequenceType);
    });
  }

  // 获取序列长度
  getSequenceLength(sequenceType) {
    const sequence = this.sequenceManager.sequenceTemplates[sequenceType];
    return sequence ? sequence.emails.length : 0;
  }

  // 生成下一封邮件内容
  async generateNextEmailForSequence(sequenceInstance) {
    const lead = this.leads.find(l => l.id === sequenceInstance.leadId);
    if (!lead) {
      console.error(`未找到客户 ${sequenceInstance.leadId}`);
      return null;
    }

    const sequence = this.sequenceManager.sequenceTemplates[sequenceInstance.sequenceType];
    const emailTemplate = sequence.emails[sequenceInstance.currentEmailIndex];
    
    if (!emailTemplate) {
      console.warn(`序列 ${sequenceInstance.sequenceType} 已完成`);
      sequenceInstance.status = 'completed';
      return null;
    }

    // 个性化邮件内容
    const personalizedEmail = this.sequenceManager.personalizeEmail(
      emailTemplate,
      {
        name: sequenceInstance.personalization.prospectName,
        company: sequenceInstance.personalization.companyName,
        industry: sequenceInstance.personalization.industry
      },
      {
        name: 'AI Agent',
        company: 'Petpo',
        demoLink: 'https://demo.petpo.com',
        calendarLink: 'https://calendar.petpo.com'
      }
    );

    return {
      to: lead.email,
      subject: personalizedEmail.subject || emailTemplate.subject,
      content: personalizedEmail.content || emailTemplate.template,
      sequenceId: sequenceInstance.id,
      emailIndex: sequenceInstance.currentEmailIndex,
      template: emailTemplate
    };
  }

  // 标记邮件为已发送
  markEmailAsSent(sequenceId, emailIndex) {
    const sequence = this.activeSequences.find(s => s.id === sequenceId);
    if (sequence) {
      sequence.currentEmailIndex++;
      
      // 计算下一封邮件的发送时间
      const nextSendTime = this.sequenceManager.calculateNextEmailTime(
        this.sequenceManager.sequenceTemplates[sequence.sequenceType],
        emailIndex
      );
      
      if (nextSendTime) {
        sequence.nextSendTime = nextSendTime.toISOString();
      } else {
        sequence.status = 'completed';
      }
      
      this.saveActiveSequences();
    }
  }

  // 获取序列统计
  getSequenceStats() {
    const stats = {
      totalSequences: this.activeSequences.length,
      activeSequences: this.activeSequences.filter(s => s.status === 'active').length,
      pausedSequences: this.activeSequences.filter(s => s.status === 'paused').length,
      completedSequences: this.activeSequences.filter(s => s.status === 'completed').length,
      totalEmailsSent: this.activeSequences.reduce((sum, s) => sum + s.emailsSent, 0),
      totalReplies: this.activeSequences.reduce((sum, s) => sum + s.emailsReplied, 0),
      averageOpenRate: 0,
      averageReplyRate: 0
    };

    // 计算平均指标
    const activeSequences = this.activeSequences.filter(s => s.emailsSent > 0);
    if (activeSequences.length > 0) {
      stats.averageOpenRate = activeSequences.reduce((sum, s) => 
        sum + parseFloat(s.metrics.openRate || 0), 0) / activeSequences.length;
      stats.averageReplyRate = activeSequences.reduce((sum, s) => 
        sum + parseFloat(s.metrics.replyRate || 0), 0) / activeSequences.length;
    }

    return stats;
  }

  // 清理旧数据
  cleanup() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // 清理旧的潜在客户
    this.leads = this.leads.filter(lead => 
      new Date(lead.createdAt) > thirtyDaysAgo
    );
    
    // 清理旧的序列
    this.activeSequences = this.activeSequences.filter(sequence => 
      new Date(sequence.startedAt) > thirtyDaysAgo || sequence.status === 'active'
    );
    
    this.saveLeads();
    this.saveActiveSequences();
    console.log('🧹 AI客户发现系统数据清理完成');
  }
}

module.exports = AILeadDiscoveryAgent;