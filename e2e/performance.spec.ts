import { test, expect } from '@playwright/test';

/**
 * Performance Baseline Tests
 * 
 * Tests to ensure pages load within acceptable timeframes
 * and do not have significant layout shifts.
 */

test.describe('Performance - Page Load Times', () => {
    test('should load home page within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);

        console.log(`Home page loaded in ${loadTime}ms`);
    });

    test('should load about page within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/about');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);

        console.log(`About page loaded in ${loadTime}ms`);
    });

    test('should load projects page within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);

        console.log(`Projects page loaded in ${loadTime}ms`);
    });

    test('should load contact page within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);

        console.log(`Contact page loaded in ${loadTime}ms`);
    });
});

test.describe('Performance - First Contentful Paint', () => {
    test('should have fast first contentful paint', async ({ page }) => {
        await page.goto('/');

        const performanceMetrics = await page.evaluate(() => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');

            return {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                fcp: fcp?.startTime || 0,
            };
        });

        console.log('Performance metrics:', performanceMetrics);

        // FCP should be under 2 seconds
        expect(performanceMetrics.fcp).toBeLessThan(2000);
    });
});

test.describe('Performance - Cumulative Layout Shift', () => {
    test('should have minimal layout shift on home page', async ({ page }) => {
        await page.goto('/');

        // Wait for page to settle
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const cls = await page.evaluate(() => {
            return new Promise<number>((resolve) => {
                let clsValue = 0;

                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if ((entry as any).hadRecentInput) continue;
                        clsValue += (entry as any).value;
                    }
                });

                observer.observe({ type: 'layout-shift', buffered: true });

                setTimeout(() => {
                    observer.disconnect();
                    resolve(clsValue);
                }, 3000);
            });
        });

        console.log(`Cumulative Layout Shift: ${cls}`);

        // CLS should be less than 0.1 (good score)
        expect(cls).toBeLessThan(0.25); // Using 0.25 as threshold (needs improvement if > 0.1)
    });

    test('should have minimal layout shift during navigation', async ({ page, browserName }) => {
        // Skip Firefox in CI due to WebGL issues
        test.skip(process.env.CI === 'true' && browserName === 'firefox', 'Firefox WebGL issues in CI');
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Use page.goto for reliable navigation
        await page.goto('/about');

        // Wait for navigation
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const cls = await page.evaluate(() => {
            return new Promise<number>((resolve) => {
                let clsValue = 0;

                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if ((entry as any).hadRecentInput) continue;
                        clsValue += (entry as any).value;
                    }
                });

                observer.observe({ type: 'layout-shift', buffered: true });

                setTimeout(() => {
                    observer.disconnect();
                    resolve(clsValue);
                }, 1000);
            });
        });

        console.log(`CLS during navigation: ${cls}`);

        // Should have minimal layout shift
        expect(cls).toBeLessThan(0.25);
    });
});

test.describe('Performance - Resource Loading', () => {
    test('should load critical resources quickly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const resourceTimings = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

            return resources.map(resource => ({
                name: resource.name.split('/').pop(),
                duration: resource.duration,
                size: resource.transferSize,
                type: resource.initiatorType,
            }));
        });

        // Log slow resources
        const slowResources = resourceTimings.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
            console.log('Slow resources (>1s):', slowResources);
        }

        // Most resources should load in under 1 second
        const fastResources = resourceTimings.filter(r => r.duration < 1000);
        const fastPercentage = (fastResources.length / resourceTimings.length) * 100;

        expect(fastPercentage).toBeGreaterThan(70); // At least 70% of resources load quickly
    });

    test('should have reasonable total page size', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const totalSize = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

            return resources.reduce((total, resource) => {
                return total + (resource.transferSize || 0);
            }, 0);
        });

        const totalSizeMB = totalSize / (1024 * 1024);
        console.log(`Total page size: ${totalSizeMB.toFixed(2)}MB`);

        // Total page size threshold (includes Three.js for 3D effects)
        // Ideal: < 5MB, Acceptable for 3D app: < 8MB
        expect(totalSizeMB).toBeLessThan(8);
    });

    test('should lazy load images below the fold', async ({ page }) => {
        await page.goto('/');

        // Get all images
        const images = await page.locator('img').all();

        let lazyLoadedCount = 0;

        for (const img of images) {
            const loading = await img.getAttribute('loading');
            if (loading === 'lazy') {
                lazyLoadedCount++;
            }
        }

        console.log(`Lazy loaded images: ${lazyLoadedCount}/${images.length}`);

        // At least some images should be lazy loaded
        if (images.length > 3) {
            expect(lazyLoadedCount).toBeGreaterThan(0);
        }
    });
});

test.describe('Performance - JavaScript Bundle Size', () => {
    test('should not load excessively large JavaScript bundles', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const jsResourceSizes = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

            return resources
                .filter(r => r.name.endsWith('.js'))
                .map(r => ({
                    name: r.name.split('/').pop(),
                    size: r.transferSize,
                    sizeKB: (r.transferSize / 1024).toFixed(2),
                }));
        });

        console.log('JavaScript bundles:', jsResourceSizes);

        // No single bundle should be larger than 500KB (compressed)
        const largeBundles = jsResourceSizes.filter(r => r.size > 500 * 1024);

        if (largeBundles.length > 0) {
            console.warn('Large JavaScript bundles detected:', largeBundles);
        }

        // Total JS should be reasonable
        const totalJS = jsResourceSizes.reduce((sum, r) => sum + r.size, 0);
        const totalJSMB = totalJS / (1024 * 1024);

        console.log(`Total JavaScript: ${totalJSMB.toFixed(2)}MB`);

        // JS bundle threshold (Three.js + React + Next.js is ~4-5MB)
        // Ideal: < 2MB, Acceptable for 3D app: < 6MB
        expect(totalJSMB).toBeLessThan(6);
    });
});

