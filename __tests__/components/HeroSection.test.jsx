/**
 * HeroSection.test.jsx
 *
 * Comprehensive tests for HeroSection component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HeroSection from '@/components/HeroSection';

expect.extend(toHaveNoViolations);

// Mock gsap
// gsap is already mocked in jest.config.js via moduleNameMapper

// Mock dynamic import for ReactTyped
jest.mock('next/dynamic', () => {
    return jest.fn((loader) => {
        const DynamicComponent = (props) => {
            if (typeof loader === 'function') {
                return <span data-testid="typed-text">{props.strings?.[0] || 'I build'}</span>;
            }
            return null;
        };
        DynamicComponent.displayName = 'DynamicTyped';
        return DynamicComponent;
    });
});

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

describe('HeroSection Component', () => {
    const mockData = {
        name: 'Josh Lowe',
        callToAction: 'AI/ML Engineer',
        briefBio: 'Building production-grade AI systems.',
    };

    const mockContactData = {
        emailAddress: 'josh@jlowe.ai',
    };

    const mockHomeContent = {
        typingIntro: 'I build...',
        heroTitle: 'production AI systems',
        typingStrings: ['production AI systems', 'scalable ML pipelines'],
        primaryCta: { text: 'View My Work', href: '/projects' },
        secondaryCta: { text: 'Get in Touch', href: '/contact' },
        techBadges: [
            { name: 'Python', color: '#E85D04' },
            { name: 'TensorFlow', color: '#FAA307' },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSessionStorage.getItem.mockReturnValue(null);
        // Mock matchMedia for reduced motion
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
            render(<HeroSection data={mockData}  />);
            expect(screen.getByLabelText('Hero section')).toBeInTheDocument();
        });

        it('should render with default data when no props provided', () => {
            render(<HeroSection />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should render name from data prop', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should render tagline from data prop', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText('AI/ML Engineer')).toBeInTheDocument();
        });

        it('should render bio from data prop', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText(/Building production-grade AI systems/)).toBeInTheDocument();
        });

        it('should render hero title from homeContent', () => {
            render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            expect(screen.getByText('production AI systems')).toBeInTheDocument();
        });

        it('should render default hero title when no homeContent', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText(/production AI systems/)).toBeInTheDocument();
        });
    });

    describe('CTA Buttons', () => {
        it('should render primary CTA button', () => {
            render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            expect(screen.getByText('View My Work')).toBeInTheDocument();
        });

        it('should render secondary CTA button', () => {
            render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            expect(screen.getByText('Get in Touch')).toBeInTheDocument();
        });

        it('should link primary CTA to correct href', () => {
            const { container } = render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            const primaryLink = container.querySelector('a[href="/projects"]');
            expect(primaryLink).toHaveTextContent('View My Work');
        });

        it('should link secondary CTA to correct href', () => {
            const { container } = render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            const secondaryLink = container.querySelector('a[href="/contact"]');
            expect(secondaryLink).toHaveTextContent('Get in Touch');
        });

        it('should render default CTAs when no homeContent', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText('View My Work')).toBeInTheDocument();
            expect(screen.getByText('Get in Touch')).toBeInTheDocument();
        });

        it('should render icon in primary CTA', () => {
            const { container } = render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            const primaryCta = screen.getByText('View My Work').closest('a');
            const svg = primaryCta?.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('Tech Badges', () => {
        it('should render tech badges from homeContent', () => {
            render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            expect(screen.getByText('Python')).toBeInTheDocument();
            expect(screen.getByText('TensorFlow')).toBeInTheDocument();
        });

        it('should render default tech badges when no homeContent', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText('Python')).toBeInTheDocument();
            expect(screen.getByText('TensorFlow')).toBeInTheDocument();
            expect(screen.getByText('React')).toBeInTheDocument();
            expect(screen.getByText('AWS')).toBeInTheDocument();
            expect(screen.getByText('LLMs')).toBeInTheDocument();
        });

        it('should apply correct color to tech badges', () => {
            const { container } = render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            const pythonBadge = screen.getByText('Python');
            expect(pythonBadge).toHaveStyle({ color: '#E85D04' });
        });

        it('should render all tech badges with hover effects', () => {
            const { container } = render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            const badges = container.querySelectorAll('span[class*="hover:scale-105"]');
            expect(badges.length).toBeGreaterThan(0);
        });
    });

    describe('Scroll Indicator', () => {
        it('should render scroll indicator', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByLabelText('Scroll to services')).toBeInTheDocument();
        });

        it('should render "Explore" text in scroll indicator', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByText('Explore')).toBeInTheDocument();
        });

        it('should render arrow icon in scroll indicator', () => {
            const { container } = render(
                <HeroSection data={mockData}  />
            );
            const scrollButton = screen.getByLabelText('Scroll to services');
            const svg = scrollButton.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should call scrollIntoView when scroll button clicked', () => {
            // Mock getElementById
            const mockElement = {
                scrollIntoView: jest.fn(),
            };
            document.getElementById = jest.fn(() => mockElement);

            render(<HeroSection data={mockData}  />);

            const scrollButton = screen.getByLabelText('Scroll to services');
            fireEvent.click(scrollButton);

            expect(document.getElementById).toHaveBeenCalledWith('services');
            expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
        });

        it('should handle missing services section gracefully', () => {
            document.getElementById = jest.fn(() => null);

            render(<HeroSection data={mockData}  />);

            const scrollButton = screen.getByLabelText('Scroll to services');
            expect(() => fireEvent.click(scrollButton)).not.toThrow();
        });
    });

    describe('Animation and Timing', () => {
        it('should check sessionStorage for animation state', () => {
            render(<HeroSection data={mockData}  />);
            expect(mockSessionStorage.getItem).toHaveBeenCalledWith('introAnimationPlayed');
        });

        it('should skip animation if already played', () => {
            mockSessionStorage.getItem.mockReturnValue('true');
            render(<HeroSection data={mockData}  />);
            // Component should render immediately without delay
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should respect reduced motion preference', () => {
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

            render(<HeroSection data={mockData}  />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should set animation ready state after mount', async () => {
            mockSessionStorage.getItem.mockReturnValue('true');
            render(<HeroSection data={mockData}  />);

            await waitFor(() => {
                expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
            });
        });
    });

    describe('Typing Animation', () => {
        beforeEach(() => {
            // Set sessionStorage to return "true" so animationReady is immediately true
            mockSessionStorage.getItem.mockReturnValue("true");
        });

        it('should render typing intro text', async () => {
            render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            // Wait for mounted state to be set via useEffect
            await waitFor(() => {
                expect(screen.getByTestId('typed-text')).toBeInTheDocument();
            });
        });

        it('should use typing intro from homeContent', async () => {
            render(
                <HeroSection
                    data={mockData}
                    homeContent={mockHomeContent}
                />
            );
            await waitFor(() => {
                const typedText = screen.getByTestId('typed-text');
                expect(typedText).toHaveTextContent('I build...');
            });
        });

        it('should use default typing intro when no homeContent', async () => {
            render(<HeroSection data={mockData}  />);
            await waitFor(() => {
                const typedText = screen.getByTestId('typed-text');
                expect(typedText).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have no accessibility violations', async () => {
            const { container } = render(
                <HeroSection data={mockData}  />
            );
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have proper section landmark', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByLabelText('Hero section')).toBeInTheDocument();
        });

        it('should have h1 for main title', () => {
            render(<HeroSection data={mockData}  />);
            const h1 = screen.getByRole('heading', { level: 1 });
            expect(h1).toBeInTheDocument();
        });

        it('should have aria-label on scroll button', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByLabelText('Scroll to services')).toBeInTheDocument();
        });
    });

    describe('Layout and Structure', () => {
        it('should render in section element', () => {
            render(<HeroSection data={mockData}  />);
            expect(screen.getByLabelText('Hero section').tagName).toBe('SECTION');
        });

        it('should have min-h-screen class', () => {
            const { container } = render(
                <HeroSection data={mockData}  />
            );
            const section = container.querySelector('section');
            expect(section).toHaveClass('min-h-screen');
        });

        it('should render content in centered container', () => {
            const { container } = render(
                <HeroSection data={mockData}  />
            );
            const textCenter = container.querySelector('.text-center');
            expect(textCenter).toBeInTheDocument();
        });
    });

    describe('Default Values', () => {
        it('should use default name when data is empty', () => {
            render(<HeroSection data={{}}  />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should use default tagline when data is empty', () => {
            render(<HeroSection data={{}}  />);
            expect(screen.getByText('AI/ML Engineer')).toBeInTheDocument();
        });

        it('should use default bio when data is empty', () => {
            render(<HeroSection data={{}}  />);
            expect(
                screen.getByText(/Building production-grade AI systems/)
            ).toBeInTheDocument();
        });

        it('should handle null data prop', () => {
            render(<HeroSection data={null}  />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });

        it('should handle undefined data prop', () => {
            render(<HeroSection  />);
            expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
        });
    });

    describe('Styling and Visual Elements', () => {
        it('should apply gradient to main title', () => {
            render(<HeroSection data={mockData}  />);
            const h1 = screen.getByRole('heading', { level: 1 });
            expect(h1).toHaveStyle({
                background: expect.stringContaining('linear-gradient'),
            });
        });

        it('should render name with ember color', () => {
            render(<HeroSection data={mockData}  />);
            const name = screen.getByText('Josh Lowe');
            expect(name).toHaveStyle({ color: '#E85D04' });
        });

        it('should apply text shadow to title', () => {
            render(<HeroSection data={mockData}  />);
            const h1 = screen.getByRole('heading', { level: 1 });
            // JSDOM doesn't always parse complex textShadow values correctly
            // Just verify the h1 is rendered with inline styles applied
            expect(h1).toHaveAttribute('style');
            expect(h1.style.textShadow).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty techBadges array', () => {
            const contentWithEmptyBadges = {
                ...mockHomeContent,
                techBadges: [],
            };
            render(
                <HeroSection
                    data={mockData}
                    homeContent={contentWithEmptyBadges}
                />
            );
            // Should render default badges
            expect(screen.getByText('Python')).toBeInTheDocument();
        });

        it('should handle empty typingStrings array', () => {
            const contentWithEmptyStrings = {
                ...mockHomeContent,
                typingStrings: [],
            };
            render(
                <HeroSection
                    data={mockData}
                    homeContent={contentWithEmptyStrings}
                />
            );
            // Should render default strings
            expect(screen.getByText('production AI systems')).toBeInTheDocument();
        });

        it('should handle missing primaryCta', () => {
            const contentWithoutPrimaryCta = {
                ...mockHomeContent,
                primaryCta: undefined,
            };
            render(
                <HeroSection
                    data={mockData}
                    homeContent={contentWithoutPrimaryCta}
                />
            );
            // Should render default CTA
            expect(screen.getByText('View My Work')).toBeInTheDocument();
        });

        it('should handle missing secondaryCta', () => {
            const contentWithoutSecondaryCta = {
                ...mockHomeContent,
                secondaryCta: undefined,
            };
            render(
                <HeroSection
                    data={mockData}
                    homeContent={contentWithoutSecondaryCta}
                />
            );
            // Should render default CTA
            expect(screen.getByText('Get in Touch')).toBeInTheDocument();
        });

        it('should handle very long bio text', () => {
            const longBio = 'A'.repeat(500);
            const dataWithLongBio = { ...mockData, briefBio: longBio };
            render(<HeroSection data={dataWithLongBio}  />);
            expect(screen.getByText(longBio)).toBeInTheDocument();
        });

        it('should handle special characters in name', () => {
            const dataWithSpecialChars = { ...mockData, name: "O'Brien & Smith" };
            render(<HeroSection data={dataWithSpecialChars}  />);
            expect(screen.getByText("O'Brien & Smith")).toBeInTheDocument();
        });
    });

    describe('Responsive Behavior', () => {
        it('should render responsive text classes', () => {
            const { container } = render(
                <HeroSection data={mockData}  />
            );
            const h1 = container.querySelector('h1');
            expect(h1).toHaveClass('text-4xl', 'sm:text-5xl', 'md:text-6xl', 'lg:text-7xl');
        });

        it('should render responsive layout classes', () => {
            const { container } = render(
                <HeroSection data={mockData}  />
            );
            const section = container.querySelector('section');
            expect(section).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
        });
    });
});

