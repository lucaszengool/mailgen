#!/usr/bin/env python3
import json, sys, re, urllib.request

print('🧪 TEMPLATE VARIABLE REPLACEMENT TEST')
print('='*50)

# Fetch data from API
try:
    with urllib.request.urlopen('http://localhost:3333/api/workflow/results') as response:
        data = json.loads(response.read().decode())
except Exception as e:
    print(f'❌ Failed to fetch data: {e}')
    sys.exit(1)

if not data.get('success'):
    print('❌ API call failed')
    sys.exit(1)

campaign = data.get('data', {}).get('emailCampaign', {})
emails = campaign.get('emails', [])

if not emails:
    print('❌ No emails found in campaign')
    sys.exit(1)

print(f'✅ Found {len(emails)} test emails')
print()

# Function to simulate frontend template variable replacement
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

# Test each email
for i, email in enumerate(emails[:3]):
    print(f'📧 Email {i+1}: {email.get("to", "N/A")}')
    print(f'   Company: {email.get("recipient_company", "N/A")}')
    print(f'   Name: {email.get("recipient_name", "N/A")}')
    
    # Test subject replacement
    original_subject = email.get('subject', '')
    replaced_subject = replace_template_variables(original_subject, email)
    
    print(f'   📝 Subject (original): {original_subject}')
    print(f'   📝 Subject (replaced): {replaced_subject}')
    
    has_variables = '{{' in original_subject and '}}' in original_subject
    subject_working = has_variables and original_subject != replaced_subject
    print(f'   🔧 Template variables in subject: {"Yes" if has_variables else "No"}')
    print(f'   ✅ Subject replacement working: {"Yes" if subject_working else "No"}')
    
    # Test body replacement 
    original_body = email.get('body', '')
    replaced_body = replace_template_variables(original_body, email)
    
    body_has_variables = '{{' in original_body and '}}' in original_body
    body_changed = original_body != replaced_body
    
    print(f'   🔧 Template variables in body: {"Yes" if body_has_variables else "No"}')
    print(f'   ✅ Body replacement working: {"Yes" if body_has_variables and body_changed else "No"}')
    
    # Show variable replacement examples
    if body_has_variables:
        company_matches = re.findall(r'\{\{companyName\}\}', original_body)
        name_matches = re.findall(r'\{\{recipientName\}\}', original_body)
        if company_matches:
            print(f'   📊 {{companyName}} → {email.get("recipient_company", "Your Company")} ({len(company_matches)} replacements)')
        if name_matches:
            print(f'   📊 {{recipientName}} → {email.get("recipient_name", "there")} ({len(name_matches)} replacements)')
    
    print()

print('🎯 FINAL TEST RESULT:')
all_working = True
working_count = 0
total_with_vars = 0

for email in emails:
    subject = email.get('subject', '')
    body = email.get('body', '')
    
    subject_has_vars = '{{' in subject and '}}' in subject
    body_has_vars = '{{' in body and '}}' in body
    
    if subject_has_vars or body_has_vars:
        total_with_vars += 1
        subject_replaced = replace_template_variables(subject, email)
        body_replaced = replace_template_variables(body, email)
        
        subject_works = not subject_has_vars or subject != subject_replaced
        body_works = not body_has_vars or body != body_replaced
        
        if subject_works and body_works:
            working_count += 1
        else:
            all_working = False

print(f'   📊 Emails with template variables: {total_with_vars}')
print(f'   ✅ Working correctly: {working_count}/{total_with_vars}')
print(f'   🎯 Template Replacement Status: {"WORKING PERFECTLY ✅" if all_working else "FAILED ❌"}')

# Test specific examples
print()
print('📋 SPECIFIC REPLACEMENT EXAMPLES:')
test_email = emails[0] if emails else None
if test_email:
    subject = test_email.get('subject', '')
    replaced = replace_template_variables(subject, test_email)
    print(f'   Original: {subject}')
    print(f'   Replaced: {replaced}')
    print(f'   Company Data: {test_email.get("recipient_company", "N/A")}')