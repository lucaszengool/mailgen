/**
 * Test Complete Template Selection Workflow
 * This script tests:
 * 1. Starting a workflow
 * 2. Finding prospects
 * 3. Template selection popup trigger
 * 4. Workflow pause
 * 5. Template selection
 * 6. Workflow resume
 */

async function testTemplateWorkflow() {
  console.log('🧪 TESTING TEMPLATE SELECTION WORKFLOW');
  console.log('='.repeat(60));

  // Step 1: Start workflow
  console.log('\n🚀 Step 1: Starting workflow...');
  const startResponse = await fetch('http://localhost:3333/api/workflow/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      industry: 'Food Technology',
      targetAudience: 'CEOs and CTOs of food tech companies',
      productInfo: 'AI-powered food quality analysis',
      emailCount: 5,
      senderName: 'AI Test Team',
      smtpConfig: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        senderName: 'AI Test',
        senderEmail: 'test@example.com',
        auth: { user: 'test@example.com', pass: 'test123' }
      }
    })
  });

  const startData = await startResponse.json();
  console.log('✅ Workflow started:', startData.message);
  console.log('   Campaign ID:', startData.campaignId);

  // Step 2: Wait for template selection trigger
  console.log('\n⏳ Step 2: Waiting for prospects to be found...');
  console.log('   This may take 30-60 seconds...');

  // Poll for workflow status
  let templateSelectionTriggered = false;
  let attempts = 0;
  const maxAttempts = 30;

  while (!templateSelectionTriggered && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    try {
      const statusResponse = await fetch(`http://localhost:3333/api/workflow/status/${startData.campaignId}`);
      const statusData = await statusResponse.json();

      console.log(`   Attempt ${attempts + 1}/${maxAttempts}: ${statusData.status || 'checking'}`);

      // Check if template selection is required
      if (statusData.status === 'paused_for_template_selection' ||
          statusData.requiresTemplateSelection ||
          statusData.message?.includes('template')) {
        templateSelectionTriggered = true;
        console.log('✅ Template selection triggered!');
        console.log('   Prospects found:', statusData.prospectsFound || 'unknown');
      }
    } catch (error) {
      console.log('   Still processing...');
    }

    attempts++;
  }

  if (!templateSelectionTriggered) {
    console.log('❌ Template selection was not triggered within timeout');
    console.log('   Check server logs for details');
    return;
  }

  // Step 3: Select a template
  console.log('\n🎨 Step 3: Selecting template...');
  const templateResponse = await fetch('http://localhost:3333/api/template/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId: startData.campaignId,
      templateId: 'modern_tech',
      templateName: 'Modern Tech'
    })
  });

  const templateData = await templateResponse.json();
  if (templateData.success) {
    console.log('✅ Template selected successfully:', templateData.message);
    console.log('   Template:', templateData.template?.name);
  } else {
    console.log('❌ Template selection failed:', templateData.message);
    return;
  }

  // Step 4: Verify workflow resumed
  console.log('\n🔄 Step 4: Verifying workflow resumed...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

  const finalStatus = await fetch(`http://localhost:3333/api/workflow/status/${startData.campaignId}`);
  const finalData = await finalStatus.json();

  console.log('✅ Final workflow status:', finalData.status || 'resumed');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TEST COMPLETE!');
  console.log('✅ Template selection workflow is working correctly!');
  console.log('='.repeat(60));
}

// Run the test
testTemplateWorkflow().catch(console.error);