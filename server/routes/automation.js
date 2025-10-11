const express = require('express');

module.exports = (emailAgent, marketingAgent) => {
  const router = express.Router();

  // 获取邮件发送统计
  router.get('/email-stats', async (req, res) => {
    try {
      const stats = emailAgent.getEmailStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 控制auto reply
  router.post('/toggle-auto-reply', async (req, res) => {
    try {
      const { enabled } = req.body;
      emailAgent.autoReplyEnabled = enabled;
      
      res.json({
        success: true,
        data: {
          autoReplyEnabled: emailAgent.autoReplyEnabled,
          message: enabled ? 'Auto reply enabled' : 'Auto reply disabled'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 暂停/恢复代理
  router.post('/pause', async (req, res) => {
    try {
      emailAgent.isPaused = true;
      res.json({
        success: true,
        data: {
          isPaused: true,
          message: 'Agent paused'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  router.post('/resume', async (req, res) => {
    try {
      emailAgent.isPaused = false;
      res.json({
        success: true,
        data: {
          isPaused: false,
          message: 'Agent resumed'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 获取学习状态
  router.get('/learning-status', async (req, res) => {
    try {
      const status = emailAgent.learningAgent.getLearningStatus();
      const stats = await emailAgent.knowledgeBase.getLearningStats();
      
      res.json({
        success: true,
        data: {
          ...status,
          learningStats: stats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 手动触发学习
  router.post('/trigger-learning', async (req, res) => {
    try {
      const result = await emailAgent.learningAgent.triggerLearning();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 启动自动化邮件系统
  router.post('/start', async (req, res) => {
    try {
      const { targetWebsite, companyInfo } = req.body;

      if (!targetWebsite) {
        return res.status(400).json({
          success: false,
          error: '请提供目标网站URL'
        });
      }

      // 立即响应客户端，然后在后台启动代理
      res.json({
        success: true,
        message: '自动化系统正在启动...',
        data: {
          targetWebsite,
          startedAt: new Date().toISOString(),
          status: 'starting'
        }
      });

      // 在后台异步启动代理，避免阻塞响应
      setImmediate(async () => {
        try {
          console.log('🚀 后台启动营销研究代理...');
          marketingAgent.startResearch(targetWebsite);
          
          console.log('🚀 后台启动邮件自动化代理...');
          await emailAgent.startAutomation(targetWebsite, companyInfo || {});
          
          console.log('✅ 自动化系统后台启动完成');
        } catch (backgroundError) {
          console.error('后台启动代理失败:', backgroundError);
        }
      });

    } catch (error) {
      console.error('启动自动化系统失败:', error);
      res.status(500).json({
        success: false,
        error: '启动自动化系统失败: ' + error.message
      });
    }
  });

  // 停止自动化系统
  router.post('/stop', async (req, res) => {
    try {
      marketingAgent.stopResearch();
      emailAgent.stopAutomation();

      res.json({
        success: true,
        message: '自动化系统已停止',
        data: {
          stoppedAt: new Date().toISOString(),
          status: 'stopped'
        }
      });

    } catch (error) {
      console.error('停止自动化系统失败:', error);
      res.status(500).json({
        success: false,
        error: '停止自动化系统失败: ' + error.message
      });
    }
  });

  // 获取系统状态
  router.get('/status', async (req, res) => {
    try {
      const emailStatus = await emailAgent.getSystemStatus();
      const marketingStatus = marketingAgent.getRealtimeData();

      res.json({
        success: true,
        data: {
          emailAutomation: emailStatus,
          marketingResearch: marketingStatus,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('获取系统状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取系统状态失败: ' + error.message
      });
    }
  });

  // 获取邮件内容和进度（用于监控仪表板）
  router.get('/emails/dashboard', (req, res) => {
    try {
      const dashboardData = emailAgent.getEmailContentAndProgress();

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('获取邮件仪表板数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取邮件仪表板数据失败: ' + error.message
      });
    }
  });

  // 获取市场调研洞察
  router.get('/insights/:website', (req, res) => {
    try {
      const { website } = req.params;
      const insights = marketingAgent.getKnowledgeBaseInsights(decodeURIComponent(website));

      if (!insights) {
        return res.status(404).json({
          success: false,
          error: '未找到该网站的调研数据'
        });
      }

      res.json({
        success: true,
        data: insights
      });

    } catch (error) {
      console.error('获取市场洞察失败:', error);
      res.status(500).json({
        success: false,
        error: '获取市场洞察失败: ' + error.message
      });
    }
  });

  // 手动添加潜客
  router.post('/prospects', async (req, res) => {
    try {
      const prospectData = req.body;

      // 验证必填字段
      const requiredFields = ['name', 'email', 'company'];
      for (const field of requiredFields) {
        if (!prospectData[field]) {
          return res.status(400).json({
            success: false,
            error: `缺少必填字段: ${field}`
          });
        }
      }

      const prospect = emailAgent.addManualProspect(prospectData);

      res.json({
        success: true,
        message: '潜客添加成功',
        data: prospect
      });

    } catch (error) {
      console.error('添加潜客失败:', error);
      res.status(500).json({
        success: false,
        error: '添加潜客失败: ' + error.message
      });
    }
  });

  // 为潜客生成个性化邮件
  router.post('/prospects/:id/generate-email', async (req, res) => {
    try {
      const { id } = req.params;
      const emailContent = await emailAgent.generateEmailForProspect(id);

      res.json({
        success: true,
        message: '邮件生成成功',
        data: emailContent
      });

    } catch (error) {
      console.error('生成邮件失败:', error);
      res.status(500).json({
        success: false,
        error: '生成邮件失败: ' + error.message
      });
    }
  });

  // 获取所有潜客列表
  router.get('/prospects', (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      let prospects = emailAgent.prospects;
      
      // 状态筛选
      if (status) {
        prospects = prospects.filter(p => p.status === status);
      }
      
      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedProspects = prospects.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          prospects: paginatedProspects,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: prospects.length,
            pages: Math.ceil(prospects.length / limit)
          }
        }
      });

    } catch (error) {
      console.error('获取潜客列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取潜客列表失败: ' + error.message
      });
    }
  });

  // 批量发送邮件
  router.post('/emails/send-batch', async (req, res) => {
    try {
      const { prospectIds } = req.body;

      if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: '请提供有效的潜客ID列表'
        });
      }

      // 更新选中潜客状态为ready_to_send
      let updatedCount = 0;
      for (const id of prospectIds) {
        const prospect = emailAgent.prospects.find(p => p.id === id);
        if (prospect && prospect.emailContent && prospect.status === 'pending') {
          prospect.status = 'ready_to_send';
          updatedCount++;
        }
      }

      // 触发发送
      await emailAgent.sendPendingEmails();

      res.json({
        success: true,
        message: `已安排发送 ${updatedCount} 封邮件`,
        data: {
          updatedCount,
          sentAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('批量发送邮件失败:', error);
      res.status(500).json({
        success: false,
        error: '批量发送邮件失败: ' + error.message
      });
    }
  });

  // 处理邮件回复（Webhook）
  router.post('/emails/reply', async (req, res) => {
    try {
      const { fromEmail, subject, content } = req.body;

      if (!fromEmail || !content) {
        return res.status(400).json({
          success: false,
          error: '缺少必要的回复信息'
        });
      }

      await emailAgent.handleEmailReply(fromEmail, subject, content);

      res.json({
        success: true,
        message: '邮件回复处理成功',
        data: {
          processedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('处理邮件回复失败:', error);
      res.status(500).json({
        success: false,
        error: '处理邮件回复失败: ' + error.message
      });
    }
  });

  // 获取邮件模板
  router.get('/templates', (req, res) => {
    try {
      res.json({
        success: true,
        data: emailAgent.emailTemplates
      });
    } catch (error) {
      console.error('获取邮件模板失败:', error);
      res.status(500).json({
        success: false,
        error: '获取邮件模板失败: ' + error.message
      });
    }
  });

  // 更新邮件模板
  router.put('/templates/:templateId', (req, res) => {
    try {
      const { templateId } = req.params;
      const templateData = req.body;

      if (!emailAgent.emailTemplates[templateId]) {
        return res.status(404).json({
          success: false,
          error: '模板不存在'
        });
      }

      emailAgent.emailTemplates[templateId] = {
        ...emailAgent.emailTemplates[templateId],
        ...templateData,
        updatedAt: new Date().toISOString()
      };

      emailAgent.saveEmailTemplates();

      res.json({
        success: true,
        message: '模板更新成功',
        data: emailAgent.emailTemplates[templateId]
      });

    } catch (error) {
      console.error('更新邮件模板失败:', error);
      res.status(500).json({
        success: false,
        error: '更新邮件模板失败: ' + error.message
      });
    }
  });

  // 测试网站分析
  router.post('/test/analyze-website', async (req, res) => {
    try {
      const { website } = req.body;

      if (!website) {
        return res.status(400).json({
          success: false,
          error: '请提供网站URL'
        });
      }

      console.log(`🧪 开始测试分析网站: ${website}`);
      
      // 使用已有的marketingAgent实例而不是创建新的
      if (marketingAgent) {
        try {
          marketingAgent.targetWebsite = website;
          console.log('🔍 开始执行市场调研...');
          const researchReport = await marketingAgent.performResearch();
          console.log('✅ 市场调研完成');
          
          res.json({
            success: true,
            message: '网站分析完成',
            data: {
              website,
              analysis: researchReport,
              analyzedAt: new Date().toISOString()
            }
          });
        } catch (researchError) {
          console.error('市场调研失败:', researchError);
          // 如果调研失败，返回模拟数据
          res.json({
            success: true,
            message: '网站分析完成（使用模拟数据）',
            data: {
              website,
              analysis: {
                timestamp: new Date().toISOString(),
                industry: 'pet care',
                error: '调研过程中出现错误，返回模拟数据',
                competitors: { totalFound: 0, analyzed: [] },
                targetAudience: {
                  demographics: { ageGroups: [{ range: '25-34', percentage: 35 }] },
                  psychographics: { painPoints: ['寻找可靠的宠物产品'] }
                }
              },
              analyzedAt: new Date().toISOString()
            }
          });
        }
      } else {
        // 如果没有marketingAgent，返回模拟数据
        res.json({
          success: true,
          message: '网站分析完成（模拟模式）',
          data: {
            website,
            analysis: {
              timestamp: new Date().toISOString(),
              industry: 'pet care',
              competitors: {
                totalFound: 8,
                analyzed: [{
                  url: 'https://www.petco.com',
                  title: 'Petco - Pet Supplies, Dog & Cat Food',
                  services: ['Pet supplies', 'Grooming', 'Veterinary services']
                }],
                summary: {
                  totalAnalyzed: 1,
                  commonServices: ['Pet supplies', 'Grooming'],
                  strengths: ['多元化产品线', '专业品牌形象'],
                  weaknesses: ['价格透明度不足']
                }
              },
              targetAudience: {
                demographics: {
                  ageGroups: [{ range: '25-34', percentage: 35 }],
                  income: [{ range: '50k-75k', percentage: 32 }]
                },
                psychographics: {
                  values: ['宠物健康', '便利性', '质量'],
                  painPoints: ['寻找可靠的宠物产品', '价格透明度', '产品安全性']
                }
              }
            },
            analyzedAt: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('网站分析失败:', error);
      res.status(500).json({
        success: false,
        error: '网站分析失败: ' + error.message
      });
    }
  });

  // Mac邮件集成测试
  router.post('/test/mac-mail', async (req, res) => {
    try {
      const result = await emailAgent.testMacMailIntegration();
      
      res.json({
        success: result.success,
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Mac邮件集成测试失败:', error);
      res.status(500).json({
        success: false,
        error: 'Mac邮件集成测试失败: ' + error.message
      });
    }
  });

  // 获取Mac邮件集成信息
  router.get('/mac-mail/info', (req, res) => {
    try {
      const info = emailAgent.getMacMailIntegrationInfo();
      
      res.json({
        success: true,
        data: info
      });

    } catch (error) {
      console.error('获取Mac邮件集成信息失败:', error);
      res.status(500).json({
        success: false,
        error: '获取Mac邮件集成信息失败: ' + error.message
      });
    }
  });

  // 切换邮件发送模式
  router.post('/email-mode/toggle', (req, res) => {
    try {
      const { useRealEmail = true } = req.body;
      const result = emailAgent.toggleEmailMode(useRealEmail);
      
      res.json({
        success: true,
        message: `邮件发送模式已切换为: ${useRealEmail ? '真实发送' : '模拟发送'}`,
        data: result
      });

    } catch (error) {
      console.error('切换邮件发送模式失败:', error);
      res.status(500).json({
        success: false,
        error: '切换邮件发送模式失败: ' + error.message
      });
    }
  });

  // 重置系统
  router.post('/reset', async (req, res) => {
    try {
      console.log('🔄 开始重置系统...');
      
      // 停止所有代理
      marketingAgent.stopResearch();
      emailAgent.stopAutomation();
      
      // 清空内存中的数据
      emailAgent.prospects = [];
      emailAgent.researchData = [];
      marketingAgent.knowledgeBase = {};
      marketingAgent.researchData = [];
      marketingAgent.realProspects = [];
      
      // 重置状态
      emailAgent.isRunning = false;
      marketingAgent.isRunning = false;
      emailAgent.targetWebsite = null;
      marketingAgent.targetWebsite = null;
      
      // 清空持久化数据文件
      const dataFiles = [
        '/Users/James/Desktop/agent/server/data/knowledge_base.json',
        '/Users/James/Desktop/agent/server/data/real_prospects.json',
        '/Users/James/Desktop/agent/server/data/prospects.json'
      ];
      
      const fs = require('fs');
      for (const file of dataFiles) {
        try {
          if (fs.existsSync(file)) {
            if (file.includes('email_templates.json')) {
              // 保留邮件模板，只清空其他数据
              continue;
            }
            if (file.includes('prospects.json') || file.includes('real_prospects.json')) {
              fs.writeFileSync(file, JSON.stringify([], null, 2));
            } else {
              fs.writeFileSync(file, JSON.stringify({}, null, 2));
            }
            console.log(`📁 已清空数据文件: ${file}`);
          }
        } catch (fileError) {
          console.error(`清空文件失败 ${file}:`, fileError.message);
        }
      }
      
      console.log('✅ 系统重置完成');
      
      res.json({
        success: true,
        message: '系统已重置，所有数据已清空',
        data: {
          resetAt: new Date().toISOString(),
          status: 'reset',
          filesCleared: dataFiles.length
        }
      });

    } catch (error) {
      console.error('重置系统失败:', error);
      res.status(500).json({
        success: false,
        error: '重置系统失败: ' + error.message
      });
    }
  });

  // 测试SMTP配置
  router.post('/smtp/test', async (req, res) => {
    try {
      const { host, port, secure, user, password, fromName, fromEmail } = req.body;

      if (!host || !port || !user || !password) {
        return res.status(400).json({
          success: false,
          error: '缺少必要的SMTP配置信息'
        });
      }

      // 使用nodemailer测试SMTP连接
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure, // true for 465, false for other ports
        auth: {
          user: user,
          pass: password
        }
      });

      // 验证连接配置
      await transporter.verify();

      // 发送测试邮件
      const testEmail = await transporter.sendMail({
        from: fromName ? `"${fromName}" <${fromEmail || user}>` : (fromEmail || user),
        to: user, // 发送给自己
        subject: '🎉 SMTP配置测试成功！',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">SMTP配置测试成功！</h2>
            <p>恭喜！您的邮件发送配置已经成功设置。</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1;">配置信息：</h3>
              <ul style="color: #374151;">
                <li><strong>SMTP服务器：</strong>${host}:${port}</li>
                <li><strong>用户名：</strong>${user}</li>
                <li><strong>加密方式：</strong>${secure ? 'SSL/TLS' : 'STARTTLS'}</li>
                <li><strong>发件人名称：</strong>${fromName || '未设置'}</li>
              </ul>
            </div>
            <p style="color: #6b7280;">现在您可以开始使用AI邮件营销系统发送个性化邮件了！</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af;">此邮件由AI邮件营销助手发送</p>
          </div>
        `
      });

      res.json({
        success: true,
        message: `SMTP连接成功！测试邮件已发送到 ${user}`,
        data: {
          messageId: testEmail.messageId,
          host: host,
          port: port,
          secure: secure,
          user: user,
          testEmailSent: true
        }
      });

    } catch (error) {
      console.error('SMTP测试失败:', error);
      
      let errorMessage = 'SMTP连接失败';
      if (error.code === 'EAUTH') {
        errorMessage = '认证失败：请检查用户名和密码（确保使用应用专用密码）';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = '连接失败：请检查SMTP服务器地址和端口';
      } else if (error.message.includes('Invalid login')) {
        errorMessage = '登录无效：请检查邮箱地址和应用专用密码';
      }
      
      res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.message
      });
    }
  });

  return router;
};