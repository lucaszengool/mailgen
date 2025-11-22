import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import '../styles/jobright-colors.css'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export default function EmailThread() {
  const { emailId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [emailData, setEmailData] = useState(null)
  const [threadHistory, setThreadHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchEmailThread()
  }, [emailId])

  const fetchEmailThread = async () => {
    try {
      setLoading(true)
      const userId = user?.id || 'anonymous'

      // Fetch the email details
      const emailResponse = await fetch(`/api/analytics/email-detail/${emailId}?userId=${userId}`)
      const emailResult = await emailResponse.json()

      if (emailResult.success) {
        setEmailData(emailResult.data)

        // Fetch thread history (past emails between user and this prospect)
        const threadResponse = await fetch(`/api/analytics/email-thread/${emailResult.data.recipientEmail}?userId=${userId}`)
        const threadResult = await threadResponse.json()

        if (threadResult.success) {
          setThreadHistory(threadResult.data)
        }
      } else {
        toast.error('Failed to load email details')
      }
    } catch (error) {
      console.error('Error fetching email thread:', error)
      toast.error('Failed to load email thread')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      setSending(true)
      const userId = user?.id || 'anonymous'

      const response = await fetch('/api/send-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          to: emailData.recipientEmail,
          subject: `Re: ${emailData.subject}`,
          body: replyContent,
          campaignId: emailData.campaignId,
          inReplyTo: emailData.messageId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Reply sent successfully!')
        setReplyContent('')
        // Refresh the thread
        fetchEmailThread()
      } else {
        toast.error(result.error || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f5a0]"></div>
        <span className="ml-3 text-gray-600">Loading email thread...</span>
      </div>
    )
  }

  if (!emailData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Email not found</p>
        <button
          onClick={() => navigate('/analytics')}
          className="mt-4 text-[#00f5a0] hover:underline"
        >
          Back to Analytics
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {/* Email Details Card */}
      <div className="bg-white rounded-lg border border-black p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-black mb-2">{emailData.subject}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                <span>{emailData.recipientEmail}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{new Date(emailData.sentAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <EyeIcon className="h-5 w-5 text-[#00f5a0]" />
            </div>
            <div className="text-2xl font-bold text-black">{emailData.openCount}</div>
            <div className="text-xs text-gray-600">Opens</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <CursorArrowRaysIcon className="h-5 w-5 text-[#00f5a0]" />
            </div>
            <div className="text-2xl font-bold text-black">{emailData.clickCount}</div>
            <div className="text-xs text-gray-600">Clicks</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-[#00f5a0]" />
            </div>
            <div className="text-2xl font-bold text-black">{emailData.replyCount}</div>
            <div className="text-xs text-gray-600">Replies</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">Campaign</div>
            <div className="text-sm font-medium text-black truncate">{emailData.campaignId}</div>
          </div>
        </div>

        {/* Email Body */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Content</h3>
          <div className="prose max-w-none">
            <div
              className="text-gray-900"
              dangerouslySetInnerHTML={{ __html: emailData.body || 'No content available' }}
            />
          </div>
        </div>
      </div>

      {/* Thread History */}
      {threadHistory.length > 1 && (
        <div className="bg-white rounded-lg border border-black p-6">
          <h2 className="text-xl font-bold text-black mb-4">
            Email History with {emailData.recipientEmail}
          </h2>
          <div className="space-y-4">
            {threadHistory.map((email, index) => (
              <div key={email.id} className="border-l-4 border-[#00f5a0] pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-black">{email.subject}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(email.sentAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {email.type === 'sent' ? 'Sent by you' : 'Reply from prospect'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Editor */}
      <div className="bg-white rounded-lg border border-black p-6">
        <h2 className="text-xl font-bold text-black mb-4 flex items-center">
          <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-[#00f5a0]" />
          Send Reply
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To: {emailData.recipientEmail}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject: Re: {emailData.subject}
            </label>
          </div>
          <div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setReplyContent('')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={handleSendReply}
              disabled={sending || !replyContent.trim()}
              className="px-6 py-2 bg-[#00f5a0] text-black rounded-lg font-medium hover:bg-[#00d68f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
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
