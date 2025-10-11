# 🆓 免费搜索API配置指南

## 最佳免费搜索API组合

### 1. **SerpAPI** ⭐⭐⭐⭐⭐
- **免费额度**: 100次搜索/月
- **支持引擎**: Google, Bing, Yahoo, DuckDuckGo, Baidu, Yandex
- **优势**: 结构化JSON数据，无需解析HTML，最稳定
- **官网**: https://serpapi.com/
- **申请步骤**:
  1. 注册账户：https://serpapi.com/users/sign_up
  2. 验证邮箱
  3. 获取API Key
- **配置**:
  ```env
  SERPAPI_API_KEY=your_free_api_key
  ```

### 2. **Bing Web Search API** ⭐⭐⭐⭐⭐
- **免费额度**: 1000次搜索/月 (最多!)
- **支持**: 网页搜索、图片、新闻、视频
- **优势**: 微软官方，免费额度最高
- **官网**: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- **申请步骤**:
  1. 访问Azure门户：https://portal.azure.com/
  2. 创建"Bing Search v7"资源
  3. 选择免费F0定价层
  4. 获取API密钥
- **配置**:
  ```env
  BING_SEARCH_API_KEY=your_free_api_key
  ```

### 3. **Google Custom Search API** ⭐⭐⭐⭐
- **免费额度**: 100次搜索/天
- **优势**: Google搜索质量，权威性高
- **官网**: https://developers.google.com/custom-search/v1/introduction
- **申请步骤**:
  1. 创建Google Cloud项目
  2. 启用Custom Search API
  3. 创建自定义搜索引擎：https://cse.google.com/
  4. 获取API Key和搜索引擎ID
- **配置**:
  ```env
  GOOGLE_SEARCH_API_KEY=your_api_key
  GOOGLE_SEARCH_ENGINE_ID=your_engine_id
  ```

### 4. **SearchAPI.io** ⭐⭐⭐
- **免费额度**: 100次搜索/月
- **支持**: Google, Bing, Yahoo, YouTube, Amazon
- **优势**: 简单易用，无需复杂设置
- **官网**: https://www.searchapi.io/
- **申请步骤**:
  1. 注册账户：https://www.searchapi.io/auth/register
  2. 验证邮箱
  3. 获取API Key
- **配置**:
  ```env
  SEARCHAPI_KEY=your_free_api_key
  ```

## 🚀 5分钟快速配置

### 步骤1: 创建.env文件
```bash
cd /Users/James/Desktop/agent
touch .env
```

### 步骤2: 添加免费API配置
```env
# 免费搜索API配置
SERPAPI_API_KEY=your_serpapi_key
BING_SEARCH_API_KEY=your_bing_key
GOOGLE_SEARCH_API_KEY=your_google_key
GOOGLE_SEARCH_ENGINE_ID=your_engine_id
SEARCHAPI_KEY=your_searchapi_key

# 付费中国API (可选)
QICHACHA_API_KEY=your_qichacha_key
QICHACHA_SECRET_KEY=your_qichacha_secret
BAIDU_SEARCH_API_KEY=your_baidu_key
MAIMA_API_KEY=your_maima_key
```

### 步骤3: 重启服务器
```bash
node server/index.js
```

## 💰 免费额度总计

**每月可用搜索次数**:
- SerpAPI: 100次
- Bing API: 1000次  
- Google Custom: 3000次 (100/天 × 30天)
- SearchAPI.io: 100次

**总计**: **4200次免费搜索/月** 🎉

## 🎯 搜索策略优化

系统将按以下顺序使用API：

1. **SerpAPI** (100次用完再下一个)
2. **Bing免费API** (1000次用完再下一个)  
3. **SearchAPI.io** (100次用完再下一个)
4. **Google Custom Search** (3000次用完再下一个)
5. **付费中国API** (如果配置了)
6. **直接网页抓取** (最后备用)

## 📊 获取API密钥的详细步骤

### SerpAPI配置
1. 访问 https://serpapi.com/users/sign_up
2. 注册并验证邮箱
3. 登录后访问 https://serpapi.com/manage-api-key
4. 复制API密钥

### Bing API配置
1. 访问 https://portal.azure.com/
2. 登录Microsoft账户
3. 点击"创建资源" → 搜索"Bing Search v7"
4. 选择订阅和资源组
5. 定价层选择"F0 (免费)"
6. 创建后在"密钥和终结点"获取密钥

### Google Custom Search配置
1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 启用"Custom Search API"
4. 创建凭据 → API密钥
5. 访问 https://cse.google.com/cse/create/new
6. 创建自定义搜索引擎
7. 获取搜索引擎ID (cx参数)

### SearchAPI.io配置
1. 访问 https://www.searchapi.io/auth/register
2. 注册并验证邮箱
3. 登录后访问仪表板
4. 复制API密钥

## 🧪 测试配置

配置完成后运行测试：

```bash
curl -X POST http://localhost:3333/api/intelligent/init -H "Content-Type: application/json"

curl -X POST http://localhost:3333/api/intelligent/test/ai-driven-outreach \
  -H "Content-Type: application/json" \
  -d '{
    "targetWebsite": "https://petpoofficial.org",
    "maxLeads": 3,
    "campaignObjective": "partnership"
  }'
```

## ✅ 配置成功标志

如果看到以下日志，说明配置成功：
```
✅ SerpAPI找到 X 个免费结果
✅ Bing免费API找到 X 个结果  
✅ SearchAPI.io找到 X 个免费结果
✅ Google找到 X 个真实结果
```

## 🎉 完成后功能

✅ **4200次免费搜索/月**  
✅ **多引擎备份确保成功率**  
✅ **结构化数据无需解析HTML**  
✅ **AI验证每个潜在客户**  
✅ **完全定制化邮件生成**  
✅ **真实SMTP邮件发送**

**成本**: **$0/月** 🎊