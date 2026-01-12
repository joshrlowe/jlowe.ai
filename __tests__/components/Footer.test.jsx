/**
 * Footer.test.jsx
 *
 * Comprehensive tests for Footer component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Footer from '@/components/Footer';

expect.extend(toHaveNoViolations);

// Mock fetch
global.fetch = jest.fn();

describe('Footer Component', () => {
    const mockContactData = {
        emailAddress: 'josh@jlowe.ai',
        socialMediaLinks: {
            linkedIn: 'https://linkedin.com/in/joshlowe',
            github: 'https://github.com/joshlowe',
            X: 'https://x.com/joshlowe',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => mockContactData,
        });
    });

    describe('Rendering', () => {
        it('should render without crashing', () => {
            render(<Footer />);
            expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        });

        it('should render logo with correct alt text', () => {
            render(<Footer />);
            const logo = screen.getByAltText('JL Logo');
            expect(logo).toBeInTheDocument();
            expect(logo).toHaveAttribute('src', '/images/logo.png');
        });

        it('should render name "Josh Lowe"', () => {
            render(<Footer />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should render tagline', () => {
            render(<Footer />);
            expect(screen.getByText('AI Engineer & Consultant')).toBeInTheDocument();
        });

        it('should render description', () => {
            render(<Footer />);
            expect(
                screen.getByText(/Building intelligent systems and production-grade AI applications/)
            ).toBeInTheDocument();
        });

        it('should render copyright with current year', () => {
            const currentYear = new Date().getFullYear();
            render(<Footer />);
            expect(screen.getByText(new RegExp(`© ${currentYear} Josh Lowe`))).toBeInTheDocument();
        });

        it('should render "Built with" message', () => {
            render(<Footer />);
            expect(screen.getByText(/Built with/)).toBeInTheDocument();
            expect(screen.getByText(/and React/)).toBeInTheDocument();
        });
    });

    describe('Navigation Links', () => {
        it('should render all navigation links', () => {
            render(<Footer />);
            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('About')).toBeInTheDocument();
            expect(screen.getByText('Projects')).toBeInTheDocument();
            expect(screen.getByText('Articles')).toBeInTheDocument();
            expect(screen.getByText('Contact')).toBeInTheDocument();
        });

        it('should have correct href values for navigation links', () => {
            const { container } = render(<Footer />);

            const homeLink = container.querySelector('a[href="/"]');
            const aboutLink = container.querySelector('a[href="/about"]');
            const projectsLink = container.querySelector('a[href="/projects"]');
            const articlesLink = container.querySelector('a[href="/articles"]');
            const contactLink = container.querySelector('a[href="/contact"]');

            expect(homeLink).toBeInTheDocument();
            expect(aboutLink).toBeInTheDocument();
            expect(projectsLink).toBeInTheDocument();
            expect(articlesLink).toBeInTheDocument();
            expect(contactLink).toBeInTheDocument();
        });

        it('should render "Navigation" heading', () => {
            render(<Footer />);
            expect(screen.getByText('Navigation')).toBeInTheDocument();
        });
    });

    describe('Services Section', () => {
        it('should render "Services" heading', () => {
            render(<Footer />);
            expect(screen.getByText('Services')).toBeInTheDocument();
        });

        it('should render all service items', () => {
            render(<Footer />);
            expect(screen.getByText('AI Strategy')).toBeInTheDocument();
            expect(screen.getByText('ML Systems')).toBeInTheDocument();
            expect(screen.getByText('LLM Solutions')).toBeInTheDocument();
            expect(screen.getByText('Cloud & MLOps')).toBeInTheDocument();
            expect(screen.getByText('Data Analytics')).toBeInTheDocument();
        });
    });

    describe('Social Links', () => {
        it('should fetch contact data on mount', async () => {
            render(<Footer />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/contact');
            });
        });

        it('should render social media icons', () => {
            render(<Footer />);

            const emailIcon = screen.getByLabelText('Email');
            const linkedInIcon = screen.getByLabelText('LinkedIn');
            const githubIcon = screen.getByLabelText('GitHub');
            const xIcon = screen.getByLabelText('X (Twitter)');

            expect(emailIcon).toBeInTheDocument();
            expect(linkedInIcon).toBeInTheDocument();
            expect(githubIcon).toBeInTheDocument();
            expect(xIcon).toBeInTheDocument();
        });

        it('should have email link before data loads', () => {
            const { container } = render(<Footer />);
            const emailLink = screen.getByLabelText('Email');
            expect(emailLink).toHaveAttribute('href', '#');
        });

        it('should update email link after data loads', async () => {
            render(<Footer />);

            await waitFor(() => {
                const emailLink = screen.getByLabelText('Email');
                expect(emailLink).toHaveAttribute('href', 'mailto:josh@jlowe.ai');
            });
        });

        it('should update social links after data loads', async () => {
            render(<Footer />);

            await waitFor(() => {
                const linkedInLink = screen.getByLabelText('LinkedIn');
                const githubLink = screen.getByLabelText('GitHub');
                const xLink = screen.getByLabelText('X (Twitter)');

                expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com/in/joshlowe');
                expect(githubLink).toHaveAttribute('href', 'https://github.com/joshlowe');
                expect(xLink).toHaveAttribute('href', 'https://x.com/joshlowe');
            });
        });

        it('should have target="_blank" on external social links', async () => {
            render(<Footer />);

            await waitFor(() => {
                const linkedInLink = screen.getByLabelText('LinkedIn');
                const githubLink = screen.getByLabelText('GitHub');
                const xLink = screen.getByLabelText('X (Twitter)');

                expect(linkedInLink).toHaveAttribute('target', '_blank');
                expect(githubLink).toHaveAttribute('target', '_blank');
                expect(xLink).toHaveAttribute('target', '_blank');
            });
        });

        it('should have rel="noopener noreferrer" on external social links', async () => {
            render(<Footer />);

            await waitFor(() => {
                const linkedInLink = screen.getByLabelText('LinkedIn');
                const githubLink = screen.getByLabelText('GitHub');
                const xLink = screen.getByLabelText('X (Twitter)');

                expect(linkedInLink).toHaveAttribute('rel', 'noopener noreferrer');
                expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
                expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');
            });
        });

        it('should not have target="_blank" on email link', () => {
            render(<Footer />);
            const emailLink = screen.getByLabelText('Email');
            expect(emailLink).not.toHaveAttribute('target');
        });

        it('should not have rel attribute on email link', () => {
            render(<Footer />);
            const emailLink = screen.getByLabelText('Email');
            expect(emailLink).not.toHaveAttribute('rel');
        });
    });

    describe('API Error Handling', () => {
        it('should handle fetch error gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            render(<Footer />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
            });

            // Should still render with default values
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });

        it('should handle non-ok response gracefully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            render(<Footer />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
            });

            // Should still render with default values
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should handle missing social links gracefully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    emailAddress: 'test@example.com',
                    socialMediaLinks: {},
                }),
            });

            render(<Footer />);

            await waitFor(() => {
                const linkedInLink = screen.getByLabelText('LinkedIn');
                expect(linkedInLink).toHaveAttribute('href', '#');
            });
        });

        it('should handle null socialMediaLinks gracefully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    emailAddress: 'test@example.com',
                    socialMediaLinks: null,
                }),
            });

            render(<Footer />);

            await waitFor(() => {
                const linkedInLink = screen.getByLabelText('LinkedIn');
                expect(linkedInLink).toHaveAttribute('href', '#');
            });
        });
    });

    describe('Accessibility', () => {
        it('should have no accessibility violations', async () => {
            const { container } = render(<Footer />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have proper contentinfo landmark', () => {
            render(<Footer />);
            expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        });

        it('should have aria-label on social links', () => {
            render(<Footer />);

            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
            expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
            expect(screen.getByLabelText('X (Twitter)')).toBeInTheDocument();
        });

        it('should have proper heading hierarchy', () => {
            render(<Footer />);

            const headings = screen.getAllByRole('heading', { level: 3 });
            expect(headings.length).toBeGreaterThan(0);
        });
    });

    describe('Logo Link', () => {
        it('should link logo to homepage', () => {
            const { container } = render(<Footer />);
            const logoLink = container.querySelector('a[href="/"]');
            const logo = screen.getByAltText('JL Logo');

            expect(logoLink).toContainElement(logo);
        });

        it('should render logo with correct dimensions', () => {
            render(<Footer />);
            const logo = screen.getByAltText('JL Logo');
            expect(logo).toHaveClass('w-full', 'h-full', 'object-contain');
        });
    });

    describe('Layout and Structure', () => {
        it('should render in grid layout', () => {
            const { container } = render(<Footer />);
            const grid = container.querySelector('.grid');
            expect(grid).toBeInTheDocument();
        });

        it('should render brand section', () => {
            render(<Footer />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
            expect(screen.getByText('AI Engineer & Consultant')).toBeInTheDocument();
        });

        it('should render bottom bar with copyright', () => {
            const currentYear = new Date().getFullYear();
            render(<Footer />);
            expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
        });
    });

    describe('Animation Icons', () => {
        it('should render heart icon in footer', () => {
            const { container } = render(<Footer />);
            const heartIcon = container.querySelector('svg[fill="currentColor"]');
            expect(heartIcon).toBeInTheDocument();
        });

        it('should have animate-pulse class on heart icon', () => {
            const { container } = render(<Footer />);
            const heartIcon = container.querySelector('.animate-pulse');
            expect(heartIcon).toBeInTheDocument();
        });
    });

    describe('Mounted State', () => {
        it('should set mounted state on mount', () => {
            render(<Footer />);
            // Component should render social links after mounting
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
        });

        it('should not call getHref before mounted', () => {
            // Initial render should show # as href
            render(<Footer />);
            const emailLink = screen.getByLabelText('Email');

            // Initially should be #
            expect(emailLink.getAttribute('href')).toBe('#');
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined emailAddress', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    socialMediaLinks: mockContactData.socialMediaLinks,
                }),
            });

            render(<Footer />);

            await waitFor(() => {
                const emailLink = screen.getByLabelText('Email');
                expect(emailLink).toHaveAttribute('href', '#');
            });
        });

        it('should handle empty emailAddress', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    emailAddress: '',
                    socialMediaLinks: mockContactData.socialMediaLinks,
                }),
            });

            render(<Footer />);

            await waitFor(() => {
                const emailLink = screen.getByLabelText('Email');
                expect(emailLink).toHaveAttribute('href', '#');
            });
        });

        it('should handle partial social links', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    emailAddress: 'test@example.com',
                    socialMediaLinks: {
                        linkedIn: 'https://linkedin.com/in/test',
                        // Missing github and X
                    },
                }),
            });

            render(<Footer />);

            await waitFor(() => {
                const linkedInLink = screen.getByLabelText('LinkedIn');
                const githubLink = screen.getByLabelText('GitHub');
                const xLink = screen.getByLabelText('X (Twitter)');

                expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com/in/test');
                expect(githubLink).toHaveAttribute('href', '#');
                expect(xLink).toHaveAttribute('href', '#');
            });
        });
    });

    describe('Social Icons SVG', () => {
        it('should render email icon SVG', () => {
            const { container } = render(<Footer />);
            const emailLink = screen.getByLabelText('Email');
            const svg = emailLink.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should render LinkedIn icon SVG', () => {
            const { container } = render(<Footer />);
            const linkedInLink = screen.getByLabelText('LinkedIn');
            const svg = linkedInLink.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should render GitHub icon SVG', () => {
            const { container } = render(<Footer />);
            const githubLink = screen.getByLabelText('GitHub');
            const svg = githubLink.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should render X icon SVG', () => {
            const { container } = render(<Footer />);
            const xLink = screen.getByLabelText('X (Twitter)');
            const svg = xLink.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });
});

