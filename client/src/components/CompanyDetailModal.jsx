import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin, Users, Calendar, Globe, TrendingUp, Award, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CompanyDetailModal = ({ isOpen, onClose, prospect }) => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && prospect) {
      fetchCompanyDetails();
    }
  }, [isOpen, prospect]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/company/details?url=${encodeURIComponent(prospect.website || prospect.source_url || '')}`);
      const data = await response.json();
      if (data.success) {
        setCompanyData(data.company);
      }
    } catch (error) {
      console.error('Failed to fetch company details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-8"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-start rounded-t-2xl z-10">
            <div className="flex items-start space-x-6">
              {/* Company Logo */}
              {companyData?.logo && (
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={companyData.logo} alt="Company logo" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">{prospect.company || 'Company Details'}</h2>
                {companyData?.socialLinks && (
                  <div className="flex items-center space-x-3">
                    {companyData.socialLinks.twitter && (
                      <a href={companyData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {companyData.socialLinks.linkedin && (
                      <a href={companyData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f5a0]"></div>
              </div>
            ) : (
              <>
                {/* Rating */}
                {companyData?.rating && (
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-[#00f5a0]" />
                    <span className="font-semibold text-black">{companyData.rating.source}</span>
                    <span className="text-black font-bold">{companyData.rating.score}</span>
                  </div>
                )}

                {/* Company Description */}
                {companyData?.description && (
                  <div>
                    <p className="text-black text-lg leading-relaxed">{companyData.description}</p>
                  </div>
                )}

                {/* Company Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyData?.founded && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-[#00f5a0]" />
                      <span className="text-black">Founded in {companyData.founded}</span>
                    </div>
                  )}
                  {companyData?.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-[#00f5a0]" />
                      <span className="text-black">{companyData.location}</span>
                    </div>
                  )}
                  {companyData?.employeeCount && (
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-[#00f5a0]" />
                      <span className="text-black">{companyData.employeeCount} employees</span>
                    </div>
                  )}
                  {companyData?.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-[#00f5a0]" />
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-[#00f5a0] transition-colors underline"
                      >
                        {companyData.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Funding Section */}
                {companyData?.funding && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-black mb-4">Funding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Current Stage</p>
                        <p className="text-black font-semibold">{companyData.funding.stage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Funding</p>
                        <p className="text-black font-semibold">{companyData.funding.total || 'Unknown'}</p>
                      </div>
                      {companyData.funding.investors && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Key Investors</p>
                          <p className="text-black font-semibold">{companyData.funding.investors.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Leadership Team */}
                {companyData?.leadership && companyData.leadership.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-black mb-4">Leadership Team</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companyData.leadership.map((leader, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          {leader.photo && (
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-black">{leader.name}</p>
                            <p className="text-sm text-gray-600">{leader.title}</p>
                            {leader.linkedin && (
                              <a
                                href={leader.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#00f5a0] hover:underline"
                              >
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent News */}
                {companyData?.news && companyData.news.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-black mb-4 flex items-center">
                      <Newspaper className="w-5 h-5 text-[#00f5a0] mr-2" />
                      Recent News
                    </h3>
                    <div className="space-y-4">
                      {companyData.news.map((article, index) => (
                        <div key={index} className="border-l-4 border-[#00f5a0] pl-4">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black font-semibold hover:text-[#00f5a0] transition-colors"
                          >
                            {article.title}
                          </a>
                          <p className="text-sm text-gray-500 mt-1">{article.source} " {article.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#00f5a0] text-black font-semibold rounded-lg hover:bg-[#00e090] transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompanyDetailModal;
