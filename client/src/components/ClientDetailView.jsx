import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Clock,
  Reply,
  Send,
  Eye,
  Calendar,
  Building,
  Globe,
  Phone,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Archive,
  Star,
  Flag,
  MoreHorizontal,
  Download,
  User,
  Activity
} from 'lucide-react';
import EmailComposer from './EmailComposer';

const ClientDetailView = ({ client, onBack, onUpdateClient }) => {
  const [emailHistory, setEmailHistory] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [clientNotes, setClientNotes] = useState([]);

  useEffect(() => {
    if (client) {
      loadClientData();
    }
  }, [client]);

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      
      // Load email history
      const historyResponse = await fetch(`/api/agent/clients/${client.id}/emails`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setEmailHistory(historyData);
      }

      // Load client notes
      const notesResponse = await fetch(`/api/agent/clients/${client.id}/notes`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setClientNotes(notesData);
      }

    } catch (error) {
      console.error('Failed to load client data:', error);
      // Mock data for development
      setEmailHistory(generateMockEmailHistory());
      setClientNotes(generateMockNotes());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockEmailHistory = () => {
    return [
      {
        id: 1,
        type: 'sent',
        subject: '🐾 Partnership Opportunity for ' + client.name + ' - AI Pet Services',
        content: `<div>Hi there! I hope this email finds you well. I came across ${client.name} while researching innovative businesses in the ${client.industry} space...</div>`,
        timestamp: '2025-01-13T10:30:00Z',
        status: 'delivered',
        opens: 2,
        clicks: 1,
        from: 'PETPO Partnership Team <partnership@petpoofficial.org>',
        to: client.email
      },
      {
        id: 2,
        type: 'received',
        subject: 'Re: Partnership Opportunity for ' + client.name + ' - AI Pet Services',
        content: client.lastReply || '我们对这个合作机会很感兴趣，能否提供更多详细信息？',
        timestamp: '2025-01-13T14:20:00Z',
        status: 'read',
        from: client.email,
        to: 'partnership@petpoofficial.org'
      },
      {
        id: 3,
        type: 'sent',
        subject: 'Re: Partnership Opportunity - Detailed Information & Demo',
        content: `<div>Thank you for your interest! I'm excited to share more details about our AI pet portrait technology...</div>`,
        timestamp: '2025-01-13T15:45:00Z',
        status: 'delivered',
        opens: 1,
        clicks: 0,
        from: 'PETPO Partnership Team <partnership@petpoofficial.org>',
        to: client.email
      }
    ];
  };

  const generateMockNotes = () => {
    return [
      {
        id: 1,
        content: `${client.industry}行业的${client.businessSize === 'small' ? '小型' : client.businessSize === 'medium' ? '中型' : '大型'}企业，对AI宠物肖像服务表现出高度兴趣。`,
        type: 'system',
        timestamp: '2025-01-13T10:30:00Z',
        author: 'AI Agent'
      },
      {
        id: 2,
        content: '客户回复积极，询问了定价和实施细节。建议安排演示通话。',
        type: 'insight',
        timestamp: '2025-01-13T14:25:00Z',
        author: 'AI Agent'
      }
    ];
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/agent/clients/${client.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          type: 'manual',
          author: 'User'
        })
      });

      if (response.ok) {
        setNewNote('');
        loadClientData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      // Add note locally for demo
      const note = {
        id: Date.now(),
        content: newNote,
        type: 'manual',
        timestamp: new Date().toISOString(),
        author: 'User'
      };
      setClientNotes([note, ...clientNotes]);
      setNewNote('');
    }
  };

  const updateClientStatus = async (newStatus) => {
    try {
      const response = await fetch(`/api/agent/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok && onUpdateClient) {
        onUpdateClient({ ...client, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update client status:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      prospects: 'bg-blue-100 text-blue-800 border-blue-200',
      engaged: 'bg-green-100 text-green-800 border-green-200',
      interested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      not_interested: 'bg-red-100 text-red-800 border-red-200',
      converted: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      prospects: '潜在客户',
      engaged: '已回复',
      interested: '有兴趣',
      not_interested: '无兴趣',
      converted: '已转化'
    };
    return labels[status] || status;
  };

  const getEmailTypeIcon = (type, status) => {
    if (type === 'sent') {
      return status === 'delivered' ? <Send className="w-4 h-4 text-green-600" /> : <Send className="w-4 h-4 text-gray-400" />;
    } else {
      return <Reply className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNoteTypeColor = (type) => {
    const colors = {
      system: 'bg-blue-50 border-blue-200',
      insight: 'bg-yellow-50 border-yellow-200',
      manual: 'bg-green-50 border-green-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const getNoteTypeIcon = (type) => {
    if (type === 'system') return <Activity className="w-4 h-4 text-blue-600" />;
    if (type === 'insight') return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    return <User className="w-4 h-4 text-green-600" />;
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">未找到客户</h2>
          <p className="text-gray-500">请选择一个客户查看详情</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载客户详情...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回客户列表</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <select
                value={client.status}
                onChange={(e) => updateClientStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="prospects">潜在客户</option>
                <option value="engaged">已回复</option>
                <option value="interested">有兴趣</option>
                <option value="not_interested">无兴趣</option>
                <option value="converted">已转化</option>
              </select>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-semibold text-blue-800">
                  {client.name.charAt(0)}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(client.status)}`}>
                  {getStatusLabel(client.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{client.industry} • {client.businessSize === 'small' ? '小型' : client.businessSize === 'medium' ? '中型' : '大型'}企业</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>首次联系: {formatTimestamp(client.lastContact)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>转化概率: {client.conversionProbability}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">邮件历史</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      总计 {emailHistory.length} 封邮件
                    </span>
                    <button
                      onClick={() => setShowCompose(!showCompose)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      写邮件
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {emailHistory.map((email, index) => (
                  <div key={email.id} className="p-6 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getEmailTypeIcon(email.type, email.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {email.subject}
                            </h3>
                            {email.type === 'sent' && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                {email.opens > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Eye className="w-3 h-3" />
                                    <span>{email.opens}</span>
                                  </span>
                                )}
                                {email.clicks > 0 && (
                                  <span className="flex items-center space-x-1 ml-2">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{email.clicks}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(email.timestamp)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          <div><strong>From:</strong> {email.from}</div>
                          <div><strong>To:</strong> {email.to}</div>
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          {email.type === 'sent' ? (
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: email.content }}
                            />
                          ) : (
                            <div className="bg-gray-50 p-3 rounded-lg italic">
                              "{email.content}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Notes and Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">互动统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{client.emailsSent}</div>
                  <div className="text-xs text-gray-500">发送邮件</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{client.repliesReceived}</div>
                  <div className="text-xs text-gray-500">收到回复</div>
                </div>
                <div className="text-center col-span-2">
                  <div className="text-2xl font-bold text-purple-600">{client.conversionProbability}%</div>
                  <div className="text-xs text-gray-500">转化概率</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">客户备注</h3>
              </div>
              
              {/* Add Note */}
              <div className="p-4 border-b border-gray-100">
                <div className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="添加备注..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    添加备注
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="max-h-64 overflow-y-auto">
                {clientNotes.map(note => (
                  <div key={note.id} className={`p-4 border-b border-gray-100 last:border-b-0 ${getNoteTypeColor(note.type)}`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNoteTypeIcon(note.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{note.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{note.author}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(note.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {clientNotes.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">暂无备注</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        recipient={client}
        onSend={(emailData) => {
          // Refresh email history after sending
          loadClientData();
        }}
      />
    </div>
  );
};

export default ClientDetailView;