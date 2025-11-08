const express = require('express');
const router = express.Router();
const db = require('../models/database');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// 配置文件上传
const upload = multer({ dest: 'uploads/' });

// 获取联系人列表
router.get('/', async (req, res) => {
  try {
    const {
      industry,
      company,
      status = 'active',
      page = 1,
      limit = 50,
      search,
      campaignId
    } = req.query;

    // 获取用户ID
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    let filter = { status };
    if (industry) filter.industry = industry;
    if (company) filter.company = company;
    if (campaignId) filter.campaignId = campaignId;  // 🔥 CRITICAL: Filter by campaign

    const contacts = await db.getContacts(userId, filter, parseInt(limit));

    // 如果有搜索关键词，进行过滤
    let filteredContacts = contacts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.position?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: {
        contacts: filteredContacts,
        total: filteredContacts.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取联系人列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取联系人列表失败'
    });
  }
});

// 添加单个联系人
router.post('/', async (req, res) => {
  try {
    const contactData = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 验证必需字段
    if (!contactData.email) {
      return res.status(400).json({
        success: false,
        error: '邮箱地址是必需的'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    const contactId = await db.saveContact({
      ...contactData,
      source: contactData.source || 'manual'
    }, userId, contactData.campaignId || null);

    res.json({
      success: true,
      data: {
        id: contactId,
        ...contactData,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('添加联系人失败:', error);

    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: '该邮箱地址已存在'
      });
    }

    res.status(500).json({
      success: false,
      error: '添加联系人失败'
    });
  }
});

// 批量导入联系人（CSV）
router.post('/import/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择CSV文件'
      });
    }

    const campaignId = req.body.campaignId || null;  // 🔥 Get campaign ID from request
    const results = [];
    const errors = [];
    let processedCount = 0;
    let successCount = 0;

    // 读取CSV文件
    fs.createReadStream(req.file.path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase()
      }))
      .on('data', async (row) => {
        try {
          processedCount++;
          
          // 验证必需字段
          if (!row.email || !row.email.trim()) {
            errors.push({
              row: processedCount,
              error: '邮箱地址不能为空'
            });
            return;
          }

          // 规范化数据
          const contact = {
            email: row.email.trim(),
            name: row.name || row['姓名'] || '',
            company: row.company || row['公司'] || '',
            position: row.position || row['职位'] || '',
            industry: row.industry || row['行业'] || '',
            phone: row.phone || row['电话'] || '',
            address: row.address || row['地址'] || '',
            source: 'csv_import',
            tags: row.tags || row['标签'] || '',
            notes: row.notes || row['备注'] || ''
          };

          const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
          await db.saveContact(contact, userId, campaignId);
          successCount++;
          results.push(contact);

        } catch (error) {
          errors.push({
            row: processedCount,
            email: row.email,
            error: error.message
          });
        }
      })
      .on('end', () => {
        // 清理临时文件
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          data: {
            totalProcessed: processedCount,
            successCount: successCount,
            errorCount: errors.length,
            errors: errors.slice(0, 10), // 只返回前10个错误
            importedContacts: results.slice(0, 5) // 只返回前5个成功导入的联系人作为示例
          }
        });
      })
      .on('error', (error) => {
        // 清理临时文件
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
          success: false,
          error: 'CSV文件解析失败: ' + error.message
        });
      });

  } catch (error) {
    console.error('CSV导入失败:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'CSV导入失败'
    });
  }
});

// 从网站搜索导入联系人
router.post('/import/search', async (req, res) => {
  try {
    const { searchResults, source = 'website_search', campaignId = null } = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    if (!searchResults || !Array.isArray(searchResults)) {
      return res.status(400).json({
        success: false,
        error: '搜索结果数据格式不正确'
      });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const result of searchResults) {
      try {
        if (!result.email) {
          results.skipped++;
          continue;
        }

        const contact = {
          email: result.email,
          name: result.name || '',
          company: result.company || '',
          position: result.position || '',
          industry: result.industry || '',
          phone: result.phone || '',
          address: result.address || '',
          source: source,
          tags: result.tags || '',
          notes: result.notes || `从网站导入: ${result.website || ''}`
        };

        await db.saveContact(contact, userId, campaignId);
        results.imported++;

      } catch (error) {
        results.errors.push({
          email: result.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('搜索结果导入失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索结果导入失败'
    });
  }
});

// 更新联系人
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    // 检查联系人是否存在
    const contacts = await db.getContacts(userId, {}, 1000);
    const existingContact = contacts.find(c => c.id === parseInt(id));

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        error: '联系人不存在'
      });
    }

    // 如果更新邮箱，验证格式
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({
          success: false,
          error: '邮箱格式不正确'
        });
      }
    }

    // 合并更新数据
    const updatedContact = {
      ...existingContact,
      ...updateData
    };

    // Preserve campaignId from existing contact
    const campaignId = existingContact.campaign_id || updateData.campaignId || null;
    await db.saveContact(updatedContact, userId, campaignId);

    res.json({
      success: true,
      data: updatedContact
    });

  } catch (error) {
    console.error('更新联系人失败:', error);
    res.status(500).json({
      success: false,
      error: '更新联系人失败'
    });
  }
});

