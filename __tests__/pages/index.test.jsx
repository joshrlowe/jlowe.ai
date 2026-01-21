/**
 * Tests for pages/index.jsx
 *
 * Tests home page component and conditional rendering
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home, { getStaticProps } from '../../pages/index';
import prisma from '../../lib/prisma';

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

// Mock fetch for useEffect that fetches enabled sections
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ enabledSections: ['hero', 'welcome', 'projects', 'stats', 'articles'] }),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
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

describe('getStaticProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return all page data', async () => {
    prisma.welcome.findFirst.mockResolvedValue({
      id: '1',
      name: 'Josh Lowe',
      briefBio: 'AI Engineer',
      callToAction: 'Building AI',
      createdAt: new Date(),
    });

    prisma.project.findMany.mockResolvedValue([
      {
        id: '1',
        title: 'Project 1',
        status: 'Published',
        startDate: new Date('2024-01-01'),
        releaseDate: null,
        teamMembers: [],
      },
    ]);

    prisma.about.findFirst.mockResolvedValue({
      id: '1',
      yearsExperience: 8,
      createdAt: new Date(),
    });

    prisma.contact.findFirst.mockResolvedValue({
      id: '1',
      socialMediaLinks: { github: 'https://github.com/joshrlowe' },
      createdAt: new Date(),
    });

    prisma.post.findMany.mockResolvedValue([
      { id: '1', title: 'Article 1', status: 'Published' },
    ]);

    prisma.pageContent.findUnique.mockResolvedValue({
      pageKey: 'home',
      content: { heroTitle: 'Custom Hero' },
    });

    prisma.siteSettings.findFirst.mockResolvedValue({
      enabledSections: ['hero', 'projects'],
    });

    const result = await getStaticProps();

    expect(result.props.welcomeData.name).toBe('Josh Lowe');
    expect(result.props.projects).toHaveLength(1);
    expect(result.props.aboutData.yearsExperience).toBe(8);
    expect(result.props.githubUsername).toBe('joshrlowe');
    expect(result.props.enabledSections).toEqual(['hero', 'projects']);
    expect(result.props.homeContent.heroTitle).toBe('Custom Hero');
    expect(result.revalidate).toBe(60);
  });

  it('should use default enabled sections when not set', async () => {
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.project.findMany.mockResolvedValue([]);
    prisma.about.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    prisma.pageContent.findUnique.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.enabledSections).toEqual(['hero', 'welcome', 'projects', 'stats', 'articles']);
  });

  it('should use default homeContent when not set', async () => {
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.project.findMany.mockResolvedValue([]);
    prisma.about.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    prisma.pageContent.findUnique.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.homeContent.typingIntro).toBe('I build...');
    expect(result.props.homeContent.heroTitle).toBe('intelligent AI systems');
    expect(result.props.homeContent.services).toHaveLength(6);
  });

  it('should use default github username when not in contact data', async () => {
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.project.findMany.mockResolvedValue([]);
    prisma.about.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue({
      id: '1',
      socialMediaLinks: {},
      createdAt: new Date(),
    });
    prisma.post.findMany.mockResolvedValue([]);
    prisma.pageContent.findUnique.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.githubUsername).toBe('joshrlowe');
  });

  it('should handle database errors gracefully', async () => {
    prisma.welcome.findFirst.mockRejectedValue(new Error('Database error'));

    const result = await getStaticProps();

    expect(result.props.welcomeData).toBeNull();
    expect(result.props.projects).toEqual([]);
    expect(result.props.enabledSections).toEqual(['hero', 'welcome', 'projects', 'stats', 'articles']);
    expect(result.revalidate).toBe(60);
  });

  it('should extract github username from full URL', async () => {
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.project.findMany.mockResolvedValue([]);
    prisma.about.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue({
      id: '1',
      socialMediaLinks: { github: 'https://github.com/customuser' },
      createdAt: new Date(),
    });
    prisma.post.findMany.mockResolvedValue([]);
    prisma.pageContent.findUnique.mockResolvedValue(null);
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.githubUsername).toBe('customuser');
  });

  it('should merge custom content with defaults', async () => {
    prisma.welcome.findFirst.mockResolvedValue(null);
    prisma.project.findMany.mockResolvedValue([]);
    prisma.about.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.post.findMany.mockResolvedValue([]);
    prisma.pageContent.findUnique.mockResolvedValue({
      pageKey: 'home',
      content: { heroTitle: 'Custom Title', servicesTitle: 'Custom Services' },
    });
    prisma.siteSettings.findFirst.mockResolvedValue(null);

    const result = await getStaticProps();

    expect(result.props.homeContent.heroTitle).toBe('Custom Title');
    expect(result.props.homeContent.servicesTitle).toBe('Custom Services');
    // Default values should still be present
    expect(result.props.homeContent.typingIntro).toBe('I build...');
  });
});

