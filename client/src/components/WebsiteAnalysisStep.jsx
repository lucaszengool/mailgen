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
        ],
        // NEW: Add social media, tech stack, and contact info
        social: data.analysis.social || {},
        techStack: data.analysis.techStack || [],
        contactInfo: data.analysis.contactInfo || {}
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
          <Loader className="w-12 h-12 text-[#00f5a0] animate-spin mx-auto mb-4" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-[#00f5a0]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Website Analysis</h1>
                <p className="text-sm text-gray-600">AI-powered insights for {targetWebsite}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-black rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#00f5a0]" />
              <span className="text-sm font-semibold text-white">Analysis Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Basic Information Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
              <Globe className="w-5 h-5 text-[#00f5a0]" />
            </div>
            Basic Information
          </h2>

          {/* Business Logo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Logo</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-all">
                {analysis?.logo ? (
                  <img src={analysis.logo} alt="Business Logo" className="w-full h-full object-contain" />
                ) : (
                  <Globe className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="px-4 py-2 bg-black text-white border border-black rounded-xl text-sm font-semibold hover:bg-gray-900 cursor-pointer transition-all shadow-md hover:shadow-lg">
                Upload
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-600 mt-2">Only support uploading logos in SVG format.</p>
          </div>

          {/* Business Name and Product Type */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={analysis?.businessName || ''}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product / Service type<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={analysis?.productType || ''}
                onChange={(e) => updateField('productType', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all font-medium text-gray-900"
              />
            </div>
          </div>

          {/* Benchmark Brands */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Benchmark brands<span className="text-red-500">*</span>
            </label>
            <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl min-h-[48px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-[#00f5a0] focus-within:border-[#00f5a0] transition-all">
              {analysis?.benchmarkBrands && analysis.benchmarkBrands.length > 0 ? (
                analysis.benchmarkBrands.map((brand, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium shadow-sm">
                    {brand}
                    <button
                      onClick={() => removeBenchmarkBrand(brand)}
                      className="ml-2 text-[#00f5a0] hover:text-white transition-colors"
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
                className="flex-1 min-w-[200px] outline-none text-sm font-medium text-gray-900"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              We'll recommend influencers who have worked with these brands or reached similar audiences.
            </p>
          </div>
        </div>

        {/* Business Introduction Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
              <Sparkles className="w-5 h-5 text-[#00f5a0]" />
            </div>
            Business Introduction
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Business introduction<span className="text-red-500">*</span>
            </label>
            <textarea
              value={analysis?.businessIntro || ''}
              onChange={(e) => updateField('businessIntro', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all font-medium text-gray-900"
            />
          </div>
        </div>

        {/* Core Selling Points */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-[#00f5a0]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Core Selling Points</h3>
            </div>
            <button
              onClick={addSellingPoint}
              className="px-4 py-2 bg-[#00f5a0] hover:bg-[#00e090] text-black font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              + Add Point
            </button>
          </div>
          <div className="grid gap-4">
            {analysis?.sellingPoints?.map((point, index) => (
              <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 hover:border-[#00f5a0] transition-all">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#00f5a0]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#00f5a0] text-sm font-bold">{index + 1}</span>
                  </div>
                  <textarea
                    value={point}
                    onChange={(e) => updateSellingPoint(index, e.target.value)}
                    rows={2}
                    className="flex-1 text-gray-900 text-sm leading-relaxed border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] resize-none font-medium transition-all"
                  />
                  <button
                    onClick={() => removeSellingPoint(index)}
                    className="text-red-500 hover:text-red-700 text-xl font-bold transition-colors"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Audiences */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-[#00f5a0]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Target Audiences</h3>
              <span className="text-sm text-gray-600 font-medium">({analysis?.audiences?.length || 0} segments)</span>
            </div>
            <button
              onClick={addAudience}
              className="px-4 py-2 bg-[#00f5a0] text-black text-sm font-bold rounded-xl hover:bg-[#00e090] shadow-md hover:shadow-lg transition-all"
            >
              + Add Audience
            </button>
          </div>
          <div className="grid gap-4">
            {analysis?.audiences?.map((audience, index) => (
              <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 hover:border-[#00f5a0] transition-all">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-black rounded-xl flex-shrink-0 shadow-sm">
                    <Target className="w-5 h-5 text-[#00f5a0]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-black text-[#00f5a0] font-bold text-xs rounded-lg">{index + 1}</span>
                      <input
                        type="text"
                        value={audience.title}
                        onChange={(e) => updateAudience(index, 'title', e.target.value)}
                        placeholder="Audience title"
                        className="flex-1 font-bold text-gray-900 text-sm border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] transition-all"
                      />
                    </div>
                    <textarea
                      value={audience.description}
                      onChange={(e) => updateAudience(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Audience description"
                      className="w-full text-gray-700 text-sm leading-relaxed border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0] resize-none font-medium transition-all"
                    />
                  </div>
                  <button
                    onClick={() => removeAudience(index)}
                    className="text-red-500 hover:text-red-700 text-xl font-bold transition-colors"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Section */}
        {analysis?.social && Object.keys(analysis.social).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Social Media</h2>
            <div className="flex flex-wrap gap-3">
              {analysis.social.twitter && (
                <a href={analysis.social.twitter} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </a>
              )}
              {analysis.social.linkedin && (
                <a href={analysis.social.linkedin} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>
                  LinkedIn
                </a>
              )}
              {analysis.social.facebook && (
                <a href={analysis.social.facebook} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              )}
              {analysis.social.instagram && (
                <a href={analysis.social.instagram} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  Instagram
                </a>
              )}
              {analysis.social.youtube && (
                <a href={analysis.social.youtube} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </a>
              )}
              {analysis.social.github && (
                <a href={analysis.social.github} target="_blank" rel="noopener noreferrer"
                   className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  GitHub
                </a>
              )}
            </div>
          </div>
        )}

        {/* Technology Stack Section */}
        {analysis?.techStack && analysis.techStack.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <Briefcase className="w-5 h-5 text-[#00f5a0]" />
              <h2 className="text-xl font-bold text-gray-900">Technology Stack</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {analysis.techStack.map((tech, idx) => {
                const styles = [
                  'bg-black text-[#00f5a0] border-[#00f5a0]',
                  'bg-[#00f5a0] text-white',
                  'bg-gray-900 text-white',
                  'bg-green-50 text-gray-900 border-green-200'
                ];
                const styleClass = styles[idx % styles.length];
                return (
                  <span
                    key={idx}
                    className={`px-4 py-2.5 ${styleClass} rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer border`}
                  >
                    {tech}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact Information Section */}
        {analysis?.contactInfo && (Object.keys(analysis.contactInfo).length > 0) && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="grid grid-cols-2 gap-6">
              {analysis.contactInfo.email && (
                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Email</div>
                  <div className="font-semibold text-gray-900">{analysis.contactInfo.email}</div>
                </div>
              )}
              {analysis.contactInfo.phone && (
                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Phone</div>
                  <div className="font-semibold text-gray-900">{analysis.contactInfo.phone}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-white border-2 border-black text-black font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="px-10 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-lg hover:scale-105 hover:shadow-xl flex items-center space-x-2"
          >
            <span>Continue to Setup</span>
            <span className="text-[#00f5a0]">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAnalysisStep;
