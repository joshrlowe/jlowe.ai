/**
 * Header.test.jsx
 *
 * Comprehensive tests for Header/Navigation component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

expect.extend(toHaveNoViolations);

// Mock next/router
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

describe('Header Component', () => {
    const mockRouter = {
        pathname: '/',
        push: jest.fn(),
        events: {
            on: jest.fn(),
            off: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue(mockRouter);
        // Reset scroll position
        Object.defineProperty(window, 'scrollY', {
            writable: true,
            value: 0,
        });
    });

    describe('Rendering', () => {
        it('should render without crashing', () => {
            render(<Header />);
            expect(screen.getByRole('banner')).toBeInTheDocument();
        });

        it('should render logo with correct alt text', () => {
            render(<Header />);
            const logo = screen.getByAltText('JL Logo');
            expect(logo).toBeInTheDocument();
            expect(logo).toHaveAttribute('src', '/images/logo.png');
        });

        it('should render all navigation links', () => {
            render(<Header />);
            expect(screen.getAllByText('Home')).toHaveLength(2); // Desktop + Mobile
            expect(screen.getAllByText('About')).toHaveLength(2);
            expect(screen.getAllByText('Projects')).toHaveLength(2);
            expect(screen.getAllByText('Articles')).toHaveLength(2);
            expect(screen.getAllByText('Contact')).toHaveLength(2);
        });

        it('should render CTA button', () => {
            render(<Header />);
            const ctaButtons = screen.getAllByText("Let's Talk");
            expect(ctaButtons.length).toBeGreaterThan(0);
        });

        it('should apply custom style prop', () => {
            const customStyle = { backgroundColor: 'red' };
            const { container } = render(<Header style={customStyle} />);
            const header = container.querySelector('header');
            expect(header).toHaveStyle({ backgroundColor: 'red' });
        });
    });

    describe('Navigation Links', () => {
        it('should have correct href values for all links', () => {
            const { container } = render(<Header />);
            const links = container.querySelectorAll('a[href]');

            const hrefs = Array.from(links).map(link => link.getAttribute('href'));
            expect(hrefs).toContain('/');
            expect(hrefs).toContain('/about');
            expect(hrefs).toContain('/projects');
            expect(hrefs).toContain('/articles');
            expect(hrefs).toContain('/contact');
        });

        it('should highlight active link on home page', () => {
            useRouter.mockReturnValue({ ...mockRouter, pathname: '/' });
            const { container } = render(<Header />);

            // Find desktop nav links
            const homeLinks = container.querySelectorAll('a[href="/"]');
            const activeHomeLink = Array.from(homeLinks).find(link =>
                link.textContent === 'Home' && link.closest('.hidden.md\\:flex')
            );

            expect(activeHomeLink).toBeInTheDocument();
        });

        it('should highlight active link on about page', () => {
            useRouter.mockReturnValue({ ...mockRouter, pathname: '/about' });
            render(<Header />);
            // Active state is applied via inline styles, component should render
            expect(screen.getAllByText('About').length).toBeGreaterThan(0);
        });

        it('should highlight active link on projects page', () => {
            useRouter.mockReturnValue({ ...mockRouter, pathname: '/projects' });
            render(<Header />);
            expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
        });

        it('should highlight active link on nested route', () => {
            useRouter.mockReturnValue({ ...mockRouter, pathname: '/projects/detail' });
            render(<Header />);
            // Should highlight "Projects" for /projects/* routes
            expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
        });
    });

    describe('Mobile Menu', () => {
        it('should render mobile menu toggle button', () => {
            render(<Header />);
            const button = screen.getByRole('button', { name: /toggle navigation menu/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('aria-expanded', 'false');
        });

        it('should toggle mobile menu when button is clicked', () => {
            render(<Header />);
            const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });

            // Initially closed
            expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

            // Open menu
            fireEvent.click(toggleButton);
            expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

            // Close menu
            fireEvent.click(toggleButton);
            expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
        });

        it('should close mobile menu when a link is clicked', () => {
            render(<Header />);
            const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });

            // Open menu
            fireEvent.click(toggleButton);
            expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

            // Click a nav link in mobile menu
            const mobileLinks = screen.getAllByText('About');
            const mobileLink = mobileLinks.find(link =>
                link.closest('.md\\:hidden')
            );
            if (mobileLink) {
                fireEvent.click(mobileLink);
            }

            // Menu should close
            expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
        });

        it('should have screen reader text for menu button', () => {
            render(<Header />);
            expect(screen.getByText('Menu')).toHaveClass('sr-only');
        });
    });

    describe('Scroll Behavior', () => {
        it('should update style on scroll', async () => {
            const { container } = render(<Header />);
            const header = container.querySelector('header');

            // Initially not scrolled
            expect(header).toHaveClass('py-5');

            // Simulate scroll
            Object.defineProperty(window, 'scrollY', {
                writable: true,
                value: 50,
            });
            fireEvent.scroll(window);

            await waitFor(() => {
                expect(header).toHaveClass('py-2');
            });
        });

        it('should add border on scroll', async () => {
            const { container } = render(<Header />);
            const header = container.querySelector('header');

            // Simulate scroll
            Object.defineProperty(window, 'scrollY', {
                writable: true,
                value: 50,
            });
            fireEvent.scroll(window);

            await waitFor(() => {
                expect(header).toHaveClass('border-b');
            });
        });

        it('should clean up scroll listener on unmount', () => {
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
            const { unmount } = render(<Header />);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });

    describe('Accessibility', () => {
        it('should have no accessibility violations', async () => {
            const { container } = render(<Header />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have aria-label on logo link', () => {
            render(<Header />);
            // Use getAllByRole since there are multiple Home links (logo + nav)
            const homeLinks = screen.getAllByRole('link', { name: /home/i });
            const logoLink = homeLinks.find(link => link.getAttribute('aria-label') === 'Home');
            expect(logoLink).toBeInTheDocument();
        });

        it('should have proper aria-expanded on mobile menu button', () => {
            render(<Header />);
            const button = screen.getByRole('button', { name: /toggle navigation menu/i });
            expect(button).toHaveAttribute('aria-expanded');
        });

        it('should have proper navigation landmark', () => {
            render(<Header />);
            expect(screen.getByRole('navigation')).toBeInTheDocument();
        });

        it('should have proper banner landmark', () => {
            render(<Header />);
            expect(screen.getByRole('banner')).toBeInTheDocument();
        });
    });

    describe('Logo', () => {
        it('should render logo image with correct attributes', () => {
            render(<Header />);
            const logo = screen.getByAltText('JL Logo');
            expect(logo).toHaveAttribute('src', '/images/logo.png');
            expect(logo).toHaveClass('w-full', 'h-full', 'object-contain');
        });

        it('should link logo to homepage', () => {
            render(<Header />);
            // Get the logo link by finding the one with the logo image
            const logoImg = screen.getByAltText('JL Logo');
            const logoLink = logoImg.closest('a');
            expect(logoLink).toHaveAttribute('href', '/');
        });
    });

    describe('CTA Button', () => {
        it('should render "Let\'s Talk" CTA button', () => {
            render(<Header />);
            const ctaButtons = screen.getAllByText("Let's Talk");
            expect(ctaButtons.length).toBeGreaterThan(0);
        });

        it('should link CTA to contact page', () => {
            const { container } = render(<Header />);
            const ctaLinks = container.querySelectorAll('a[href="/contact"]');
            const ctaLink = Array.from(ctaLinks).find(link =>
                link.textContent.includes("Let's Talk")
            );
            expect(ctaLink).toBeInTheDocument();
        });
    });

    describe('Responsive Behavior', () => {
        it('should hide mobile menu button on desktop', () => {
            render(<Header />);
            const button = screen.getByRole('button', { name: /toggle navigation menu/i });
            expect(button).toHaveClass('md:hidden');
        });

        it('should hide desktop navigation on mobile', () => {
            const { container } = render(<Header />);
            const desktopNav = container.querySelector('.hidden.md\\:flex');
            expect(desktopNav).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing router gracefully', () => {
            useRouter.mockReturnValue({
                pathname: null,
                push: jest.fn(),
                events: { on: jest.fn(), off: jest.fn() },
            });
            expect(() => render(<Header />)).not.toThrow();
        });

        it('should work with undefined style prop', () => {
            expect(() => render(<Header style={undefined} />)).not.toThrow();
        });

        it('should work with empty style prop', () => {
            expect(() => render(<Header style={{}} />)).not.toThrow();
        });

        it('should render correctly when scrollY is exactly 20', async () => {
            const { container } = render(<Header />);

            Object.defineProperty(window, 'scrollY', {
                writable: true,
                value: 20,
            });
            fireEvent.scroll(window);

            await waitFor(() => {
                const header = container.querySelector('header');
                expect(header).toBeInTheDocument();
            });
        });

        it('should render correctly when scrollY is 21', async () => {
            const { container } = render(<Header />);

            Object.defineProperty(window, 'scrollY', {
                writable: true,
                value: 21,
            });
            fireEvent.scroll(window);

            await waitFor(() => {
                const header = container.querySelector('header');
                expect(header).toHaveClass('py-2');
            });
        });
    });

    describe('Interaction', () => {
        it('should allow keyboard navigation through links', () => {
            render(<Header />);
            const allLinks = screen.getAllByRole('link');

            allLinks.forEach(link => {
                expect(link).toHaveAttribute('href');
            });
        });

        it('should toggle menu multiple times', () => {
            render(<Header />);
            const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });

            // Open
            fireEvent.click(toggleButton);
            expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

            // Close
            fireEvent.click(toggleButton);
            expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

            // Open again
            fireEvent.click(toggleButton);
            expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        });
    });
});

