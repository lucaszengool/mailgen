#!/usr/bin/env python3
import json, urllib.request, sys, re

print('🧪 REAL USER TEST - EMAIL DETAIL VIEW')
print('='*60)

# Get current emails
with urllib.request.urlopen('http://localhost:3333/api/workflow/results') as response:
    data = json.loads(response.read().decode())

emails = data.get('data', {}).get('emailCampaign', {}).get('emails', [])

def replace_template_variables(content, email):
    if not content or not isinstance(content, str):
        return content
    
    variables = {
        '{{companyName}}': email.get('recipient_company', 'Your Company'),
        '{{recipientName}}': email.get('recipient_name', 'there'),
        '{{senderName}}': email.get('sender_name', 'AI Marketing'),
        '{{websiteUrl}}': email.get('website_url', 'https://example.com'),
        '{{campaignId}}': email.get('campaign_id', 'default')
    }
    
    processed_content = content
    for placeholder, value in variables.items():
        processed_content = re.sub(re.escape(placeholder), value, processed_content)
    
    return processed_content

print(f'📧 Found {len(emails)} emails in system')
print()

if emails:
    test_email = emails[0]  # Test the first email
    
    print(f'🔍 TESTING EMAIL: {test_email.get("to")}')
    print(f'   Company: {test_email.get("recipient_company")}')
    print(f'   Name: {test_email.get("recipient_name")}')
    print()
    
    # Test what EmailDetailView should show
    original_subject = test_email.get('subject', '')
    replaced_subject = replace_template_variables(original_subject, test_email)
    
    print('📝 SUBJECT LINE (EmailDetailView line 669):')
    print(f'   Raw data: {original_subject}')
    print(f'   After replaceTemplateVariables(): {replaced_subject}')
    
    has_template_vars = '{{' in original_subject
    replacement_worked = original_subject != replaced_subject and '{{' not in replaced_subject
    
    print(f'   ✅ Template replacement should work: {"Yes" if has_template_vars and replacement_worked else "No"}')
    print()
    
    # Test body content
    original_body = test_email.get('body', '')
    replaced_body = replace_template_variables(original_body, test_email)
    
    print('📄 EMAIL BODY (dangerouslySetInnerHTML):')
    body_has_vars = '{{' in original_body
    body_replacement_worked = original_body != replaced_body
    remaining_vars = '{{' in replaced_body
    
    print(f'   Original has template vars: {"Yes" if body_has_vars else "No"}')
    print(f'   Body was changed: {"Yes" if body_replacement_worked else "No"}')
    print(f'   Still has unreplaced vars: {"Yes" if remaining_vars else "No"}')
    
    if body_has_vars and body_replacement_worked and not remaining_vars:
        print('   ✅ Body template replacement: SHOULD WORK')
    else:
        print('   ❌ Body template replacement: PROBLEM DETECTED')
    
    print()
    print('🎯 WHAT USER SHOULD SEE:')
    print(f'   Subject: "{replaced_subject}"')
    print(f'   Body content with: "{test_email.get("recipient_company")}" instead of "{{{{companyName}}}}"')
    
else:
    print('❌ No emails found to test')

print()
print('🔗 Now opening frontend to verify manually...')
print('   URL: http://localhost:3000')
print('   Action: Click on first email in list')
print('   Expected: Should see company name, not {{companyName}}')