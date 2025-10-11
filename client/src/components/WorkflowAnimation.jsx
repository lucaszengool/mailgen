import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Brain, Database, CheckCircle, Cpu, TrendingUp, Target,
  Radar, Shield, Mail, Users, Loader, Sparkles, BarChart,
  Search, Send, Activity, Gauge, MapPin, Briefcase, DollarSign,
  MessageSquare, Heart, Building2, AlertCircle, Zap, Eye
} from 'lucide-react';
import JobRightProspectCard from './JobRightProspectCard';
import JobRightEmailCard from './JobRightEmailCard';

const WorkflowAnimation = () => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const scrollContainerRef = useRef(null);
  const [realProspects, setRealProspects] = useState([]);
  const [realEmails, setRealEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from backend
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        console.log('🔍 Fetching real workflow data...');

        // Fetch campaign results (prospects + email campaign data)
        const workflowResponse = await fetch('/api/workflow/results');
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          console.log('✅ Workflow data received:', workflowData);

          if (workflowData.success && workflowData.data) {
            // Extract prospects with data validation
            if (workflowData.data.prospects && Array.isArray(workflowData.data.prospects) && workflowData.data.prospects.length > 0) {
              console.log(`📊 Found ${workflowData.data.prospects.length} prospects`);

              // Validate and sanitize prospect data
              const validProspects = workflowData.data.prospects.map(prospect => ({
                ...prospect,
                name: prospect.name || 'Unknown Contact',
                email: prospect.email || 'no-email@example.com',
                company: prospect.company || 'Unknown Company',
                persona: {
                  type: prospect.persona?.type || 'prospect',
                  job_title: prospect.persona?.job_title || 'Contact',
                  communicationStyle: prospect.persona?.communicationStyle || 'professional',
                  primaryPainPoints: Array.isArray(prospect.persona?.primaryPainPoints) ? prospect.persona.primaryPainPoints : ['growth', 'efficiency'],
                  primaryMotivations: Array.isArray(prospect.persona?.primaryMotivations) ? prospect.persona.primaryMotivations : ['business growth'],
                  decisionLevel: prospect.persona?.decisionLevel || 'Medium',
                  size: prospect.persona?.size || 'Unknown',
                  ...prospect.persona
                }
              }));

              setRealProspects(validProspects);
            }

            // Extract emails from email campaign with validation
            if (workflowData.data.emailCampaign && workflowData.data.emailCampaign.emails && Array.isArray(workflowData.data.emailCampaign.emails)) {
              console.log(`📧 Found ${workflowData.data.emailCampaign.emails.length} generated emails`);
              setRealEmails(workflowData.data.emailCampaign.emails);
            } else {
              console.log('📧 No emails in emailCampaign, checking other possible locations...');
              // Check if emails are in a different location in the data structure
              if (workflowData.data.emails && Array.isArray(workflowData.data.emails)) {
                console.log(`📧 Found ${workflowData.data.emails.length} emails in data.emails`);
                setRealEmails(workflowData.data.emails);
              } else if (workflowData.data.generatedEmails && Array.isArray(workflowData.data.generatedEmails)) {
                console.log(`📧 Found ${workflowData.data.generatedEmails.length} emails in data.generatedEmails`);
                setRealEmails(workflowData.data.generatedEmails);
              } else {
                console.log('📧 No emails found anywhere, using demo emails for animation');
                // Always show demo emails so the animation has content
                setRealEmails([
                  {
                    id: 1,
                    to: 'alex@techcorp.com',
                    from: 'Fruit AI',
                    subject: 'AI Solutions for TechCorp',
                    body: 'Hi Alex, I noticed TechCorp could benefit from our AI automation platform...',
                    quality_score: 92,
                    status: 'generated'
                  },
                  {
                    id: 2,
                    to: 'sarah@innovate.io',
                    from: 'Fruit AI',
                    subject: 'Boost Productivity at Innovate Solutions',
                    body: 'Hi Sarah, Our AI tools could help streamline your product development...',
                    quality_score: 88,
                    status: 'generated'
                  },
                  {
                    id: 3,
                    to: 'david@startup.co',
                    from: 'Fruit AI',
                    subject: 'Scale Your Startup with AI',
                    body: 'Hi David, Startups like yours are perfect for our AI automation solutions...',
                    quality_score: 90,
                    status: 'generated'
                  }
                ]);
              }
            }
          }
        } else {
          console.warn('⚠️ Workflow results API returned error status');
        }

        // Also try to fetch pending emails from campaign workflow
        try {
          const campaignId = 'current'; // or get from context
          const pendingResponse = await fetch(`/api/campaign-workflow/${campaignId}/pending-emails`);
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json();
            if (pendingData.success && pendingData.emails && pendingData.emails.length > 0) {
              console.log(`📨 Found ${pendingData.emails.length} pending emails`);
              // If we don't have emails from workflow, use pending emails
              if (realEmails.length === 0) {
                setRealEmails(pendingData.emails);
              }
            }
          }
        } catch (pendingError) {
          console.log('ℹ️ No pending emails found, using workflow results');
        }

      } catch (error) {
        console.error('❌ Error fetching real data:', error);
        // Use fallback demo data to ensure animation works
        setRealProspects([
          {
            id: 1,
            name: 'Alex Chen',
            email: 'alex@techcorp.com',
            company: 'TechCorp',
            confidence: 0.95,
            persona: {
              type: 'decision_maker',
              job_title: 'CTO',
              communicationStyle: 'professional',
              primaryPainPoints: ['efficiency', 'scaling'],
              primaryMotivations: ['growth', 'innovation'],
              decisionLevel: 'High',
              size: 'Medium'
            }
          },
          {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah@innovate.io',
            company: 'Innovate Solutions',
            confidence: 0.88,
            persona: {
              type: 'influencer',
              job_title: 'Product Manager',
              communicationStyle: 'friendly',
              primaryPainPoints: ['productivity', 'automation'],
              primaryMotivations: ['efficiency', 'results'],
              decisionLevel: 'Medium',
              size: 'Large'
            }
          }
        ]);

        setRealEmails([
          {
            id: 1,
            to: 'alex@techcorp.com',
            from: 'Fruit AI',
            subject: 'AI Solutions for TechCorp',
            body: 'Hi Alex, I noticed TechCorp could benefit from our AI automation platform...',
            quality_score: 92,
            status: 'generated'
          },
          {
            id: 2,
            to: 'sarah@innovate.io',
            from: 'Fruit AI',
            subject: 'Boost Productivity at Innovate Solutions',
            body: 'Hi Sarah, Our AI tools could help streamline your product development...',
            quality_score: 88,
            status: 'generated'
          },
          {
            id: 3,
            to: 'david@startup.co',
            from: 'Fruit AI',
            subject: 'Scale Your Startup with AI',
            body: 'Hi David, Startups like yours are perfect for our AI automation solutions...',
            quality_score: 90,
            status: 'generated'
          },
          {
            id: 4,
            to: 'lisa@enterprise.com',
            from: 'Fruit AI',
            subject: 'Enterprise AI Integration',
            body: 'Hi Lisa, Your enterprise could achieve 40% efficiency gains with our AI platform...',
            quality_score: 94,
            status: 'generated'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();

    // Optionally refresh data every 10 seconds for real-time updates
    const interval = setInterval(fetchRealData, 10000);
    return () => clearInterval(interval);
  }, []);


  // Helper function to get multi-color rainbow pattern
  const getMultiColorRainbowPattern = (seed) => {
    const seedString = seed || 'default';
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const rainbowPatterns = [
      'linear-gradient(45deg, #ff0000 0%, #ff8000 16.67%, #ffff00 33.33%, #00ff00 50%, #0080ff 66.67%, #8000ff 83.33%, #ff0080 100%)',
      'linear-gradient(135deg, #ff0000 0%, #ff8000 16.67%, #ffff00 33.33%, #00ff00 50%, #0080ff 66.67%, #8000ff 83.33%, #ff0080 100%)',
      'linear-gradient(90deg, #ff0000 0%, #ff8000 16.67%, #ffff00 33.33%, #00ff00 50%, #0080ff 66.67%, #8000ff 83.33%, #ff0080 100%)',
      'linear-gradient(180deg, #ff0000 0%, #ff8000 16.67%, #ffff00 33.33%, #00ff00 50%, #0080ff 66.67%, #8000ff 83.33%, #ff0080 100%)'
    ];

    const patternIndex = Math.abs(hash) % rainbowPatterns.length;
    return rainbowPatterns[patternIndex];
  };


  // Animated workflow window component (matching SimpleWorkflowDashboard)
  const AnimatedWorkflowWindow = ({ content, title }) => {
    const [localStep, setLocalStep] = useState(0);
    const [localAnimationState, setLocalAnimationState] = useState('running');
    const [localShowResults, setLocalShowResults] = useState(false);
    const stepRefs = useRef([]);

    useEffect(() => {
      // Determine the steps based on the title
      let steps = [];
      if (title.includes('Website Analysis')) {
        steps = [
          { title: 'Connecting to website...', icon: Globe, duration: 800 },
          { title: 'Analyzing business profile...', icon: Brain, duration: 1200 },
          { title: 'Processing industry data...', icon: Database, duration: 1000 },
          { title: 'Analysis complete!', icon: CheckCircle, duration: 500 }
        ];
      } else if (title.includes('Marketing Strategy')) {
        steps = [
          { title: 'Initializing AI engine...', icon: Cpu, duration: 800 },
          { title: 'Processing market intelligence...', icon: TrendingUp, duration: 1500 },
          { title: 'Generating targeting strategy...', icon: Target, duration: 1200 },
          { title: 'Strategy complete!', icon: CheckCircle, duration: 500 }
        ];
      } else if (title.includes('Email Search')) {
        steps = [
          { title: 'Searching LinkedIn...', icon: Search, duration: 1000 },
          { title: 'Analyzing company websites...', icon: Globe, duration: 1200 },
          { title: 'Validating email addresses...', icon: Shield, duration: 1000 },
          { title: 'Prospects found!', icon: CheckCircle, duration: 500 }
        ];
      } else if (title.includes('Email Generation')) {
        steps = [
          { title: 'Loading AI models...', icon: Brain, duration: 400 },
          { title: 'Analyzing prospect profiles...', icon: Users, duration: 500 },
          { title: 'Crafting personalized content...', icon: Mail, duration: 600 },
          { title: 'Emails generated!', icon: CheckCircle, duration: 300 }
        ];
      } else {
        // Generic steps for other windows
        steps = [
          { title: 'Processing request...', icon: Cpu, duration: 1000 },
          { title: 'Analyzing data...', icon: Brain, duration: 1200 },
          { title: 'Generating results...', icon: Sparkles, duration: 800 },
          { title: 'Complete!', icon: CheckCircle, duration: 500 }
        ];
      }

      let timers = [];

      steps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setLocalStep(index);

          // Auto-scroll to current step within container only
          if (stepRefs.current[index]) {
            const stepElement = stepRefs.current[index];
            const container = stepElement.closest('.max-h-64.overflow-y-auto');
            if (container) {
              const stepRect = stepElement.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();

              if (stepRect.bottom > containerRect.bottom || stepRect.top < containerRect.top) {
                const scrollTop = stepElement.offsetTop - container.offsetTop - (container.clientHeight / 2) + (stepElement.clientHeight / 2);
                container.scrollTo({
                  top: scrollTop,
                  behavior: 'smooth'
                });
              }
            }
          }

          if (index === steps.length - 1) {
            setLocalAnimationState('completed');
            setLocalShowResults(true);
          }
        }, steps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
        timers.push(timer);
      });

      return () => timers.forEach(timer => clearTimeout(timer));
    }, [title]);

    const getSteps = () => {
      if (title.includes('Website Analysis')) {
        return [
          { title: 'Connecting to website...', icon: Globe },
          { title: 'Analyzing business profile...', icon: Brain },
          { title: 'Processing industry data...', icon: Database },
          { title: 'Analysis complete!', icon: CheckCircle }
        ];
      } else if (title.includes('Marketing Strategy')) {
        return [
          { title: 'Initializing AI engine...', icon: Cpu },
          { title: 'Processing market intelligence...', icon: TrendingUp },
          { title: 'Generating targeting strategy...', icon: Target },
          { title: 'Strategy complete!', icon: CheckCircle }
        ];
      } else if (title.includes('Email Search')) {
        return [
          { title: 'Searching LinkedIn...', icon: Search },
          { title: 'Analyzing company websites...', icon: Globe },
          { title: 'Validating email addresses...', icon: Shield },
          { title: 'Prospects found!', icon: CheckCircle }
        ];
      } else if (title.includes('Email Generation')) {
        return [
          { title: 'Loading AI models...', icon: Brain },
          { title: 'Analyzing prospect profiles...', icon: Users },
          { title: 'Crafting personalized content...', icon: Mail },
          { title: 'Emails generated!', icon: CheckCircle }
        ];
      } else {
        return [
          { title: 'Processing request...', icon: Cpu },
          { title: 'Analyzing data...', icon: Brain },
          { title: 'Generating results...', icon: Sparkles },
          { title: 'Complete!', icon: CheckCircle }
        ];
      }
    };

    return (
      <div className="p-6 space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)' }}>
              {title.includes('Website') ? <Globe className="w-4 h-4 text-white" /> :
               title.includes('Marketing') ? <Brain className="w-4 h-4 text-white" /> :
               title.includes('Email Search') ? <Search className="w-4 h-4 text-white" /> :
               title.includes('Email Generation') ? <Mail className="w-4 h-4 text-white" /> :
               <Target className="w-4 h-4 text-white" />}
            </div>
            <h4 className="text-lg font-bold text-gray-900">Progress</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xl font-bold text-green-600">
              {localAnimationState === 'completed' ? '100%' : `${Math.min(Math.round(((localStep + 1) / getSteps().length) * 100), 100)}%`}
            </div>
            <Gauge className="w-4 h-4 text-green-500" />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-50">
          {getSteps().map((step, index) => (
            <motion.div
              key={index}
              ref={el => stepRefs.current[index] = el}
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: localStep >= index ? 1 : 0.3,
                scale: localStep === index ? 1.02 : 1
              }}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                localStep >= index
                  ? 'bg-green-100'
                  : 'bg-green-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                localStep >= index ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <step.icon className={`w-3 h-3 ${localStep >= index ? 'text-white' : 'text-gray-700'}`} />
              </div>
              <span className={`font-medium text-sm flex-1 leading-tight ${
                localStep >= index ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {step.title}
              </span>
              <div className="flex-shrink-0">
                {localStep === index && localAnimationState !== 'completed' && (
                  <Loader className="w-3 h-3 text-green-500 animate-spin" />
                )}
                {localStep > index && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Results Section */}
        {(localShowResults || localStep >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Show card results for Email Search and Email Generation */}
            {(title.includes('Email Search') || title.includes('Email Generation')) ? (
              <div>
                <h5 className="text-sm font-bold text-gray-900 mb-3 px-4">
                  {title.includes('Email Search') ? 'Qualified Prospects Found:' : 'Generated Emails:'}
                </h5>
                <div className="space-y-3 px-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-50">
                  {loading ? (
                    // Loading state
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 text-green-500 animate-spin mr-2" />
                      <span className="text-gray-600">Loading {title.includes('Email Search') ? 'prospects' : 'emails'}...</span>
                    </div>
                  ) : title.includes('Email Search') ? (
                    // Real prospects from backend
                    realProspects.length > 0 ? realProspects.slice(0, 3).map((prospect, index) => {
                      // Add error handling for prospect data
                      try {
                        return (
                          <motion.div
                            key={prospect.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.3 }}
                            className="transform scale-90 origin-center"
                            style={{ marginBottom: '8px' }}
                          >
                            <JobRightProspectCard
                              prospect={prospect}
                              index={index}
                              onClick={() => {}}
                            />
                          </motion.div>
                        );
                      } catch (error) {
                        console.error('Error rendering prospect card:', error, prospect);
                        return (
                          <div key={index} className="text-center py-2 text-red-500 text-sm">
                            Error displaying prospect data
                          </div>
                        );
                      }
                    }) : (
                      <div className="text-center py-4 text-gray-500">
                        No prospects found yet
                      </div>
                    )
                  ) : (
                    // Real emails from backend
                    realEmails.length > 0 ? realEmails.slice(0, 3).map((email, index) => {
                      // Add error handling for email data
                      try {
                        console.log('📧 Rendering email card:', email.to, email.subject);
                        return (
                          <motion.div
                            key={email.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.3 }}
                            className="transform scale-90 origin-center"
                            style={{ marginBottom: '8px' }}
                          >
                            <JobRightEmailCard
                              email={email}
                              index={index}
                              onClick={() => {}}
                              onEdit={() => {}}
                              onSend={() => {}}
                            />
                          </motion.div>
                        );
                      } catch (error) {
                        console.error('Error rendering email card:', error, email);
                        return (
                          <div key={index} className="text-center py-2 text-red-500 text-sm">
                            Error displaying email data
                          </div>
                        );
                      }
                    }) : (
                      <div className="text-center py-4 text-gray-500">
                        <div>No emails generated yet (Emails array length: {realEmails.length})</div>
                        <div>Loading: {loading ? 'true' : 'false'}</div>
                        <div>Show Results: {(localShowResults || localStep >= 2) ? 'true' : 'false'}</div>
                      </div>
                    )
                  )}
                </div>
                {!loading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0 }}
                    className="text-gray-600 text-sm mt-3 px-4 text-center bg-green-50 rounded-lg py-2"
                  >
                    {title.includes('Email Search') ? (
                      realProspects.length > 3 ?
                        `+ ${realProspects.length - 3} more prospects found` :
                        `${realProspects.length} prospects found`
                    ) : (
                      realEmails.length > 3 ?
                        `+ ${realEmails.length - 3} more emails generated` :
                        `${realEmails.length} emails generated`
                    )}
                  </motion.p>
                )}
              </div>
            ) : (
              // Default results for other workflow types
              <div className="bg-green-50 rounded-xl p-4">
                <h5 className="text-sm font-bold text-gray-900 mb-3">Results</h5>
                <div className="space-y-2">
                  {Object.entries(content || {}).map(([key, value], index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-xs font-medium text-gray-700 min-w-[100px]">{key}:</span>
                      <span className="text-xs text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  };


  // Workflow phases matching the actual workflow from SimpleWorkflowDashboard
  const workflowPhases = [
    {
      id: 'campaign_start',
      title: 'Campaign Start',
      content: (
        <div className="h-full flex flex-col">
          {/* Agent Messages */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
              <div className="max-w-md">
                <p className="text-black text-sm font-medium">
                  I'm starting your marketing campaign automation.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
              <div className="max-w-md">
                <p className="text-black text-sm font-medium">
                  I'll analyze your business and find qualified prospects.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Campaign Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4 }}
            className="flex-1 p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Campaign Workflow</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Live</span>
                  </div>
                  <button className="px-4 py-2 bg-[#00f5a0] text-black rounded-lg text-sm font-medium hover:bg-[#00e090] transition-colors">
                    START CAMPAIGN
                  </button>
                  <button className="px-3 py-2 bg-green-200 text-green-800 rounded-lg text-sm font-medium hover:bg-green-300 transition-colors">
                    RESET
                  </button>
                </div>
              </div>

              {/* Campaign Status Cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-green-100 rounded-lg">
                  <div className="text-lg font-bold text-green-800">Ready</div>
                  <div className="text-xs text-gray-700">Status</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-800">0/5</div>
                  <div className="text-xs text-gray-700">Progress</div>
                </div>
                <div className="text-center p-3 bg-green-100 rounded-lg">
                  <div className="text-lg font-bold text-green-800">Auto</div>
                  <div className="text-xs text-gray-700">Mode</div>
                </div>
              </div>

              {/* Workflow Steps Preview */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">Workflow Steps:</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-900">Website Analysis & Business Profiling</span>
                    <div className="ml-auto text-xs text-green-700 font-medium">Ready</div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-900">AI Marketing Strategy Generation</span>
                    <div className="ml-auto text-xs text-green-700 font-medium">Ready</div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Search className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-900">Prospect Discovery & Qualification</span>
                    <div className="ml-auto text-xs text-green-700 font-medium">Ready</div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Mail className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-900">Personalized Email Generation</span>
                    <div className="ml-auto text-xs text-green-700 font-medium">Ready</div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <BarChart className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-900">Performance Analytics & Optimization</span>
                    <div className="ml-auto text-xs text-green-700 font-medium">Ready</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-100 p-3 rounded-lg">
                <p className="text-gray-800 text-sm">
                  <Sparkles className="inline w-4 h-4 text-green-600 mr-1" />
                  AI-powered marketing automation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 'website_analysis',
      title: 'Website Analysis',
      content: (
        <div className="h-full flex flex-col">
          {/* Agent Messages */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
              <div className="max-w-md">
                <p className="text-black text-sm font-medium">
                  Now I'm analyzing each prospect's business profile.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Website Analysis Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="flex-1 p-6"
          >
            <div className="px-5 py-3 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  <Zap className="inline w-5 h-5 text-green-600 mr-2" />
                  Website Analysis Engine
                </h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Live</span>
              </div>
            </div>
            <AnimatedWorkflowWindow
              content={{
                website: 'https://fruitai.org/',
                timestamp: '2025-09-13T15:04:04.173Z',
                companyName: 'FruitAI',
                industry: 'Food Technology',
                status: 'Ultra-fast analysis mode',
                cacheStatus: 'Using cached results',
                analysisTime: '< 2 seconds',
                businessProfile: 'Industry analysis complete'
              }}
              title="Website Analysis"
            />
          </motion.div>
        </div>
      )
    },
    {
      id: 'marketing_strategy',
      title: 'Marketing Strategy',
      content: (
        <div className="h-full flex flex-col">
          {/* Agent Messages */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
              <div className="max-w-md">
                <p className="text-black text-sm font-medium">
                  I'm generating your AI-powered marketing strategy.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Marketing Strategy Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="flex-1 p-6"
          >
            <div className="px-5 py-3 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  <Brain className="inline w-5 h-5 text-green-600 mr-2" />
                  AI Marketing Strategy Generator
                </h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Live</span>
              </div>
            </div>
            <AnimatedWorkflowWindow
              content={{
                aiEngine: 'Ollama qwen2.5:0.5b',
                optimization: 'Real-time market intelligence',
                personalization: 'Industry-specific targeting',
                targetAudience: 'B2B Food Technology',
                status: 'Strategy generation complete'
              }}
              title="Marketing Strategy"
            />
          </motion.div>
        </div>
      )
    },
    {
      id: 'prospect_discovery',
      title: 'Prospect Discovery',
      content: (
        <div className="h-full flex flex-col">
          {/* Agent Messages - Same style as campaign_start */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
              <div className="max-w-md">
                <p className="text-black text-sm font-medium">
                  I found this qualified prospect:
                </p>
              </div>
            </motion.div>
          </div>

          {/* Real Prospect Cards Stream - Same level as messages, no container */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {realProspects.slice(0, 6).map((prospect, index) => (
              <motion.div
                key={prospect.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.5 }}
                className="flex items-start space-x-3"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="text-white font-bold text-xs">
                    {prospect.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="p-4 max-w-md flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    I found this qualified prospect:
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Just now</div>

                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)' }}>
                      {(prospect.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{prospect.name || 'Unknown Contact'}</div>
                      <div className="text-sm text-gray-600">{prospect.persona?.job_title || 'Contact'}</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">{prospect.company || 'Unknown Company'}</span>/Business Services · Mid-size · Private
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{prospect.email || 'No email'}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div><span className="text-gray-500">Type:</span> {prospect.persona?.type || 'Unknown'}</div>
                    <div><span className="text-gray-500">Style:</span> {prospect.persona?.communicationStyle || 'Professional'}</div>
                    <div><span className="text-gray-500">Pain Points:</span> {prospect.persona?.primaryPainPoints?.join(', ') || 'Not specified'}</div>
                    <div><span className="text-gray-500">Motivations:</span> {prospect.persona?.primaryMotivations?.join(', ') || 'Not specified'}</div>
                    <div><span className="text-gray-500">Decision:</span> {prospect.persona?.decisionLevel || 'Unknown'}</div>
                    <div><span className="text-gray-500">Size:</span> {prospect.persona?.size || 'Unknown'}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border border-green-500 text-black text-xs font-medium">ANALYZE</button>
                      <button className="px-3 py-1 bg-[#00f5a0] text-black text-xs font-medium">CONTACT</button>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-black">{Math.round(prospect.confidence * 100)}%</div>
                      <div className="text-xs text-gray-600 font-bold">GOOD MATCH</div>
                      <div className="text-xs text-gray-500">✓ Quality Prospect</div>
                      <div className="text-xs text-gray-400">✅ Validated - Confidence: {Math.round(prospect.confidence * 100)}%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'email_generation',
      title: 'Email Generation',
      content: (
        <div className="h-full flex flex-col">
          {/* Agent Messages - Same style as campaign_start */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full ml-1"></div>
              </div>
              <div className="max-w-md">
                <p className="text-black text-sm font-medium">
                  I created personalized emails:
                </p>
              </div>
            </motion.div>
          </div>

          {/* Real Email Cards Stream - Exact same format as prospect cards */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {realEmails.slice(0, 6).map((email, index) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.4 }}
                className="flex items-start space-x-3"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="text-white font-bold text-xs">
                    {email.to ? email.to.charAt(0).toUpperCase() : 'E'}
                  </div>
                </div>
                <div className="p-4 max-w-md flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    I created this personalized email:
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Just now</div>

                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)' }}>
                      {email.to ? email.to.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{email.to || 'recipient@company.com'}</div>
                      <div className="text-sm text-gray-600">Email Recipient</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">{email.from || 'Fruit AI'}</span>/AI Assistant · Professional · Personalized
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{email.to || 'recipient@company.com'}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div><span className="text-gray-500">Type:</span> Email</div>
                    <div><span className="text-gray-500">Style:</span> Professional</div>
                    <div><span className="text-gray-500">Subject:</span> {(email.subject || 'Business Proposal').substring(0, 20)}...</div>
                    <div><span className="text-gray-500">Quality:</span> {email.quality_score || 92}%</div>
                    <div><span className="text-gray-500">Status:</span> Generated</div>
                    <div><span className="text-gray-500">Length:</span> Perfect</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border border-green-500 text-black text-xs font-medium">PREVIEW</button>
                      <button className="px-3 py-1 border border-green-500 text-black text-xs font-medium">SEND</button>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{email.quality_score || 92}%</div>
                      <div className="text-xs font-bold uppercase text-green-700">
                        {(email.quality_score || 92) >= 90 ? 'EXCELLENT' : (email.quality_score || 92) >= 80 ? 'GOOD' : 'FAIR'}
                      </div>
                      <div className="text-xs text-gray-500">✓ Ready to Send</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    ✅ Personalized - Quality Score: {email.quality_score || 92}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'analytics_dashboard',
      title: 'Analytics Dashboard',
      content: (
        <div className="h-full flex flex-col">
          {/* Analytics Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-1 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">[ANALYZE] Campaign Performance Dashboard</h3>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Live Data</span>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">94%</div>
                <div className="text-xs text-gray-600">Delivery</div>
              </div>
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <div className="text-xl font-bold text-green-700">47%</div>
                <div className="text-xs text-gray-700">Open Rate</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-700">12%</div>
                <div className="text-xs text-gray-700">Response</div>
              </div>
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <div className="text-xl font-bold text-green-700">247</div>
                <div className="text-xs text-gray-700">Prospects</div>
              </div>
            </div>

            <h4 className="font-semibold text-gray-900 mb-3">Recent Activity:</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm p-2 bg-green-100 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-black">Email sent to Mike Rodriguez</span>
                </div>
                <span className="text-gray-600">2 min ago</span>
              </div>
              <div className="flex justify-between items-center text-sm p-2 bg-green-50 rounded">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-black">Sarah Chen opened email</span>
                </div>
                <span className="text-gray-600">5 min ago</span>
              </div>
              <div className="flex justify-between items-center text-sm p-2 bg-green-100 rounded">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-black">New prospect discovered</span>
                </div>
                <span className="text-gray-600">8 min ago</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mt-3">Real-time campaign analytics and performance tracking</p>
          </motion.div>
        </div>
      )
    }
  ];

  // Debug logging
  useEffect(() => {
    console.log('🔍 WorkflowAnimation state debug:', {
      loading,
      realProspects: realProspects.length,
      realEmails: realEmails.length,
      currentPhase,
      phaseTitle: workflowPhases[currentPhase]?.title
    });

    // If we're in Email Generation phase and have no emails, force some demo emails
    if (workflowPhases[currentPhase]?.title === 'Email Generation' && realEmails.length === 0) {
      console.log('🚨 Email Generation phase detected with 0 emails, adding demo emails...');
      setRealEmails([
        {
          id: 1,
          to: 'alex@techcorp.com',
          from: 'Fruit AI',
          subject: 'AI Solutions for TechCorp - Strategic Partnership',
          body: 'Hi Alex, I noticed TechCorp could benefit from our AI automation platform...',
          quality_score: 95,
          status: 'generated'
        },
        {
          id: 2,
          to: 'sarah@innovate.io',
          from: 'Fruit AI',
          subject: 'Boost Productivity at Innovate Solutions',
          body: 'Hi Sarah, Our AI tools could help streamline your product development...',
          quality_score: 88,
          status: 'generated'
        },
        {
          id: 3,
          to: 'david@startup.co',
          from: 'Fruit AI',
          subject: 'Scale Your Startup with AI',
          body: 'Hi David, Startups like yours are perfect for our AI automation solutions...',
          quality_score: 92,
          status: 'generated'
        },
        {
          id: 4,
          to: 'lisa@enterprise.com',
          from: 'Fruit AI',
          subject: 'Enterprise AI Integration',
          body: 'Hi Lisa, Your enterprise could achieve 40% efficiency gains with our AI platform...',
          quality_score: 94,
          status: 'generated'
        }
      ]);
    }
  }, [loading, realProspects.length, realEmails.length, currentPhase]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % workflowPhases.length);
    }, 9000); // 9 seconds per phase for complete animation with analytics

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[600px] bg-transparent overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full h-full flex flex-col"
        >
          <div className="flex-1 overflow-auto">
            {workflowPhases[currentPhase].content}
          </div>

          {/* Phase Navigation Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-2">
            {workflowPhases.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPhase ? 'bg-green-500 scale-125' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WorkflowAnimation;