import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Get API URL - use VITE_API_URL in production, relative path in dev
const API_URL = import.meta.env.VITE_API_URL || '';

export default function GmailOAuthButton() {
  const [oauthStatus, setOauthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkOAuthStatus();

    // Check for OAuth callback success/error in URL params
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get('oauth');
    const email = params.get('email');
    const message = params.get('message');

    if (oauthResult === 'success') {
      toast.success(`Gmail connected successfully! (${email})`);
      checkOAuthStatus(); // Refresh status
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthResult === 'error') {
      toast.error(`OAuth failed: ${message || 'Unknown error'}`);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkOAuthStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(`${API_URL}/api/gmail-oauth/status`);
      const data = await response.json();

      if (data.success) {
        setOauthStatus(data);
      }
    } catch (error) {
      console.error('Failed to check OAuth status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnectGmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/gmail-oauth/authorize`);
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Open OAuth popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.authUrl,
          'Gmail OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Check if popup is closed
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setLoading(false);
            // Refresh status after popup closes
            setTimeout(() => checkOAuthStatus(), 1000);
          }
        }, 500);
      } else {
        toast.error('Failed to initiate OAuth flow');
        setLoading(false);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error('Failed to connect to Gmail');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? You will need to re-authorize to send emails.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/gmail-oauth/disconnect`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Gmail disconnected successfully');
        setOauthStatus(null);
      } else {
        toast.error('Failed to disconnect Gmail');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/gmail-oauth/test`);
      const data = await response.json();

      if (data.success) {
        toast.success('OAuth connection is working!');
      } else {
        toast.error('OAuth connection failed - please reconnect');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Gmail OAuth Connection
          </h3>
          <p className="text-sm text-gray-600">
            Connect your Gmail account securely with OAuth 2.0 (no password required)
          </p>
        </div>

        {oauthStatus?.hasOAuth && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      {oauthStatus?.hasOAuth ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Connected to: {oauthStatus.oauthInfo.email}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Connected on: {new Date(oauthStatus.oauthInfo.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Why use OAuth?
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>No need to create app-specific passwords</li>
                  <li>More secure than storing passwords</li>
                  <li>Can be revoked anytime from Google account settings</li>
                  <li>Automatic token refresh</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectGmail}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
              <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
              <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
              <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Connecting...' : 'Connect with Gmail'}
            </span>
          </button>

          <p className="text-xs text-gray-500 text-center">
            By connecting, you authorize this app to send emails on your behalf
          </p>
        </div>
      )}
    </div>
  );
}
