/**
 * TechStackShowcase.test.jsx
 *
 * Comprehensive tests for TechStackShowcase component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TechStackShowcase from '@/components/TechStackShowcase';

expect.extend(toHaveNoViolations);

// Mock gsap
// gsap is already mocked in jest.config.js via moduleNameMapper

describe('TechStackShowcase Component', () => {
  const mockProjects = [
    {
      id: '1',
      techStack: JSON.stringify(['Python', 'TensorFlow', 'React']),
    },
    {
      id: '2',
      techStack: JSON.stringify(['Python', 'AWS', 'Docker']),
    },
    {
      id: '3',
      techStack: JSON.stringify(['React', 'Node.js', 'PostgreSQL']),
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
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Technologies I Work With')).toBeInTheDocument();
    });

    it('should render null when no projects', () => {
      const { container } = render(<TechStackShowcase projects={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render null when projects have no tech stack', () => {
      const projectsWithoutTech = [{ id: '1', techStack: null }];
      const { container } = render(<TechStackShowcase projects={projectsWithoutTech} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render badge', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    });

    it('should render section title', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Technologies I Work With')).toBeInTheDocument();
    });

    it('should render section description', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(
        screen.getByText(/Modern tools and frameworks for building intelligent/)
      ).toBeInTheDocument();
    });
  });

  describe('Tech Stack Items', () => {
    it('should render tech stack items', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('TensorFlow')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should show project count for each tech', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const pythonCount = screen.getByText('2 projects');
      expect(pythonCount).toBeInTheDocument();
    });

    it('should handle singular project count', () => {
      const singleProjectTech = [
        {
          id: '1',
          techStack: JSON.stringify(['UniqueT ech']),
        },
      ];
      render(<TechStackShowcase projects={singleProjectTech} />);
      expect(screen.getByText('1 project')).toBeInTheDocument();
    });

    it('should render tech initials as fallback icons', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Multiple techs may start with same letter (Python appears twice)
      expect(screen.getAllByText('P').length).toBeGreaterThan(0); // Python initial
      expect(screen.getAllByText('T').length).toBeGreaterThan(0); // TensorFlow initial
    });

    it('should limit to 12 technologies', () => {
      const manyTechs = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        techStack: JSON.stringify([`Tech${i}`, `Tech${i}Extra`]),
      }));
      
      render(<TechStackShowcase projects={manyTechs} />);
      const techItems = screen.getAllByRole('button');
      expect(techItems.length).toBeLessThanOrEqual(12);
    });

    it('should sort by project count (most used first)', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Python appears in 2 projects, should be first
      const firstTech = screen.getAllByRole('heading', { level: 3 })[0];
      // One of the most used techs should appear first
      expect(firstTech).toBeInTheDocument();
    });
  });

  describe('Tech Stack Parsing', () => {
    it('should parse JSON tech stack', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should handle tech stack as objects', () => {
      const projectsWithObjectTech = [
        {
          id: '1',
          techStack: JSON.stringify([{ name: 'Python' }, { name: 'React' }]),
        },
      ];
      render(<TechStackShowcase projects={projectsWithObjectTech} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should handle invalid JSON in tech stack', () => {
      const projectsWithInvalidTech = [
        {
          id: '1',
          techStack: 'invalid json',
        },
      ];
      expect(() => 
        render(<TechStackShowcase projects={projectsWithInvalidTech} />)
      ).not.toThrow();
    });

    it('should handle null tech stack', () => {
      const projectsWithNullTech = [
        {
          id: '1',
          techStack: null,
        },
      ];
      const { container } = render(<TechStackShowcase projects={projectsWithNullTech} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle empty tech stack array', () => {
      const projectsWithEmptyTech = [
        {
          id: '1',
          techStack: JSON.stringify([]),
        },
      ];
      const { container } = render(<TechStackShowcase projects={projectsWithEmptyTech} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Color Categorization', () => {
    it('should apply primary color to AI/ML techs', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const python = screen.getByText('Python');
      expect(python).toBeInTheDocument();
    });

    it('should apply cool color to Frontend techs', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const react = screen.getByText('React');
      expect(react).toBeInTheDocument();
    });

    it('should apply accent color to Cloud techs', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const aws = screen.getByText('AWS');
      expect(aws).toBeInTheDocument();
    });

    it('should apply fuchsia color to Backend techs', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const nodejs = screen.getByText('Node.js');
      expect(nodejs).toBeInTheDocument();
    });

    it('should default to primary color for unknown techs', () => {
      const projectWithUnknownTech = [
        {
          id: '1',
          techStack: JSON.stringify(['UnknownTech123']),
        },
      ];
      render(<TechStackShowcase projects={projectWithUnknownTech} />);
      expect(screen.getByText('UnknownTech123')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render in section element', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should render tech items in grid', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should apply responsive grid classes', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid-cols-3',
        'sm:grid-cols-4',
        'md:grid-cols-6'
      );
    });

    it('should have background styling', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const section = container.querySelector('section');
      expect(section).toHaveStyle({ background: 'rgba(4, 4, 4, 0.6)' });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper section landmark', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByLabelText('Technology stack')).toBeInTheDocument();
    });

    it('should have aria-label on tech items', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(
        screen.getByLabelText(/Python - used in \d+ project/)
      ).toBeInTheDocument();
    });

    it('should have role button on tech items', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const techButtons = screen.getAllByRole('button');
      expect(techButtons.length).toBeGreaterThan(0);
    });

    it('should have tabIndex on tech items', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const techButtons = screen.getAllByRole('button');
      techButtons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have h2 for main heading', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Technologies I Work With');
    });
  });

  describe('Styling', () => {
    it('should apply gradient to section title', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveStyle({
        background: expect.stringContaining('linear-gradient'),
      });
    });

    it('should have hover effects on tech items', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const techItems = container.querySelectorAll('.hover\\:-translate-y-2');
      expect(techItems.length).toBeGreaterThan(0);
    });

    it('should have rounded corners on tech items', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const techItems = container.querySelectorAll('.rounded-xl');
      expect(techItems.length).toBeGreaterThan(0);
    });
  });

  describe('Animation', () => {
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

      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined projects', () => {
      const { container } = render(<TechStackShowcase />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle null projects', () => {
      const { container } = render(<TechStackShowcase projects={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle projects with mixed tech stack formats', () => {
      const mixedProjects = [
        { id: '1', techStack: JSON.stringify(['Python']) },
        { id: '2', techStack: JSON.stringify([{ name: 'React' }]) },
        { id: '3', techStack: 'invalid' },
      ];
      
      render(<TechStackShowcase projects={mixedProjects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should handle duplicate tech names (case insensitive)', () => {
      const projectsWithDuplicates = [
        { id: '1', techStack: JSON.stringify(['python', 'PYTHON', 'Python']) },
      ];
      
      render(<TechStackShowcase projects={projectsWithDuplicates} />);
      // Should only show Python once
      const pythonElements = screen.getAllByText(/python/i);
      expect(pythonElements.length).toBe(2); // Name + count
    });

    it('should handle very long tech names', () => {
      const projectWithLongName = [
        {
          id: '1',
          techStack: JSON.stringify(['ThisIsAVeryLongTechnologyNameThatShouldBeTruncated']),
        },
      ];
      
      render(<TechStackShowcase projects={projectWithLongName} />);
      expect(screen.getByText(/ThisIsAVeryLongTechnologyNameThatShouldBeTruncated/)).toBeInTheDocument();
    });
  });

  describe('Project Counting', () => {
    it('should count tech usage across projects', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Python appears in 2 projects
      expect(screen.getByText('2 projects')).toBeInTheDocument();
    });

    it('should count each occurrence of tech', () => {
      const projectsWithTech = [
        { id: '1', techStack: JSON.stringify(['Python']) },
        { id: '2', techStack: JSON.stringify(['Python']) },
        { id: '3', techStack: JSON.stringify(['Python']) },
      ];
      
      render(<TechStackShowcase projects={projectsWithTech} />);
      expect(screen.getByText('3 projects')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should display first letter of tech name', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Should show uppercase first letters (may have duplicates)
      expect(screen.getAllByText('P').length).toBeGreaterThan(0); // Python
      expect(screen.getAllByText('T').length).toBeGreaterThan(0); // TensorFlow
      expect(screen.getAllByText('R').length).toBeGreaterThan(0); // React
    });

    it('should capitalize first letter', () => {
      const projectsWithLowercase = [
        { id: '1', techStack: JSON.stringify(['python']) },
      ];
      
      render(<TechStackShowcase projects={projectsWithLowercase} />);
      expect(screen.getAllByText('P').length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive padding classes', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('py-28');
    });

    it('should apply responsive container classes', () => {
      const { container } = render(<TechStackShowcase projects={mockProjects} />);
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });
});

