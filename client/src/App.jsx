import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import WorkflowStyleDashboard from './components/WorkflowStyleDashboard';
import ClientDetailView from './components/ClientDetailView';
import AgentControlPanel from './components/AgentControlPanel';
import EmailDashboard from './components/EmailDashboard';
import WorkflowPanel from './components/WorkflowPanel';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';

// Lazy load components with circular dependencies
const SimpleWorkflowDashboard = lazy(() => import('./components/SimpleWorkflowDashboard'));

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [agentConfig, setAgentConfig] = useState(null);
  const [currentView, setCurrentView] = useState('setup');
  const [selectedClient, setSelectedClient] = useState(null);

  // Debug current view state
  // console.log('🔍 App.jsx render - Current state:', { currentView, isSetupComplete });

  useEffect(() => {
    console.log('App mounted, checking setup status...');

    // AGGRESSIVE CLEANUP: Clear justReset flag if user is navigating to dashboard
    const currentPath = window.location.pathname;
    const justReset = sessionStorage.getItem('justReset');

    if (currentPath === '/dashboard' || currentPath === '/setup') {
      if (justReset) {
        const resetTimestamp = sessionStorage.getItem('resetTimestamp');
        const age = resetTimestamp ? Date.now() - parseInt(resetTimestamp) : 999999;

        // If navigating to dashboard OR flag is older than 3 seconds, clear it
        if (currentPath === '/dashboard' || age > 3000) {
          console.log(`🧹 Clearing justReset flag (path: ${currentPath}, age: ${age}ms)`);
          sessionStorage.removeItem('justReset');
          sessionStorage.removeItem('resetTimestamp');
        }
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
          console.log('Config missing targetWebsite');
        }
      } else {
        console.log('Response not ok:', response.status);
      }
    } catch (error) {
      console.log('Error fetching config:', error);
    }
  };

  const handleSetupComplete = (config) => {
    console.log('🔄 App.jsx - Setup completed, navigating to:', config.nextStep || 'dashboard');
    
    setAgentConfig(config);
    if (config.nextStep === 'website-analysis') {
      // Show website analysis review page
      setCurrentView('website-analysis');
    } else {
      setIsSetupComplete(true);
      setCurrentView('dashboard');
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

    try {
      // Clear server-side configuration first
      const response = await fetch('/api/agent/reset', {
        method: 'POST'
      });
      const result = await response.json();
      console.log('🔄 Server config cleared:', result.success, result.message);
    } catch (error) {
      console.log('⚠️ Could not clear server config:', error.message);
    }

    // Clear all client-side configuration and reset to setup wizard
    setAgentConfig(null);
    setIsSetupComplete(false);
    setCurrentView('setup');
    setSelectedClient(null);

    // Clear localStorage
    localStorage.removeItem('agentConfig');

    console.log('🔄 App.jsx - State reset complete:', {
      agentConfig: null,
      isSetupComplete: false,
      currentView: 'setup',
      selectedClient: null
    });

    // Set flag JUST BEFORE reload to prevent auto-navigation
    sessionStorage.setItem('justReset', 'true');
    sessionStorage.setItem('resetTimestamp', Date.now().toString());

    // Force page reload to reset to initial setup
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Show setup wizard if setup is not complete AND not in website-analysis view
  if (!isSetupComplete && currentView !== 'website-analysis') {
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
          <Route path="/" element={<HeadAIStyleStartPage onComplete={handleSetupComplete} />} />
          <Route path="/setup" element={<CampaignSetupWizard onComplete={handleSetupComplete} />} />
          <Route path="/smtp-setup" element={<AgentSetupWizard onComplete={handleSetupComplete} />} />
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
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div></div>}>
          <SimpleWorkflowDashboard
            agentConfig={agentConfig}
            onReset={handleReset}
          />
        </Suspense>
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