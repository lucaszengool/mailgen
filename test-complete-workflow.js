/**
 * Complete Template Selection Workflow Test
 */

const axios = require('axios');

async function testCompleteWorkflow() {
  try {
    console.log('🧪 TESTING COMPLETE TEMPLATE WORKFLOW');
    console.log('=' .repeat(60));

    // Step 1: Start workflow to trigger prospect discovery
    console.log('🚀 Step 1: Starting workflow...');
    
    const response = await axios.post('http://localhost:3333/api/workflow/start', {
      businessDescription: "AI-powered Food Technology Solutions",
      targetAudience: "Food Technology Companies and Innovation Labs", 
      initialMessage: "We help food tech companies accelerate innovation"
    });

    if (response.data.success) {
      console.log('✅ Workflow started successfully');
      console.log('📊 Workflow ID:', response.data.workflowId);
      
      console.log('\n⏳ Now monitoring logs for:');
      console.log('   1. Prospects being found');
      console.log('   2. Workflow PAUSING for template selection');
      console.log('   3. Template selection popup being triggered');
      console.log('\n🎯 Expected sequence:');
      console.log('   📧 Find prospects → 🛑 PAUSE workflow → 🎨 Show template popup');
      console.log('\n👀 Check the server logs and frontend for template selection popup!');
      
    } else {
      console.log('❌ Workflow failed to start:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteWorkflow();
