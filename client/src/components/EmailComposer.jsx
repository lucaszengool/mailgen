import React, { useState, useRef } from 'react';
import {
  X,
  Send,
  Paperclip,
  Image,
  Video,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  List,
  Link,
  Smile,
  Save,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmailComposer = ({ isOpen, onClose, recipient, onSend }) => {
  const [emailData, setEmailData] = useState({
    to: recipient?.email || '',
    subject: '',
    content: '',
    attachments: []
  });
  const [isSending, setIsSending] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!emailData.to || !emailData.subject || !emailData.content) {
      toast.error('请填写完整的邮件信息');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/agent/clients/${recipient.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: emailData.subject,
          content: emailData.content,
          attachments: emailData.attachments
        }),
      });

      if (response.ok) {
        toast.success('邮件发送成功！');
        onSend && onSend(emailData);
        onClose();
        setEmailData({ to: '', subject: '', content: '', attachments: [] });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '邮件发送失败');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('发送失败，请检查网络连接');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (files, type = 'file') => {
    const newAttachments = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      type,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (attachmentId) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const insertAtCursor = (text) => {
    const textarea = document.getElementById('email-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = emailData.content;
    
    setEmailData(prev => ({
      ...prev,
      content: content.substring(0, start) + text + content.substring(end)
    }));
  };

  const formatContent = (tag) => {
    const textarea = document.getElementById('email-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = emailData.content.substring(start, end);
    
    if (selectedText) {
      const formattedText = `<${tag}>${selectedText}</${tag}>`;
      const newContent = emailData.content.substring(0, start) + formattedText + emailData.content.substring(end);
      setEmailData(prev => ({ ...prev, content: newContent }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            写邮件给 {recipient?.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <Eye size={16} />
              {isPreview ? '编辑' : '预览'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Email Form */}
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">收件人</label>
            <input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="recipient@example.com"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="邮件主题..."
            />
          </div>

          {/* Formatting Toolbar */}
          {!isPreview && (
            <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
              <button
                onClick={() => formatContent('strong')}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-200"
                title="粗体"
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() => formatContent('em')}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-200"
                title="斜体"
              >
                <Italic size={16} />
              </button>
              <button
                onClick={() => formatContent('u')}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-200"
                title="下划线"
              >
                <Underline size={16} />
              </button>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <button
                onClick={() => insertAtCursor('\n• ')}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-200"
                title="项目符号"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => insertAtCursor('<a href="">链接</a>')}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-200"
                title="插入链接"
              >
                <Link size={16} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">邮件内容</label>
            {isPreview ? (
              <div 
                className="w-full h-full p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-auto"
                dangerouslySetInnerHTML={{ __html: emailData.content }}
              />
            ) : (
              <div
                className={`relative ${isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                  id="email-content"
                  value={emailData.content}
                  onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="邮件内容... (支持HTML格式，可拖拽文件上传)"
                />
                {isDragOver && (
                  <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center rounded-lg">
                    <p className="text-blue-600 font-medium">释放文件以上传</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          {emailData.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">附件</label>
              <div className="space-y-2">
                {emailData.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    {attachment.type === 'image' && (
                      <img src={attachment.url} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    {attachment.type === 'video' && (
                      <video src={attachment.url} className="w-8 h-8 object-cover rounded" />
                    )}
                    {attachment.type === 'file' && (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Paperclip size={14} />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 text-red-500 hover:text-red-700 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                multiple
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'image')}
                className="hidden"
                multiple
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e.target.files, 'video')}
                className="hidden"
                multiple
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="添加附件"
              >
                <Paperclip size={16} />
                附件
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="添加图片"
              >
                <Image size={16} />
                图片
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="添加视频"
              >
                <Video size={16} />
                视频
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !emailData.to || !emailData.subject || !emailData.content}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {isSending ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;