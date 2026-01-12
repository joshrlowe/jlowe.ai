# E2E Test Suite Setup Checklist

Use this checklist to verify your Playwright E2E test suite is properly set up and ready to run.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] PostgreSQL database running (for full integration tests)

## Installation & Setup

- [ ] Playwright installed: `@playwright/test` in `devDependencies`
- [ ] Axe-core installed: `@axe-core/playwright` in `devDependencies`
- [ ] Playwright browsers installed: Run `npx playwright install`
- [ ] Quick start script is executable: `chmod +x e2e/quick-start.sh`

## Configuration

- [ ] `playwright.config.ts` exists in project root
- [ ] Base URL configured: `http://localhost:3000`
- [ ] All browser projects configured: Chromium, Firefox, WebKit, iPhone 12
- [ ] Screenshots configured: `only-on-failure`
- [ ] Video recording configured: `on-first-retry`
- [ ] Web server configured to start Next.js dev server

## Test Files

- [ ] `e2e/home.spec.ts` - Home page tests
- [ ] `e2e/navigation.spec.ts` - Navigation tests
- [ ] `e2e/contact.spec.ts` - Contact page tests
- [ ] `e2e/visual.spec.ts` - Visual regression tests
- [ ] `e2e/seo.spec.ts` - SEO validation tests
- [ ] `e2e/accessibility.spec.ts` - Accessibility tests
- [ ] `e2e/errors.spec.ts` - Error handling tests
- [ ] `e2e/performance.spec.ts` - Performance baseline tests
- [ ] `e2e/deeplinks.spec.ts` - Deep link tests
- [ ] `e2e/fixtures/index.ts` - Test fixtures (placeholder)

## Documentation

- [ ] `e2e/README.md` - Comprehensive test guide
- [ ] `e2e/IMPLEMENTATION_SUMMARY.md` - Test suite overview
- [ ] `e2e/quick-start.sh` - Quick setup script
- [ ] Main `README.md` updated with E2E testing section

## NPM Scripts

Verify these scripts exist in `package.json`:

- [ ] `"test:e2e": "playwright test"`
- [ ] `"test:e2e:ui": "playwright test --ui"`
- [ ] `"test:e2e:headed": "playwright test --headed"`
- [ ] `"test:e2e:debug": "playwright test --debug"`
- [ ] `"test:e2e:report": "playwright show-report"`

## Visual Regression Setup

- [ ] Baseline screenshots generated: Run `npx playwright test visual.spec.ts --update-snapshots`
- [ ] Screenshots directory exists: `e2e/__screenshots__/` (after running tests)
- [ ] Visual tests pass: Run `npx playwright test visual.spec.ts`

## Test Verification

Run these commands to verify everything works:

### 1. List All Tests
```bash
npx playwright test --list
```
- [ ] Should show ~1024 tests (256 tests × 4 browsers)
- [ ] No syntax errors

### 2. Run Basic Tests (Fast)
```bash
npx playwright test home.spec.ts --project=chromium
```
- [ ] Tests run successfully
- [ ] Dev server starts automatically
- [ ] No errors in output

### 3. Run Visual Tests (After Baselines)
```bash
npx playwright test visual.spec.ts --project=chromium
```
- [ ] Visual comparisons pass
- [ ] No pixel differences (or within threshold)

### 4. Run Accessibility Tests
```bash
npx playwright test accessibility.spec.ts --project=chromium
```
- [ ] Axe audits pass
- [ ] No accessibility violations

### 5. Interactive UI Mode
```bash
npm run test:e2e:ui
```
- [ ] Playwright UI opens
- [ ] Can select and run individual tests
- [ ] Can view test traces

### 6. View Test Report
```bash
npm run test:e2e:report
```
- [ ] HTML report opens
- [ ] Shows test results
- [ ] Can view screenshots and videos (on failures)

## Troubleshooting

### Issue: Browsers not installed
**Solution**: Run `npx playwright install --with-deps`

### Issue: Dev server not starting
**Solution**: Manually start dev server in separate terminal: `npm run dev`

### Issue: Visual tests failing
**Solution**: 
1. View diffs: `npm run test:e2e:report`
2. Update baselines if changes are intentional: `npx playwright test visual.spec.ts --update-snapshots`

### Issue: Accessibility violations
**Solution**: 
1. Review axe output in terminal
2. Fix underlying issues in components
3. Re-run tests

### Issue: Tests timing out
**Solution**: 
1. Increase timeout in `playwright.config.ts`
2. Check network speed
3. Ensure dev server is running

### Issue: Sandbox/permission errors
**Solution**: Run with elevated permissions or adjust sandbox settings

## Best Practices Verification

- [ ] All tests use `page.waitForLoadState('networkidle')` after navigation
- [ ] Tests use accessible selectors (`getByRole`, `getByLabel`)
- [ ] Tests are independent and don't rely on order
- [ ] Dynamic content has appropriate waits
- [ ] Error messages are descriptive
- [ ] Tests follow naming convention: `should [action]`

## CI/CD Integration (Optional)

- [ ] GitHub Actions workflow created (if using CI)
- [ ] Playwright browsers installed in CI environment
- [ ] Test artifacts (screenshots, videos) uploaded on failure
- [ ] HTML report published
- [ ] Retries configured for CI

## Performance Checklist

- [ ] Performance tests have realistic thresholds
- [ ] Load time tests pass on local dev server
- [ ] Memory tests don't fail due to dev mode overhead
- [ ] Web Vitals meet target thresholds

## Final Verification

Run the full suite once to ensure everything works:

```bash
npm run test:e2e
```

Expected results:
- [ ] All tests pass (or minimal failures)
- [ ] No browser crashes
- [ ] Screenshots/videos generated on failures
- [ ] HTML report generated
- [ ] Total run time reasonable (< 10 minutes for local)

## Success Criteria

✅ **Setup is complete when**:
1. All checkboxes above are checked
2. Can run full test suite without errors
3. Visual regression tests pass (after baselines set)
4. Accessibility tests pass with no violations
5. Can view interactive UI and test reports
6. Documentation is accessible and clear

---

## Next Steps

1. Integrate E2E tests into your development workflow
2. Run tests before committing changes
3. Set up CI/CD pipeline for automated testing
4. Update baselines when making intentional UI changes
5. Add more tests as new features are developed

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Axe Accessibility](https://www.deque.com/axe/)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Date**: 2026-01-11
**Version**: 1.0.0
**Status**: ✅ Complete

