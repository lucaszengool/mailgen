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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
          Campaign Stats
        </h3>
        {isLimited && (
          <span className="flex items-center gap-1 text-xs text-red-600 px-2 py-0.5 rounded-full border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Limit Reached
          </span>
        )}
      </div>

      {/* Compact Stats Grid - All White Background */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {/* Prospects Found */}
        <div className="text-center p-2 bg-white border border-gray-200 rounded">
          <Users className="w-3.5 h-3.5 text-gray-600 mx-auto mb-1" />
          <div className="text-sm font-bold text-gray-900">{quotaData.prospects.total}</div>
          <div className="text-xs text-gray-600">Prospects</div>
        </div>

        {/* Generated */}
        <div className="text-center p-2 bg-white border border-gray-200 rounded">
          <Mail className="w-3.5 h-3.5 text-gray-600 mx-auto mb-1" />
          <div className="text-sm font-bold text-gray-900">{quotaData.emails.generated}</div>
          <div className="text-xs text-gray-600">Generated</div>
        </div>

        {/* Sent */}
        <div className="text-center p-2 bg-white border border-gray-200 rounded">
          <TrendingUp className="w-3.5 h-3.5 text-gray-600 mx-auto mb-1" />
          <div className="text-sm font-bold text-gray-900">{quotaData.emails.sent}</div>
          <div className="text-xs text-gray-600">Sent</div>
        </div>
      </div>

      {/* Compact Progress Bar */}
      <div className="bg-white border border-gray-200 rounded p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Quota Usage</span>
          <span className="text-xs font-semibold text-gray-900">
            {quotaData.rateLimit.current} / {quotaData.rateLimit.max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isLimited
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-orange-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Resets in {timeRemaining}
          </span>
          <span>
            {quotaData.rateLimit.max - quotaData.rateLimit.current} left
          </span>
        </div>
      </div>

      {/* Compact Help Text */}
      {isLimited && (
        <div className="mt-2 p-1.5 bg-white border border-red-200 rounded">
          <p className="text-xs text-red-600">
            Hourly limit reached. System resumes after timer.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaBar;
