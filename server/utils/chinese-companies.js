// 中国企业数据搜索工具
// 这里可以集成企查查、天眼查等API
const axios = require('axios');

class ChineseCompanySearcher {
  constructor() {
    this.qichachaApiKey = process.env.QICHACHA_API_KEY;
    this.tianyanchaApiKey = process.env.TIANYANCHA_API_KEY;
  }

  // 搜索中国企业信息
  async searchCompanies(query) {
    try {
      // 这里应该调用真实的企业信息API
      // 目前返回模拟数据
      const mockResults = this.generateMockCompanies(query);
      return mockResults;
    } catch (error) {
      console.error('企业搜索失败:', error);
      throw error;
    }
  }

  // 按行业搜索企业
  async searchByIndustry(industry, location = '', limit = 50) {
    try {
      const results = this.generateMockCompaniesByIndustry(industry, location, limit);
      return results;
    } catch (error) {
      console.error('按行业搜索失败:', error);
      throw error;
    }
  }

  // 生成模拟企业数据
  generateMockCompanies(query) {
    const industries = ['科技', '金融', '制造业', '医疗', '教育', '房地产', '零售'];
    const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安'];
    const suffixes = ['有限公司', '股份有限公司', '科技有限公司', '投资有限公司'];

    const companies = [];
    for (let i = 0; i < 20; i++) {
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const companyName = `${city}${query || '示例'}${industry}${suffix}`;

      companies.push({
        name: companyName,
        industry: industry,
        location: city,
        registeredCapital: `${Math.floor(Math.random() * 10000) + 100}万元`,
        establishDate: this.generateRandomDate(),
        businessScope: this.generateBusinessScope(industry),
        website: `https://www.${this.pinyin(companyName.slice(0, 6))}.com`,
        email: `business@${this.pinyin(companyName.slice(0, 6))}.com`,
        phone: this.generatePhone(),
        address: `${city}市${this.generateAddress()}`,
        legalPerson: this.generateChineseName(),
        employeeRange: this.generateEmployeeRange(),
        riskLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
      });
    }

    return {
      total: companies.length,
      companies: companies
    };
  }

  generateMockCompaniesByIndustry(industry, location, limit) {
    const companies = [];
    for (let i = 0; i < Math.min(limit, 50); i++) {
      const cityPrefix = location || ['北京', '上海', '深圳', '广州'][Math.floor(Math.random() * 4)];
      const suffixes = ['有限公司', '股份有限公司', '科技有限公司'];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      companies.push({
        name: `${cityPrefix}${industry}${Math.floor(Math.random() * 999) + 1}${suffix}`,
        industry: industry,
        location: cityPrefix,
        registeredCapital: `${Math.floor(Math.random() * 5000) + 100}万元`,
        establishDate: this.generateRandomDate(),
        email: this.generateCompanyEmail(),
        phone: this.generatePhone(),
        website: `https://www.company${i + 1}.com.cn`,
        employeeRange: this.generateEmployeeRange(),
        riskLevel: Math.random() > 0.7 ? 'medium' : 'low'
      });
    }

    return {
      total: companies.length,
      companies: companies
    };
  }

  // 辅助函数
  generateRandomDate() {
    const start = new Date(1990, 0, 1);
    const end = new Date(2020, 11, 31);
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
  }

  generateBusinessScope(industry) {
    const scopes = {
      '科技': '软件开发；技术服务；计算机系统集成；互联网信息服务',
      '金融': '投资咨询；资产管理；金融信息服务；融资担保',
      '制造业': '机械设备制造；金属制品生产；工业自动化设备研发',
      '医疗': '医疗器械销售；健康咨询服务；医药技术开发',
      '教育': '教育培训；在线教育服务；教育软件开发',
      '房地产': '房地产开发；物业管理；房地产经纪服务',
      '零售': '商品零售；电子商务；供应链管理服务'
    };
    return scopes[industry] || '一般经营项目';
  }

  generateChineseName() {
    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋'];
    return surnames[Math.floor(Math.random() * surnames.length)] + 
           names[Math.floor(Math.random() * names.length)];
  }

  generatePhone() {
    const prefixes = ['138', '139', '150', '151', '152', '188', '189'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + number;
  }

  generateAddress() {
    const districts = ['朝阳区', '海淀区', '丰台区', '西城区', '东城区', '昌平区'];
    const streets = ['中关村大街', '建国门大街', '长安街', '王府井大街', '西单大街'];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${district}${street}${number}号`;
  }

  generateCompanyEmail() {
    const domains = ['company.com.cn', 'corp.cn', 'group.com.cn', 'tech.cn'];
    const prefixes = ['info', 'business', 'contact', 'sales', 'service'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}@${domain}`;
  }

  generateEmployeeRange() {
    const ranges = ['10-49人', '50-99人', '100-299人', '300-999人', '1000-4999人', '5000人以上'];
    return ranges[Math.floor(Math.random() * ranges.length)];
  }

  // 简单的拼音转换（实际应用中应使用专业库）
  pinyin(chinese) {
    return chinese.replace(/[\u4e00-\u9fa5]/g, () => 
      Math.random().toString(36).substring(2, 5)
    ).toLowerCase();
  }

  // 根据网站域名搜索企业信息
  async searchByDomain(domain) {
    try {
      // 这里应该调用实际的API来根据域名查找企业信息
      // 目前返回模拟数据
      const mockCompany = {
        name: `${domain.split('.')[0]}科技有限公司`,
        domain: domain,
        industry: '科技',
        location: '北京',
        email: `contact@${domain}`,
        phone: this.generatePhone(),
        registeredCapital: '1000万元',
        establishDate: this.generateRandomDate()
      };

      return mockCompany;
    } catch (error) {
      console.error('域名查询失败:', error);
      throw error;
    }
  }

  // 验证邮箱格式
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 批量验证邮箱是否存在
  async validateEmails(emails) {
    // 这里应该实现邮箱验证逻辑
    // 可以使用SMTP验证或第三方服务
    const results = emails.map(email => ({
      email: email,
      valid: this.validateEmail(email),
      exists: Math.random() > 0.2 // 模拟80%的邮箱存在
    }));

    return results;
  }
}

module.exports = ChineseCompanySearcher;