/**
 * Playwright Test Fixtures
 * 
 * Custom fixtures and utilities for E2E tests
 */

import { test as base } from '@playwright/test';

type TestFixtures = {
  /**
   * Navigate to a page and wait for it to be ready
   */
  navigateAndWait: (url: string) => Promise<void>;
  
  /**
   * Mock successful API response
   */
  mockApiSuccess: (endpoint: string, data: any) => Promise<void>;
  
  /**
   * Mock API error response
   */
  mockApiError: (endpoint: string, status?: number) => Promise<void>;
  
  /**
   * Wait for all network requests to complete
   */
  waitForNetwork: () => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  navigateAndWait: async ({ page }, use) => {
    const navigate = async (url: string) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Additional buffer for animations
    };
    await use(navigate);
  },

  mockApiSuccess: async ({ page }, use) => {
    const mockSuccess = async (endpoint: string, data: any) => {
      await page.route(`**${endpoint}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      });
    };
    await use(mockSuccess);
  },

  mockApiError: async ({ page }, use) => {
    const mockError = async (endpoint: string, status: number = 500) => {
      await page.route(`**${endpoint}`, async (route) => {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'API Error' }),
        });
      });
    };
    await use(mockError);
  },

  waitForNetwork: async ({ page }, use) => {
    const waitNetwork = async () => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    };
    await use(waitNetwork);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to check if element is in viewport
 */
export async function isInViewport(page: any, selector: string): Promise<boolean> {
  return await page.evaluate((sel: string) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Helper to scroll element into view
 */
export async function scrollIntoView(page: any, selector: string): Promise<void> {
  await page.evaluate((sel: string) => {
    const element = document.querySelector(sel);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, selector);
  await page.waitForTimeout(500);
}

/**
 * Helper to wait for animations to complete
 */
export async function waitForAnimations(page: any): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(
      document.getAnimations().map(animation => animation.finished)
    );
  });
}

/**
 * Mock contact data for testing
 */
export const mockContactData = {
  id: '1',
  name: 'Josh Lowe',
  emailAddress: 'test@jlowe.ai',
  phoneNumber: '+1 (555) 123-4567',
  socialMediaLinks: {
    linkedIn: 'https://linkedin.com/in/test',
    github: 'https://github.com/test',
    X: 'https://twitter.com/test',
  },
  address: 'San Francisco, CA',
  availability: {
    workingHours: 'Mon-Fri 9-5 PST',
  },
};

/**
 * Mock home content data for testing
 */
export const mockHomeContent = {
  typingIntro: 'I build...',
  heroTitle: 'intelligent AI systems',
  typingStrings: [
    'intelligent AI systems',
    'production ML pipelines',
    'custom LLM solutions',
  ],
  primaryCta: {
    text: 'Start a Project',
    href: '/contact',
  },
  secondaryCta: {
    text: 'View My Work',
    href: '/projects',
  },
  techBadges: [
    { name: 'Python', color: '#E85D04' },
    { name: 'TensorFlow', color: '#FAA307' },
    { name: 'React', color: '#4CC9F0' },
  ],
  servicesTitle: 'AI & Engineering Services',
  servicesSubtitle: 'Transform your business with AI',
  services: [
    {
      iconKey: 'computer',
      title: 'AI Strategy & Consulting',
      description: 'Transform your business with data-driven AI strategies',
      variant: 'primary',
    },
  ],
};

