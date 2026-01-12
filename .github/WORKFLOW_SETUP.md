# CI/CD Workflow Setup Guide

Complete guide for setting up and running the GitHub Actions CI/CD pipeline.

## 📋 Overview

The CI/CD pipeline runs comprehensive tests on every push and pull request, ensuring code quality before merging.

### Pipeline Jobs

1. **Lint** - Code quality and formatting
2. **Unit Tests** - Component and utility tests with coverage
3. **E2E Tests** - End-to-end tests across browsers (sharded)
4. **Visual Regression** - Screenshot comparison tests
5. **Accessibility** - WCAG 2.1 AA compliance checks
6. **Performance** - Load time and Web Vitals monitoring
7. **Test Summary** - Overall results and reporting

## 🚀 Quick Setup

### 1. Prerequisites

- GitHub repository
- Admin access to repository
- Node.js 20+ compatible codebase

### 2. Initial Setup

```bash
# Ensure all dependencies are installed
npm install

# Verify tests pass locally
npm run lint
npm test
npm run test:e2e
```

### 3. Push Workflow

```bash
# Add workflow file (already created)
git add .github/workflows/test.yml

# Commit
git commit -m "ci: add GitHub Actions test workflow"

# Push to main or create PR
git push origin main
```

### 4. Monitor First Run

1. Go to repository → Actions tab
2. Click on "Test Suite" workflow
3. Watch jobs execute
4. Verify all jobs pass ✅

## 📊 Workflow Configuration

### Triggers

The workflow runs on:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch: # Manual trigger
```

### Concurrency

Cancels in-progress runs when new commit is pushed:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Environment Variables

```yaml
env:
  NODE_VERSION: '20'
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
```

## 🏃 Running Jobs

### Lint Job

**Purpose**: Check code quality and formatting

**Steps**:
1. Checkout code
2. Setup Node.js with cache
3. Install dependencies (`npm ci`)
4. Run ESLint (`npm run lint`)
5. Check Prettier formatting (if configured)

**Duration**: ~30 seconds

### Unit Tests Job

**Purpose**: Run Jest tests with coverage

**Steps**:
1. Start PostgreSQL service
2. Checkout and setup
3. Install dependencies
4. Generate Prisma client
5. Run migrations
6. Execute tests with coverage
7. Upload coverage to Codecov
8. Comment coverage on PR
9. Check coverage thresholds

**Duration**: ~2-3 minutes

**Services**: PostgreSQL 15

### E2E Tests Job (Matrix)

**Purpose**: Run Playwright tests across browsers

**Matrix Strategy**:
- Browsers: chromium, firefox, webkit
- Shards: 2 (parallel execution)
- Total: 6 parallel jobs

**Steps per job**:
1. Checkout and setup
2. Install specific browser
3. Run tests for browser/shard
4. Upload results and artifacts

**Duration**: ~3-5 minutes per job

### Visual Regression Job

**Purpose**: Detect unintended UI changes

**Steps**:
1. Run visual tests with Chromium
2. Compare screenshots to baselines
3. Upload diffs on failure

**Duration**: ~2-3 minutes

### Accessibility Job

**Purpose**: Ensure WCAG compliance

**Steps**:
1. Run axe-core audits
2. Check keyboard navigation
3. Verify ARIA attributes

**Duration**: ~2 minutes

### Performance Job

**Purpose**: Monitor performance metrics

**Steps**:
1. Run performance tests
2. Check load times
3. Measure Web Vitals
4. Upload performance report

**Duration**: ~2 minutes

### Test Summary Job

**Purpose**: Aggregate results

**Steps**:
1. Collect all job statuses
2. Generate summary
3. Fail if any job failed

**Duration**: ~10 seconds

## 🎯 Success Criteria

All jobs must pass (✅) for the workflow to succeed:

- ✅ Lint
- ✅ Unit Tests (coverage ≥ 70%)
- ✅ E2E Tests (all browsers)
- ✅ Visual Regression (no unexpected changes)
- ✅ Accessibility (no violations)
- ✅ Performance (within thresholds)
- ✅ Test Summary

## 📦 Artifacts

The workflow uploads artifacts on completion/failure:

### Coverage Report
- **Name**: `coverage-report`
- **Path**: `coverage/`
- **Retention**: 30 days
- **Includes**: HTML report, lcov.info, JSON summary

### Playwright Reports
- **Name**: `playwright-report-{browser}-{shard}`
- **Path**: `playwright-report/`
- **Retention**: 30 days
- **Includes**: HTML report, traces

### Screenshots (on failure)
- **Name**: `screenshots-{browser}-{shard}`
- **Path**: `test-results/**/*.png`
- **Retention**: 7 days

### Videos (on failure)
- **Name**: `videos-{browser}-{shard}`
- **Path**: `test-results/**/*.webm`
- **Retention**: 7 days

### Visual Diffs (on failure)
- **Name**: `visual-diffs`
- **Path**: `test-results/**/diff-*.png`
- **Retention**: 7 days

## 🔧 Configuration

### Adjust Node Version

Edit `.github/workflows/test.yml`:

```yaml
env:
  NODE_VERSION: '20'  # Change to '18' or '22'
