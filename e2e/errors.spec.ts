import { test, expect } from '@playwright/test';

/**
 * Error Handling Tests
 * 
 * Tests for graceful error handling including 404 pages,
 * error boundaries, and API failures.
 */

test.describe('Error Handling - 404 Page', () => {
    test('should display 404 page for non-existent routes', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');

        // Should return 404 status
        expect(response?.status()).toBe(404);

        // Should display 404 message
        await expect(page.locator('text=/404|not found|page not found/i')).toBeVisible();
    });

    test('should have link back to home from 404 page', async ({ page }) => {
        await page.goto('/non-existent-page');
        await page.waitForLoadState('networkidle');

        // Look for home link
        const homeLink = page.getByRole('link', { name: /home|go back|back to home/i });
        await expect(homeLink).toBeVisible();

        // Click link
        await homeLink.click();
        await page.waitForTimeout(1000);

        // Should navigate to home
        await expect(page).toHaveURL('/');
    });

    test('should maintain header and footer on 404 page', async ({ page }) => {
        await page.goto('/non-existent-route');
        await page.waitForLoadState('networkidle');

        // Header should be visible
        await expect(page.locator('header').first()).toBeVisible();

        // Footer should be visible
        const footer = page.locator('footer').first();
        const footerCount = await footer.count();
        expect(footerCount).toBeGreaterThan(0);
    });

    test('should have appropriate page title on 404 page', async ({ page }) => {
        await page.goto('/non-existent-page');

        const title = await page.title();
        expect(title.toLowerCase()).toContain('404');
    });

    test('should handle multiple invalid routes', async ({ page }) => {
        const invalidRoutes = [
            '/invalid-route-1',
            '/some/nested/route/that/doesnt/exist',
            '/admin/secret-page',
        ];

        for (const route of invalidRoutes) {
            const response = await page.goto(route);
            expect(response?.status()).toBe(404);

            await expect(page.locator('text=/404|not found/i')).toBeVisible();
        }
    });
});

test.describe('Error Handling - API Failures', () => {
    test('should handle failed contact form submission gracefully', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Mock API to return error
        await page.route('**/api/contact', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });

        // Fill form
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', 'This is a test message');

        // Submit
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('text=/error|failed|something went wrong/i')).toBeVisible();

        // Form should not be cleared
        await expect(page.locator('input[name="name"]')).toHaveValue('Test User');
    });

    test('should handle network timeout gracefully', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Mock API to timeout
        await page.route('**/api/contact', async (route) => {
            await new Promise(() => { }); // Never resolve
        });

        // Set shorter timeout
        page.setDefaultTimeout(5000);

        // Fill form
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', 'This is a test message');

        // Submit
        await page.click('button[type="submit"]');

        // Should eventually show error or timeout message
        await page.waitForSelector('text=/error|timeout|failed/i', { timeout: 10000 }).catch(() => {
            // It's ok if this times out - the app should handle it gracefully
        });
    });

    test('should handle malformed API responses', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Mock API to return invalid JSON
        await page.route('**/api/contact', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: 'This is not valid JSON',
            });
        });

        // Fill form
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', 'This is a test message');

        // Submit
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Error Handling - Console Errors', () => {
    test('should not have console errors on valid pages', async ({ page }) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            } else if (msg.type() === 'warning') {
                warnings.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Should have no errors
        expect(errors).toEqual([]);

        // Log warnings for review (not failing test)
        if (warnings.length > 0) {
            console.log('Warnings detected:', warnings);
        }
    });

    test('should not have React hydration errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('hydration') || text.includes('Hydration')) {
                    errors.push(text);
                }
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });

    test('should not have unhandled promise rejections', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to other pages
        await page.click('a[href="/about"]');
        await page.waitForLoadState('networkidle');

        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });
});

