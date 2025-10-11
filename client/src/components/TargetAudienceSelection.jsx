import React, { useState } from 'react';
import { 
  Users, Building, Globe, Target, ChevronRight, ChevronLeft, 
  CheckCircle, Plus, X, Search, TrendingUp, MapPin, Briefcase 
} from 'lucide-react';

const TargetAudienceSelection = ({ onNext, onBack, initialData = {} }) => {
  const [audienceType, setAudienceType] = useState(initialData.audienceType || '');
  const [selectedIndustries, setSelectedIndustries] = useState(initialData.industries || []);
  const [selectedRoles, setSelectedRoles] = useState(initialData.roles || []);
  const [companySize, setCompanySize] = useState(initialData.companySize || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [customKeywords, setCustomKeywords] = useState(initialData.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');

  const audienceTypes = [
    {
      id: 'decision_makers',
      title: 'Decision Makers',
      description: 'CEOs, Founders, VPs, Directors who make purchasing decisions',
      icon: Target,
      examples: ['CEO', 'Founder', 'VP Sales', 'Director of Marketing']
    },
    {
      id: 'influencers',
      title: 'Influencers & Champions',
      description: 'Team leads and managers who influence decisions',
      icon: TrendingUp,
      examples: ['Team Lead', 'Senior Manager', 'Product Manager', 'Tech Lead']
    },
    {
      id: 'end_users',
      title: 'End Users',
      description: 'Individual contributors who would use your product',
      icon: Users,
      examples: ['Developer', 'Designer', 'Analyst', 'Specialist']
    }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
    'Manufacturing', 'Real Estate', 'Marketing', 'Consulting', 'Non-profit',
    'Food & Beverage', 'Transportation', 'Energy', 'Media', 'Government',
    'Retail', 'Insurance', 'Telecommunications', 'Construction', 'Legal'
  ];

  const jobRoles = [
    'CEO', 'CTO', 'CMO', 'VP Sales', 'VP Marketing', 'Founder',
    'Director', 'Manager', 'Team Lead', 'Product Manager', 
    'Sales Manager', 'Marketing Manager', 'Operations Manager',
    'Business Development', 'Account Manager', 'Project Manager'
  ];

  const companySizes = [
    { id: 'startup', label: 'Startup (1-10)', description: 'Small teams, quick decisions' },
    { id: 'small', label: 'Small (11-50)', description: 'Growing companies' },
    { id: 'medium', label: 'Medium (51-200)', description: 'Established businesses' },
    { id: 'large', label: 'Large (201-1000)', description: 'Corporate enterprises' },
    { id: 'enterprise', label: 'Enterprise (1000+)', description: 'Large corporations' }
  ];

  const handleIndustryToggle = (industry) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !customKeywords.includes(newKeyword.trim())) {
      setCustomKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setCustomKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleNext = () => {
    const isValid = audienceType && selectedIndustries.length > 0 && companySize;
    if (!isValid) return;

    onNext({
      audienceType,
      industries: selectedIndustries,
      roles: selectedRoles,
      companySize,
      location,
      keywords: customKeywords
    });
  };

  const isFormValid = audienceType && selectedIndustries.length > 0 && companySize;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Progress Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Setup Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-green-600">Campaign Goal</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-green-600">Email Templates</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-blue-600">Target Audience</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <span className="text-sm text-gray-500">SMTP Configuration</span>
            </div>
          </div>
        </div>

        {/* Tutorial Tips */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">🎯 Targeting Tips</h3>
          <p className="text-sm text-gray-600 mb-2">
            More specific targeting leads to better response rates.
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Start with 2-3 industries you know well</li>
            <li>• Target decision makers for faster responses</li>
            <li>• Add keywords related to pain points</li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Define Your Target Audience</h1>
            </div>
            <p className="text-gray-600">
              Specify who you want to reach with your campaign. More precise targeting 
              leads to better response rates and higher conversion.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Audience Type Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                1. Select Audience Type <span className="text-red-500">*</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {audienceTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = audienceType === type.id;
                  
                  return (
                    <div
                      key={type.id}
                      onClick={() => setAudienceType(type.id)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-500/10 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                        <h3 className="font-medium text-gray-900">{type.title}</h3>
                        {isSelected && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <div className="text-xs text-gray-500">
                        Examples: {type.examples.join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Industry Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                2. Select Industries <span className="text-red-500">*</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => handleIndustryToggle(industry)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${selectedIndustries.includes(industry)
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {industry}
                  </button>
                ))}
              </div>
              {selectedIndustries.length > 0 && (
                <div className="mt-3 text-sm text-green-600">
                  Selected: {selectedIndustries.join(', ')}
                </div>
              )}
            </div>

            {/* Job Roles */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                3. Target Job Roles (Optional)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {jobRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${selectedRoles.includes(role)
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Size */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                4. Company Size <span className="text-red-500">*</span>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companySizes.map((size) => (
                  <div
                    key={size.id}
                    onClick={() => setCompanySize(size.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${companySize === size.id 
                        ? 'border-green-500 bg-green-500/10 shadow-md' 
                        : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{size.label}</h3>
                      {companySize === size.id && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{size.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                5. Geographic Location (Optional)
              </h2>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., United States, Europe, Global"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Custom Keywords */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                6. Additional Keywords (Optional)
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Add keywords related to pain points, technologies, etc."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {customKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{keyword}</span>
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {isFormValid && (
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Target Audience Summary</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Audience Type:</span>
                    <span className="ml-2 text-gray-600">
                      {audienceTypes.find(t => t.id === audienceType)?.title}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Company Size:</span>
                    <span className="ml-2 text-gray-600">
                      {companySizes.find(s => s.id === companySize)?.label}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Industries:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedIndustries.join(', ')}
                    </span>
                  </div>
                  {selectedRoles.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Target Roles:</span>
                      <span className="ml-2 text-gray-600">
                        {selectedRoles.join(', ')}
                      </span>
                    </div>
                  )}
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
              <span>Back to Templates</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!isFormValid}
              className={`
                flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all
                ${isFormValid
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span>Continue to SMTP Setup</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetAudienceSelection;