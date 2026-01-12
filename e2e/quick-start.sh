#!/bin/bash

# Playwright E2E Test Quick Start Guide
# This script helps you get started with the E2E test suite

set -e

echo "🎭 Playwright E2E Test Suite - Quick Start"
echo "==========================================="
echo ""

# Check if Playwright browsers are installed
if ! command -v playwright &> /dev/null; then
    echo "❌ Playwright not found. Installing..."
    npm install
else
    echo "✅ Playwright is installed"
fi

echo ""
echo "📦 Installing Playwright browsers..."
npx playwright install --with-deps

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Available Commands:"
echo "--------------------"
echo ""
echo "1. Run all tests:"
echo "   npm run test:e2e"
echo ""
echo "2. Run with UI mode (recommended for first run):"
echo "   npm run test:e2e:ui"
echo ""
echo "3. Run specific test suite:"
echo "   npx playwright test e2e/visual.spec.ts"
echo "   npx playwright test e2e/accessibility.spec.ts"
echo "   npx playwright test e2e/seo.spec.ts"
echo "   npx playwright test e2e/performance.spec.ts"
echo "   npx playwright test e2e/errors.spec.ts"
echo "   npx playwright test e2e/deeplinks.spec.ts"
echo ""
echo "4. Generate baseline screenshots (required for visual tests):"
echo "   npx playwright test visual.spec.ts --update-snapshots"
echo ""
echo "5. Run in headed mode (see the browser):"
echo "   npm run test:e2e:headed"
echo ""
echo "6. Debug tests:"
echo "   npm run test:e2e:debug"
echo ""
echo "7. View last test report:"
echo "   npm run test:e2e:report"
echo ""
echo "8. Run only accessibility tests:"
echo "   npx playwright test -g accessibility"
echo ""
echo "9. Run on specific browser:"
echo "   npx playwright test --project=chromium"
echo "   npx playwright test --project=firefox"
echo "   npx playwright test --project=webkit"
echo "   npx playwright test --project=\"iPhone 12\""
echo ""
echo "⚠️  IMPORTANT: Make sure your dev server is running!"
echo "   npm run dev"
echo ""
echo "📖 For more information, see:"
echo "   - e2e/README.md - Full documentation"
echo "   - e2e/IMPLEMENTATION_SUMMARY.md - Test suite overview"
echo ""
echo "🚀 Ready to run tests!"

