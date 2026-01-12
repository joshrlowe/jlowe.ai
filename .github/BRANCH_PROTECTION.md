# Branch Protection Setup Guide

This guide explains how to configure branch protection rules for the jlowe.ai repository to ensure code quality and prevent broken code from reaching production.

## Prerequisites

- Repository admin access
- GitHub Actions workflow configured (`.github/workflows/test.yml`)
- At least one successful workflow run

## Branch Protection Rules

### For `main` Branch

1. **Navigate to Settings**
   - Go to your repository on GitHub
   - Click "Settings" tab
   - Click "Branches" in the left sidebar

2. **Add Branch Protection Rule**
   - Click "Add rule" or "Add branch protection rule"
   - Branch name pattern: `main`

3. **Configure Protection Settings**

   #### ✅ **Require a pull request before merging**
   - [x] Require a pull request before merging
   - [x] Require approvals: `1` (or more for larger teams)
   - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require review from Code Owners (optional)

   #### ✅ **Require status checks to pass before merging**
   - [x] Require status checks to pass before merging
   - [x] Require branches to be up to date before merging
   
   **Required status checks** (add all of these):
   - `lint` (Lint & Code Quality)
   - `unit-tests` (Unit & Integration Tests)
   - `e2e-tests` (E2E Tests - Playwright)
   - `visual-regression` (Visual Regression Tests)
   - `accessibility` (Accessibility Tests)
   - `performance` (Performance Tests)
   - `test-summary` (Test Summary)

   #### ✅ **Require conversation resolution before merging**
   - [x] Require conversation resolution before merging

   #### ✅ **Require signed commits** (optional but recommended)
   - [x] Require signed commits

   #### ✅ **Require linear history** (optional)
   - [x] Require linear history
   - This prevents merge commits, requires rebase or squash

   #### ✅ **Include administrators**
   - [x] Include administrators
   - This applies rules to repository admins too

   #### ✅ **Restrict who can push to matching branches**
   - [x] Restrict who can push to matching branches
   - Add teams/users who can bypass pull requests (use sparingly)

   #### ✅ **Allow force pushes**
   - [ ] Allow force pushes (keep unchecked)

   #### ✅ **Allow deletions**
   - [ ] Allow deletions (keep unchecked)

4. **Save Changes**
   - Click "Create" or "Save changes"

### For `develop` Branch (if using)

Repeat the above steps with:
- Branch name pattern: `develop`
- Same settings as `main`
- Can optionally reduce required approvals to `1`

### For Feature Branches

Consider adding a pattern for feature branches:
- Branch name pattern: `feature/*`
- [x] Require status checks to pass before merging
- Required checks: `lint`, `unit-tests`
- Don't require pull requests (developers can push directly)

## Verification

### Step 1: Create a Test PR

```bash
# Create a new branch
git checkout -b test-branch-protection

# Make a small change
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: verify branch protection"

# Push branch
git push origin test-branch-protection
```

### Step 2: Open Pull Request

1. Go to GitHub and create a pull request from `test-branch-protection` to `main`
2. You should see:
   - "Merging is blocked" message
   - List of required status checks
   - Status checks running automatically

### Step 3: Verify Status Checks

Wait for all status checks to complete. You should see:

- ✅ Lint & Code Quality
- ✅ Unit & Integration Tests  
- ✅ E2E Tests (Playwright)
- ✅ Visual Regression Tests
- ✅ Accessibility Tests
- ✅ Performance Tests
- ✅ Test Summary

### Step 4: Verify Merge Restriction

- Try to merge without approval → Should be blocked
- Try to merge with failing tests → Should be blocked
- Try to merge with passing tests + approval → Should succeed

### Step 5: Clean Up

```bash
git checkout main
git branch -D test-branch-protection
git push origin --delete test-branch-protection
```

## Status Check Configuration

The workflow defines these jobs that must pass:

```yaml
jobs:
  lint:                    # Code quality checks
  unit-tests:             # Unit and integration tests
  e2e-tests:              # End-to-end tests (sharded across browsers)
  visual-regression:      # Visual regression tests
  accessibility:          # Accessibility compliance
  performance:            # Performance benchmarks
  test-summary:           # Overall summary (depends on all above)
```

## Troubleshooting

### Status Checks Not Appearing

1. **Ensure workflow has run at least once**:
   - Go to Actions tab
   - Manually trigger workflow if needed
   - Wait for completion

2. **Check workflow name matches**:
   - Workflow name in `.github/workflows/test.yml` should be "Test Suite"
   - Job names should match exactly

3. **Refresh branch protection page**:
   - Status checks appear after first successful run
   - May need to refresh page to see them

### Status Checks Always Pending

1. **Check workflow triggers**:
   ```yaml
   on:
     pull_request:
       branches: [main]
   ```

2. **Verify workflow permissions**:
   - Settings → Actions → General
   - "Allow all actions and reusable workflows"
   - "Read and write permissions"

### Can't Merge Even with Passing Tests

