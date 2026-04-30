#!/bin/bash
# Test script for PostHog analytics in the backend with verbose debugging

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

BASE_URL="${BASE_URL:-http://localhost:3001}"
POSTHOG_API_KEY="${POSTHOG_API_KEY:-}"
POSTHOG_HOST="${POSTHOG_HOST:-https://eu.i.posthog.com}"

echo -e "${BLUE}Testing PostHog Analytics Integration (VERBOSE MODE)${NC}"
echo -e "${BLUE}=============================================${NC}\n"

if [ -z "$POSTHOG_API_KEY" ]; then
  echo -e "${YELLOW}⚠️ POSTHOG_API_KEY is not set.${NC}"
  echo -e "${YELLOW}Direct PostHog API test will be skipped.${NC}\n"
fi

echo -e "${BLUE}Checking if backend server is running...${NC}"
if curl -s --head "$BASE_URL" >/dev/null; then
  echo -e "${GREEN}✅ Backend server is running${NC}\n"
else
  echo -e "${RED}❌ Backend server does not appear to be running at $BASE_URL${NC}"
  echo -e "${YELLOW}Please start the server with: pnpm --filter @repo/backend dev${NC}\n"
  exit 1
fi

echo -e "${BLUE}Testing health endpoint...${NC}"
echo -e "${YELLOW}Request: GET $BASE_URL/analytics/health${NC}"
health_response=$(curl -v "$BASE_URL/analytics/health" 2>&1)
echo -e "${YELLOW}Response: $health_response${NC}\n"

echo -e "${BLUE}Testing event capture through backend...${NC}"
echo -e "${YELLOW}Request: POST $BASE_URL/analytics/capture${NC}"

event_data='{
  "userId": "test-user-123",
  "event": "test_event",
  "properties": {
    "test_prop": "test_value",
    "source": "test_script",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }
}'

echo -e "${YELLOW}Request data: $event_data${NC}"

event_response=$(curl -v -X POST \
  "$BASE_URL/analytics/capture" \
  -H "Content-Type: application/json" \
  -d "$event_data" 2>&1)

echo -e "${YELLOW}Response: $event_response${NC}\n"

if [ -n "$POSTHOG_API_KEY" ]; then
  echo -e "${BLUE}Testing direct PostHog API access to verify credentials...${NC}"
  echo -e "${YELLOW}Request: POST $POSTHOG_HOST/capture/${NC}"

  direct_payload=$(cat <<EOF
{
  "api_key": "$POSTHOG_API_KEY",
  "event": "direct_api_test",
  "properties": {
    "distinct_id": "test-direct-api",
    "test_prop": "direct_test",
    "source": "direct_api_test"
  }
}
EOF
)

  direct_response=$(curl -v -X POST \
    "$POSTHOG_HOST/capture/" \
    -H "Content-Type: application/json" \
    -d "$direct_payload" 2>&1)

  echo -e "${YELLOW}Response: $direct_response${NC}\n"
fi

echo -e "${GREEN}All tests completed!${NC}"
echo -e "${BLUE}If you see any 'HTTP/1.1 200 OK' responses, the requests were sent successfully.${NC}"
echo -e "${BLUE}Check your PostHog dashboard for events named 'test_event' or 'direct_api_test'.${NC}"
echo -e "${YELLOW}Note: If you see 'Invalid API key', check POSTHOG_API_KEY and POSTHOG_HOST.${NC}"