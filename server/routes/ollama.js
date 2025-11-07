const express = require('express');
const axios = require('axios');
const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

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

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'qwen2.5:7b',
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      }
    });

    const emailContent = response.data.response;
    
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

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'qwen2.5:7b',
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.8
      }
    });

    res.json({
      success: true,
      data: {
        analysis: response.data.response,
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

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'qwen2.5:7b',
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.6,
        top_p: 0.9
      }
    });

    res.json({
      success: true,
      data: {
        followupEmail: response.data.response,
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

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'qwen2.5:0.5b',
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500,
        num_predict: 500
      }
    });

    const assistantResponse = response.data.response;

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