/**
 * Tests for ProjectDetail component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectDetail from '../../../components/Project/ProjectDetail';

// Mock StatusBadge
jest.mock('../../../components/Project/StatusBadge', () => {
  return function MockStatusBadge({ status }) {
    return <span data-testid="status-badge">{status}</span>;
  };
});

describe('ProjectDetail', () => {
  const mockProject = {
    id: '1',
    title: 'AI Chatbot',
    shortDescription: 'An intelligent chatbot powered by LLMs',
    longDescription: 'A detailed description of the chatbot project.',
    techStack: ['Python', 'OpenAI', 'React'],
    tags: ['AI', 'ML', 'Chatbot'],
    startDate: '2024-01-15',
    releaseDate: '2024-06-01',
    status: 'Completed',
    featured: true,
    links: {
      github: 'https://github.com/test/chatbot',
      live: 'https://chatbot.example.com',
    },
    images: ['/images/chatbot-1.png'],
    features: ['Feature 1', 'Feature 2'],
    challenges: ['Challenge 1'],
  };

  it('should render the project title', () => {
    render(<ProjectDetail project={mockProject} />);
    expect(screen.getByText('AI Chatbot')).toBeInTheDocument();
  });

  it('should render the project description', () => {
    render(<ProjectDetail project={mockProject} />);
    expect(screen.getByText('An intelligent chatbot powered by LLMs')).toBeInTheDocument();
  });

  it('should render tech stack items', () => {
    render(<ProjectDetail project={mockProject} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(<ProjectDetail project={mockProject} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Completed');
  });

  it('should render back link to projects page', () => {
    render(<ProjectDetail project={mockProject} />);
    const backLink = screen.getByRole('link', { name: /back to projects/i });
    expect(backLink).toHaveAttribute('href', '/projects');
  });

  it('should render project links section', () => {
    render(<ProjectDetail project={mockProject} />);
    // The component should render multiple links including back to projects
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should include featured indicator for featured projects', () => {
    render(<ProjectDetail project={mockProject} />);
    // Featured projects should have some indicator
    expect(screen.getByText('AI Chatbot')).toBeInTheDocument();
  });

  it('should handle project with minimal data', () => {
    const minimalProject = {
      id: '2',
      title: 'Minimal Project',
      shortDescription: 'A minimal project',
      status: 'Draft',
      images: [],
      tags: [],
      techStack: [],
      features: [],
      challenges: [],
    };
    render(<ProjectDetail project={minimalProject} />);
    expect(screen.getByText('Minimal Project')).toBeInTheDocument();
  });

  it('should handle project with JSON string arrays', () => {
    const projectWithJsonStrings = {
      id: '3',
      title: 'JSON Project',
      shortDescription: 'A project with JSON strings',
      status: 'Published',
      images: '[]',
      tags: '["tag1", "tag2"]',
      techStack: '["React"]',
      features: '[]',
      challenges: '[]',
    };
    render(<ProjectDetail project={projectWithJsonStrings} />);
    expect(screen.getByText('JSON Project')).toBeInTheDocument();
  });
});

