import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * These tests capture screenshots of key pages and sections
 * to detect unintended visual changes across different viewports.
 * 
 * To generate baseline screenshots:
 * npx playwright test visual.spec.ts --update-snapshots
 */

const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
};

test.describe('Visual Regression - Home Page', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match screenshot on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            // Wait for animations to complete
            await page.waitForTimeout(1000);

            // Hide dynamic elements that change between runs
            await page.addStyleTag({
                content: `
          .animate-pulse, 
          [class*="animate-"],
          video,
          canvas {
            animation: none !important;
            transition: none !important;
          }
        `
            });

            await expect(page).toHaveScreenshot(`home-${device}.png`, {
                fullPage: true,
                maxDiffPixels: 100,
                threshold: 0.2,
            });
        });
    });
});

test.describe('Visual Regression - Hero Section', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match hero section on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Locate hero section
            const heroSection = page.locator('[class*="hero"]').first();

            if (await heroSection.isVisible()) {
                await expect(heroSection).toHaveScreenshot(`hero-section-${device}.png`, {
                    maxDiffPixels: 50,
                    threshold: 0.2,
                });
            }
        });
    });
});

test.describe('Visual Regression - Navigation', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match navigation on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            const header = page.locator('header').first();
            await expect(header).toHaveScreenshot(`navigation-${device}.png`, {
                maxDiffPixels: 30,
                threshold: 0.15,
            });
        });
    });
});

test.describe('Visual Regression - Mobile Menu', () => {
    test('should match mobile menu open state', async ({ page }) => {
        await page.setViewportSize(viewports.mobile);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open mobile menu
        const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
        await menuButton.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('mobile-menu-open.png', {
            maxDiffPixels: 50,
            threshold: 0.2,
        });
    });
});

test.describe('Visual Regression - About Page', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match about page on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/about');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await expect(page).toHaveScreenshot(`about-${device}.png`, {
                fullPage: true,
                maxDiffPixels: 150,
                threshold: 0.25,
            });
        });
    });
});

test.describe('Visual Regression - Projects Page', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match projects page on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/projects');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await expect(page).toHaveScreenshot(`projects-${device}.png`, {
                fullPage: true,
                maxDiffPixels: 150,
                threshold: 0.25,
            });
        });
    });
});

test.describe('Visual Regression - Contact Page', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match contact page on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/contact');

            // Wait for data to load
            await page.waitForSelector('text=/Loading contact info/i', {
                state: 'hidden',
                timeout: 10000
            }).catch(() => { });

            await page.waitForTimeout(1000);

            await expect(page).toHaveScreenshot(`contact-${device}.png`, {
                fullPage: true,
                maxDiffPixels: 100,
                threshold: 0.2,
            });
        });
    });
});

test.describe('Visual Regression - Footer', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
        test(`should match footer on ${device}`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            // Scroll to footer
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(500);

            const footer = page.locator('footer').first();
            if (await footer.isVisible()) {
                await expect(footer).toHaveScreenshot(`footer-${device}.png`, {
                    maxDiffPixels: 50,
                    threshold: 0.2,
                });
            }
        });
    });
});

test.describe('Visual Regression - Scroll States', () => {
    test('should match header scrolled state on desktop', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Scroll down
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(500);

        const header = page.locator('header').first();
        await expect(header).toHaveScreenshot('header-scrolled.png', {
            maxDiffPixels: 30,
            threshold: 0.15,
        });
    });
});

test.describe('Visual Regression - Loading States', () => {
    test('should match loading skeleton on contact page', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);

        // Intercept API to delay response
        await page.route('**/api/contact', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await route.continue();
        });

        const response = page.goto('/contact');

        // Capture loading state
        await page.waitForSelector('text=/Loading contact info/i', { timeout: 2000 });

        await expect(page).toHaveScreenshot('contact-loading.png', {
            maxDiffPixels: 50,
            threshold: 0.2,
        });

        await response;
    });
});

test.describe('Visual Regression - Dark Mode Compatibility', () => {
    test('should render consistently in dark mode', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.setViewportSize(viewports.desktop);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('home-dark-mode.png', {
            fullPage: true,
            maxDiffPixels: 150,
            threshold: 0.25,
        });
    });
});

test.describe('Visual Regression - Interactive States', () => {
    test('should match button hover states', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find CTA button
        const ctaButton = page.getByRole('link', { name: /let's talk/i }).first();

        if (await ctaButton.isVisible()) {
            // Hover over button
            await ctaButton.hover();
            await page.waitForTimeout(300);

            await expect(ctaButton).toHaveScreenshot('cta-button-hover.png', {
                maxDiffPixels: 20,
                threshold: 0.15,
            });
        }
    });

    test('should match focused navigation link', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Focus first navigation link
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        const header = page.locator('header').first();
        await expect(header).toHaveScreenshot('navigation-focused.png', {
            maxDiffPixels: 30,
            threshold: 0.15,
        });
    });
});

test.describe('Visual Regression - Error States', () => {
    test('should match 404 page', async ({ page }) => {
        await page.setViewportSize(viewports.desktop);
        await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('404-page.png', {
            fullPage: true,
            maxDiffPixels: 100,
            threshold: 0.2,
        });
    });
});

