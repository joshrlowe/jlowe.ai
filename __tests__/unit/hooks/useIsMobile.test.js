/**
 * Tests for useIsMobile hook
 *
 * Tests the mobile viewport detection hook
 */

import { renderHook, act } from '@testing-library/react';
import { useIsMobile, getIsMobile } from '../../../lib/hooks/useIsMobile';

describe('useIsMobile', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('useIsMobile hook', () => {
    it('should return false when viewport is desktop size', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return true when viewport is mobile size', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should update when viewport changes', () => {
      let changeHandler = null;

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') {
            changeHandler = handler;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate viewport resize to mobile
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true });
        }
      });

      expect(result.current).toBe(true);
    });

    it('should cleanup event listener on unmount', () => {
      const removeEventListener = jest.fn();

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener,
        dispatchEvent: jest.fn(),
      }));

      const { unmount } = renderHook(() => useIsMobile());
      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('getIsMobile function', () => {
    it('should return false when viewport is desktop size', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
      }));

      expect(getIsMobile()).toBe(false);
    });

    it('should return true when viewport is mobile size', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 767px)',
        media: query,
      }));

      expect(getIsMobile()).toBe(true);
    });

    it('should return false when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      delete global.window;

      expect(getIsMobile()).toBe(false);

      global.window = originalWindow;
    });
  });
});
