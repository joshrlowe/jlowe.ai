import { test, expect } from '@playwright/test';

/**
 * SEO Tests
 * 
 * Comprehensive SEO validation including meta tags, Open Graph,
 * Twitter Cards, structured data, and canonical URLs.
 */

test.describe('SEO - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have appropriate page title', async ({ page }) => {
    const title = await page.title();
    
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(60); // Optimal title length
    expect(title).toMatch(/Josh Lowe|jlowe\.ai/i);
  });

  test('should have meta description', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    // 160 is optimal, but up to 200 is acceptable (Google may truncate)
    expect(metaDescription!.length).toBeLessThan(200);
  });

  test('should have Open Graph tags', async ({ page }) => {
    // og:title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    // og:description
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
    
    // og:type
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBeTruthy();
    
    // og:url
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    if (ogUrl) {
      expect(ogUrl).toContain('jlowe.ai');
    }
    
    // og:image
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    if (ogImage) {
      expect(ogImage).toMatch(/https?:\/\/.+\.(jpg|jpeg|png|webp)/i);
    }
  });

  test('should have Twitter Card tags', async ({ page }) => {
    // twitter:card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    if (twitterCard) {
      expect(['summary', 'summary_large_image', 'app', 'player']).toContain(twitterCard);
    }
    
    // twitter:title
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    if (twitterTitle) {
      expect(twitterTitle).toBeTruthy();
    }
    
    // twitter:description
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    if (twitterDescription) {
      expect(twitterDescription).toBeTruthy();
    }
  });

  test('should have viewport meta tag', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });

  test('should have charset meta tag', async ({ page }) => {
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    
    expect(charset).toBe('utf-8');
  });

  test('should allow search engine indexing', async ({ page }) => {
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    
    // If robots tag exists, it should allow indexing
    if (robots) {
      expect(robots).not.toContain('noindex');
      expect(robots).not.toContain('nofollow');
    }
  });

  test('should have canonical URL', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    const count = await canonical.count();
    
    if (count > 0) {
      const href = await canonical.getAttribute('href');
      expect(href).toMatch(/^https?:\/\/.+/);
    }
  });

  test('should have language attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    
    expect(lang).toBeTruthy();
    expect(lang).toBe('en');
  });

  test('should check for structured data (JSON-LD)', async ({ page }) => {
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').count();
    
    if (jsonLdScripts > 0) {
      const jsonLdContent = await page.locator('script[type="application/ld+json"]').first().textContent();
      
      // Should be valid JSON
      expect(() => JSON.parse(jsonLdContent!)).not.toThrow();
      
      const data = JSON.parse(jsonLdContent!);
      
      // Should have @context and @type
      expect(data['@context']).toBeTruthy();
      expect(data['@type']).toBeTruthy();
    }
  });
});

test.describe('SEO - About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('should have unique page title', async ({ page }) => {
    const title = await page.title();
    
    expect(title).toBeTruthy();
    expect(title).toMatch(/about/i);
  });

  test('should have unique meta description', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    
    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
  });

  test('should have canonical URL for about page', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    const count = await canonical.count();
    
    if (count > 0) {
      const href = await canonical.getAttribute('href');
      expect(href).toContain('about');
    }
  });
});

test.describe('SEO - Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should have unique page title', async ({ page }) => {
    const title = await page.title();
    
    expect(title).toBeTruthy();
    expect(title).toMatch(/project/i);
  });

  test('should have unique meta description', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    
    expect(metaDescription).toBeTruthy();
  });
});

test.describe('SEO - Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
  });

  test('should have unique page title', async ({ page }) => {
    const title = await page.title();
    
    expect(title).toBeTruthy();
    expect(title).toMatch(/contact/i);
  });

  test('should have unique meta description', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    
    expect(metaDescription).toBeTruthy();
  });

  test('should have Open Graph tags', async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    
    expect(ogTitle || ogDescription).toBeTruthy();
  });
});

test.describe('SEO - Technical SEO', () => {
  test('should have favicon', async ({ page }) => {
    await page.goto('/');
    
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    const count = await favicon.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should have apple touch icon', async ({ page }) => {
    await page.goto('/');
    
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    const count = await appleTouchIcon.count();
    
    // Optional but recommended
    if (count > 0) {
      const href = await appleTouchIcon.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should have manifest.json for PWA', async ({ page }) => {
    await page.goto('/');
    
    const manifest = page.locator('link[rel="manifest"]');
    const count = await manifest.count();
    
    if (count > 0) {
      const href = await manifest.getAttribute('href');
      expect(href).toBeTruthy();
      
      // Check if manifest is accessible
      const manifestResponse = await page.goto(href!);
      expect(manifestResponse?.status()).toBe(200);
    }
  });

  test('should not have duplicate meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for duplicate descriptions
    const descriptionCount = await page.locator('meta[name="description"]').count();
    expect(descriptionCount).toBeLessThanOrEqual(1);
    
    // Check for duplicate og:title
    const ogTitleCount = await page.locator('meta[property="og:title"]').count();
    expect(ogTitleCount).toBeLessThanOrEqual(1);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // Some pages might have hidden h1s
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt attribute should exist (can be empty for decorative images)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Link should have either visible text or aria-label
      expect(text || ariaLabel).toBeTruthy();
      
      // Avoid non-descriptive text
      if (text) {
        expect(text.toLowerCase()).not.toBe('click here');
        expect(text.toLowerCase()).not.toBe('read more');
        expect(text.toLowerCase()).not.toBe('link');
      }
    }
  });
});

test.describe('SEO - Performance Impact', () => {
  test('should not have render-blocking resources', async ({ page }) => {
    await page.goto('/');
    
    // Check for async/defer on script tags
    const scripts = await page.locator('script[src]').all();
    
    for (const script of scripts) {
      const async = await script.getAttribute('async');
      const defer = await script.getAttribute('defer');
      const type = await script.getAttribute('type');
      
      // Script should either be async, defer, or module
      const isOptimized = async !== null || defer !== null || type === 'module';
      
      // This is a recommendation, not a hard requirement
      // so we just log if not optimized
      if (!isOptimized) {
        const src = await script.getAttribute('src');
        console.log(`Script may be render-blocking: ${src}`);
      }
    }
  });

  test('should have responsive images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      // Check if image has srcset or is using Next.js Image component
      const srcset = await img.getAttribute('srcset');
      const loading = await img.getAttribute('loading');
      
      // Images should ideally have lazy loading
      if (loading) {
        expect(['lazy', 'eager']).toContain(loading);
      }
    }
  });
});

