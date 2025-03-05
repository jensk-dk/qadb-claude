#!/bin/bash
set -e

# Change to the project directory
cd "$(dirname "$0")"

echo "== Creating comprehensive test data =="
node create-comprehensive-test-data.js

echo ""
echo "== Running Playwright Tests =="
npm test -- tests/test-run-workflows.spec.js