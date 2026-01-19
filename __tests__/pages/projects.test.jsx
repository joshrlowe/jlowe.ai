/**
 * Tests for pages/projects.jsx
 *
 * Tests projects page with filtering, sorting, and infinite scroll
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsPage from '../../pages/projects';

// Mock router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: {},
  }),
}));

// gsap is mocked globally via jest.config.js moduleNameMapper

// Mock SEO
jest.mock('@/components/SEO', () => {
  return function SEO({ title }) {
    return <div data-testid="seo" data-title={title} />;
  };
});

// Mock ProjectCard
jest.mock('@/components/Project/ProjectCard', () => {
  return function ProjectCard({ project, index }) {
    return (
      <div data-testid={`project-card-${project.id}`} data-index={index}>
        <span>{project.title}</span>
      </div>
    );
  };
});

// Mock ProjectFilters
jest.mock('@/components/Project/ProjectFilters', () => {
  return function ProjectFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    tagFilter,
    onTagFilterChange,
    availableTags,
    availableStatuses,
    onClearFilters,
  }) {
    return (
      <div data-testid="project-filters">
        <input
          data-testid="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
        />
        <select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="all">All</option>
          {availableStatuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          data-testid="tag-filter"
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
        >
          <option value="all">All</option>
          {availableTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button data-testid="clear-filters" onClick={onClearFilters}>
          Clear
        </button>
      </div>
    );
  };
});

// Mock ProjectsEmptyState
jest.mock('@/components/Project/ProjectsEmptyState', () => {
  return function ProjectsEmptyState({ hasFilters, onClearFilters }) {
    return (
      <div data-testid="empty-state">
        <span>No projects found</span>
        {hasFilters && (
          <button data-testid="clear-empty" onClick={onClearFilters}>
            Clear Filters
          </button>
        )}
      </div>
    );
  };
});

// Mock constants
jest.mock('@/lib/utils/constants', () => ({
  DEBOUNCE_DELAY_MS: 0,
  INITIAL_PROJECT_DISPLAY_COUNT: 6,
  PROJECTS_PER_PAGE: 6,
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
window.IntersectionObserver = mockIntersectionObserver;

describe('ProjectsPage', () => {
  const mockProjects = [
    {
      id: '1',
      title: 'AI Chatbot',
      shortDescription: 'Intelligent chatbot',
      status: 'Published',
      tags: ['AI', 'Python'],
      startDate: '2024-01-01',
    },
    {
      id: '2',
      title: 'Web Dashboard',
      shortDescription: 'Analytics dashboard',
      status: 'Completed',
      tags: ['React', 'TypeScript'],
      startDate: '2023-06-01',
    },
    {
      id: '3',
      title: 'ML Pipeline',
      shortDescription: 'Data pipeline',
      status: 'Published',
      tags: ['Python', 'AWS'],
      startDate: '2023-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock matchMedia
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
    it('should render page title', () => {
      render(<ProjectsPage projects={mockProjects} />);
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render SEO component', () => {
      render(<ProjectsPage projects={mockProjects} />);
      expect(screen.getByTestId('seo')).toBeInTheDocument();
    });

    it('should render project filters', () => {
      render(<ProjectsPage projects={mockProjects} />);
      expect(screen.getByTestId('project-filters')).toBeInTheDocument();
    });

    it('should render project cards', () => {
      render(<ProjectsPage projects={mockProjects} />);
      expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('project-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('project-card-3')).toBeInTheDocument();
    });

    it('should show project count', () => {
      render(<ProjectsPage projects={mockProjects} />);
      // Check for "projects found" text which indicates the count is displayed
      expect(screen.getByText(/projects found/)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by search query', async () => {
      render(<ProjectsPage projects={mockProjects} />);

      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'chatbot' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
        expect(screen.queryByTestId('project-card-2')).not.toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      render(<ProjectsPage projects={mockProjects} />);

      fireEvent.change(screen.getByTestId('status-filter'), {
        target: { value: 'Completed' },
      });

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('project-card-2')).toBeInTheDocument();
      });
    });

    it('should filter by tag', async () => {
      render(<ProjectsPage projects={mockProjects} />);

      fireEvent.change(screen.getByTestId('tag-filter'), {
        target: { value: 'React' },
      });

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('project-card-2')).toBeInTheDocument();
      });
    });

    it('should clear filters when clear button clicked', async () => {
      render(<ProjectsPage projects={mockProjects} />);

      // Apply a filter
      fireEvent.change(screen.getByTestId('status-filter'), {
        target: { value: 'Completed' },
      });

      await waitFor(() => {
        expect(screen.queryByTestId('project-card-1')).not.toBeInTheDocument();
      });

      // Clear filters
      fireEvent.click(screen.getByTestId('clear-filters'));

      await waitFor(() => {
        expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
      });

      expect(mockPush).toHaveBeenCalledWith('/projects', undefined, { shallow: true });
    });
  });

  describe('Sorting', () => {
    it('should render sort dropdowns', () => {
      render(<ProjectsPage projects={mockProjects} />);

      expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort order')).toBeInTheDocument();
    });

    it('should sort by title', async () => {
      render(<ProjectsPage projects={mockProjects} />);

      fireEvent.change(screen.getByLabelText('Sort by'), {
        target: { value: 'title' },
      });

      fireEvent.change(screen.getByLabelText('Sort order'), {
        target: { value: 'asc' },
      });

      await waitFor(() => {
        const cards = screen.getAllByTestId(/project-card-/);
        // AI Chatbot should come first alphabetically
        expect(cards[0]).toHaveAttribute('data-testid', 'project-card-1');
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no projects', () => {
      render(<ProjectsPage projects={[]} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show empty state when filters return no results', async () => {
      render(<ProjectsPage projects={mockProjects} />);

      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'nonexistent' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null projects', () => {
      render(<ProjectsPage projects={null} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should handle undefined projects', () => {
      render(<ProjectsPage projects={undefined} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should handle projects with string tags', async () => {
      const projectsWithStringTags = [
        {
          id: '1',
          title: 'Test Project',
          tags: '["AI", "ML"]', // JSON string instead of array
          status: 'Published',
          startDate: '2024-01-01',
        },
      ];

      render(<ProjectsPage projects={projectsWithStringTags} />);
      expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
    });
  });
});

