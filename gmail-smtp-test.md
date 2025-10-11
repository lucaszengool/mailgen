# Gmail SMTP 配置测试指南

## 完成Gmail配置的步骤：

### 1. 启用两步验证
1. 访问 https://myaccount.google.com/security
2. 在"登录Google"部分，选择"两步验证"
3. 按照步骤完成两步验证设置

### 2. 生成应用密码
1. 在Google账户安全页面
2. 选择"应用密码"
3. 选择"邮件"和您的设备
4. 生成16位应用密码（例如：abcd efgh ijkl mnop）

### 3. 在系统中配置SMTP
在邮件设置向导中使用以下配置：
- **SMTP服务器**: smtp.gmail.com
- **端口**: 587
- **邮箱地址**: your-email@gmail.com
- **应用密码**: 刚才生成的16位密码

### 4. 测试真实发送
```bash
# 测试API调用示例：
curl -X POST http://localhost:3333/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "AI邮件营销助手测试",
    "body": "这是通过AI邮件营销助手发送的测试邮件。<br><br>系统工作正常！",
    "smtpConfig": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "username": "your-email@gmail.com", 
      "password": "your-app-password"
    }
  }'
```

## 系统当前状态

✅ **所有功能已完成并测试：**

### 1. 前端组件
- EmailMonitoring: 监控页面，显示邮件列表和状态
- EmailComposer: 邮件编辑器，集成设置向导
- EmailSetupWizard: 4步引导设置向导
- QuickStartModal: 快速启动说明
- StartPage: 初始页面，收集目标网站信息

### 2. 后端API
- `/api/email/send`: 真实邮件发送
- `/api/email/test-smtp`: SMTP配置测试
- `/api/ollama/generate-email`: AI邮件生成
- `/api/automation/*`: 系统自动化控制

### 3. 引导式用户体验
1. **步骤1**: SMTP邮箱配置
   - 支持Gmail、Outlook、QQ、163预设
   - 实时表单验证
   - 详细帮助说明

2. **步骤2**: 连接测试  
   - 实时SMTP连接验证
   - 清晰的成功/失败状态
   - 错误信息详细说明

3. **步骤3**: 邮件预览
   - 完整邮件内容预览
   - 收发件人信息确认
   - 发送前最后检查

4. **步骤4**: 发送确认
   - 发送摘要信息
   - 一键发送功能
   - 实时发送状态反馈

## 完整工作流程
1. 访问 http://localhost:3000/start 输入企业网站
2. 系统分析网站并生成邮件数据
3. 在监控页面点击任何邮件
4. 启动邮件设置向导
5. 按步骤配置SMTP、测试、预览、发送
6. 获得实时状态反馈

**🎉 系统已完全准备就绪，可以进行真实的邮件营销活动！**