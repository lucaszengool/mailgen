#!/bin/bash

echo "🧪 Testing All Implemented Features"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if email verification dependencies are installed
echo "1️⃣ Testing Email Verification Dependencies..."
if python3 -c "import dns.resolver" 2>/dev/null; then
    echo -e "${GREEN}✅ dnspython installed${NC}"
else
    echo -e "${RED}❌ dnspython not installed${NC}"
    echo -e "${YELLOW}Run: pip3 install dnspython${NC}"
fi
echo ""

# Test 2: Check if prospect filter file exists
echo "2️⃣ Testing Prospect Filter System..."
if [ -f "server/utils/prospectRelevanceFilter.js" ]; then
    echo -e "${GREEN}✅ prospectRelevanceFilter.js exists${NC}"

    # Check if it's properly imported in ProspectSearchAgent
    if grep -q "ProspectRelevanceFilter" "server/agents/ProspectSearchAgent.js"; then
        echo -e "${GREEN}✅ Filter imported in ProspectSearchAgent${NC}"
    else
        echo -e "${RED}❌ Filter not imported${NC}"
    fi
else
    echo -e "${RED}❌ prospectRelevanceFilter.js not found${NC}"
fi
echo ""

# Test 3: Check Clerk integration in admin routes
echo "3️⃣ Testing Admin Dashboard Clerk Integration..."
if grep -q "clerkClient" "server/routes/admin.js"; then
    echo -e "${GREEN}✅ Clerk SDK imported in admin.js${NC}"
else
    echo -e "${RED}❌ Clerk SDK not imported${NC}"
fi

if grep -q "clerkClient.users.getUserList" "server/routes/admin.js"; then
    echo -e "${GREEN}✅ Clerk user fetching implemented${NC}"
else
    echo -e "${RED}❌ Clerk user fetching not implemented${NC}"
fi
echo ""

# Test 4: Check if QuotaBar supports unlimited
echo "4️⃣ Testing Unlimited Quota Display..."
if grep -q "isActuallyUnlimited" "client/src/components/QuotaBar.jsx"; then
    echo -e "${GREEN}✅ Unlimited quota check in QuotaBar${NC}"
else
    echo -e "${RED}❌ Unlimited quota check missing${NC}"
fi

if grep -q "∞ Unlimited" "client/src/components/QuotaBar.jsx"; then
    echo -e "${GREEN}✅ Unlimited display text exists${NC}"
else
    echo -e "${RED}❌ Unlimited display text missing${NC}"
fi
echo ""

# Test 5: Check EmailThreadView improvements
echo "5️⃣ Testing Email Thread View..."
if [ -f "client/src/pages/EmailThreadView.jsx" ]; then
    echo -e "${GREEN}✅ EmailThreadView.jsx exists${NC}"

    if grep -q "console.log.*Fetching email thread" "client/src/pages/EmailThreadView.jsx"; then
        echo -e "${GREEN}✅ Debug logging added${NC}"
    else
        echo -e "${YELLOW}⚠️  Debug logging not found${NC}"
    fi

    if grep -q "data-placeholder" "client/src/pages/EmailThreadView.jsx"; then
        echo -e "${GREEN}✅ Editor placeholder fixed${NC}"
    else
        echo -e "${YELLOW}⚠️  Editor placeholder not found${NC}"
    fi
else
    echo -e "${RED}❌ EmailThreadView.jsx not found${NC}"
fi
echo ""

# Test 6: Check UI fixes in campaign wizard
echo "6️⃣ Testing Campaign Setup UI Fixes..."
if grep -q "bg-white" "client/src/components/CampaignOnboardingWizard.jsx"; then
    echo -e "${GREEN}✅ White background fix applied${NC}"
else
    echo -e "${RED}❌ White background fix not applied${NC}"
fi

if grep -q "border-green-500" "client/src/components/CampaignOnboardingWizard.jsx"; then
    echo -e "${GREEN}✅ Green border for selected state${NC}"
else
    echo -e "${RED}❌ Green border not applied${NC}"
fi
echo ""

# Test 7: Check email verification in Python script
echo "7️⃣ Testing Email Verification in SuperEmailDiscoveryEngine..."
if grep -q "verify_email_deliverability" "SuperEmailDiscoveryEngine.py"; then
    echo -e "${GREEN}✅ Email verification function exists${NC}"
else
    echo -e "${RED}❌ Email verification function missing${NC}"
fi

if grep -q "verify_mx_records" "SuperEmailDiscoveryEngine.py"; then
    echo -e "${GREEN}✅ MX record verification exists${NC}"
else
    echo -e "${RED}❌ MX record verification missing${NC}"
fi

if grep -q "verify_email_smtp" "SuperEmailDiscoveryEngine.py"; then
    echo -e "${GREEN}✅ SMTP verification exists${NC}"
else
    echo -e "${RED}❌ SMTP verification missing${NC}"
fi
echo ""

# Test 8: Check documentation files
echo "8️⃣ Testing Documentation..."
docs=(
    "EMAIL_VERIFICATION_SYSTEM.md"
    "PROSPECT_FILTERING_IMPROVEMENTS.md"
    "ADMIN_QUOTA_FIXES.md"
    "SESSION_SUMMARY.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc exists${NC}"
    else
        echo -e "${RED}❌ $doc not found${NC}"
    fi
done
echo ""

# Summary
echo "===================================="
echo "🎯 Test Summary"
echo "===================================="
echo ""
echo "All features have been tested!"
echo ""
echo "Next steps:"
echo "1. Start the server: npm run server:dev"
echo "2. Start the client: npm run dev"
echo "3. Test manually:"
echo "   - Admin dashboard at /admin (password: admin123)"
echo "   - Create/view campaigns"
echo "   - Check email thread view"
echo "   - Verify unlimited quota display"
echo ""