```

### Adjust Coverage Thresholds

Edit workflow file:

```yaml
- name: Check coverage thresholds
  run: |
    npm run test:coverage -- --coverageThreshold='{"global":{
      "statements":70,
      "branches":60,
      "functions":70,
      "lines":70
    }}'
```

### Add/Remove E2E Browsers

Edit matrix strategy:

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]  # Add/remove browsers
    shard: [1/2, 2/2]  # Adjust sharding
```

### Change Trigger Branches

```yaml
on:
  push:
    branches: [main, develop, staging]  # Add more branches
  pull_request:
    branches: [main, develop]
```

## 🐛 Troubleshooting

### Workflow Not Triggering

**Issue**: Workflow doesn't run on push/PR

**Solutions**:
1. Check workflow file is in `.github/workflows/`
2. Verify YAML syntax: `yamllint .github/workflows/test.yml`
3. Check branch names match trigger configuration
4. Ensure Actions are enabled: Settings → Actions → General

### Lint Job Failing

**Issue**: ESLint errors

**Solutions**:
```bash
# Run locally to see errors
npm run lint

# Auto-fix where possible
npm run lint -- --fix

# Commit fixes
git add .
git commit -m "fix: resolve linting issues"
```

### Unit Tests Failing

**Issue**: Tests pass locally but fail in CI

**Solutions**:
1. **Environment differences**:
   ```bash
   # Set CI env locally
   CI=true npm test
   ```

2. **Database issues**:
   - Check PostgreSQL service is running
   - Verify DATABASE_URL is correct
   - Ensure migrations run successfully

3. **Timezone issues**:
   ```javascript
   // Mock dates in tests
   jest.useFakeTimers();
   jest.setSystemTime(new Date('2024-01-01'));
   ```

### E2E Tests Failing

**Issue**: Playwright tests fail in CI but pass locally

**Solutions**:
1. **Timing issues**:
   ```javascript
   // Add appropriate waits
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(1000);
   ```

2. **Viewport differences**:
   ```javascript
   // Set consistent viewport
   await page.setViewportSize({ width: 1280, height: 720 });
   ```

3. **Missing dependencies**:
   ```bash
   # Install with deps
   npx playwright install --with-deps
   ```

4. **Check artifacts**:
   - Download screenshots from failed run
   - Review traces in Playwright report

### Visual Regression Failing

**Issue**: Screenshots don't match

**Solutions**:
1. **Update baselines in CI**:
   ```yaml
   # Add to workflow (temporary)
   - name: Update snapshots
     if: github.event_name == 'push'
     run: npx playwright test visual.spec.ts --update-snapshots
   ```

