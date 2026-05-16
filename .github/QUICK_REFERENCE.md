# CI/CD Quick Reference Card

Quick commands and reminders for working with the CI/CD pipeline.

## 🚀 Running Tests Locally

```bash
# Lint check
npm run lint

# Unit tests (watch mode)
npm run test:watch

# Unit tests (coverage)
npm run test:coverage

# E2E tests (all)
npm run test:e2e

# E2E tests (UI mode - recommended)
npm run test:e2e:ui

# E2E tests (specific file)
npx playwright test e2e/accessibility.spec.ts

# Simulate CI locally
npm ci && npm run lint && npm run test:coverage
```

## 🔄 Workflow Status

Check workflow runs:

```
https://github.com/OWNER/jlowe.ai/actions
```

Status badges in README.md show current status.

## ✅ Before Creating PR

```bash
# 1. Ensure all tests pass
npm run lint
npm test
npm run test:e2e

# 2. Check coverage
npm run test:coverage
# Must meet 70% threshold

# 3. Update visual baselines if UI changed
npx playwright test visual.spec.ts --update-snapshots

# 4. Commit and push
git add .
git commit -m "feat: your changes"
git push origin your-branch
```

## 🔒 Branch Protection

**Cannot merge unless**:

- ✅ All status checks pass
- ✅ 1+ approvals
- ✅ Conversations resolved
- ✅ Branch up to date

**Required checks**:

- lint
- unit-tests
- e2e-tests
- visual-regression
- accessibility
- performance
- test-summary

## 📊 CI/CD Jobs

| Job               | Duration | Purpose                      |
| ----------------- | -------- | ---------------------------- |
| lint              | ~30s     | Code quality                 |
| unit-tests        | ~2-3min  | Jest + coverage              |
| e2e-tests         | ~3-5min  | Playwright (6 parallel jobs) |
| visual-regression | ~2-3min  | Screenshot comparison        |
| accessibility     | ~2min    | WCAG compliance              |
| performance       | ~2min    | Web Vitals                   |
| test-summary      | ~10s     | Aggregate results            |

**Total**: ~10-15 minutes

## 🐛 Quick Fixes

### Lint Failures

```bash
npm run lint -- --fix
git add .
git commit -m "fix: resolve linting issues"
```

### Unit Test Failures

```bash
# Run specific test
npm test Button.test.jsx

# Update snapshots if changed intentionally
npm test -- -u

# Debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Failures

```bash
# Run in headed mode to see what's happening
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report

# Update visual baselines
npx playwright test visual.spec.ts --update-snapshots
```

### Coverage Below Threshold

```bash
# Check which files need tests
npm run test:coverage
# Look at uncovered lines in coverage/index.html

# Add tests for uncovered code
```

## 📦 Viewing Artifacts

### From GitHub UI

1. Go to Actions tab
2. Click on workflow run
3. Scroll to "Artifacts" section
4. Download needed artifacts

### Using GitHub CLI

```bash
# List artifacts for a run
gh run view RUN_ID --json artifacts

# Download all artifacts
gh run download RUN_ID
```

## 🎯 Coverage Requirements

**Minimum thresholds**:

- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

**Target**: 80% across all metrics

## 📸 Visual Regression

### Update Baselines

```bash
# After intentional UI changes
npx playwright test visual.spec.ts --update-snapshots

# Commit the updated screenshots
git add e2e/__screenshots__
git commit -m "test: update visual baselines"
```

### Review Diffs

```bash
# After failed visual tests
npm run test:e2e:report

# Look at test-results/**/diff-*.png
```

## 🔍 Debugging CI Failures

### Step 1: Check Logs

- Go to Actions → Failed run
- Click on failed job
- Expand failed step
- Read error message

### Step 2: Download Artifacts

- Screenshots show what the page looked like
- Videos show user interactions
- Reports have detailed traces

### Step 3: Reproduce Locally

```bash
# Set CI environment variable
CI=true npm test

# Or run specific test
npx playwright test failing-test.spec.ts --project=chromium
```

### Step 4: Fix and Push

```bash
# Make fixes
# Test locally
npm run lint && npm test && npm run test:e2e

# Push
git add .
git commit -m "fix: resolve CI failure"
git push
```

## 🚨 Emergency Bypass

**Only for critical hotfixes!**

1. Document reason in issue
2. Settings → Branches → Edit rule
3. Uncheck "Include administrators"
4. Merge quickly
5. Re-enable immediately

## 📚 Documentation Links

- **Full CI/CD Guide**: `.github/WORKFLOW_SETUP.md`
- **Branch Protection**: `.github/BRANCH_PROTECTION.md`
- **Unit Tests**: `__tests__/README.md`
- **E2E Tests**: `e2e/README.md`
- **Implementation**: `.github/TESTING_SUMMARY.md`

## 🔧 Common Commands

```bash
# Check workflow status
gh workflow view "Test Suite"

# Run workflow manually
gh workflow run test.yml

# View latest run
gh run list --workflow=test.yml --limit=1

# Watch run in progress
gh run watch

# Cancel run
gh run cancel RUN_ID
```

## ⚡ Performance Tips

### Faster Local Tests

```bash
# Run only changed tests
npm test -- --onlyChanged

# Run in band (no parallel)
npm test -- --runInBand

# Watch mode (fastest iteration)
npm run test:watch
```

### Faster E2E Tests

```bash
# Run single browser
npx playwright test --project=chromium

# Skip slow tests
npx playwright test --grep-invert "@slow"

# UI mode (fastest debugging)
npm run test:e2e:ui
```

## 📞 Getting Help

1. **Check documentation** (links above)
2. **Review similar tests** for examples
3. **Check workflow logs** for details
4. **Ask in team chat**
5. **Create issue** if bug found

## 🎯 Quality Standards

- ✅ All tests pass locally before pushing
- ✅ Coverage meets 70% threshold
- ✅ No linting errors
- ✅ Visual regressions reviewed
- ✅ Accessibility violations fixed
- ✅ Performance within limits
- ✅ Code reviewed and approved

---

**Keep this card handy!** Bookmark in browser or pin in Slack.

**Last Updated**: 2026-01-11
