const axios = require('axios');

class MarketingStrategyAgent {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
  }

  async generateMarketingStrategy(targetWebsite, campaignGoal, businessAnalysis, businessType = 'auto') {
    console.log('🔥 使用OLLAMA生成真正的营销策略 - 绝不使用模板！');
    
    let targetAudienceType = businessType === 'auto' ? 'tob' : businessType;
    console.log(`🎯 Target audience type: ${targetAudienceType} (input: ${businessType})`);
    
    // 严格验证必要的业务分析数据
    if (!businessAnalysis || !businessAnalysis.companyName) {
      throw new Error('❌ 缺少必要的业务分析数据，无法生成营销策略');
    }
    
    // 只使用Ollama生成策略 - 没有模板回退！
    const result = await this.generateOllamaStrategy(targetWebsite, campaignGoal, businessAnalysis, targetAudienceType);
    console.log('✅ 营销策略生成成功 - 纯粹Ollama生成！');
    return result;
  }

  async generateOllamaStrategy(targetWebsite, campaignGoal, businessAnalysis, targetAudienceType) {
    console.log('🔥 强制使用OLLAMA生成营销策略 - 绝不放弃！');
    
    // 检查Ollama可用性，但不放弃
    try {
      const healthCheck = await axios.get(`${this.ollamaUrl}/tags`, {
        timeout: 0, // 无超时限制
        headers: {
          'Connection': 'keep-alive'
        }
      });
      
      if (healthCheck.status !== 200) {
        throw new Error('Ollama服务不可用，请启动Ollama');
      }
      console.log('✅ Ollama服务正常运行');
    } catch (error) {
      console.error(`❌ Ollama服务检查失败: ${error.message}`);
      throw new Error(`Ollama不可用: ${error.message}. 请确保Ollama服务正常运行。`);
    }

    const prompt = `As a marketing strategy expert, generate a precise target audience strategy for the following company:

Company: ${businessAnalysis.companyName || 'Unknown'}
Website: ${targetWebsite}
Description: ${businessAnalysis.valueProposition || businessAnalysis.description || 'Business solution'}
Campaign Goal: ${campaignGoal}
Audience Type: ${targetAudienceType === 'tob' ? 'B2B Business Clients' : 'B2C Consumers'}

Return ONLY a JSON strategy in this format:
{
  "company_name": "company name",
  "domain": "domain",
  "website": "website url",
  "description": "company description",
  "target_audience": {
    "type": "${targetAudienceType}",
    "primary_segments": ["segment1", "segment2", "segment3"],
    "search_keywords": {
      "primary_keywords": ["keyword1", "keyword2"],
      "industry_keywords": ["industry1", "industry2"],
      "solution_keywords": ["solution1", "solution2"],
      "technology_keywords": ["tech1", "tech2"],
      "audience_keywords": ["audience1", "audience2"]
    },
    "pain_points": ["pain_point1", "pain_point2", "pain_point3"]
  }
}`;

    try {
      // 使用超快速模型参数 - 无超时限制！
      console.log('⚡ 使用超快速模型生成营销策略 (qwen2.5:0.5b)...');
      
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5:0.5b', // 强制使用最快模型
        prompt: prompt,
        stream: false,
        options: { 
          temperature: 0.3, // Balanced for quality JSON
          num_predict: 500, // Sufficient for complete JSON response
          num_ctx: 1024, // Adequate context for full strategy
          top_k: 10, // More variety to avoid truncation
          top_p: 0.5, // Better quality outputs
          repeat_penalty: 1.1,
          num_thread: 16, // 最大线程数
          num_gpu: 1
        }
      }, {
        timeout: 0, // 完全无超时限制
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'Accept': 'application/json'
        },
        maxRedirects: 0,
        validateStatus: function (status) {
          return status < 500; // 接受所有非服务器错误
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Ollama API失败: ${response.status} ${response.statusText}`);
      }

      const data = response.data;
      
      // 尝试解析JSON响应
      try {
        const strategyText = data.response || '';
        console.log('🔍 Raw Ollama response preview:', strategyText.substring(0, 200));
        
        const jsonMatch = strategyText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const strategy = JSON.parse(jsonMatch[0]);
          
          // 添加web search queries
          strategy.web_search_queries = await this.generateWebSearchQueries(strategy, businessAnalysis);
          
          return strategy;
        } else {
          throw new Error('无法从响应中提取JSON结构');
        }
      } catch (parseError) {
        console.log(`❌ JSON解析失败: ${parseError.message}`);
        throw new Error(`策略解析失败: ${parseError.message}`);
      }
    } catch (error) {
      console.log(`❌ Ollama策略生成失败: ${error.message}`);
      throw error; // 重新抛出错误，让调用者处理回退
    }
  }

  async generateWebSearchQueries(strategy, businessAnalysis) {
    const queries = [
      `${strategy.company_name || businessAnalysis.companyName} ${strategy.target_audience?.type === 'tob' ? 'business' : 'customer'} email contact`,
      `${businessAnalysis.industry || 'technology'} companies email directory`,
      `${strategy.target_audience?.primary_segments?.[0] || 'business'} contact information`,
      `${businessAnalysis.companyName} ${businessAnalysis.industry} partnerships email`
    ];
    
    return queries;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }
}

module.exports = MarketingStrategyAgent;