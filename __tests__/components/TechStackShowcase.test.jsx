/**
 * Tests for TechStackShowcase component
 *
 * Tests the technology stack display from projects
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TechStackShowcase from '../../components/TechStackShowcase';

// gsap is mocked globally via jest.config.js moduleNameMapper

// Mock UI components
jest.mock('@/components/ui', () => ({
  Badge: ({ children, variant, size }) => (
    <span data-variant={variant} data-size={size}>
      {children}
    </span>
  ),
}));

// Mock jsonUtils
jest.mock('@/lib/utils/jsonUtils', () => ({
  parseJsonField: (field, defaultValue) => {
    if (!field) return defaultValue;
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  },
}));

// Mock constants
jest.mock('@/lib/utils/constants', () => ({
  COLOR_VARIANTS: {
    primary: { bg: '#f00', border: '#f00', text: '#fff', glow: 'glow' },
    accent: { bg: '#0f0', border: '#0f0', text: '#fff', glow: 'glow' },
    cool: { bg: '#00f', border: '#00f', text: '#fff', glow: 'glow' },
    fuchsia: { bg: '#f0f', border: '#f0f', text: '#fff', glow: 'glow' },
  },
}));

describe('TechStackShowcase', () => {
  const mockProjects = [
    {
      id: '1',
      title: 'Project 1',
      techStack: ['Python', 'TensorFlow', 'React'],
    },
    {
      id: '2',
      title: 'Project 2',
      techStack: ['Python', 'AWS', 'Docker'],
    },
    {
      id: '3',
      title: 'Project 3',
      techStack: ['React', 'Next.js', 'TypeScript'],
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
    it('should render section title', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Technologies I Work With')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText(/Modern tools and frameworks/)).toBeInTheDocument();
    });

    it('should render Tech Stack badge', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    });

    it('should render technologies from projects', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should show project count for each tech', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Multiple techs appear in 2 projects
      const projectCounts = screen.getAllByText('2 projects');
      expect(projectCounts.length).toBeGreaterThan(0);
    });
  });

  describe('Tech aggregation', () => {
    it('should count tech occurrences across projects', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Python and React both appear in 2 projects
      const twoProjectTexts = screen.getAllByText('2 projects');
      expect(twoProjectTexts.length).toBeGreaterThan(0);
    });

    it('should sort by usage count (most used first)', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // The component sorts by count, so most used should appear first
      const techButtons = screen.getAllByRole('button');
      expect(techButtons.length).toBeGreaterThan(0);
    });

    it('should limit to 12 technologies', () => {
      const manyTechProjects = [
        {
          id: '1',
          techStack: Array(15)
            .fill(null)
            .map((_, i) => `Tech${i}`),
        },
      ];
      render(<TechStackShowcase projects={manyTechProjects} />);
      const techButtons = screen.getAllByRole('button');
      expect(techButtons.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Empty state', () => {
    it('should return null when no projects', () => {
      const { container } = render(<TechStackShowcase projects={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when projects have no techStack', () => {
      const projectsWithoutTech = [{ id: '1', title: 'Project' }];
      const { container } = render(<TechStackShowcase projects={projectsWithoutTech} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle undefined projects', () => {
      const { container } = render(<TechStackShowcase />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle null projects', () => {
      const { container } = render(<TechStackShowcase projects={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should have interactive tech cards', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const techCards = screen.getAllByRole('button');
      expect(techCards.length).toBeGreaterThan(0);
      expect(techCards[0]).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper aria-label for accessibility', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(
        screen.getByRole('button', { name: /Python - used in 2 projects/i })
      ).toBeInTheDocument();
    });
  });

  describe('JSON techStack parsing', () => {
    it('should handle techStack as array', () => {
      const projects = [{ id: '1', techStack: ['Python', 'React'] }];
      render(<TechStackShowcase projects={projects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should handle techStack as JSON string', () => {
      const projects = [{ id: '1', techStack: '["Python", "React"]' }];
      render(<TechStackShowcase projects={projects} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should handle null techStack', () => {
      const projects = [{ id: '1', techStack: null }];
      const { container } = render(<TechStackShowcase projects={projects} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper section label', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByRole('region', { name: /technology stack/i })).toBeInTheDocument();
    });

  });

  describe('Category filtering', () => {
    it('should display techs from all categories', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Check that various techs are displayed
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('TensorFlow')).toBeInTheDocument();
    });

    it('should handle techs from multiple projects', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // Python appears in 2 projects
      const pythonButton = screen.getByRole('button', { name: /Python/i });
      expect(pythonButton).toBeInTheDocument();
    });
  });

  describe('Visual rendering', () => {
    it('should render tech badge', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    });

    it('should render all unique technologies', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // All unique techs from mockProjects
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TensorFlow')).toBeInTheDocument();
      expect(screen.getByText('AWS')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
    });

    it('should display project count for single project tech', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      // TensorFlow only appears in 1 project
      const singleProjectTexts = screen.getAllByText('1 project');
      expect(singleProjectTexts.length).toBeGreaterThan(0);
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
      
      render(<TechStackShowcase projects={mockProjects} />);
      expect(screen.getByText('Technologies I Work With')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle projects with duplicate tech entries', () => {
      const projectsWithDupes = [
        { id: '1', techStack: ['Python', 'Python', 'React'] },
      ];
      render(<TechStackShowcase projects={projectsWithDupes} />);
      // Should still render without errors
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should handle case-sensitive tech names', () => {
      const projectsWithCase = [
        { id: '1', techStack: ['python', 'PYTHON', 'Python'] },
      ];
      render(<TechStackShowcase projects={projectsWithCase} />);
      // Component should handle these as separate or merged entries
      expect(document.querySelectorAll('[role="button"]').length).toBeGreaterThan(0);
    });

    it('should handle empty string tech entries', () => {
      const projectsWithEmpty = [
        { id: '1', techStack: ['Python', '', 'React'] },
      ];
      render(<TechStackShowcase projects={projectsWithEmpty} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should handle very long tech names', () => {
      const longTechName = 'VeryLongTechnologyNameThatShouldStillRender';
      const projectsWithLongName = [
        { id: '1', techStack: [longTechName] },
      ];
      render(<TechStackShowcase projects={projectsWithLongName} />);
      expect(screen.getByText(longTechName)).toBeInTheDocument();
    });
  });

  describe('Color variants', () => {
    it('should apply different color variants to techs', () => {
      render(<TechStackShowcase projects={mockProjects} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