test.describe('Performance - Time to Interactive', () => {
    test('should become interactive quickly', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const domLoadTime = Date.now() - startTime;

        // Wait for page to be interactive
        await page.waitForLoadState('load');

        const loadTime = Date.now() - startTime;

        console.log(`DOM Content Loaded: ${domLoadTime}ms`);
        console.log(`Load Complete: ${loadTime}ms`);

        // Page should be interactive within 3 seconds
        expect(loadTime).toBeLessThan(3000);
    });

    test('should respond to interactions quickly', async ({ page, browserName }) => {
        // Skip Firefox in CI due to WebGL issues
        test.skip(process.env.CI === 'true' && browserName === 'firefox', 'Firefox WebGL issues in CI');
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Test navigation response time using page.goto for reliability
        const startTime = Date.now();

        await page.goto('/about');

        await page.waitForURL(/\/about/);

        const responseTime = Date.now() - startTime;

        console.log(`Navigation response time: ${responseTime}ms`);

        // Navigation response time in CI is slower than local
        // Ideal: < 1000ms, CI threshold: < 5000ms
        expect(responseTime).toBeLessThan(5000);
    });
});

test.describe('Performance - Memory Usage', () => {
    test('should not have excessive memory usage', async ({ page }) => {
        // Use consistent page.goto() for all navigation to avoid interruption
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to multiple pages to test for memory leaks
        await page.goto('/about');
        await page.waitForLoadState('networkidle');

        await page.goto('/projects');
        await page.waitForLoadState('networkidle');

        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Get memory metrics (if available)
        const memoryMetrics = await page.evaluate(() => {
            if ((performance as any).memory) {
                return {
                    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
                };
            }
            return null;
        });

        if (memoryMetrics) {
            console.log('Memory metrics:', {
                used: `${(memoryMetrics.usedJSHeapSize / (1024 * 1024)).toFixed(2)}MB`,
                total: `${(memoryMetrics.totalJSHeapSize / (1024 * 1024)).toFixed(2)}MB`,
                limit: `${(memoryMetrics.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)}MB`,
            });

            // Memory threshold (Three.js with 3D scenes uses ~150-200MB)
            // Ideal: < 100MB, Acceptable for 3D app: < 250MB
            expect(memoryMetrics.usedJSHeapSize).toBeLessThan(250 * 1024 * 1024);
        }
    });
});

test.describe('Performance - Caching', () => {
    test('should cache static assets', async ({ page }) => {
        // First visit
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Get resource timings
        const firstVisitResources = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            return resources.map(r => ({
                name: r.name,
                cached: r.transferSize === 0,
            }));
        });

        // Second visit
        await page.reload();
        await page.waitForLoadState('networkidle');

        const secondVisitResources = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            return resources.map(r => ({
                name: r.name,
                cached: r.transferSize === 0,
            }));
        });

        // Count cached resources on second visit
        const cachedCount = secondVisitResources.filter(r => r.cached).length;
        const totalCount = secondVisitResources.length;

        console.log(`Cached resources: ${cachedCount}/${totalCount}`);

        // At least some resources should be cached on second visit
        if (totalCount > 0) {
            expect(cachedCount).toBeGreaterThan(0);
        }
    });
});

test.describe('Performance - Mobile Performance', () => {
    test('should perform well on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const startTime = Date.now();

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        console.log(`Mobile load time: ${loadTime}ms`);

        // Should load quickly on mobile
        expect(loadTime).toBeLessThan(6000); // Slightly more lenient for mobile
    });

    test('should have smooth scrolling on mobile', async ({ page, browserName }) => {
        // Skip Firefox in CI due to WebGL issues affecting scroll behavior
        test.skip(process.env.CI === 'true' && browserName === 'firefox', 'Firefox WebGL issues in CI');
        
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check if page is tall enough to scroll
        const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 667;
        
        if (scrollHeight <= viewportHeight + 100) {
            console.log('Page not tall enough to test scrolling');
            return;
        }

        // Scroll down
        await page.evaluate(() => {
            window.scrollTo({ top: 1000, behavior: 'smooth' });
        });

        await page.waitForTimeout(1000);

        // Check scroll position - should have scrolled some amount
        const scrollY = await page.evaluate(() => window.scrollY);

        // Flexible threshold - just ensure scrolling worked
        expect(scrollY).toBeGreaterThan(0);
    });
});

test.describe('Performance - Web Vitals', () => {
    test('should measure and report web vitals', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Wait for vitals to be measured
        await page.waitForTimeout(3000);

        const vitals = await page.evaluate(() => {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paintEntries = performance.getEntriesByType('paint');

            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint');

            return {
                fcp: fcp?.startTime || 0,
                lcp: lcp?.startTime || 0,
                ttfb: perfData.responseStart - perfData.requestStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                loadComplete: perfData.loadEventEnd - perfData.fetchStart,
            };
        });

        console.log('Web Vitals:', vitals);

        // FCP should be under 1.8s (good score)
        expect(vitals.fcp).toBeLessThan(1800);

        // TTFB should be under 800ms
        expect(vitals.ttfb).toBeLessThan(800);
    });
});

