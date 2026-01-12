# Playwright E2E Tests

Comprehensive end-to-end testing suite for jlowe.ai using Playwright.

## Setup

Install dependencies:

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/visual.spec.ts

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Suites

### 1. Home Page Tests (`home.spec.ts`)
- Page loads successfully
- Major sections are visible (hero, services, projects)
- Page title and meta description
- No console errors on load

### 2. Navigation Tests (`navigation.spec.ts`)
- Desktop navigation links
- Mobile hamburger menu functionality
- Active link highlighting
- External link attributes

### 3. Contact Tests (`contact.spec.ts`)
- Form visibility and fields
- Validation errors
- Successful submission
- Social links and responsiveness

### 4. Visual Regression Tests (`visual.spec.ts`)
- Screenshot comparison at multiple viewports (desktop, tablet, mobile)
- Major sections: hero, navigation, footer, pages
- Interactive states (hover, focus)
- Mobile menu states
- Dark mode compatibility

### 5. SEO Tests (`seo.spec.ts`)
- Page titles and meta descriptions
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Structured data (JSON-LD)
- Heading hierarchy
- Image alt text
- Link accessibility

### 6. Accessibility Tests (`accessibility.spec.ts`)
- Automated axe-core audits
- Keyboard navigation (Tab, Shift+Tab, Enter, Space)
- Focus visibility
- ARIA attributes
- Color contrast
- Skip links
- Landmark regions
- Alternative text
- Screen reader announcements

### 7. Error Handling Tests (`errors.spec.ts`)
- 404 page display and navigation
- API failure handling
- Console error monitoring
- Form validation errors
- Missing resources
- JavaScript error handling
- Offline support
- Graceful degradation

### 8. Performance Tests (`performance.spec.ts`)
- Page load times
- First Contentful Paint (FCP)
- Cumulative Layout Shift (CLS)
- Resource loading optimization
- JavaScript bundle sizes
- Time to Interactive (TTI)
- Memory usage
- Caching effectiveness
- Mobile performance
- Web Vitals

### 9. Deep Link Tests (`deeplinks.spec.ts`)
- Direct route navigation
- Hash link scrolling
- Query parameter handling
- Nested routes
- Back button behavior
- Mobile hash navigation
- Anchor scroll behavior
- External share links
- Invalid hash handling

## Visual Regression Testing

### Generate Baseline Screenshots

When running visual regression tests for the first time, or after intentional UI changes:

```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
```

This will create baseline screenshots in the `e2e/__screenshots__/` directory.

### Update Specific Screenshots

```bash
# Update only desktop screenshots
npx playwright test e2e/visual.spec.ts -g "desktop" --update-snapshots

# Update only mobile screenshots
npx playwright test e2e/visual.spec.ts -g "mobile" --update-snapshots
```

### Screenshot Comparison Settings

Visual tests use the following thresholds:
- **maxDiffPixels**: Maximum number of pixels that can differ (varies by test)
- **threshold**: Pixel color difference threshold (0.15-0.25)

Adjust these values in the test files if needed for your use case.

## Accessibility Testing

Accessibility tests use `@axe-core/playwright` to run automated audits. The tests check for:
- WCAG 2.1 Level AA compliance
- Color contrast ratios
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support

## Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, iPhone 12
- **Screenshots**: On failure
- **Video**: On first retry
- **Timeout**: 30s per test
- **Retries**: 2x in CI, 0x locally

## CI Integration

Tests are configured to run in CI environments:
- Retries: 2
- Workers: 1 (sequential)
- Screenshots and videos on failure
- HTML report generated

## Best Practices

1. **Wait for Load States**: Use `page.waitForLoadState('networkidle')` to ensure content is fully loaded
2. **Dynamic Content**: Add appropriate waits for animations and transitions
3. **Selectors**: Prefer accessible selectors (roles, labels) over CSS selectors
4. **Isolation**: Each test should be independent and not rely on others
5. **Cleanup**: Clean up any test data or state after tests complete

## Troubleshooting

### Tests Failing Locally

1. Make sure dev server is running: `npm run dev`
2. Clear browser cache: `npx playwright test --clear-browser-cache`
3. Update browsers: `npx playwright install`

### Visual Regression Failures

1. Review the diff images in the test report: `npm run test:e2e:report`
2. If changes are intentional, update baselines: `npx playwright test visual.spec.ts --update-snapshots`
3. Check for dynamic content that needs to be hidden (animations, videos, etc.)

### Accessibility Failures

1. Review the axe violation details in the test output
2. Fix the underlying accessibility issues in the components
3. Re-run the tests to verify fixes

## Writing New Tests

Create new test files in the `e2e/` directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Your test logic
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [axe-core Documentation](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
