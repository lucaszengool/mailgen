import React, { useState, useEffect } from 'react';
import { Globe, Sparkles, TrendingUp, Users, Target, Briefcase, CheckCircle, Loader } from 'lucide-react';

const WebsiteAnalysisStep = ({ targetWebsite, onNext, onBack }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBrand, setNewBrand] = useState('');

  useEffect(() => {
    if (targetWebsite) {
      analyzeWebsite();
    }
  }, [targetWebsite]);

  const analyzeWebsite = async () => {
    setLoading(true);
    setError(null);

    // Dispatch notification event for website analysis starting
    window.dispatchEvent(new CustomEvent('workflow-notification', {
      detail: { stage: 'websiteAnalysisStarting' }
    }));

    try {
      const response = await fetch('/api/website-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWebsite })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const data = await response.json();

      console.log('📊 Raw API response:', data);

      // Use the comprehensive analysis from Ollama
      const formattedAnalysis = {
        businessName: data.analysis.companyName || 'Business',
        logo: data.analysis.logo || '',
        businessIntro: data.analysis.businessIntroduction || data.analysis.valueProposition || 'AI-powered business analysis',
        productType: data.analysis.productType || data.analysis.industry || 'Digital Service',
        benchmarkBrands: data.analysis.benchmarkBrands || [],
        sellingPoints: data.analysis.sellingPoints || ['Innovative solutions', 'Quality service'],
        audiences: data.analysis.targetAudiences || [
          { title: 'Business Decision Makers', description: 'Executives and managers looking for solutions' }
        ]
      };

      console.log('✅ Formatted analysis:', formattedAnalysis);
      setAnalysis(formattedAnalysis);

      // Dispatch notification event for website analysis complete
      window.dispatchEvent(new CustomEvent('workflow-notification', {
        detail: { stage: 'websiteAnalysisComplete' }
      }));
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (analysis) {
      onNext({
        websiteAnalysis: analysis,
        analyzedAt: new Date().toISOString()
      });
    }
  };

  const updateField = (field, value) => {
    setAnalysis({ ...analysis, [field]: value });
  };

  const addBenchmarkBrand = () => {
    if (newBrand.trim() && (!analysis.benchmarkBrands || !analysis.benchmarkBrands.includes(newBrand.trim()))) {
      const brands = analysis.benchmarkBrands || [];
      setAnalysis({ ...analysis, benchmarkBrands: [...brands, newBrand.trim()] });
      setNewBrand('');
    }
  };

  const removeBenchmarkBrand = (brandToRemove) => {
    setAnalysis({
      ...analysis,
      benchmarkBrands: analysis.benchmarkBrands.filter(b => b !== brandToRemove)
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAnalysis({ ...analysis, logo: event.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an SVG file');
    }
  };

  const updateSellingPoint = (index, value) => {
    const updatedPoints = [...analysis.sellingPoints];
    updatedPoints[index] = value;
    setAnalysis({ ...analysis, sellingPoints: updatedPoints });
  };

  const addSellingPoint = () => {
    const updatedPoints = [...(analysis.sellingPoints || []), ''];
    setAnalysis({ ...analysis, sellingPoints: updatedPoints });
  };

  const removeSellingPoint = (index) => {
    const updatedPoints = analysis.sellingPoints.filter((_, i) => i !== index);
    setAnalysis({ ...analysis, sellingPoints: updatedPoints });
  };

  const updateAudience = (index, field, value) => {
    const updatedAudiences = [...analysis.audiences];
    updatedAudiences[index] = { ...updatedAudiences[index], [field]: value };
    setAnalysis({ ...analysis, audiences: updatedAudiences });
  };

  const addAudience = () => {
    const updatedAudiences = [...(analysis.audiences || []), { title: '', description: '' }];
    setAnalysis({ ...analysis, audiences: updatedAudiences });
  };

  const removeAudience = (index) => {
    const updatedAudiences = analysis.audiences.filter((_, i) => i !== index);
    setAnalysis({ ...analysis, audiences: updatedAudiences });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Website</h2>
          <p className="text-gray-600">Our AI is analyzing {targetWebsite}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={analyzeWebsite}
              className="px-6 py-2.5 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Website Analysis</h1>
                <p className="text-sm text-gray-500">AI-powered insights for {targetWebsite}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Analysis Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Basic Information Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic information</h2>

          {/* Business Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {analysis?.logo ? (
                  <img src={analysis.logo} alt="Business Logo" className="w-full h-full object-contain" />
                ) : (
                  <Globe className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                Upload
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Only support uploading logos in SVG format.</p>
          </div>

          {/* Business Name and Product Type */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={analysis?.businessName || ''}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product / Service type<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={analysis?.productType || ''}
                onChange={(e) => updateField('productType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Benchmark Brands */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benchmark brands<span className="text-red-500">*</span>
            </label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[42px] flex flex-wrap gap-2 items-center">
              {analysis?.benchmarkBrands && analysis.benchmarkBrands.length > 0 ? (
                analysis.benchmarkBrands.map((brand, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                    {brand}
                    <button
                      onClick={() => removeBenchmarkBrand(brand)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >×</button>
                  </span>
                ))
              ) : null}
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addBenchmarkBrand()}
                placeholder="Type brand name and press Enter"
                className="flex-1 min-w-[200px] outline-none text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              We'll recommend influencers who have worked with these brands or reached similar audiences.
            </p>
          </div>
        </div>

        {/* Business Introduction Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Business introduction</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business introduction<span className="text-red-500">*</span>
            </label>
            <textarea
              value={analysis?.businessIntro || ''}
              onChange={(e) => updateField('businessIntro', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Core Selling Points */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Core Selling Points</h3>
            </div>
            <button
              onClick={addSellingPoint}
              className="px-3 py-1.5 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold text-sm rounded-lg"
            >
              + Add Point
            </button>
          </div>
          <div className="grid gap-3">
            {analysis?.sellingPoints?.map((point, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">{index + 1}</span>
                  </div>
                  <textarea
                    value={point}
                    onChange={(e) => updateSellingPoint(index, e.target.value)}
                    rows={2}
                    className="flex-1 text-gray-700 text-sm leading-relaxed border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={() => removeSellingPoint(index)}
                    className="text-red-500 hover:text-red-700 text-xl"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Audiences */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Target Audiences</h3>
              <span className="text-sm text-gray-500">({analysis?.audiences?.length || 0} segments)</span>
            </div>
            <button
              onClick={addAudience}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              + Add Audience
            </button>
          </div>
          <div className="grid gap-3">
            {analysis?.audiences?.map((audience, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600 font-bold text-xs">{index + 1}</span>
                      <input
                        type="text"
                        value={audience.title}
                        onChange={(e) => updateAudience(index, 'title', e.target.value)}
                        placeholder="Audience title"
                        className="flex-1 font-semibold text-gray-900 text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <textarea
                      value={audience.description}
                      onChange={(e) => updateAudience(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Audience description"
                      className="w-full text-gray-600 text-sm leading-relaxed border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    onClick={() => removeAudience(index)}
                    className="text-red-500 hover:text-red-700 text-xl"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="px-8 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
          >
            Continue to Setup →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAnalysisStep;
