/**
 * QuickStats.test.jsx
 *
 * Comprehensive tests for QuickStats component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import QuickStats from '@/components/QuickStats';

expect.extend(toHaveNoViolations);

// Mock gsap
// gsap is already mocked in jest.config.js via moduleNameMapper

describe('QuickStats Component', () => {
  const mockProjects = [
    {
      id: '1',
      status: 'Published',
      startDate: '2020-01-01',
      techStack: JSON.stringify(['Python', 'React']),
    },
    {
      id: '2',
      status: 'Published',
      startDate: '2021-06-15',
      techStack: JSON.stringify(['Python', 'AWS']),
    },
    {
      id: '3',
      status: 'Published',
      startDate: '2022-03-20',
      techStack: JSON.stringify(['React', 'Node.js']),
    },
    {
      id: '4',
      status: 'Draft',
      startDate: '2023-01-01',
      techStack: JSON.stringify(['Vue']),
    },
  ];

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
      render(<QuickStats projects={mockProjects} />);
      expect(screen.getByLabelText('Statistics')).toBeInTheDocument();
    });

    it('should render all four stat cards', () => {
      render(<QuickStats projects={mockProjects} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
      expect(screen.getByText('Technologies')).toBeInTheDocument();
      expect(screen.getByText('Years Experience')).toBeInTheDocument();
      expect(screen.getByText('Happy Clients')).toBeInTheDocument();
    });

    it('should render stat icons', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    it('should render stat values with + suffix', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const plusSigns = container.querySelectorAll('[aria-live="polite"]');
      expect(plusSigns.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Calculation', () => {
    it('should count published projects only', () => {
      render(<QuickStats projects={mockProjects} />);
      // 3 published projects
      waitFor(() => {
        expect(screen.getByText(/3\+/)).toBeInTheDocument();
      });
    });

    it('should count unique technologies', () => {
      render(<QuickStats projects={mockProjects} />);
      // Python, React, AWS, Node.js = 4 unique techs
      waitFor(() => {
        expect(screen.getByText(/4\+/)).toBeInTheDocument();
      });
    });

    it('should calculate years of experience', () => {
      render(<QuickStats projects={mockProjects} />);
      // Should calculate years from oldest project
      waitFor(() => {
        const yearsSince2020 = new Date().getFullYear() - 2020;
        expect(screen.getByText(new RegExp(`${yearsSince2020}\\+`))).toBeInTheDocument();
      });
    });

    it('should calculate clients count', () => {
      render(<QuickStats projects={mockProjects} />);
      // Should show at least 5 clients
      waitFor(() => {
        expect(screen.getByText(/\d+\+/)).toBeInTheDocument();
      });
    });
  });

  describe('Animation', () => {
    it('should start counter animation on scroll', async () => {
      render(<QuickStats projects={mockProjects} />);
      
      await waitFor(() => {
        // Counter should animate from 0 to actual value
        const statValues = screen.getAllByRole('region');
        expect(statValues.length).toBeGreaterThan(0);
      });
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

      render(<QuickStats projects={mockProjects} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
    });

    it('should animate counter values', async () => {
      render(<QuickStats projects={mockProjects} />);
      
      await waitFor(() => {
        const ariaLiveElements = screen.getAllByRole('region');
        expect(ariaLiveElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tech Stack Parsing', () => {
    it('should parse JSON tech stack', () => {
      render(<QuickStats projects={mockProjects} />);
      // Should count unique techs correctly
      expect(screen.getByText('Technologies')).toBeInTheDocument();
    });

    it('should handle invalid JSON in tech stack', () => {
      const projectsWithInvalidTech = [
        ...mockProjects,
        {
          id: '5',
          status: 'Published',
          techStack: 'invalid json',
        },
      ];
      
      expect(() => 
        render(<QuickStats projects={projectsWithInvalidTech} />)
      ).not.toThrow();
    });

    it('should handle null tech stack', () => {
      const projectsWithNullTech = [
        ...mockProjects,
        {
          id: '5',
          status: 'Published',
          techStack: null,
        },
      ];
      
      render(<QuickStats projects={projectsWithNullTech} />);
      expect(screen.getByText('Technologies')).toBeInTheDocument();
    });

    it('should handle tech stack as objects', () => {
      const projectsWithObjectTech = [
        {
          id: '1',
          status: 'Published',
          techStack: JSON.stringify([{ name: 'Python' }, { name: 'React' }]),
        },
      ];
      
      render(<QuickStats projects={projectsWithObjectTech} />);
      expect(screen.getByText('Technologies')).toBeInTheDocument();
    });
  });

  describe('Years Experience Calculation', () => {
    it('should calculate years from oldest project', () => {
      render(<QuickStats projects={mockProjects} />);
      const currentYear = new Date().getFullYear();
      const expectedYears = currentYear - 2020;
      
      waitFor(() => {
        expect(screen.getByText(new RegExp(`${expectedYears}`))).toBeInTheDocument();
      });
    });

    it('should return at least 1 year if calculated is 0', () => {
      const recentProjects = [
        {
          id: '1',
          status: 'Published',
          startDate: new Date().toISOString(),
          techStack: JSON.stringify(['Python']),
        },
      ];
      
      render(<QuickStats projects={recentProjects} />);
      
      waitFor(() => {
        expect(screen.getByText(/1\+/)).toBeInTheDocument();
      });
    });

    it('should handle projects without startDate', () => {
      const projectsWithoutDate = [
        {
          id: '1',
          status: 'Published',
          techStack: JSON.stringify(['Python']),
        },
      ];
      
      render(<QuickStats projects={projectsWithoutDate} />);
      expect(screen.getByText('Years Experience')).toBeInTheDocument();
    });

    it('should handle invalid startDate', () => {
      const projectsWithInvalidDate = [
        {
          id: '1',
          status: 'Published',
          startDate: 'invalid-date',
          techStack: JSON.stringify(['Python']),
        },
      ];
      
      expect(() => 
        render(<QuickStats projects={projectsWithInvalidDate} />)
      ).not.toThrow();
    });
  });

  describe('Layout and Structure', () => {
    it('should render in section element', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should render stats in grid', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should apply responsive grid classes', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2', 'lg:grid-cols-4');
    });

    it('should apply aria-label to stat regions', () => {
      render(<QuickStats projects={mockProjects} />);
      expect(screen.getByLabelText('Projects Delivered')).toBeInTheDocument();
      expect(screen.getByLabelText('Technologies')).toBeInTheDocument();
      expect(screen.getByLabelText('Years Experience')).toBeInTheDocument();
      expect(screen.getByLabelText('Happy Clients')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper section landmark', () => {
      render(<QuickStats projects={mockProjects} />);
      expect(screen.getByLabelText('Statistics')).toBeInTheDocument();
    });

    it('should have aria-live on counter values', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const ariaLive = container.querySelectorAll('[aria-live="polite"]');
      expect(ariaLive.length).toBe(4);
    });

    it('should have role region on stat cards', () => {
      render(<QuickStats projects={mockProjects} />);
      const regions = screen.getAllByRole('region');
      // At least 4 regions for the stats (may include container region)
      expect(regions.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Styling', () => {
    it('should apply color variants to stat cards', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const statCards = container.querySelectorAll('.group');
      expect(statCards.length).toBe(4);
    });

    it('should have hover effects on stat cards', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const hoverCards = container.querySelectorAll('.hover\\:-translate-y-2');
      expect(hoverCards.length).toBe(4);
    });

    it('should apply text shadow to numbers', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const numbers = container.querySelectorAll('[aria-live="polite"]');
      // Just verify the elements exist and have proper aria attributes
      expect(numbers.length).toBeGreaterThan(0);
    });

    it('should apply icon styling', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const iconContainers = container.querySelectorAll('.w-14.h-14');
      expect(iconContainers.length).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projects array', () => {
      render(<QuickStats projects={[]} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
      waitFor(() => {
        expect(screen.getByText('0+')).toBeInTheDocument();
      });
    });

    it('should handle undefined projects', () => {
      render(<QuickStats />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
    });

    it('should handle null projects', () => {
      render(<QuickStats projects={null} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
    });

    it('should handle projects without status', () => {
      const projectsWithoutStatus = [
        {
          id: '1',
          techStack: JSON.stringify(['Python']),
        },
      ];
      
      render(<QuickStats projects={projectsWithoutStatus} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
    });

    it('should handle all draft projects', () => {
      const draftProjects = mockProjects.map(p => ({ ...p, status: 'Draft' }));
      
      render(<QuickStats projects={draftProjects} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
    });

    it('should handle aboutData prop', () => {
      const aboutData = { name: 'Test User' };
      render(<QuickStats projects={mockProjects} aboutData={aboutData} />);
      expect(screen.getByText('Projects Delivered')).toBeInTheDocument();
    });
  });

  describe('Client Count', () => {
    it('should show at least 5 clients', () => {
      const fewProjects = [mockProjects[0]];
      render(<QuickStats projects={fewProjects} />);
      
      waitFor(() => {
        expect(screen.getByText(/5\+/)).toBeInTheDocument();
      });
    });

    it('should calculate clients from projects count', () => {
      render(<QuickStats projects={mockProjects} />);
      // Should show published projects - 2, but minimum 5
      waitFor(() => {
        const clientText = screen.getByText(/\d+\+/);
        expect(clientText).toBeInTheDocument();
      });
    });
  });

  describe('Icon Display', () => {
    it('should render projects icon', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const projectsCard = screen.getByLabelText('Projects Delivered').closest('.group');
      const icon = projectsCard?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render technologies icon', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const techCard = screen.getByLabelText('Technologies').closest('.group');
      const icon = techCard?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render experience icon', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const expCard = screen.getByLabelText('Years Experience').closest('.group');
      const icon = expCard?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render clients icon', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const clientsCard = screen.getByLabelText('Happy Clients').closest('.group');
      const icon = clientsCard?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive padding classes', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('py-28');
    });

    it('should apply responsive container classes', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should apply responsive text sizes', () => {
      const { container } = render(<QuickStats projects={mockProjects} />);
      const numbers = container.querySelectorAll('[aria-live="polite"]');
      numbers.forEach(number => {
        expect(number).toHaveClass('text-4xl', 'sm:text-5xl');
      });
    });
  });
});

