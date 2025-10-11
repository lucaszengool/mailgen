#!/bin/bash

echo "🧪 Testing workflow with template selection..."

# Start workflow
echo "1️⃣ Starting workflow..."
curl -X POST http://localhost:3333/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{"industry": "Food Technology", "targetAudience": "CEOs and CTOs", "companyUrl": "https://example.com"}'

echo ""
echo "⏳ Waiting 40 seconds for workflow to reach template selection..."
sleep 40

# Select template
echo ""
echo "2️⃣ Selecting template..."
curl -X POST http://localhost:3333/api/template/select \
  -H "Content-Type: application/json" \
  -d '{"templateId": "professional_partnership", "campaignId": "test_workflow"}'

echo ""
echo "✅ Test complete. Check server logs for results."