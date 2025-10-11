/**
 * Self-Healing LangGraph Agent
 * 真正的Agent - 具备自我诊断、自我修复和自我优化能力
 * 使用Ollama分析错误并动态调整工作流程
 */

const axios = require('axios');

class SelfHealingLangGraphAgent {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.models = {
      fast: 'qwen2.5:0.5b',     // 快速决策和分析
      general: 'llama3.2',      // 深度思考和修复
      diagnostic: 'qwen2.5:0.5b' // 错误诊断
    };
    
    // 工作流程状态跟踪
    this.workflowState = {
      currentStep: null,
      errors: [],
      retryCount: {},
      adaptations: [],
      learnings: []
    };
    
    // 自愈能力配置
    this.healingCapabilities = {
      maxRetries: 3,
      adaptationThreshold: 2, // 2次失败后开始适应
      learningEnabled: true,
      diagnosticDepth: 'deep' // shallow, medium, deep
    };
    
    console.log('🧠 Self-Healing LangGraph Agent initialized');
    console.log('   🔧 Auto-diagnostic: Enabled');
    console.log('   🔄 Auto-retry: Enabled');
    console.log('   📚 Auto-learning: Enabled');
    console.log('   ⚡ Dynamic adaptation: Enabled');
  }

  /**
   * 主要的自愈工作流执行器
   */
  async executeWithSelfHealing(workflowFunction, context, stepName) {
    console.log(`🧠 [${stepName}] 开始自愈执行...`);
    
    let result = null;
    let lastError = null;
    const maxRetries = this.healingCapabilities.maxRetries;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`   🔄 [${stepName}] 尝试 ${attempt}/${maxRetries}`);
        
        // 如果不是第一次尝试，先进行诊断和修复
        if (attempt > 1) {
          const healedContext = await this.diagnoseAndHeal(lastError, context, stepName, attempt);
          context = { ...context, ...healedContext };
        }
        
        // 执行工作流程
        result = await workflowFunction(context);
        
        // 验证结果
        const validation = await this.validateResult(result, stepName);
        if (validation.isValid) {
          console.log(`✅ [${stepName}] 执行成功 (尝试 ${attempt})`);
          
          // 记录成功的学习
          if (attempt > 1) {
            await this.recordSuccessfulHealing(stepName, attempt, context);
          }
          
          return result;
        } else {
          throw new Error(`结果验证失败: ${validation.reason}`);
        }
        
      } catch (error) {
        lastError = error;
        console.error(`❌ [${stepName}] 尝试 ${attempt} 失败:`, error.message);
        
        // 记录错误
        this.recordError(stepName, error, attempt);
        
        // 如果是最后一次尝试，进行深度诊断
        if (attempt === maxRetries) {
          await this.performDeepDiagnosis(stepName, lastError, context);
          throw new Error(`[${stepName}] 自愈失败，已达到最大重试次数 (${maxRetries}): ${lastError.message}`);
        }
        
        // 等待一段时间再重试
        await this.calculateBackoffDelay(attempt);
      }
    }
  }

  /**
   * 诊断和治愈错误
   */
  async diagnoseAndHeal(error, context, stepName, attempt) {
    console.log(`🔍 [${stepName}] 开始诊断和治愈 (尝试 ${attempt})...`);
    
    try {
      // 第一步：错误诊断
      const diagnosis = await this.diagnoseError(error, context, stepName);
      console.log(`   📊 诊断结果: ${diagnosis.category} - ${diagnosis.severity}`);
      console.log(`   💡 可能原因: ${diagnosis.rootCause}`);
      
      // 第二步：生成治愈策略
      const healingStrategy = await this.generateHealingStrategy(diagnosis, context, stepName);
      console.log(`   🔧 治愈策略: ${healingStrategy.approach}`);
      
      // 第三步：应用治愈措施
      const healedContext = await this.applyHealing(healingStrategy, context, stepName);
      console.log(`   ✨ 应用了 ${healingStrategy.modifications.length} 个修复措施`);
      
      return healedContext;
      
    } catch (healingError) {
      console.error(`❌ [${stepName}] 治愈过程失败:`, healingError.message);
      return context; // 返回原始context，让重试继续
    }
  }

  /**
   * 智能预分析错误 - 快速识别常见网络和API错误
   */
  preAnalyzeError(error) {
    const errorMessage = error.message.toLowerCase();
    const errorCode = error.code;
    const errorStatus = error.status || error.statusCode;

    // SSL/TLS 错误
    if (errorMessage.includes('certificate') || errorMessage.includes('handshake') || 
        errorMessage.includes('verify') || errorMessage.includes('ssl')) {
      return {
        category: 'network',
        subcategory: 'ssl_tls_error',
        severity: 'medium',
        rootCause: 'SSL证书验证失败或TLS握手问题',
        isAutoFixable: true,
        retryRecommended: false,
        fixSuggestions: [
          '忽略SSL验证 (开发环境)',
          '更新CA证书包',
          '使用不同的TLS版本',
          '检查系统时间是否准确'
        ]
      };
    }

    // 连接错误
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ECONNRESET') {
      return {
        category: 'network',
        subcategory: 'connection_error',
        severity: 'high',
        rootCause: '目标服务器拒绝连接或连接被重置',
        isAutoFixable: true,
        retryRecommended: true,
        fixSuggestions: [
          '检查目标URL是否正确',
          '尝试不同的端口',
          '增加连接超时时间',
          '使用代理服务器'
        ]
      };
    }

    // 超时错误
    if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
      return {
        category: 'network',
        subcategory: 'timeout_error',
        severity: 'medium',
        rootCause: '请求超时，网络延迟过高或服务器响应慢',
        isAutoFixable: true,
        retryRecommended: true,
        fixSuggestions: [
          '增加请求超时时间',
          '实施指数退避重试',
          '使用更快的DNS服务器',
          '优化请求并发数'
        ]
      };
    }

    // DNS错误
    if (errorCode === 'ENOTFOUND' || errorCode === 'ESERVFAIL') {
      return {
        category: 'network',
        subcategory: 'dns_error',
        severity: 'high',
        rootCause: 'DNS解析失败，域名不存在或DNS服务器问题',
        isAutoFixable: true,
        retryRecommended: true,
        fixSuggestions: [
          '验证域名拼写',
          '尝试不同的DNS服务器',
          '清除DNS缓存',
          '使用IP地址直接访问'
        ]
      };
    }

    // HTTP状态码错误
    if (errorStatus) {
      const statusSeverity = errorStatus >= 500 ? 'high' : errorStatus >= 400 ? 'medium' : 'low';
      const isRetryable = errorStatus >= 500 || errorStatus === 429 || errorStatus === 408;
      
      return {
        category: 'api',
        subcategory: `http_${errorStatus}`,
        severity: statusSeverity,
        rootCause: this.getHttpStatusReason(errorStatus),
        isAutoFixable: isRetryable,
        retryRecommended: isRetryable,
        fixSuggestions: this.getHttpStatusSuggestions(errorStatus)
      };
    }

    // 默认分析
    return {
      category: 'unknown',
      subcategory: 'general_error',
      severity: 'medium',
      rootCause: error.message,
      isAutoFixable: false,
      retryRecommended: true,
      fixSuggestions: ['检查错误详情', '验证输入参数', '查看日志文件']
    };
  }

  /**
   * 获取HTTP状态码原因
   */
  getHttpStatusReason(status) {
    const reasons = {
      400: '请求格式错误或参数无效',
      401: '身份验证失败或凭证过期',
      403: '权限不足或访问被禁止',
      404: '资源不存在或URL错误',
      408: '请求超时',
      429: '请求频率过高，触发限流',
      500: '服务器内部错误',
      502: '网关错误或上游服务不可用',
      503: '服务暂时不可用',
      504: '网关超时'
    };
    return reasons[status] || `HTTP ${status} 错误`;
  }

  /**
   * 获取HTTP状态码修复建议
   */
  getHttpStatusSuggestions(status) {
    const suggestions = {
      400: ['验证请求参数', '检查请求格式', '查看API文档'],
      401: ['更新认证token', '检查API密钥', '重新登录'],
      403: ['检查用户权限', '验证访问策略', '联系管理员'],
      404: ['验证URL路径', '检查资源是否存在', '尝试替代URL'],
      408: ['增加请求超时时间', '检查网络连接'],
      429: ['实施退避重试', '降低请求频率', '使用请求缓存'],
      500: ['稍后重试', '联系服务提供商', '检查服务状态'],
      502: ['检查上游服务', '尝试其他入口点'],
      503: ['等待服务恢复', '检查维护公告'],
      504: ['增加超时时间', '检查网络连接']
    };
    return suggestions[status] || ['重试请求', '联系技术支持'];
  }

  /**
   * 使用Ollama诊断错误 - 增强网络错误识别
   */
  async diagnoseError(error, context, stepName) {
    // 首先进行智能预分析
    const preAnalysis = this.preAnalyzeError(error);
    
    const diagnosticPrompt = `你是一个AI工作流程诊断专家，特别擅长网络错误和API错误分析。

步骤名称: ${stepName}
错误信息: ${error.message}
错误类型: ${error.constructor.name}
错误代码: ${error.code || '无'}
状态码: ${error.status || error.statusCode || '无'}
预分析结果: ${JSON.stringify(preAnalysis)}

上下文信息:
${JSON.stringify(context, null, 2).substring(0, 1000)}

请基于预分析结果和错误信息提供精确诊断：

网络错误类型判断:
- SSL/TLS错误: certificate, handshake, verify
- 连接错误: ECONNREFUSED, ECONNRESET, ETIMEDOUT
- DNS错误: ENOTFOUND, ESERVFAIL
- HTTP错误: 404, 403, 429, 500
- 超时错误: timeout, ESOCKETTIMEDOUT

返回JSON格式:
{
  "category": "${preAnalysis.category}",
  "subcategory": "具体子类别",
  "severity": "严重程度(low/medium/high/critical)",
  "rootCause": "根本原因分析",
  "isAutoFixable": ${preAnalysis.isAutoFixable},
  "retryRecommended": true/false,
  "fixSuggestions": ["具体修复建议1", "具体修复建议2"],
  "preventionMeasures": ["预防措施1", "预防措施2"]
}`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.diagnostic,
        prompt: diagnosticPrompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 400 }
      });

      const diagnosis = this.parseOllamaResponse(response.data.response);
      
      return {
        category: diagnosis.category || preAnalysis.category,
        subcategory: diagnosis.subcategory || preAnalysis.subcategory,
        severity: diagnosis.severity || preAnalysis.severity,
        rootCause: diagnosis.rootCause || preAnalysis.rootCause,
        isAutoFixable: diagnosis.isAutoFixable !== undefined ? diagnosis.isAutoFixable : preAnalysis.isAutoFixable,
        retryRecommended: diagnosis.retryRecommended !== undefined ? diagnosis.retryRecommended : preAnalysis.retryRecommended,
        fixSuggestions: diagnosis.fixSuggestions || preAnalysis.fixSuggestions,
        preventionMeasures: diagnosis.preventionMeasures || []
      };
      
    } catch (diagnosisError) {
      console.error('诊断过程失败:', diagnosisError.message);
      return {
        category: 'unknown',
        severity: 'medium',
        rootCause: error.message,
        isAutoFixable: false,
        fixSuggestions: []
      };
    }
  }

  /**
   * 生成治愈策略
   */
  async generateHealingStrategy(diagnosis, context, stepName) {
    const strategyPrompt = `基于错误诊断，生成具体的治愈策略：

诊断信息:
- 类别: ${diagnosis.category}
- 严重程度: ${diagnosis.severity}
- 根本原因: ${diagnosis.rootCause}
- 修复建议: ${diagnosis.fixSuggestions.join(', ')}

步骤: ${stepName}
当前上下文: ${JSON.stringify(context, null, 2).substring(0, 800)}

请生成具体的修复策略：
1. 修复方法
2. 需要修改的参数
3. 需要添加的配置
4. 替代方案

返回JSON格式:
{
  "approach": "修复方法描述",
  "modifications": [
    {"type": "参数修改", "key": "参数名", "oldValue": "旧值", "newValue": "新值", "reason": "修改原因"},
    {"type": "配置添加", "key": "配置名", "value": "配置值", "reason": "添加原因"}
  ],
  "alternatives": ["备选方案1", "备选方案2"],
  "confidence": 0.8
}`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.general,
        prompt: strategyPrompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 500 }
      });

      const strategy = this.parseOllamaResponse(response.data.response);
      
      return {
        approach: strategy.approach || 'Generic retry with modified parameters',
        modifications: strategy.modifications || [],
        alternatives: strategy.alternatives || [],
        confidence: strategy.confidence || 0.5,
        errorType: diagnosis.subcategory || diagnosis.category
      };
      
    } catch (strategyError) {
      console.error('策略生成失败:', strategyError.message);
      return {
        approach: 'Fallback strategy with increased timeout',
        modifications: [
          { type: 'timeout', key: 'timeout', newValue: 30000, reason: 'Increase timeout for stability' }
        ],
        alternatives: [],
        confidence: 0.3,
        errorType: diagnosis.subcategory || diagnosis.category
      };
    }
  }

  /**
   * 应用治愈措施 - 增强网络错误处理
   */
  async applyHealing(healingStrategy, context, stepName) {
    console.log(`   🛠️ [${stepName}] 应用治愈策略: ${healingStrategy.approach}`);
    
    let healedContext = { ...context };
    
    // 应用每个修改
    for (const modification of healingStrategy.modifications) {
      console.log(`     🔧 ${modification.type}: ${modification.key} → ${modification.newValue}`);
      console.log(`        理由: ${modification.reason}`);
      
      switch (modification.type) {
        case '参数修改':
        case 'parameter':
          healedContext[modification.key] = modification.newValue;
          break;
          
        case '配置添加':
        case 'config':
          if (!healedContext.config) healedContext.config = {};
          healedContext.config[modification.key] = modification.value || modification.newValue;
          break;
          
        case 'timeout':
          healedContext.timeout = modification.newValue;
          break;
          
        case 'retry_strategy':
          healedContext.retryStrategy = modification.newValue;
          break;
          
        case 'alternative_method':
          healedContext.method = modification.newValue;
          break;

        // 新增网络错误专用治愈措施
        case 'ssl_ignore':
          if (!healedContext.requestConfig) healedContext.requestConfig = {};
          healedContext.requestConfig.rejectUnauthorized = false;
          healedContext.requestConfig.strictSSL = false;
          break;

        case 'user_agent':
          if (!healedContext.requestConfig) healedContext.requestConfig = {};
          healedContext.requestConfig.headers = {
            ...healedContext.requestConfig.headers,
            'User-Agent': modification.newValue
          };
          break;

        case 'proxy_config':
          if (!healedContext.requestConfig) healedContext.requestConfig = {};
          healedContext.requestConfig.proxy = modification.newValue;
          break;

        case 'dns_config':
          if (!healedContext.requestConfig) healedContext.requestConfig = {};
          healedContext.requestConfig.family = modification.newValue; // 4 for IPv4, 6 for IPv6
          break;

        case 'connection_limit':
          if (!healedContext.requestConfig) healedContext.requestConfig = {};
          healedContext.requestConfig.pool = { maxSockets: modification.newValue };
          break;

        case 'alternative_url':
          healedContext.targetWebsite = modification.newValue;
          healedContext.website = modification.newValue;
          break;

        case 'request_headers':
          if (!healedContext.requestConfig) healedContext.requestConfig = {};
          if (!healedContext.requestConfig.headers) healedContext.requestConfig.headers = {};
          Object.assign(healedContext.requestConfig.headers, modification.newValue);
          break;
          
        default:
          console.log(`     ⚠️ 未知修改类型: ${modification.type}`);
      }
    }

    // 特殊处理：基于错误类型应用预定义配置
    if (healingStrategy.errorType) {
      healedContext = this.applyErrorTypeSpecificHealing(healedContext, healingStrategy.errorType, stepName);
    }
    
    // 记录应用的治愈措施
    this.workflowState.adaptations.push({
      step: stepName,
      strategy: healingStrategy,
      timestamp: new Date().toISOString()
    });

    // 标记这是一个经过治愈的上下文
    healedContext.healing_applied = true;
    healedContext.healing_timestamp = new Date().toISOString();
    healedContext.original_error_type = healingStrategy.errorType;
    
    return healedContext;
  }

  /**
   * 基于错误类型应用专门的治愈配置
   */
  applyErrorTypeSpecificHealing(context, errorType, stepName) {
    console.log(`     🎯 应用 ${errorType} 专门治愈配置`);

    if (!context.requestConfig) context.requestConfig = {};

    switch (errorType) {
      case 'ssl_tls_error':
        // SSL错误：忽略证书验证，增加超时
        context.requestConfig.rejectUnauthorized = false;
        context.requestConfig.strictSSL = false;
        context.timeout = Math.max(context.timeout || 10000, 15000);
        console.log(`       🔒 SSL验证已禁用，超时增加到 ${context.timeout}ms`);
        break;

      case 'connection_error':
        // 连接错误：增加重试，修改User-Agent
        context.timeout = Math.max(context.timeout || 10000, 20000);
        context.requestConfig.headers = {
          ...context.requestConfig.headers,
          'User-Agent': 'Mozilla/5.0 (compatible; EmailBot/2.0; +https://example.com/bot)'
        };
        console.log(`       🔌 连接超时增加到 ${context.timeout}ms，User-Agent已更新`);
        break;

      case 'timeout_error':
        // 超时错误：大幅增加超时，减少并发
        context.timeout = Math.max(context.timeout || 10000, 30000);
        context.requestConfig.pool = { maxSockets: 1 }; // 限制并发连接
        console.log(`       ⏰ 超时增加到 ${context.timeout}ms，并发连接限制为1`);
        break;

      case 'dns_error':
        // DNS错误：强制使用IPv4，添加重试延迟
        context.requestConfig.family = 4; // 强制IPv4
        context.retryDelay = 5000; // 5秒延迟重试
        console.log(`       🌐 强制使用IPv4，重试延迟 ${context.retryDelay}ms`);
        break;

      case 'http_404':
        // 404错误：尝试移除URL的特定部分或使用根域名
        if (context.targetWebsite) {
          const url = new URL(context.targetWebsite);
          context.alternative_urls = [
            `${url.protocol}//${url.hostname}`,
            `${url.protocol}//${url.hostname}/about`,
            `${url.protocol}//${url.hostname}/contact`
          ];
          console.log(`       🔍 生成备用URL: ${context.alternative_urls.slice(0, 2).join(', ')}`);
        }
        break;

      case 'http_429':
        // 限流错误：大幅增加重试延迟
        context.retryDelay = 60000; // 60秒延迟
        context.requestConfig.headers = {
          ...context.requestConfig.headers,
          'X-RateLimit-Retry': 'true'
        };
        console.log(`       ⏱️ 限流检测，重试延迟增加到 ${context.retryDelay}ms`);
        break;

      default:
        console.log(`       ⚠️ 未知错误类型: ${errorType}`);
    }

    return context;
  }

  /**
   * 验证结果
   */
  async validateResult(result, stepName) {
    // 基本验证
    if (!result) {
      return { isValid: false, reason: '结果为空' };
    }
    
    // 根据步骤类型进行特定验证
    switch (stepName) {
      case 'website_analysis':
        return this.validateWebsiteAnalysis(result);
      case 'email_search':
        return this.validateEmailSearch(result);
      case 'email_generation':
        return this.validateEmailGeneration(result);
      default:
        return { isValid: true, reason: 'Generic validation passed' };
    }
  }

  /**
   * 网站分析结果验证
   */
  validateWebsiteAnalysis(result) {
    if (!result.companyName || result.companyName.length < 2) {
      return { isValid: false, reason: '公司名称无效或太短' };
    }
    
    if (!result.industry || result.industry === 'unknown') {
      return { isValid: false, reason: '行业信息缺失' };
    }
    
    if (!result.valueProposition || result.valueProposition.length < 10) {
      return { isValid: false, reason: '价值主张信息不足' };
    }
    
    return { isValid: true, reason: '网站分析结果有效' };
  }

  /**
   * 邮件搜索结果验证
   */
  validateEmailSearch(result) {
    if (!result.emails || !Array.isArray(result.emails)) {
      return { isValid: false, reason: '邮件结果格式无效' };
    }
    
    if (result.emails.length === 0) {
      return { isValid: false, reason: '未找到任何邮件地址' };
    }
    
    // 验证邮件格式
    const validEmails = result.emails.filter(email => 
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.email || email)
    );
    
    if (validEmails.length === 0) {
      return { isValid: false, reason: '所有邮件地址格式无效' };
    }
    
    return { isValid: true, reason: `找到 ${validEmails.length} 个有效邮件地址` };
  }

  /**
   * 邮件生成结果验证
   */
  validateEmailGeneration(result) {
    if (!result.emails || !Array.isArray(result.emails)) {
      return { isValid: false, reason: '邮件生成结果格式无效' };
    }
    
    for (const email of result.emails) {
      if (!email.email_content || !email.email_content.subject || !email.email_content.body) {
        return { isValid: false, reason: '邮件内容不完整' };
      }
      
      if (email.email_content.subject.length < 5) {
        return { isValid: false, reason: '邮件主题太短' };
      }
      
      if (email.email_content.body.length < 50) {
        return { isValid: false, reason: '邮件正文太短' };
      }
    }
    
    return { isValid: true, reason: `成功生成 ${result.emails.length} 封邮件` };
  }

  /**
   * 记录错误
   */
  recordError(stepName, error, attempt) {
    this.workflowState.errors.push({
      step: stepName,
      error: error.message,
      attempt: attempt,
      timestamp: new Date().toISOString()
    });
    
    // 更新重试计数
    if (!this.workflowState.retryCount[stepName]) {
      this.workflowState.retryCount[stepName] = 0;
    }
    this.workflowState.retryCount[stepName]++;
  }

  /**
   * 记录成功的治愈
   */
  async recordSuccessfulHealing(stepName, attempt, healedContext) {
    const learning = {
      step: stepName,
      attempts: attempt,
      healedContext: healedContext,
      success: true,
      timestamp: new Date().toISOString()
    };
    
    this.workflowState.learnings.push(learning);
    
    console.log(`📚 [${stepName}] 记录成功治愈经验 (${attempt} 次尝试)`);
  }

  /**
   * 深度诊断
   */
  async performDeepDiagnosis(stepName, error, context) {
    console.log(`🔬 [${stepName}] 进行深度诊断...`);
    
    const deepAnalysisPrompt = `进行深度错误分析和系统诊断：

失败步骤: ${stepName}
最终错误: ${error.message}
错误堆栈: ${error.stack || '无'}

历史错误:
${this.workflowState.errors.map(e => `${e.step}: ${e.error}`).join('\n')}

已尝试的治愈措施:
${this.workflowState.adaptations.map(a => `${a.step}: ${a.strategy.approach}`).join('\n')}

上下文信息:
${JSON.stringify(context, null, 2)}

请提供：
1. 根本原因分析
2. 系统性问题识别
3. 长期解决方案建议
4. 预防措施
5. 工作流程优化建议

格式化返回深度分析报告。`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.general,
        prompt: deepAnalysisPrompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 800 }
      });

      const deepAnalysis = response.data.response;
      console.log(`📋 深度诊断报告:\n${deepAnalysis}`);
      
      // 保存深度分析结果
      this.workflowState.deepDiagnosis = {
        step: stepName,
        analysis: deepAnalysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (analysisError) {
      console.error('深度诊断失败:', analysisError.message);
    }
  }

  /**
   * 计算退避延迟
   */
  async calculateBackoffDelay(attempt) {
    const baseDelay = 1000; // 1秒
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // 添加随机抖动
    
    const totalDelay = Math.min(exponentialDelay + jitter, 10000); // 最大10秒
    
    console.log(`⏱️ 等待 ${Math.round(totalDelay)}ms 后重试...`);
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  /**
   * 解析Ollama响应
   */
  parseOllamaResponse(response) {
    try {
      // 尝试找到JSON部分
      const jsonMatch = response.match(/{[^{}]*(?:{[^{}]*}[^{}]*)*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果没有找到JSON，尝试解析为简单对象
      return { content: response };
      
    } catch (error) {
      console.warn('Ollama响应解析失败，使用默认响应:', error.message);
      return { content: response };
    }
  }

  /**
   * 获取治愈统计
   */
  getHealingStats() {
    return {
      totalErrors: this.workflowState.errors.length,
      totalAdaptations: this.workflowState.adaptations.length,
      totalLearnings: this.workflowState.learnings.length,
      retryStats: this.workflowState.retryCount,
      hasDeepDiagnosis: !!this.workflowState.deepDiagnosis
    };
  }
}

module.exports = SelfHealingLangGraphAgent;