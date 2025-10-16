import React, { useState, useEffect } from 'react';
import { setDevUserId, getCurrentUserId } from '../utils/apiClient';

/**
 * Development User Switcher
 * Allows switching between different user IDs for testing multi-tenant functionality
 * Only visible in development mode
 */
const DevUserSwitcher = () => {
  const [currentUserId, setCurrentUserId] = useState('anonymous');
  const [isVisible, setIsVisible] = useState(false);
  const [customUserId, setCustomUserId] = useState('');

  // Predefined test users
  const testUsers = [
    { id: 'anonymous', label: 'Anonymous User', color: 'bg-gray-500' },
    { id: 'user_a', label: 'User A (Test)', color: 'bg-blue-500' },
    { id: 'user_b', label: 'User B (Test)', color: 'bg-green-500' },
    { id: 'user_c', label: 'User C (Test)', color: 'bg-purple-500' },
  ];

  useEffect(() => {
    // Load current user ID
    getCurrentUserId().then(setCurrentUserId);

    // Only show in development
    const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
    setIsVisible(isDev);
  }, []);

  const switchUser = (userId) => {
    setDevUserId(userId);
    setCurrentUserId(userId);
    console.log(`🔄 Switched to user: ${userId}`);

    // Reload to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const setCustomUser = () => {
    if (customUserId.trim()) {
      switchUser(customUserId.trim());
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            🧪 Dev Mode
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
            Testing
          </span>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Current User:
          </div>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                testUsers.find((u) => u.id === currentUserId)?.color ||
                'bg-gray-400'
              }`}
            />
            <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {currentUserId}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Switch User:
          </div>
          {testUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => switchUser(user.id)}
              disabled={currentUserId === user.id}
              className={`w-full flex items-center px-3 py-2 rounded text-sm transition-colors ${
                currentUserId === user.id
                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${user.color}`} />
              <span className="text-gray-700 dark:text-gray-300">
                {user.label}
              </span>
              {currentUserId === user.id && (
                <span className="ml-auto text-green-500">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Custom User ID:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUserId}
              onChange={(e) => setCustomUserId(e.target.value)}
              placeholder="user_custom"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              onKeyPress={(e) => e.key === 'Enter' && setCustomUser()}
            />
            <button
              onClick={setCustomUser}
              disabled={!customUserId.trim()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          💡 Data is isolated per user. Switch users to test multi-tenancy.
        </div>
      </div>
    </div>
  );
};

export default DevUserSwitcher;
