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

  const [timeRemaining, setTimeRemaining] = useState('60m 0s');

  // Fetch quota data from API
  const fetchQuotaData = async () => {
    try {
      // 🔥 PRODUCTION: Get current campaignId from localStorage or context
      const currentCampaignId = localStorage.getItem('currentCampaignId');
      const url = currentCampaignId
        ? `/api/workflow/stats?campaignId=${currentCampaignId}`
        : '/api/workflow/stats';

      console.log(`📊 Fetching stats for campaign: ${currentCampaignId || 'ALL'}`);

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('📊 Quota data received:', result.data);
          setQuotaData(result.data);
        }
      } else {
        console.warn('📊 Quota API returned non-OK status:', response.status);
      }
    } catch (error) {
      console.warn('📊 Quota API not available (dev mode):', error.message);
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
    console.log('📊 QuotaBar mounted - fetching quota data');
    fetchQuotaData();
    const interval = setInterval(fetchQuotaData, 5000);
    return () => clearInterval(interval);
  }, []);

  const percentage = (quotaData.rateLimit.current / quotaData.rateLimit.max) * 100;
  const isNearLimit = percentage >= 80;
  const isLimited = quotaData.rateLimit.isLimited;

  console.log('📊 QuotaBar rendering with data:', { percentage, isNearLimit, isLimited });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Campaign Stats
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

      {/* 🔥 PROSPECTS SECTION - SEPARATE */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-900">Prospects Found</span>
          </div>
          <span className="text-lg font-bold text-blue-900">
            {quotaData.prospects.total}
          </span>
        </div>
        <div className="text-xs text-blue-700">
          People discovered by AI search
        </div>
      </div>

      {/* 🔥 EMAILS SECTION - SEPARATE */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-900">Email Generation</span>
          </div>
        </div>

        {/* Progress Bar for Emails */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-green-700">Generated</span>
            <span className="text-xs font-semibold text-green-900">
              {quotaData.emails.generated} / {quotaData.rateLimit.max}
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isLimited
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-orange-500'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Email Stats */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="text-center p-1 bg-white rounded border border-green-200">
            <div className="text-sm font-bold text-green-900">{quotaData.emails.generated}</div>
            <div className="text-xs text-green-700">Generated</div>
          </div>
          <div className="text-center p-1 bg-white rounded border border-green-200">
            <div className="text-sm font-bold text-green-900">{quotaData.emails.sent}</div>
            <div className="text-xs text-green-700">Sent</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-green-700">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Resets in {timeRemaining}
          </span>
          <span>
            {quotaData.rateLimit.max - quotaData.rateLimit.current} remaining
          </span>
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
