import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'admin123') {
      setIsAuthenticated(true);
      fetchUsers();

      // Auto-refresh every 5 seconds
      const interval = setInterval(fetchUsers, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('admin_auth', 'admin123');
      setIsAuthenticated(true);
      fetchUsers();
    } else {
      alert('Invalid password');
      setPassword('');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      console.log('📊 Admin: Fetched users response:', response.data);
      console.log('📊 Admin: Users array:', response.data.users);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/users/search?email=${searchEmail}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (user) => {
    try {
      await axios.put(`/api/admin/users/${user.userId}/limit`, {
        email: user.email,
        prospectsPerHour: user.isUnlimited ? 0 : user.prospectsPerHour,
        isUnlimited: user.isUnlimited
      });

      setEditingUser(null);
      fetchUsers();
      alert('User limit updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update user limit');
    }
  };

  const startEdit = (user) => {
    setEditingUser({ ...user });
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400 text-sm">Restricted Area - Authorization Required</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage user prospect search limits</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_auth');
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by user email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => {
                setSearchEmail('');
                fetchUsers();
              }}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Users ({users.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No users found. Users will appear here after they start using the app.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prospects/Hour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.filter(user => user && user.userId).map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {editingUser?.userId === user.userId ? (
                          <input
                            type="email"
                            value={editingUser.email || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            className="px-3 py-1 border border-gray-300 rounded"
                            disabled
                          />
                        ) : (
                          user.email || 'No email'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {user.userId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingUser?.userId === user.userId ? (
                          <input
                            type="number"
                            value={editingUser.prospectsPerHour}
                            onChange={(e) => setEditingUser({ ...editingUser, prospectsPerHour: parseInt(e.target.value) || 50 })}
                            disabled={editingUser.isUnlimited}
                            className="w-20 px-3 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                            min="1"
                            max="10000"
                          />
                        ) : (
                          <span className="font-semibold">{user.isUnlimited ? '∞' : user.prospectsPerHour}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser?.userId === user.userId ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingUser.isUnlimited}
                              onChange={(e) => setEditingUser({ ...editingUser, isUnlimited: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Unlimited</span>
                          </label>
                        ) : (
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isUnlimited
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.isUnlimited ? 'Unlimited' : 'Limited'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingUser?.userId === user.userId ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateLimit(editingUser)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
