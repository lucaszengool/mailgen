# 中国企业和人员搜索API配置指南

## 🎯 推荐的中国搜索API配置

### 1. 企业信息搜索API

#### 企查查API (最推荐)
- **用途**: 中国企业工商信息、联系方式、法人信息
- **官网**: https://openapi.qichacha.com/
- **申请**: 注册账户 → 实名认证 → 购买套餐
- **费用**: 按查询次数计费，约0.1-1元/次
- **配置环境变量**:
  ```bash
  export QICHACHA_API_KEY="your_api_key"
  export QICHACHA_SECRET_KEY="your_secret_key"
  ```

#### 天眼查API
- **用途**: 企业征信、风险信息、关联企业
- **官网**: https://open.tianyancha.com/
- **申请**: 企业认证 → API申请 → 付费开通
- **费用**: 按查询次数计费
- **配置环境变量**:
  ```bash
  export TIANYANCHA_API_KEY="your_api_key"
  ```

#### 百度搜索API
- **用途**: 中文网页搜索、企业官网搜索
- **官网**: https://ai.baidu.com/ai-doc/SEARCH/
- **申请**: 百度智能云 → 创建应用 → 获取API Key
- **费用**: 有免费额度，超出按次计费
- **配置环境变量**:
  ```bash
  export BAIDU_SEARCH_API_KEY="your_access_token"
  ```

### 2. 人员联系方式搜索API

#### 脉脉API (职场社交)
- **用途**: 企业员工信息、职位、联系方式
- **官网**: https://open.maimai.cn/
- **申请**: 企业认证 → 开发者申请 → API授权
- **费用**: 按查询次数计费
- **配置环境变量**:
  ```bash
  export MAIMA_API_KEY="your_api_key"
  ```

#### 猎聘API (招聘平台)
- **用途**: 职场人员信息、简历、联系方式
- **官网**: https://open.liepin.com/
- **申请**: 企业认证 → 开发者账户 → API申请
- **费用**: 按查询次数计费
- **配置环境变量**:
  ```bash
  export LIEPIN_API_KEY="your_api_key"
  ```

#### BOSS直聘API
- **用途**: 企业HR信息、招聘联系人
- **官网**: https://www.zhipin.com/
- **申请**: 需要内部渠道或商务合作
- **配置环境变量**:
  ```bash
  export BOSSZHIPIN_API_KEY="your_api_key"
  ```

## 🚀 快速配置步骤

### 1. 创建 .env 文件
```bash
cd /Users/James/Desktop/agent
touch .env
```

### 2. 配置API密钥
将以下内容添加到 `.env` 文件中：

```env
# 企业信息搜索
QICHACHA_API_KEY=your_qichacha_api_key
QICHACHA_SECRET_KEY=your_qichacha_secret_key
TIANYANCHA_API_KEY=your_tianyancha_api_key
BAIDU_SEARCH_API_KEY=your_baidu_access_token

# 人员联系方式搜索
MAIMA_API_KEY=your_maima_api_key
LIEPIN_API_KEY=your_liepin_api_key
BOSSZHIPIN_API_KEY=your_bosszhipin_api_key

# 国际搜索 (备用)
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### 3. 重启服务器
```bash
# 配置完成后重启服务器以加载新的环境变量
node server/index.js
```

## 📊 API优先级和策略

系统将按以下优先级使用API：

1. **企查查API** - 获取企业工商信息和联系方式
2. **百度搜索API** - 搜索企业官网和相关信息
3. **脉脉API** - 获取企业内部人员联系方式
4. **猎聘API** - 获取企业招聘联系人信息
5. **DuckDuckGo** - 国际搜索备用
6. **Bing搜索** - 国际搜索备用
7. **Google搜索** - 国际搜索备用

## 💰 成本估算

### 典型使用成本（每月处理1000个潜在客户）：
- **企查查**: ¥100-500/月
- **天眼查**: ¥200-800/月  
- **百度搜索**: ¥50-200/月
- **脉脉**: ¥300-1000/月
- **猎聘**: ¥500-1500/月

**总成本**: ¥1,150-4,000/月

## 🔧 测试API配置

配置完成后，运行以下测试：

```bash
curl -X POST http://localhost:3333/api/intelligent/test/ai-driven-outreach \
  -H "Content-Type: application/json" \
  -d '{
    "targetWebsite": "https://petpoofficial.org",
    "maxLeads": 3,
    "campaignObjective": "partnership"
  }'
```

## 📝 注意事项

1. **合规使用**: 确保遵守各平台的API使用协议
2. **数据保护**: 妥善保护获取的联系信息
3. **频率限制**: 注意API调用频率限制
4. **成本控制**: 监控API使用量避免超出预算
5. **备用方案**: 配置多个API确保搜索成功率

## 🎉 配置完成后的功能

✅ 搜索中国企业工商信息和联系方式  
✅ 获取企业内部人员联系方式（邮箱、电话、微信）  
✅ AI验证每个潜在客户的相关性  
✅ 生成完全定制化的中文/英文邮件  
✅ 真实SMTP邮件发送  
✅ 无fallback，搜索失败时返回明确错误