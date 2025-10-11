import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState([])

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      if (data.success) {
        setContacts(data.data.contacts)
      }
    } catch (error) {
      console.error('获取联系人失败:', error)
      toast.error('加载联系人失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesIndustry = !selectedIndustry || contact.industry === selectedIndustry
    
    return matchesSearch && matchesIndustry
  })

  const industries = [...new Set(contacts.map(c => c.industry).filter(Boolean))]

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedContacts(filteredContacts.map(c => c.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleSelectContact = (contactId, checked) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId])
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId))
    }
  }

  const exportContacts = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedIndustry) params.append('industry', selectedIndustry)
      
      const response = await fetch(`/api/contacts/export/csv?${params}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'contacts.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('联系人导出成功')
    } catch (error) {
      toast.error('导出失败')
    }
  }

  const deleteContact = async (contactId) => {
    if (!confirm('确定要删除这个联系人吗？')) return
    
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        toast.success('联系人删除成功')
        fetchContacts()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  const batchDelete = async () => {
    if (selectedContacts.length === 0) {
      toast.error('请选择要删除的联系人')
      return
    }
    
    if (!confirm(`确定要删除选中的 ${selectedContacts.length} 个联系人吗？`)) return
    
    try {
      const response = await fetch('/api/contacts/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          contactIds: selectedContacts
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`成功删除 ${data.data.success} 个联系人`)
        setSelectedContacts([])
        fetchContacts()
      } else {
        toast.error('批量删除失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
        <span className="ml-2 text-primary-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">联系人管理</h1>
          <p className="mt-2 text-primary-600">管理您的潜在客户和联系人信息</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
            <span>导入</span>
          </button>
          <button
            onClick={exportContacts}
            className="btn-secondary flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>导出</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>添加联系人</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">总联系人</p>
              <p className="text-2xl font-bold text-primary-900">{contacts.length}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-100">
              <UserGroupIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">活跃联系人</p>
              <p className="text-2xl font-bold text-success-600">
                {contacts.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning-100">
              <UserGroupIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">行业数量</p>
              <p className="text-2xl font-bold text-warning-600">{industries.length}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">本周新增</p>
              <p className="text-2xl font-bold text-primary-600">
                {contacts.filter(c => {
                  const createdAt = new Date(c.created_at)
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  return createdAt > weekAgo
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-primary-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full md:w-80"
                placeholder="搜索姓名、邮箱或公司..."
              />
            </div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="input-field w-full md:w-40"
            >
              <option value="">所有行业</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          
          {selectedContacts.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-primary-600">已选择 {selectedContacts.length} 个</span>
              <button
                onClick={batchDelete}
                className="btn-danger text-sm px-3 py-1.5"
              >
                批量删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  公司
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  职位
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  行业
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  来源
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="table-row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                      className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-primary-900">
                          {contact.name || '未知'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary-900 font-mono">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary-900">{contact.company || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary-900">{contact.position || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {contact.industry || '其他'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-primary-500">{contact.source || 'manual'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-primary-600 hover:text-primary-900">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteContact(contact.id)}
                      className="text-error-600 hover:text-error-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-primary-300" />
              <h3 className="mt-4 text-lg font-medium text-primary-900">
                {searchTerm || selectedIndustry ? '没有找到匹配的联系人' : '还没有联系人'}
              </h3>
              <p className="mt-2 text-primary-600">
                {searchTerm || selectedIndustry ? '尝试调整搜索条件' : '添加您的第一个联系人开始吧'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onSuccess={fetchContacts} />}

      {/* Import Modal */}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onSuccess={fetchContacts} />}
    </div>
  )
}

// Add Contact Modal Component
function AddContactModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    position: '',
    industry: '',
    phone: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email) {
      toast.error('邮箱地址是必需的')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('联系人添加成功')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || '添加失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold text-primary-900 mb-4">添加联系人</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">邮箱地址 *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">公司</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">职位</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">行业</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">电话</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="input-field resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Import Modal Component
function ImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('请选择CSV文件')
      return
    }

    const formData = new FormData()
    formData.append('csvFile', file)

    setLoading(true)
    try {
      const response = await fetch('/api/contacts/import/csv', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`导入成功：${data.data.successCount} 个联系人`)
        if (data.data.errorCount > 0) {
          toast.error(`${data.data.errorCount} 个联系人导入失败`)
        }
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || '导入失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <form onSubmit={handleFileUpload} className="p-6">
          <h2 className="text-xl font-bold text-primary-900 mb-4">导入联系人</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                CSV文件
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            
            <div className="text-sm text-primary-600">
              <p className="mb-2">CSV文件格式要求：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>必须包含 email 列</li>
                <li>可选列：name, company, position, industry, phone</li>
                <li>第一行应为列标题</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" disabled={loading || !file} className="btn-primary">
              {loading ? '导入中...' : '导入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}