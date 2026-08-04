#!/bin/bash

# RentHub Upload Test Script
API_URL="http://localhost:5001/api"
TEST_PROPERTY_ID="cmkodm6sd0001ibuw24prxilf" # From previous test run

echo "📸 Testing Image Upload"
echo "======================="

# Ensure test image exists
if [ ! -f "apps/api/test-image.png" ]; then
    echo "Creating test image..."
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" | base64 -d > apps/api/test-image.png
fi

# 1. Test Property Image Upload
echo -n "Testing: Upload Property Image... "
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/upload/property/$TEST_PROPERTY_ID" \
  -H "Content-Type: multipart/form-data" \
  -F "images=@apps/api/test-image.png")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
    echo "✓ PASS (HTTP $http_code)"
    echo "Response: $body"
    
    # Extract Image ID
    IMAGE_ID=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
    
    if [ -n "$IMAGE_ID" ]; then
        echo "Image ID: $IMAGE_ID"
        
        # 2. Test Set Primary
        echo -n "Testing: Set Primary Image... "
        primary_response=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/upload/image/$IMAGE_ID/primary")
        primary_code=$(echo "$primary_response" | tail -n1)
        
        if [ "$primary_code" = "200" ]; then
            echo "✓ PASS"
        else
            echo "✗ FAIL (HTTP $primary_code)"
        fi
        
        # 3. Test Delete Image
        echo -n "Testing: Delete Image... "
        delete_response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/upload/image/$IMAGE_ID")
        delete_code=$(echo "$delete_response" | tail -n1)
        
        if [ "$delete_code" = "200" ]; then
            echo "✓ PASS"
        else
             echo "✗ FAIL (HTTP $delete_code)"
        fi
    fi
else
    echo "✗ FAIL (HTTP $http_code)"
    echo "Response: $body"
fi
