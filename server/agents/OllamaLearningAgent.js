const axios = require('axios');
const EnhancedKnowledgeBase = require('../models/EnhancedKnowledgeBase');

class OllamaLearningAgent {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
    this.knowledgeBase = new EnhancedKnowledgeBase();
    this.learningInterval = null;
    this.isLearning = false;
  }

  async initialize() {
    await this.knowledgeBase.connect();
    console.log('🧠 Ollama学习代理初始化完成');
  }

  // 启动持续学习
  async startContinuousLearning() {
    if (this.isLearning) {
      console.log('🧠 学习代理已在运行中');
      return;
    }

    this.isLearning = true;
    console.log('🚀 启动Ollama在线学习系统...');

    // 每30分钟执行一次学习循环
    this.learningInterval = setInterval(async () => {
      try {
        await this.performLearningCycle();
      } catch (error) {
        console.error('❌ 学习循环失败:', error.message);
      }
    }, 1800000); // 30分钟

    // 立即执行一次学习
    await this.performLearningCycle();
  }

  // 停止学习
  stopLearning() {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
    this.isLearning = false;
    console.log('⏹️ Ollama学习系统已停止');
  }

  // 执行学习循环
  async performLearningCycle() {
    console.log('🔄 开始学习循环...');

    try {
      // 1. 分析邮件回复模式
      await this.analyzeEmailPatterns();

      // 2. 学习客户偏好
      await this.learnCustomerPreferences();

      // 3. 优化营销策略
      await this.optimizeMarketingStrategies();

      // 4. 更新知识库
      await this.updateKnowledgeBase();

      console.log('✅ 学习循环完成');
    } catch (error) {
      console.error('❌ 学习循环失败:', error.message);
    }
  }

  // 分析邮件回复模式
  async analyzeEmailPatterns() {
    console.log('📧 分析邮件回复模式...');

    try {
      // 获取最近的邮件数据
      const recentEmails = await this.knowledgeBase.allSQL(`
        SELECT * FROM prospects 
        WHERE last_contact > datetime('now', '-7 days') 
        AND reply_count > 0 
        ORDER BY last_contact DESC 
        LIMIT 50
      `);

      if (recentEmails.length === 0) {
        console.log('📧 暂无最近的邮件回复数据');
        return;
      }

      // 分析回复模式
      const analysisPrompt = `分析以下邮件回复数据，识别成功模式和改进建议：

邮件数据：
${recentEmails.map(email => `
客户: ${email.company_name}
行业: ${email.industry}
回复状态: ${email.reply_status}
回复次数: ${email.reply_count}
最后回复: ${email.last_reply}
转化概率: ${email.conversion_probability}
`).join('\n')}

请提供：
1. 成功的邮件模式
2. 客户偏好分析
3. 改进建议
4. 优化建议

用JSON格式返回分析结果。`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.model,
        prompt: analysisPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 1000
        }
      });

      const analysis = this.parseJsonResponse(response.data.response);
      
      if (analysis) {
        // 保存分析结果到知识库
        await this.knowledgeBase.addLearning('email_pattern_analysis', analysis);
        console.log('📊 邮件模式分析完成并保存');
      }

    } catch (error) {
      console.error('❌ 邮件模式分析失败:', error.message);
    }
  }

  // 学习客户偏好
  async learnCustomerPreferences() {
    console.log('👥 学习客户偏好...');

    try {
      // 获取不同行业的转化数据
      const industryData = await this.knowledgeBase.allSQL(`
        SELECT 
          industry,
          AVG(conversion_probability) as avg_conversion,
          COUNT(*) as total_prospects,
          SUM(CASE WHEN reply_count > 0 THEN 1 ELSE 0 END) as replied_count,
          AVG(reply_count) as avg_replies
        FROM prospects 
        WHERE industry IS NOT NULL
        GROUP BY industry
        HAVING total_prospects >= 3
        ORDER BY avg_conversion DESC
      `);

      if (industryData.length === 0) {
        console.log('👥 暂无足够的行业数据');
        return;
      }

      const learningPrompt = `基于以下行业数据，学习和总结客户偏好模式：

行业数据：
${industryData.map(data => `
行业: ${data.industry}
平均转化率: ${data.avg_conversion}%
总客户数: ${data.total_prospects}
回复客户数: ${data.replied_count}
平均回复次数: ${data.avg_replies}
`).join('\n')}

请提供：
1. 高转化率行业特征
2. 各行业沟通偏好
3. 个性化策略建议
4. 邮件内容优化建议

用JSON格式返回学习结果。`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.model,
        prompt: learningPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 1000
        }
      });

      const preferences = this.parseJsonResponse(response.data.response);
      
      if (preferences) {
        await this.knowledgeBase.addLearning('customer_preferences', preferences);
        console.log('💡 客户偏好学习完成并保存');
      }

    } catch (error) {
      console.error('❌ 客户偏好学习失败:', error.message);
    }
  }

  // 优化营销策略
  async optimizeMarketingStrategies() {
    console.log('🎯 优化营销策略...');

    try {
      // 获取历史学习数据
      const learningHistory = await this.knowledgeBase.allSQL(`
        SELECT type, data, created_at 
        FROM learning_data 
        WHERE created_at > datetime('now', '-30 days')
        ORDER BY created_at DESC
      `);

      if (learningHistory.length === 0) {
        console.log('🎯 暂无历史学习数据');
        return;
      }

      const optimizationPrompt = `基于历史学习数据，优化营销策略：

学习历史：
${learningHistory.map(item => `
类型: ${item.type}
数据: ${typeof item.data === 'string' ? item.data : JSON.stringify(item.data)}
时间: ${item.created_at}
`).join('\n')}

请提供优化建议：
1. 邮件内容优化
2. 发送时间优化
3. 目标客户筛选优化
4. 跟进策略优化

用JSON格式返回优化策略。`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.model,
        prompt: optimizationPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 1000
        }
      });

      const optimization = this.parseJsonResponse(response.data.response);
      
      if (optimization) {
        await this.knowledgeBase.addLearning('strategy_optimization', optimization);
        console.log('🚀 营销策略优化完成并保存');
      }

    } catch (error) {
      console.error('❌ 营销策略优化失败:', error.message);
    }
  }

  // 更新知识库
  async updateKnowledgeBase() {
    console.log('💾 更新知识库...');

    try {
      // 获取最新学习成果
      const latestLearning = await this.knowledgeBase.allSQL(`
        SELECT * FROM learning_data 
        WHERE created_at > datetime('now', '-1 hour')
        ORDER BY created_at DESC
      `);

      if (latestLearning.length > 0) {
        console.log(`💾 本次学习新增 ${latestLearning.length} 条知识`);
        
        // 可以在这里添加知识整合逻辑
        // 例如：合并相似的学习结果，删除过时的数据等
        
        // 清理30天前的学习数据
        await this.knowledgeBase.execSQL(`
          DELETE FROM learning_data 
          WHERE created_at < datetime('now', '-30 days')
        `);
        
        console.log('🧹 清理了30天前的过时学习数据');
      }

    } catch (error) {
      console.error('❌ 知识库更新失败:', error.message);
    }
  }

  // 解析JSON响应
  parseJsonResponse(text) {
    try {
      // 尝试直接解析
      return JSON.parse(text);
    } catch (error) {
      try {
        // 尝试提取JSON部分
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('⚠️ JSON解析失败，保存原始文本');
        return { raw_response: text };
      }
    }
    return null;
  }

  // 获取学习状态
  getLearningStatus() {
    return {
      isLearning: this.isLearning,
      lastCycle: this.lastCycleTime,
      nextCycle: this.isLearning ? new Date(Date.now() + 1800000) : null
    };
  }

  // 手动触发学习
  async triggerLearning() {
    if (this.isLearning) {
      await this.performLearningCycle();
      return { success: true, message: '手动学习循环已触发' };
    } else {
      return { success: false, message: '学习系统未启动' };
    }
  }
}

module.exports = OllamaLearningAgent;