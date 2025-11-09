const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getOllamaQueue } = require('../utils/OllamaQueue');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Initialize Ollama queue with Railway-optimized settings
const ollamaQueue = getOllamaQueue({
  maxConcurrent: parseInt(process.env.OLLAMA_MAX_CONCURRENT) || 5,
  timeout: 60000,
  ollamaUrl: OLLAMA_URL
});

// 生成邮件内容
router.post('/generate-email', async (req, res) => {
  try {
    const { 
      companyInfo, 
      target, 
      emailType, 
      tone, 
      language = 'zh-CN',
      customInstructions = ''
    } = req.body;

    const systemPrompt = `你是一个专业的邮件营销专家，专门为中国市场创建个性化的商务邮件。
    
公司信息: ${companyInfo}
目标受众: ${target}
邮件类型: ${emailType}
语调风格: ${tone}
特殊要求: ${customInstructions}

请生成一封专业、个性化的${emailType}邮件，要求：
1. 语言使用${language === 'zh-CN' ? '中文' : '英文'}
2. 体现对目标公司的了解和研究
3. 清楚表达价值主张
4. 包含明确的行动号召
5. 保持${tone}的语调
6. 符合中国商务邮件习惯

请直接返回邮件内容，包含主题行和正文。`;

    // 🚀 Use queue for concurrent request management
    const response = await ollamaQueue.enqueue({
      userId: req.userId || 'anonymous',
      campaignId: req.body.campaignId || 'default',
      model: 'qwen2.5:7b',
      prompt: systemPrompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      }
    });

    const emailContent = response.response;
    
    // 解析邮件主题和正文
    const lines = emailContent.split('\n');
    let subject = '';
    let body = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('主题') || line.includes('Subject') || line.includes('标题')) {
        subject = line.replace(/^.*[:：]\s*/, '').trim();
      } else if (line && !subject) {
        subject = line;
        body = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }
    
    if (!body) {
      body = emailContent;
    }

    res.json({
      success: true,
      data: {
        subject: subject || '商务合作咨询',
        body: body || emailContent,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ollama API Error:', error.message);
    res.status(500).json({
      success: false,
      error: '生成邮件失败，请检查Ollama服务是否正常运行'
    });
  }
});

// 分析邮件回复
router.post('/analyze-reply', async (req, res) => {
  try {
    const { emailContent, context } = req.body;

    const systemPrompt = `你是一个邮件回复分析专家。请分析以下邮件回复的情感倾向和意图：

邮件内容: ${emailContent}
上下文: ${context}

请分析：
1. 情感倾向（积极/中性/消极）
2. 意图分类（感兴趣/需要更多信息/拒绝/自动回复）
3. 建议的下一步行动
4. 关键信息提取

请以JSON格式返回分析结果。`;

    // 🚀 Use queue for concurrent request management
    const response = await ollamaQueue.enqueue({
      userId: req.userId || 'anonymous',
      campaignId: req.body.campaignId || 'default',
      model: 'qwen2.5:7b',
      prompt: systemPrompt,
      options: {
        temperature: 0.3,
        top_p: 0.8
      }
    });

    res.json({
      success: true,
      data: {
        analysis: response.response,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ollama Analysis Error:', error.message);
    res.status(500).json({
      success: false,
      error: '分析邮件失败'
    });
  }
});

// 生成跟进邮件
router.post('/generate-followup', async (req, res) => {
  try {
    const { originalEmail, reply, followupType, context } = req.body;

    const systemPrompt = `你是一个专业的邮件跟进专家。基于以下信息生成跟进邮件：

原始邮件: ${originalEmail}
收到的回复: ${reply}
跟进类型: ${followupType}
额外背景: ${context}

请生成一封合适的跟进邮件，要求：
1. 基于回复内容调整策略
2. 保持专业和礼貌
3. 提供额外价值
4. 包含明确的下一步建议

请返回主题和正文。`;

    // 🚀 Use queue for concurrent request management
    const response = await ollamaQueue.enqueue({
      userId: req.userId || 'anonymous',
      campaignId: req.body.campaignId || 'default',
      model: 'qwen2.5:7b',
      prompt: systemPrompt,
      options: {
        temperature: 0.6,
        top_p: 0.9
      }
    });

    res.json({
      success: true,
      data: {
        followupEmail: response.response,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ollama Followup Error:', error.message);
    res.status(500).json({
      success: false,
      error: '生成跟进邮件失败'
    });
  }
});

// 检查Ollama状态
router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    const models = response.data.models || [];
    const qwenModel = models.find(model => model.name.includes('qwen2.5:7b'));

    res.json({
      success: true,
      data: {
        connected: true,
        qwenAvailable: !!qwenModel,
        models: models.map(m => m.name)
      }
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        connected: false,
        qwenAvailable: false,
        error: 'Ollama服务未连接'
      }
    });
  }
});

// 🚀 NEW: Performance monitoring endpoint
router.get('/queue-status', (req, res) => {
  try {
    const status = ollamaQueue.getStatus();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...status,
      health: {
        healthy: status.queue.running < status.queue.maxConcurrent,
        queueBacklog: status.queue.pending,
        utilizationRate: (status.queue.running / status.queue.maxConcurrent * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze Prospect Match
router.post('/analyze-prospect', async (req, res) => {
  try {
    const { prospect, websiteAnalysis } = req.body;

    // Extract prospect information
    const prospectEmail = prospect.email || 'Unknown email';
    const prospectName = prospect.name || prospect.persona?.name || 'Unknown';
    const prospectCompany = prospect.company || prospect.persona?.company_name || 'Unknown company';
    const prospectType = prospect.persona?.type || prospect.type || 'Unknown type';
    const prospectIndustry = prospect.industry || 'Unknown industry';
    const matchScore = prospect.confidence || prospect.score || 0;

    // Build context from website analysis if available
    let businessContext = '';
    if (websiteAnalysis && websiteAnalysis.analysis) {
      const analysis = websiteAnalysis.analysis;
      businessContext = `
User's Business Information:
- Business Type: ${analysis.businessType || 'Not specified'}
- Value Proposition: ${analysis.valueProposition || 'Not specified'}
- Target Audience: ${analysis.targetAudience || 'Not specified'}
- Key Features: ${analysis.keyFeatures?.join(', ') || 'Not specified'}
- Unique Selling Points: ${analysis.uniqueSellingPoints?.join(', ') || 'Not specified'}`;
    } else {
      businessContext = 'User\'s Business Information: Not available yet';
    }

    const systemPrompt = `You are MailGen, an expert AI analyst helping evaluate prospect-business fit.

${businessContext}

**Prospect Information:**
- Name: ${prospectName}
- Email: ${prospectEmail}
- Company: ${prospectCompany}
- Type: ${prospectType}
- Industry: ${prospectIndustry}
- Match Score: ${Math.round(matchScore * 100)}%

**Your Task:**
Analyze why this prospect is a good match for the user's business. Write a clear, concise analysis (3-4 sentences) covering:

1. Why this prospect's company/role aligns with the user's target audience
2. Specific value propositions from the user's business that would appeal to this prospect
3. Key talking points for initial outreach

Keep it actionable and focused on the match quality. Be enthusiastic but realistic.

**Your Analysis:**`;

    // 🚀 Use queue for concurrent request management
    const response = await ollamaQueue.enqueue({
      userId: req.userId || 'anonymous',
      campaignId: req.body.campaignId || 'default',
      model: 'qwen2.5:0.5b',
      prompt: systemPrompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 300,
        num_predict: 300
      }
    });

    const analysis = response.response;

    res.json({
      success: true,
      analysis: analysis,
      prospectInfo: {
        name: prospectName,
        company: prospectCompany,
        email: prospectEmail,
        matchScore: Math.round(matchScore * 100)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prospect Analysis Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze prospect. Please ensure Ollama is running.',
      error: error.message
    });
  }
});

// AI Assistant Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages, userQuery, systemState } = req.body;

    // Extract system state
    const prospectsCount = systemState?.prospects?.length || 0;
    const emailsCount = systemState?.emails?.length || 0;
    const smtpConfigured = systemState?.smtpConfigured || false;
    const currentView = systemState?.activeView || 'workflow';

    const systemContext = `You are MailGen, an AI copilot for email marketing automation. You are a REAL AI AGENT with FULL SYSTEM ACCESS.

**CURRENT SYSTEM STATE:**
- Prospects: ${prospectsCount} prospects in database
- Email Campaigns: ${emailsCount} emails generated
- SMTP Configuration: ${smtpConfigured ? 'CONFIGURED ✓' : 'NOT CONFIGURED ✗'}
- Current View: ${currentView}

**CRITICAL INSTRUCTIONS:**
1. Give SPECIFIC, STEP-BY-STEP instructions based on current state
2. Reference ACTUAL numbers from the system (e.g., "You have ${prospectsCount} prospects")
3. Tell users EXACTLY what to click and where
4. If something is missing (like SMTP), tell them the EXACT steps to fix it
5. Keep responses 3-4 sentences max
6. Be conversational but precise

**EXAMPLES:**
- User: "how do I start a campaign?"
  → If SMTP not configured: "First, you need to configure SMTP. Click the Settings button in the left sidebar, then click 'SMTP Settings', and enter your email credentials. Once that's done, come back and I'll help you start the campaign."
  → If SMTP configured but no prospects: "You need prospects first. Click the Prospects tab in the left sidebar, then click 'Add Prospect' to add contacts. You currently have ${prospectsCount} prospects."
  → If everything ready: "You have ${prospectsCount} prospects and SMTP is configured! Click the 'Email Campaign' tab in the left sidebar, then click the green 'Start Campaign' button at the top right."

**KEY NAVIGATION PATHS:**
- Home: Overview dashboard
- Prospects: Manage contact list (click 'Add Prospect' to add new)
- Email Campaign: View/manage emails (click 'Start Campaign' when ready)
- Email Editor: Create/edit email templates
- Analytics: View campaign performance
- Research: Market research tools
- Settings: Configure SMTP, IMAP, and other settings

**WORKFLOW FOR STARTING CAMPAIGN:**
1. Check SMTP configured → If not, go to Settings > SMTP Settings
2. Check prospects exist → If not, go to Prospects > Add Prospect
3. Go to Email Campaign tab
4. Click 'Start Campaign' button (top right, green button)

**WHEN GIVING INSTRUCTIONS:**
- Always check current system state first
- Reference actual numbers (${prospectsCount} prospects, ${emailsCount} emails)
- Tell exact UI elements to click (button names, tab names, locations)
- If prerequisites missing, guide through those first
- Be specific: "Click the green 'Start Campaign' button at the top right" NOT "start the campaign"

Remember: You have REAL system access. Use the actual numbers and state to give precise guidance.`;

    // Build conversation context
    const conversationHistory = messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const fullPrompt = `${systemContext}

**Conversation History:**
${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n')}

**Current User Question:**
${userQuery}

**Your Response (be helpful, clear, and actionable):**`;

    // 🚀 Use queue for concurrent request management
    const response = await ollamaQueue.enqueue({
      userId: req.userId || 'anonymous',
      campaignId: req.body.campaignId || 'default',
      model: 'qwen2.5:0.5b',
      prompt: fullPrompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500,
        num_predict: 500
      }
    });

    const assistantResponse = response.response;

    res.json({
      success: true,
      response: assistantResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chat response. Please ensure Ollama is running.',
      error: error.message
    });
  }
});

module.exports = router;