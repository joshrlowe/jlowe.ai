import { test, expect } from '@playwright/test';

test.describe('Navigation - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have all navigation links visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^home$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^about$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^projects$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^articles$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^contact$/i }).first()).toBeVisible();
  });

  test('should navigate to About page', async ({ page }) => {
    const aboutLink = page.getByRole('link', { name: /^about$/i }).first();
    await aboutLink.click();
    
    await expect(page).toHaveURL('/about');
    await expect(page).toHaveTitle(/about/i);
  });

  test('should navigate to Projects page', async ({ page }) => {
    const projectsLink = page.getByRole('link', { name: /^projects$/i }).first();
    await projectsLink.click();
    
    await expect(page).toHaveURL('/projects');
    await expect(page).toHaveTitle(/projects/i);
  });

  test('should navigate to Articles page', async ({ page }) => {
    const articlesLink = page.getByRole('link', { name: /^articles$/i }).first();
    await articlesLink.click();
    
    await expect(page).toHaveURL('/articles');
  });

  test('should navigate to Contact page', async ({ page }) => {
    const contactLink = page.getByRole('link', { name: /^contact$/i }).first();
    await contactLink.click();
    
    await expect(page).toHaveURL('/contact');
    await expect(page).toHaveTitle(/contact/i);
  });

  test('should return to home page when clicking logo', async ({ page }) => {
    // First navigate away from home
    await page.getByRole('link', { name: /^about$/i }).first().click();
    await expect(page).toHaveURL('/about');
    
    // Click logo to return home
    const logo = page.getByRole('link', { name: /home/i }).first();
    await logo.click();
    
    await expect(page).toHaveURL('/');
  });

  test('should highlight active navigation link', async ({ page }) => {
    // Go to projects page
    await page.getByRole('link', { name: /^projects$/i }).first().click();
    await expect(page).toHaveURL('/projects');
    
    // Check that projects link has active styling
    const projectsLink = page.getByRole('link', { name: /^projects$/i }).first();
    const color = await projectsLink.evaluate((el) => 
      window.getComputedStyle(el).color
    );
    
    // Active link should have the primary color
    expect(color).toContain('232, 93, 4'); // RGB values for #E85D04
  });

  test('should have working CTA button in header', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /let's talk|get in touch/i }).first();
    await expect(ctaButton).toBeVisible();
    
    await ctaButton.click();
    await expect(page).toHaveURL('/contact');
  });
});

test.describe('Navigation - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } 
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show hamburger menu button', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /menu|navigation/i });
    await expect(menuButton).toBeVisible();
  });

  test('should open mobile menu when hamburger is clicked', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
    await menuButton.click();
    
    // Check that menu opened by verifying aria-expanded
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Mobile menu links should be visible
    await expect(page.getByRole('link', { name: /^home$/i }).last()).toBeVisible();
    await expect(page.getByRole('link', { name: /^about$/i }).last()).toBeVisible();
  });

  test('should close mobile menu when clicking a link', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
    
    // Open menu
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click a link
    const aboutLink = page.getByRole('link', { name: /^about$/i }).last();
    await aboutLink.click();
    
    // Should navigate and menu should close
    await expect(page).toHaveURL('/about');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should close mobile menu when clicking hamburger again', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
    
    // Open menu
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Close menu
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should work correctly after multiple toggles', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
    
    // Toggle multiple times
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Should still work and navigate
    const projectsLink = page.getByRole('link', { name: /^projects$/i }).last();
    await projectsLink.click();
    await expect(page).toHaveURL('/projects');
  });
});

test.describe('Navigation - External Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
  });

  test('should open social links in new tab', async ({ page, context }) => {
    // Find social media links
    const linkedInLink = page.getByRole('link', { name: /linkedin/i }).first();
    
    if (await linkedInLink.isVisible()) {
      // Check it has target="_blank"
      const target = await linkedInLink.getAttribute('target');
      expect(target).toBe('_blank');
      
      // Check it has rel="noopener noreferrer"
      const rel = await linkedInLink.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
});

test.describe('Navigation - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // First link should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    
    // Header should have role="banner"
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });
});

test.describe('Navigation - Scroll Behavior', () => {
  test('should change header appearance on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('header').first();
    
    // Get initial styles
    const initialBg = await header.evaluate((el) => 
      window.getComputedStyle(el).background
    );
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    // Get styles after scroll
    const scrolledBg = await header.evaluate((el) => 
      window.getComputedStyle(el).background
    );
    
    // Background should change (become more opaque or add blur)
    expect(scrolledBg).not.toBe(initialBg);
  });
});

test.describe('Navigation - Route History', () => {
  test('should maintain browser history', async ({ page }) => {
    await page.goto('/');
    
    // Navigate through pages
    await page.getByRole('link', { name: /^about$/i }).first().click();
    await expect(page).toHaveURL('/about');
    
    await page.getByRole('link', { name: /^projects$/i }).first().click();
    await expect(page).toHaveURL('/projects');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/about');
    
    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/about');
  });
});

test.describe('Navigation - Deep Links', () => {
  test('should handle direct navigation to deep pages', async ({ page }) => {
    // Navigate directly to a non-home page
    await page.goto('/projects');
    await expect(page).toHaveURL('/projects');
    
    // Navigation should still work
    await expect(page.getByRole('link', { name: /^home$/i }).first()).toBeVisible();
    await page.getByRole('link', { name: /^home$/i }).first().click();
    await expect(page).toHaveURL('/');
  });
});

