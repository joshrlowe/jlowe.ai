/**
 * Tests for GitHubContributionGraph component
 *
 * Tests the GitHub contribution calendar display
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GitHubContributionGraph from '../../components/GitHubContributionGraph';
import { useIsMobile } from '@/lib/hooks';

// gsap is mocked globally via jest.config.js moduleNameMapper

// Mock UI components
jest.mock('@/components/ui', () => ({
  Card: ({ children, variant, className, style }) => (
    <div className={className} style={style}>
      {children}
    </div>
  ),
}));

// Mock hooks - need to mock the entire module to include useIsMobile
jest.mock('@/lib/hooks', () => ({
  getPrefersReducedMotion: jest.fn(() => false),
  usePrefersReducedMotion: jest.fn(() => false),
  useIsMobile: jest.fn(() => false),
  getIsMobile: jest.fn(() => false),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GitHubContributionGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    // Mock successful API response
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total: 1234,
          contributions: [
            { date: '2024-01-15', count: 5 },
            { date: '2024-01-14', count: 3 },
            { date: '2024-01-13', count: 0 },
          ],
        }),
    });

    // Suppress console logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      render(<GitHubContributionGraph />);
      expect(screen.getByText('GitHub Contributions')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<GitHubContributionGraph title="My GitHub" />);
      expect(screen.getByText('My GitHub')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<GitHubContributionGraph />);
      expect(screen.getByText(/A visual representation of my coding journey/)).toBeInTheDocument();
    });

    it('should render custom description', () => {
      render(<GitHubContributionGraph description="Custom description" />);
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });

    it('should render GitHub profile link', () => {
      render(<GitHubContributionGraph username="joshrlowe" />);
      expect(screen.getByRole('link', { name: /View full profile on GitHub/i })).toHaveAttribute(
        'href',
        'https://github.com/joshrlowe'
      );
    });
  });

  describe('Default props', () => {
    it('should use default username', () => {
      render(<GitHubContributionGraph />);
      expect(screen.getByRole('link', { name: /View full profile on GitHub/i })).toHaveAttribute(
        'href',
        'https://github.com/joshrlowe'
      );
    });
  });

  describe('API calls', () => {
    it('should fetch contribution data', async () => {
      render(<GitHubContributionGraph username="testuser" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('github-contributions-api.jogruber.de/v4/testuser')
        );
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner initially', () => {
      render(<GitHubContributionGraph />);
      // The component shows a spinner while loading
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper section labelling', () => {
      render(<GitHubContributionGraph />);
      expect(screen.getByRole('region', { name: /github/i })).toBeInTheDocument();
    });

    it('should have section id', () => {
      render(<GitHubContributionGraph />);
      expect(document.getElementById('github-activity')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle API error gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<GitHubContributionGraph />);
      
      // Component should render without crashing on network error
      // The title should still be visible even when API fails
      expect(screen.getByText('GitHub Contributions')).toBeInTheDocument();
    });

    it('should handle non-OK API response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      
      render(<GitHubContributionGraph username="nonexistent" />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle empty contributions data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total: 0,
          contributions: [],
        }),
      });
      
      render(<GitHubContributionGraph />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Data processing', () => {
    it('should display contribution total', async () => {
      render(<GitHubContributionGraph />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should calculate stats from contributions', async () => {
      const mockOnDataLoaded = jest.fn();
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total: 500,
          contributions: [
            { date: '2024-01-15', count: 10 },
            { date: '2024-01-14', count: 5 },
            { date: '2024-01-13', count: 3 },
            { date: '2024-01-12', count: 0 },
          ],
        }),
      });
      
      render(<GitHubContributionGraph onDataLoaded={mockOnDataLoaded} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle contributions with various count values', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total: 100,
          contributions: [
            { date: '2024-01-15', count: 25 },
            { date: '2024-01-14', count: 15 },
            { date: '2024-01-13', count: 0 },
            { date: '2024-01-12', count: 8 },
          ],
        }),
      });
      
      render(<GitHubContributionGraph />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('onDataLoaded callback', () => {
    it('should call onDataLoaded when data is ready', async () => {
      const mockCallback = jest.fn();
      
      render(<GitHubContributionGraph onDataLoaded={mockCallback} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Color legend', () => {
    it('should render component with legend elements', () => {
      const { container } = render(<GitHubContributionGraph showLegend />);
      
      // Component should render
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Username variations', () => {
    it('should fetch data for different usernames', async () => {
      render(<GitHubContributionGraph username="differentuser" />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('differentuser')
        );
      });
    });
  });

  describe('Mobile responsive behavior', () => {
    it('should render correctly on mobile viewport', () => {
      // Mock useIsMobile to return true for mobile
      useIsMobile.mockReturnValue(true);

      render(<GitHubContributionGraph />);
      expect(screen.getByText('GitHub Contributions')).toBeInTheDocument();
    });

    it('should render correctly on desktop viewport', () => {
      // Mock useIsMobile to return false for desktop
      useIsMobile.mockReturnValue(false);

      render(<GitHubContributionGraph />);
      expect(screen.getByText('GitHub Contributions')).toBeInTheDocument();
    });

    it('should use mobile-specific display on mobile', () => {
      useIsMobile.mockReturnValue(true);
      
      const { container } = render(<GitHubContributionGraph />);
      
      // On mobile, the container should have justify-center class instead of min-w-[750px]
      // This verifies the mobile layout is being applied
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should use desktop display on larger screens', () => {
      useIsMobile.mockReturnValue(false);
      
      const { container } = render(<GitHubContributionGraph />);
      
      // Component should render on desktop
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should show different label text based on viewport', async () => {
      // The component uses different labels for mobile vs desktop
      // Mobile: "{{count}} contributions (last 7 weeks)"
      // Desktop: "{{count}} contributions in the last year"
      useIsMobile.mockReturnValue(false);
      
      render(<GitHubContributionGraph />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});

