import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Contacts from './pages/Contacts';
import Prospects from './pages/ProspectsClean';
import Analytics from './pages/Analytics';
import EmailMonitoring from './pages/EmailMonitoring';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import EmailComposer from './pages/EmailComposer';
import ProfessionalEmailEditorPage from './pages/ProfessionalEmailEditor';
import WebsiteAnalyzer from './pages/WebsiteAnalyzer';
import ChineseMarketSearch from './pages/ChineseMarketSearch';
import LangGraphAgent from './pages/LangGraphAgent';
import HeadAIStyleStartPage from './components/HeadAIStyleStartPage';
import AgentSetupWizard from './components/AgentSetupWizard';
import CampaignSetupWizard from './components/CampaignSetupWizard';
import WebsiteAnalysisReview from './components/WebsiteAnalysisReview';
import EmailMonitoringDashboard from './components/EmailMonitoringDashboard';
import WorkflowDashboard from './components/WorkflowDashboard';
import EnhancedWorkflowDashboard from './components/EnhancedWorkflowDashboard';
import ComprehensiveDashboard from './components/ComprehensiveDashboard';
import RealTimeWorkflowDashboard from './components/RealTimeWorkflowDashboard';
import GitHubStyleWorkflowDashboard from './components/GitHubStyleWorkflowDashboard';
// New marketing pages
import AIAgentPage from './pages/AIAgent';
import FeaturesPage from './pages/Features';
import ForBusinessesPage from './pages/ForBusinesses';
import AboutPage from './pages/About';
import BlogPage from './pages/Blog';
import PartnersPage from './pages/Partners';
import WorkflowStyleDashboard from './components/WorkflowStyleDashboard';
import ClientDetailView from './components/ClientDetailView';
import AgentControlPanel from './components/AgentControlPanel';
import EmailDashboard from './components/EmailDashboard';
import WorkflowPanel from './components/WorkflowPanel';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import FirstCampaignSetup from './pages/FirstCampaignSetup';
import OnboardingTour from './components/OnboardingTour';
import SimpleWorkflowDashboard from './components/SimpleWorkflowDashboard';
import CampaignSelector from './components/CampaignSelector';
import CampaignOnboardingWizard from './components/CampaignOnboardingWizard';
import ProcessNotificationsDemo from './components/ProcessNotificationsDemo';
import BlogPost from './pages/BlogPost';
import AutoDetectLanguage from './components/AutoDetectLanguage';

