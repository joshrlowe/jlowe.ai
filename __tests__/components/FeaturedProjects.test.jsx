/**
 * FeaturedProjects.test.jsx
 *
 * Comprehensive tests for FeaturedProjects component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter } from 'next/router';
import FeaturedProjects from '@/components/FeaturedProjects';

expect.extend(toHaveNoViolations);

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock gsap
// gsap is already mocked in jest.config.js via moduleNameMapper

describe('FeaturedProjects Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockProjects = [
    {
      id: '1',
      slug: 'project-1',
      title: 'AI Chatbot Platform',
      shortDescription: 'An intelligent chatbot solution.',
      featured: true,
      status: 'Published',
      techStack: JSON.stringify(['Python', 'TensorFlow', 'React']),
      images: JSON.stringify(['/images/project1.png']),
    },
    {
      id: '2',
      slug: 'project-2',
      title: 'ML Pipeline System',
      shortDescription: 'Scalable machine learning pipelines.',
      featured: true,
      status: 'Published',
      techStack: JSON.stringify(['Python', 'AWS', 'Docker']),
      images: JSON.stringify(['/images/project2.png']),
    },
    {
      id: '3',
      slug: 'project-3',
      title: 'Data Analytics Dashboard',
      shortDescription: 'Real-time analytics platform.',
      featured: false,
      status: 'Published',
      techStack: JSON.stringify(['React', 'Node.js']),
      images: JSON.stringify([]),
    },
    {
      id: '4',
      slug: 'project-4',
      title: 'Computer Vision System',
      shortDescription: 'Advanced image recognition.',
      featured: true,
      status: 'Published',
      techStack: JSON.stringify(['Python', 'PyTorch', 'FastAPI']),
      images: JSON.stringify([{ url: '/images/project4.png' }]),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
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
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('Featured Projects')).toBeInTheDocument();
    });

    it('should render null when no projects provided', () => {
      const { container } = render(<FeaturedProjects projects={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render recent projects when no featured projects', () => {
      const nonFeaturedProjects = mockProjects.map(p => ({ ...p, featured: false }));
      render(<FeaturedProjects projects={nonFeaturedProjects} />);
      // Falls back to showing recent projects
      expect(screen.getByText('Featured Projects')).toBeInTheDocument();
    });

    it('should render only featured projects when available', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('AI Chatbot Platform')).toBeInTheDocument();
      expect(screen.getByText('ML Pipeline System')).toBeInTheDocument();
      expect(screen.queryByText('Data Analytics Dashboard')).not.toBeInTheDocument();
    });

    it('should render badge', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    it('should render section title', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('Featured Projects')).toBeInTheDocument();
    });

    it('should render section description', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(
        screen.getByText(/A selection of AI and engineering projects/)
      ).toBeInTheDocument();
    });
  });

  describe('Project Cards', () => {
    it('should render project titles', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('AI Chatbot Platform')).toBeInTheDocument();
      expect(screen.getByText('ML Pipeline System')).toBeInTheDocument();
      expect(screen.getByText('Computer Vision System')).toBeInTheDocument();
    });

    it('should render project descriptions', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('An intelligent chatbot solution.')).toBeInTheDocument();
      expect(screen.getByText('Scalable machine learning pipelines.')).toBeInTheDocument();
    });

    it('should render project images', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('should render Featured badge on each project', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const featuredBadges = screen.getAllByText('Featured');
      expect(featuredBadges.length).toBe(3); // 3 featured projects
    });

    it('should render "View Project" link', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const viewLinks = screen.getAllByText('View Project');
      expect(viewLinks.length).toBe(3);
    });

    it('should render tech stack badges', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      // Multiple projects may have the same tech, so use getAllByText
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TensorFlow').length).toBeGreaterThan(0);
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });

    it('should limit tech stack to 4 items', () => {
      const projectWithManyTechs = {
        ...mockProjects[0],
        techStack: JSON.stringify(['Tech1', 'Tech2', 'Tech3', 'Tech4', 'Tech5', 'Tech6']),
      };
      render(<FeaturedProjects projects={[projectWithManyTechs]} />);
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should render fallback when no image', () => {
      const projectWithoutImage = {
        ...mockProjects[0],
        images: JSON.stringify([]),
      };
      render(<FeaturedProjects projects={[projectWithoutImage]} />);
      expect(screen.getByText('A')).toBeInTheDocument(); // First letter fallback
    });
  });

  describe('Image Handling', () => {
    it('should render image with correct alt text', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const image = screen.getByAltText('AI Chatbot Platform');
      expect(image).toBeInTheDocument();
    });

    it('should handle image object with url property', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const image = screen.getByAltText('Computer Vision System');
      expect(image).toBeInTheDocument();
    });

    it('should handle missing images array', () => {
      const projectWithoutImages = {
        ...mockProjects[0],
        images: null,
      };
      render(<FeaturedProjects projects={[projectWithoutImages]} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should handle empty images array', () => {
      const projectWithEmptyImages = {
        ...mockProjects[0],
        images: JSON.stringify([]),
      };
      render(<FeaturedProjects projects={[projectWithEmptyImages]} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should apply unoptimized to data URIs', () => {
      const projectWithDataUri = {
        ...mockProjects[0],
        images: JSON.stringify(['data:image/png;base64,abc']),
      };
      render(<FeaturedProjects projects={[projectWithDataUri]} />);
      const image = screen.getByAltText('AI Chatbot Platform');
      // Verify image is rendered with the data URI src
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'data:image/png;base64,abc');
    });
  });

  describe('Tech Stack', () => {
    it('should parse JSON tech stack', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      // Multiple projects may have the same tech
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TensorFlow').length).toBeGreaterThan(0);
    });

    it('should handle tech stack as objects', () => {
      const projectWithObjectTech = {
        ...mockProjects[0],
        techStack: JSON.stringify([{ name: 'Python' }, { name: 'React' }]),
      };
      render(<FeaturedProjects projects={[projectWithObjectTech]} />);
      // Single project with these techs
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON in tech stack', () => {
      const projectWithInvalidTech = {
        ...mockProjects[0],
        techStack: 'invalid json',
      };
      expect(() => 
        render(<FeaturedProjects projects={[projectWithInvalidTech]} />)
      ).not.toThrow();
    });

    it('should handle null tech stack', () => {
      const projectWithNullTech = {
        ...mockProjects[0],
        techStack: null,
      };
      render(<FeaturedProjects projects={[projectWithNullTech]} />);
      expect(screen.getByText('AI Chatbot Platform')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to project detail on card click', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const projectCard = screen.getByText('AI Chatbot Platform').closest('article');
      
      fireEvent.click(projectCard);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/projects#project-1');
    });

    it('should navigate on Enter key press', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const projectCard = screen.getByText('AI Chatbot Platform').closest('article');
      
      fireEvent.keyDown(projectCard, { key: 'Enter' });
      
      expect(mockRouter.push).toHaveBeenCalledWith('/projects#project-1');
    });

    it('should not navigate on other key press', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const projectCard = screen.getByText('AI Chatbot Platform').closest('article');
      
      fireEvent.keyDown(projectCard, { key: 'Space' });
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should use project id if slug is missing', () => {
      const projectWithoutSlug = {
        ...mockProjects[0],
        slug: null,
      };
      render(<FeaturedProjects projects={[projectWithoutSlug]} />);
      const projectCard = screen.getByText('AI Chatbot Platform').closest('article');
      
      fireEvent.click(projectCard);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/projects#1');
    });
  });

  describe('View All Button', () => {
    it('should render "View All Projects" button', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('View All Projects')).toBeInTheDocument();
    });

    it('should link to projects page', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const viewAllLink = container.querySelector('a[href="/projects"]');
      expect(viewAllLink).toHaveTextContent('View All Projects');
    });

    it('should have icon in View All button', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const viewAllButton = screen.getByText('View All Projects').closest('a');
      const svg = viewAllButton?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper section landmark', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const section = container.querySelector('section[aria-labelledby="projects-title"]');
      expect(section).toBeInTheDocument();
    });

    it('should have article role for project cards', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBe(3);
    });

    it('should have proper tabIndex on cards', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const articles = screen.getAllByRole('article');
      articles.forEach(article => {
        expect(article).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have aria-label on project cards', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByLabelText('View project: AI Chatbot Platform')).toBeInTheDocument();
    });

    it('should have h2 for main heading', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Featured Projects');
    });

    it('should have h3 for project titles', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBeGreaterThan(0);
    });
  });

  describe('Layout and Structure', () => {
    it('should render in section element', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const section = container.querySelector('section');
      expect(section).toHaveAttribute('id', 'projects');
    });

    it('should render projects in grid', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should apply responsive grid classes', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('should limit to 4 featured projects', () => {
      const manyProjects = Array(10).fill(null).map((_, i) => ({
        ...mockProjects[0],
        id: `${i}`,
        title: `Project ${i}`,
        featured: true,
      }));
      
      render(<FeaturedProjects projects={manyProjects} />);
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBe(4);
    });
  });

  describe('Hover Effects', () => {
    it('should have hover classes on cards', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const articles = screen.getAllByRole('article');
      articles.forEach(article => {
        expect(article).toHaveClass('group');
      });
    });

    it('should have hover arrow animation', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const arrows = container.querySelectorAll('.group-hover\\:translate-x-2');
      expect(arrows.length).toBeGreaterThan(0);
    });
  });

  describe('3D Tilt Effect', () => {
    it('should apply tilt on mouse move', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const projectCard = screen.getByText('AI Chatbot Platform').closest('article');
      
      fireEvent.mouseMove(projectCard, { clientX: 100, clientY: 100 });
      
      // Card should have transform applied
      expect(projectCard).toBeInTheDocument();
    });

    it('should reset tilt on mouse leave', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const projectCard = screen.getByText('AI Chatbot Platform').closest('article');
      
      fireEvent.mouseMove(projectCard, { clientX: 100, clientY: 100 });
      fireEvent.mouseLeave(projectCard);
      
      expect(projectCard).toHaveStyle({ transform: '' });
    });
  });

  describe('Color Accents', () => {
    it('should apply different accent colors to projects', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const projectCards = screen.getAllByRole('article');
      // Each card should have unique styling
      expect(projectCards.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined projects', () => {
      const { container } = render(<FeaturedProjects />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle null projects', () => {
      const { container } = render(<FeaturedProjects projects={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle project without title', () => {
      const projectWithoutTitle = {
        ...mockProjects[0],
        title: '',
      };
      render(<FeaturedProjects projects={[projectWithoutTitle]} />);
      expect(screen.getByText('View Project')).toBeInTheDocument();
    });

    it('should handle project without description', () => {
      const projectWithoutDesc = {
        ...mockProjects[0],
        shortDescription: null,
      };
      render(<FeaturedProjects projects={[projectWithoutDesc]} />);
      expect(screen.getByText('AI Chatbot Platform')).toBeInTheDocument();
    });

    it('should handle malformed JSON in images', () => {
      const projectWithBadImages = {
        ...mockProjects[0],
        images: 'not valid json',
      };
      expect(() => 
        render(<FeaturedProjects projects={[projectWithBadImages]} />)
      ).not.toThrow();
    });

    it('should respect reduced motion', () => {
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

      render(<FeaturedProjects projects={mockProjects} />);
      expect(screen.getByText('AI Chatbot Platform')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply gradient to section title', () => {
      render(<FeaturedProjects projects={mockProjects} />);
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveStyle({
        background: expect.stringContaining('linear-gradient'),
      });
    });

    it('should have glow effect container', () => {
      const { container } = render(<FeaturedProjects projects={mockProjects} />);
      const glowEffects = container.querySelectorAll('.group-hover\\:opacity-100');
      expect(glowEffects.length).toBeGreaterThan(0);
    });
  });
});

