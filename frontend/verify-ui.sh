#!/bin/bash
set -e

# Change to the frontend directory
cd "$(dirname "$0")"

echo "== UI Verification Script =="
echo "This script verifies that the QaDb2 UI components are working correctly."
echo ""

# Check if tests should be run in headed mode
if [ "$1" == "--headed" ]; then
  HEADED_FLAG="--headed"
  echo "Running tests in headed mode (browser will be visible)"
else
  HEADED_FLAG=""
  echo "Running tests in headless mode (use --headed to see the browser)"
fi

echo ""
echo "== Running UI verification tests =="
npx playwright test tests/data-verification.spec.js $HEADED_FLAG

echo ""
echo "== Test Results =="
echo "All tests passed! UI components are working correctly."
echo ""
echo "To see more detailed test reports, run: npx playwright show-report"