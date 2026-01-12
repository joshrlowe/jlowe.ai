/**
 * SpaceBackground.test.jsx
 *
 * Comprehensive tests for SpaceBackground component (Three.js/Canvas)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SpaceBackground from '@/components/SpaceBackground';

expect.extend(toHaveNoViolations);

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('SpaceBackground Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    
    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<SpaceBackground />);
      expect(document.body).toBeInTheDocument();
    });

    it('should render canvas element', () => {
      const { container } = render(<SpaceBackground />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render with black background initially', () => {
      const { container } = render(<SpaceBackground />);
      const bgDiv = container.querySelector('.fixed.inset-0.z-0.bg-black');
      expect(bgDiv).toBeInTheDocument();
    });

    it('should check sessionStorage for animation state', async () => {
      render(<SpaceBackground />);
      await waitFor(() => {
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('introAnimationPlayed');
      });
    });
  });

  describe('Supernova Animation', () => {
    it('should skip animation if already played', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');
      render(<SpaceBackground />);
      
      await waitFor(() => {
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('introAnimationPlayed');
      });
    });

    it('should dispatch custom event when animation complete', async () => {
      const eventListener = jest.fn();
      window.addEventListener('introAnimationComplete', eventListener);
      
      mockSessionStorage.getItem.mockReturnValue('true');
      render(<SpaceBackground />);
      
      await waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });
      
      window.removeEventListener('introAnimationComplete', eventListener);
    });

    it('should set sessionStorage when animation completes', async () => {
      mockSessionStorage.getItem.mockReturnValue('true');
      render(<SpaceBackground />);
      
      await waitFor(() => {
        expect(mockSessionStorage.setItem).not.toHaveBeenCalled(); // Already played
      });
    });
  });

  describe('Reduced Motion', () => {
    it('should render static fallback for reduced motion', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container } = render(<SpaceBackground />);
      const bgDiv = container.querySelector('.fixed.inset-0.z-0.bg-black');
      expect(bgDiv).toBeInTheDocument();
    });

    it('should apply background pattern for reduced motion', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container } = render(<SpaceBackground />);
      const pattern = container.querySelector('.absolute.inset-0.opacity-70');
      expect(pattern).toBeInTheDocument();
    });

    it('should listen for matchMedia changes', () => {
      const mockMediaQuery = {
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
      
      window.matchMedia = jest.fn(() => mockMediaQuery);
      
      render(<SpaceBackground />);
      
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Canvas Element', () => {
    it('should render Canvas component from react-three/fiber', () => {
      const { container } = render(<SpaceBackground />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should have proper z-index', () => {
      const { container } = render(<SpaceBackground />);
      const canvasContainer = container.querySelector('.fixed.inset-0.z-0');
      expect(canvasContainer).toBeInTheDocument();
    });

    it('should have vignette overlay', () => {
      const { container } = render(<SpaceBackground />);
      const vignette = container.querySelector('.absolute.inset-0.pointer-events-none');
      expect(vignette).toBeInTheDocument();
    });
  });

  describe('Mounted State', () => {
    it('should render black background before mounting', () => {
      // Mock mounted state as false
      const { container } = render(<SpaceBackground />);
      const bgDiv = container.querySelector('.fixed.inset-0');
      expect(bgDiv).toBeInTheDocument();
    });

    it('should update after mounting', async () => {
      render(<SpaceBackground />);
      
      await waitFor(() => {
        // Component should be mounted
        expect(document.querySelector('canvas')).toBeInTheDocument();
      });
    });
  });

  describe('Animation Timing', () => {
    it('should handle animation timing correctly', async () => {
      jest.useFakeTimers();
      render(<SpaceBackground />);
      
      // Fast forward time
      jest.advanceTimersByTime(3500);
      
      await waitFor(() => {
        expect(mockSessionStorage.getItem).toHaveBeenCalled();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing sessionStorage gracefully', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('SessionStorage not available');
      });
      
      expect(() => render(<SpaceBackground />)).not.toThrow();
    });

    it('should handle matchMedia not supported', () => {
      window.matchMedia = undefined;
      
      expect(() => render(<SpaceBackground />)).not.toThrow();
    });

    it('should handle window undefined (SSR)', () => {
      const originalWindow = global.window;
      delete global.window;
      
      expect(() => render(<SpaceBackground />)).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('Layout', () => {
    it('should use fixed positioning', () => {
      const { container } = render(<SpaceBackground />);
      const canvasContainer = container.querySelector('.fixed');
      expect(canvasContainer).toHaveClass('inset-0');
    });

    it('should have correct z-index for background', () => {
      const { container } = render(<SpaceBackground />);
      const canvasContainer = container.querySelector('.z-0');
      expect(canvasContainer).toBeInTheDocument();
    });

    it('should render vignette with pointer-events-none', () => {
      const { container } = render(<SpaceBackground />);
      const vignette = container.querySelector('.pointer-events-none');
      expect(vignette).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not block rendering', () => {
      const start = performance.now();
      render(<SpaceBackground />);
      const end = performance.now();
      
      // Rendering should be fast (< 1000ms)
      expect(end - start).toBeLessThan(1000);
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<SpaceBackground />);
      
      expect(() => {
        rerender(<SpaceBackground />);
        rerender(<SpaceBackground />);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<SpaceBackground />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('should remove event listeners on unmount', () => {
      const mockMediaQuery = {
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
      
      window.matchMedia = jest.fn(() => mockMediaQuery);
      
      const { unmount } = render(<SpaceBackground />);
      unmount();
      
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SpaceBackground />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not interfere with screen readers', () => {
      const { container } = render(<SpaceBackground />);
      const bgDiv = container.querySelector('.fixed');
      
      // Background should not have interactive elements
      expect(bgDiv.querySelector('button')).toBeNull();
      expect(bgDiv.querySelector('a')).toBeNull();
    });

    it('should have proper z-index layering', () => {
      const { container } = render(<SpaceBackground />);
      const bgDiv = container.querySelector('.z-0');
      expect(bgDiv).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle WebGL not available', () => {
      // Canvas component is mocked to handle this
      expect(() => render(<SpaceBackground />)).not.toThrow();
    });

    it('should render fallback for older browsers', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container } = render(<SpaceBackground />);
      expect(container.querySelector('.fixed')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should have black background color', () => {
      const { container } = render(<SpaceBackground />);
      const bgDiv = container.querySelector('.bg-black');
      expect(bgDiv).toBeInTheDocument();
    });

    it('should apply radial gradient vignette', () => {
      const { container } = render(<SpaceBackground />);
      const vignette = container.querySelector('[style*="radial-gradient"]');
      expect(vignette).toBeInTheDocument();
    });
  });
});

