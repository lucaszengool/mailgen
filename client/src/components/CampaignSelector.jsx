import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, FolderOpen, Calendar, Mail,
  Users, TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CampaignSelector({ onSelectCampaign, onCreateCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    try {
      const stored = localStorage.getItem('campaigns');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCampaigns(parsed);

        // If no campaigns exist, auto-create the first one
        if (parsed.length === 0) {
          createFirstCampaign();
        }
      } else {
        createFirstCampaign();
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      createFirstCampaign();
    }
  };

  const createFirstCampaign = () => {
    const firstCampaign = {
      id: Date.now().toString(),
      name: 'My First Campaign',
      createdAt: new Date().toISOString(),
      status: 'active',
      stats: {
        prospects: 0,
        emails: 0,
        sent: 0
      }
    };
    const newCampaigns = [firstCampaign];
    setCampaigns(newCampaigns);
    localStorage.setItem('campaigns', JSON.stringify(newCampaigns));
  };

  const handleCreateCampaign = () => {
    if (!newCampaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    const newCampaign = {
      id: Date.now().toString(),
      name: newCampaignName.trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
      stats: {
        prospects: 0,
        emails: 0,
        sent: 0
      }
    };

    const updatedCampaigns = [...campaigns, newCampaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

    setShowCreateModal(false);
    setNewCampaignName('');
    toast.success(`Campaign "${newCampaign.name}" created!`);

    if (onCreateCampaign) {
      onCreateCampaign(newCampaign);
    }
  };

  const handleDeleteCampaign = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);

    if (campaigns.length === 1) {
      toast.error('Cannot delete the last campaign. Create another one first.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${campaign.name}"?\n\nThis will delete all prospects, emails, and data for this campaign.\n\nThis action cannot be undone!`)) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
      setCampaigns(updatedCampaigns);
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

      // Clear campaign-specific data
      localStorage.removeItem(`campaign_${campaignId}_data`);

      toast.success(`Campaign "${campaign.name}" deleted`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Campaigns</h1>
              <p className="text-gray-600 mt-2">Select a campaign to manage or create a new one</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              style={{ backgroundColor: '#00f0a0', color: '#000' }}
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {/* Campaign Card Header */}
              <div
                onClick={() => onSelectCampaign(campaign)}
                className="p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f0a0' }}>
                      <FolderOpen className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(campaign.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{campaign.stats.prospects}</div>
                    <div className="text-xs text-gray-500">Prospects</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Mail className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{campaign.stats.emails}</div>
                    <div className="text-xs text-gray-500">Emails</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{campaign.stats.sent}</div>
                    <div className="text-xs text-gray-500">Sent</div>
                  </div>
                </div>

                {/* Open Button */}
                <div className="flex items-center justify-center text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                  Open Campaign
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Delete Button */}
              <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCampaign(campaign.id);
                  }}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Campaign
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full shadow-xl"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h3>
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCampaign()}
                placeholder="Enter campaign name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3 px-6 pb-6 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCampaignName('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#00f0a0', color: '#000' }}
              >
                Create Campaign
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
