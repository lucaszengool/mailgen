import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, BookOpen, Loader, Sparkles } from 'lucide-react';

const AIAssistantChatbot = ({ isOpen, onClose, activeView, setActiveView, prospects = [], emails = [], externalMessage }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Great! You\'ve just unlocked your Chat with me, MailGen!\n\nI\'m your AI copilot for email marketing automation. Here\'s what I can help you with:\n\nHome Dashboard - Overview of your campaigns and system status\n\nProspects Management - Add and manage your contact list for email campaigns\n\nEmail Campaign - Create, send, and track your email campaigns\n\nEmail Editor - Design and customize professional email templates\n\nAnalytics - Monitor campaign performance and engagement metrics\n\nMarket Research - Research your target market and competitors\n\nSettings - Configure SMTP/IMAP email servers and system preferences\n\nWhat would you like to explore first?',
      timestamp: new Date().toISOString(),
      suggestions: [
        { text: 'View Home Dashboard', action: 'goto_home' },
        { text: 'Manage My Prospects', action: 'goto_prospects' },
        { text: 'Check Email Campaigns', action: 'goto_emails' },
        { text: 'Open Email Editor', action: 'goto_email_editor' },
        { text: 'View Analytics', action: 'goto_analytics' },
        { text: 'Market Research', action: 'goto_research' },
        { text: 'Configure Settings', action: 'goto_settings' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemState, setSystemState] = useState({
    prospects: [],
    emails: [],
    smtpConfigured: false,
    activeView: 'workflow'
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch system state on mount and when props change
  useEffect(() => {
    const fetchSystemState = async () => {
      try {
        // Fetch SMTP status
        const smtpResponse = await fetch('/api/settings/smtp');
        const smtpData = await smtpResponse.json();

        setSystemState({
          prospects: prospects,
          emails: emails,
          smtpConfigured: smtpData.success && smtpData.smtp?.host,
          activeView: activeView
        });
      } catch (error) {
        console.error('Failed to fetch system state:', error);
        setSystemState({
          prospects: prospects,
          emails: emails,
          smtpConfigured: false,
          activeView: activeView
        });
      }
    };

    if (isOpen) {
      fetchSystemState();
    }
  }, [isOpen, prospects, emails, activeView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle external messages (e.g., from prospect analysis)
  useEffect(() => {
    if (externalMessage && isOpen) {
      const assistantMessage = {
        role: 'assistant',
        content: externalMessage.content,
        timestamp: new Date().toISOString(),
        suggestions: externalMessage.suggestions || []
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  }, [externalMessage, isOpen]);

  const handleAction = async (action, customMessage) => {
    // Add user message if custom message provided
    if (customMessage) {
      const userMessage = {
        role: 'user',
        content: customMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    // Perform action
    let responseMessage = '';
    let newView = null;

    switch (action) {
      case 'goto_home':
        responseMessage = 'Taking you to the Home dashboard...';
        newView = 'home';
        break;

      case 'goto_workflow':
        responseMessage = 'Opening the Smart Workflow Platform...';
        newView = 'workflow';
        break;

      case 'goto_prospects':
        responseMessage = 'Navigating to your Prospects section...';
        newView = 'prospects';
        break;

      case 'goto_emails':
        responseMessage = 'Opening your Email Campaign view...';
        newView = 'emails';
        break;

      case 'goto_email_editor':
        responseMessage = 'Loading the Email Editor...';
        newView = 'email_editor';
        break;

      case 'goto_analytics':
        responseMessage = 'Taking you to Analytics & Insights...';
        newView = 'analytics';
        break;

      case 'goto_research':
        responseMessage = 'Opening Market Research section...';
        newView = 'research';
        break;

      case 'goto_settings':
        responseMessage = 'Loading System Settings...';
        newView = 'settings';
        break;

      default:
        break;
    }

    if (responseMessage && newView) {
      setTimeout(() => {
        const assistantMsg = {
          role: 'assistant',
          content: responseMessage,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);

        // Navigate after short delay
        setTimeout(() => {
          if (setActiveView) {
            setActiveView(newView);
          }
        }, 800);
      }, 500);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userQuery: userInput,
          systemState: systemState
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Parse response for actions
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };

        // Check if response suggests actions based on keywords
        const lowerResponse = data.response.toLowerCase();
        const lowerQuery = userInput.toLowerCase();

        // Generate contextual suggestions based on query and response
        if (lowerQuery.includes('home') || lowerResponse.includes('home') || lowerQuery.includes('dashboard')) {
          assistantMessage.suggestions = [
            { text: 'Go to Home', action: 'goto_home' },
            { text: 'View Workflow', action: 'goto_workflow' }
          ];
        } else if (lowerQuery.includes('prospect') || lowerResponse.includes('prospect') || lowerQuery.includes('audience') || lowerQuery.includes('contact')) {
          assistantMessage.suggestions = [
            { text: 'View Prospects', action: 'goto_prospects' },
            { text: 'Go to Home', action: 'goto_home' }
          ];
        } else if (lowerQuery.includes('campaign') || lowerResponse.includes('campaign') || lowerQuery.includes('email')) {
          assistantMessage.suggestions = [
            { text: 'View Email Campaign', action: 'goto_emails' },
            { text: 'Open Email Editor', action: 'goto_email_editor' }
          ];
        } else if (lowerQuery.includes('template') || lowerQuery.includes('editor')) {
          assistantMessage.suggestions = [
            { text: 'Open Email Editor', action: 'goto_email_editor' },
            { text: 'View Campaigns', action: 'goto_emails' }
          ];
        } else if (lowerQuery.includes('analytic') || lowerResponse.includes('analytic') || lowerQuery.includes('insight') || lowerQuery.includes('report')) {
          assistantMessage.suggestions = [
            { text: 'View Analytics', action: 'goto_analytics' },
            { text: 'Check Campaigns', action: 'goto_emails' }
          ];
        } else if (lowerQuery.includes('research') || lowerResponse.includes('research') || lowerQuery.includes('market')) {
          assistantMessage.suggestions = [
            { text: 'Open Research', action: 'goto_research' },
            { text: 'View Analytics', action: 'goto_analytics' }
          ];
        } else if (lowerQuery.includes('setting') || lowerResponse.includes('setting') || lowerQuery.includes('config') || lowerQuery.includes('smtp')) {
          assistantMessage.suggestions = [
            { text: 'Open Settings', action: 'goto_settings' },
            { text: 'Go to Home', action: 'goto_home' }
          ];
        } else {
          // Default suggestions
          assistantMessage.suggestions = [
            { text: 'Go to Home', action: 'goto_home' },
            { text: 'View Prospects', action: 'goto_prospects' },
            { text: 'Check Campaigns', action: 'goto_emails' }
          ];
        }

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please make sure the backend services are running and try again.',
        timestamp: new Date().toISOString(),
        suggestions: [
          { text: 'Go to Home', action: 'goto_home' },
          { text: 'View Settings', action: 'goto_settings' }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* MailGen Logo */}
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">MailGen</h2>
            <p className="text-sm text-gray-600">Your AI Copilot</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {/* Show quick guide */}}
            className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="w-4 h-4 inline mr-1" />
            Quick Guide
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            {message.role === 'assistant' && (
              <div className="p-0">
                <div className="whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
                  {message.content}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}

            {message.role === 'user' && (
              <div className="flex justify-end">
                <div className="text-gray-800 rounded-lg p-0 max-w-[80%]">
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="space-y-2 mt-3">
                {message.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAction(suggestion.action, suggestion.text)}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-between group"
                  >
                    <span className="text-gray-700 group-hover:text-green-700">
                      {suggestion.text}
                    </span>
                    <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="p-0">
            <Loader className="w-5 h-5 animate-spin text-green-500" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-5 py-3 border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChatbot;
