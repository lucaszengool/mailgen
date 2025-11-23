import { useState, useEffect, useRef } from 'react'
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
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function EmailThread() {
  const { emailId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [emailData, setEmailData] = useState(null)
  const [threadHistory, setThreadHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [sending, setSending] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const replyEditorRef = useRef(null)

  useEffect(() => {
    console.log('📧 EmailThread component mounted, emailId:', emailId)
    fetchEmailThread()
  }, [emailId])

  const fetchEmailThread = async () => {
    try {
      setLoading(true)
      const userId = user?.id || 'anonymous'

      console.log('📧 Fetching email details for ID:', emailId)

      // Fetch the email details
      const emailResponse = await fetch(`/api/analytics/email-detail/${emailId}?userId=${userId}`)
      const emailResult = await emailResponse.json()

      console.log('📧 Email response:', emailResult)

      if (emailResult.success && emailResult.data) {
        setEmailData(emailResult.data)
        setReplySubject(`Re: ${emailResult.data.subject}`)

        // Fetch thread history (past emails between user and this prospect)
        const threadResponse = await fetch(`/api/analytics/email-thread/${encodeURIComponent(emailResult.data.recipientEmail)}?userId=${userId}`)
        const threadResult = await threadResponse.json()

        console.log('📧 Thread history response:', threadResult)

        if (threadResult.success) {
          setThreadHistory(threadResult.data || [])
        }
      } else {
        console.error('❌ Failed to load email details:', emailResult.error)
        toast.error('Failed to load email details')
      }
    } catch (error) {
      console.error('❌ Error fetching email thread:', error)
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
          subject: replySubject,
          body: replyContent,
          campaignId: emailData.campaignId,
          inReplyTo: emailData.messageId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Reply sent successfully!')
        setReplyContent('')
        setShowReplyBox(false)
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

  useEffect(() => {
    if (showReplyBox && replyEditorRef.current) {
      replyEditorRef.current.focus()
    }
  }, [showReplyBox])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f5a0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email thread...</p>
        </div>
      </div>
    )
  }

  if (!emailData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email not found</h2>
          <p className="text-gray-600 mb-6">The email you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/analytics')}
            className="inline-flex items-center px-4 py-2 bg-[#00f5a0] text-black rounded-lg font-medium hover:bg-[#00d68f]"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Analytics
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Back to Analytics</span>
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchEmailThread}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Email Details Section - Hunter.io style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Email Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{emailData.subject}</h1>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-4 w-4 mr-1.5" />
                    <span className="font-medium">{emailData.recipientEmail}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1.5" />
                    <span>{new Date(emailData.sentAt).toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{emailData.campaignId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Metrics */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <EyeIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{emailData.openCount || 0}</div>
                  <div className="text-xs text-gray-600">Opens</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CursorArrowRaysIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{emailData.clickCount || 0}</div>
                  <div className="text-xs text-gray-600">Clicks</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{emailData.replyCount || 0}</div>
                  <div className="text-xs text-gray-600">Replies</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {emailData.status === 'sent' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">{emailData.status || 'Sent'}</div>
                  <div className="text-xs text-gray-600">Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="px-6 py-6">
            <div className="prose max-w-none">
              <div
                className="text-gray-900 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: emailData.body || '<p class="text-gray-500 italic">No content available</p>' }}
              />
            </div>
          </div>
        </div>

        {/* Thread History */}
        {threadHistory.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Conversation History ({threadHistory.length} messages)
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {threadHistory.map((email, index) => (
                <div key={email.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${email.type === 'sent' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">{email.subject}</div>
                        <div className="text-sm text-gray-500">
                          {email.type === 'sent' ? 'You sent this email' : 'Reply from prospect'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(email.sentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Section - Gmail Style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-[#00f5a0]" />
                Reply
              </h2>
              {!showReplyBox && (
                <button
                  onClick={() => setShowReplyBox(true)}
                  className="px-4 py-2 bg-[#00f5a0] text-black rounded-lg font-medium hover:bg-[#00d68f] transition-colors"
                >
                  Compose Reply
                </button>
              )}
            </div>
          </div>

          {showReplyBox && (
            <div className="p-6">
              <div className="space-y-4">
                {/* To field */}
                <div className="flex items-center border-b border-gray-200 pb-3">
                  <label className="text-sm font-medium text-gray-700 w-16">To:</label>
                  <div className="flex-1 text-sm text-gray-900">{emailData.recipientEmail}</div>
                </div>

                {/* Subject field */}
                <div className="flex items-center border-b border-gray-200 pb-3">
                  <label className="text-sm font-medium text-gray-700 w-16">Subject:</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="flex-1 text-sm text-gray-900 border-none focus:outline-none focus:ring-0 px-2"
                  />
                </div>

                {/* Message body */}
                <div className="min-h-[300px]">
                  <textarea
                    ref={replyEditorRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full h-[300px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent resize-none text-sm"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => {
                      setShowReplyBox(false)
                      setReplyContent('')
                      setReplySubject(`Re: ${emailData.subject}`)
                    }}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setReplyContent('')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyContent.trim()}
                      className="px-6 py-2 bg-[#00f5a0] text-black rounded-lg font-medium hover:bg-[#00d68f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
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
          )}

          {!showReplyBox && (
            <div className="px-6 py-12 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Click "Compose Reply" to respond to this email</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
