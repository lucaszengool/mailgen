// 系统设置工具函数

export const openMailSettings = () => {
  const platform = navigator.platform.toLowerCase()
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (platform.includes('mac')) {
    // macOS: 尝试打开邮件设置
    try {
      // 使用自定义 URL scheme 尝试打开系统偏好设置
      window.open('x-apple.systempreferences:com.apple.preferences.internetaccounts', '_blank')
    } catch (error) {
      // 如果无法打开，显示指导信息
      showMacOSInstructions()
    }
  } else if (platform.includes('win') || userAgent.includes('windows')) {
    // Windows: 尝试打开邮件设置
    try {
      // 使用 ms-settings URL scheme
      window.open('ms-settings:emailandaccounts', '_blank')
    } catch (error) {
      showWindowsInstructions()
    }
  } else {
    // 其他系统显示通用指导
    showGeneralInstructions()
  }
}

const showMacOSInstructions = () => {
  const instructions = `
📧 macOS 邮件账户设置步骤：

1️⃣ 打开"系统偏好设置"
2️⃣ 点击"互联网账户"
3️⃣ 点击"添加其他邮件账户..."
4️⃣ 选择您的邮件提供商或选择"其他邮件账户"
5️⃣ 输入邮箱地址和应用专用密码

💡 提示：
- Gmail/Outlook 需要应用专用密码，不是常规密码
- 确保启用了两步验证
- 添加后可在"邮件"应用中查看配置

是否需要查看如何获取应用专用密码？
  `
  
  if (confirm(instructions + '\n\n点击"确定"查看应用专用密码教程')) {
    openAppPasswordGuide()
  }
}

const showWindowsInstructions = () => {
  const instructions = `
📧 Windows 邮件账户设置步骤：

1️⃣ 打开"设置"应用 (Win + I)
2️⃣ 点击"账户"
3️⃣ 选择"电子邮件和账户"
4️⃣ 点击"添加账户"
5️⃣ 选择您的邮件提供商
6️⃣ 输入邮箱地址和应用专用密码

💡 提示：
- 使用应用专用密码，不是登录密码
- 添加后可在"邮件"应用中使用
- 支持 Gmail、Outlook、Yahoo 等

是否需要查看应用专用密码教程？
  `
  
  if (confirm(instructions + '\n\n点击"确定"查看教程')) {
    openAppPasswordGuide()
  }
}

const showGeneralInstructions = () => {
  const instructions = `
📧 邮件账户设置指导：

🔧 系统设置位置：
• macOS: 系统偏好设置 → 互联网账户
• Windows: 设置 → 账户 → 电子邮件和账户
• Linux: 根据桌面环境在设置中查找邮件账户

🔑 重要提示：
• 使用应用专用密码，不是常规登录密码
• 确保邮件服务商已启用 IMAP/SMTP
• 建议启用两步验证提高安全性

是否需要查看应用专用密码获取教程？
  `
  
  if (confirm(instructions + '\n\n点击"确定"查看教程')) {
    openAppPasswordGuide()
  }
}

const openAppPasswordGuide = () => {
  const guides = {
    gmail: 'https://support.google.com/accounts/answer/185833',
    outlook: 'https://support.microsoft.com/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944',
    qq: 'https://service.mail.qq.com/cgi-bin/help?subtype=1&id=28&no=1001256',
    '163': 'http://help.163.com/09/1224/17/5RAJ4LMH00753VB8.html'
  }
  
  const provider = prompt(`请选择您的邮件提供商：
  
1 - Gmail
2 - Outlook/Hotmail  
3 - QQ邮箱
4 - 163邮箱
0 - 显示所有教程

请输入数字：`)
  
  switch(provider) {
    case '1':
      window.open(guides.gmail, '_blank')
      break
    case '2':
      window.open(guides.outlook, '_blank')
      break
    case '3':
      window.open(guides.qq, '_blank')
      break
    case '4':
      window.open(guides['163'], '_blank')
      break
    case '0':
      // 显示所有教程链接
      const allGuides = `
应用专用密码获取教程：

📌 Gmail: ${guides.gmail}
📌 Outlook: ${guides.outlook}  
📌 QQ邮箱: ${guides.qq}
📌 163邮箱: ${guides['163']}

请复制对应链接到浏览器中打开查看详细步骤。
      `
      alert(allGuides)
      break
    default:
      break
  }
}