// 删除联系人（软删除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    const contacts = await db.getContacts(userId, {}, 1000);
    const contact = contacts.find(c => c.id === parseInt(id));

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: '联系人不存在'
      });
    }

    // 软删除：更新状态为已删除
    await db.saveContact({
      ...contact,
      status: 'deleted'
    }, userId, contact.campaign_id || null);

    res.json({
      success: true,
      message: '联系人已删除'
    });

  } catch (error) {
    console.error('删除联系人失败:', error);
    res.status(500).json({
      success: false,
      error: '删除联系人失败'
    });
  }
});

// 批量操作联系人
router.post('/batch', async (req, res) => {
  try {
    const { action, contactIds, updateData } = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    if (!action || !contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的批量操作参数'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const contacts = await db.getContacts(userId, {}, 1000);

    for (const contactId of contactIds) {
      try {
        const contact = contacts.find(c => c.id === parseInt(contactId));

        if (!contact) {
          results.failed++;
          results.errors.push({
            contactId,
            error: '联系人不存在'
          });
          continue;
        }

        let updatedContact = { ...contact };

        switch (action) {
          case 'delete':
            updatedContact.status = 'deleted';
            break;
          case 'update':
            updatedContact = { ...updatedContact, ...updateData };
            break;
          case 'tag':
            const existingTags = updatedContact.tags ? updatedContact.tags.split(',') : [];
            const newTags = updateData.tags ? updateData.tags.split(',') : [];
            updatedContact.tags = [...new Set([...existingTags, ...newTags])].join(',');
            break;
          default:
            throw new Error('不支持的批量操作类型');
        }

        await db.saveContact(updatedContact, userId, updatedContact.campaign_id || null);
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          contactId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({
      success: false,
      error: '批量操作失败'
    });
  }
});

// 导出联系人为CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { industry, company, status = 'active' } = req.query;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    let filter = { status };
    if (industry) filter.industry = industry;
    if (company) filter.company = company;

    const contacts = await db.getContacts(userId, filter, 10000);

    // 生成CSV内容
    const csvWriter = require('csv-writer').createObjectCsvStringifier({
      header: [
        { id: 'email', title: '邮箱' },
        { id: 'name', title: '姓名' },
        { id: 'company', title: '公司' },
        { id: 'position', title: '职位' },
        { id: 'industry', title: '行业' },
        { id: 'phone', title: '电话' },
        { id: 'address', title: '地址' },
        { id: 'tags', title: '标签' },
        { id: 'notes', title: '备注' },
        { id: 'created_at', title: '创建时间' }
      ]
    });

    const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(contacts);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send('\ufeff' + csvString); // 添加BOM以支持Excel中文显示

  } catch (error) {
    console.error('导出联系人失败:', error);
    res.status(500).json({
      success: false,
      error: '导出联系人失败'
    });
  }
});

// 获取联系人统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const contacts = await db.getContacts(userId, {}, 10000);
    
    const stats = {
      total: contacts.filter(c => c.status === 'active').length,
      byIndustry: {},
      bySource: {},
      recentAdded: contacts.filter(c => {
        const createdAt = new Date(c.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdAt > weekAgo;
      }).length
    };

    // 按行业统计
    contacts.forEach(contact => {
      if (contact.status === 'active' && contact.industry) {
        stats.byIndustry[contact.industry] = (stats.byIndustry[contact.industry] || 0) + 1;
      }
    });

    // 按来源统计
    contacts.forEach(contact => {
      if (contact.status === 'active' && contact.source) {
        stats.bySource[contact.source] = (stats.bySource[contact.source] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取联系人统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取联系人统计失败'
    });
  }
});

module.exports = router;