function App() {
  const location = useLocation();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [agentConfig, setAgentConfig] = useState(null);
  const [currentView, setCurrentView] = useState('setup');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  // Campaign management state
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [showCampaignSelector, setShowCampaignSelector] = useState(true);
  const [showCampaignOnboarding, setShowCampaignOnboarding] = useState(false);
  const [campaignBeingSetup, setCampaignBeingSetup] = useState(null);

  // Reset to campaign selector when navigating to /dashboard from elsewhere
  useEffect(() => {
    if (location.pathname === '/dashboard' && !currentCampaign && !showCampaignOnboarding) {
      console.log('📍 Navigated to /dashboard - showing campaign selector');
      setShowCampaignSelector(true);
    }
  }, [location.pathname]);

  // Debug dashboard rendering state
  console.log('🔍 Dashboard render state:', {
    pathname: location.pathname,
    showCampaignOnboarding,
    showCampaignSelector,
    currentCampaign: currentCampaign?.name || 'none'
  });

  // Handle legal pages (Privacy/Terms) - these should always be accessible
  const currentPath = window.location.pathname;
  if (currentPath === '/privacy' || currentPath === '/terms') {
    return (
      <div className="App bg-white min-h-screen">
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </div>
    );
  }

  useEffect(() => {
    console.log('App mounted, checking setup status...');

    // Check for justReset flag first
    const justReset = sessionStorage.getItem('justReset');
    const currentPath = window.location.pathname;

    // If just reset, only clear flag if navigating away from root
    if (justReset && currentPath !== '/' && currentPath !== '') {
      const resetTimestamp = sessionStorage.getItem('resetTimestamp');
      const age = resetTimestamp ? Date.now() - parseInt(resetTimestamp) : 999999;

      // Clear flag if navigating away OR if older than 5 seconds
      if (age > 5000) {
        console.log(`🧹 Clearing old justReset flag (age: ${age}ms)`);
        sessionStorage.removeItem('justReset');
        sessionStorage.removeItem('resetTimestamp');
      }
    }

    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      console.log('Fetching config from API...');

      // ROUTE OVERRIDE: If user is on /dashboard, ALWAYS show dashboard
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard') {
        console.log('🎯 User navigated to /dashboard - forcing dashboard view');
        // Fetch config but always show dashboard
        try {
          const response = await fetch('/api/agent/config');
          if (response.ok) {
            const config = await response.json();
            if (config && config.targetWebsite) {
              setAgentConfig(config);
              setIsSetupComplete(true);
            }
          }
        } catch (err) {
          console.log('Config fetch failed, but showing dashboard anyway');
        }
        setCurrentView('dashboard');
        return; // Force show dashboard regardless of config
      }

      // Check if user just clicked reset BEFORE fetching config
      const justReset = sessionStorage.getItem('justReset');
      if (justReset) {
        console.log('🔄 Just reset detected - staying on setup page, ignoring config');
        sessionStorage.removeItem('justReset'); // Clear the flag
        sessionStorage.removeItem('resetTimestamp'); // Clear the timestamp
        setIsSetupComplete(false);
        setAgentConfig(null);
        setCurrentView('setup');
        return; // Don't check config at all
      }

      const response = await fetch('/api/agent/config');
      console.log('Response status:', response.status);
      if (response.ok) {
        const config = await response.json();
        console.log('Config received:', config);
        if (config && config.targetWebsite) {
          console.log('Setup is complete');
          setAgentConfig(config);
          setIsSetupComplete(true);
          console.log('Normal load - switching to dashboard');
          setCurrentView('dashboard'); // Show workflow dashboard by default
        } else {
          console.log('Config missing targetWebsite - showing setup wizard');
          setIsSetupComplete(false);
          setAgentConfig(null);
          setCurrentView('setup'); // Show setup wizard when config is missing
        }
      } else {
        console.log('Response not ok:', response.status);
        // Also show setup on error
        setIsSetupComplete(false);
        setAgentConfig(null);
        setCurrentView('setup');
      }
    } catch (error) {
      console.log('Error fetching config:', error);
      // Show setup wizard on error
      setIsSetupComplete(false);
      setAgentConfig(null);
      setCurrentView('setup');
    }
  };

  const handleSetupComplete = (config) => {
    console.log('🔄 App.jsx - Setup completed, navigating to:', config.nextStep || 'dashboard');

    setAgentConfig(config);

    // 🎯 Check if first time user - show onboarding tour first
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

    if (!hasSeenOnboarding) {
      // First time user completing setup → show onboarding tour ALWAYS
      console.log('🎓 First time setup complete - showing onboarding tour');
      localStorage.setItem('hasSeenOnboarding', 'true');
      localStorage.setItem('pendingNextStep', config.nextStep || 'dashboard'); // Save where to go after tour
      setIsSetupComplete(true);
      setShowOnboardingTour(true);
      setCurrentView('dashboard'); // Show dashboard with tour overlay
      return;
    }

    // Not first time - navigate based on nextStep
    if (config.nextStep === 'website-analysis') {
      // Show website analysis review page
      setCurrentView('website-analysis');
    } else if (config.nextStep === 'dashboard') {
      // Show SimpleWorkflowDashboard directly
      setIsSetupComplete(true);
      setCurrentView('dashboard');
    } else {
      // Default: show dashboard
      setIsSetupComplete(true);
      setCurrentView('dashboard');
    }
  };

  // Campaign management handlers
  const handleSelectCampaign = (campaign) => {
    console.log('📁 Selected campaign:', campaign.name);

    // Check if campaign has been set up
    const campaignConfig = localStorage.getItem(`campaign_${campaign.id}_config`);
    if (!campaignConfig || !campaign.setupComplete) {
      // Campaign needs setup - show onboarding wizard
      console.log('🔧 Campaign needs setup, showing onboarding wizard');
      setCampaignBeingSetup(campaign);
      setShowCampaignOnboarding(true);
      setShowCampaignSelector(false);
    } else {
      // Campaign is ready - open it
      console.log('✅ Campaign ready, opening workflow dashboard');
      setCurrentCampaign(campaign);
      setShowCampaignSelector(false);
    }
  };

  const handleCreateCampaign = (campaign) => {
    console.log('🆕 Creating new campaign:', campaign.name);
    // New campaigns always need setup
    setCampaignBeingSetup(campaign);
    setShowCampaignOnboarding(true);
    setShowCampaignSelector(false);
  };

  const handleCampaignOnboardingComplete = (data) => {
    console.log('✅ Campaign onboarding complete:', data);
    setShowCampaignOnboarding(false);
    setCampaignBeingSetup(null);

    // Load the campaign config and open the workflow dashboard
    setCurrentCampaign(data.campaign);

    // Set as current agentConfig for the dashboard
    setAgentConfig(data);
  };

  const handleCampaignOnboardingCancel = () => {
    console.log('❌ Campaign onboarding cancelled');
    setShowCampaignOnboarding(false);
    setCampaignBeingSetup(null);
    setShowCampaignSelector(true);
  };

  const handleBackToCampaigns = () => {
    console.log('🔙 Returning to campaign selector');
    setCurrentCampaign(null);
    setShowCampaignSelector(true);
  };

  const handleOnboardingComplete = () => {
    console.log('✅ Onboarding tour completed');
    setShowOnboardingTour(false);

    // Check if there's a pending next step after onboarding
    const pendingNextStep = localStorage.getItem('pendingNextStep');
    if (pendingNextStep) {
      console.log('📍 Navigating to pending step:', pendingNextStep);
      localStorage.removeItem('pendingNextStep'); // Clean up

      if (pendingNextStep === 'website-analysis') {
        setCurrentView('website-analysis');
      } else {
        setCurrentView('dashboard');
      }
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setCurrentView('client-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedClient(null);
    setCurrentView('dashboard');
  };

  const handleAnalysisConfirm = (analysisData) => {
    // Update agent config with analysis data and launch dashboard
    const updatedConfig = { ...agentConfig, analysisData };
    setAgentConfig(updatedConfig);
    setIsSetupComplete(true);
    setCurrentView('dashboard');
  };

  const handleBackToSetup = () => {
    setCurrentView('setup');
  };

  const handleReset = async () => {
    console.log('🔄 App.jsx - handleReset called');

    // Set flag BEFORE clearing server config to ensure it persists
    sessionStorage.setItem('justReset', 'true');
    sessionStorage.setItem('resetTimestamp', Date.now().toString());

    try {
      // Clear server-side configuration
      const response = await fetch('/api/agent/reset', {
        method: 'POST'
      });
      const result = await response.json();
      console.log('🔄 Server config cleared:', result.success, result.message);
    } catch (error) {
      console.log('⚠️ Could not clear server config:', error.message);
    }

    // Clear all client-side configuration
    setAgentConfig(null);
    setIsSetupComplete(false);
    setCurrentView('setup');
    setSelectedClient(null);

    // Clear localStorage
    localStorage.removeItem('agentConfig');
    localStorage.removeItem('hasSeenOnboarding');

    // Clear all workflow-related storage
    localStorage.removeItem('workflowHistory');
    localStorage.removeItem('workflowMessages');

    console.log('🔄 App.jsx - State reset complete, redirecting to setup page');

    // Force page reload to setup page
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Show setup wizard if setup is not complete AND not in website-analysis or dashboard view
  if (!isSetupComplete && currentView !== 'website-analysis' && currentView !== 'dashboard') {
    return (
      <div className="App bg-white min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Auto-detect user's language on first visit */}
        <AutoDetectLanguage />

        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/first-campaign-setup" element={<FirstCampaignSetup />} />
          <Route path="/" element={<HeadAIStyleStartPage onComplete={handleSetupComplete} />} /> {/* Default: Show main landing page */}
          <Route path="/home" element={<Home />} /> {/* Action list at /home */}
          <Route path="/setup" element={<CampaignSetupWizard onComplete={handleSetupComplete} />} />
          <Route path="/smtp-setup" element={<AgentSetupWizard onComplete={handleSetupComplete} />} />
          {/* Marketing Pages */}
          <Route path="/ai-agent" element={<AIAgentPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/for-businesses" element={<ForBusinessesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/notifications-demo" element={<ProcessNotificationsDemo />} />
        </Routes>
      </div>
    );
  }

  // Show integrated email monitoring system
  if (currentView === 'dashboard') {
    return (
      <div className="App bg-black min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111827',
              color: '#F9FAFB',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #374151'
            }
          }}
        />

        {/* Add Routes for marketing pages */}
        <Routes>
          <Route path="/" element={<HeadAIStyleStartPage onComplete={handleSetupComplete} />} /> {/* Default: Show main landing page */}
          <Route path="/home" element={<Home />} /> {/* Action list at /home */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/ai-agent" element={<AIAgentPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/for-businesses" element={<ForBusinessesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/dashboard" element={
            showCampaignOnboarding ? (
              <CampaignOnboardingWizard
                campaign={campaignBeingSetup}
                onComplete={handleCampaignOnboardingComplete}
                onCancel={handleCampaignOnboardingCancel}
              />
            ) : showCampaignSelector ? (
              <CampaignSelector
                onSelectCampaign={handleSelectCampaign}
                onCreateCampaign={handleCreateCampaign}
              />
            ) : currentCampaign ? (
              <>
                <SimpleWorkflowDashboard
                  agentConfig={agentConfig}
                  onReset={handleReset}
                  campaign={currentCampaign}
                  onBackToCampaigns={handleBackToCampaigns}
                />
                <OnboardingTour
                  isOpen={showOnboardingTour}
                  onComplete={handleOnboardingComplete}
                  startStep={0}
                />
              </>
            ) : (
              <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading dashboard...</p>
                </div>
              </div>
            )
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    );
  }

  // Show website analysis review page
  if (currentView === 'website-analysis') {
    return (
      <div className="App bg-white min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }
          }}
        />
        <WebsiteAnalysisReview
          targetWebsite={agentConfig?.targetWebsite}
          campaignGoal={agentConfig?.campaignGoal}
          businessType={agentConfig?.businessType}
          onConfirm={handleAnalysisConfirm}
          onBack={handleBackToSetup}
        />
      </div>
    );
  }

  // Show client detail view
  if (currentView === 'client-detail' && selectedClient) {
    return (
      <div className="App bg-white min-h-screen">
        <Toaster position="top-right" />
        <ClientDetailView
          client={selectedClient}
          onBack={handleBackToDashboard}
          onUpdateClient={(updatedClient) => {
            setSelectedClient(updatedClient);
            // Update the client in the main list as well
          }}
        />
      </div>
    );
  }

  // Fallback to original routing system
  return (
    <div className="App bg-white min-h-screen">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/start" element={<HeadAIStyleStartPage />} />
          {/* Marketing Pages */}
          <Route path="/ai-agent" element={<AIAgentPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/for-businesses" element={<ForBusinessesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/notifications-demo" element={<ProcessNotificationsDemo />} />
          {/* Legal Pages - Standalone without Layout */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* App Pages with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="workflow" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="prospects" element={<Prospects />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="monitoring" element={<EmailMonitoring />} />
            <Route path="email-marketing" element={<EmailDashboard />} />
            <Route path="editor" element={<ProfessionalEmailEditorPage />} />
            <Route path="research" element={<WebsiteAnalyzer />} />
            <Route path="settings" element={<Settings />} />
            <Route path="compose" element={<EmailComposer />} />
            <Route path="professional-email-editor" element={<ProfessionalEmailEditorPage />} />
            <Route path="email-editor" element={<ProfessionalEmailEditorPage />} />
            <Route path="website-analyzer" element={<WebsiteAnalyzer />} />
            <Route path="chinese-market" element={<ChineseMarketSearch />} />
            <Route path="langgraph-agent" element={<LangGraphAgent />} />
          </Route>
        </Routes>
      </div>
  );
}

export default App