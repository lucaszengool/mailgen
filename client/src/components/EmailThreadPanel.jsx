import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  CalendarIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'

/**
 * Gmail-style Email Thread Panel Component
 * Displays email thread history and allows replying
 */
export default function EmailThreadPanel({ emailId, onClose }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [emailData, setEmailData] = useState(null)
  const [threadHistory, setThreadHistory] = useState([])
  const [replyContent, setReplyContent] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [sending, setSending] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [expandedEmails, setExpandedEmails] = useState(new Set())
  const replyEditorRef = useRef(null)

  useEffect(() => {
    if (emailId) {
      console.log('📧 EmailThreadPanel: Loading email thread for ID:', emailId)
      fetchEmailThread()
    }
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
        // Expand the current email by default
        setExpandedEmails(new Set([emailResult.data.id]))

        // Fetch thread history (past emails between user and this prospect)
        const threadResponse = await fetch(`/api/analytics/email-thread/${encodeURIComponent(emailResult.data.recipientEmail)}?userId=${userId}`)
        const threadResult = await threadResponse.json()

        console.log('📧 Thread history response:', threadResult)

        if (threadResult.success) {
          setThreadHistory(threadResult.data || [])
        }
      } else {
        console.error('Failed to load email details:', emailResult.error)
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

      // 🔥 FIX: API expects 'html' or 'text', not 'body'
      const response = await fetch('/api/send-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          to: emailData.recipientEmail,
          subject: replySubject,
          html: replyContent, // 🔥 Changed from 'body' to 'html'
          text: replyContent.replace(/<[^>]*>/g, ''), // Plain text version
          campaignId: emailData.campaignId,
          inReplyTo: emailData.messageId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Reply sent successfully!')
        setReplyContent('')
        setShowReplyBox(false)
        if (replyEditorRef.current) {
          replyEditorRef.current.innerHTML = ''
        }
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

  const toggleEmailExpanded = (emailId) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return newSet
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">Email not found</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-[#00f5a0] text-black rounded-lg hover:bg-[#00d68f]"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={onClose}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">Back</span>
        </button>

        {/* Engagement Stats */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${emailData.openCount > 0 ? 'text-[#00f5a0]' : 'text-gray-400'}`}>
            <EyeIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">{emailData.openCount || 0}</span>
          </div>
          <div className={`flex items-center ${emailData.clickCount > 0 ? 'text-[#00f5a0]' : 'text-gray-400'}`}>
            <CursorArrowRaysIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">{emailData.clickCount || 0}</span>
          </div>
          <div className={`flex items-center ${emailData.replyCount > 0 ? 'text-[#00f5a0]' : 'text-gray-400'}`}>
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">{emailData.replyCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Email Subject */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{emailData.subject}</h2>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <EnvelopeIcon className="h-4 w-4 mr-1" />
          <span>{emailData.recipientEmail}</span>
          <span className="mx-2">•</span>
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>{formatDate(emailData.sentAt)}</span>
        </div>
      </div>

      {/* Email Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Thread History */}
        {threadHistory.length > 0 && (
          <div className="space-y-3 mb-4">
            {threadHistory.map((email, index) => (
              <div key={email.id || index} className="border border-gray-200 rounded-lg">
                {/* Email Header - Always visible */}
                <div
                  onClick={() => toggleEmailExpanded(email.id)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      email.type === 'sent' ? 'bg-[#00f5a0]' : 'bg-blue-500'
                    }`}>
                      <UserCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {email.type === 'sent' ? 'You' : email.from || emailData.recipientEmail}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(email.sentAt || email.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {email.opened && (
                      <span className="text-xs bg-[#00f5a0] text-black px-2 py-1 rounded-full mr-2">
                        Opened
                      </span>
                    )}
                    {expandedEmails.has(email.id) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Email Body - Expandable */}
                {expandedEmails.has(email.id) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 text-gray-700 whitespace-pre-wrap">
                      {email.body || email.content || (
                        <span className="text-gray-400 italic">
                          Email content not stored. Subject: {email.subject || emailData?.subject || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Current Email (if not in thread history) */}
        {threadHistory.length === 0 && (
          <div className="border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#00f5a0] mr-3">
                  <UserCircleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">You</p>
                  <p className="text-sm text-gray-500">to {emailData.recipientEmail}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="text-gray-700 whitespace-pre-wrap">
                {emailData.body || (
                  <span className="text-gray-400 italic">
                    Email content not stored. Subject: {emailData?.subject || 'N/A'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply Box */}
      <div className="border-t border-gray-200 px-4 py-4">
        {!showReplyBox ? (
          <button
            onClick={() => setShowReplyBox(true)}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#00f5a0] hover:text-[#00f5a0] transition-colors flex items-center justify-center"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Click to reply
          </button>
        ) : (
          <div className="border border-gray-200 rounded-lg">
            {/* Reply Header */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <input
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                className="w-full bg-transparent font-medium text-gray-900 focus:outline-none"
                placeholder="Subject"
              />
            </div>

            {/* Reply Editor */}
            <div
              ref={replyEditorRef}
              contentEditable
              className="px-4 py-3 min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none text-gray-700"
              onInput={(e) => setReplyContent(e.currentTarget.innerHTML)}
              placeholder="Write your reply..."
            ></div>

            {/* Reply Actions */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <PaperClipIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowReplyBox(false)
                    setReplyContent('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyContent.trim()}
                  className="px-4 py-2 bg-[#00f5a0] text-black rounded-lg hover:bg-[#00d68f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
