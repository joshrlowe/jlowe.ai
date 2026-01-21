/**
 * Tests for ProjectListItem component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectListItem from '../../../../components/admin/projects/ProjectListItem';

describe('ProjectListItem', () => {
  const mockProject = {
    id: '1',
    title: 'AI Chatbot',
    slug: 'ai-chatbot',
    status: 'Published',
    startDate: '2024-01-15T10:00:00Z',
    releaseDate: '2024-06-01T15:30:00Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnStatusChange = jest.fn();

  const defaultProps = {
    project: mockProject,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onStatusChange: mockOnStatusChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the project title', () => {
      render(<ProjectListItem {...defaultProps} />);
      expect(screen.getByText('AI Chatbot')).toBeInTheDocument();
    });

    it('should render the status select', () => {
      render(<ProjectListItem {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render edit button', () => {
      render(<ProjectListItem {...defaultProps} />);
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should render delete button', () => {
      render(<ProjectListItem {...defaultProps} />);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should display formatted start date', () => {
      render(<ProjectListItem {...defaultProps} />);
      // The date formatting will vary by locale, just check it's not empty
      const dateText = screen.getByText(/2024|1\/15/);
      expect(dateText).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectListItem {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectListItem {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockProject.id);
    });

    it('should call onStatusChange when status is changed', async () => {
      const user = userEvent.setup();
      render(<ProjectListItem {...defaultProps} />);

      const statusSelect = screen.getByRole('combobox');
      await user.selectOptions(statusSelect, 'Completed');

      expect(mockOnStatusChange).toHaveBeenCalledWith(mockProject.id, 'Completed');
    });
  });

  describe('Edge cases', () => {
    it('should handle null startDate', () => {
      const project = { ...mockProject, startDate: null };
      render(<ProjectListItem {...defaultProps} project={project} />);
      // When startDate is null, should show em-dash
      expect(screen.getByText(/—/)).toBeInTheDocument();
    });

    it('should handle null releaseDate', () => {
      const project = { ...mockProject, releaseDate: null };
      render(<ProjectListItem {...defaultProps} project={project} />);
      // When releaseDate is null, should show "Present"
      expect(screen.getByText(/Present/)).toBeInTheDocument();
    });

    it('should default status to Draft when not provided', () => {
      const project = { ...mockProject, status: null };
      render(<ProjectListItem {...defaultProps} project={project} />);
      expect(screen.getByRole('combobox')).toHaveValue('Draft');
    });
  });
});