export const getEmailProviderInfo = (email) => {
  if (!email) return null
  
  const domain = email.split('@')[1]?.toLowerCase()
  
  const providers = {
    'gmail.com': {
      name: 'Gmail',
      smtp: 'smtp.gmail.com',
      port: 587,
      secure: false,
      helpUrl: 'https://support.google.com/accounts/answer/185833'
    },
    'outlook.com': {
      name: 'Outlook',
      smtp: 'smtp-mail.outlook.com', 
      port: 587,
      secure: false,
      helpUrl: 'https://support.microsoft.com/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944'
    },
    'hotmail.com': {
      name: 'Outlook',
      smtp: 'smtp-mail.outlook.com',
      port: 587, 
      secure: false,
      helpUrl: 'https://support.microsoft.com/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944'
    },
    'qq.com': {
      name: 'QQ邮箱',
      smtp: 'smtp.qq.com',
      port: 587,
      secure: false,
      helpUrl: 'https://service.mail.qq.com/cgi-bin/help?subtype=1&id=28&no=1001256'
    },
    '163.com': {
      name: '163邮箱',
      smtp: 'smtp.163.com',
      port: 587,
      secure: false,
      helpUrl: 'http://help.163.com/09/1224/17/5RAJ4LMH00753VB8.html'
    },
    '126.com': {
      name: '126邮箱',
      smtp: 'smtp.126.com',
      port: 587,
      secure: false,
      helpUrl: 'http://help.163.com/09/1224/17/5RAJ4LMH00753VB8.html'
    }
  }
  
  return providers[domain] || null
}

// 检查邮箱格式是否正确
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 生成SMTP配置建议
export const generateSMTPConfig = (email) => {
  const providerInfo = getEmailProviderInfo(email)
  
  if (!providerInfo) {
    return {
      provider: 'custom',
      host: '',
      port: 587,
      secure: false,
      needsAppPassword: true,
      instructions: [
        '1. 联系您的邮件服务商获取SMTP设置',
        '2. 确认服务器地址、端口和加密方式',
        '3. 获取应用专用密码或授权码',
        '4. 测试连接确保配置正确'
      ]
    }
  }
  
  return {
    provider: providerInfo.name.toLowerCase(),
    host: providerInfo.smtp,
    port: providerInfo.port,
    secure: providerInfo.secure,
    needsAppPassword: true,
    helpUrl: providerInfo.helpUrl,
    instructions: getProviderInstructions(providerInfo.name)
  }
}

const getProviderInstructions = (providerName) => {
  const instructions = {
    'Gmail': [
      '1. 开启两步验证',
      '2. 生成应用专用密码',
      '3. 使用应用密码替代常规密码',
      '4. 确保启用 IMAP 访问'
    ],
    'Outlook': [
      '1. 启用两步验证',
      '2. 创建应用密码',
      '3. 在应用中使用专用密码',
      '4. 确认账户安全设置'
    ],
    'QQ邮箱': [
      '1. 登录QQ邮箱网页版',
      '2. 设置 → 账户 → POP3/IMAP',
      '3. 开启SMTP服务',
      '4. 生成授权码'
    ],
    '163邮箱': [
      '1. 登录163邮箱',
      '2. 设置 → POP3/SMTP/IMAP',
      '3. 开启SMTP/IMAP服务',
      '4. 设置客户端授权密码'
    ]
  }
  
  return instructions[providerName] || [
    '1. 确认邮件服务商SMTP设置',
    '2. 获取应用专用密码',
    '3. 配置正确的服务器信息',
    '4. 测试连接'
  ]
}