2. **Platform differences**:
   - Generate baselines in Docker/CI environment
   - Use consistent OS (Ubuntu) for screenshots

3. **Dynamic content**:
   ```javascript
   // Hide animations
   await page.addStyleTag({
     content: `* { animation: none !important; }`
   });
   ```

### Coverage Below Threshold

**Issue**: Coverage doesn't meet requirements

**Solutions**:
1. **Add missing tests**
2. **Adjust thresholds** (temporarily)
3. **Exclude files from coverage**:
   ```javascript
   // jest.config.js
   coveragePathIgnorePatterns: [
     '/node_modules/',
     '/.next/',
     '/scripts/',
   ]
   ```

### Out of Memory

**Issue**: Node.js heap out of memory

**Solutions**:
```yaml
- name: Run tests with increased memory
  run: NODE_OPTIONS="--max-old-space-size=4096" npm test
```

### Slow Performance

**Issue**: Workflow takes too long

**Solutions**:
1. **Increase sharding**:
   ```yaml
   matrix:
     shard: [1/4, 2/4, 3/4, 4/4]  # More parallel jobs
   ```

2. **Cache dependencies**:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # Ensure caching is enabled
   ```

3. **Run jobs in parallel**:
   - Remove `needs: lint` to run jobs concurrently
   - Trade-off: more runner time

## 📈 Optimization Tips

### 1. Cache Everything

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
      node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

### 2. Conditional Jobs

```yaml
jobs:
  e2e-tests:
    if: |
      github.event_name == 'push' ||
      contains(github.event.pull_request.labels.*.name, 'e2e')
```

### 3. Skip Redundant Tests

```yaml
- name: Check if tests should run
  id: check
  run: |
    if git diff --name-only HEAD~1 | grep -q "^e2e/"; then
      echo "run=true" >> $GITHUB_OUTPUT
    fi

- name: Run E2E tests
  if: steps.check.outputs.run == 'true'
  run: npm run test:e2e
```

### 4. Faster Install

```yaml
- name: Install dependencies
  run: npm ci --prefer-offline --no-audit
```

## 📊 Monitoring

### View Workflow Runs

```
https://github.com/OWNER/REPO/actions/workflows/test.yml
```

### Download Artifacts

```bash
# Using GitHub CLI
gh run download RUN_ID

# Or via web UI
# Actions → Workflow run → Artifacts section
```

### View Coverage Trends

Set up Codecov:

1. Sign up at codecov.io
2. Add repository
3. Set `CODECOV_TOKEN` in repository secrets
4. Coverage badge auto-updates

## 🔒 Security

### Repository Secrets

Required secrets:
- `CODECOV_TOKEN` (optional, for coverage reporting)

Add at: Settings → Secrets and variables → Actions

### Permissions

Workflow requires:

```yaml
permissions:
  contents: read       # Read code
  pull-requests: write # Comment on PRs
  statuses: write      # Update commit statuses
```

Configure at: Settings → Actions → General → Workflow permissions

## ✅ Checklist

- [ ] Workflow file created: `.github/workflows/test.yml`
- [ ] All tests pass locally
- [ ] Workflow triggered successfully
- [ ] All jobs pass in CI
- [ ] Artifacts uploaded correctly
- [ ] Coverage reporting works
- [ ] Branch protection configured
- [ ] Team notified of CI setup
- [ ] Documentation updated

## 🎓 Best Practices

1. **Keep workflows fast** (< 10 minutes total)
2. **Use matrix for parallelization**
3. **Cache dependencies aggressively**
4. **Upload artifacts on failure only** (saves storage)
5. **Set realistic coverage thresholds**
6. **Monitor workflow performance weekly**
7. **Update dependencies regularly**
8. **Test workflows in feature branches first**

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Jest CI Configuration](https://jestjs.io/docs/continuous-integration)

---

**Last Updated**: 2026-01-11  
**Status**: ✅ Ready for Production

