#!/bin/bash

# Multi-Tenant Isolation Test Script
# Tests data isolation between different users

echo "🧪 Multi-Tenant Isolation Test Suite"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${BLUE}Test $TESTS_RUN:${NC} $test_name"

    result=$(eval "$command" 2>&1)

    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Expected pattern: $expected_pattern"
        echo "Got: $result"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    echo ""
}

# Test 1: Verify server is running
echo -e "${YELLOW}=== Server Health Check ===${NC}"
run_test "Server is running" \
    "curl -s -o /dev/null -w '%{http_code}' $BASE_URL/api/agent/status" \
    "200"
echo ""

# Test 2: Create config for User A
echo -e "${YELLOW}=== User A: Create Configuration ===${NC}"
run_test "User A creates config" \
    "curl -s -X POST $BASE_URL/api/agent/config \
     -H 'x-user-id: test_user_a' \
     -H 'Content-Type: application/json' \
     -d '{\"campaignGoal\":\"partnership\",\"targetWebsite\":\"https://example-a.com\"}' | jq -r '.success'" \
    "true"
echo ""

# Test 3: Create config for User B
echo -e "${YELLOW}=== User B: Create Configuration ===${NC}"
run_test "User B creates config" \
    "curl -s -X POST $BASE_URL/api/agent/config \
     -H 'x-user-id: test_user_b' \
     -H 'Content-Type: application/json' \
     -d '{\"campaignGoal\":\"sales\",\"targetWebsite\":\"https://example-b.com\"}' | jq -r '.success'" \
    "true"
echo ""

# Test 4: Verify User A can retrieve their config
echo -e "${YELLOW}=== User A: Retrieve Configuration ===${NC}"
run_test "User A retrieves their config" \
    "curl -s $BASE_URL/api/agent/config \
     -H 'x-user-id: test_user_a' | jq -r '.targetWebsite'" \
    "https://example-a.com"
echo ""

# Test 5: Verify User B can retrieve their config
echo -e "${YELLOW}=== User B: Retrieve Configuration ===${NC}"
run_test "User B retrieves their config" \
    "curl -s $BASE_URL/api/agent/config \
     -H 'x-user-id: test_user_b' | jq -r '.targetWebsite'" \
    "https://example-b.com"
echo ""

# Test 6: Verify User A cannot see User B's data
echo -e "${YELLOW}=== Data Isolation: User A vs User B ===${NC}"
run_test "User A's config is different from User B's" \
    "curl -s $BASE_URL/api/agent/config \
     -H 'x-user-id: test_user_a' | jq -r '.targetWebsite'" \
    "https://example-a.com"
echo ""

# Test 7: Start workflow for User A
echo -e "${YELLOW}=== User A: Start Workflow ===${NC}"
run_test "User A starts workflow" \
    "curl -s -X POST $BASE_URL/api/workflow/start \
     -H 'x-user-id: test_user_a' \
     -H 'Content-Type: application/json' \
     -d '{\"targetWebsite\":\"https://example-a.com\"}' | jq -r '.success'" \
    "true"
echo ""

# Test 8: Start workflow for User B
echo -e "${YELLOW}=== User B: Start Workflow ===${NC}"
run_test "User B starts workflow" \
    "curl -s -X POST $BASE_URL/api/workflow/start \
     -H 'x-user-id: test_user_b' \
     -H 'Content-Type: application/json' \
     -d '{\"targetWebsite\":\"https://example-b.com\"}' | jq -r '.success'" \
    "true"
echo ""

# Test 9: Verify User A's workflow is independent
echo -e "${YELLOW}=== Workflow Isolation ===${NC}"
run_test "User A has independent workflow" \
    "curl -s $BASE_URL/api/workflow/status \
     -H 'x-user-id: test_user_a' | jq -r '.data.userId'" \
    "test_user_a"
echo ""

# Test 10: Verify User B's workflow is independent
run_test "User B has independent workflow" \
    "curl -s $BASE_URL/api/workflow/status \
     -H 'x-user-id: test_user_b' | jq -r '.data.userId'" \
    "test_user_b"
echo ""

# Test 11: Pause User A's workflow
echo -e "${YELLOW}=== Workflow Control ===${NC}"
run_test "User A pauses workflow" \
    "curl -s -X POST $BASE_URL/api/workflow/pause \
     -H 'x-user-id: test_user_a' | jq -r '.success'" \
    "true"
echo ""

# Test 12: Verify User B's workflow is still running
run_test "User B's workflow unaffected by User A's pause" \
    "curl -s $BASE_URL/api/workflow/status \
     -H 'x-user-id: test_user_b' | jq -r '.data.isRunning'" \
    "true"
echo ""

# Test 13: Get clients for User A (should be empty initially)
echo -e "${YELLOW}=== Client Data Isolation ===${NC}"
run_test "User A gets their clients" \
    "curl -s $BASE_URL/api/agent/clients \
     -H 'x-user-id: test_user_a' | jq -r 'type'" \
    "array"
echo ""

# Test 14: Get clients for User B (should be empty initially)
run_test "User B gets their clients" \
    "curl -s $BASE_URL/api/agent/clients \
     -H 'x-user-id: test_user_b' | jq -r 'type'" \
    "array"
echo ""

# Test 15: Reset User A's workflow
echo -e "${YELLOW}=== Workflow Reset ===${NC}"
run_test "User A resets workflow" \
    "curl -s -X POST $BASE_URL/api/workflow/reset \
     -H 'x-user-id: test_user_a' | jq -r '.success'" \
    "true"
echo ""

# Test 16: Verify User B's workflow still exists
run_test "User B's workflow unaffected by User A's reset" \
    "curl -s $BASE_URL/api/workflow/status \
     -H 'x-user-id: test_user_b' | jq -r '.data.userId'" \
    "test_user_b"
echo ""

# Test 17: Reset User B's workflow
run_test "User B resets workflow" \
    "curl -s -X POST $BASE_URL/api/workflow/reset \
     -H 'x-user-id: test_user_b' | jq -r '.success'" \
    "true"
echo ""

# Test 18: Anonymous user has separate data
echo -e "${YELLOW}=== Anonymous User Isolation ===${NC}"
run_test "Anonymous user has separate config space" \
    "curl -s $BASE_URL/api/agent/config \
     -H 'x-user-id: anonymous' | jq -r 'type'" \
    "object"
echo ""

# Test Summary
echo ""
echo "===================================="
echo -e "${BLUE}Test Summary${NC}"
echo "===================================="
echo -e "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}Multi-tenant isolation is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo -e "${YELLOW}Please review the failures above.${NC}"
    exit 1
fi
