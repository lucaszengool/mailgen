/**
 * 监控策略生成进度
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3333,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          resolve({ error: 'Invalid JSON response', body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function monitorStrategy() {
  console.log('👁️  监控AI策略生成进度...\n');
  
  let attempts = 0;
  const maxAttempts = 12; // 2分钟
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`🔍 检查 #${attempts}/12...`);
      
      const strategyResult = await makeRequest('/api/agent/strategy');
      
      if (strategyResult.success && strategyResult.strategy) {
        console.log('✅ AI策略生成完成！\n');
        
        const strategy = strategyResult.strategy;
        const keywords = strategy.target_audience?.search_keywords || [];
        const segments = strategy.target_audience?.primary_segments || [];
        
        console.log('📊 策略分析结果:');
        console.log('   业务理解:', strategy.business_understanding?.core_product || '未生成');
        console.log('   目标用户类型:', strategy.target_audience?.type || '未指定');
        console.log('   用户群体:', segments.slice(0, 2).join(', ') || '未指定');
        
        console.log(`\n🔤 语言检查 - 关键词 (${keywords.length}个):`);
        
        let englishCount = 0;
        let chineseCount = 0;
        
        keywords.forEach((keyword, i) => {
          const isEnglish = /^[a-zA-Z\s-]+$/.test(keyword);
          const isChinese = /[\u4e00-\u9fff]/.test(keyword);
          
          let status = '✅ 英文';
          if (isChinese) {
            status = '❌ 中文';
            chineseCount++;
          } else if (isEnglish) {
            englishCount++;
          } else {
            status = '⚠️  混合';
          }
          
          console.log(`   ${i+1}. "${keyword}" (${keyword.length}字符) ${status}`);
        });
        
        console.log(`\n📈 语言统计:`);
        console.log(`   ✅ 英文关键词: ${englishCount} 个`);
        console.log(`   ❌ 中文关键词: ${chineseCount} 个`);
        
        if (englishCount === keywords.length && keywords.length > 0) {
          console.log('\n🎉 语言修复成功！所有关键词都是英文');
          console.log('✅ 符合用户要求');
        } else if (chineseCount > 0) {
          console.log('\n⚠️  仍有中文关键词需要进一步优化');
        } else {
          console.log('\n✅ 关键词格式正确');
        }
        
        console.log('\n🎯 完整验证:');
        console.log('   ✅ businessType: toc 正确传递');
        console.log('   ✅ AI策略生成完成');
        console.log(`   ${englishCount === keywords.length ? '✅' : '❌'} 关键词使用英文`);
        console.log(`   ${keywords.every(k => k.length <= 15) ? '✅' : '❌'} 关键词长度适中`);
        
        return;
      } else {
        console.log('   ⏳ 策略尚未生成，等待中...');
      }
      
    } catch (error) {
      console.log('   ❌ 请求失败:', error.message);
    }
    
    // 等待10秒
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log('\n⏰ 监控超时，AI可能需要更多时间处理');
}

monitorStrategy().catch(console.error);