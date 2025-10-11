const express = require('express');
const ComprehensiveEmailAgent = require('../agents/ComprehensiveEmailAgent');

const router = express.Router();
let currentAgent = null;

// 初始化优化后的AI代理
router.post('/initialize', async (req, res) => {
  try {
    const { targetWebsite, campaignGoal, businessType, smtpConfig } = req.body;
    
    console.log('🚀 初始化优化后的AI代理...');
    console.log('目标网站:', targetWebsite);
    console.log('业务类型:', businessType);
    console.log('营销目标:', campaignGoal);
    
    // 创建新的代理实例
    currentAgent = new ComprehensiveEmailAgent();
    
    // 构建配置
    const config = {
      targetWebsite,
      campaignGoal,
      businessType: businessType || 'auto',
      smtpConfig: smtpConfig || {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        username: 'test@example.com',
        password: 'test_password'
      }
    };
    
    // 初始化代理
    const result = await currentAgent.initialize(config);
    
    console.log('✅ 代理初始化结果:', result.success);
    
    res.json({
      success: result.success,
      strategy: result.strategy,
      smtp_status: result.smtp_status,
      message: '优化后的AI营销代理初始化完成'
    });
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动营销代理
router.post('/start', async (req, res) => {
  try {
    if (!currentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化代理'
      });
    }
    
    console.log('🚀 启动优化后的营销代理...');
    const result = await currentAgent.start();
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取统计信息
router.get('/stats', (req, res) => {
  try {
    if (!currentAgent) {
      return res.json({
        success: false,
        error: '代理未初始化'
      });
    }
    
    const stats = currentAgent.getStats();
    res.json({
      success: true,
      ...stats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 停止代理
router.post('/stop', async (req, res) => {
  try {
    if (!currentAgent) {
      return res.json({
        success: false,
        error: '代理未运行'
      });
    }
    
    const result = await currentAgent.stop();
    currentAgent = null;
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 暂停/恢复代理
router.post('/pause', (req, res) => {
  try {
    if (!currentAgent) {
      return res.json({
        success: false,
        error: '代理未运行'
      });
    }
    
    const result = currentAgent.pause();
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取当前任务
router.get('/task', (req, res) => {
  try {
    if (!currentAgent) {
      return res.json({
        success: false,
        current_task: '代理未运行'
      });
    }
    
    const task = currentAgent.getCurrentTask();
    res.json({
      success: true,
      current_task: task
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;