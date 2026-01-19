/**
 * Tests for ServicesSection component
 *
 * Tests the services showcase section
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ServicesSection from '../../components/ServicesSection';

// gsap is mocked globally via jest.config.js moduleNameMapper

// Mock UI components
jest.mock('@/components/ui', () => ({
  Card: React.forwardRef(function Card({ children, variant, tilt, interactive, className }, ref) {
    return (
      <div ref={ref} className={className} data-variant={variant}>
        {children}
      </div>
    );
  }),
  Badge: ({ children, variant, size }) => (
    <span data-variant={variant} data-size={size}>
      {children}
    </span>
  ),
}));

// Mock icons
jest.mock('@/components/icons', () => ({
  getServiceIcon: (key) => <svg data-testid={`icon-${key}`} />,
}));

// Mock constants
jest.mock('@/lib/utils/constants', () => ({
  COLOR_VARIANTS: {
    primary: { bg: '#f00', border: '#f00', text: '#fff' },
    accent: { bg: '#0f0', border: '#0f0', text: '#fff' },
    cool: { bg: '#00f', border: '#00f', text: '#fff' },
    secondary: { bg: '#ff0', border: '#ff0', text: '#000' },
  },
}));

describe('ServicesSection', () => {
  const mockHomeContent = {
    servicesTitle: 'My Services',
    servicesSubtitle: 'Custom subtitle for services',
    services: [
      {
        iconKey: 'computer',
        title: 'AI Consulting',
        description: 'AI consulting description',
        variant: 'primary',
      },
      {
        iconKey: 'code',
        title: 'Development',
        description: 'Development description',
        variant: 'accent',
      },
    ],
  };

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
  });

  describe('Rendering', () => {
    it('should render section with custom title', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('My Services')).toBeInTheDocument();
    });

    it('should render section with custom subtitle', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('Custom subtitle for services')).toBeInTheDocument();
    });

    it('should render all services', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('AI Consulting')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
    });

    it('should render service descriptions', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('AI consulting description')).toBeInTheDocument();
      expect(screen.getByText('Development description')).toBeInTheDocument();
    });

    it('should render service icons', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByTestId('icon-computer')).toBeInTheDocument();
      expect(screen.getByTestId('icon-code')).toBeInTheDocument();
    });

    it('should render "What I Do" badge', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('What I Do')).toBeInTheDocument();
    });
  });

  describe('Default content', () => {
    it('should use default title when not provided', () => {
      render(<ServicesSection homeContent={{}} />);
      expect(screen.getByText('AI & Engineering Services')).toBeInTheDocument();
    });

    it('should use default subtitle when not provided', () => {
      render(<ServicesSection homeContent={{}} />);
      expect(screen.getByText(/From strategy to implementation/)).toBeInTheDocument();
    });

    it('should use default services when not provided', () => {
      render(<ServicesSection />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning Systems')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should return null when services array is empty', () => {
      const emptyContent = {
        ...mockHomeContent,
        services: [],
      };
      const { container } = render(<ServicesSection homeContent={emptyContent} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper section labelling', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByRole('region', { name: /services/i })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply correct variants to cards', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      const cards = document.querySelectorAll('[data-variant]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should apply primary variant', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      const primaryCard = document.querySelector('[data-variant="primary"]');
      expect(primaryCard).toBeInTheDocument();
    });

    it('should apply accent variant', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      const accentCard = document.querySelector('[data-variant="accent"]');
      expect(accentCard).toBeInTheDocument();
    });
  });

  describe('Service icons', () => {
    it('should render correct icons for each service', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByTestId('icon-computer')).toBeInTheDocument();
      expect(screen.getByTestId('icon-code')).toBeInTheDocument();
    });

    it('should handle missing iconKey', () => {
      const contentWithMissingIcon = {
        services: [
          {
            title: 'No Icon Service',
            description: 'Service without icon',
            variant: 'primary',
          },
        ],
      };
      render(<ServicesSection homeContent={contentWithMissingIcon} />);
      expect(screen.getByText('No Icon Service')).toBeInTheDocument();
    });
  });

  describe('Grid layout', () => {
    it('should render services in a grid', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      const cards = document.querySelectorAll('[data-variant]');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle many services', () => {
      const manyServices = {
        services: Array(6).fill(null).map((_, i) => ({
          iconKey: 'code',
          title: `Service ${i + 1}`,
          description: `Description ${i + 1}`,
          variant: 'primary',
        })),
      };
      render(<ServicesSection homeContent={manyServices} />);
      const cards = document.querySelectorAll('[data-variant]');
      expect(cards.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Animations', () => {
    it('should render without animation when reduced motion preferred', () => {
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
      
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('My Services')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    it('should handle null homeContent', () => {
      render(<ServicesSection homeContent={null} />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
    });

    it('should handle undefined homeContent', () => {
      render(<ServicesSection />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
    });

    it('should handle partial homeContent', () => {
      const partial = {
        servicesTitle: 'Custom Title',
        // missing services array
      };
      render(<ServicesSection homeContent={partial} />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });
  });
});