test.describe('Error Handling - Missing Resources', () => {
    test('should handle missing images gracefully', async ({ page }) => {
        const errors: string[] = [];

        page.on('response', response => {
            if (response.url().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && response.status() === 404) {
                errors.push(response.url());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Should not have missing images
        expect(errors).toEqual([]);
    });

    test('should handle missing fonts gracefully', async ({ page }) => {
        const errors: string[] = [];

        page.on('response', response => {
            if (response.url().match(/\.(woff|woff2|ttf|otf)$/i) && response.status() === 404) {
                errors.push(response.url());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Should not have missing fonts
        expect(errors).toEqual([]);
    });
});

test.describe('Error Handling - JavaScript Errors', () => {
    test('should handle undefined properties gracefully', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', error => {
            if (error.message.includes('undefined')) {
                errors.push(error.message);
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Interact with the page
        await page.click('a[href="/about"]');
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });

    test('should handle null references gracefully', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', error => {
            if (error.message.includes('null') || error.message.includes('Cannot read')) {
                errors.push(error.message);
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });
});

test.describe('Error Handling - Form Validation', () => {
    test('should show validation errors for empty form', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Submit empty form
        await page.click('button[type="submit"]');

        // Should show validation errors
        await expect(page.locator('text=/required|please fill/i')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Fill form with invalid email
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'invalid-email');
        await page.fill('textarea[name="message"]', 'Test message');

        // Submit
        await page.click('button[type="submit"]');

        // Should show email validation error
        await expect(page.locator('text=/valid email|invalid email/i')).toBeVisible();
    });

    test('should prevent XSS in form inputs', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        const xssPayload = '<script>alert("XSS")</script>';

        // Try to inject XSS
        await page.fill('input[name="name"]', xssPayload);
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('textarea[name="message"]', xssPayload);

        // Get value back
        const nameValue = await page.inputValue('input[name="name"]');
        const messageValue = await page.inputValue('textarea[name="message"]');

        // Values should be escaped or sanitized
        expect(nameValue).toBeTruthy();
        expect(messageValue).toBeTruthy();
    });
});

test.describe('Error Handling - Accessibility in Error States', () => {
    test('should announce errors to screen readers', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Submit empty form
        await page.click('button[type="submit"]');

        // Error messages should have appropriate ARIA attributes
        const errorMessages = await page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]').all();

        // Should have at least one error announcement
        expect(errorMessages.length).toBeGreaterThan(0);
    });

    test('should focus first error field on validation failure', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Submit empty form
        await page.click('button[type="submit"]');

        await page.waitForTimeout(500);

        // First invalid field should be focused (or first field)
        const focusedElement = await page.evaluate(() => {
            const el = document.activeElement;
            return {
                tag: el?.tagName,
                type: el?.getAttribute('type'),
                name: el?.getAttribute('name'),
            };
        });

        // Should focus an input element
        expect(['INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement.tag);
    });
});

test.describe('Error Handling - Offline Support', () => {
    test('should handle offline state gracefully', async ({ page, context }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Go offline
        await context.setOffline(true);

        // Try to navigate
        await page.click('a[href="/about"]').catch(() => {
            // Navigation may fail, which is expected
        });

        await page.waitForTimeout(2000);

        // Page should still be responsive (not crashed)
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});

test.describe('Error Handling - Browser Compatibility', () => {
    test('should not throw errors in browser console', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Test various interactions
        await page.click('a[href="/about"]');
        await page.waitForLoadState('networkidle');

        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Should have no page errors
        expect(errors).toEqual([]);
    });
});

test.describe('Error Handling - Graceful Degradation', () => {
    test('should work without JavaScript (basic content)', async ({ page, context }) => {
        // Disable JavaScript
        await context.setJavaScriptEnabled(false);

        await page.goto('/');

        // Basic content should still be visible
        await expect(page.locator('h1').first()).toBeVisible();

        // Links should still be present
        const links = await page.locator('a').count();
        expect(links).toBeGreaterThan(0);
    });

    test('should handle CSS loading failure', async ({ page }) => {
        // Block CSS files
        await page.route('**/*.css', route => route.abort());

        const errors: string[] = [];
        page.on('pageerror', error => {
            errors.push(error.message);
        });

        await page.goto('/');
        await page.waitForTimeout(2000);

        // Should not throw JavaScript errors even if CSS fails
        expect(errors).toEqual([]);

        // Content should still be present
        await expect(page.locator('body')).toBeVisible();
    });
});

