import React, { useState } from 'react';
import { 
  Target, Users, Handshake, TrendingUp, MessageSquare, Building, 
  ChevronRight, ChevronLeft, CheckCircle, Star, Zap 
} from 'lucide-react';

const CampaignGoalSelection = ({ onNext, onBack, initialData = {} }) => {
  const [selectedGoal, setSelectedGoal] = useState(initialData.campaignGoal || '');

  const campaignGoals = [
    {
      id: 'lead_generation',
      title: 'Lead Generation',
      description: 'Find and attract new potential customers',
      icon: Users,
      color: 'blue',
      features: ['Prospect Discovery', 'Lead Scoring', 'Contact Collection'],
      bestFor: 'Growing your customer base',
      conversionRate: '15-25%'
    },
    {
      id: 'partnership',
      title: 'Business Partnerships',
      description: 'Connect with companies for strategic partnerships',
      icon: Handshake,
      color: 'green',
      features: ['B2B Outreach', 'Partnership Proposals', 'Collaboration'],
      bestFor: 'Strategic business growth',
      conversionRate: '8-15%'
    },
    {
      id: 'sales',
      title: 'Direct Sales',
      description: 'Convert prospects into paying customers',
      icon: TrendingUp,
      color: 'purple',
      features: ['Sales Outreach', 'Product Demos', 'Follow-ups'],
      bestFor: 'Revenue generation',
      conversionRate: '20-35%'
    },
    {
      id: 'networking',
      title: 'Professional Networking',
      description: 'Build relationships and expand your network',
      icon: MessageSquare,
      color: 'orange',
      features: ['Relationship Building', 'Industry Connections', 'Event Invites'],
      bestFor: 'Long-term relationships',
      conversionRate: '25-40%'
    },
    {
      id: 'brand_awareness',
      title: 'Brand Awareness',
      description: 'Increase visibility and recognition of your brand',
      icon: Star,
      color: 'pink',
      features: ['Brand Introduction', 'Content Sharing', 'Thought Leadership'],
      bestFor: 'Brand building',
      conversionRate: '10-20%'
    },
    {
      id: 'product_launch',
      title: 'Product Launch',
      description: 'Announce and promote new products or services',
      icon: Zap,
      color: 'yellow',
      features: ['Product Announcements', 'Feature Highlights', 'Early Access'],
      bestFor: 'New product introduction',
      conversionRate: '12-22%'
    }
  ];

  const handleGoalSelect = (goalId) => {
    setSelectedGoal(goalId);
  };

  const handleNext = () => {
    if (!selectedGoal) return;
    
    const selectedGoalData = campaignGoals.find(goal => goal.id === selectedGoal);
    onNext({
      campaignGoal: selectedGoal,
      goalData: selectedGoalData
    });
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: isSelected 
        ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20' 
        : 'border-gray-700 hover:border-blue-400',
      green: isSelected 
        ? 'border-green-500 bg-green-500/10 shadow-green-500/20' 
        : 'border-gray-700 hover:border-green-400',
      purple: isSelected 
        ? 'border-purple-500 bg-purple-500/10 shadow-purple-500/20' 
        : 'border-gray-700 hover:border-purple-400',
      orange: isSelected 
        ? 'border-orange-500 bg-orange-500/10 shadow-orange-500/20' 
        : 'border-gray-700 hover:border-orange-400',
      pink: isSelected 
        ? 'border-pink-500 bg-pink-500/10 shadow-pink-500/20' 
        : 'border-gray-700 hover:border-pink-400',
      yellow: isSelected 
        ? 'border-yellow-500 bg-yellow-500/10 shadow-yellow-500/20' 
        : 'border-gray-700 hover:border-yellow-400'
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-400',
      green: 'text-green-400',
      purple: 'text-purple-400',
      orange: 'text-orange-400',
      pink: 'text-pink-400',
      yellow: 'text-yellow-400'
    };
    return colors[color];
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Progress Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Setup Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-blue-600">Campaign Goal</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <span className="text-sm text-gray-500">Email Templates</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <span className="text-sm text-gray-500">Target Audience</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <span className="text-sm text-gray-500">SMTP Configuration</span>
            </div>
          </div>
        </div>

        {/* Tutorial Tips */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">💡 Tutorial Tip</h3>
          <p className="text-sm text-gray-600">
            Your campaign goal determines the email templates, messaging tone, and targeting strategy. 
            Choose the option that best matches your primary objective.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Choose Your Campaign Goal</h1>
            </div>
            <p className="text-gray-600">
              Select the primary objective for your email marketing campaign. This will customize 
              your templates and messaging strategy.
            </p>
          </div>
        </div>

        {/* Goal Selection Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignGoals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;
                
                return (
                  <div
                    key={goal.id}
                    onClick={() => handleGoalSelect(goal.id)}
                    className={`
                      relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${getColorClasses(goal.color, isSelected)}
                      ${isSelected ? 'shadow-lg transform scale-105' : 'hover:shadow-md'}
                    `}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="mb-4">
                      <Icon className={`w-8 h-8 ${getIconColor(goal.color)}`} />
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {goal.description}
                    </p>

                    {/* Features */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Key Features:</p>
                      <ul className="space-y-1">
                        {goal.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-xs text-gray-600">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Stats */}
                    <div className="border-t border-gray-200 pt-3 mt-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Best for:</span>
                        <span className="font-medium text-gray-700">{goal.bestFor}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-500">Avg. Response:</span>
                        <span className={`font-medium ${getIconColor(goal.color)}`}>
                          {goal.conversionRate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Goal Details */}
            {selectedGoal && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">You've selected: {campaignGoals.find(g => g.id === selectedGoal)?.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Great choice! This goal will help us customize your email templates, target the right audience, 
                  and craft messages that resonate with your prospects.
                </p>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ready to continue to email template selection
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedGoal}
              className={`
                flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all
                ${selectedGoal
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span>Continue to Templates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignGoalSelection;