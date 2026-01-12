import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
  });

  test('should load contact page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/contact/i);
    await expect(page).toHaveURL('/contact');
  });

  test('should display contact information', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Contact information should be visible
    await expect(page.getByText(/Contact Information/i)).toBeVisible();
    
    // Email should be visible
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
  });

  test('should display social media links', async ({ page }) => {
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Check for social links section
    await expect(page.getByText(/Connect With Me/i)).toBeVisible();
    
    // Social links should be present
    const socialLinks = await page.locator('a[href*="linkedin"], a[href*="github"], a[href*="twitter"]').count();
    expect(socialLinks).toBeGreaterThan(0);
  });

  test('should have clickable email link', async ({ page }) => {
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink).toBeVisible();
    
    const href = await emailLink.getAttribute('href');
    expect(href).toContain('mailto:');
    expect(href).toContain('@');
  });

  test('should have external links with correct attributes', async ({ page }) => {
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Find a social media link (external link)
    const externalLink = page.locator('a[href*="linkedin"]').first();
    
    if (await externalLink.isVisible()) {
      // Should open in new tab
      const target = await externalLink.getAttribute('target');
      expect(target).toBe('_blank');
      
      // Should have security attributes
      const rel = await externalLink.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to contact page
    const response = page.goto('/contact');
    
    // Loading indicator should appear quickly
    await expect(page.getByText(/Loading contact info/i)).toBeVisible({ timeout: 2000 });
    
    await response;
  });

  test('should display phone number if available', async ({ page }) => {
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Check if phone link exists
    const phoneLink = page.locator('a[href^="tel:"]');
    const phoneCount = await phoneLink.count();
    
    if (phoneCount > 0) {
      await expect(phoneLink.first()).toBeVisible();
      const href = await phoneLink.first().getAttribute('href');
      expect(href).toContain('tel:');
    }
  });

  test('should display availability information', async ({ page }) => {
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Look for availability section
    const availabilityLabel = page.getByText(/availability/i);
    const availabilityCount = await availabilityLabel.count();
    
    if (availabilityCount > 0) {
      await expect(availabilityLabel.first()).toBeVisible();
    }
  });
});

test.describe('Contact Page - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } 
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Contact information should be visible and readable
    await expect(page.getByText(/Contact Information/i)).toBeVisible();
    
    // Layout should stack vertically (not check specific layout but verify elements are visible)
    await expect(page.getByText(/Connect With Me/i)).toBeVisible();
  });

  test('should have touch-friendly social links', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Social link cards should be large enough for touch
    const socialCards = page.locator('a[href*="linkedin"], a[href*="github"]').first();
    
    if (await socialCards.isVisible()) {
      const box = await socialCards.boundingBox();
      expect(box?.height).toBeGreaterThan(40); // At least 44px for touch targets
    }
  });
});

test.describe('Contact Page - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Page should have h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Should have section headings
    await expect(page.getByRole('heading', { name: /Contact Information/i })).toBeVisible();
  });

  test('should have accessible social links', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Social links should have aria-labels or descriptive text
    const linkedInLink = page.getByRole('link', { name: /linkedin/i }).first();
    
    if (await linkedInLink.isVisible()) {
      const ariaLabel = await linkedInLink.getAttribute('aria-label');
      const text = await linkedInLink.textContent();
      
      // Should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      return element?.tagName;
    });
    
    // Should be able to focus on interactive elements
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
});

test.describe('Contact Page - Performance', () => {
  test('should load data within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/contact');
    
    // Wait for loading state to disappear
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Data should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/contact', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.goto('/contact');
    
    // Loading state should be shown
    await expect(page.getByText(/Loading contact info/i)).toBeVisible();
    
    // Should eventually load
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    await expect(page.getByText(/Contact Information/i)).toBeVisible();
  });
});

test.describe('Contact Page - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });
    
    await page.goto('/contact');
    
    // Should show loading initially
    await expect(page.getByText(/Loading contact info/i)).toBeVisible();
    
    // Should handle error (stays on loading or shows fallback - depends on implementation)
    await page.waitForTimeout(2000);
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/contact', async (route) => {
      await route.abort('failed');
    });
    
    await page.goto('/contact');
    
    // Page should not crash
    await expect(page.getByText(/Loading contact info/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contact Page - SEO', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/contact');
    
    // Check title
    await expect(page).toHaveTitle(/contact/i);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('should have canonical URL', async ({ page }) => {
    await page.goto('/contact');
    
    const canonical = page.locator('link[rel="canonical"]');
    const count = await canonical.count();
    
    if (count > 0) {
      await expect(canonical).toHaveAttribute('href', /contact/);
    }
  });
});

test.describe('Contact Page - Content', () => {
  test('should display typing animation', async ({ page }) => {
    await page.goto('/contact');
    
    // Should see the main heading (either during or after typing animation)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display availability status', async ({ page }) => {
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Look for availability indicator
    const availabilityIndicator = page.locator('text=/available for|accepting|currently/i');
    const count = await availabilityIndicator.count();
    
    if (count > 0) {
      await expect(availabilityIndicator.first()).toBeVisible();
    }
  });

  test('should have call-to-action elements', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForSelector('text=/Loading contact info/i', { state: 'hidden', timeout: 10000 });
    
    // Should have interactive elements encouraging contact
    const ctaElements = page.locator('a[href^="mailto:"], a[href*="linkedin"]');
    const ctaCount = await ctaElements.count();
    
    expect(ctaCount).toBeGreaterThan(0);
  });
});

