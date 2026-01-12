/**
 * Project fixtures for testing
 * 
 * Mock project data matching the Prisma Project model schema.
 * Use these fixtures for consistent project data across tests.
 */

export const mockProject = {
  id: 'project-1',
  title: 'AI-Powered Analytics Dashboard',
  slug: 'ai-analytics-dashboard',
  description: 'A comprehensive analytics dashboard with ML-powered insights.',
  shortDescription: 'ML-powered analytics platform',
  longDescription: `
# AI Analytics Dashboard

## Overview
A comprehensive analytics dashboard built with React and Python, featuring machine learning-powered insights.

## Features
- Real-time data visualization
- Predictive analytics
- Automated reporting
- Custom dashboard widgets
  `.trim(),
  repositoryLink: 'https://github.com/joshrlowe/ai-analytics',
  startDate: '2024-01-15T00:00:00.000Z',
  releaseDate: '2024-06-01T00:00:00.000Z',
  status: 'Published',
  techStack: ['React', 'Python', 'TensorFlow', 'PostgreSQL', 'AWS'],
  tags: ['ai', 'analytics', 'machine-learning', 'dashboard'],
  links: {
    github: 'https://github.com/joshrlowe/ai-analytics',
    live: 'https://ai-analytics.jlowe.ai',
  },
  images: [
    '/images/projects/ai-analytics-1.jpg',
    '/images/projects/ai-analytics-2.jpg',
  ],
  featured: true,
  metaTitle: 'AI Analytics Dashboard | Josh Lowe',
  metaDescription: 'A comprehensive analytics dashboard with ML-powered insights.',
  ogImage: '/images/projects/ai-analytics-og.jpg',
  teamMembers: [
    { id: 'tm-1', projectId: 'project-1', name: 'Josh Lowe', email: 'josh@example.com' },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-15T00:00:00.000Z',
};

export const mockProjects = [
  mockProject,
  {
    id: 'project-2',
    title: 'LLM Document Processor',
    slug: 'llm-document-processor',
    description: 'Automated document processing using large language models.',
    shortDescription: 'LLM-powered document automation',
    longDescription: '# LLM Document Processor\n\nAutomated document analysis and processing.',
    repositoryLink: 'https://github.com/joshrlowe/llm-docs',
    startDate: '2024-03-01T00:00:00.000Z',
    releaseDate: null,
    status: 'InProgress',
    techStack: ['Python', 'OpenAI', 'LangChain', 'FastAPI'],
    tags: ['llm', 'nlp', 'automation'],
    links: {
      github: 'https://github.com/joshrlowe/llm-docs',
    },
    images: [],
    featured: true,
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    teamMembers: [],
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-06-10T00:00:00.000Z',
  },
  {
    id: 'project-3',
    title: 'Portfolio Website',
    slug: 'portfolio-website',
    description: 'Personal portfolio built with Next.js and Three.js.',
    shortDescription: 'Modern portfolio with 3D effects',
    longDescription: '# Portfolio Website\n\nA modern portfolio with 3D backgrounds.',
    repositoryLink: 'https://github.com/joshrlowe/portfolio',
    startDate: '2024-05-01T00:00:00.000Z',
    releaseDate: '2024-06-01T00:00:00.000Z',
    status: 'Completed',
    techStack: ['Next.js', 'React', 'Three.js', 'Tailwind CSS'],
    tags: ['portfolio', 'frontend', '3d'],
    links: {
      github: 'https://github.com/joshrlowe/portfolio',
      live: 'https://jlowe.ai',
    },
    images: ['/images/projects/portfolio.jpg'],
    featured: false,
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    teamMembers: [],
    createdAt: '2024-05-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'project-4',
    title: 'Draft Project',
    slug: 'draft-project',
    description: 'A project still in draft status.',
    shortDescription: 'Work in progress',
    longDescription: '# Draft Project\n\nThis is a draft.',
    repositoryLink: null,
    startDate: '2024-06-01T00:00:00.000Z',
    releaseDate: null,
    status: 'Draft',
    techStack: [],
    tags: [],
    links: {},
    images: [],
    featured: false,
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    teamMembers: [],
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
];

// Filtered collections for common test scenarios
export const mockFeaturedProjects = mockProjects.filter((p) => p.featured);
export const mockPublishedProjects = mockProjects.filter((p) => p.status === 'Published');
export const mockDraftProjects = mockProjects.filter((p) => p.status === 'Draft');
export const mockInProgressProjects = mockProjects.filter((p) => p.status === 'InProgress');

/**
 * Factory function to create custom project data
 */
export const createMockProject = (overrides = {}) => ({
  ...mockProject,
  id: `project-${Date.now()}`,
  slug: `project-${Date.now()}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Creates a list of mock projects
 */
export const createMockProjects = (count, overrides = {}) => 
  Array.from({ length: count }, (_, i) => 
    createMockProject({
      id: `project-${i + 1}`,
      slug: `project-${i + 1}`,
      title: `Project ${i + 1}`,
      ...overrides,
    })
  );
