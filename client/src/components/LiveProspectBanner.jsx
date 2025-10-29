import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Target } from 'lucide-react';

const LiveProspectBanner = () => {
  const [prospectCount, setProspectCount] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Simulate finding new prospects every 3 seconds
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setProspectCount(prev => prev + Math.floor(Math.random() * 5) + 1);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-16" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-5xl mx-auto px-12">
        <div className="rounded-2xl p-8 relative overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)',
               boxShadow: '0 8px 24px rgba(0, 240, 160, 0.2)'
             }}>
          {/* Animated background pulse */}
          <div className="absolute inset-0 opacity-20">
            <style>{`
              @keyframes pulse-ring {
                0% {
                  transform: scale(0.8);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 0.5;
                }
                100% {
                  transform: scale(0.8);
                  opacity: 1;
                }
              }
              .pulse-ring {
                animation: pulse-ring 2s ease-in-out infinite;
              }
            `}</style>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl pulse-ring"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl pulse-ring" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <Sparkles className="w-6 h-6" style={{ color: '#001529' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold" style={{ color: '#001529' }}>
                      Great News! We Found {prospectCount} Perfect Prospects
                    </h3>
                    {isAnimating && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(0, 21, 41, 0.1)', color: '#001529' }}>
                        <style>{`
                          @keyframes fadeIn {
                            from { opacity: 0; transform: scale(0.8); }
                            to { opacity: 1; transform: scale(1); }
                          }
                          .fade-in {
                            animation: fadeIn 0.5s ease-out;
                          }
                        `}</style>
                        <span className="fade-in">+NEW</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(0, 21, 41, 0.8)' }}>
                    AI Agent is actively searching...
                  </p>
                </div>
              </div>

              {/* Live Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                   style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <style>{`
                  @keyframes live-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                  }
                  .live-dot {
                    animation: live-pulse 1.5s ease-in-out infinite;
                  }
                `}</style>
                <span className="w-2 h-2 rounded-full live-dot" style={{ backgroundColor: '#001529' }}></span>
                <span className="text-sm font-semibold" style={{ color: '#001529' }}>LIVE</span>
              </div>
            </div>

            <p className="text-lg mb-6 leading-relaxed"
               style={{ color: '#001529' }}>
              Based on your business profile, we have identified these high-quality leads that match your ideal customer profile.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: <Users className="w-5 h-5" />, label: 'Prospects Found', value: prospectCount },
                { icon: <Target className="w-5 h-5" />, label: 'Match Score', value: '94%' },
                { icon: <TrendingUp className="w-5 h-5" />, label: 'More Coming', value: '...' }
              ].map((stat, index) => (
                <div key={index} className="rounded-lg p-4"
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: '#001529' }}>
                    {stat.icon}
                    <span className="text-xs font-medium">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#001529' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Message */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  .spinning {
                    animation: spin 2s linear infinite;
                  }
                `}</style>
                <Sparkles className="w-5 h-5 spinning" style={{ color: '#001529' }} />
                <span className="text-sm font-medium" style={{ color: '#001529' }}>
                  AI agent continuously finding more prospects for you...
                </span>
              </div>

              <button className="px-6 py-2 rounded-lg font-semibold transition-all"
                      style={{
                        backgroundColor: '#001529',
                        color: '#00f0a0'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#001f3f'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#001529'}>
                View All Prospects →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveProspectBanner;
