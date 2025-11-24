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
      new: 0,
      quota: {
        current: 0,
        max: 100
      }
    },
    emails: {
      generated: 0,
      sent: 0,
      quota: {
        current: 0,
        max: 100
      }
    },
    isUnlimited: false
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

  // 🔥 FIX: Check if unlimited (max is 999999 or isUnlimited flag is true)
  const isActuallyUnlimited = quotaData.isUnlimited || quotaData.prospects.quota.max >= 999999 || quotaData.emails.quota.max >= 999999;

  // Calculate percentages for both quotas
  const prospectPercentage = isActuallyUnlimited ? 0 : (quotaData.prospects.quota.current / quotaData.prospects.quota.max) * 100;
  const emailPercentage = isActuallyUnlimited ? 0 : (quotaData.emails.quota.current / quotaData.emails.quota.max) * 100;

  const isProspectNearLimit = !isActuallyUnlimited && prospectPercentage >= 80;
  const isEmailNearLimit = !isActuallyUnlimited && emailPercentage >= 80;

  // Only show as limited if NOT unlimited AND either quota is at/over limit
  const isProspectAtLimit = !isActuallyUnlimited && prospectPercentage >= 100;
  const isEmailAtLimit = !isActuallyUnlimited && emailPercentage >= 100;
  const isLimited = !isActuallyUnlimited && (isProspectAtLimit || isEmailAtLimit);

  console.log('📊 QuotaBar rendering:', {
    isUnlimited: isActuallyUnlimited,
    prospectMax: quotaData.prospects.quota.max,
    prospectPercentage,
    emailPercentage,
    isLimited
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 mb-3">
      {/* Header - Extra Compact */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-semibold text-black flex items-center gap-1">
          <TrendingUp className="w-3 h-3" style={{ color: '#00f5a0' }} />
          Campaign Stats
        </h3>
        {isLimited && (
          <span className="flex items-center gap-0.5 text-xs text-red-600 px-1.5 py-0.5 rounded-full border border-red-200 bg-red-50">
            <AlertCircle className="w-2.5 h-2.5" />
            {isProspectAtLimit && isEmailAtLimit ? 'Quotas Full' : isProspectAtLimit ? 'Prospects Full' : 'Emails Full'}
          </span>
        )}
        {!isLimited && (isProspectNearLimit || isEmailNearLimit) && (
          <span className="flex items-center gap-0.5 text-xs text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-200 bg-orange-50">
            <AlertCircle className="w-2.5 h-2.5" />
            Near Limit
          </span>
        )}
      </div>

      {/* Extra Compact Stats Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-1.5">
        {/* Prospects */}
        <div className="text-center p-1.5 bg-white border-2 border-gray-200 rounded">
          <Users className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#00f5a0' }} />
          <div className="text-xs font-bold text-black">{quotaData.prospects.total}</div>
          <div className="text-xs text-black" style={{ fontSize: '0.65rem' }}>Prospects</div>
        </div>

        {/* Generated */}
        <div className="text-center p-1.5 bg-white border-2 border-gray-200 rounded">
          <Mail className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#00f5a0' }} />
          <div className="text-xs font-bold text-black">{quotaData.emails.generated}</div>
          <div className="text-xs text-black" style={{ fontSize: '0.65rem' }}>Generated</div>
        </div>

        {/* Sent */}
        <div className="text-center p-1.5 bg-white border-2 border-gray-200 rounded">
          <TrendingUp className="w-3 h-3 mx-auto mb-0.5" style={{ color: '#00f5a0' }} />
          <div className="text-xs font-bold text-black">{quotaData.emails.sent}</div>
          <div className="text-xs text-black" style={{ fontSize: '0.65rem' }}>Sent</div>
        </div>
      </div>

      {/* Prospect Quota Bar */}
      <div className="bg-white border-2 border-gray-200 rounded p-1.5 mb-1.5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-black flex items-center gap-1" style={{ fontSize: '0.65rem' }}>
            <Users className="w-2.5 h-2.5" style={{ color: '#00f5a0' }} />
            Prospect Quota
          </span>
          <span className="text-xs font-semibold text-black" style={{ fontSize: '0.65rem' }}>
            {isActuallyUnlimited ? '∞ Unlimited' : `${quotaData.prospects.quota.current}/${quotaData.prospects.quota.max}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-0.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(prospectPercentage, 100)}%`,
              backgroundColor: isProspectAtLimit ? '#ef4444' : isProspectNearLimit ? '#f97316' : '#00f5a0'
            }}
          />
        </div>
        <div className="flex items-center justify-between text-black" style={{ fontSize: '0.65rem' }}>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" style={{ color: '#00f5a0' }} />
            {timeRemaining}
          </span>
          <span className="font-medium">
            {quotaData.prospects.quota.max - quotaData.prospects.quota.current} left
          </span>
        </div>
      </div>

      {/* Email Generation Quota Bar */}
      <div className="bg-white border-2 border-gray-200 rounded p-1.5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-black flex items-center gap-1" style={{ fontSize: '0.65rem' }}>
            <Mail className="w-2.5 h-2.5" style={{ color: '#00f5a0' }} />
            Email Gen Quota
          </span>
          <span className="text-xs font-semibold text-black" style={{ fontSize: '0.65rem' }}>
            {isActuallyUnlimited ? '∞ Unlimited' : `${quotaData.emails.quota.current}/${quotaData.emails.quota.max}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-0.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(emailPercentage, 100)}%`,
              backgroundColor: isEmailAtLimit ? '#ef4444' : isEmailNearLimit ? '#f97316' : '#00f5a0'
            }}
          />
        </div>
        <div className="flex items-center justify-between text-black" style={{ fontSize: '0.65rem' }}>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" style={{ color: '#00f5a0' }} />
            {timeRemaining}
          </span>
          <span className="font-medium">
            {quotaData.emails.quota.max - quotaData.emails.quota.current} left
          </span>
        </div>
      </div>

      {/* Extra Compact Help Text */}
      {isLimited && (
        <div className="mt-1.5 p-1 bg-white border border-red-200 rounded">
          <p className="text-red-600" style={{ fontSize: '0.65rem' }}>
            {isProspectAtLimit && isEmailAtLimit
              ? 'Prospect and Email quotas reached. Resets in '
              : isProspectAtLimit
              ? 'Prospect quota reached. Resets in '
              : 'Email quota reached. Resets in '}
            {timeRemaining}.
          </p>
        </div>
      )}

      {/* Warning when near limit */}
      {!isLimited && (isProspectNearLimit || isEmailNearLimit) && (
        <div className="mt-1.5 p-1 bg-white border border-orange-200 rounded">
          <p className="text-orange-600" style={{ fontSize: '0.65rem' }}>
            {isProspectNearLimit && isEmailNearLimit
              ? 'Approaching quota limits'
              : isProspectNearLimit
              ? 'Approaching prospect quota limit'
              : 'Approaching email quota limit'}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaBar;
