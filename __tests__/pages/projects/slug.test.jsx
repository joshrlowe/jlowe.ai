import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectDetailPage, { getStaticPaths, getStaticProps } from '../../../pages/projects/[slug]';
import prisma from '../../../lib/prisma';

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

describe('getStaticPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paths for all non-draft projects', async () => {
    prisma.project.findMany.mockResolvedValue([
      { slug: 'project-1', id: '1' },
      { slug: 'project-2', id: '2' },
    ]);

    const result = await getStaticPaths();

    expect(result.paths).toHaveLength(2);
    expect(result.paths[0]).toEqual({ params: { slug: 'project-1' } });
    expect(result.paths[1]).toEqual({ params: { slug: 'project-2' } });
    expect(result.fallback).toBe('blocking');
  });

  it('should use id when slug is not available', async () => {
    prisma.project.findMany.mockResolvedValue([
      { slug: null, id: 'project-id-1' },
    ]);

    const result = await getStaticPaths();

    expect(result.paths).toHaveLength(1);
    expect(result.paths[0]).toEqual({ params: { slug: 'project-id-1' } });
  });

  it('should filter out projects with no slug or id', async () => {
    prisma.project.findMany.mockResolvedValue([
      { slug: 'valid-slug', id: '1' },
      { slug: null, id: null },
    ]);

    const result = await getStaticPaths();

    expect(result.paths).toHaveLength(1);
  });

  it('should handle database errors gracefully', async () => {
    prisma.project.findMany.mockRejectedValue(new Error('Database error'));

    const result = await getStaticPaths();

    expect(result.paths).toEqual([]);
    expect(result.fallback).toBe('blocking');
  });
});

describe('getStaticProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return project when found by slug', async () => {
    const mockProject = {
      id: '1',
      title: 'Test Project',
      slug: 'test-project',
      status: 'Published',
      shortDescription: 'Test description',
      startDate: new Date('2024-01-01'),
      releaseDate: new Date('2024-06-01'),
      teamMembers: [],
    };
    prisma.project.findUnique.mockResolvedValue(mockProject);

    const result = await getStaticProps({ params: { slug: 'test-project' } });

    expect(result.props.project).toBeDefined();
    expect(result.props.project.title).toBe('Test Project');
    expect(result.revalidate).toBe(60);
  });

  it('should return notFound when slug is missing', async () => {
    const result = await getStaticProps({ params: {} });

    expect(result.notFound).toBe(true);
  });

  it('should try finding by id when slug lookup fails', async () => {
    prisma.project.findUnique
      .mockResolvedValueOnce(null) // First call with slug returns null
      .mockResolvedValueOnce({
        id: 'project-id',
        title: 'Found by ID',
        slug: null,
        status: 'Published',
        startDate: new Date('2024-01-01'),
        releaseDate: null,
        teamMembers: [],
      });

    const result = await getStaticProps({ params: { slug: 'project-id' } });

    expect(prisma.project.findUnique).toHaveBeenCalledTimes(2);
    expect(result.props.project.title).toBe('Found by ID');
  });

  it('should return notFound when project is not found', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    const result = await getStaticProps({ params: { slug: 'nonexistent' } });

    expect(result.notFound).toBe(true);
  });

  it('should return notFound when project is Draft', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: '1',
      title: 'Draft Project',
      slug: 'draft-project',
      status: 'Draft',
      teamMembers: [],
    });

    const result = await getStaticProps({ params: { slug: 'draft-project' } });

    expect(result.notFound).toBe(true);
  });

  it('should handle database errors gracefully', async () => {
    prisma.project.findUnique.mockRejectedValue(new Error('Database error'));

    const result = await getStaticProps({ params: { slug: 'test' } });

    expect(result.notFound).toBe(true);
  });
});

