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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 mb-3">
      {/* Header - Extra Compact */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" style={{ color: '#00f5a0' }} />
          Campaign Stats
        </h3>
        {isLimited && (
          <span className="flex items-center gap-0.5 text-xs text-red-600 px-1.5 py-0.5 rounded-full border border-red-200">
            <AlertCircle className="w-2.5 h-2.5" />
            Limit
          </span>
        )}
      </div>

      {/* Extra Compact Stats Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-1.5">
        {/* Prospects */}
        <div className="text-center p-1.5 bg-white border border-gray-200 rounded">
          <Users className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#00f5a0' }} />
          <div className="text-xs font-bold text-gray-900">{quotaData.prospects.total}</div>
          <div className="text-xs text-gray-600" style={{ fontSize: '0.65rem' }}>Prospects</div>
        </div>

        {/* Generated */}
        <div className="text-center p-1.5 bg-white border border-gray-200 rounded">
          <Mail className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#00f5a0' }} />
          <div className="text-xs font-bold text-gray-900">{quotaData.emails.generated}</div>
          <div className="text-xs text-gray-600" style={{ fontSize: '0.65rem' }}>Generated</div>
        </div>

        {/* Sent */}
        <div className="text-center p-1.5 bg-white border border-gray-200 rounded">
          <TrendingUp className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#00f5a0' }} />
          <div className="text-xs font-bold text-gray-900">{quotaData.emails.sent}</div>
          <div className="text-xs text-gray-600" style={{ fontSize: '0.65rem' }}>Sent</div>
        </div>
      </div>

      {/* Extra Compact Progress Bar */}
      <div className="bg-white border border-gray-200 rounded p-1.5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-gray-600" style={{ fontSize: '0.65rem' }}>Quota</span>
          <span className="text-xs font-semibold text-gray-900" style={{ fontSize: '0.65rem' }}>
            {quotaData.rateLimit.current}/{quotaData.rateLimit.max}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-0.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isLimited ? '#ef4444' : isNearLimit ? '#f97316' : '#00f5a0'
            }}
          />
        </div>
        <div className="flex items-center justify-between text-gray-600" style={{ fontSize: '0.65rem' }}>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {timeRemaining}
          </span>
          <span>
            {quotaData.rateLimit.max - quotaData.rateLimit.current} left
          </span>
        </div>
      </div>

      {/* Extra Compact Help Text */}
      {isLimited && (
        <div className="mt-1.5 p-1 bg-white border border-red-200 rounded">
          <p className="text-red-600" style={{ fontSize: '0.65rem' }}>
            Limit reached. Resets in {timeRemaining}.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaBar;
