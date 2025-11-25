#!/usr/bin/env python3
"""
🔐 Email Verification Test Suite
Tests the comprehensive email verification system
"""

import sys
sys.path.insert(0, '/Users/James/Desktop/agent')

from SuperEmailDiscoveryEngine import SuperEmailDiscoveryEngine

def test_email_verification():
    """Test email verification with various cases"""
    print("="*80)
    print("🔍 Email Verification Test Suite")
    print("="*80)

    engine = SuperEmailDiscoveryEngine()

    test_cases = [
        {
            "email": "test@example.com",
            "expected": "Valid/Unverifiable",
            "reason": "Example.com has MX but is example domain"
        },
        {
            "email": "info@gmail.com",
            "expected": "Valid/Unverifiable",
            "reason": "Gmail has MX but blocks SMTP verification"
        },
        {
            "email": "nonexistent12345@gmail.com",
            "expected": "Valid/Unverifiable",
            "reason": "Gmail blocks SMTP verification"
        },
        {
            "email": "Emami-Naeini408-617-4525sc-controls@scsolutions.com",
            "expected": "Invalid",
            "reason": "SMTP rejection - mailbox not found (YOUR ISSUE)"
        },
        {
            "email": "support@google.com",
            "expected": "Valid/Catch-All",
            "reason": "Google.com is catch-all domain"
        },
        {
            "email": "user@nonexistentdomain12345.com",
            "expected": "Invalid",
            "reason": "No MX records"
        },
        {
            "email": "test-408-617-4525@suspicious.com",
            "expected": "Filtered",
            "reason": "Phone number pattern in email"
        }
    ]

    print(f"\n📋 Testing {len(test_cases)} cases:\n")

    for i, test in enumerate(test_cases, 1):
        email = test['email']
        print(f"\n{i}. Testing: {email}")
        print(f"   Expected: {test['expected']}")
        print(f"   Reason: {test['reason']}")
        print("-" * 80)

        is_valid, info = engine.verify_email_deliverability(email)

        if is_valid:
            status = info.get('status', 'unknown')
            print(f"   ✅ Result: ACCEPTED (status: {status})")
        else:
            reason = info.get('reason', 'unknown')
            print(f"   ❌ Result: REJECTED (reason: {reason})")

        print(f"   📊 Details: {info}")

    print("\n" + "="*80)
    print("✅ Test Suite Complete")
    print("="*80)

    # Test pattern filtering
    print("\n🔍 Testing Pattern Filters:")
    test_patterns = [
        "valid.email@company.com",
        "test-408-617-4525@company.com",  # Phone number
        "verylongemailaddressthatislongerthan40characters@domain.com",  # Too long
    ]

    for email in test_patterns:
        print(f"\n  Testing: {email}")
        # Test with extract_emails_advanced which applies filters
        result = engine.extract_emails_advanced(email, "test")
        if result:
            print(f"  ✅ Accepted")
        else:
            print(f"  ❌ Filtered out")

if __name__ == "__main__":
    test_email_verification()
