import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Josh Lowe/i);
    await expect(page).toHaveURL('/');
  });

  test('should have correct meta description', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('should display hero section', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check for hero section using aria-label
    const heroSection = page.locator('section[aria-label="Hero section"]');
    await expect(heroSection).toBeVisible({ timeout: 10000 });
    
    // Check for key hero elements (typing animation or main heading)
    await expect(page.getByText(/intelligent AI systems|production ML pipelines|build|Josh|engineer/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('should display services section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Scroll to services section
    await page.evaluate(() => window.scrollTo(0, 800));
    
    // Wait for services to be visible
    const servicesHeading = page.getByRole('heading', { name: /services|AI.*Engineering/i }).first();
    await expect(servicesHeading).toBeVisible({ timeout: 10000 });
  });

  test('should display featured projects section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Scroll to projects section
    await page.evaluate(() => window.scrollTo(0, 1500));
    
    // Look for projects heading or project cards
    const projectsSection = page.locator('text=/featured projects|recent work/i').first();
    await expect(projectsSection).toBeVisible({ timeout: 10000 });
  });

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known warnings/errors that are acceptable in CI/test environment
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('MSW') && 
      !error.includes('Service Worker') &&
      !error.includes('Fetch API polyfill') &&
      // GitHub API calls may fail in CI (no external network or rate limits)
      !error.includes('Direct API fetch failed') &&
      !error.includes('GitHubContributionGraph') &&
      // NextAuth session errors in test environment
      !error.includes('[next-auth]') &&
      !error.includes('CLIENT_FETCH_ERROR') &&
      // API calls that may fail when database is empty
      !error.includes('400 (Bad Request)') &&
      !error.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have accessible navigation', async ({ page }) => {
    const navigation = page.locator('nav').first();
    await expect(navigation).toBeVisible();
    
    // Check for main nav links
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: Error[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display footer with social links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should handle scroll smoothly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    
    // Verify scroll position changed
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(500);
  });
});

test.describe('Home Page - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } 
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that hamburger menu button is visible
    const menuButton = page.getByRole('button', { name: /menu|navigation/i });
    await expect(menuButton).toBeVisible();
  });

  test('should display hero content on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for hero section using aria-label
    const heroContent = page.locator('section[aria-label="Hero section"]');
    await expect(heroContent).toBeVisible({ timeout: 10000 });
    
    // Verify some content is visible
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Home Page - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('load');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have images with proper alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Images should have alt attribute (can be empty for decorative images)
      expect(alt !== null).toBeTruthy();
    }
  });
});

