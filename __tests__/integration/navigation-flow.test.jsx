/**
 * Integration tests for Navigation Flow
 *
 * Tests complete navigation interactions including:
 * - Link navigation
 * - Mobile menu toggle
 * - Active state management
 * - Scroll behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Header from '../../components/Header';

// Mock Next.js router
const mockPush = jest.fn();
const mockPathname = jest.fn(() => '/');

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: mockPathname(),
    query: {},
    push: mockPush,
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Navigation Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/');
    
    // Mock scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
  });

  describe('Desktop Navigation', () => {
    it('should render all navigation links', () => {
      render(<Header />);

      // Use getByText to avoid confusion with aria-label
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should have correct href attributes for all links', () => {
      render(<Header />);

      const homeLink = screen.getAllByRole('link', { name: /home/i })[0];
      const aboutLink = screen.getAllByRole('link', { name: /about/i })[0];
      const projectsLink = screen.getAllByRole('link', { name: /projects/i })[0];
      const articlesLink = screen.getAllByRole('link', { name: /articles/i })[0];
      const contactLink = screen.getAllByRole('link', { name: /contact/i })[0];

      expect(homeLink).toHaveAttribute('href', '/');
      expect(aboutLink).toHaveAttribute('href', '/about');
      expect(projectsLink).toHaveAttribute('href', '/projects');
      expect(articlesLink).toHaveAttribute('href', '/articles');
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('should highlight active link based on current route', () => {
      mockPathname.mockReturnValue('/projects');
      render(<Header />);

      const projectsLinks = screen.getAllByRole('link', { name: /projects/i });
      const projectsLink = projectsLinks[0]; // Desktop link
      
      // Active link should have specific color styling (using rgb format)
      expect(projectsLink).toHaveStyle({ color: 'rgb(232, 93, 4)' });
    });

    it('should highlight home link only on exact home route', () => {
      mockPathname.mockReturnValue('/');
      render(<Header />);

      const homeLinks = screen.getAllByRole('link', { name: /home/i });
      const homeLink = homeLinks.find(link => link.getAttribute('href') === '/' && link.textContent === 'Home');
      expect(homeLink).toHaveStyle({ color: 'rgb(232, 93, 4)' });
    });

    it('should not highlight home link on other routes', () => {
      mockPathname.mockReturnValue('/about');
      render(<Header />);

      const homeLinks = screen.getAllByRole('link', { name: /home/i });
      const homeLink = homeLinks.find(link => link.getAttribute('href') === '/' && link.textContent === 'Home');
      expect(homeLink).not.toHaveStyle({ color: 'rgb(232, 93, 4)' });
    });

    it('should highlight parent route for nested paths', () => {
      mockPathname.mockReturnValue('/projects/some-project');
      render(<Header />);

      const projectsLinks = screen.getAllByRole('link', { name: /projects/i });
      const projectsLink = projectsLinks.find(link => link.getAttribute('href') === '/projects');
      expect(projectsLink).toHaveStyle({ color: 'rgb(232, 93, 4)' });
    });
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      // Mock mobile viewport
      global.innerWidth = 375;
    });

    it('should toggle mobile menu when hamburger is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      // Button should have aria-expanded false initially
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      await user.click(hamburgerButton);
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      });

      // Click to close
      await user.click(hamburgerButton);
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should close mobile menu when a link is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      // Open menu
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      });

      // Click a link
      const aboutLinks = screen.getAllByRole('link', { name: /about/i });
      const aboutLink = aboutLinks[aboutLinks.length - 1]; // Mobile link
      await user.click(aboutLink);

      // Menu should close
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should render all links in mobile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      await user.click(hamburgerButton);

      // Should have 2 sets of links (desktop + mobile)
      const allHomeLinks = screen.getAllByRole('link', { name: /home/i });
      expect(allHomeLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('should show correct active state in mobile menu', async () => {
      mockPathname.mockReturnValue('/contact');
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      });

      const contactLinks = screen.getAllByRole('link', { name: /contact/i });
      // Find the mobile nav link (not the CTA buttons)
      const mobileContactLink = contactLinks.find(link => 
        link.textContent === 'Contact' && link.getAttribute('href') === '/contact'
      );

      expect(mobileContactLink).toHaveStyle({ color: 'rgb(232, 93, 4)' });
    });
  });

  describe('Scroll Behavior', () => {
    it('should add backdrop blur when scrolled', () => {
      render(<Header />);

      const header = screen.getByRole('banner');

      // Initially transparent
      expect(header).toHaveClass('bg-transparent');

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { writable: true, value: 50 });
      fireEvent.scroll(window);

      // Should add backdrop blur styling
      waitFor(() => {
        expect(header).toHaveClass('backdrop-blur-xl');
      });
    });

    it('should remove backdrop blur when scrolled to top', () => {
      // Start scrolled
      Object.defineProperty(window, 'scrollY', { writable: true, value: 50 });
      
      render(<Header />);

      // Scroll to top
      Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
      fireEvent.scroll(window);

      const header = screen.getByRole('banner');
      waitFor(() => {
        expect(header).toHaveClass('bg-transparent');
      });
    });

    it('should update padding based on scroll position', () => {
      render(<Header />);

      const header = screen.getByRole('banner');

      // Initially more padding
      expect(header).toHaveClass('py-5');

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { writable: true, value: 50 });
      fireEvent.scroll(window);

      // Should reduce padding
      waitFor(() => {
        expect(header).toHaveClass('py-2');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<Header />);

      // Tab through links
      await user.tab();
      
      const firstLink = screen.getAllByRole('link')[0];
      expect(firstLink).toHaveFocus();

      await user.tab();
      const secondLink = screen.getAllByRole('link')[1];
      expect(secondLink).toHaveFocus();
    });

    it('should allow keyboard access to mobile menu toggle', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      // Focus the button
      hamburgerButton.focus();
      expect(hamburgerButton).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Header />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes on hamburger button', () => {
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      expect(hamburgerButton).toHaveAttribute('aria-label');
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when menu is opened', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have semantic HTML structure', () => {
      render(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Custom Styles', () => {
    it('should accept and apply custom styles', () => {
      const customStyle = {
        backgroundColor: 'red',
        padding: '20px',
      };

      render(<Header style={customStyle} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveStyle(customStyle);
    });
  });

  describe('Route Changes', () => {
    it('should update active state when route changes', () => {
      mockPathname.mockReturnValue('/');
      const { rerender } = render(<Header />);

      let homeLinks = screen.getAllByRole('link', { name: /home/i });
      let homeLink = homeLinks.find(link => link.getAttribute('href') === '/' && link.textContent === 'Home');
      expect(homeLink).toHaveStyle({ color: 'rgb(232, 93, 4)' });

      // Change route
      mockPathname.mockReturnValue('/about');
      rerender(<Header />);

      homeLinks = screen.getAllByRole('link', { name: /home/i });
      homeLink = homeLinks.find(link => link.getAttribute('href') === '/' && link.textContent === 'Home');
      const aboutLinks = screen.getAllByRole('link', { name: /about/i });
      const aboutLink = aboutLinks.find(link => link.getAttribute('href') === '/about');

      expect(homeLink).not.toHaveStyle({ color: 'rgb(232, 93, 4)' });
      expect(aboutLink).toHaveStyle({ color: 'rgb(232, 93, 4)' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing router pathname gracefully', () => {
      mockPathname.mockReturnValue(undefined);
      
      expect(() => render(<Header />)).not.toThrow();
    });

    it('should handle rapid menu toggles', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i,
      });

      // Rapidly toggle
      await user.click(hamburgerButton);
      await user.click(hamburgerButton);
      await user.click(hamburgerButton);

      // Should still be in a consistent state
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should handle scroll events during mount', () => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
      
      expect(() => render(<Header />)).not.toThrow();
    });
  });
});

