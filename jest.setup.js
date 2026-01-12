/**
 * Jest Setup File
 * 
 * This file runs before each test file.
 * It configures:
 * - Testing Library matchers (jest-dom)
 * - Accessibility testing matchers (jest-axe)
 * - MSW (Mock Service Worker) server (if available)
 * - Browser API mocks (IntersectionObserver, ResizeObserver, etc.)
 * - Next.js component mocks
 * 
 * Note: Polyfills are loaded from jest.polyfills.js via setupFiles
 */

import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// ============================================================================
// EXTEND JEST MATCHERS
// ============================================================================

// Add jest-axe accessibility matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MSW (MOCK SERVICE WORKER) SETUP - Optional
// ============================================================================

/**
 * MSW Setup - Conditional based on environment
 * 
 * MSW 2.x requires Node.js 18+ for full Fetch API support.
 * If MSW fails to load, tests can still run using manual mocks.
 * 
 * To use MSW in tests:
 * 1. Ensure you're running Node.js 18+
 * 2. Uncomment the lines below
 * 3. Import { server } from '@/__mocks__/server' in tests
 */

let server = null;

try {
  // Attempt to load MSW server
  const mswServer = require('./__mocks__/server');
  server = mswServer.server;
  
  // Only set up MSW hooks if server was successfully initialized
  if (server) {
    // Start MSW server before all tests
    beforeAll(() => {
      server.listen({
        // 'warn' logs unhandled requests but doesn't fail tests
        onUnhandledRequest: 'warn',
      });
    });

    // Reset handlers after each test
    afterEach(() => {
      server.resetHandlers();
    });

    // Clean up after all tests
    afterAll(() => {
      server.close();
    });
  } else {
    console.warn('MSW server is null - tests will use manual mocks');
  }
} catch (error) {
  // MSW not available - tests will use manual mocks or fetch mocking
  console.warn('MSW setup skipped:', error.message);
}

// Export server for use in tests (may be null if MSW failed)
global.__MSW_SERVER__ = server;

// ============================================================================
// NEXT.JS MOCKS
// ============================================================================

// Mock Next.js router (Pages Router)
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    basePath: '',
    push: jest.fn().mockResolvedValue(true),
    replace: jest.fn().mockResolvedValue(true),
    reload: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  })),
  Router: {
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  },
}));

// Mock next/navigation (App Router)
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt, width, height, fill, priority, style, ...props }) {
    const imageStyle = fill
      ? { objectFit: 'cover', position: 'absolute', width: '100%', height: '100%', ...style }
      : style;
    return (
      <img
        src={typeof src === 'object' ? src.src : src}
        alt={alt || ''}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        style={imageStyle}
        loading={priority ? 'eager' : 'lazy'}
        data-testid="next-image"
        {...props}
      />
    );
  },
}));

// Mock next/link - simple passthrough
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/head
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

// ============================================================================
// THREE.JS / REACT-THREE-FIBER MOCKS
// ============================================================================

// Mock Three.js - prevents WebGL context errors
jest.mock('three', () => require('./__mocks__/three'));

// Mock @react-three/fiber
jest.mock('@react-three/fiber', () => require('./__mocks__/@react-three/fiber'));

// Mock @react-three/drei
jest.mock('@react-three/drei', () => require('./__mocks__/@react-three/drei'));

// ============================================================================
// ANIMATION LIBRARY MOCKS
// ============================================================================

// GSAP is mocked via moduleNameMapper in jest.config.js -> __mocks__/gsap.js

// ============================================================================
// EXTERNAL COMPONENT MOCKS
// ============================================================================

// Mock react-github-calendar
jest.mock('react-github-calendar', () => ({
  __esModule: true,
  default: function MockGitHubCalendar({ username, ...props }) {
    return (
      <div data-testid="github-calendar" data-username={username}>
        GitHub Calendar Mock
      </div>
    );
  },
}));

// Mock react-typed (typing animation)
jest.mock('react-typed', () => ({
  __esModule: true,
  default: ({ strings, ...props }) => (
    <span data-testid="typed-text">{strings?.[0] || ''}</span>
  ),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  ToastContainer: () => null,
  Slide: {},
  Bounce: {},
  Flip: {},
  Zoom: {},
}));

// ============================================================================
// DATABASE MOCKS
// ============================================================================

// Mock Prisma client
jest.mock('./lib/prisma', () => require('./__mocks__/prisma'));
jest.mock('./lib/prisma.js', () => require('./__mocks__/prisma'));

// ============================================================================
// BROWSER API POLYFILLS / MOCKS
// ============================================================================

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observedElements = new Set();
  }

  observe(element) {
    this.observedElements.add(element);
    // Immediately trigger with isIntersecting: true for testing
    this.callback([
      {
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: element.getBoundingClientRect?.() || {},
        intersectionRect: {},
        rootBounds: null,
        time: Date.now(),
      },
    ]);
  }

  unobserve(element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  takeRecords() {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observedElements = new Set();
  }

  observe(element) {
    this.observedElements.add(element);
  }

  unobserve(element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }
}

global.ResizeObserver = MockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 0);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = jest.fn((element) => {
  return originalGetComputedStyle(element);
});

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {};
}
global.crypto.randomUUID = jest.fn(() => 
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  })
);

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

/**
 * Helper to wait for async operations
 */
global.waitFor = async (ms = 0) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Helper to flush all pending promises
 */
global.flushPromises = () => new Promise(setImmediate);
