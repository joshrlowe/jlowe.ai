/**
 * Tests for ProjectsSettingsSection admin component
 *
 * Tests project management with CRUD operations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsSettingsSection from '../../../components/admin/ProjectsSettingsSection';

// Mock ToastProvider
const mockShowToast = jest.fn();
jest.mock('../../../components/admin/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock shared components
jest.mock('../../../components/admin/shared', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  Modal: ({ isOpen, onClose, title, children }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <button data-testid="close-modal" onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
  adminStyles: {
    inputSmall: 'input-small',
    buttonPrimary: 'btn-primary',
  },
  PROJECT_STATUSES: [
    { value: 'Draft', label: 'Draft' },
    { value: 'Published', label: 'Published' },
    { value: 'Completed', label: 'Completed' },
  ],
}));

// Mock projects components
jest.mock('../../../components/admin/projects', () => ({
  ProjectForm: ({ formData, setFormData, saving, onSave, onCancel }) => (
    <form data-testid="project-form" onSubmit={onSave}>
      <input
        data-testid="project-title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <input
        data-testid="project-slug"
        value={formData.slug}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
      />
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  ),
  ProjectListItem: ({ project, onEdit, onDelete, onStatusChange }) => (
    <div data-testid={`project-${project.id}`}>
      <span>{project.title}</span>
      <button data-testid={`edit-${project.id}`} onClick={() => onEdit(project)}>
        Edit
      </button>
      <button data-testid={`delete-${project.id}`} onClick={() => onDelete(project.id)}>
        Delete
      </button>
      <select
        data-testid={`status-${project.id}`}
        value={project.status}
        onChange={(e) => onStatusChange(project.id, e.target.value)}
      >
        <option value="Draft">Draft</option>
        <option value="Published">Published</option>
      </select>
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock confirm
global.confirm = jest.fn(() => true);

describe('ProjectsSettingsSection', () => {
  const mockOnError = jest.fn();
  const mockProjects = [
    {
      id: 'proj-1',
      title: 'AI Project',
      shortDescription: 'An AI project',
      status: 'Published',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: 'proj-2',
      title: 'Web Dashboard',
      shortDescription: 'A web project',
      status: 'Draft',
      updatedAt: '2024-01-10T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockImplementation((url) => {
      if (url === '/api/admin/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
      if (url.includes('/api/admin/projects/')) {
        const id = url.split('/').pop();
        const project = mockProjects.find((p) => p.id === id);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project || {}),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while fetching', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));
      render(<ProjectsSettingsSection onError={mockOnError} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Project list', () => {
    it('should render projects after loading', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('project-proj-1')).toBeInTheDocument();
        expect(screen.getByTestId('project-proj-2')).toBeInTheDocument();
      });
    });

    it('should show empty state when no projects', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('No projects found.')).toBeInTheDocument();
      });
    });
  });

  describe('Search and filter', () => {
    it('should filter projects by search query', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('project-proj-1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'AI' } });

      await waitFor(() => {
        expect(screen.getByTestId('project-proj-1')).toBeInTheDocument();
        expect(screen.queryByTestId('project-proj-2')).not.toBeInTheDocument();
      });
    });

    it('should filter projects by status', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('project-proj-1')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'Draft' } });

      await waitFor(() => {
        expect(screen.queryByTestId('project-proj-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('project-proj-2')).toBeInTheDocument();
      });
    });
  });

  describe('Create project', () => {
    it('should open modal when Create Project clicked', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Create Project')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Project'));

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should show validation error for missing title', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Create Project')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Project'));

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      fireEvent.submit(screen.getByTestId('project-form'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Title and slug are required', 'error');
      });
    });
  });

  describe('Edit project', () => {
    it('should open modal with project data when Edit clicked', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-proj-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('edit-proj-1'));

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Edit Project' })).toBeInTheDocument();
      });
    });
  });

  describe('Delete project', () => {
    it('should delete project when confirmed', async () => {
      global.confirm.mockReturnValue(true);

      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-proj-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('delete-proj-1'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/projects/proj-1', {
          method: 'DELETE',
        });
      });
    });

    it('should not delete when cancelled', async () => {
      global.confirm.mockReturnValue(false);
      const fetchCalls = global.fetch.mock.calls.length;

      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-proj-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('delete-proj-1'));

      // Should not make additional fetch calls for deletion
      expect(global.fetch.mock.calls.filter((call) =>
        call[1]?.method === 'DELETE'
      ).length).toBe(0);
    });
  });

  describe('Status change', () => {
    it('should update project status', async () => {
      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByTestId('status-proj-1')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('status-proj-1'), {
        target: { value: 'Draft' },
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/projects/proj-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Draft' }),
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should show error toast when fetch fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ProjectsSettingsSection onError={mockOnError} />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load projects', 'error');
      });
    });
  });
});

