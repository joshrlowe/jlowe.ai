/**
 * Tests for Project component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Project from '../../../components/Project/Project';

// Mock child components
jest.mock('../../../components/Project/ProjectHeader', () => {
  return function MockProjectHeader({ title, repositoryLink }) {
    return (
      <div data-testid="project-header">
        <span data-testid="project-title">{title}</span>
        {repositoryLink && <a data-testid="repo-link" href={repositoryLink}>Repo</a>}
      </div>
    );
  };
});

jest.mock('../../../components/Project/ProjectDescription', () => {
  return function MockProjectDescription({ description }) {
    return <div data-testid="project-description">{description}</div>;
  };
});

jest.mock('../../../components/Project/ProjectTechStack', () => {
  return function MockProjectTechStack({ techStack }) {
    return (
      <div data-testid="project-techstack">
        {techStack?.map((tech, i) => <span key={i}>{tech}</span>)}
      </div>
    );
  };
});

jest.mock('../../../components/Project/ProjectTimeline', () => {
  return function MockProjectTimeline({ startDate, releaseDate, status }) {
    return (
      <div data-testid="project-timeline">
        <span data-testid="start-date">{startDate}</span>
        <span data-testid="release-date">{releaseDate}</span>
        <span data-testid="status">{status}</span>
      </div>
    );
  };
});

jest.mock('../../../components/Project/ProjectTeam', () => {
  return function MockProjectTeam({ team }) {
    return (
      <div data-testid="project-team">
        {team?.length || 0} members
      </div>
    );
  };
});

// Mock styles
jest.mock('@/styles/ProjectsPage.module.css', () => ({
  lightGrayBg: 'mock-light-gray-bg',
}));

describe('Project', () => {
  const mockProject = {
    id: '1',
    title: 'Test Project',
    description: 'A test project description',
    repositoryLink: 'https://github.com/test/project',
    techStack: ['React', 'Node.js', 'PostgreSQL'],
    startDate: '2024-01-01',
    releaseDate: '2024-06-01',
    status: 'Completed',
    team: [{ id: '1', name: 'Josh' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the project container', () => {
      const { container } = render(<Project project={mockProject} fadeIn={true} />);
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    it('should render project header with title', () => {
      render(<Project project={mockProject} fadeIn={true} />);
      expect(screen.getByTestId('project-header')).toBeInTheDocument();
      expect(screen.getByTestId('project-title')).toHaveTextContent('Test Project');
    });

    it('should render project description', () => {
      render(<Project project={mockProject} fadeIn={true} />);
      expect(screen.getByTestId('project-description')).toHaveTextContent('A test project description');
    });

    it('should render tech stack', () => {
      render(<Project project={mockProject} fadeIn={true} />);
      expect(screen.getByTestId('project-techstack')).toBeInTheDocument();
    });

    it('should render timeline', () => {
      render(<Project project={mockProject} fadeIn={true} />);
      expect(screen.getByTestId('project-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('status')).toHaveTextContent('Completed');
    });

    it('should render team section', () => {
      render(<Project project={mockProject} fadeIn={true} />);
      expect(screen.getByTestId('project-team')).toBeInTheDocument();
      expect(screen.getByTestId('project-team')).toHaveTextContent('1 members');
    });

    it('should render horizontal rules between sections', () => {
      const { container } = render(<Project project={mockProject} fadeIn={true} />);
      const hrElements = container.querySelectorAll('hr');
      expect(hrElements.length).toBe(4);
    });
  });

  describe('Props handling', () => {
    it('should handle project without repository link', () => {
      const projectWithoutRepo = { ...mockProject, repositoryLink: null };
      render(<Project project={projectWithoutRepo} fadeIn={true} />);
      expect(screen.queryByTestId('repo-link')).not.toBeInTheDocument();
    });

    it('should handle project with empty tech stack', () => {
      const projectWithNoTech = { ...mockProject, techStack: [] };
      render(<Project project={projectWithNoTech} fadeIn={true} />);
      expect(screen.getByTestId('project-techstack')).toBeInTheDocument();
    });

    it('should handle project with no team', () => {
      const projectWithNoTeam = { ...mockProject, team: [] };
      render(<Project project={projectWithNoTeam} fadeIn={true} />);
      expect(screen.getByTestId('project-team')).toHaveTextContent('0 members');
    });

    it('should handle project with null team', () => {
      const projectWithNullTeam = { ...mockProject, team: null };
      render(<Project project={projectWithNullTeam} fadeIn={true} />);
      expect(screen.getByTestId('project-team')).toHaveTextContent('0 members');
    });
  });

  describe('Animation states', () => {
    it('should render with fadeIn true', () => {
      const { container } = render(<Project project={mockProject} fadeIn={true} />);
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    it('should render with fadeIn false', () => {
      const { container } = render(<Project project={mockProject} fadeIn={false} />);
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    it('should have willChange style for animation optimization', () => {
      const { container } = render(<Project project={mockProject} fadeIn={true} />);
      const card = container.querySelector('.card');
      expect(card).toHaveStyle({ willChange: 'opacity, transform' });
    });
  });
});

