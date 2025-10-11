console.log('🧪 Testing Frontend Data Flow - Real-time Persona Display Fix');

const LangGraphMarketingAgent = require('./server/agents/LangGraphMarketingAgent');
const WorkflowWebSocketManager = require('./server/websocket/WorkflowWebSocketManager');

// Create mock server for WebSocket manager
const mockServer = { 
  on: () => {},
  addListener: () => {},
  removeListener: () => {},
  emit: () => {}
};

async function testCompleteDataFlow() {
  console.log('🔗 Setting up complete data flow test...');
  
  // Step 1: Create WebSocket manager and agent
  const wsManager = new WorkflowWebSocketManager(mockServer);
  const agent = new LangGraphMarketingAgent();
  agent.setWebSocketManager(wsManager);
  
  // Step 2: Mock a WebSocket client to capture what frontend should receive
  let frontendReceivedData = [];
  wsManager.broadcast = (data) => {
    console.log('📡 Frontend would receive:', data.type);
    if (data.type === 'data_update' && data.data?.prospects) {
      console.log(`   📧 Prospects: ${data.data.prospects.length}`);
      console.log(`   🎭 First prospect persona:`, data.data.prospects[0]?.persona ? 'YES' : 'NO');
      frontendReceivedData.push(data);
    }
    if (data.type === 'prospect_list') {
      console.log(`   📋 Prospect list: ${data.prospects?.length || 0} prospects`);
      console.log(`   🎭 First prospect persona:`, data.prospects?.[0]?.persona ? 'YES' : 'NO');
      frontendReceivedData.push(data);
    }
  };
  
  console.log('');
  console.log('🚀 Running campaign to generate real persona data...');
  
  const testConfig = {
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'sales',
    businessType: 'technology',
    emailTemplate: 'cold_outreach',
    targetAudience: {
      audienceType: 'decision_makers',
      industries: ['Technology', 'Food Industry'],
      jobRoles: ['CEO', 'CTO', 'VP Sales'],
      companySize: 'mid-size',
      location: 'North America',
      keywords: 'AI, automation, efficiency'
    }
  };
  
  try {
    const results = await agent.executeCampaign(testConfig);
    
    console.log('');
    console.log('='.repeat(80));
    console.log('🔍 FRONTEND DATA FLOW ANALYSIS');
    console.log('='.repeat(80));
    
    // Step 3: Check backend results have personas
    console.log('📊 Backend Results Analysis:');
    console.log('   Total prospects:', results.prospects?.length || 0);
    
    if (results.prospects && results.prospects.length > 0) {
      const prospectsWithPersonas = results.prospects.filter(p => p.persona);
      console.log('   Prospects with personas:', prospectsWithPersonas.length);
      
      if (prospectsWithPersonas.length > 0) {
        const firstPersona = prospectsWithPersonas[0].persona;
        console.log('   First persona details:');
        console.log('     - Type:', firstPersona.type);
        console.log('     - Communication Style:', firstPersona.communicationStyle);
        console.log('     - Pain Points:', firstPersona.primaryPainPoints);
        console.log('     - Role:', firstPersona.estimatedRole);
      }
    }
    
    // Step 4: Check WebSocket state has personas
    console.log('');
    console.log('📡 WebSocket State Analysis:');
    let websocketProspects = [];
    for (const [workflowId, state] of wsManager.workflowStates) {
      if (state.data?.prospects?.length > 0) {
        websocketProspects = state.data.prospects;
        console.log(`   Workflow ${workflowId}: ${websocketProspects.length} prospects`);
        
        const wsProspectsWithPersonas = websocketProspects.filter(p => p.persona);
        console.log(`   Personas in WebSocket state: ${wsProspectsWithPersonas.length}`);
        break;
      }
    }
    
    // Step 5: Check what data would be sent to frontend
    console.log('');
    console.log('📤 Frontend Data Transmission Analysis:');
    console.log('   Total broadcasts sent:', frontendReceivedData.length);
    
    let personaDataSent = false;
    frontendReceivedData.forEach((broadcast, index) => {
      console.log(`   Broadcast ${index + 1}:`, broadcast.type);
      
      if (broadcast.type === 'data_update' && broadcast.data?.prospects) {
        const prospectsWithPersonas = broadcast.data.prospects.filter(p => p.persona);
        console.log(`     - Prospects: ${broadcast.data.prospects.length}`);
        console.log(`     - With personas: ${prospectsWithPersonas.length}`);
        if (prospectsWithPersonas.length > 0) {
          personaDataSent = true;
          console.log(`     - Sample persona:`, {
            type: prospectsWithPersonas[0].persona?.type,
            style: prospectsWithPersonas[0].persona?.communicationStyle
          });
        }
      }
      
      if (broadcast.type === 'prospect_list' && broadcast.prospects) {
        const prospectsWithPersonas = broadcast.prospects.filter(p => p.persona);
        console.log(`     - Prospects: ${broadcast.prospects.length}`);
        console.log(`     - With personas: ${prospectsWithPersonas.length}`);
        if (prospectsWithPersonas.length > 0) {
          personaDataSent = true;
        }
      }
    });
    
    console.log('');
    console.log('='.repeat(80));
    console.log('🎯 DIAGNOSIS RESULTS');
    console.log('='.repeat(80));
    
    const backendHasPersonas = results.prospects?.some(p => p.persona);
    const websocketHasPersonas = websocketProspects.some(p => p.persona);
    
    console.log('✅ Backend generates personas:', backendHasPersonas ? 'YES' : 'NO');
    console.log('✅ WebSocket stores personas:', websocketHasPersonas ? 'YES' : 'NO');
    console.log('✅ Frontend receives persona data:', personaDataSent ? 'YES' : 'NO');
    
    if (backendHasPersonas && websocketHasPersonas && personaDataSent) {
      console.log('');
      console.log('🎉 DATA FLOW IS WORKING! Frontend should receive persona data.');
      console.log('❓ Issue is likely in frontend React component persona display logic.');
      console.log('');
      console.log('🔧 Next steps:');
      console.log('   1. Check browser console for WebSocket messages');
      console.log('   2. Verify React component is correctly parsing persona data');
      console.log('   3. Ensure persona display condition (prospect.persona) is working');
    } else {
      console.log('');
      console.log('⚠️ DATA FLOW ISSUE IDENTIFIED:');
      if (!backendHasPersonas) console.log('   - Backend not generating personas');
      if (!websocketHasPersonas) console.log('   - WebSocket not storing personas');
      if (!personaDataSent) console.log('   - Frontend not receiving persona data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteDataFlow().catch(console.error);