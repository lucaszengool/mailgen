import { useState } from 'react'
import { MagnifyingGlassIcon, BuildingOfficeIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ChineseMarketSearch() {
  const [searchType, setSearchType] = useState('industry')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [keywords, setKeywords] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [selectedCompanies, setSelectedCompanies] = useState([])

  const industries = [
    '科技', '金融', '制造业', '医疗', '教育', '房地产', 
    '零售', '物流', '建筑', '能源', '农业', '娱乐'
  ]

  const locations = [
    '北京', '上海', '深圳', '广州', '杭州', '南京',
    '成都', '武汉', '西安', '苏州', '天津', '重庆'
  ]

  const handleSearch = async () => {
    if (searchType === 'industry' && !industry) {
      toast.error('请选择行业')
      return
    }
    
    if (searchType === 'keywords' && !keywords.trim()) {
      toast.error('请输入关键词')
      return
    }
    
    if (searchType === 'domain' && !domain.trim()) {
      toast.error('请输入域名')
      return
    }

    setLoading(true)
    try {
      let endpoint = ''
      let body = {}

      if (searchType === 'domain') {
        endpoint = '/api/scraper/search-by-domain'
        body = { domain: domain.trim() }
      } else {
        endpoint = '/api/scraper/search-chinese-emails'
        body = {
          industry: searchType === 'industry' ? industry : '',
          location: location,
          keywords: searchType === 'keywords' ? keywords.trim() : ''
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      
      if (data.success) {
        if (searchType === 'domain') {
          setSearchResults({
            total: 1,
            companies: [data.data]
          })
        } else {
          setSearchResults(data.data)
        }
        toast.success(`找到 ${data.data.total || 1} 家企业`)
      } else {
        toast.error(data.error || '搜索失败')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCompany = (company, checked) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, company])
    } else {
      setSelectedCompanies(selectedCompanies.filter(c => c.name !== company.name))
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCompanies([...searchResults.companies])
    } else {
      setSelectedCompanies([])
    }
  }

  const importSelected = async () => {
    if (selectedCompanies.length === 0) {
      toast.error('请选择要导入的企业')
      return
    }

    try {
      const contacts = selectedCompanies.map(company => ({
        email: company.email,
        name: company.legalPerson || '',
        company: company.name,
        industry: company.industry,
        phone: company.phone,
        address: company.address,
        source: 'chinese_market_search',
        notes: `注册资本: ${company.registeredCapital}, 成立时间: ${company.establishDate}`
      }))

      const response = await fetch('/api/contacts/import/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResults: contacts,
          source: 'chinese_market_search'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`成功导入 ${data.data.imported} 个联系人`)
        setSelectedCompanies([])
      } else {
        toast.error('导入失败')
      }
    } catch (error) {
      toast.error('导入失败')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">中国市场搜索</h1>
        <p className="mt-2 text-primary-600">搜索中国企业信息，发现潜在客户</p>
      </div>

      {/* Search Form */}
      <div className="card">
        <div className="space-y-6">
          {/* Search Type Selector */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-3">搜索类型</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSearchType('industry')}
                className={`p-4 border-2 rounded-lg transition-colors duration-200 ${
                  searchType === 'industry'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-primary-200 hover:border-primary-300'
                }`}
              >
                <BuildingOfficeIcon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="font-medium text-primary-900">按行业搜索</p>
                <p className="text-sm text-primary-600">搜索特定行业的企业</p>
              </button>
              
              <button
                onClick={() => setSearchType('keywords')}
                className={`p-4 border-2 rounded-lg transition-colors duration-200 ${
                  searchType === 'keywords'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-primary-200 hover:border-primary-300'
                }`}
              >
                <MagnifyingGlassIcon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="font-medium text-primary-900">关键词搜索</p>
                <p className="text-sm text-primary-600">使用关键词查找企业</p>
              </button>
              
              <button
                onClick={() => setSearchType('domain')}
                className={`p-4 border-2 rounded-lg transition-colors duration-200 ${
                  searchType === 'domain'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-primary-200 hover:border-primary-300'
                }`}
              >
                <UserGroupIcon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="font-medium text-primary-900">域名查询</p>
                <p className="text-sm text-primary-600">通过网站域名查找企业</p>
              </button>
            </div>
          </div>

          {/* Search Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchType === 'industry' && (
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-primary-700 mb-2">
                  行业 *
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="input-field"
                >
                  <option value="">选择行业</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            )}

            {searchType === 'keywords' && (
              <div>
                <label htmlFor="keywords" className="block text-sm font-medium text-primary-700 mb-2">
                  关键词 *
                </label>
                <input
                  type="text"
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="input-field"
                  placeholder="例如：人工智能、新能源"
                />
              </div>
            )}

            {searchType === 'domain' && (
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-primary-700 mb-2">
                  网站域名 *
                </label>
                <input
                  type="text"
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="input-field"
                  placeholder="example.com"
                />
              </div>
            )}

            {(searchType === 'industry' || searchType === 'keywords') && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-primary-700 mb-2">
                  地区 (可选)
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                >
                  <option value="">不限地区</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-primary-200">
            <div className="text-sm text-primary-600">
              支持搜索全国范围内的工商注册企业信息
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary flex items-center space-x-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner h-4 w-4"></div>
                  <span>搜索中...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>开始搜索</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6 animate-slide-up">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-primary-900">
                搜索结果 ({searchResults.total} 家企业)
              </h3>
              {selectedCompanies.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-primary-600">
                    已选择 {selectedCompanies.length} 家
                  </span>
                  <button
                    onClick={importSelected}
                    className="btn-primary text-sm px-3 py-1.5"
                  >
                    导入选中的企业
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === searchResults.companies.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      企业名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      行业
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      地区
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      联系方式
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      注册资本
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                      成立时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-200">
                  {searchResults.companies.map((company, index) => (
                    <tr key={index} className="table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.some(c => c.name === company.name)}
                          onChange={(e) => handleSelectCompany(company, e.target.checked)}
                          className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-primary-900">
                            {company.name}
                          </div>
                          {company.website && (
                            <div className="text-sm text-primary-500">
                              <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {company.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {company.industry}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 text-primary-400 mr-1" />
                          <span className="text-sm text-primary-900">{company.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary-900 space-y-1">
                          {company.email && (
                            <div className="font-mono">{company.email}</div>
                          )}
                          {company.phone && (
                            <div>{company.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-900">{company.registeredCapital}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-900">{company.establishDate}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">💡 搜索提示</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-700">
          <div>
            <h4 className="font-medium mb-2">行业搜索:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-600">
              <li>选择具体的行业类别</li>
              <li>可配合地区进行精准定位</li>
              <li>返回该行业的代表性企业</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">关键词搜索:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-600">
              <li>支持产品名称、技术词汇</li>
              <li>建议使用2-4个字的关键词</li>
              <li>可组合使用多个关键词</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">域名查询:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-600">
              <li>输入完整的域名（不含http://）</li>
              <li>可查询企业的详细工商信息</li>
              <li>适用于竞品分析和客户研究</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">数据说明:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-600">
              <li>数据来源于工商注册信息</li>
              <li>邮箱地址基于企业网站分析</li>
              <li>建议验证后再进行邮件营销</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}