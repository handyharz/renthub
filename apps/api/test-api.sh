#!/bin/bash

# RentHub API Test Script
# Tests all endpoints to verify functionality

echo "🧪 RentHub API Test Suite"
echo "=========================="
echo ""

# Configuration
API_URL="http://localhost:5001/api"
TEST_USER_ID="cmko5poeb0000u5pa4tideb10"
TEST_CLERK_ID="test_clerk_123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "📡 Testing Health & Status Endpoints"
echo "-------------------------------------"
test_endpoint "Health Check" "GET" "/health" "" "200"
test_endpoint "API Test Route" "GET" "/test" "" "200"
echo ""

echo "👥 Testing User Endpoints"
echo "-------------------------"
test_endpoint "Get Current User" "GET" "/users/me?clerkId=$TEST_CLERK_ID" "" "200"
test_endpoint "Get User by ID" "GET" "/users/$TEST_USER_ID" "" "200"
test_endpoint "Get User Stats" "GET" "/users/$TEST_USER_ID/stats" "" "200"
test_endpoint "Get All Users" "GET" "/users" "" "200"
echo ""

echo "🏠 Testing Property Endpoints"
echo "-----------------------------"
test_endpoint "Get All Properties" "GET" "/properties" "" "200"
test_endpoint "Search Properties" "GET" "/properties/search?q=Maitama" "" "200"
test_endpoint "Filter by City" "GET" "/properties?city=Abuja" "" "200"
test_endpoint "Filter by Bedrooms" "GET" "/properties?bedrooms=3" "" "200"
test_endpoint "Get Properties by Landlord" "GET" "/properties/landlord/$TEST_USER_ID" "" "200"
echo ""

echo "🔨 Testing Property Creation"
echo "----------------------------"
PROPERTY_DATA='{
  "title": "Test Property for Automated Testing",
  "description": "This is a test property created by the automated test script",
  "address": "Test Address 456",
  "city": "Abuja",
  "state": "FCT",
  "propertyType": "APARTMENT_2BED",
  "bedrooms": 2,
  "bathrooms": 2,
  "toilets": 2,
  "parkingSpaces": 1,
  "pricePerYear": 250000000,
  "cautionFee": 250000000,
  "paymentTerms": "TWO_YEARS",
  "furnished": false,
  "serviced": false,
  "petsAllowed": false,
  "powerSupply": "GRID_ONLY",
  "waterSupply": "BOREHOLE",
  "landlordId": "'$TEST_USER_ID'"
}'

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/properties" \
    -H "Content-Type: application/json" \
    -d "$PROPERTY_DATA")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} Property Created (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    # Extract property ID for further tests
    CREATED_PROPERTY_ID=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
    
    if [ -n "$CREATED_PROPERTY_ID" ]; then
        echo "  Property ID: $CREATED_PROPERTY_ID"
        
        # Test getting the created property
        echo -n "Testing: Get Created Property... "
        get_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/properties/$CREATED_PROPERTY_ID")
        get_http_code=$(echo "$get_response" | tail -n1)
        
        if [ "$get_http_code" = "200" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $get_http_code)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $get_http_code)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        
        # Test updating the property
        echo -n "Testing: Update Property... "
        UPDATE_DATA='{"title": "Updated Test Property"}'
        update_response=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/properties/$CREATED_PROPERTY_ID" \
            -H "Content-Type: application/json" \
            -d "$UPDATE_DATA")
        update_http_code=$(echo "$update_response" | tail -n1)
        
        if [ "$update_http_code" = "200" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $update_http_code)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $update_http_code)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        
        # Test deleting the property (soft delete)
        echo -n "Testing: Delete Property (Soft Delete)... "
        delete_response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/properties/$CREATED_PROPERTY_ID")
        delete_http_code=$(echo "$delete_response" | tail -n1)
        
        if [ "$delete_http_code" = "200" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $delete_http_code)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $delete_http_code)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
else
    echo -e "${RED}✗ FAIL${NC} Property Creation Failed (HTTP $http_code)"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

echo "🔍 Testing Error Handling"
echo "------------------------"
test_endpoint "Non-existent Property" "GET" "/properties/invalid-id-12345" "" "404"
test_endpoint "Non-existent User" "GET" "/users/invalid-id-12345" "" "404"
test_endpoint "Invalid Property Creation" "POST" "/properties" '{"title":"Missing Fields"}' "400"
echo ""

echo "📊 Test Summary"
echo "==============="
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