1. **Check "Require branches to be up to date"**:
   - If enabled, branch must be rebased/merged with latest main
   
   ```bash
   git checkout your-branch
   git pull origin main
   git push
   ```

2. **Check for required approvals**:
   - PR needs specified number of approvals

3. **Check for unresolved conversations**:
   - All PR comments must be resolved

### Accidentally Blocked Yourself

If you need to bypass temporarily:

1. **Temporarily disable protection**:
   - Settings → Branches → Edit rule
   - Uncheck "Include administrators"
   - Make your changes
   - Re-enable protection

2. **Or request emergency access**:
   - Add yourself to bypass list temporarily
   - Make changes
   - Remove yourself from bypass list

## Best Practices

### 1. Required Status Checks

**Minimum required**:
- ✅ Lint
- ✅ Unit Tests
- ✅ E2E Tests

**Recommended**:
- ✅ Accessibility
- ✅ Visual Regression
- ✅ Performance

### 2. Required Approvals

- **Small teams**: 1 approval
- **Medium teams**: 2 approvals
- **Large teams**: 2+ approvals from different teams

### 3. Codeowners

Create `.github/CODEOWNERS`:

```
# Global owners
* @jlowe @team-leads

# Component owners
/components/ @frontend-team
/lib/ @backend-team
/e2e/ @qa-team

# Require security team for auth changes
/lib/auth.js @security-team
/pages/api/ @security-team
```

### 4. Auto-merge for Dependabot

Enable auto-merge for Dependabot PRs after checks pass:

```yaml
# .github/workflows/auto-merge-dependabot.yml
name: Auto-merge Dependabot PRs

on:
  pull_request:
    branches: [main]

jobs:
  auto-merge:
    if: github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - uses: ahmadnassri/action-dependabot-auto-merge@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 5. Bypass for Hotfixes

For production hotfixes:

1. Create `hotfix/*` branch
2. Add branch protection with minimal checks:
   - Required: `lint`, `unit-tests`
   - No approval required
   - Can merge quickly

## Security Considerations

### 1. Prevent Force Push

Never allow force pushes to protected branches:
- [x] Include administrators
- [ ] Allow force pushes (keep disabled)

### 2. Require Signed Commits

Ensure commits are from verified sources:
- [x] Require signed commits
- Configure GPG keys for all contributors

### 3. Restrict Deployments

Configure deployment protection:
- Settings → Environments → production
- Required reviewers for production deployments
- Wait timer before deployment

### 4. Secret Scanning

Enable:
- Settings → Code security and analysis
- [x] Secret scanning
- [x] Push protection

## Rollback Procedure

If you need to roll back branch protection:

1. **Document current settings** (take screenshots)
2. **Disable specific rules** (not entire protection)
3. **Make necessary changes**
4. **Re-enable rules immediately**
5. **Verify protection is active**

## Monitoring

### Check Protection Status

```bash
# Using GitHub CLI
gh api repos/:owner/:repo/branches/main/protection

# Or visit directly
# https://github.com/OWNER/REPO/settings/branch_protection_rules
```

### Audit Log

Check who modified branch protection:
- Settings → Audit log
- Filter by "protected_branch"

## Emergency Procedures

### Bypass Branch Protection (Emergency Only)

1. **Create a GitHub issue** documenting why bypass is needed
2. **Get approval** from tech lead/manager
3. **Temporarily disable** specific protection rule
4. **Make changes** and merge
5. **Immediately re-enable** protection
6. **Document in issue** what was changed and why

### Complete Bypass (Critical Emergency)

Only for critical production incidents:

```bash
# Force push to main (if allowed)
git push --force origin main

# Or merge without PR
git checkout main
git merge hotfix-branch --no-ff
git push origin main
```

**⚠️ Warning**: This should be extremely rare and documented.

## Checklist for Branch Protection Setup

- [ ] Branch protection rule created for `main`
- [ ] "Require pull request" enabled
- [ ] Required approvals set (1+)
- [ ] "Require status checks" enabled
- [ ] All test jobs added as required checks
- [ ] "Require branches to be up to date" enabled
- [ ] "Require conversation resolution" enabled
- [ ] "Include administrators" enabled
- [ ] Force pushes disabled
- [ ] Deletions disabled
- [ ] Protection verified with test PR
- [ ] Team notified of new rules
- [ ] Documentation updated

## Quick Reference

### Adding New Required Check

1. Add job to `.github/workflows/test.yml`
2. Wait for workflow to run successfully once
3. Go to Settings → Branches → Edit rule
4. Add new job name to required checks
5. Save changes

### Removing Required Check

1. Go to Settings → Branches → Edit rule
2. Remove check from required list
3. Save changes
4. (Optional) Remove job from workflow file

### Temporarily Bypass (Emergency)

1. Document reason in issue/ticket
2. Uncheck "Include administrators" OR add yourself to bypass list
3. Make changes
4. Re-enable protection immediately

---

**Last Updated**: 2026-01-11  
**Status**: ✅ Ready for Implementation

