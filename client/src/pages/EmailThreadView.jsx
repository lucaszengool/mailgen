import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function EmailThreadView() {
  const { emailId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [thread, setThread] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const editorRef = useRef(null)

  useEffect(() => {
    fetchEmailThread()
  }, [emailId])

  const fetchEmailThread = async () => {
    try {
      setLoading(true)
      const userId = user?.id || 'anonymous'
      const response = await fetch(`/api/analytics/email-thread/${emailId}?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setThread(data.data)
      } else {
        toast.error(data.error || 'Failed to load email thread')
      }
    } catch (error) {
      console.error('Failed to fetch email thread:', error)
      toast.error('Failed to load email thread')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please write a reply message')
      return
    }

    try {
      setSending(true)
      const userId = user?.id || 'anonymous'

      const response = await fetch('/api/analytics/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          emailId,
          recipientEmail: thread.prospect.email,
          replyContent,
          originalSubject: thread.originalEmail.subject
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Reply sent successfully!')
        setReplyContent('')
        // Refresh thread to show new reply
        fetchEmailThread()
      } else {
        toast.error(data.error || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const updateContent = () => {
    const content = editorRef.current?.innerHTML || ''
    setReplyContent(content)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f5a0]"></div>
        <span className="ml-3 text-gray-600">Loading email thread...</span>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">Email thread not found</p>
        <button
          onClick={() => navigate('/analytics')}
          className="mt-4 px-4 py-2 bg-[#00f5a0] text-black rounded-lg hover:bg-[#00d68f]"
        >
          Back to Analytics
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/analytics')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Analytics
        </button>
      </div>

      {/* Prospect Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{thread.prospect.name}</h1>
            <p className="text-gray-600 mt-1">{thread.prospect.email}</p>
            {thread.prospect.company && (
              <p className="text-sm text-gray-500 mt-1">{thread.prospect.position} at {thread.prospect.company}</p>
            )}
          </div>

          {/* Email Stats */}
          <div className="flex space-x-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${thread.stats.opened ? 'bg-[#00f5a0]' : 'bg-gray-100'}`}>
                <EyeIcon className={`h-6 w-6 ${thread.stats.opened ? 'text-black' : 'text-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {thread.stats.opened ? `${thread.stats.openCount} opens` : 'Not opened'}
              </p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${thread.stats.clicked ? 'bg-[#00f5a0]' : 'bg-gray-100'}`}>
                <CursorArrowRaysIcon className={`h-6 w-6 ${thread.stats.clicked ? 'text-black' : 'text-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {thread.stats.clicked ? `${thread.stats.clickCount} clicks` : 'No clicks'}
              </p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${thread.stats.replied ? 'bg-[#00f5a0]' : 'bg-gray-100'}`}>
                <ChatBubbleLeftRightIcon className={`h-6 w-6 ${thread.stats.replied ? 'text-black' : 'text-gray-400'}`} />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {thread.stats.replied ? `${thread.stats.replyCount} replies` : 'No replies'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Thread History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversation History</h2>
          <p className="text-sm text-gray-600 mt-1">{thread.emails.length} message{thread.emails.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="divide-y divide-gray-200">
          {thread.emails.map((email, index) => (
            <div
              key={email.id || index}
              className={`p-6 ${email.type === 'sent' ? 'bg-white' : 'bg-blue-50'}`}
            >
              {/* Email Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    email.type === 'sent' ? 'bg-[#00f5a0]' : 'bg-blue-500'
                  }`}>
                    <span className="text-black font-semibold text-sm">
                      {email.type === 'sent' ? 'You' : email.from?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {email.type === 'sent' ? 'You' : thread.prospect.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {email.type === 'sent' ? `to ${thread.prospect.email}` : `from ${thread.prospect.email}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(email.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {email.type === 'sent' && (
                    <div className="flex items-center justify-end mt-1 space-x-2">
                      {email.delivered && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" title="Delivered" />
                      )}
                      {email.bounced && (
                        <XCircleIcon className="h-4 w-4 text-red-500" title="Bounced" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700">Subject: {email.subject}</p>
              </div>

              {/* Email Body */}
              <div
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: email.content }}
              />

              {/* Email Activity (for sent emails) */}
              {email.type === 'sent' && (email.opened || email.clicked) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Activity:</p>
                  <div className="flex flex-wrap gap-2">
                    {email.opened && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#00f5a0]/20 text-xs text-gray-700">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Opened {email.openCount}x
                        {email.lastOpenedAt && (
                          <span className="ml-1 text-gray-500">
                            • Last: {new Date(email.lastOpenedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </span>
                    )}
                    {email.clicked && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#00f5a0]/20 text-xs text-gray-700">
                        <CursorArrowRaysIcon className="h-3 w-3 mr-1" />
                        Clicked {email.clickCount}x
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reply Editor */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Reply</h3>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 px-4 py-2 flex gap-2 bg-gray-50">
          <button
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bold"
            type="button"
          >
            <strong className="text-sm">B</strong>
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Italic"
            type="button"
          >
            <em className="text-sm">I</em>
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Underline"
            type="button"
          >
            <u className="text-sm">U</u>
          </button>
          <div className="border-l border-gray-300 mx-2"></div>
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bullet List"
            type="button"
          >
            <span className="text-sm">•</span>
          </button>
          <button
            onClick={() => {
              const url = prompt('Enter link URL:')
              if (url) execCommand('createLink', url)
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Link"
            type="button"
          >
            <span className="text-sm">🔗</span>
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={updateContent}
          onPaste={handlePaste}
          className="min-h-[200px] max-h-[400px] overflow-y-auto p-6 focus:outline-none"
          style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#000000'
          }}
          placeholder="Write your reply..."
        />

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <PaperClipIcon className="h-5 w-5" />
            <span>Attachments coming soon</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setReplyContent('')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Discard
            </button>
            <button
              onClick={handleSendReply}
              disabled={sending || !replyContent.trim()}
              className="flex items-center px-6 py-2 bg-[#00f5a0] text-black rounded-lg hover:bg-[#00d68f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
