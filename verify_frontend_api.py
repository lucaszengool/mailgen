#!/usr/bin/env python3
import json, urllib.request

print('🔍 VERIFYING WHAT FRONTEND RECEIVES')
print('='*50)

# Test the exact API call that the frontend makes
try:
    with urllib.request.urlopen('http://localhost:3333/api/workflow/results') as response:
        data = json.loads(response.read().decode())
    
    print('✅ API Response Success:', data.get('success', False))
    
    email_campaign = data.get('data', {}).get('emailCampaign', {})
    emails = email_campaign.get('emails', [])
    
    print(f'📧 Email Campaign Found: {bool(email_campaign)}')
    print(f'📊 Total Emails: {len(emails)}')
    
    if emails:
        print('\n📋 EMAIL LIST (what frontend should show):')
        for i, email in enumerate(emails, 1):
            print(f'  {i}. {email.get("to", "N/A")}')
            print(f'     Subject: {email.get("subject", "N/A")}')
            print(f'     Company: {email.get("recipient_company", "N/A")}')
            print(f'     Name: {email.get("recipient_name", "N/A")}')
            
            # Check if template variables are present
            subject = email.get('subject', '')
            body = email.get('body', '')
            has_template_vars = '{{' in subject or '{{' in body
            
            print(f'     Template vars present: {"Yes ⚠️" if has_template_vars else "No ✅"}')
            print()
        
        print('🎯 FRONTEND TEST INSTRUCTIONS:')
        print('1. Go to http://localhost:3000')
        print('2. You should see a list of 3 emails')
        print('3. Click on the first email (maria@deeplearning.ai)')
        print('4. In the detail view, you should see:')
        print(f'   - Subject: "Strategic Collaboration with Deeplearning" (NOT "Strategic Collaboration with {{{{companyName}}}}")')
        print('   - Body content with "Deeplearning" instead of {{companyName}}')
        print('   - Body content with "Maria" instead of {{recipientName}}')
        
        # Show the expected replacements
        first_email = emails[0]
        print()
        print('📝 EXPECTED REPLACEMENTS FOR FIRST EMAIL:')
        print('   {{companyName}} → Deeplearning')
        print('   {{recipientName}} → Maria')
        print('   {{senderName}} → John Smith')
        
    else:
        print('❌ No emails found - frontend will show empty state')
        print('🔧 Run this to inject test emails:')
        print('   curl -X POST http://localhost:3333/api/workflow/inject-test-emails')
        
except Exception as e:
    print(f'❌ API Error: {e}')

print()
print('🔗 Direct test URL: http://localhost:3000')
print('⏳ Frontend should automatically load and show the emails')