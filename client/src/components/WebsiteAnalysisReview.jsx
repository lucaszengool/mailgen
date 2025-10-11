import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  PencilSquareIcon, 
  ArrowRightIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  TagIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const WebsiteAnalysisReview = ({ targetWebsite, campaignGoal, businessType, onConfirm, onBack }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    analyzeWebsite();
  }, [targetWebsite]);

  const analyzeWebsite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/langgraph-agent/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWebsite })
      });

      const result = await response.json();
      if (result.success) {
        setAnalysis(result.analysis);
        setEditedData(result.analysis);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Website analysis failed:', error);
      // 提供默认分析结果
      const defaultAnalysis = {
        companyName: extractCompanyName(targetWebsite),
        website: targetWebsite,
        industry: '',
        valueProposition: '',
        mainProducts: [],
        targetAudience: '',
        keyFeatures: [],
        competitiveAdvantages: []
      };
      setAnalysis(defaultAnalysis);
      setEditedData(defaultAnalysis);
    }
    setLoading(false);
  };

  const extractCompanyName = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Company';
    }
  };

  const handleEdit = (field) => {
    setEditing({ ...editing, [field]: true });
  };

  const handleSave = (field) => {
    setEditing({ ...editing, [field]: false });
  };

  const handleChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...(editedData[field] || [])];
    newArray[index] = value;
    setEditedData({ ...editedData, [field]: newArray });
  };

  const addArrayItem = (field) => {
    const newArray = [...(editedData[field] || []), ''];
    setEditedData({ ...editedData, [field]: newArray });
  };

  const removeArrayItem = (field, index) => {
    const newArray = editedData[field].filter((_, i) => i !== index);
    setEditedData({ ...editedData, [field]: newArray });
  };

  const handleConfirm = async () => {
    console.log('🚀 Launch AI Agent clicked - starting backend workflow...');
    
    try {
      // Start the complete workflow including marketing strategy generation
      const response = await fetch('/api/langgraph-agent/execute-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWebsite: targetWebsite,
          campaignGoal: campaignGoal || 'partnership',
          businessType: businessType || 'technology',
          websiteAnalysis: editedData // Pass the edited analysis data
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Backend workflow started successfully:', result);
      } else {
        console.error('❌ Failed to start workflow:', response.status);
      }
    } catch (error) {
      console.error('❌ Error starting workflow:', error);
    }
    
    // Continue with original flow
    onConfirm(editedData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Analyzing website...</h2>
          <p className="text-white/60">Using AI to deeply analyze {targetWebsite}</p>
        </div>
      </div>
    );
  }

  const EditableField = ({ field, label, value, type = 'text', icon: Icon, placeholder }) => (
    <motion.div 
      className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-[#FFD700]/30 transition-all"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-5 h-5 text-[#FFD700]" />}
          <h3 className="font-semibold text-white">{label}</h3>
        </div>
        {!editing[field] && (
          <button 
            onClick={() => handleEdit(field)}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4 text-white/60" />
          </button>
        )}
      </div>

      {editing[field] ? (
        <div className="space-y-3">
          {type === 'textarea' ? (
            <textarea
              value={editedData[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] resize-none"
              rows={3}
            />
          ) : (
            <input
              type="text"
              value={editedData[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
            />
          )}
          <div className="flex space-x-2">
            <button 
              onClick={() => handleSave(field)}
              className="px-4 py-2 bg-[#FFD700] text-black rounded-lg hover:bg-[#FFC107] transition-colors text-sm font-medium"
            >
              Save
            </button>
            <button 
              onClick={() => {
                setEditing({ ...editing, [field]: false });
                setEditedData({ ...editedData, [field]: analysis[field] });
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-white/90">
          {editedData[field] || <span className="text-white/40 italic">Click to edit and add information</span>}
        </div>
      )}
    </motion.div>
  );

  const EditableArrayField = ({ field, label, values, icon: Icon, placeholder, itemLabel }) => (
    <motion.div 
      className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-[#FFD700]/30 transition-all"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-5 h-5 text-[#FFD700]" />}
          <h3 className="font-semibold text-white">{label}</h3>
        </div>
        {!editing[field] && (
          <button 
            onClick={() => handleEdit(field)}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4 text-white/60" />
          </button>
        )}
      </div>

      {editing[field] ? (
        <div className="space-y-3">
          {(editedData[field] || []).map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange(field, index, e.target.value)}
                placeholder={`${itemLabel} ${index + 1}`}
                className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
              />
              <button
                onClick={() => removeArrayItem(field, index)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem(field)}
            className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-white/60 hover:border-[#FFD700] hover:text-[#FFD700] transition-colors"
          >
            + Add {itemLabel}
          </button>
          <div className="flex space-x-2 pt-2">
            <button 
              onClick={() => handleSave(field)}
              className="px-4 py-2 bg-[#FFD700] text-black rounded-lg hover:bg-[#FFC107] transition-colors text-sm font-medium"
            >
              Save
            </button>
            <button 
              onClick={() => {
                setEditing({ ...editing, [field]: false });
                setEditedData({ ...editedData, [field]: analysis[field] });
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {(editedData[field] || []).length === 0 ? (
            <span className="text-white/40 italic">Click to edit and add {itemLabel}</span>
          ) : (
            (editedData[field] || []).map((item, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm font-medium text-[#FFD700]">#{index + 1}</span>
                <span className="text-white/90">{item}</span>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-[#FFD700]" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Website Analysis Results
            </h1>
          </div>
          <p className="text-white/80 text-lg mb-4">
            Please review and refine the AI analysis results, ensure accuracy before launching the intelligent agent
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-white/60">
            <GlobeAltIcon className="w-4 h-4" />
            <span>{targetWebsite}</span>
          </div>
        </motion.div>

        {/* 分析结果网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <EditableField
            field="companyName"
            label="Company Name"
            value={editedData.companyName}
            icon={BuildingOfficeIcon}
            placeholder="Enter company name..."
          />

          <EditableField
            field="industry"
            label="Industry Type"
            value={editedData.industry}
            icon={TagIcon}
            placeholder="例如：Technology, Healthcare, Finance..."
          />

          <div className="md:col-span-2">
            <EditableField
              field="valueProposition"
              label="Value Proposition"
              value={editedData.valueProposition}
              type="textarea"
              icon={SparklesIcon}
              placeholder="Describe the company's core value proposition and competitive advantages..."
            />
          </div>

          <EditableField
            field="targetAudience"
            label="Target Audience"
            value={editedData.targetAudience}
            icon={UserGroupIcon}
            placeholder="Describe the main target customer groups..."
          />
        </div>

        {/* 数组字段 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <EditableArrayField
            field="mainProducts"
            label="Main Products/Services"
            values={editedData.mainProducts}
            icon={TagIcon}
            placeholder="Product name"
            itemLabel="Product"
          />

          <EditableArrayField
            field="keyFeatures"
            label="Key Features"
            values={editedData.keyFeatures}
            icon={CheckCircleIcon}
            placeholder="Feature description"
            itemLabel="Feature"
          />

          <div className="md:col-span-2">
            <EditableArrayField
              field="competitiveAdvantages"
              label="Competitive Advantages"
              values={editedData.competitiveAdvantages}
              icon={SparklesIcon}
              placeholder="Advantage description"
              itemLabel="Advantage"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <motion.div 
          className="flex justify-between items-center pt-6 border-t border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button 
            onClick={onBack}
            className="px-6 py-3 text-white/70 border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-colors font-medium"
          >
            Back to Setup
          </button>

          <motion.button 
            onClick={handleConfirm}
            className="flex items-center space-x-2 px-8 py-3 bg-[#FFD700] hover:bg-[#FFC107] text-black rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Launch AI Agent</span>
            <ArrowRightIcon className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* 提示信息 */}
        <motion.div 
          className="mt-6 p-4 bg-gray-900/60 rounded-lg border border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-[#FFD700]/20 rounded-full mt-0.5">
              <SparklesIcon className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="text-sm text-white/80">
              <p className="font-medium mb-1 text-[#FFD700]">💡 Optimization Tips</p>
              <p>The more detailed and accurate the information, the more personalized and effective the AI agent's marketing strategies and emails will be. We recommend spending a few minutes refining important information.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WebsiteAnalysisReview;