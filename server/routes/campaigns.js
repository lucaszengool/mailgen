const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('crypto');

// 创建营销活动
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      targetAudience,
      emailTemplate,
      status = 'draft'
    } = req.body;

    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const campaignId = uuidv4();

    const campaign = {
      id: campaignId,
      name,
      description,
      targetAudience,
      emailTemplate,
      status
    };

    await db.saveCampaign(campaign, userId);

    res.json({
      success: true,
      data: {
        id: campaignId,
        ...campaign,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('创建营销活动失败:', error);
    res.status(500).json({
      success: false,
      error: '创建营销活动失败'
    });
  }
});

// 获取营销活动列表
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const campaigns = await db.getCampaigns(userId, parseInt(limit));

    // 为每个活动添加统计数据
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const stats = await db.getEmailStats(campaign.id);
          return {
            ...campaign,
            stats: {
              totalSent: stats.sendingStats.reduce((sum, day) => sum + day.total_sent, 0),
              successfulSent: stats.sendingStats.reduce((sum, day) => sum + day.successful_sent, 0),
              totalOpens: stats.engagement.totalOpens,
              totalClicks: stats.engagement.totalClicks
            }
          };
        } catch (error) {
          return {
            ...campaign,
            stats: {
              totalSent: 0,
              successfulSent: 0,
              totalOpens: 0,
              totalClicks: 0
            }
          };
        }
      })
    );

    res.json({
      success: true,
      data: campaignsWithStats
    });

  } catch (error) {
    console.error('获取营销活动列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取营销活动列表失败'
    });
  }
});

// 获取单个营销活动
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const campaigns = await db.getCampaigns(userId);
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: '营销活动不存在'
      });
    }

    // 获取详细统计数据
    const stats = await db.getEmailStats(id);

    res.json({
      success: true,
      data: {
        ...campaign,
        stats: stats
      }
    });

  } catch (error) {
    console.error('获取营销活动详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取营销活动详情失败'
    });
  }
});

// 更新营销活动 (UPSERT - create if doesn't exist)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 检查活动是否存在
    const campaigns = await db.getCampaigns(userId);
    const existingCampaign = campaigns.find(c => c.id === id);

    let campaignToSave;

    if (!existingCampaign) {
      // Campaign doesn't exist - create it (useful for onboarding flow)
      console.log(`📝 Creating new campaign during onboarding: ${id}`);
      campaignToSave = {
        id: id,
        name: updateData.campaignName || updateData.name || 'New Campaign',
        description: updateData.description || '',
        targetAudience: updateData.targetAudience || {},
        emailTemplate: updateData.emailTemplate || {},
        status: updateData.status || 'draft',
        created_at: new Date().toISOString(),
        ...updateData
      };
    } else {
      // Campaign exists - merge updates
      campaignToSave = {
        ...existingCampaign,
        ...updateData,
        id: id // 确保ID不被覆盖
      };
    }

    await db.saveCampaign(campaignToSave, userId);

    res.json({
      success: true,
      data: campaignToSave
    });

  } catch (error) {
    console.error('更新营销活动失败:', error);
    res.status(500).json({
      success: false,
      error: '更新营销活动失败'
    });
  }
});

// 启动营销活动
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipients, smtpConfig, delayBetweenEmails = 5000 } = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 获取活动详情
    const campaigns = await db.getCampaigns(userId);
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: '营销活动不存在'
      });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: '收件人列表不能为空'
      });
    }

    if (!smtpConfig) {
      return res.status(400).json({
        success: false,
        error: '请配置SMTP设置'
      });
    }

    // 更新活动状态为运行中
    await db.saveCampaign({
      ...campaign,
      status: 'running'
    }, userId);

    // 开始发送邮件（调用邮件发送API）
    const axios = require('axios');
    try {
      await axios.post('http://localhost:3333/api/email/send-bulk', {
        recipients,
        subject: campaign.emailTemplate.subject || '商务合作咨询',
        body: campaign.emailTemplate.body || '',
        smtpConfig,
        campaignId: id,
        delayBetweenEmails
      });

      res.json({
        success: true,
        message: '营销活动已启动',
        data: {
          campaignId: id,
          recipientCount: recipients.length,
          status: 'running'
        }
      });

    } catch (emailError) {
      // 如果邮件发送失败，恢复活动状态
      await db.saveCampaign({
        ...campaign,
        status: 'draft'
      }, userId);

      throw emailError;
    }

  } catch (error) {
    console.error('启动营销活动失败:', error);
    res.status(500).json({
      success: false,
      error: '启动营销活动失败: ' + error.message
    });
  }
});

// 停止营销活动
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 获取活动详情
    const campaigns = await db.getCampaigns(userId);
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: '营销活动不存在'
      });
    }

    // 更新活动状态为已停止
    await db.saveCampaign({
      ...campaign,
      status: 'stopped'
    }, userId);

    res.json({
      success: true,
      message: '营销活动已停止',
      data: {
        campaignId: id,
        status: 'stopped'
      }
    });

  } catch (error) {
    console.error('停止营销活动失败:', error);
    res.status(500).json({
      success: false,
      error: '停止营销活动失败'
    });
  }
});

// 复制营销活动
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 获取原活动
    const campaigns = await db.getCampaigns(userId);
    const originalCampaign = campaigns.find(c => c.id === id);

    if (!originalCampaign) {
      return res.status(404).json({
        success: false,
        error: '营销活动不存在'
      });
    }

    // 创建新活动
    const newCampaignId = uuidv4();
    const duplicatedCampaign = {
      ...originalCampaign,
      id: newCampaignId,
      name: originalCampaign.name + ' (副本)',
      status: 'draft'
    };

    await db.saveCampaign(duplicatedCampaign, userId);

    res.json({
      success: true,
      data: {
        ...duplicatedCampaign,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('复制营销活动失败:', error);
    res.status(500).json({
      success: false,
      error: '复制营销活动失败'
    });
  }
});

// 删除营销活动
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 这里应该实现软删除或硬删除逻辑
    // 暂时通过更新状态为已删除来实现
    const campaigns = await db.getCampaigns(userId);
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: '营销活动不存在'
      });
    }

    await db.saveCampaign({
      ...campaign,
      status: 'deleted'
    }, userId);

    res.json({
      success: true,
      message: '营销活动已删除'
    });

  } catch (error) {
    console.error('删除营销活动失败:', error);
    res.status(500).json({
      success: false,
      error: '删除营销活动失败'
    });
  }
});

module.exports = router;