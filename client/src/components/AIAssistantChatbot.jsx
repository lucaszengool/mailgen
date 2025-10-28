import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, X, BookOpen, Loader, Sparkles } from 'lucide-react';

const AIAssistantChatbot = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Great! You\'ve just unlocked your Chat with me, MailGen!\n\nI\'m your AI copilot for email marketing automation. I can help you with setting up campaigns, configuring SMTP, managing prospects, and much more. What would you like to do today?',
      timestamp: new Date().toISOString(),
      suggestions: [
        { text: 'Set up SMTP email configuration', action: 'setup_smtp' },
        { text: 'Create a new email campaign', action: 'create_campaign' },
        { text: 'Add prospects to my audience', action: 'add_prospects' },
        { text: 'Show me email templates', action: 'show_templates' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    switch (action) {
      case 'setup_smtp':
        // Navigate to SMTP setup page
        setTimeout(() => {
          const assistantMsg = {
            role: 'assistant',
            content: 'Opening SMTP setup wizard for you now. You\'ll be able to configure Gmail, Outlook, Yahoo, or custom SMTP settings...',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);

          // Navigate after short delay
          setTimeout(() => {
            navigate('/smtp-setup');
          }, 1000);
        }, 500);
        break;

      case 'create_campaign':
        setTimeout(() => {
          const assistantMsg = {
            role: 'assistant',
            content: 'Let me help you create a campaign. Opening the campaign setup wizard...',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);

          setTimeout(() => {
            navigate('/setup');
          }, 1000);
        }, 500);
        break;

      case 'add_prospects':
        setTimeout(() => {
          const assistantMsg = {
            role: 'assistant',
            content: 'Taking you to the prospects page where you can add and manage your audience...',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);

          setTimeout(() => {
            navigate('/prospects');
          }, 1000);
        }, 500);
        break;

      case 'show_templates':
        setTimeout(() => {
          const assistantMsg = {
            role: 'assistant',
            content: 'Opening the email template library. You\'ll see 6 professional templates you can customize...',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);

          setTimeout(() => {
            navigate('/email-editor');
          }, 1000);
        }, 500);
        break;

      default:
        break;
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
          userQuery: userInput
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

        // Check if response suggests actions
        const lowerResponse = data.response.toLowerCase();
        if (lowerResponse.includes('smtp') || lowerResponse.includes('email configuration')) {
          assistantMessage.suggestions = [
            { text: 'Open SMTP setup wizard', action: 'setup_smtp' },
            { text: 'Show me setup instructions', action: 'smtp_help' }
          ];
        } else if (lowerResponse.includes('campaign')) {
          assistantMessage.suggestions = [
            { text: 'Create new campaign now', action: 'create_campaign' },
            { text: 'View existing campaigns', action: 'view_campaigns' }
          ];
        } else if (lowerResponse.includes('prospect') || lowerResponse.includes('audience')) {
          assistantMessage.suggestions = [
            { text: 'Go to prospects page', action: 'add_prospects' },
            { text: 'Import contacts', action: 'import_contacts' }
          ];
        } else if (lowerResponse.includes('template')) {
          assistantMessage.suggestions = [
            { text: 'Browse email templates', action: 'show_templates' },
            { text: 'Create custom template', action: 'create_template' }
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
        timestamp: new Date().toISOString()
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
    <div className="fixed right-0 top-0 h-full w-[480px] bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200">
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
            className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            {message.role === 'assistant' && (
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
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
                <div className="bg-green-500 text-white rounded-lg p-4 max-w-[80%] shadow-sm">
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className="text-xs text-green-100 mt-1">
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
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
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
