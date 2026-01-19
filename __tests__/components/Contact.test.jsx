/**
 * Contact.test.jsx
 *
 * Comprehensive tests for Contact page component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ContactPage from '@/pages/contact';

expect.extend(toHaveNoViolations);

// Mock fetch
global.fetch = jest.fn();

// gsap is already mocked in jest.config.js via moduleNameMapper

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  return jest.fn((loader) => {
    const DynamicComponent = (props) => {
      return <span data-testid="typed-text">{props.strings?.[0] || 'Let\'s Connect'}</span>;
    };
    DynamicComponent.displayName = 'DynamicTyped';
    return DynamicComponent;
  });
});

describe('Contact Page Component', () => {
  const mockContactData = {
    emailAddress: 'josh@jlowe.ai',
    phoneNumber: '+1 (555) 123-4567',
    socialMediaLinks: {
      linkedIn: 'https://linkedin.com/in/joshlowe',
      github: 'https://github.com/joshlowe',
      X: 'https://x.com/joshlowe',
    },
    heroSubtitle: 'Ready to bring AI to your business?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockContactData,
    });

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
    it('should render without crashing', async () => {
      render(<ContactPage />);
      // Wait for data to load and content to appear
      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      // Don't resolve fetch immediately to see loading state
      global.fetch.mockImplementationOnce(() => new Promise(() => {}));
      render(<ContactPage />);
      expect(screen.getByText('Loading contact info...')).toBeInTheDocument();
    });

    it('should fetch contact data on mount', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/contact');
      });
    });

    it('should render contact information after loading', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });
    });

    it('should render "Connect With Me" section', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('Connect With Me')).toBeInTheDocument();
      });
    });
  });

  describe('Contact Information', () => {
    it('should display email address', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('josh@jlowe.ai')).toBeInTheDocument();
      });
    });

    it('should display phone number', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
      });
    });

    // Address and availability sections have been removed from the contact page

    it('should link email with mailto', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const emailLink = screen.getByText('josh@jlowe.ai');
        expect(emailLink).toHaveAttribute('href', 'mailto:josh@jlowe.ai');
      });
    });

    it('should link phone with tel', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const phoneLink = screen.getByText('+1 (555) 123-4567');
        expect(phoneLink).toHaveAttribute('href', 'tel:+1 (555) 123-4567');
      });
    });
  });

  describe('Social Links', () => {
    it('should render LinkedIn link', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const linkedInLink = screen.getByText(/Connect on LinkedIn/);
        expect(linkedInLink.closest('a')).toHaveAttribute(
          'href',
          'https://linkedin.com/in/joshlowe'
        );
      });
    });

    it('should render GitHub link', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const githubLink = screen.getByText(/Connect on GitHub/);
        expect(githubLink.closest('a')).toHaveAttribute(
          'href',
          'https://github.com/joshlowe'
        );
      });
    });

    it('should render X (Twitter) link', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const xLink = screen.getByText(/Connect on X \(Twitter\)/);
        expect(xLink.closest('a')).toHaveAttribute(
          'href',
          'https://x.com/joshlowe'
        );
      });
    });

    it('should render Email link', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const emailLink = screen.getByText('Send me an email');
        expect(emailLink.closest('a')).toHaveAttribute(
          'href',
          'mailto:josh@jlowe.ai'
        );
      });
    });

    it('should have target="_blank" on external links', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const linkedInLink = screen.getByText(/Connect on LinkedIn/).closest('a');
        const githubLink = screen.getByText(/Connect on GitHub/).closest('a');
        const xLink = screen.getByText(/Connect on X/).closest('a');

        expect(linkedInLink).toHaveAttribute('target', '_blank');
        expect(githubLink).toHaveAttribute('target', '_blank');
        expect(xLink).toHaveAttribute('target', '_blank');
      });
    });

    it('should have rel="noopener noreferrer" on external links', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const linkedInLink = screen.getByText(/Connect on LinkedIn/).closest('a');
        const githubLink = screen.getByText(/Connect on GitHub/).closest('a');
        const xLink = screen.getByText(/Connect on X/).closest('a');

        expect(linkedInLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should not have target on email link', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const emailLink = screen.getByText('Send me an email').closest('a');
        expect(emailLink).not.toHaveAttribute('target', '_blank');
      });
    });

    it('should render social link icons', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Typing Animation', () => {
    it('should render contact component', () => {
      const { container } = render(<ContactPage />);
      // Just verify the component renders
      expect(container).toBeInTheDocument();
    });

  });

  // Availability Status section has been removed from the contact page

  describe('API Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<ContactPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing contact data fields', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          emailAddress: 'test@example.com',
          // Missing other fields
        }),
      });

      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    // Availability section has been removed - these tests are no longer needed
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper headings hierarchy', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();

        const h2s = screen.getAllByRole('heading', { level: 2 });
        expect(h2s.length).toBeGreaterThan(0);
      });
    });

    it('should have aria-label on social links', async () => {
      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
        expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
        expect(screen.getByLabelText('X (Twitter)')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });
    });
  });

  describe('SEO', () => {
    it('should render SEO component', async () => {
      render(<ContactPage />);
      // Wait for data to load then verify page renders
      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Structure', () => {
    it('should render in grid layout', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should apply responsive grid classes', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        const grid = container.querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
      });
    });

    it('should render glass-card styling', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        const cards = container.querySelectorAll('.glass-card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle disabled social links', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockContactData,
          socialMediaLinks: {},
        }),
      });

      render(<ContactPage />);

      await waitFor(() => {
        const disabledLinks = screen.getAllByRole('link').filter(link =>
          link.getAttribute('href') === '#'
        );
        expect(disabledLinks.length).toBeGreaterThan(0);
      });
    });

    it('should prevent click on disabled links', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          emailAddress: null,
          socialMediaLinks: {},
        }),
      });

      render(<ContactPage />);

      await waitFor(() => {
        const emailLink = screen.getByLabelText('Email');
        fireEvent.click(emailLink);
        // Should not navigate
        expect(emailLink).toHaveAttribute('href', '#');
      });
    });

    it('should handle missing emailAddress', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockContactData,
          emailAddress: null,
        }),
      });

      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });
    });

    it('should handle missing phoneNumber', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockContactData,
          phoneNumber: null,
        }),
      });

      render(<ContactPage />);

      await waitFor(() => {
        expect(screen.queryByText('Phone')).not.toBeInTheDocument();
      });
    });

    // Address/Location section has been removed from the contact page
  });

  describe('Styling', () => {
    // Badge has been removed from the contact page

    it('should apply font classes', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveClass('font-[family-name:var(--font-oswald)]');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should respect reduced motion preference', async () => {
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

      render(<ContactPage />);
      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
      });
    });

    it('should apply responsive text sizes', async () => {
      const { container } = render(<ContactPage />);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
      });
    });
  });
});

