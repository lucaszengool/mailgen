import React, { useState, useEffect } from 'react';
import { Clock, Users, Mail, TrendingUp, AlertCircle } from 'lucide-react';

const QuotaBar = () => {
  const [quotaData, setQuotaData] = useState({
    rateLimit: {
      current: 0,
      max: 100,
      resetTime: Date.now() + 3600000,
      timeUntilReset: 3600000,
      isLimited: false
    },
    prospects: {
      total: 0,
      new: 0
    },
    emails: {
      generated: 0,
      sent: 0
    }
  });

  const [timeRemaining, setTimeRemaining] = useState('');

  // Fetch quota data from API
  const fetchQuotaData = async () => {
    try {
      const response = await fetch('/api/workflow/stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setQuotaData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching quota data:', error);
    }
  };

  // Update time remaining display
  useEffect(() => {
    const updateTimer = () => {
      const minutes = Math.floor(quotaData.rateLimit.timeUntilReset / 60000);
      const seconds = Math.floor((quotaData.rateLimit.timeUntilReset % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quotaData.rateLimit.timeUntilReset]);

  // Fetch data on mount and every 5 seconds
  useEffect(() => {
    fetchQuotaData();
    const interval = setInterval(fetchQuotaData, 5000);
    return () => clearInterval(interval);
  }, []);

  const percentage = (quotaData.rateLimit.current / quotaData.rateLimit.max) * 100;
  const isNearLimit = percentage >= 80;
  const isLimited = quotaData.rateLimit.isLimited;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Hourly Quota
        </h3>
        {isLimited && (
          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Limit Reached
          </span>
        )}
        {!isLimited && isNearLimit && (
          <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Near Limit
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">Emails Generated</span>
          <span className="text-xs font-semibold text-gray-900">
            {quotaData.rateLimit.current} / {quotaData.rateLimit.max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isLimited
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Resets in {timeRemaining}
          </span>
          <span className="text-xs text-gray-500">
            {quotaData.rateLimit.max - quotaData.rateLimit.current} remaining
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Prospects Found */}
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-900">{quotaData.prospects.total}</div>
          <div className="text-xs text-blue-600">Prospects</div>
        </div>

        {/* Emails Generated */}
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Mail className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-900">{quotaData.emails.generated}</div>
          <div className="text-xs text-green-600">Generated</div>
        </div>

        {/* Emails Sent */}
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-900">{quotaData.emails.sent}</div>
          <div className="text-xs text-purple-600">Sent</div>
        </div>
      </div>

      {/* Help Text */}
      {isLimited && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700">
            Hourly limit reached. The system will resume automatically after the reset timer.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaBar;
