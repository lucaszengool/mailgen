const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class MacMailIntegration {
  constructor() {
    this.isAvailable = false;
    this.defaultAccount = null;
    this.checkAvailability();
  }

  // 检查Mac邮件应用是否可用
  async checkAvailability() {
    try {
      const appleScript = `
        tell application "System Events"
          return (exists application process "Mail")
        end tell
      `;
      
      const result = await this.executeAppleScript(appleScript);
      this.isAvailable = result.trim() === 'true';
      
      if (this.isAvailable) {
        await this.getDefaultAccount();
      }
      
      console.log(`📧 Mac邮件集成状态: ${this.isAvailable ? '可用' : '不可用'}`);
      
    } catch (error) {
      console.error('检查Mac邮件可用性失败:', error.message);
      this.isAvailable = false;
    }
  }

  // 获取默认邮件账户
  async getDefaultAccount() {
    try {
      // 暂时禁用Mac邮件集成以避免AppleScript错误
      this.defaultAccount = {
        name: 'Mac Mail (Disabled)',
        email: 'disabled@local.mac'
      };
      
      console.log(`📮 默认邮件账户: ${this.defaultAccount.name} (${this.defaultAccount.email})`);
      return;
      
      const appleScript = `
        tell application "Mail"
          if (count of accounts) > 0 then
            set defaultAccount to account 1
            set accountName to name of defaultAccount
            set emailAddress to email address of defaultAccount
            return accountName & "|" & emailAddress
          else
            return "No Account|"
          end if
        end tell
      `;
      
      const result = await this.executeAppleScript(appleScript);
      const [accountName, emailAddress] = result.trim().split('|');
      
      this.defaultAccount = {
        name: accountName,
        email: emailAddress
      };
      
      console.log(`📮 默认邮件账户: ${accountName} (${emailAddress})`);
      
    } catch (error) {
      console.error('获取默认邮件账户失败:', error.message);
      this.defaultAccount = null;
    }
  }

  // 发送邮件
  async sendEmail({ to, subject, body, htmlBody = null }) {
    try {
      // 首先尝试使用命令行工具
      const result = await this.sendEmailViaCommandLine({ to, subject, body });
      return result;
    } catch (error) {
      console.error(`❌ 命令行邮件发送失败，尝试AppleScript: ${error.message}`);
      
      // 备用AppleScript方法
      try {
        return await this.sendEmailViaAppleScript({ to, subject, body, htmlBody });
      } catch (scriptError) {
        console.error(`❌ AppleScript邮件发送也失败:`, scriptError.message);
        throw new Error(`邮件发送失败: ${error.message}`);
      }
    }
  }

  // 使用命令行工具发送邮件
  async sendEmailViaCommandLine({ to, subject, body }) {
    return new Promise((resolve, reject) => {
      const command = `echo "${body}" | mail -s "${subject}" "${to}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`命令行邮件发送失败: ${error.message}`));
          return;
        }
        
        console.log(`✅ 邮件发送成功 (命令行): ${to} - ${subject}`);
        resolve({
          success: true,
          messageId: this.generateMessageId(),
          to: to,
          subject: subject,
          sentAt: new Date().toISOString(),
          method: 'command_line'
        });
      });
    });
  }

  // 使用AppleScript发送邮件（备用方法）
  async sendEmailViaAppleScript({ to, subject, body, htmlBody = null }) {
    const escapedSubject = this.escapeAppleScriptString(subject);
    const escapedBody = this.escapeAppleScriptString(htmlBody || body);
    const escapedTo = this.escapeAppleScriptString(to);
    
    const appleScript = `tell application "Mail"
set newMessage to make new outgoing message with properties {subject:"${escapedSubject}", content:"${escapedBody}"}
tell newMessage
make new to recipient at end of to recipients with properties {address:"${escapedTo}"}
send
end tell
return "sent"
end tell`;
    
    const result = await this.executeAppleScript(appleScript);
    
    if (result.trim() === 'sent') {
      console.log(`✅ 邮件发送成功 (AppleScript): ${to} - ${subject}`);
      return {
        success: true,
        messageId: this.generateMessageId(),
        to: to,
        subject: subject,
        sentAt: new Date().toISOString(),
        method: 'applescript'
      };
    } else {
      throw new Error('发送失败: ' + result);
    }
  }

  // 批量发送邮件
  async sendBulkEmails(emails) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push(result);
        
        // 发送间隔，避免被标记为垃圾邮件
        await this.sleep(2000); // 2秒间隔
        
      } catch (error) {
        results.push({
          success: false,
          to: email.to,
          subject: email.subject,
          error: error.message,
          failedAt: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  // 创建邮件草稿（不发送）
  async createDraft({ to, subject, body, htmlBody = null }) {
    if (!this.isAvailable) {
      throw new Error('Mac邮件应用不可用');
    }

    try {
      const escapedSubject = this.escapeAppleScriptString(subject);
      const escapedBody = this.escapeAppleScriptString(htmlBody || body);
      const escapedTo = this.escapeAppleScriptString(to);
      
      const appleScript = `
        tell application "Mail"
          set newMessage to make new outgoing message with properties {
            subject: "${escapedSubject}",
            content: "${escapedBody}",
            visible: false
          }
          
          tell newMessage
            make new to recipient at end of to recipients with properties {address: "${escapedTo}"}
            ${htmlBody ? 'set message format to rich text' : ''}
          end tell
          
          return "draft_created"
        end tell
      `;
      
      await this.executeAppleScript(appleScript);
      
      console.log(`📝 邮件草稿创建成功: ${to} - ${subject}`);
      return {
        success: true,
        draftId: this.generateMessageId(),
        to: to,
        subject: subject,
        createdAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('创建邮件草稿失败:', error.message);
      throw error;
    }
  }

  // 获取邮件账户列表
  async getMailAccounts() {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const appleScript = `
        tell application "Mail"
          set accountList to {}
          repeat with acc in accounts
            set accountInfo to (name of acc) & "|" & (email address of acc)
            set accountList to accountList & {accountInfo}
          end repeat
          
          set AppleScript's text item delimiters to "\\n"
          set result to accountList as string
          set AppleScript's text item delimiters to ""
          return result
        end tell
      `;
      
      const result = await this.executeAppleScript(appleScript);
      const accounts = result.trim().split('\n')
        .filter(line => line.length > 0)
        .map(line => {
          const [name, email] = line.split('|');
          return { name, email };
        });
      
      return accounts;
      
    } catch (error) {
      console.error('获取邮件账户失败:', error.message);
      return [];
    }
  }

  // 检查邮件应用状态
  async getMailAppStatus() {
    try {
      const appleScript = `
        tell application "System Events"
          set mailRunning to (exists application process "Mail")
        end tell
        
        if mailRunning then
          tell application "Mail"
            set inboxCount to unread count of inbox
            return "running|" & inboxCount
          end tell
        else
          return "not_running|0"
        end if
      `;
      
      const result = await this.executeAppleScript(appleScript);
      const [status, unreadCount] = result.trim().split('|');
      
      return {
        isRunning: status === 'running',
        unreadCount: parseInt(unreadCount) || 0,
        isAvailable: this.isAvailable,
        defaultAccount: this.defaultAccount
      };
      
    } catch (error) {
      console.error('获取邮件应用状态失败:', error.message);
      return {
        isRunning: false,
        unreadCount: 0,
        isAvailable: false,
        defaultAccount: null,
        error: error.message
      };
    }
  }

  // 监听邮件回复（简单实现）
  async checkForReplies(sinceDate = null) {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const dateFilter = sinceDate ? 
        `whose date received is greater than date "${sinceDate}"` : 
        'whose date received is greater than (current date) - 1 * days';
      
      const appleScript = `
        tell application "Mail"
          set recentMessages to messages of inbox ${dateFilter}
          set replyList to {}
          
          repeat with msg in recentMessages
            set msgInfo to (sender of msg) & "|" & (subject of msg) & "|" & (content of msg) & "|" & (date received of msg)
            set replyList to replyList & {msgInfo}
          end repeat
          
          set AppleScript's text item delimiters to "\\n"
          set result to replyList as string
          set AppleScript's text item delimiters to ""
          return result
        end tell
      `;
      
      const result = await this.executeAppleScript(appleScript);
      const replies = result.trim().split('\n')
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split('|');
          return {
            sender: parts[0] || '',
            subject: parts[1] || '',
            content: parts[2] || '',
            receivedAt: parts[3] || '',
            isReply: (parts[1] || '').toLowerCase().includes('re:')
          };
        })
        .filter(msg => msg.isReply);
      
      return replies;
      
    } catch (error) {
      console.error('检查邮件回复失败:', error.message);
      return [];
    }
  }

  // 执行AppleScript
  async executeAppleScript(script) {
    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`AppleScript执行失败: ${error.message}`));
          return;
        }
        
        if (stderr) {
          console.warn('AppleScript警告:', stderr);
        }
        
        resolve(stdout);
      });
    });
  }

  // 转义AppleScript字符串
  escapeAppleScriptString(str) {
    if (!str) return '';
    
    return str
      .replace(/\\/g, '\\\\')  // 反斜杠
      .replace(/"/g, '\\"')    // 双引号
      .replace(/\n/g, ' ')     // 将换行符替换为空格
      .replace(/\r/g, ' ')     // 将回车符替换为空格
      .replace(/\t/g, ' ')     // 将制表符替换为空格
      .replace(/'/g, "\\'");   // 单引号
  }

  // 生成消息ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 延迟函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 格式化邮件为HTML
  formatEmailAsHtml(content) {
    if (!content) return '';
    
    return content
      .replace(/\n/g, '<br>')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/  /g, '&nbsp;&nbsp;');
  }

  // 测试邮件发送
  async testSend(testEmail = null) {
    try {
      const email = testEmail || {
        to: this.defaultAccount?.email || 'test@example.com',
        subject: 'AI邮件助手测试邮件',
        body: `这是一封来自AI邮件助手的测试邮件。\n\n发送时间: ${new Date().toLocaleString('zh-CN')}\n\n如果您收到此邮件，说明集成工作正常。`
      };

      const result = await this.sendEmail(email);
      return {
        success: true,
        message: '测试邮件发送成功',
        result: result
      };
      
    } catch (error) {
      return {
        success: false,
        message: '测试邮件发送失败: ' + error.message,
        error: error.message
      };
    }
  }

  // 获取集成状态信息
  getIntegrationInfo() {
    return {
      name: 'Mac Mail Integration',
      version: '1.0.0',
      isAvailable: this.isAvailable,
      defaultAccount: this.defaultAccount,
      features: [
        'Send emails',
        'Create drafts', 
        'Bulk sending',
        'Reply monitoring',
        'Account management'
      ],
      limitations: [
        'Requires Mac Mail app',
        'Depends on AppleScript',
        'Limited reply parsing'
      ]
    };
  }
}

module.exports = MacMailIntegration;