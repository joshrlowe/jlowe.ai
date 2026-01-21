/**
 * Mock: next/navigation
 * 
 * Mocks Next.js App Router navigation hooks.
 * This prevents errors when testing components that use navigation features.
 * 
 * Mocked exports:
 * - useRouter: Returns mock router with navigation methods
 * - usePathname: Returns current pathname
 * - useSearchParams: Returns URLSearchParams instance
 * - useParams: Returns route parameters
 * - redirect: Mock redirect function
 * - notFound: Mock notFound function
 * - useSelectedLayoutSegment: Returns null
 * - useSelectedLayoutSegments: Returns empty array
 */

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockPrefetch = jest.fn();

export const useRouter = jest.fn(() => ({
  push: mockPush,
  replace: mockReplace,
  refresh: mockRefresh,
  back: mockBack,
  forward: mockForward,
  prefetch: mockPrefetch,
}));

export const usePathname = jest.fn(() => '/');

export const useSearchParams = jest.fn(() => new URLSearchParams());

export const useParams = jest.fn(() => ({}));

export const redirect = jest.fn((url) => {
  throw new Error(`NEXT_REDIRECT: ${url}`);
});

export const notFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

export const useSelectedLayoutSegment = jest.fn(() => null);

export const useSelectedLayoutSegments = jest.fn(() => []);

// Export mock functions for assertions in tests
export const mockRouterFunctions = {
  push: mockPush,
  replace: mockReplace,
  refresh: mockRefresh,
  back: mockBack,
  forward: mockForward,
  prefetch: mockPrefetch,
};

// Helper to reset all mocks
export const resetNavigationMocks = () => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockRefresh.mockClear();
  mockBack.mockClear();
  mockForward.mockClear();
  mockPrefetch.mockClear();
  useRouter.mockClear();
  usePathname.mockClear();
  useSearchParams.mockClear();
  useParams.mockClear();
  redirect.mockClear();
  notFound.mockClear();
};




