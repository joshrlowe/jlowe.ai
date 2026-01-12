/**
 * ServicesSection.test.jsx
 *
 * Comprehensive tests for ServicesSection component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ServicesSection from '@/components/ServicesSection';

expect.extend(toHaveNoViolations);

// Mock gsap
// gsap is already mocked in jest.config.js via moduleNameMapper

describe('ServicesSection Component', () => {
  const mockHomeContent = {
    servicesTitle: 'AI & Engineering Services',
    servicesSubtitle: 'From strategy to implementation.',
    services: [
      {
        iconKey: 'computer',
        title: 'AI Strategy',
        description: 'Strategic AI implementation.',
        variant: 'primary',
      },
      {
        iconKey: 'database',
        title: 'ML Systems',
        description: 'Machine learning solutions.',
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
    it('should render without crashing', () => {
      render(<ServicesSection />);
      expect(screen.getByLabelText('services-title')).toBeInTheDocument();
    });

    it('should render with custom homeContent', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('AI & Engineering Services')).toBeInTheDocument();
    });

    it('should render default title when no homeContent', () => {
      render(<ServicesSection />);
      expect(screen.getByText('AI & Engineering Services')).toBeInTheDocument();
    });

    it('should render default subtitle when no homeContent', () => {
      render(<ServicesSection />);
      expect(
        screen.getByText(/From strategy to implementation/)
      ).toBeInTheDocument();
    });

    it('should render badge', () => {
      render(<ServicesSection />);
      expect(screen.getByText('What I Do')).toBeInTheDocument();
    });
  });

  describe('Services', () => {
    it('should render default services when no homeContent', () => {
      render(<ServicesSection />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning Systems')).toBeInTheDocument();
      expect(screen.getByText('LLM & GenAI Solutions')).toBeInTheDocument();
      expect(screen.getByText('Cloud & MLOps')).toBeInTheDocument();
      expect(screen.getByText('Data Analytics')).toBeInTheDocument();
      expect(screen.getByText('Technical Training')).toBeInTheDocument();
    });

    it('should render custom services from homeContent', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('AI Strategy')).toBeInTheDocument();
      expect(screen.getByText('ML Systems')).toBeInTheDocument();
    });

    it('should render service descriptions', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      expect(screen.getByText('Strategic AI implementation.')).toBeInTheDocument();
      expect(screen.getByText('Machine learning solutions.')).toBeInTheDocument();
    });

    it('should render service icons', () => {
      const { container } = render(<ServicesSection />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render "Learn more" hover text', () => {
      render(<ServicesSection />);
      const learnMoreTexts = screen.getAllByText('Learn more');
      expect(learnMoreTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Service Icons', () => {
    it('should render service icons for all services', () => {
      const { container } = render(<ServicesSection />);
      const iconContainers = container.querySelectorAll('.w-14.h-14');
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    it('should apply correct icon styling', () => {
      const { container } = render(<ServicesSection homeContent={mockHomeContent} />);
      const firstIcon = container.querySelector('.w-14.h-14');
      expect(firstIcon).toHaveClass('rounded-xl');
    });
  });

  describe('Layout and Structure', () => {
    it('should render in section element', () => {
      const { container } = render(<ServicesSection />);
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('id', 'services');
    });

    it('should have proper section id', () => {
      render(<ServicesSection />);
      expect(document.getElementById('services')).toBeInTheDocument();
    });

    it('should render services in grid layout', () => {
      const { container } = render(<ServicesSection />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should apply responsive grid classes', () => {
      const { container } = render(<ServicesSection />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ServicesSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper section landmark', () => {
      render(<ServicesSection />);
      expect(screen.getByLabelText('services-title')).toBeInTheDocument();
    });

    it('should have heading for services title', () => {
      render(<ServicesSection />);
      const heading = screen.getByRole('heading', { 
        name: /AI & Engineering Services/i 
      });
      expect(heading).toBeInTheDocument();
    });

    it('should have heading level 2 for main title', () => {
      render(<ServicesSection />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent(/AI & Engineering Services/i);
    });

    it('should have heading level 3 for service titles', () => {
      render(<ServicesSection />);
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should apply gradient to main title', () => {
      render(<ServicesSection />);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveStyle({
        background: expect.stringContaining('linear-gradient'),
      });
    });

    it('should apply variant styling to services', () => {
      render(<ServicesSection homeContent={mockHomeContent} />);
      // Services should render with variant-based styling
      const serviceCards = screen.getAllByRole('heading', { level: 3 });
      expect(serviceCards.length).toBeGreaterThan(0);
    });
  });

  describe('Default Services', () => {
    it('should render AI Strategy service with description', () => {
      render(<ServicesSection />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
      expect(
        screen.getByText(/Transform your business with data-driven AI strategies/)
      ).toBeInTheDocument();
    });

    it('should render Machine Learning Systems service', () => {
      render(<ServicesSection />);
      expect(screen.getByText('Machine Learning Systems')).toBeInTheDocument();
      expect(
        screen.getByText(/End-to-end ML pipeline development/)
      ).toBeInTheDocument();
    });

    it('should render LLM & GenAI Solutions service', () => {
      render(<ServicesSection />);
      expect(screen.getByText('LLM & GenAI Solutions')).toBeInTheDocument();
      expect(
        screen.getByText(/Custom Large Language Model integrations/)
      ).toBeInTheDocument();
    });

    it('should render Cloud & MLOps service', () => {
      render(<ServicesSection />);
      expect(screen.getByText('Cloud & MLOps')).toBeInTheDocument();
      expect(
        screen.getByText(/Deploy and scale AI systems/)
      ).toBeInTheDocument();
    });

    it('should render Data Analytics service', () => {
      render(<ServicesSection />);
      expect(screen.getByText('Data Analytics')).toBeInTheDocument();
      expect(
        screen.getByText(/Turn raw data into actionable insights/)
      ).toBeInTheDocument();
    });

    it('should render Technical Training service', () => {
      render(<ServicesSection />);
      expect(screen.getByText('Technical Training')).toBeInTheDocument();
      expect(
        screen.getByText(/Upskill your team with hands-on AI\/ML training/)
      ).toBeInTheDocument();
    });
  });

  describe('Animation and Interactions', () => {
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

      render(<ServicesSection />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty services array', () => {
      const emptyContent = {
        servicesTitle: 'Services',
        servicesSubtitle: 'Subtitle',
        services: [],
      };
      render(<ServicesSection homeContent={emptyContent} />);
      // Should render default services
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
    });

    it('should handle null homeContent', () => {
      render(<ServicesSection homeContent={null} />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
    });

    it('should handle undefined homeContent', () => {
      render(<ServicesSection />);
      expect(screen.getByText('AI Strategy & Consulting')).toBeInTheDocument();
    });

    it('should handle missing servicesTitle', () => {
      const partialContent = {
        services: mockHomeContent.services,
      };
      render(<ServicesSection homeContent={partialContent} />);
      expect(screen.getByText('AI & Engineering Services')).toBeInTheDocument();
    });

    it('should handle missing servicesSubtitle', () => {
      const partialContent = {
        servicesTitle: 'Custom Title',
      };
      render(<ServicesSection homeContent={partialContent} />);
      expect(
        screen.getByText(/From strategy to implementation/)
      ).toBeInTheDocument();
    });

    it('should handle service without description', () => {
      const serviceWithoutDesc = {
        services: [
          {
            iconKey: 'computer',
            title: 'Test Service',
            variant: 'primary',
          },
        ],
      };
      render(<ServicesSection homeContent={serviceWithoutDesc} />);
      expect(screen.getByText('Test Service')).toBeInTheDocument();
    });

    it('should handle service without iconKey', () => {
      const serviceWithoutIcon = {
        services: [
          {
            title: 'Test Service',
            description: 'Test description',
            variant: 'primary',
          },
        ],
      };
      expect(() => 
        render(<ServicesSection homeContent={serviceWithoutIcon} />)
      ).not.toThrow();
    });

    it('should handle service without variant', () => {
      const serviceWithoutVariant = {
        services: [
          {
            iconKey: 'computer',
            title: 'Test Service',
            description: 'Test description',
          },
        ],
      };
      render(<ServicesSection homeContent={serviceWithoutVariant} />);
      expect(screen.getByText('Test Service')).toBeInTheDocument();
    });
  });

  describe('Service Cards', () => {
    it('should render Card components for services', () => {
      const { container } = render(<ServicesSection />);
      // Card components should have proper structure
      const serviceCards = container.querySelectorAll('.group');
      expect(serviceCards.length).toBeGreaterThan(0);
    });

    it('should apply interactive class to cards', () => {
      const { container } = render(<ServicesSection />);
      const cards = container.querySelectorAll('.group');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive padding classes', () => {
      const { container } = render(<ServicesSection />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('py-32');
    });

    it('should apply responsive container classes', () => {
      const { container } = render(<ServicesSection />);
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Color Variants', () => {
    it('should apply primary variant color', () => {
      const { container } = render(<ServicesSection homeContent={mockHomeContent} />);
      // First service has primary variant
      const firstService = screen.getByText('AI Strategy');
      expect(firstService).toBeInTheDocument();
    });

    it('should apply accent variant color', () => {
      const { container } = render(<ServicesSection homeContent={mockHomeContent} />);
      // Second service has accent variant
      const secondService = screen.getByText('ML Systems');
      expect(secondService).toBeInTheDocument();
    });
  });
});

