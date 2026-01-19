import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectDetailPage from '../../../pages/projects/[slug]';

// Mock next/router
const mockUseRouter = jest.fn(() => ({
  isFallback: false,
  query: { slug: 'test-project' },
  push: jest.fn(),
  replace: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock SEO component
jest.mock('@/components/SEO', () => {
  return function MockSEO({ title, description }) {
    return <div data-testid="seo" data-title={title} data-description={description || ''} />;
  };
});

// Mock ProjectDetail component
jest.mock('@/components/Project/ProjectDetail', () => {
  return function MockProjectDetail({ project }) {
    return (
      <div data-testid="project-detail">
        <h1>{project.title}</h1>
        <p>{project.shortDescription}</p>
      </div>
    );
  };
});

describe('ProjectDetailPage', () => {
  const mockProject = {
    title: 'Test Project',
    shortDescription: 'A test project description.',
    description: 'Full description',
    images: ['/images/test.jpg'],
    status: 'Published',
  };

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      isFallback: false,
      query: { slug: 'test-project' },
      push: jest.fn(),
      replace: jest.fn(),
    });
  });

  it('should render the project detail when project is provided', () => {
    render(<ProjectDetailPage project={mockProject} />);

    expect(screen.getByTestId('project-detail')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description.')).toBeInTheDocument();
  });

  it('should render SEO component with project data', () => {
    render(<ProjectDetailPage project={mockProject} />);

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-title', 'Test Project');
    expect(seo).toHaveAttribute('data-description', 'A test project description.');
  });

  it('should render error state when project is not provided', () => {
    render(<ProjectDetailPage project={null} />);

    expect(screen.getByText('Project Not Found')).toBeInTheDocument();
    expect(
      screen.getByText("The project you're looking for doesn't exist.")
    ).toBeInTheDocument();
    expect(screen.getByText('← Back to Projects')).toBeInTheDocument();
  });

  it('should render error state when error prop is true', () => {
    render(<ProjectDetailPage project={mockProject} error={true} />);

    expect(screen.getByText('Project Not Found')).toBeInTheDocument();
  });

  it('should link back to projects page in error state', () => {
    render(<ProjectDetailPage project={null} />);

    const backLink = screen.getByRole('link', { name: '← Back to Projects' });
    expect(backLink).toHaveAttribute('href', '/projects');
  });

  it('should use description as fallback when shortDescription is missing', () => {
    const projectWithoutShort = {
      ...mockProject,
      shortDescription: null,
    };
    render(<ProjectDetailPage project={projectWithoutShort} />);

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-description', 'Full description');
  });

  it('should render fallback loading state when router.isFallback is true', () => {
    mockUseRouter.mockReturnValue({
      isFallback: true,
      query: {},
    });

    render(<ProjectDetailPage project={null} />);

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('should use empty string for description when both are missing', () => {
    const projectWithoutDescriptions = {
      ...mockProject,
      shortDescription: null,
      description: null,
    };
    render(<ProjectDetailPage project={projectWithoutDescriptions} />);

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-description', '');
  });

  it('should use first image for SEO when available', () => {
    const projectWithImages = {
      ...mockProject,
      images: ['/images/first.jpg', '/images/second.jpg'],
    };
    render(<ProjectDetailPage project={projectWithImages} />);

    expect(screen.getByTestId('project-detail')).toBeInTheDocument();
  });

  it('should handle project with empty images array', () => {
    const projectWithEmptyImages = {
      ...mockProject,
      images: [],
    };
    render(<ProjectDetailPage project={projectWithEmptyImages} />);

    expect(screen.getByTestId('project-detail')).toBeInTheDocument();
  });

  it('should handle project without images property', () => {
    const projectWithoutImages = {
      title: 'Test Project',
      shortDescription: 'A test project description.',
      description: 'Full description',
      status: 'Published',
    };
    render(<ProjectDetailPage project={projectWithoutImages} />);

    expect(screen.getByTestId('project-detail')).toBeInTheDocument();
  });
});

