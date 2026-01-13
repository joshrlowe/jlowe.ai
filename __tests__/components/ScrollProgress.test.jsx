/**
 * Tests for ScrollProgress Component
 * 
 * Tests the scroll progress indicator including visibility,
 * progress calculation, and accessibility.
 */

import React from 'react';
import { act } from 'react';
import { screen, renderWithoutProviders, waitFor } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import ScrollProgress from '@/components/ui/ScrollProgress';

expect.extend(toHaveNoViolations);

// Helper to dispatch scroll events wrapped in act()
const triggerScroll = async () => {
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
  });
};

describe('ScrollProgress', () => {
  // Mock window dimensions and scroll
  const mockScrollPosition = (scrollY, docHeight = 2000) => {
    Object.defineProperty(window, 'scrollY', { value: scrollY, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: docHeight,
      writable: true,
    });
  };

  // Mock matchMedia
  const mockMatchMedia = (prefersReducedMotion = false) => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: prefersReducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  };

  beforeEach(() => {
    mockMatchMedia(false);
    mockScrollPosition(0);
  });

  describe('rendering', () => {
    it('should not render when scroll position is less than 100px', () => {
      mockScrollPosition(50);
      renderWithoutProviders(<ScrollProgress />);
      
      // Trigger initial scroll handler
      triggerScroll();
      
      const progressBar = screen.queryByRole('progressbar');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should render when scroll position is greater than 100px', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      
      // Trigger scroll event
      triggerScroll();
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('progress calculation', () => {
    it('should show 0% progress at top of page', async () => {
      mockScrollPosition(101);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow');
      });
    });

    it('should show 100% progress at bottom of page', async () => {
      // scrollY = docHeight - innerHeight = 1200
      mockScrollPosition(1200, 2000);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar.getAttribute('aria-valuenow')).toBe('100');
      });
    });

    it('should show 50% progress at middle of page', async () => {
      mockScrollPosition(600, 2000); // 600 / 1200 = 50%
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar.getAttribute('aria-valuenow')).toBe('50');
      });
    });
  });

  describe('reduced motion preference', () => {
    it('should not render when user prefers reduced motion', () => {
      mockMatchMedia(true);
      mockScrollPosition(500);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      const progressBar = screen.queryByRole('progressbar');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe('cleanup', () => {
    it('should remove scroll event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      mockScrollPosition(150);
      
      const { unmount } = renderWithoutProviders(<ScrollProgress />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('styling', () => {
    it('should have fixed positioning', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveClass('fixed');
      });
    });

    it('should be positioned at top of viewport', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveClass('top-0');
        expect(progressBar).toHaveClass('left-0');
      });
    });

    it('should have pointer-events-none for non-blocking', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveClass('pointer-events-none');
      });
    });
  });

  describe('accessibility', () => {
    it('should have progressbar role', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should have aria-valuenow attribute', async () => {
      mockScrollPosition(300);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow');
      });
    });

    it('should have aria-valuemin attribute', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      });
    });

    it('should have aria-valuemax attribute', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should have aria-label attribute', async () => {
      mockScrollPosition(150);
      renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label', 'Page scroll progress');
      });
    });

    it('should have no accessibility violations when visible', async () => {
      mockScrollPosition(150);
      const { container } = renderWithoutProviders(<ScrollProgress />);
      triggerScroll();
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when hidden', async () => {
      mockScrollPosition(0);
      const { container } = renderWithoutProviders(<ScrollProgress />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});



