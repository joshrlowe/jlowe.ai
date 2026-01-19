/**
 * Tests for pages/index.jsx
 *
 * Tests home page component and conditional rendering
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../pages/index';

// Mock all child components
jest.mock('next/dynamic', () => (loader) => {
  const DynamicComponent = (props) => {
    if (loader.toString().includes('GitHubContributionGraph')) {
      return <div data-testid="github-graph">{props.username}</div>;
    }
    if (loader.toString().includes('SpaceBackground')) {
      return <div data-testid="space-background" />;
    }
    return null;
  };
  return DynamicComponent;
});

jest.mock('@/components/SEO', () => {
  return function SEO({ title, description }) {
    return <div data-testid="seo" data-title={title} data-description={description} />;
  };
});

jest.mock('@/components/HeroSection', () => {
  return function HeroSection({ data, homeContent }) {
    return (
      <div data-testid="hero-section">
        <span data-testid="hero-name">{data?.name}</span>
        <span data-testid="hero-title">{homeContent?.heroTitle}</span>
      </div>
    );
  };
});

jest.mock('@/components/FeaturedProjects', () => {
  return function FeaturedProjects({ projects }) {
    return (
      <div data-testid="featured-projects">
        <span data-testid="project-count">{projects.length}</span>
      </div>
    );
  };
});

jest.mock('@/components/RecentActivity', () => {
  return function RecentActivity({ projects, articles }) {
    return (
      <div data-testid="recent-activity">
        <span data-testid="activity-count">{projects.length + articles.length}</span>
      </div>
    );
  };
});

jest.mock('@/components/ServicesSection', () => {
  return function ServicesSection({ homeContent }) {
    return (
      <div data-testid="services-section">
        <span data-testid="services-title">{homeContent?.servicesTitle}</span>
      </div>
    );
  };
});

jest.mock('@/components/QuickStats', () => {
  return function QuickStats({ projects, aboutData }) {
    return <div data-testid="quick-stats">{projects.length} projects</div>;
  };
});

jest.mock('@/components/TechStackShowcase', () => {
  return function TechStackShowcase({ projects }) {
    return <div data-testid="tech-stack" />;
  };
});

describe('Home Page', () => {
  const defaultProps = {
    welcomeData: {
      name: 'Josh Lowe',
      briefBio: 'AI Engineer',
      callToAction: 'Building AI',
    },
    projects: [
      { id: '1', title: 'Project 1', status: 'Published' },
      { id: '2', title: 'Project 2', status: 'Published' },
    ],
    aboutData: { yearsExperience: 8 },
    contactData: { email: 'josh@jlowe.ai' },
    resources: [
      { id: '1', title: 'Article 1' },
    ],
    homeContent: {
      heroTitle: 'intelligent AI systems',
      servicesTitle: 'Services',
      githubSectionTitle: 'GitHub',
    },
    githubUsername: 'joshrlowe',
    enabledSections: ['hero', 'welcome', 'projects', 'stats', 'articles'],
  };

  describe('SEO', () => {
    it('should render SEO component with correct meta', () => {
      render(<Home {...defaultProps} />);

      const seo = screen.getByTestId('seo');
      expect(seo).toHaveAttribute('data-title', 'Josh Lowe - AI/ML Engineer | Portfolio');
    });

    it('should use welcomeData bio for description', () => {
      render(<Home {...defaultProps} />);

      const seo = screen.getByTestId('seo');
      expect(seo).toHaveAttribute('data-description', 'AI Engineer');
    });

    it('should use fallback description when welcomeData is missing', () => {
      render(<Home {...defaultProps} welcomeData={null} />);

      const seo = screen.getByTestId('seo');
      expect(seo.getAttribute('data-description')).toContain('AI/ML Engineer');
    });
  });

  describe('Section rendering', () => {
    it('should render hero section when enabled', () => {
      render(<Home {...defaultProps} />);
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should not render hero section when disabled', () => {
      render(<Home {...defaultProps} enabledSections={['welcome', 'projects']} />);
      expect(screen.queryByTestId('hero-section')).not.toBeInTheDocument();
    });

    it('should render featured projects when enabled', () => {
      render(<Home {...defaultProps} />);
      expect(screen.getByTestId('featured-projects')).toBeInTheDocument();
    });

    it('should not render featured projects when disabled', () => {
      render(<Home {...defaultProps} enabledSections={['hero', 'welcome']} />);
      expect(screen.queryByTestId('featured-projects')).not.toBeInTheDocument();
    });

    it('should render recent activity when articles enabled', () => {
      render(<Home {...defaultProps} />);
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    });

    it('should not render recent activity when disabled', () => {
      render(<Home {...defaultProps} enabledSections={['hero', 'welcome', 'projects']} />);
      expect(screen.queryByTestId('recent-activity')).not.toBeInTheDocument();
    });

    it('should render services when enabled', () => {
      render(<Home {...defaultProps} enabledSections={['services']} />);
      expect(screen.getByTestId('services-section')).toBeInTheDocument();
    });

    it('should not render services by default (not in default sections)', () => {
      render(<Home {...defaultProps} />);
      expect(screen.queryByTestId('services-section')).not.toBeInTheDocument();
    });

    it('should render stats when enabled', () => {
      render(<Home {...defaultProps} />);
      expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
      expect(screen.getByTestId('tech-stack')).toBeInTheDocument();
    });

    it('should not render stats when disabled', () => {
      render(<Home {...defaultProps} enabledSections={['hero']} />);
      expect(screen.queryByTestId('quick-stats')).not.toBeInTheDocument();
    });
  });

  describe('Data handling', () => {
    it('should handle null projects gracefully', () => {
      render(<Home {...defaultProps} projects={null} />);
      expect(screen.getByTestId('project-count')).toHaveTextContent('0');
    });

    it('should handle null resources gracefully', () => {
      render(<Home {...defaultProps} resources={null} />);
      // Recent activity should show only project count
      expect(screen.getByTestId('activity-count')).toHaveTextContent('2');
    });

    it('should pass correct project count to FeaturedProjects', () => {
      render(<Home {...defaultProps} />);
      expect(screen.getByTestId('project-count')).toHaveTextContent('2');
    });

    it('should pass home content to hero section', () => {
      render(<Home {...defaultProps} />);
      expect(screen.getByTestId('hero-title')).toHaveTextContent('intelligent AI systems');
    });
  });

  describe('Default enabled sections', () => {
    it('should use default sections when not provided', () => {
      const propsWithoutSections = { ...defaultProps };
      delete propsWithoutSections.enabledSections;

      render(<Home {...propsWithoutSections} />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('featured-projects')).toBeInTheDocument();
    });
  });
});

